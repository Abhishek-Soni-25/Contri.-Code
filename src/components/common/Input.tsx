import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../../utils/cn";

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      id,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className,
      containerClassName,
      disabled,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const messageId = `${inputId}-message`;

    return (
      <div className={cn("w-full", containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-[11px] font-bold tracking-[0.08em] text-[var(--color-text-secondary)] uppercase"
          >
            {label}
          </label>
        )}

        <div
          className={cn(
            "flex h-[46px] items-center rounded-[var(--radius-medium)] border bg-[var(--color-input)] transition",
            error
              ? "border-[var(--color-danger)]"
              : "border-[var(--color-border)] focus-within:border-[var(--color-border-focus)] focus-within:shadow-[var(--shadow-focus)]",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          {leftIcon && (
            <span className="ml-3.5 flex shrink-0 items-center text-[var(--color-text-secondary)]">
              {leftIcon}
            </span>
          )}

          <input
            {...props}
            id={inputId}
            ref={ref}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error || helperText ? messageId : undefined
            }
            className={cn(
              "h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-[var(--color-text-primary)] outline-none",
              "placeholder:text-[var(--color-text-disabled)]",
              className,
            )}
          />

          {rightIcon && (
            <span className="mr-3.5 flex shrink-0 items-center text-[var(--color-text-muted)]">
              {rightIcon}
            </span>
          )}
        </div>

        {(error || helperText) && (
          <p
            id={messageId}
            className={cn(
              "mt-1.5 text-xs",
              error
                ? "text-[var(--color-danger)]"
                : "text-[var(--color-text-muted)]",
            )}
          >
            {error ?? helperText}
          </p>
        )}
      </div>
    );
  },
);