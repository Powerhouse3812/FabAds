/**
 * Launch2Layout — wraps all /launch2 routes in the Launch2Provider so live
 * progress + drafts are shared across Home / Flow / Detail / Activity. Renders
 * inside the FabAds AppLayout shell (which supplies the rail, the auto sub-nav
 * from modules.ts, and the breadcrumb header), so this only provides context.
 */
import { Outlet } from "react-router-dom";
import { Launch2Provider } from "./state/Launch2Context";

export default function Launch2Layout() {
  return (
    <Launch2Provider>
      <Outlet />
    </Launch2Provider>
  );
}
