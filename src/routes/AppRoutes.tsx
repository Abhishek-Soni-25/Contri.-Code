import { useEffect, type ReactNode } from "react";
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { TerminalSquare, LoaderCircle } from "lucide-react";

import { SignInPage } from "../pages/SignInPage";
import { SignUpPage } from "../pages/SignUpPage";
import { WelcomePage } from "../pages/WelcomePage";
import { ProjectsPage } from "../pages/ProjectsPage";
import { EditorPage } from "../pages/EditorPage";
import { CollaborationPage } from "../pages/CollaborationPage";
import { CreateProjectPage } from "../pages/CreateProjectPage";

import { useAuthStore } from "../stores/authStore";

interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isSignedIn = useAuthStore((state) => state.isSignedIn);

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AuthInitializer({ children }: { children: ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#101010] text-white">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-[0_10px_25px_rgba(255,90,39,0.2)]">
          <TerminalSquare className="h-7 w-7" />
        </div>
        <div className="mt-6 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
          <LoaderCircle className="h-4 w-4 animate-spin text-[var(--color-primary)]" />
          <span>Restoring session from local storage...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <HashRouter>
      <AuthInitializer>
        <Routes>
          <Route path="/" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          <Route
            path="/welcome"
            element={
              <ProtectedRoute>
                <WelcomePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/editor"
            element={
              <ProtectedRoute>
                <EditorPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/collaboration"
            element={
              <ProtectedRoute>
                <CollaborationPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/create-project"
            element={
              <ProtectedRoute>
                <CreateProjectPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthInitializer>
    </HashRouter>
  );
}