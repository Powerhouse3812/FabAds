/**
 * Overview — the buyer's morning triage screen (handoff §5.1, redesigned).
 *
 * Structure (each fact appears exactly ONCE — the earlier version printed
 * every bucket count three times: in the summary prose, on a count card, and
 * again as a list heading below):
 *   header + one-line state of the book + trust chip + Configure control
 *   BucketTabs          — the count IS the tab; its creatives live inside it
 *   OverviewBreakdown   — Brand / Category / Product (Catalogue dimensions)
 *   AutomationsPreview  — the four routing destinations, not yet wired
 *   RecommendationsCard + TestingVelocityCard — side by side (2-col grid),
 *                         both compact enough to share a row and cut the
 *                         page's vertical scroll (Maalik, 2026-08-01)
 * Every section above is gated on overviewConfig.ts (ConfigureOverviewModal)
 * — all on by default, at least one always stays on.
 *
 * Deliberately NOT here: the portfolio spend/revenue/ROAS/CPA card row (it
 * lives on the main Dashboard — repeating it here was duplication across
 * screens), and the separate Top-movers list (it re-listed the same
 * decliners the Fatiguing bucket already surfaces).
 *
 * Owner-Report merge (Maalik: "owner report can be included in overview,
 * with less data — spend wagahrah ka data nahi chahiye, wo sab main
 * dashboard me hai"): the Owner Report screen is retired. Of its five
 * pieces, only testing velocity survives, as TestingVelocityCard above —
 * zero $ values, a pure cadence signal. Dropped as Dashboard/Overview
 * duplicates, for the same reasons already documented above: its KPI row and
 * spend-vs-revenue trend chart (same portfolio-$-row reasoning), its
 * by-brand table (OverviewBreakdown already covers brand/category/product),
 * and its by-account table (Maalik: "Acc and unka data yaha belong nahi
 * karta" — that table's whole value was its $ columns, which don't belong
 * here). The ReportWizard export dialog is retired with it, replaced by
 * ConfigureOverviewModal, which — unlike that wizard — actually changes what
 * this screen shows.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useCreativeData } from "@/creative-report/hooks/useCreativeData";
import { useReportParams } from "@/creative-report/hooks/useReportParams";
import { BucketTabs } from "@/creative-report/components/BucketTabs";
import { OverviewBreakdown } from "@/creative-report/components/OverviewBreakdown";
import { RecommendationsCard } from "@/creative-report/components/RecommendationsCard";
import { TestingVelocityCard } from "@/creative-report/components/TestingVelocityCard";
import { AutomationsPreview } from "@/creative-report/components/AutomationsPreview";
import { ConfigureOverviewModal } from "@/creative-report/components/ConfigureOverviewModal";
import { useOverviewConfig } from "@/creative-report/lib/overviewConfig";
import { TrustMeterChip } from "@/creative-report/components/TrustMeterChip";
import { StateMessage } from "@/creative-report/components/states/StateMessage";
import { OverviewSkeleton } from "@/creative-report/components/states/Skeletons";
import { P, type BucketKey } from "@/creative-report/lib/paramSchema";

export function Overview() {
  const data = useCreativeData();
  const navigate = useNavigate();
  const { view, setParam } = useReportParams();
  const config = useOverviewConfig();
  const [configureOpen, setConfigureOpen] = useState(false);
  // The active bucket tab lives in the URL (same `bucket` param the grid
  // filters by — the old BucketRow's contract): a shared Overview link opens
  // on the same tab, and a recommendation's action can open a bucket by
  // setting the param. When unset, BucketTabs picks its act-today default.
  const activeBucket = view.bucket ?? undefined;
  const setActiveBucket = (b: BucketKey) => setParam(P.bucket, b);

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

  // Continuous stagger sequence: a hidden section shouldn't leave a gap in
  // the animation delay ladder, so the index only advances for sections that
  // actually render.
  let staggerIndex = 0;
  const nextStagger = () => staggerIndex++;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-6">
      <header
        className="cr-stagger flex items-start justify-between gap-4"
        style={{ ["--i" as string]: nextStagger() }}
      >
        <div>
          <h1 className="text-lg font-semibold text-foreground">Morning triage</h1>
          <p className="text-sm text-muted-foreground">
            {data.buckets.fatiguing + data.buckets.winners + data.buckets.new > 0
              ? `${data.buckets.fatiguing} fatiguing, ${data.buckets.winners} winning, ${data.buckets.new} new to review across ${total} active creatives.`
              : `${total} active creatives in view.`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <TrustMeterChip />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setConfigureOpen(true)}
          >
            <Settings2 className="h-3.5 w-3.5" />
            Configure
          </Button>
        </div>
      </header>

      {config.buckets && (
        <div className="cr-stagger" style={{ ["--i" as string]: nextStagger() }}>
          <BucketTabs
            rollups={data.rollups}
            buckets={data.buckets}
            active={activeBucket}
            onActiveChange={setActiveBucket}
          />
        </div>
      )}

      {config.breakdown && (
        <div className="cr-stagger" style={{ ["--i" as string]: nextStagger() }}>
          <OverviewBreakdown rollups={data.rollups} />
        </div>
      )}

      {config.automations && (
        <div className="cr-stagger" style={{ ["--i" as string]: nextStagger() }}>
          <AutomationsPreview />
        </div>
      )}

      {(config.recommendations || config.velocity) && (
        <div
          className="cr-stagger grid grid-cols-1 gap-6 lg:grid-cols-2"
          style={{ ["--i" as string]: nextStagger() }}
        >
          {config.recommendations && (
            <RecommendationsCard rollups={data.rollups} onOpenBucket={setActiveBucket} />
          )}
          {config.velocity && <TestingVelocityCard rollups={data.rollups} />}
        </div>
      )}

      <ConfigureOverviewModal open={configureOpen} onOpenChange={setConfigureOpen} />
    </div>
  );
}
