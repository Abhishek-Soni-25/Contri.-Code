import { useEffect, useState } from "react";
import { ArrowLeft, Copy, KeyRound, RefreshCw, User, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useCollaborationStore } from "../stores/collaborationStore";
import { useProjectStore } from "../stores/projectStore";

import { useAuthStore } from "../stores/authStore";

export function CollaborationPage() {
  const navigate = useNavigate();
  const project = useProjectStore((state) => state.selectedProject);
  const { username } = useAuthStore();

  const { secretKey, setSecretKey, collaborators, regenerateSecretKey, loadCollaborators } =
    useCollaborationStore();

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (project?.secretKey) {
      setSecretKey(project.secretKey);
    }
    void loadCollaborators(project?.supabaseId || project?.id, username || undefined);
  }, [project, username, setSecretKey, loadCollaborators]);

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(secretKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.log("Clipboard unavailable.");
    }
  }

  async function handleRegenerate() {
    await regenerateSecretKey(project?.supabaseId || project?.id);
  }

  return (
    <main className="h-screen overflow-auto bg-[#101010] text-[var(--color-text-primary)]">
      <header className="flex h-12 items-center border-b border-[var(--color-border)] bg-[#171717] px-5">
        <button
          onClick={() => navigate("/editor")}
          className="flex cursor-pointer items-center gap-2 bg-transparent text-sm text-[var(--color-text-secondary)] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Editor
        </button>

        <button
          onClick={() => navigate("/welcome")}
          className="ml-7 cursor-pointer bg-transparent text-sm font-semibold text-[var(--color-primary)]"
        >
          Contri. Code
        </button>
      </header>

      <div className="mx-auto max-w-[1100px] px-8 py-9">
        <h1 className="text-3xl font-bold">Collaboration Workspace</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Project: <strong className="text-white">{project?.name || "Active Session"}</strong>
        </p>

        <div className="mt-8 grid grid-cols-[1.4fr_1fr] gap-6">
          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
              <span className="text-[10px] font-bold tracking-[0.12em] text-[var(--color-primary)] uppercase">
                Live Session Active
              </span>
            </div>

            <h2 className="mt-7 text-xs font-bold text-[var(--color-text-secondary)] uppercase">
              Secret Key
            </h2>

            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              Share this secret key with user2. User2 can enter this key on their laptop to view & edit your codebase and shared AI chat without Git setup!
            </p>

            <div className="mt-4 flex gap-3">
              <div className="flex h-11 flex-1 items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[#0c0c0c] px-4 font-mono text-base font-bold text-[var(--color-primary)]">
                <KeyRound className="h-4 w-4" />
                {secretKey}
              </div>

              <button
                title="Copy secret key"
                onClick={copyKey}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-border)] bg-[#191919] hover:bg-[#252525]"
              >
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            <button
              onClick={handleRegenerate}
              className="mt-5 flex cursor-pointer items-center gap-2 rounded-md border border-[var(--color-border)] bg-[#222] px-4 py-2 text-xs hover:bg-[#292929]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate Key
            </button>
          </section>

          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="border-b border-[var(--color-border)] px-5 py-4">
              <h2 className="font-semibold">Active Collaborators</h2>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {collaborators.length} participants connected
              </p>
            </div>

            <div className="p-3">
              {collaborators.map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="mb-2 flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[#181818] p-3 last:mb-0"
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: `${collaborator.color}25`,
                      border: `1px solid ${collaborator.color}`,
                    }}
                  >
                    <User className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{collaborator.name}</p>
                    <p className="truncate text-[11px] text-[var(--color-text-muted)]">
                      {collaborator.status}
                    </p>
                  </div>

                  <span className="rounded bg-[#292929] px-2 py-1 text-[9px] font-bold">
                    {collaborator.role}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}