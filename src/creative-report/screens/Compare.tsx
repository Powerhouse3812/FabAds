/**
 * Compare — side-by-side creatives, or one creative across accounts and
 * platforms (handoff §5.4). Selection lives in `ids` + `mode` URL params so
 * a comparison is shareable/back-button-friendly like the rest of the module.
 *
 * "creatives" mode: up to 4 whole-creative CompareColumns.
 * "contexts" mode: the FIRST selected creative broken out one column per
 * platform it runs on — never summed across platforms (different attribution
 * windows), just shown side by side with a warning when it spans >1 platform.
 */
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreativeData } from "@/creative-report/hooks/useCreativeData";
import { useReportParams } from "@/creative-report/hooks/useReportParams";
import { CompareColumn, type CompareMetrics } from "@/creative-report/components/CompareColumn";
import { CreativePicker } from "@/creative-report/components/CreativePicker";
import { CreativeThumb } from "@/creative-report/components/CreativeThumb";
import { StateMessage } from "@/creative-report/components/states/StateMessage";
import { foldRows, type CreativeRollup } from "@/creative-report/lib/selectors";
import { P, PLATFORM_LABELS, type Platform } from "@/creative-report/lib/paramSchema";
import { ACCOUNT_BY_ID } from "@/data/accounts";
import type { AdInstance, DailyRow } from "@/data/model";

const MAX_COMPARE = 4;

function metricsFromFolded(m: {
  spend: number;
  roas: number;
  cpa: number | null;
  ctr: number;
  cvr: number;
  frequency: number;
  hookRate: number | null;
}): CompareMetrics {
  return {
    spend: m.spend,
    roas: m.roas,
    cpa: m.cpa,
    ctr: m.ctr,
    cvr: m.cvr,
    frequency: m.frequency,
    hookRate: m.hookRate,
  };
}

/** Fold an instance group's daily rows clipped to the report's date window. */
function foldInstancesInRange(
  instances: AdInstance[],
  from: string,
  to: string,
  isVideo: boolean,
) {
  const rows: DailyRow[] = [];
  for (const inst of instances) {
    for (const r of inst.daily) {
      if (r.date >= from && r.date <= to) rows.push(r);
    }
  }
  return foldRows(rows, isVideo);
}

/** Daily revenue trend for the sparkline — additive, safe to sum. */
function revenueSeries(instances: AdInstance[], from: string, to: string): number[] {
  const byDate = new Map<string, number>();
  for (const inst of instances) {
    for (const r of inst.daily) {
      if (r.date >= from && r.date <= to) {
        byDate.set(r.date, (byDate.get(r.date) ?? 0) + r.revenue);
      }
    }
  }
  return [...byDate.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([, v]) => v);
}

function accountLabelFor(accountIds: string[]): string {
  if (accountIds.length === 0) return "";
  if (accountIds.length === 1) return ACCOUNT_BY_ID[accountIds[0]]?.name ?? accountIds[0];
  return `${accountIds.length} accounts`;
}

export function Compare() {
  const data = useCreativeData();
  const { view, setParam } = useReportParams();
  const navigate = useNavigate();

  if (data.status === "loading") {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading comparison…</div>
    );
  }
  if (data.status === "error") {
    return (
      <StateMessage
        variant="error"
        title="Couldn't load your creatives"
        body="Something went wrong loading this report. Your filters are still applied — try again."
        actionLabel="Retry"
        onAction={() => navigate(0)}
      />
    );
  }
  if (data.status === "empty" || data.status === "filtered-empty") {
    return (
      <StateMessage
        variant={data.status === "empty" ? "empty" : "filtered"}
        title={data.status === "empty" ? "No creatives yet" : "No creatives match your filters"}
        body={
          data.status === "empty"
            ? "Once ads start running you'll be able to compare creatives here."
            : "Adjust or clear filters to bring creatives back into range, then pick some to compare."
        }
      />
    );
  }

  const selectedIds = view.compareIds;
  const selectedRollups = selectedIds
    .map((id) => data.rollups.find((r) => r.creative.id === id))
    .filter((r): r is CreativeRollup => !!r);

  const setIds = (ids: string[]) => setParam(P.ids, ids.length ? ids.join(",") : null);
  const addId = (id: string) => {
    if (selectedIds.includes(id) || selectedIds.length >= MAX_COMPARE) return;
    setIds([...selectedIds, id]);
  };
  const removeId = (id: string) => setIds(selectedIds.filter((x) => x !== id));

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Compare</h1>
          <p className="text-sm text-muted-foreground">
            Side-by-side creatives, or one creative across accounts and platforms.
          </p>
        </div>
        <div className="inline-flex items-center rounded-md border border-border bg-muted p-0.5">
          <button
            type="button"
            onClick={() => setParam(P.mode, null)}
            className={cn(
              "rounded-[5px] px-3 py-1.5 text-[13px] font-medium transition-colors",
              view.compareMode === "creatives"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Creatives
          </button>
          <button
            type="button"
            onClick={() => setParam(P.mode, "contexts")}
            className={cn(
              "rounded-[5px] px-3 py-1.5 text-[13px] font-medium transition-colors",
              view.compareMode === "contexts"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Across contexts
          </button>
        </div>
      </div>

      {view.compareMode === "creatives" ? (
        <CreativesMode
          rollups={data.rollups}
          selected={selectedRollups}
          selectedIds={selectedIds}
          onAdd={addId}
          onRemove={removeId}
        />
      ) : (
        <ContextsMode
          first={selectedRollups[0] ?? null}
          rollups={data.rollups}
          selectedIds={selectedIds}
          onAdd={addId}
          from={data.filterInput.from}
          to={data.filterInput.to}
        />
      )}
    </div>
  );
}

function CreativesMode({
  rollups,
  selected,
  selectedIds,
  onAdd,
  onRemove,
}: {
  rollups: CreativeRollup[];
  selected: CreativeRollup[];
  selectedIds: string[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const canAddMore = selected.length < MAX_COMPARE;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {selected.map((r) => (
        <CompareColumn
          key={r.creative.id}
          title={r.creative.name}
          subtitle={r.creative.product}
          bucket={r.bucket}
          creative={r.creative}
          metrics={metricsFromFolded(r.metrics)}
          series={r.series.map((p) => p.revenue)}
          onRemove={() => onRemove(r.creative.id)}
        />
      ))}
      {canAddMore && (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-4 text-center">
          <p className="text-sm text-muted-foreground">
            {selected.length < 2 ? "Pick 2–4 creatives to compare" : "Add another creative"}
          </p>
          <CreativePicker
            rollups={rollups}
            selectedIds={selectedIds}
            onAdd={onAdd}
            disabled={!canAddMore}
          />
        </div>
      )}
    </div>
  );
}

function ContextsMode({
  first,
  rollups,
  selectedIds,
  onAdd,
  from,
  to,
}: {
  first: CreativeRollup | null;
  rollups: CreativeRollup[];
  selectedIds: string[];
  onAdd: (id: string) => void;
  from: string;
  to: string;
}) {
  if (!first) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Pick a creative to break it down by platform
        </p>
        <CreativePicker rollups={rollups} selectedIds={selectedIds} onAdd={onAdd} />
      </div>
    );
  }

  const isVideo = first.creative.format === "video";
  const byPlatform = new Map<Platform, AdInstance[]>();
  for (const inst of first.instances) {
    const arr = byPlatform.get(inst.platform) ?? [];
    arr.push(inst);
    byPlatform.set(inst.platform, arr);
  }
  const platforms = [...byPlatform.keys()];
  const isCrossPlatform = platforms.length > 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3">
        <CreativeThumb creative={first.creative} size={36} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{first.creative.name}</p>
          <p className="truncate text-xs text-muted-foreground">{first.creative.product}</p>
        </div>
      </div>

      {isCrossPlatform && (
        <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[13px] text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Different attribution windows — not directly comparable.
        </div>
      )}

      {!isCrossPlatform ? (
        <p className="text-sm text-muted-foreground">
          This creative only runs on one platform — nothing to compare across contexts yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {platforms.map((platform) => {
            const instances = byPlatform.get(platform)!;
            const folded = foldInstancesInRange(instances, from, to, isVideo);
            const accountIds = [...new Set(instances.map((i) => i.accountId))];
            return (
              <CompareColumn
                key={platform}
                title={PLATFORM_LABELS[platform]}
                subtitle={accountLabelFor(accountIds)}
                metrics={metricsFromFolded(folded)}
                series={revenueSeries(instances, from, to)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
