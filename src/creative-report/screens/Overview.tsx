/**
 * Overview — the buyer's morning triage screen (handoff §5.1, redesigned).
 *
 * Structure (each fact appears exactly ONCE — the earlier version printed
 * every bucket count three times: in the summary prose, on a count card, and
 * again as a list heading below):
 *   header + one-line state of the book + trust chip
 *   BucketTabs          — the count IS the tab; its creatives live inside it
 *   OverviewBreakdown   — Brand / Category / Product (Catalogue dimensions)
 *   RecommendationsCard — literal count+sum readouts, each with a route
 *   AutomationsPreview  — the four routing destinations, not yet wired
 *
 * Deliberately NOT here: the portfolio spend/revenue/ROAS/CPA card row (it
 * lives on the main Dashboard — repeating it here was duplication across
 * screens), and the separate Top-movers list (it re-listed the same
 * decliners the Fatiguing bucket already surfaces).
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useCreativeData } from "@/creative-report/hooks/useCreativeData";
import { BucketTabs } from "@/creative-report/components/BucketTabs";
import { OverviewBreakdown } from "@/creative-report/components/OverviewBreakdown";
import { RecommendationsCard } from "@/creative-report/components/RecommendationsCard";
import { AutomationsPreview } from "@/creative-report/components/AutomationsPreview";
import { TrustMeterChip } from "@/creative-report/components/TrustMeterChip";
import { StateMessage } from "@/creative-report/components/states/StateMessage";
import { OverviewSkeleton } from "@/creative-report/components/states/Skeletons";
import type { BucketKey } from "@/creative-report/lib/paramSchema";

export function Overview() {
  const data = useCreativeData();
  const navigate = useNavigate();
  // Lifted so a recommendation's action can open the matching bucket tab.
  const [activeBucket, setActiveBucket] = useState<BucketKey | undefined>(undefined);

  if (data.status === "loading") return <OverviewSkeleton />;
  if (data.status === "error") {
    return (
      <StateMessage
        variant="error"
        title="Couldn't load your creatives"
        body="Something went wrong fetching this report. Your filters are still applied — try again."
        actionLabel="Retry"
        onAction={() => navigate(0)}
      />
    );
  }
  if (data.status === "empty") {
    return (
      <StateMessage
        variant="empty"
        title="No ad account connected"
        body="Connect an ad account to start seeing which creatives to kill, scale, or iterate."
        actionLabel="Connect ad account"
        onAction={() => toast({ title: "Connect flow is simulated in this prototype" })}
      />
    );
  }
  if (data.status === "filtered-empty") {
    return (
      <StateMessage
        variant="filtered"
        title="No creatives match these filters"
        body="Nothing in the current date range and filters. Clear them to see your full book."
      />
    );
  }

  const total = data.rollups.length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-6">
      <header className="cr-stagger flex items-start justify-between gap-4" style={{ ["--i" as string]: 0 }}>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Morning triage</h1>
          <p className="text-sm text-muted-foreground">
            {data.buckets.fatiguing + data.buckets.winners + data.buckets.new > 0
              ? `${data.buckets.fatiguing} fatiguing, ${data.buckets.winners} winning, ${data.buckets.new} new to review across ${total} active creatives.`
              : `${total} active creatives in view.`}
          </p>
        </div>
        <TrustMeterChip />
      </header>

      <div className="cr-stagger" style={{ ["--i" as string]: 1 }}>
        <BucketTabs
          rollups={data.rollups}
          buckets={data.buckets}
          active={activeBucket}
          onActiveChange={setActiveBucket}
        />
      </div>

      <div className="cr-stagger" style={{ ["--i" as string]: 2 }}>
        <OverviewBreakdown rollups={data.rollups} />
      </div>

      <div className="cr-stagger" style={{ ["--i" as string]: 3 }}>
        <RecommendationsCard rollups={data.rollups} onOpenBucket={setActiveBucket} />
      </div>

      <div className="cr-stagger" style={{ ["--i" as string]: 4 }}>
        <AutomationsPreview />
      </div>
    </div>
  );
}
