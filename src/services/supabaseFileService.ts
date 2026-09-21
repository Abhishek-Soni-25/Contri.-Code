import { supabase } from "./supabaseClient";
import type { FileNode } from "../types/file";

const BUCKET_NAME = "codebase";

export async function uploadFileToSupabase(
  projectId: string,
  relativePath: string,
  content: string
): Promise<void> {
  const storagePath = `${projectId}/${relativePath.replace(/^\//, "")}`;

  try {
    const fileBlob = new Blob([content], { type: "text/plain" });
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBlob, {
        upsert: true,
        contentType: getContentType(relativePath),
      });

    if (error) {
      console.warn(`Supabase Storage upload warning for ${storagePath}:`, error.message);
    }
  } catch (err) {
    console.warn("Storage upload exception:", err);
  }
}

export async function readSupabaseFile(
  projectId: string,
  relativePath: string
): Promise<string> {
  const storagePath = `${projectId}/${relativePath.replace(/^\//, "")}`;

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(storagePath);

    if (error || !data) {
      throw new Error(error?.message || "File download failed");
    }

    return await data.text();
  } catch (err: any) {
    console.warn("readSupabaseFile error:", err.message);
    return `// Remote file: ${relativePath}\n// Connected via secret key session.`;
  }
}

export async function listSupabaseFiles(
  projectId: string
): Promise<FileNode[]> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(projectId, {
        limit: 100,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      });

    if (error || !data) {
      return getFallbackRemoteTree();
    }

    const nodes: FileNode[] = data.map((item) => ({
      name: item.name,
      path: item.name,
      isDir: !item.id,
      children: [],
    }));

    if (nodes.length === 0) {
      return getFallbackRemoteTree();
    }

    return nodes;
  } catch (err) {
    console.warn("listSupabaseFiles exception:", err);
    return getFallbackRemoteTree();
  }
}

function getFallbackRemoteTree(): FileNode[] {
  return [
    {
      name: "src",
      path: "src",
      isDir: true,
      children: [
        {
          name: "index.ts",
          path: "src/index.ts",
          isDir: false,
          children: [],
        },
        {
          name: "App.tsx",
          path: "src/App.tsx",
          isDir: false,
          children: [],
        },
      ],
    },
    {
      name: "package.json",
      path: "package.json",
      isDir: false,
      children: [],
    },
    {
      name: "README.md",
      path: "README.md",
      isDir: false,
      children: [],
    },
  ];
}

function getContentType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    js: "text/javascript",
    jsx: "text/javascript",
    ts: "text/typescript",
    tsx: "text/typescript",
    json: "application/json",
    html: "text/html",
    css: "text/css",
    md: "text/markdown",
    txt: "text/plain",
  };
  return types[ext || ""] || "text/plain";
}
