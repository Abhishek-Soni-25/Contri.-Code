import { create } from "zustand";
import { generateSecretKey } from "../services/supabaseProjectService";
import { supabase } from "../services/supabaseClient";

export interface Collaborator {
  id: string;
  name: string;
  role: "HOST" | "REVIEWER" | "GUEST";
  status: string;
  color: string;
}

interface CollaborationState {
  secretKey: string;
  collaborators: Collaborator[];

  setSecretKey: (key: string) => void;
  regenerateSecretKey: (projectId?: string) => Promise<void>;
  loadCollaborators: (projectId?: string, currentUsername?: string) => Promise<void>;
}

export const useCollaborationStore = create<CollaborationState>((set) => ({
  secretKey: "CC-X9A2-P4M1",

  // Initially empty or containing only current session host - no fake guest collaborators
  collaborators: [],

  setSecretKey: (key: string) => set({ secretKey: key }),

  regenerateSecretKey: async (projectId?: string) => {
    const newKey = generateSecretKey();
    set({ secretKey: newKey });

    if (projectId) {
      try {
        await supabase
          .from("projects")
          .update({ secret_key: newKey })
          .eq("id", projectId);
      } catch (err) {
        console.warn("Update secret key in Supabase warning:", err);
      }
    }
  },

  loadCollaborators: async (projectId?: string, currentUsername?: string) => {
    const defaultHost: Collaborator = {
      id: "host-me",
      name: currentUsername ? `${currentUsername} (You)` : "You (Host)",
      role: "HOST",
      status: "Editing project",
      color: "#ff5a27",
    };

    if (!projectId) {
      set({ collaborators: [defaultHost] });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("project_members")
        .select("id, role, profiles(username, email)")
        .eq("project_id", projectId);

      if (error || !data || data.length === 0) {
        set({ collaborators: [defaultHost] });
        return;
      }

      const loaded: Collaborator[] = data.map((item: any, idx) => ({
        id: item.id || String(idx),
        name: item.profiles?.username || item.profiles?.email || `Collaborator ${idx + 1}`,
        role: item.role as any,
        status: "Active in session",
        color: idx === 0 ? "#ff5a27" : "#856cff",
      }));

      set({ collaborators: loaded });
    } catch (err) {
      console.warn("loadCollaborators error:", err);
      set({ collaborators: [defaultHost] });
    }
  },
}));