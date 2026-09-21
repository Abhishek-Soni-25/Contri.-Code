import { useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ProjectTable } from "../components/projects/ProjectTable";
import { useProjectStore } from "../stores/projectStore";

export function ProjectsPage() {
  const navigate = useNavigate();

  const projects = useProjectStore((state) => state.projects);

  const [search, setSearch] = useState("");

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return projects;
    }

    return projects.filter((project) => {
      return (
        project.name.toLowerCase().includes(query) ||
        project.technology.toLowerCase().includes(query) ||
        project.path.toLowerCase().includes(query)
      );
    });
  }, [projects, search]);

  return (
    <main className="h-screen overflow-y-auto bg-[var(--color-background)] p-8">
      <div className="mx-auto max-w-[1320px]">
        <button
          type="button"
          onClick={() => navigate("/welcome")}
          className="mb-6 flex cursor-pointer items-center gap-2 bg-transparent text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="relative">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter projects by name, language, or path..."
            className="h-11 w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-input)] pr-4 pl-11 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
          />
        </div>

        <div className="mt-8">
          {filteredProjects.length > 0 ? (
            <ProjectTable projects={filteredProjects} />
          ) : (
            <div className="rounded-[12px] border border-dashed border-[var(--color-border)] py-16 text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">
                No projects match "{search}".
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}