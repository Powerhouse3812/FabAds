import ShellPage from "./ShellPage";
import { usePlan } from "@/contexts/PlanContext";
import { UpsellEmptyState } from "@/components/upsell/UpsellEmptyState";

export default function Reports() {
  const { plan } = usePlan();

  // AI plan: Reports is a Growth feature. Take over the page with the
  // upsell empty state rather than render a "feature locked" toast.
  // Surface multi-account drill-down as the headline benefit since that's
  // the Reports module's strongest differentiator.
  if (plan === "ai") {
    return (
      <UpsellEmptyState
        featureName="Multi-account reporting"
        valueProp="Drill down from Account → Campaign → Ad Set → Ad in one view."
        targetTier="growth"
        bullets={[
          "Up to 15 ad accounts in one dashboard",
          "Creative reporting across Facebook, NB, TikTok",
          "Custom KPI columns + saved views",
        ]}
      />
    );
  }

  return <ShellPage title="Reports" description="View campaign performance metrics, spend analytics, and custom reports." />;
}
