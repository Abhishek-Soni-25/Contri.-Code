import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderOpen,
  PlusCircle,
  TerminalSquare,
  Users,
  LoaderCircle,
  LogOut,
} from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";

import { ProjectActionCard } from "../components/projects/ProjectActionCard";
import { RecentProjects } from "../components/projects/RecentProjects";
import { Button } from "../components/common/Button";
import { useAuthStore } from "../stores/authStore";
import { useProjectStore } from "../stores/projectStore";
import { joinProjectBySecretKey } from "../services/supabaseProjectService";

export function WelcomePage() {
  const navigate = useNavigate();
  const { email, username, userId, signOut } = useAuthStore();
  const { addProject, selectProject } = useProjectStore();

  const [accessKey, setAccessKey] = useState("");
  const [accessKeyError, setAccessKeyError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  function handleCreateProject() {
    navigate("/create-project");
  }

  async function handleOpenProject() {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select local project directory",
      });

      if (selected && typeof selected === "string") {
        const folderName = selected.split("/").pop() || "local-project";
        const localProj = {
          id: `local-${Date.now()}`,
          name: folderName,
          technology: "Local Codebase",
          technologyColor: "#FF6329",
          path: selected,
          lastEdited: "Just now",
          isRemote: false,
        };

        addProject(localProj);
        selectProject(localProj);
        navigate("/editor");
      }
    } catch (err) {
      console.warn("Folder picker fallback:", err);
      // Fallback if running standard browser without Tauri
      const fallbackPath = prompt("Enter local project path:", "/home/user/my-project");
      if (fallbackPath) {
        const folderName = fallbackPath.split("/").pop() || "my-project";
        const localProj = {
          id: `local-${Date.now()}`,
          name: folderName,
          technology: "Local Codebase",
          technologyColor: "#FF6329",
          path: fallbackPath,
          lastEdited: "Just now",
          isRemote: false,
        };
        addProject(localProj);
        selectProject(localProj);
        navigate("/editor");
      }
    }
  }

  async function handleJoinProject() {
    const key = accessKey.trim();

    if (!key) {
      setAccessKeyError("Enter a project access key.");
      return;
    }

    setAccessKeyError("");
    setIsJoining(true);

    try {
      const currentUserId = userId || "guest-" + Date.now();
      const joinedProject = await joinProjectBySecretKey(key, currentUserId);

      addProject(joinedProject);
      selectProject(joinedProject);
      navigate("/editor");
    } catch (err: any) {
      setAccessKeyError(err.message || "Could not find project with this key.");
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <main className="h-screen overflow-y-auto bg-[var(--color-background)] px-10 py-7">
      <div className="mx-auto w-full max-w-[1160px]">
        {/* HEADER / USER PROFILE */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[#171717] px-3 py-1.5 text-xs text-[var(--color-text-secondary)]">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span>Signed in as <strong className="text-white">{username || email}</strong></span>
          </div>

          <button
            onClick={() => {
              void signOut();
              navigate("/", { replace: true });
            }}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[#171717] px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* BRANDING */}
        <header className="mt-4 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[14px] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-[0_12px_30px_rgba(255,90,39,0.15)]">
            <TerminalSquare className="h-8 w-8" strokeWidth={2.1} />
          </div>

          <h1 className="mt-8 text-[31px] font-bold tracking-[-0.03em] text-[var(--color-text-primary)]">
            Contri. Code
          </h1>

          <p className="mt-2 text-base font-medium text-[var(--color-text-secondary)]">
            Build locally. Collaborate remotely. Create with AI.
          </p>
        </header>

        {/* ACTION CARDS */}
        <section className="mt-12 grid grid-cols-3 gap-6">
          <ProjectActionCard
            title="Create New Project"
            description="Start from scratch. Create locally and sync to Supabase for collaboration."
            icon={<PlusCircle className="h-5 w-5 text-[#f49a7d]" />}
            onClick={handleCreateProject}
          />

          <ProjectActionCard
            title="Open Local Project"
            description="Select a directory from your file system to continue your work locally."
            icon={<FolderOpen className="h-5 w-5 text-[var(--color-text-primary)]" />}
            onClick={handleOpenProject}
          />

          <ProjectActionCard
            title="Join Shared Project"
            description="Collaborate instantly with team members using their secret key — no Git setup required!"
            icon={<Users className="h-5 w-5 text-[#856cff]" />}
          >
            <input
              value={accessKey}
              onChange={(event) => {
                setAccessKey(event.target.value);
                if (accessKeyError) {
                  setAccessKeyError("");
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleJoinProject();
                }
              }}
              placeholder="Enter Secret Key (e.g. CC-A7X9-P3K2)"
              className="h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-input)] px-3 font-mono text-xs text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-disabled)] focus:border-[var(--color-secondary)]"
            />

            {accessKeyError && (
              <p className="mt-1.5 text-xs text-[var(--color-danger)]">
                {accessKeyError}
              </p>
            )}

            <Button
              variant="secondary"
              size="small"
              fullWidth
              disabled={isJoining}
              onClick={handleJoinProject}
              leftIcon={isJoining ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : undefined}
              className="mt-3"
            >
              {isJoining ? "Connecting..." : "Connect to Session"}
            </Button>
          </ProjectActionCard>
        </section>

        <RecentProjects />
      </div>
    </main>
  );
}