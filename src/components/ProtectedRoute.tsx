import { Outlet } from "react-router-dom";

/**
 * AUTH BYPASS — demo mode (Track 5+).
 *
 * Per Maalik: "every user can directly enter FabAds without signing in or up,
 * with the same dummy data we currently has on Rahulsaini@ideaclan.com".
 *
 * This component used to gate access via Supabase session + role checks. For demo
 * mode it always allows through. The mocked user identity is provided by
 * AuthContext (see contexts/AuthContext.tsx) which now returns a hardcoded Rahul
 * session at mount. To restore real auth: revert this file + AuthContext.
 */
export function ProtectedRoute() {
  return <Outlet />;
}
