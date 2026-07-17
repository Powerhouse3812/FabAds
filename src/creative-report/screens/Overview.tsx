/**
 * Overview — the buyer's morning triage screen (handoff §5.1).
 * Answers "what do I do today?" in one glance: auto-categorised buckets,
 * a fatiguing-now action list, top movers, and 4 KPI cards. Buckets click
 * through to the grid with the filter context preserved.
 */
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useCreativeData } from "@/creative-report/hooks/useCreativeData";
import { useReportParams } from "@/creative-report/hooks/useReportParams";
import { buildPreservedSearch } from "@/creative-report/components/PreserveParamsLink";
import { BucketRow } from "@/creative-report/components/BucketRow";
import { KpiCards } from "@/creative-report/components/KpiCards";
import { FatiguingNowList } from "@/creative-report/components/FatiguingNowList";
import { TopMovers } from "@/creative-report/components/TopMovers";
import { StateMessage } from "@/creative-report/components/states/StateMessage";
import { OverviewSkeleton } from "@/creative-report/components/states/Skeletons";
import type { BucketKey } from "@/creative-report/lib/paramSchema";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

const CREATIVES_PATH = "/reports/creative-v2/creatives";

export function Overview() {
  const data = useCreativeData();
  const { filters, view } = useReportParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const goCreatives = (extra: string) => {
    navigate(`${CREATIVES_PATH}${buildPreservedSearch(searchParams, extra)}`);
  };

  const onSelectBucket = (b: BucketKey) => goCreatives(`bucket=${b}`);
  const onView = (id: string) => goCreatives(`creative=${id}`);
  const onIterate = (r: CreativeRollup) => {
    const { creative } = r;
    navigate(
      `/genie/new?concept=${encodeURIComponent(creative.id)}&angle=${encodeURIComponent(
        creative.angleId,
      )}&hook=${encodeURIComponent(creative.components.hook)}`,
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
      <header className="cr-stagger" style={{ ["--i" as string]: 0 }}>
        <h1 className="text-lg font-semibold text-foreground">Morning triage</h1>
        <p className="text-sm text-muted-foreground">
          {data.buckets.fatiguing + data.buckets.winners + data.buckets.new > 0
            ? `${data.buckets.fatiguing} fatiguing, ${data.buckets.winners} winning, ${data.buckets.new} new to review across ${total} active creatives.`
            : `${total} active creatives in view.`}
        </p>
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
