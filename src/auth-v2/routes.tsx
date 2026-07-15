import { Route } from "react-router-dom";
import AuthV2Page from "@/auth-v2/AuthV2Page";

/**
 * auth-v2 — PUBLIC standalone route for the 2 final signup/login designs
 * (Dark Stage, Living Split) synthesized from client feedback on the
 * 11-concept /auth-concepts gallery. One route, dev-only A/B variant
 * toggle (bottom-right pill) — does not touch /auth or /auth-concepts.
 *
 * URL: /auth-v2?view=login|signup&plan=<planId>&billing=monthly|annual
 */
export const authV2Routes = <Route path="auth-v2" element={<AuthV2Page />} />;
