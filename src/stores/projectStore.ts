import { create } from "zustand";
import type { Project } from "../types/project";
import { fetchUserProjects } from "../services/supabaseProjectService";

interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  isLoadingProjects: boolean;

  loadProjects: (userId: string) => Promise<void>;
  selectProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
}

function getStoredLocalProjects(): Project[] {
  try {
    const stored = localStorage.getItem("contri_local_projects");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveStoredLocalProjects(projects: Project[]) {
  try {
    localStorage.setItem("contri_local_projects", JSON.stringify(projects));
  } catch {
    // Ignore storage errors
  }
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: getStoredLocalProjects(),
  selectedProject: (() => {
    try {
      const stored = localStorage.getItem("contri_last_selected_project");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
  isLoadingProjects: false,

  loadProjects: async (userId: string) => {
    set({ isLoadingProjects: true });
    try {
      const supabaseProjects = await fetchUserProjects(userId);
      const existing = get().projects;
      const merged = [...supabaseProjects];

      for (const proj of existing) {
        if (!merged.some((p) => p.id === proj.id || (p.path && p.path === proj.path))) {
          merged.push(proj);
        }
      }

      saveStoredLocalProjects(merged);
      set({ projects: merged, isLoadingProjects: false });
    } catch (err) {
      console.warn("loadProjects warning:", err);
      set({ isLoadingProjects: false });
    }
  },

  selectProject: (project) => {
    set({ selectedProject: project });
    if (project) {
      localStorage.setItem("contri_last_selected_project", JSON.stringify(project));
    } else {
      localStorage.removeItem("contri_last_selected_project");
    }
  },

  addProject: (project) => {
    const updated = [project, ...get().projects.filter((p) => p.id !== project.id && p.name !== project.name)];
    saveStoredLocalProjects(updated);
    set({ projects: updated });
  },
}));