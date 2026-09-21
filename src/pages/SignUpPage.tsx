import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  UserPlus,
  LockKeyhole,
  Mail,
  User,
  TerminalSquare,
} from "lucide-react";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { useAuthStore } from "../stores/authStore";

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  general?: string;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function SignUpPage() {
  const navigate = useNavigate();
  const signUp = useAuthStore((state) => state.signUp);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validateForm(): boolean {
    const nextErrors: FormErrors = {};

    if (!username.trim()) {
      nextErrors.username = "Username is required.";
    }

    if (!email.trim()) {
      nextErrors.email = "Email address is required.";
    } else if (!validateEmail(email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password.trim()) {
      nextErrors.password = "Password is required.";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
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
      const res = await signUp(email.trim(), password.trim(), username.trim());

      if (res.error) {
        setErrors({ general: res.error });
        setIsSubmitting(false);
        return;
      }

      navigate("/welcome", { replace: true });
    } catch (err: any) {
      setErrors({ general: err.message || "Failed to create account" });
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
          Create Account
        </h1>

        <p className="mt-1.5 text-center text-[13px] text-[var(--color-text-secondary)]">
          Join Contri. Code for shared real-time dev sessions
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

          <div className="space-y-5">
            <Input
              label="Username"
              type="text"
              name="username"
              autoComplete="username"
              placeholder="alex_dev"
              value={username}
              error={errors.username}
              leftIcon={
                <User className="h-[19px] w-[19px]" strokeWidth={1.8} />
              }
              onChange={(event) => {
                setUsername(event.target.value);
                if (errors.username) {
                  setErrors((current) => ({
                    ...current,
                    username: undefined,
                  }));
                }
              }}
            />

            <Input
              label="Email address"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="alex@company.com"
              value={email}
              error={errors.email}
              leftIcon={
                <Mail className="h-[19px] w-[19px]" strokeWidth={1.8} />
              }
              onChange={(event) => {
                setEmail(event.target.value);
                if (errors.email) {
                  setErrors((current) => ({
                    ...current,
                    email: undefined,
                  }));
                }
              }}
            />

            <Input
              label="Password"
              type="password"
              name="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              error={errors.password}
              leftIcon={
                <LockKeyhole className="h-[19px] w-[19px]" strokeWidth={1.8} />
              }
              onChange={(event) => {
                setPassword(event.target.value);
                if (errors.password) {
                  setErrors((current) => ({
                    ...current,
                    password: undefined,
                  }));
                }
              }}
            />
          </div>

          <Button
            type="submit"
            size="large"
            fullWidth
            loading={isSubmitting}
            rightIcon={
              <UserPlus className="h-5 w-5" strokeWidth={1.8} />
            }
            className="mt-6"
          >
            Create Account
          </Button>

          <p className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
            Already have an account?{" "}
            <Link
              to="/"
              className="font-medium text-[var(--color-primary)] hover:underline"
            >
              Sign In
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
