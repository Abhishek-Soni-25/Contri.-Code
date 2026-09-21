import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface ProjectActionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
  onClick?: () => void;
}

export function ProjectActionCard({
  icon,
  title,
  description,
  children,
  onClick,
}: ProjectActionCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "min-h-[205px] rounded-[12px] border border-[var(--color-border)]",
        "bg-[var(--color-surface)] p-6 transition duration-150",
        onClick &&
          "cursor-pointer hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-hover)]",
      )}
    >
      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-[#2b2421]">
        {icon}
      </div>

      <h2 className="text-[17px] font-semibold text-[var(--color-text-primary)]">
        {title}
      </h2>

      <p className="mt-2 text-[13px] leading-5 text-[var(--color-text-secondary)]">
        {description}
      </p>

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}