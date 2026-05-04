import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ClientProvider } from "@/contexts/ClientContext";

/**
 * AuthContext — real Supabase auth (A-10.15).
 *
 * History:
 *   Pre-iter-6 — real auth via getSession + onAuthStateChange + role fetch.
 *   Iter-6 Track 5+ — replaced with a hardcoded MOCK_USER ("rahul-saini-demo-user")
 *                     so anyone could enter the app without signing in. The MOCK
 *                     id was a placeholder that didn't resolve in Supabase.
 *                     Side effect: 26 mutations across the app silently failed
 *                     in demo mode because they called supabase.auth.getUser()
 *                     which returned null without a real session. Boards couldn't
 *                     be created, queue items couldn't be added, etc.
 *   A-10.15 — restored real auth. Sign-in via GitHub OAuth (preferred per
 *             Maalik) plus email/password fallback. supabase.auth.getUser() now
 *             returns the actual signed-in user across all 26 mutation sites,
 *             RLS policies resolve, seeded data visible.
 *
 * Subscribes to onAuthStateChange so sign-in / sign-out / token-refresh
 * propagate to the whole app via React state. Workspace role is fetched from
 * workspace_users when the session changes.
 */

type AppRole = "owner" | "admin" | "member";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap session + subscribe to auth changes.
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!mounted) return;
        setSession(nextSession);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch role from workspace_users when the user changes.
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setRole(null);
      return;
    }
    let cancelled = false;
    supabase
      .from("workspace_users")
      .select("role")
      .eq("user_id", userId)
      .limit(1)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        setRole((data?.role as AppRole | undefined) ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        role,
        loading,
        signOut,
      }}
    >
      <ClientProvider>{children}</ClientProvider>
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
