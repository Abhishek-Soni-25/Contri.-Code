import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "../../utils/cn";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost";

type ButtonSize = "small" | "medium" | "large";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)]",
  secondary:
    "bg-[var(--color-secondary)] text-white hover:bg-[var(--color-secondary-hover)]",
  outline:
    "border border-[var(--color-border)] bg-transparent text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-hover)]",
  ghost:
    "bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  small: "h-8 px-3 text-xs",
  medium: "h-10 px-4 text-sm",
  large: "h-12 px-5 text-base",
};

export function Button({
  children,
  variant = "primary",
  size = "medium",
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      type={type}
      disabled={isDisabled}
      className={cn(
        "focus-ring inline-flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-medium)] font-semibold transition duration-150",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {loading ? (
        <LoaderCircle
          aria-hidden="true"
          className="h-4 w-4 animate-spin"
        />
      ) : (
        leftIcon
      )}

      <span>{children}</span>

      {!loading && rightIcon}
    </button>
  );
}