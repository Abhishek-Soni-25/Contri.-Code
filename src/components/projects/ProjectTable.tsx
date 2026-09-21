import { Folder } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Project } from "../../types/project";
import { useProjectStore } from "../../stores/projectStore";

interface ProjectTableProps {
  projects: Project[];
}

export function ProjectTable({
  projects,
}: ProjectTableProps) {
  const navigate = useNavigate();

  const selectProject = useProjectStore(
    (state) => state.selectProject,
  );

  function openProject(project: Project) {
    selectProject(project);
    navigate("/editor");
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="grid grid-cols-[1.4fr_1fr_1.4fr_0.6fr] gap-6 bg-[#292929] px-6 py-4 text-[11px] font-bold tracking-wide text-[var(--color-text-secondary)]">
        <span>Project Name</span>
        <span>Technology</span>
        <span>Path / Remote</span>
        <span>Last Edited</span>
      </div>

      {projects.map((project) => (
        <button
          type="button"
          key={project.id}
          onClick={() => openProject(project)}
          className="grid w-full cursor-pointer grid-cols-[1.4fr_1fr_1.4fr_0.6fr] items-center gap-6 border-t border-[var(--color-border)] bg-transparent px-6 py-4 text-left transition hover:bg-[var(--color-surface-hover)]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-input)]">
              <Folder className="h-5 w-5 text-[#f2a792]" />
            </div>

            <span className="font-semibold text-[var(--color-text-primary)]">
              {project.name}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: project.technologyColor,
              }}
            />

            {project.technology}
          </div>

          <span className="truncate font-mono text-xs text-[var(--color-text-secondary)]">
            {project.path}
          </span>

          <span className="text-sm text-[var(--color-text-secondary)]">
            {project.lastEdited}
          </span>
        </button>
      ))}
    </div>
  );
}