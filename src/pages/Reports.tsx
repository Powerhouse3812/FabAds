import ShellPage from "./ShellPage";
import { usePlan } from "@/contexts/PlanContext";
import { ReportsUpsellPage } from "@/components/upsell/ReportsUpsellPage";

export default function Reports() {
  const { plan } = usePlan();

  // AI plan: Reports is a Growth feature. Replace the page entirely with
  // the ghost-table upsell — users see the real column structure but all
  // data is hidden, making the locked state viscerally obvious.
  if (plan === "ai") {
    return <ReportsUpsellPage />;
  }

  return <ShellPage title="Reports" description="View campaign performance metrics, spend analytics, and custom reports." />;
}
