import { invoke } from "@tauri-apps/api/core";
import type { FileNode } from "../types/file";

export async function getProjectTree(
  rootPath: string,
): Promise<FileNode[]> {
  return invoke<FileNode[]>("list_project_tree", {
    rootPath,
  });
}

export async function readProjectFile(
  rootPath: string,
  targetPath: string,
): Promise<string> {
  return invoke<string>("read_project_file", {
    rootPath,
    targetPath,
  });
}

export async function writeProjectFile(
  rootPath: string,
  targetPath: string,
  content: string,
): Promise<void> {
  return invoke("write_project_file", {
    rootPath,
    targetPath,
    content,
  });
}

export async function createProjectFile(
  rootPath: string,
  parentPath: string,
  name: string,
): Promise<string> {
  return invoke<string>("create_project_file", {
    rootPath,
    parentPath,
    name,
  });
}

export async function createProjectFolder(
  rootPath: string,
  parentPath: string,
  name: string,
): Promise<string> {
  return invoke<string>("create_project_subfolder", {
    rootPath,
    parentPath,
    name,
  });
}