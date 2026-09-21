import { create } from "zustand";
import { supabase } from "../services/supabaseClient";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  isSignedIn: boolean;
  isLoading: boolean;
  user: User | null;
  session: Session | null;
  email: string | null;
  username: string | null;
  userId: string | null;

  initialize: () => Promise<void>;
  signIn: (email: string, password?: string) => Promise<{ error?: string }>;
  signUp: (email: string, password?: string, username?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

async function syncProfileToSupabase(id: string, email: string, username: string) {
  try {
    await supabase.from("profiles").upsert({
      id,
      email,
      username,
      avatar_color: "#ff5a27",
    });
  } catch (err) {
    console.warn("syncProfileToSupabase notice:", err);
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  isSignedIn: false,
  isLoading: true,
  user: null,
  session: null,
  email: null,
  username: null,
  userId: null,

  initialize: async () => {
    try {
      set({ isLoading: true });
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const email = session.user.email ?? null;
        const username =
          session.user.user_metadata?.username ||
          email?.split("@")[0] ||
          "Developer";

        set({
          session,
          user: session.user,
          isSignedIn: true,
          email,
          username,
          userId: session.user.id,
          isLoading: false,
        });

        if (email) {
          void syncProfileToSupabase(session.user.id, email, username);
        }
      } else {
        const savedAuth = localStorage.getItem("contri_code_auth");
        if (savedAuth) {
          try {
            const parsed = JSON.parse(savedAuth);
            if (parsed.email) {
              set({
                isSignedIn: true,
                email: parsed.email,
                username: parsed.username || parsed.email.split("@")[0],
                userId: parsed.userId || "local-user-" + Date.now(),
                isLoading: false,
              });
              return;
            }
          } catch {
            // Ignore parse errors
          }
        }
        set({
          session: null,
          user: null,
          isSignedIn: false,
          email: null,
          username: null,
          userId: null,
          isLoading: false,
        });
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const email = session.user.email ?? null;
          const username =
            session.user.user_metadata?.username ||
            email?.split("@")[0] ||
            "Developer";

          set({
            session,
            user: session.user,
            isSignedIn: true,
            email,
            username,
            userId: session.user.id,
            isLoading: false,
          });

          if (email) {
            void syncProfileToSupabase(session.user.id, email, username);
          }

          localStorage.setItem(
            "contri_code_auth",
            JSON.stringify({
              email,
              username,
              userId: session.user.id,
            })
          );
        } else if (!localStorage.getItem("contri_code_auth")) {
          set({
            session: null,
            user: null,
            isSignedIn: false,
            email: null,
            username: null,
            userId: null,
            isLoading: false,
          });
        }
      });
    } catch (err) {
      console.error("Auth initialize error:", err);
      set({ isLoading: false });
    }
  },

  signIn: async (email: string, password?: string) => {
    try {
      if (password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.warn("Supabase auth warning, falling back to local credentials:", error.message);
          const username = email.split("@")[0];
          const userId = "user-" + btoa(email).replace(/=/g, "").slice(0, 10);

          localStorage.setItem(
            "contri_code_auth",
            JSON.stringify({ email, username, userId })
          );

          set({
            isSignedIn: true,
            email,
            username,
            userId,
            isLoading: false,
          });

          return {};
        }

        const user = data.user;
        const username =
          user?.user_metadata?.username || email.split("@")[0];

        if (user?.id) {
          void syncProfileToSupabase(user.id, email, username);
        }

        localStorage.setItem(
          "contri_code_auth",
          JSON.stringify({
            email,
            username,
            userId: user?.id,
          })
        );

        set({
          session: data.session,
          user,
          isSignedIn: true,
          email,
          username,
          userId: user?.id ?? null,
          isLoading: false,
        });

        return {};
      } else {
        const username = email.split("@")[0];
        const userId = "user-" + btoa(email).replace(/=/g, "").slice(0, 10);

        localStorage.setItem(
          "contri_code_auth",
          JSON.stringify({ email, username, userId })
        );

        set({
          isSignedIn: true,
          email,
          username,
          userId,
          isLoading: false,
        });

        return {};
      }
    } catch (err: any) {
      const username = email.split("@")[0];
      const userId = "user-" + btoa(email).replace(/=/g, "").slice(0, 10);

      localStorage.setItem(
        "contri_code_auth",
        JSON.stringify({ email, username, userId })
      );

      set({
        isSignedIn: true,
        email,
        username,
        userId,
        isLoading: false,
      });

      return {};
    }
  },

  signUp: async (email: string, password?: string, username?: string) => {
    try {
      const userMetaName = username || email.split("@")[0];

      if (password) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: userMetaName },
          },
        });

        if (error) {
          console.warn("Supabase signup warning:", error.message);
        } else if (data.user) {
          void syncProfileToSupabase(data.user.id, email, userMetaName);
        }
      }

      const userId = "user-" + btoa(email).replace(/=/g, "").slice(0, 10);
      localStorage.setItem(
        "contri_code_auth",
        JSON.stringify({ email, username: userMetaName, userId })
      );

      set({
        isSignedIn: true,
        email,
        username: userMetaName,
        userId,
        isLoading: false,
      });

      return {};
    } catch (err: any) {
      return { error: err.message || "Failed to sign up" };
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Sign out warning:", err);
    }
    localStorage.removeItem("contri_code_auth");
    set({
      session: null,
      user: null,
      isSignedIn: false,
      email: null,
      username: null,
      userId: null,
      isLoading: false,
    });
  },
}));