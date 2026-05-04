import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ClientProvider } from "@/contexts/ClientContext";

/**
 * AuthContext — auto-login demo mode (A-10.20).
 *
 * History:
 *   Pre-iter-6 — real auth via getSession + onAuthStateChange + role fetch.
 *   Iter-6 Track 5+ — replaced with hardcoded MOCK_USER. No real Supabase
 *                     session → 26 mutations silently failed.
 *   A-10.15 — restored real auth + GitHub OAuth + auth gate. This forced
 *             users to see a login screen, which contradicted Maalik's
 *             "direct usage" demo intent.
 *   A-10.20 — combine: NO login screen shown to users (per Maalik), AND
 *             a real Supabase session exists so the 26 mutations work.
 *             AuthContext silently auto-signs-in with the seeded Rahul
 *             credentials on mount. ProtectedRoute shows a brief spinner
 *             during this bootstrap, never redirects to /auth.
 *
 *             Trade-off: demo credentials live in this file. Acceptable
 *             for the current private-dev phase (per Maalik). Before
 *             public ship: move to env vars + restore the gate.
 */

type AppRole = "owner" | "admin" | "member";

/** Demo credentials for auto-login. Replace with env-driven path before public ship. */
const DEMO_EMAIL = "Rahulsaini@ideaclan.com";
const DEMO_PASSWORD = "MadaraUchiha";

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

  // Bootstrap session + auto-login + subscribe to auth changes.
  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      // Existing session? Use it.
      const { data: existing } = await supabase.auth.getSession();
      if (existing.session) {
        if (mounted) {
          setSession(existing.session);
          setLoading(false);
        }
        return;
      }

      // No session → silent auto-login with demo credentials. User never
      // sees a login screen; the brief loading spinner in ProtectedRoute
      // covers the round-trip.
      const { data, error } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      });

      if (!mounted) return;
      if (error) {
        // eslint-disable-next-line no-console
        console.error("Demo auto-login failed:", error.message);
      }
      setSession(data?.session ?? null);
      setLoading(false);
    };

    bootstrap();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!mounted) return;
        setSession(nextSession);
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
