import {
  Bot,
  ChevronDown,
  FilePlus2,
  Folder,
  FolderPlus,
  Save,
  Search,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { recordRecentProject } from "../services/recentProjectsService";
import Editor, { type BeforeMount } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "../stores/projectStore";

import {
  createProjectFile,
  createProjectFolder,
  getProjectTree,
  readProjectFile,
  writeProjectFile,
} from "../services/fileSystemService";

import {
  listSupabaseFiles,
  readSupabaseFile,
  uploadFileToSupabase,
} from "../services/supabaseFileService";

import type { FileNode } from "../types/file";
import { FileTree } from "../components/editor/FileTree";
import { getEditorLanguage } from "../utils/editorLanguage";
import { AiChatPanel } from "../components/editor/AiChatPanel";

type BottomPanel = "terminal" | "problems" | "output" | null;

export function EditorPage() {
  const navigate = useNavigate();
  const project = useProjectStore((state) => state.selectedProject);

  const [tree, setTree] = useState<FileNode[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [activeFileName, setActiveFileName] = useState("");
  const [content, setContent] = useState("");
  const [selectedDirectory, setSelectedDirectory] = useState(project?.path ?? "");
  const [aiVisible, setAiVisible] = useState(false);
  const [bottomPanel, setBottomPanel] = useState<BottomPanel>(null);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [error, setError] = useState("");

  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const projectPath = project?.path ?? "";
  const isRemote = project?.isRemote || projectPath.startsWith("remote:");
  const projectId = project?.supabaseId || project?.id || "default-proj";

  useEffect(() => {
    if (!project) return;

    void recordRecentProject({
      name: project.name,
      path: project.path,
      technology: project.technology ?? "Unknown",
      lastOpened: new Date().toISOString(),
    });
  }, [project]);

  // MONACO THEME
  const beforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme("contri-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#0c0c0c",
        "editor.foreground": "#d7d7d7",
        "editorLineNumber.foreground": "#505050",
        "editorLineNumber.activeForeground": "#aaaaaa",
        "editor.selectionBackground": "#463971",
        "editorCursor.foreground": "#ff5a27",
        "editorIndentGuide.background1": "#222222",
        "editorIndentGuide.activeBackground1": "#444444",
      },
    });
  };

  // LOAD FILE TREE
  async function refreshTree() {
    if (!project) return;

    try {
      if (isRemote) {
        const remoteNodes = await listSupabaseFiles(projectId);
        setTree(remoteNodes);
      } else {
        try {
          const result = await getProjectTree(projectPath);
          setTree(result);
        } catch {
          // Fallback to Supabase file list if local path not accessible directly
          const remoteNodes = await listSupabaseFiles(projectId);
          setTree(remoteNodes);
        }
      }
      setError("");
    } catch (err) {
      setError(String(err));
    }
  }

  useEffect(() => {
    setSelectedDirectory(projectPath);
    void refreshTree();
  }, [projectPath, isRemote]);

  // OPEN FILE
  async function openFile(node: FileNode) {
    if (node.isDir) return;

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    try {
      let fileContent = "";
      if (isRemote) {
        fileContent = await readSupabaseFile(projectId, node.path);
      } else {
        try {
          fileContent = await readProjectFile(projectPath, node.path);
        } catch {
          fileContent = await readSupabaseFile(projectId, node.path);
        }
      }

      setActiveFilePath(node.path);
      setActiveFileName(node.name);
      setContent(fileContent);
      setSaveState("saved");
      setError("");
    } catch (err) {
      setError(String(err));
    }
  }

  // AUTOSAVE & SUPABASE SYNC
  function handleEditorChange(value: string | undefined) {
    const nextValue = value ?? "";
    setContent(nextValue);

    if (!activeFilePath) return;

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    setSaveState("saving");
    const pathToSave = activeFilePath;
    const valueToSave = nextValue;

    saveTimer.current = setTimeout(async () => {
      try {
        if (!isRemote && projectPath) {
          try {
            await writeProjectFile(projectPath, pathToSave, valueToSave);
          } catch (writeErr) {
            console.warn("Local disk write notice:", writeErr);
          }
        }

        // Upload to Supabase Storage so remote collaborators get the changes
        await uploadFileToSupabase(projectId, pathToSave, valueToSave);
        setSaveState("saved");
      } catch (err) {
        console.error(err);
        setSaveState("error");
      }
    }, 500);
  }

  // CREATE FILE
  async function handleCreateFile() {
    const name = window.prompt("Enter file name", "main.ts");
    if (!name?.trim()) return;

    try {
      const cleanName = name.trim();
      let createdPath = cleanName;

      if (!isRemote && projectPath) {
        try {
          createdPath = await createProjectFile(
            projectPath,
            selectedDirectory || projectPath,
            cleanName
          );
        } catch {
          createdPath = cleanName;
        }
      }

      await uploadFileToSupabase(projectId, createdPath, "// New file created");
      await refreshTree();
      await openFile({
        name: cleanName,
        path: createdPath,
        isDir: false,
        children: [],
      });
    } catch (err) {
      setError(String(err));
    }
  }

  // CREATE FOLDER
  async function handleCreateFolder() {
    const name = window.prompt("Enter folder name", "src");
    if (!name?.trim()) return;

    try {
      const cleanName = name.trim();
      if (!isRemote && projectPath) {
        try {
          const path = await createProjectFolder(
            projectPath,
            selectedDirectory || projectPath,
            cleanName
          );
          setSelectedDirectory(path);
        } catch {
          setSelectedDirectory(cleanName);
        }
      }
      await refreshTree();
    } catch (err) {
      setError(String(err));
    }
  }

  function toggleBottomPanel(panel: Exclude<BottomPanel, null>) {
    setBottomPanel((current) => (current === panel ? null : panel));
  }

  if (!project) {
    return (
      <main className="flex h-screen items-center justify-center bg-[#101010] text-white">
        <div className="text-center">
          <h1 className="text-xl font-semibold">No project selected</h1>
          <button
            onClick={() => navigate("/welcome")}
            className="mt-5 cursor-pointer text-[var(--color-primary)]"
          >
            Return Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#0c0c0c] text-[var(--color-text-primary)]">
      {/* TOP BAR */}
      <header className="flex h-10 shrink-0 items-center border-b border-[var(--color-border)] bg-[#171717]">
        <div className="flex w-[255px] items-center gap-2 px-3">
          <button
            type="button"
            onClick={() => navigate("/welcome")}
            className="cursor-pointer bg-transparent text-xs font-bold text-[var(--color-primary)] hover:text-[#ff7a4b]"
          >
            Contri. Code
          </button>

          {/* MODE BADGE & AUTOSAVE */}
          <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${isRemote ? "bg-purple-900/60 text-purple-300" : "bg-orange-950/60 text-orange-300"}`}>
            {isRemote ? "REMOTE SESSION" : "LOCAL & SYNCED"}
          </span>

          <div
            title={
              saveState === "saving"
                ? "Saving & Syncing..."
                : saveState === "error"
                ? "Autosave error"
                : "Autosave & Supabase sync active"
            }
            className="flex items-center gap-1 text-[9px] text-[var(--color-text-muted)]"
          >
            <Save
              className={
                saveState === "error"
                  ? "h-3.5 w-3.5 text-red-400"
                  : saveState === "saving"
                  ? "h-3.5 w-3.5 animate-pulse text-yellow-400"
                  : "h-3.5 w-3.5 text-green-400"
              }
            />
            <span>{saveState === "saving" ? "Syncing" : "Auto"}</span>
          </div>
        </div>

        {/* SEARCH */}
        <div className="flex flex-1 justify-center">
          <div className="flex h-7 w-[340px] items-center gap-2 rounded-md border border-[#282828] bg-[#0b0b0b] px-3">
            <Search className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
            <span className="text-[11px] text-[var(--color-text-muted)]">
              Search project files...
            </span>
          </div>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex w-[255px] justify-end gap-4 px-4 items-center">
          <button
            onClick={() => navigate("/collaboration")}
            className="flex items-center gap-1.5 rounded bg-[#222] px-2 py-1 text-[10px] font-medium text-[var(--color-text-secondary)] hover:bg-[#2b2b2b]"
          >
            <Users className="h-3.5 w-3.5 text-[var(--color-secondary)]" />
            <span>Collaborate</span>
          </button>

          <button
            type="button"
            title="Toggle Shared AI Workspace"
            onClick={() => setAiVisible((value) => !value)}
            className="cursor-pointer bg-transparent"
          >
            <Sparkles
              className={
                aiVisible
                  ? "h-4 w-4 text-[var(--color-secondary)] animate-pulse"
                  : "h-4 w-4 text-[var(--color-text-primary)]"
              }
            />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* ACTIVITY BAR */}
        <aside className="flex w-[46px] shrink-0 flex-col items-center border-r border-[var(--color-border)] bg-[#171717] py-3">
          <Folder className="mb-6 h-5 w-5 text-[var(--color-primary)]" />
          <button
            title="Shared AI Workspace"
            onClick={() => setAiVisible((v) => !v)}
            className="mb-6 cursor-pointer bg-transparent"
          >
            <Bot className={aiVisible ? "h-5 w-5 text-[var(--color-secondary)]" : "h-5 w-5 text-[var(--color-text-muted)] hover:text-white"} />
          </button>

          <button
            title="Collaboration Workspace"
            onClick={() => navigate("/collaboration")}
            className="mb-6 cursor-pointer bg-transparent"
          >
            <Users className="h-5 w-5 text-[var(--color-text-muted)] hover:text-[var(--color-secondary)]" />
          </button>

          <Settings className="mt-auto h-5 w-5 text-[var(--color-text-muted)]" />
        </aside>

        {/* EXPLORER */}
        <aside className="flex w-[210px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[#151515]">
          <div className="flex h-10 items-center justify-between px-3">
            <span className="text-[10px] font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase">
              Explorer
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                title="New File"
                onClick={handleCreateFile}
                className="cursor-pointer bg-transparent"
              >
                <FilePlus2 className="h-4 w-4 text-[var(--color-text-muted)] hover:text-white" />
              </button>

              <button
                type="button"
                title="New Folder"
                onClick={handleCreateFolder}
                className="cursor-pointer bg-transparent"
              >
                <FolderPlus className="h-4 w-4 text-[var(--color-text-muted)] hover:text-white" />
              </button>
            </div>
          </div>

          {/* PROJECT ROOT */}
          <button
            type="button"
            onClick={() => setSelectedDirectory(project.path)}
            className="flex h-7 cursor-pointer items-center gap-1 bg-transparent px-3 text-xs font-semibold hover:bg-[#202020]"
          >
            <ChevronDown className="h-3.5 w-3.5" />
            <span className="truncate">{project.name}</span>
          </button>

          {/* TREE */}
          <div className="min-h-0 flex-1 overflow-auto">
            {tree.length > 0 ? (
              <FileTree
                nodes={tree}
                activeFilePath={activeFilePath}
                selectedDirectoryPath={selectedDirectory}
                onOpenFile={openFile}
                onSelectDirectory={setSelectedDirectory}
              />
            ) : (
              <div className="px-4 py-6 text-center text-[11px] text-[var(--color-text-muted)]">
                Project workspace empty.
                <br />
                Create a file to start!
              </div>
            )}
          </div>
        </aside>

        {/* MAIN EDITOR AREA */}
        <section className="flex min-w-0 flex-1 flex-col">
          {/* EDITOR TABS */}
          <div className="flex h-9 shrink-0 items-center border-b border-[var(--color-border)] bg-[#131313]">
            {activeFilePath ? (
              <div className="flex h-full items-center gap-2 border-r border-[var(--color-border)] bg-[#0c0c0c] px-4 text-xs">
                <span className="text-[var(--color-primary)]">◇</span>
                {activeFileName}
                <button
                  onClick={() => {
                    setActiveFilePath(null);
                    setActiveFileName("");
                    setContent("");
                  }}
                  className="ml-2 cursor-pointer bg-transparent"
                >
                  <X className="h-3 w-3 text-[var(--color-text-muted)]" />
                </button>
              </div>
            ) : (
              <span className="px-4 text-[10px] text-[var(--color-text-muted)]">
                No file open
              </span>
            )}
          </div>

          {/* MONACO EDITOR */}
          <div className="min-h-0 flex-1">
            {activeFilePath ? (
              <Editor
                height="100%"
                theme="contri-dark"
                beforeMount={beforeMount}
                language={getEditorLanguage(activeFileName)}
                value={content}
                onChange={handleEditorChange}
                options={{
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', 'Ubuntu Mono', monospace",
                  minimap: { enabled: true },
                  automaticLayout: true,
                  wordWrap: "off",
                  tabSize: 2,
                  insertSpaces: true,
                  scrollBeyondLastLine: false,
                  renderLineHighlight: "line",
                  smoothScrolling: true,
                  padding: { top: 12 },
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-[#0c0c0c]">
                <div className="text-center">
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Select a file from the Explorer
                  </p>
                  <p className="mt-2 text-[11px] text-[#555]">
                    Changes automatically sync with Supabase for real-time collaboration.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM PANEL */}
          <div
            className={
              bottomPanel
                ? "h-[190px] shrink-0 border-t border-[var(--color-border)] bg-[#080808]"
                : "h-8 shrink-0 border-t border-[var(--color-border)] bg-[#111]"
            }
          >
            <div className="flex h-8 items-center gap-6 px-3 text-[10px]">
              <button
                type="button"
                onClick={() => toggleBottomPanel("terminal")}
                className={
                  bottomPanel === "terminal"
                    ? "h-full cursor-pointer border-b border-[var(--color-primary)] bg-transparent text-white"
                    : "h-full cursor-pointer bg-transparent text-[var(--color-text-muted)] hover:text-white"
                }
              >
                TERMINAL
              </button>

              <button
                type="button"
                onClick={() => toggleBottomPanel("problems")}
                className={
                  bottomPanel === "problems"
                    ? "h-full cursor-pointer border-b border-[var(--color-primary)] bg-transparent text-white"
                    : "h-full cursor-pointer bg-transparent text-[var(--color-text-muted)] hover:text-white"
                }
              >
                PROBLEMS
              </button>

              <button
                type="button"
                onClick={() => toggleBottomPanel("output")}
                className={
                  bottomPanel === "output"
                    ? "h-full cursor-pointer border-b border-[var(--color-primary)] bg-transparent text-white"
                    : "h-full cursor-pointer bg-transparent text-[var(--color-text-muted)] hover:text-white"
                }
              >
                OUTPUT
              </button>
            </div>

            {bottomPanel && (
              <div className="h-[158px] overflow-auto border-t border-[var(--color-border)] p-3 font-mono text-xs">
                {bottomPanel === "terminal" && (
                  <>
                    <span className="text-[#64d98b]">{project.name}</span>
                    <span className="text-[#bbb]"> $</span>
                    <p className="mt-3 text-[10px] text-[var(--color-text-muted)]">
                      Terminal session initialized ({isRemote ? "Remote Sync Mode" : "Local Workspace Mode"}).
                    </p>
                  </>
                )}

                {bottomPanel === "problems" && (
                  <span className="text-[var(--color-text-muted)]">No problems detected.</span>
                )}

                {bottomPanel === "output" && (
                  <span className="text-[var(--color-text-muted)]">No active output.</span>
                )}
              </div>
            )}
          </div>
        </section>

        {/* SHARED AI WORKSPACE PANEL */}
        {aiVisible && (
          <AiChatPanel
            projectId={projectId}
            activeFileName={activeFileName}
            activeFileContent={content}
            onClose={() => setAiVisible(false)}
          />
        )}
      </div>

      {/* ERROR OVERLAY */}
      {error && (
        <div className="absolute right-5 bottom-5 max-w-[400px] rounded-lg border border-red-700 bg-[#261313] px-4 py-3 text-xs text-red-300 shadow-xl">
          <div className="flex gap-3">
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError("")}
              className="cursor-pointer bg-transparent"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}