import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * ProtectedRoute — gates the authenticated app shell.
 *
 * History:
 *   Pre-iter-6 — gated via real Supabase session check.
 *   Iter-6 Track 5+ — replaced with a no-op pass-through (`<Outlet />`) so anyone
 *                     could enter the app without signing in. Worked alongside
 *                     AuthContext's MOCK_USER. The combo broke 26 mutations
 *                     because supabase.auth.getUser() returned null in real
 *                     Supabase calls.
 *   A-10.15 — gate restored. Real session check + redirect to /auth when
 *             unauthenticated. Loading spinner during initial session bootstrap
 *             so we never flash unauthenticated content.
 */
export function ProtectedRoute() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}
