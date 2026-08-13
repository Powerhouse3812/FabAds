import { ComingSoonPage } from "@/components/ComingSoonPage";
import { MobileInsightsTabs } from "@/components/insights/MobileInsightsTabs";

/**
 * Saved Ads — still an unbuilt surface, so the body is the shared
 * `ComingSoonPage`.
 *
 * This thin wrapper exists only so the mobile surface toggle (My feeds ·
 * Discover · Saved Ads) renders here too. Without it the route showed a bare
 * ComingSoonPage with no way back to its siblings except the More sheet — a
 * toggle that vanishes on one of its own three tabs is a trap.
 *
 * `ComingSoonPage` is shared by many routes and is deliberately NOT modified.
 */
export default function InsightsSaved() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-3 py-2 md:hidden">
        <MobileInsightsTabs />
      </div>
      <div className="min-h-0 flex-1">
        <ComingSoonPage
          label="Saved Ads"
          description="Save and organise winning ads from across the web."
        />
      </div>
    </div>
  );
}
