/**
 * Launch2Layout — wraps all /launch2 routes in the Launch2Provider so live
 * progress + drafts are shared across Home / Flow / Detail / Activity. Renders
 * inside the FabAds AppLayout shell (which supplies the rail, the auto sub-nav
 * from modules.ts, and the breadcrumb header).
 *
 * Full-plan gate: Launch 2.0 is a Full-plan module (modules.ts `plans: ["full"]`).
 * On the AI plan, this takes the whole module over with an upsell — mirroring
 * v1 Launch / Reports / RRM so the module can't be used by deep-linking the URL
 * (the rail also locks the entry). On the Growth/Full plan it renders normally.
 */
import { Outlet } from "react-router-dom";
import { usePlan } from "@/contexts/PlanContext";
import { UpsellEmptyState } from "@/components/upsell/UpsellEmptyState";
import { Launch2Provider } from "./state/Launch2Context";

export default function Launch2Layout() {
  const { plan } = usePlan();

  if (plan === "ai") {
    return (
      <UpsellEmptyState
        featureName="Launch 2.0"
        valueProp="Bulk-launch dozens of Meta ads in one guided flow — strategy playbooks, the 250-ad-per-Page cap checked inline, and retry-failed-only reliability."
        targetTier="growth"
        bullets={[
          "Five guided steps from strategy to a batched, throttled launch.",
          "Per-Page 250-cap pre-checks + account health before every push.",
          "Live progress with failed-vs-launched accounting and retry-failed-only.",
        ]}
      />
    );
  }

  return (
    <Launch2Provider>
      <Outlet />
    </Launch2Provider>
  );
}
