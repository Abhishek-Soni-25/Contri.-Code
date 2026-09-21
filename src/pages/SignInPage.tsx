import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowRightToLine,
  LockKeyhole,
  Mail,
  TerminalSquare,
} from "lucide-react";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { useAuthStore } from "../stores/authStore";

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function SignInPage() {
  const navigate = useNavigate();
  const signIn = useAuthStore((state) => state.signIn);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberDevice, setRememberDevice] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validateForm(): boolean {
    const nextErrors: FormErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Email address is required.";
    } else if (!validateEmail(email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password.trim()) {
      nextErrors.password = "Password is required.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await signIn(email.trim(), password.trim());
      if (res.error) {
        setErrors({ general: res.error });
        setIsSubmitting(false);
        return;
      }

      navigate("/welcome", { replace: true });
    } catch (err: any) {
      setErrors({ general: err.message || "Failed to sign in" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-auto bg-transparent px-6 py-10">
      <section className="flex w-full max-w-[420px] flex-col items-center">
        <div
          aria-hidden="true"
          className="mb-5 flex h-16 w-16 items-center justify-center rounded-[14px] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-[0_14px_34px_rgba(255,90,39,0.16)]"
        >
          <TerminalSquare className="h-8 w-8" strokeWidth={2.2} />
        </div>

        <h1 className="text-center text-[32px] leading-tight font-bold tracking-[-0.03em] text-[var(--color-text-primary)]">
          Contri. Code
        </h1>

        <p className="mt-1.5 text-center text-[13px] text-[var(--color-text-secondary)]">
          AI-Native Editor for High-Velocity Devs
        </p>

        <form
          noValidate
          onSubmit={handleSubmit}
          className="mt-8 w-full rounded-[var(--radius-large)] border border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-9 shadow-[var(--shadow-card)]"
        >
          {errors.general && (
            <div className="mb-5 rounded-md border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300">
              {errors.general}
            </div>
          )}

          <div className="space-y-6">
            <Input
              label="Email address"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="name@company.com"
              value={email}
              error={errors.email}
              leftIcon={
                <Mail className="h-[19px] w-[19px]" strokeWidth={1.8} />
              }
              onChange={(event) => {
                setEmail(event.target.value);
                if (errors.email || errors.general) {
                  setErrors((current) => ({
                    ...current,
                    email: undefined,
                    general: undefined,
                  }));
                }
              }}
            />

            <Input
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              error={errors.password}
              leftIcon={
                <LockKeyhole className="h-[19px] w-[19px]" strokeWidth={1.8} />
              }
              onChange={(event) => {
                setPassword(event.target.value);
                if (errors.password || errors.general) {
                  setErrors((current) => ({
                    ...current,
                    password: undefined,
                    general: undefined,
                  }));
                }
              }}
            />
          </div>

          <label className="mt-6 flex w-fit cursor-pointer items-center gap-2.5 text-xs text-[var(--color-text-secondary)] select-none">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(event) => setRememberDevice(event.target.checked)}
              className="peer sr-only"
            />

            <span
              aria-hidden="true"
              className="flex h-4 w-4 items-center justify-center rounded-[4px] border border-[var(--color-border)] bg-[var(--color-input)] transition peer-checked:border-[var(--color-primary)] peer-checked:bg-[var(--color-primary)] peer-focus-visible:shadow-[var(--shadow-focus)]"
            >
              {rememberDevice && (
                <svg
                  viewBox="0 0 12 12"
                  className="h-3 w-3 text-[var(--color-primary-foreground)]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m2.3 6.1 2.2 2.2 5.2-5.1" />
                </svg>
              )}
            </span>

            <span>Remember this device</span>
          </label>

          <Button
            type="submit"
            size="large"
            fullWidth
            loading={isSubmitting}
            rightIcon={
              <ArrowRightToLine className="h-5 w-5" strokeWidth={1.8} />
            }
            className="mt-6"
          >
            Sign In
          </Button>

          <p className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-[var(--color-primary)] hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}