import { invoke } from "@tauri-apps/api/core";

export interface RecentProject {
  name: string;
  path: string;
  technology: string;
  lastOpened: string;
}

export async function getRecentProjects(): Promise<RecentProject[]> {
  return invoke<RecentProject[]>("get_recent_projects");
}

export async function recordRecentProject(
  project: RecentProject,
): Promise<void> {
  await invoke("record_recent_project", {
    name: project.name,
    path: project.path,
    technology: project.technology,
    lastOpened: project.lastOpened,
  });
}