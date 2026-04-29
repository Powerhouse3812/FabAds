import { createContext, useContext, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { ClientProvider } from "@/contexts/ClientContext";

/**
 * AUTH BYPASS — demo mode (Track 5+).
 *
 * Per Maalik: every user enters FabAds without signing in. App runs as the
 * Rahulsaini@ideaclan.com test account (existing seeded data).
 *
 * This file used to wire Supabase auth (getSession + onAuthStateChange + role
 * fetch from workspace_users). It now returns a hardcoded "Rahul" identity so
 * downstream code that reads useAuth().user.id keeps working against the
 * existing seeded data.
 *
 * To restore real auth: revert this file + ProtectedRoute.tsx.
 */

type AppRole = "owner" | "admin" | "member";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

/**
 * Mock user matching Rahul's seeded test account.
 * The id is a placeholder — replace with the real workspace_users.user_id for
 * Rahulsaini@ideaclan.com if Supabase queries need to resolve.
 */
const MOCK_USER: User = {
  id: "rahul-saini-demo-user",
  app_metadata: {},
  user_metadata: {
    full_name: "Rahul Saini",
    email: "Rahulsaini@ideaclan.com",
  },
  aud: "authenticated",
  created_at: new Date(0).toISOString(),
  email: "Rahulsaini@ideaclan.com",
  // Casting because we're skipping the real Supabase User shape for demo
} as unknown as User;

const MOCK_SESSION: Session = {
  access_token: "demo-mode-no-auth",
  token_type: "bearer",
  expires_in: 3600 * 24 * 365,
  expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 365,
  refresh_token: "demo-mode-no-auth",
  user: MOCK_USER,
} as Session;

const MOCK_ROLE: AppRole = "owner";

const AuthContext = createContext<AuthContextType>({
  session: MOCK_SESSION,
  user: MOCK_USER,
  role: MOCK_ROLE,
  loading: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  // Demo mode — instant ready, no async auth flow
  return (
    <AuthContext.Provider
      value={{
        session: MOCK_SESSION,
        user: MOCK_USER,
        role: MOCK_ROLE,
        loading: false,
        signOut: async () => {
          // No-op in demo mode — there's no session to clear
        },
      }}
    >
      <ClientProvider>{children}</ClientProvider>
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
