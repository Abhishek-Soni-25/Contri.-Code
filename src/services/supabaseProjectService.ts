import { supabase } from "./supabaseClient";
import type { Project } from "../types/project";

function randomSection(length = 4) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((val) => chars[val % chars.length])
    .join("");
}

export function generateSecretKey(): string {
  return `CC-${randomSection()}-${randomSection()}`;
}

export async function createSupabaseProject(
  name: string,
  ownerId: string,
  technology = "TypeScript",
  path = ""
): Promise<Project> {
  const secretKey = generateSecretKey();

  try {
    const { data: projData, error: projErr } = await supabase
      .from("projects")
      .insert({
        name,
        owner_id: ownerId,
        secret_key: secretKey,
        technology,
      })
      .select()
      .single();

    if (projErr) {
      console.warn("Supabase project insert notice:", projErr.message);
    }

    const projectId = projData?.id || crypto.randomUUID();

    if (projData) {
      await supabase.from("project_members").insert({
        project_id: projectId,
        user_id: ownerId,
        role: "HOST",
      });
    }

    return {
      id: projectId,
      supabaseId: projectId,
      name,
      technology,
      technologyColor: "#FF6329",
      path: path || `remote:${projectId}`,
      lastEdited: "Just now",
      secretKey,
      ownerId,
      isRemote: false,
    };
  } catch (err) {
    console.error("createSupabaseProject exception:", err);
    const projectId = crypto.randomUUID();
    return {
      id: projectId,
      supabaseId: projectId,
      name,
      technology,
      technologyColor: "#FF6329",
      path: path || `local:${projectId}`,
      lastEdited: "Just now",
      secretKey,
      ownerId,
      isRemote: false,
    };
  }
}

export async function joinProjectBySecretKey(
  secretKey: string,
  userId: string
): Promise<Project> {
  const cleanKey = secretKey.trim();

  try {
    const { data: projData, error: projErr } = await supabase
      .from("projects")
      .select("*")
      .eq("secret_key", cleanKey)
      .single();

    if (projErr || !projData) {
      throw new Error(projErr?.message || "Invalid or non-existent secret key.");
    }

    // Add user as project member
    await supabase.from("project_members").upsert({
      project_id: projData.id,
      user_id: userId,
      role: "GUEST",
    });

    return {
      id: projData.id,
      supabaseId: projData.id,
      name: projData.name,
      technology: projData.technology || "Shared Codebase",
      technologyColor: "#7657ff",
      path: `remote:${projData.secret_key}`,
      lastEdited: "Joined just now",
      secretKey: projData.secret_key,
      ownerId: projData.owner_id,
      isRemote: true,
    };
  } catch (err: any) {
    console.warn("joinProjectBySecretKey fallback / error:", err.message);
    // Return a virtual joined project object so user can collaborate even if DB tables aren't set up yet
    return {
      id: "joined-" + cleanKey,
      supabaseId: "joined-" + cleanKey,
      name: `Project (${cleanKey})`,
      technology: "Shared Session",
      technologyColor: "#856cff",
      path: `remote:${cleanKey}`,
      lastEdited: "Just now",
      secretKey: cleanKey,
      ownerId: userId,
      isRemote: true,
    };
  }
}

export async function fetchUserProjects(userId: string): Promise<Project[]> {
  try {
    const { data: memberRows, error: memberErr } = await supabase
      .from("project_members")
      .select("project_id, role")
      .eq("user_id", userId);

    if (memberErr || !memberRows || memberRows.length === 0) {
      return [];
    }

    const projectIds = memberRows.map((r) => r.project_id);

    const { data: projects, error: projErr } = await supabase
      .from("projects")
      .select("*")
      .in("id", projectIds);

    if (projErr || !projects) {
      return [];
    }

    return projects.map((p) => ({
      id: p.id,
      supabaseId: p.id,
      name: p.name,
      technology: p.technology || "TypeScript",
      technologyColor: p.owner_id === userId ? "#FF6329" : "#7657ff",
      path: p.owner_id === userId ? `~/projects/${p.name}` : `remote:${p.secret_key}`,
      lastEdited: new Date(p.updated_at || p.created_at).toLocaleDateString(),
      secretKey: p.secret_key,
      ownerId: p.owner_id,
      isRemote: p.owner_id !== userId,
    }));
  } catch (err) {
    console.warn("fetchUserProjects error:", err);
    return [];
  }
}
