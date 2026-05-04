import { Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * ProtectedRoute — A-10.20: spinner during AuthContext bootstrap, NO
 * redirect to /auth.
 *
 * AuthContext auto-signs-in with the seeded Rahul demo credentials on
 * mount, so by the time the spinner clears the user has a real Supabase
 * session and walks straight into the app — no login screen shown.
 *
 * History:
 *   Pre-iter-6 — real session gate, redirect to /auth on no-session.
 *   Iter-6 demo mode — pure pass-through (no spinner, no auth, no
 *                       Supabase session → 26 mutations broken).
 *   A-10.15 — full real-auth gate restored, redirect to /auth.
 *   A-10.20 — spinner-only. Auth happens silently in AuthContext.
 *
 * The /auth route still exists (Auth.tsx with email/password + GitHub
 * OAuth) but is unreachable in normal flow because AuthContext always
 * auto-signs-in before this component decides to redirect anywhere.
 * Useful as an explicit-login fallback for dev or for manual-login tests.
 */
export function ProtectedRoute() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return <Outlet />;
}
