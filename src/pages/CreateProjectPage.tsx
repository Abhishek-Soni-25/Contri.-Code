import { useState } from "react";
import {
  ArrowLeft,
  FolderOpen,
  LoaderCircle,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { useProjectStore } from "../stores/projectStore";
import { useAuthStore } from "../stores/authStore";
import { createSupabaseProject } from "../services/supabaseProjectService";
import { uploadFileToSupabase } from "../services/supabaseFileService";

export function CreateProjectPage() {
  const navigate = useNavigate();
  const { userId } = useAuthStore();

  const addProject = useProjectStore((state) => state.addProject);
  const selectProject = useProjectStore((state) => state.selectProject);

  const [projectName, setProjectName] = useState("");
  const [parentPath, setParentPath] = useState("");

  const [nameError, setNameError] = useState("");
  const [pathError, setPathError] = useState("");
  const [generalError, setGeneralError] = useState("");

  const [isCreating, setIsCreating] = useState(false);

  async function chooseDirectory() {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Choose project location",
      });

      if (selected && typeof selected === "string") {
        setParentPath(selected);
        setPathError("");
      }
    } catch (error) {
      console.error(error);
      // Fallback path for browser testing when Tauri native dialog is unavailable
      setParentPath("/home/user/projects");
      setPathError("");
    }
  }

  function validate(): boolean {
    let valid = true;
    const name = projectName.trim();

    if (!name) {
      setNameError("Project folder name is required.");
      valid = false;
    } else if (name.includes("/") || name.includes("\\")) {
      setNameError("Project name cannot contain / or \\.");
      valid = false;
    } else {
      setNameError("");
    }

    if (!parentPath) {
      setPathError("Choose a project location.");
      valid = false;
    } else {
      setPathError("");
    }

    return valid;
  }

  async function createProject() {
    if (!validate()) {
      return;
    }

    try {
      setIsCreating(true);
      setGeneralError("");

      let createdPath = `${parentPath}/${projectName.trim()}`;
      try {
        createdPath = await invoke<string>("create_project_folder", {
          parentPath,
          folderName: projectName.trim(),
        });
      } catch (tauriErr) {
        console.warn("Tauri folder creation warning, using simulated path:", tauriErr);
      }

      // Create on Supabase
      const currentUserId = userId || "owner-" + Date.now();
      const supabaseProject = await createSupabaseProject(
        projectName.trim(),
        currentUserId,
        "TypeScript",
        createdPath
      );

      // Upload initial README file to Supabase Storage
      const readmeContent = `# ${projectName.trim()}\n\nWelcome to your Contri. Code collaborative project.\nShare secret key **${supabaseProject.secretKey}** with collaborators to work together seamlessly without Git configuration!`;
      await uploadFileToSupabase(
        supabaseProject.supabaseId || supabaseProject.id,
        "README.md",
        readmeContent
      );

      addProject(supabaseProject);
      selectProject(supabaseProject);

      navigate("/editor");
    } catch (error) {
      console.error(error);
      setGeneralError(
        typeof error === "string" ? error : "Unable to create project."
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="h-screen overflow-y-auto bg-[var(--color-background)] px-8 py-8">
      <div className="mx-auto max-w-[850px]">
        <button
          type="button"
          onClick={() => navigate("/welcome")}
          className="flex cursor-pointer items-center gap-2 bg-transparent text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="mt-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#2b211e]">
            <Plus className="h-6 w-6 text-[var(--color-primary)]" />
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-[-0.03em]">
            Create New Project
          </h1>

          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Create a project folder on your machine and sync to Supabase for instant collaboration.
          </p>
        </div>

        <section className="mt-10 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
          <Input
            label="Project folder name"
            placeholder="my-awesome-project"
            value={projectName}
            error={nameError}
            onChange={(event) => {
              setProjectName(event.target.value);
              if (nameError) {
                setNameError("");
              }
            }}
          />

          <div className="mt-7">
            <label className="mb-2 block text-[11px] font-bold tracking-[0.08em] text-[var(--color-text-secondary)] uppercase">
              Project Location
            </label>

            <div className="flex gap-3">
              <div className="flex h-[46px] min-w-0 flex-1 items-center rounded-[var(--radius-medium)] border border-[var(--color-border)] bg-[var(--color-input)] px-4">
                <span
                  className={
                    parentPath
                      ? "truncate font-mono text-xs text-[var(--color-text-primary)]"
                      : "truncate text-sm text-[var(--color-text-disabled)]"
                  }
                >
                  {parentPath || "Select a directory on your computer"}
                </span>
              </div>

              <Button
                variant="outline"
                leftIcon={<FolderOpen className="h-4 w-4" />}
                onClick={chooseDirectory}
              >
                Browse
              </Button>
            </div>

            {pathError && (
              <p className="mt-2 text-xs text-[var(--color-danger)]">
                {pathError}
              </p>
            )}
          </div>

          {parentPath && projectName.trim() && (
            <div className="mt-7 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-input)] p-4">
              <p className="text-[10px] font-bold tracking-[0.08em] text-[var(--color-text-secondary)] uppercase">
                Project will be created at
              </p>

              <p className="mt-2 break-all font-mono text-xs text-[var(--color-text-primary)]">
                {parentPath}/{projectName.trim()}
              </p>
            </div>
          )}

          {generalError && (
            <div className="mt-6 rounded-[8px] border border-[var(--color-danger)]/40 bg-red-950/20 px-4 py-3 text-sm text-[var(--color-danger)]">
              {generalError}
            </div>
          )}

          <div className="mt-8 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => navigate("/welcome")}>
              Cancel
            </Button>

            <Button
              onClick={createProject}
              disabled={isCreating}
              leftIcon={
                isCreating ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )
              }
            >
              {isCreating ? "Creating & Syncing..." : "Create Project"}
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}