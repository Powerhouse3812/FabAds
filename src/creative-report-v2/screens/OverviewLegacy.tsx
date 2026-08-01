/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  FROZEN SNAPSHOT — Creative Report 2.0                               │
 * │  `src/creative-report-v2/` is a verbatim copy of `src/creative-report`│
 * │  at commit b5f1cda. DO NOT MODIFY IT as part of 3.0 work — all        │
 * │  ongoing changes belong in `src/creative-report/`. Nothing here may   │
 * │  import from the 3.0 module.                                          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * OverviewLegacy — Creative Report 2.0's Overview, the buyer's morning triage
 * screen (handoff §5.1). This is the CURRENTLY-DEPLOYED Overview, restored
 * byte-for-byte from production (commit 38583c3) except for the two changes
 * required to make it coexist with 3.0:
 *   1. renamed `Overview` → `OverviewLegacy` (3.0's redesigned screen keeps
 *      the `Overview` name in screens/Overview.tsx),
 *   2. the hardcoded `/reports/creative-v2/creatives` literal now resolves
 *      through useReportBasePath() like every other link in the module.
 * Its three private components live in components/legacy/ for the same reason
 * — they are 2.0-only and must not be confused with the 3.0 set.
 *
 * Answers "what do I do today?" in one glance: auto-categorised buckets,
 * a fatiguing-now action list, top movers, and 4 KPI cards. Buckets click
 * through to the grid with the filter context preserved.
 */
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useCreativeData } from "@/creative-report-v2/hooks/useCreativeData";
import { useReportParams } from "@/creative-report-v2/hooks/useReportParams";
import { buildPreservedSearch } from "@/creative-report-v2/components/PreserveParamsLink";
import { BucketRow } from "@/creative-report-v2/components/legacy/BucketRow";
import { KpiCards } from "@/creative-report-v2/components/KpiCards";
import { FatiguingNowList } from "@/creative-report-v2/components/legacy/FatiguingNowList";
import { TopMovers } from "@/creative-report-v2/components/legacy/TopMovers";
import { TrustMeterChip } from "@/creative-report-v2/components/TrustMeterChip";
import { StateMessage } from "@/creative-report-v2/components/states/StateMessage";
import { OverviewSkeleton } from "@/creative-report-v2/components/states/Skeletons";
import { useReportBasePath } from "@/creative-report-v2/state/ReportBasePathContext";
import type { BucketKey } from "@/creative-report-v2/lib/paramSchema";
import type { CreativeRollup } from "@/creative-report-v2/lib/selectors";

export function OverviewLegacy() {
  const data = useCreativeData();
  const { filters, view } = useReportParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const basePath = useReportBasePath();

  const goCreatives = (extra: string) => {
    navigate(`${basePath}/creatives${buildPreservedSearch(searchParams, extra)}`);
  };

  const onSelectBucket = (b: BucketKey) => goCreatives(`bucket=${b}`);
  const onView = (id: string) => goCreatives(`creative=${id}`);
  const onIterate = (r: CreativeRollup) => {
    const { creative } = r;
    navigate(
      `/genie/new?concept=${encodeURIComponent(creative.id)}&angle=${encodeURIComponent(
        creative.angleId,
      )}&hook=${encodeURIComponent(creative.components.hook)}&from=${encodeURIComponent(basePath)}`,
    );
  };
  const onPause = (r: CreativeRollup) => {
    // Real friction dialog + optimistic pause arrives with the actions layer.
    toast({
      title: "Pause needs confirmation",
      description: `Open ${r.creative.product} to pause it — spend-affecting actions ask first.`,
    });
  };

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
        <BucketRow buckets={data.buckets} activeBucket={view.bucket} onSelect={onSelectBucket} />
      </div>

      <div className="cr-stagger" style={{ ["--i" as string]: 2 }}>
        <KpiCards kpis={data.kpis} compareEnabled={filters.compareEnabled} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section
          className="cr-stagger rounded-xl border border-border bg-card p-4"
          style={{ ["--i" as string]: 3 }}
        >
          <FatiguingNowList
            items={data.fatiguing}
            onView={onView}
            onPause={onPause}
            onIterate={onIterate}
          />
        </section>
        <section
          className="cr-stagger rounded-xl border border-border bg-card p-4"
          style={{ ["--i" as string]: 4 }}
        >
          <TopMovers items={data.movers} onView={onView} />
        </section>
      </div>
    </div>
  );
}
