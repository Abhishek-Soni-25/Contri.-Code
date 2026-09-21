import {
  Folder,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useProjectStore,
} from "../../stores/projectStore";

import {
  getRecentProjects,
  type RecentProject,
} from "../../services/recentProjectsService";

function formatLastOpened(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diff = Date.now() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  }

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleDateString();
}

export function RecentProjects() {
  const navigate = useNavigate();

  const selectProject = useProjectStore(
    (state) => state.selectProject,
  );

  const [projects, setProjects] = useState<RecentProject[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadRecentProjects() {
    try {
      const result = await getRecentProjects();
      setProjects(result.slice(0, 3));
    } catch (error) {
      console.error(
        "Failed to load recent projects:",
        error,
      );
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRecentProjects();
  }, []);

  function handleOpenProject(project: RecentProject) {
    selectProject({
      id: `recent-${project.path}`,
      name: project.name,
      technology: project.technology,
      technologyColor: "#FF6329",
      path: project.path,
      lastEdited: formatLastOpened(project.lastOpened),
    });

    navigate("/editor");
  }

  return (
    <section className="mt-12">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          Recent Projects
        </h2>

        <button
          type="button"
          onClick={() => navigate("/projects")}
          className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          View All Projects
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-8 text-center text-sm text-[var(--text-secondary)]">
          Loading recent projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-10 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            No recent projects
          </p>

          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Projects you open with Contri. Code will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          {projects.map((project) => (
            <button
              key={project.path}
              type="button"
              onClick={() => handleOpenProject(project)}
              className="group grid w-full grid-cols-[1fr_auto] items-center gap-6 border-b border-[var(--border)] px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-[var(--surface-hover)]"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-muted)]">
                  <Folder
                    size={20}
                    strokeWidth={1.7}
                    className="text-[var(--text-secondary)]"
                  />
                </div>

                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-[var(--text-primary)]">
                    {project.name}
                  </div>

                  <div className="mt-1 truncate font-mono text-xs text-[var(--text-secondary)]">
                    {project.path}
                  </div>
                </div>
              </div>

              <div className="min-w-[90px] text-right">
                <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Last Opened
                </div>

                <div className="mt-1 text-xs text-[var(--text-secondary)]">
                  {formatLastOpened(project.lastOpened)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}