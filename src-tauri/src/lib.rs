use serde::{Deserialize, Serialize};
use std::fs;
use std::fs::File;
use std::path::{Path, PathBuf};
use tauri::Manager;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct FileNode {
    name: String,
    path: String,
    is_dir: bool,
    children: Vec<FileNode>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RecentProject {
    name: String,
    path: String,
    technology: String,
    last_opened: String,
}

// ---------------------------------------------------------
// VALIDATION
// ---------------------------------------------------------

fn validate_name(name: &str) -> Result<(), String> {
    let clean_name = name.trim();

    if clean_name.is_empty() {
        return Err("Name cannot be empty.".into());
    }

    if clean_name.contains('/')
        || clean_name.contains('\\')
        || clean_name == "."
        || clean_name == ".."
    {
        return Err(
            "Name contains invalid characters.".into()
        );
    }

    Ok(())
}

fn canonical_project_root(
    root_path: &str,
) -> Result<PathBuf, String> {
    fs::canonicalize(root_path)
        .map_err(|_| "Project directory does not exist.".into())
}

fn ensure_existing_path_inside_project(
    root_path: &str,
    target_path: &str,
) -> Result<PathBuf, String> {
    let root = canonical_project_root(root_path)?;

    let target = fs::canonicalize(target_path)
        .map_err(|_| "Target path does not exist.".to_string())?;

    if !target.starts_with(&root) {
        return Err(
            "Access outside the project directory is not allowed."
                .into(),
        );
    }

    Ok(target)
}

// ---------------------------------------------------------
// CREATE PROJECT
// ---------------------------------------------------------

#[tauri::command]
fn create_project_folder(
    parent_path: String,
    folder_name: String,
) -> Result<String, String> {
    validate_name(&folder_name)?;

    let parent = PathBuf::from(&parent_path);

    if !parent.exists() {
        return Err(
            "Selected parent directory does not exist."
                .into(),
        );
    }

    if !parent.is_dir() {
        return Err(
            "Selected location is not a directory.".into(),
        );
    }

    let project_path =
        parent.join(folder_name.trim());

    if project_path.exists() {
        return Err(
            "A project with this name already exists."
                .into(),
        );
    }

    fs::create_dir_all(&project_path)
        .map_err(|error| {
            format!(
                "Unable to create project: {}",
                error
            )
        })?;

    Ok(
        project_path
            .to_string_lossy()
            .to_string(),
    )
}

// ---------------------------------------------------------
// FILE TREE
// ---------------------------------------------------------

fn should_ignore(name: &str) -> bool {
    matches!(
        name,
        ".git"
            | "node_modules"
            | "target"
            | "dist"
            | ".next"
            | "__pycache__"
    )
}

fn build_directory_tree(
    directory: &Path,
) -> Result<Vec<FileNode>, String> {
    let entries = fs::read_dir(directory)
        .map_err(|error| error.to_string())?;

    let mut nodes: Vec<FileNode> = Vec::new();

    for entry_result in entries {
        let entry = match entry_result {
            Ok(value) => value,
            Err(_) => continue,
        };

        let path = entry.path();

        let name = entry
            .file_name()
            .to_string_lossy()
            .to_string();

        if should_ignore(&name) {
            continue;
        }

        let file_type = match entry.file_type() {
            Ok(value) => value,
            Err(_) => continue,
        };

        // Ignore symbolic links for now.
        if file_type.is_symlink() {
            continue;
        }

        if file_type.is_dir() {
            let children =
                build_directory_tree(&path)
                    .unwrap_or_default();

            nodes.push(FileNode {
                name,
                path: path
                    .to_string_lossy()
                    .to_string(),
                is_dir: true,
                children,
            });
        } else {
            nodes.push(FileNode {
                name,
                path: path
                    .to_string_lossy()
                    .to_string(),
                is_dir: false,
                children: Vec::new(),
            });
        }
    }

    // Folders first, files second.
    nodes.sort_by(|a, b| {
        match (a.is_dir, b.is_dir) {
            (true, false) => {
                std::cmp::Ordering::Less
            }

            (false, true) => {
                std::cmp::Ordering::Greater
            }

            _ => a
                .name
                .to_lowercase()
                .cmp(&b.name.to_lowercase()),
        }
    });

    Ok(nodes)
}

#[tauri::command]
fn list_project_tree(
    root_path: String,
) -> Result<Vec<FileNode>, String> {
    let root =
        canonical_project_root(&root_path)?;

    build_directory_tree(&root)
}

// ---------------------------------------------------------
// READ FILE
// ---------------------------------------------------------

#[tauri::command]
fn read_project_file(
    root_path: String,
    target_path: String,
) -> Result<String, String> {
    let target =
        ensure_existing_path_inside_project(
            &root_path,
            &target_path,
        )?;

    if !target.is_file() {
        return Err(
            "Selected path is not a file.".into(),
        );
    }

    fs::read_to_string(target).map_err(|_| {
        "This file cannot be opened as text.".into()
    })
}

// ---------------------------------------------------------
// WRITE FILE
// ---------------------------------------------------------

#[tauri::command]
fn write_project_file(
    root_path: String,
    target_path: String,
    content: String,
) -> Result<(), String> {
    let target =
        ensure_existing_path_inside_project(
            &root_path,
            &target_path,
        )?;

    if !target.is_file() {
        return Err(
            "Selected path is not a file.".into(),
        );
    }

    fs::write(target, content)
        .map_err(|error| {
            format!(
                "Unable to save file: {}",
                error
            )
        })
}

// ---------------------------------------------------------
// CREATE FILE
// ---------------------------------------------------------

#[tauri::command]
fn create_project_file(
    root_path: String,
    parent_path: String,
    name: String,
) -> Result<String, String> {
    validate_name(&name)?;

    let parent =
        ensure_existing_path_inside_project(
            &root_path,
            &parent_path,
        )?;

    if !parent.is_dir() {
        return Err(
            "Parent path is not a directory.".into(),
        );
    }

    let file_path = parent.join(name.trim());

    if file_path.exists() {
        return Err(
            "A file or folder with this name already exists."
                .into(),
        );
    }

    File::create(&file_path)
        .map_err(|error| {
            format!(
                "Unable to create file: {}",
                error
            )
        })?;

    Ok(
        file_path
            .to_string_lossy()
            .to_string(),
    )
}

// ---------------------------------------------------------
// CREATE FOLDER
// ---------------------------------------------------------

#[tauri::command]
fn create_project_subfolder(
    root_path: String,
    parent_path: String,
    name: String,
) -> Result<String, String> {
    validate_name(&name)?;

    let parent =
        ensure_existing_path_inside_project(
            &root_path,
            &parent_path,
        )?;

    if !parent.is_dir() {
        return Err(
            "Parent path is not a directory.".into(),
        );
    }

    let folder_path =
        parent.join(name.trim());

    if folder_path.exists() {
        return Err(
            "A file or folder with this name already exists."
                .into(),
        );
    }

    fs::create_dir(&folder_path)
        .map_err(|error| {
            format!(
                "Unable to create folder: {}",
                error
            )
        })?;

    Ok(
        folder_path
            .to_string_lossy()
            .to_string(),
    )
}

// =========================================================
// RECENT PROJECTS
// =========================================================

fn recent_projects_file(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| "Unable to determine application data directory.".to_string())?;

    fs::create_dir_all(&app_data_dir)
        .map_err(|_| "Unable to create application data directory.".to_string())?;

    Ok(app_data_dir.join("recent_projects.json"))
}

fn read_recent_projects_file(
    app: &tauri::AppHandle,
) -> Result<Vec<RecentProject>, String> {
    let file_path = recent_projects_file(app)?;

    if !file_path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(&file_path)
        .map_err(|_| "Unable to read recent projects.".to_string())?;

    if content.trim().is_empty() {
        return Ok(Vec::new());
    }

    serde_json::from_str::<Vec<RecentProject>>(&content)
        .map_err(|_| "Recent projects file contains invalid data.".to_string())
}

fn write_recent_projects_file(
    app: &tauri::AppHandle,
    projects: &[RecentProject],
) -> Result<(), String> {
    let file_path = recent_projects_file(app)?;

    let content = serde_json::to_string_pretty(projects)
        .map_err(|_| "Unable to serialize recent projects.".to_string())?;

    fs::write(&file_path, content)
        .map_err(|_| "Unable to save recent projects.".to_string())
}

#[tauri::command]
fn get_recent_projects(
    app: tauri::AppHandle,
) -> Result<Vec<RecentProject>, String> {
    read_recent_projects_file(&app)
}

#[tauri::command]
fn record_recent_project(
    app: tauri::AppHandle,
    name: String,
    path: String,
    technology: String,
    last_opened: String,
) -> Result<(), String> {
    let mut projects = read_recent_projects_file(&app)?;

    // Remove an existing entry for the same project path.
    projects.retain(|project| project.path != path);

    // Add the newly opened project at the beginning.
    projects.insert(
        0,
        RecentProject {
            name,
            path,
            technology,
            last_opened,
        },
    );

    // Keep the local history reasonably small.
    projects.truncate(20);

    write_recent_projects_file(&app, &projects)
}

// ---------------------------------------------------------
// RUN APPLICATION
// ---------------------------------------------------------

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_opener::init(),
        )
        .plugin(
            tauri_plugin_dialog::init(),
        )
        .plugin(
            tauri_plugin_fs::init(),
        )
        .invoke_handler(tauri::generate_handler![
            create_project_folder,
            list_project_tree,
            read_project_file,
            write_project_file,
            create_project_file,
            create_project_subfolder,
            get_recent_projects,
            record_recent_project,
        ])
        .run(
            tauri::generate_context!(),
        )
        .expect(
            "error while running tauri application",
        );
}