/**
 * Compare — side-by-side creatives, or one creative across accounts and
 * platforms (handoff §5.4). Selection lives in `ids` + `mode` URL params so
 * a comparison is shareable/back-button-friendly like the rest of the module.
 *
 * "creatives" mode: up to MAX_COMPARE (5) whole-creative CompareColumns.
 * "contexts" mode: the FIRST selected creative broken out one column per
 * platform it runs on — never summed across platforms (different attribution
 * windows), just shown side by side with a warning when it spans >1 platform.
 *
 * Selection now lives in the floating compare tray (`lib/compareTrayStore`),
 * shared across the whole module — clicking "Compare" on a creative card
 * adds to it instead of navigating here. This screen still owns the
 * shareable `?ids=` URL param: on mount, a URL with ids wins (so a shared
 * link shows exactly what it says) and seeds the tray; after that the tray
 * is the source of truth and this screen mirrors it back into the URL. See
 * the mount effects below for exactly how that reconciliation is guarded
 * against a URL <-> store feedback loop.
 *
 * Element composer (replaces the standalone Brief Builder screen): once 2+
 * creatives are being compared in "creatives" mode / cards view, each column
 * can hand individual elements (hook, headline, CTA, media, …) to a bottom
 * ComposerBar, which assembles a cross-creative set and sends it to Genie in
 * one go — see components/composer/*.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { WhyDot } from "@/creative-report/components/WhyDot";
import { useCreativeData } from "@/creative-report/hooks/useCreativeData";
import { useReportParams } from "@/creative-report/hooks/useReportParams";
import { CompareColumn, type CompareMetrics } from "@/creative-report/components/CompareColumn";
import { CompareLineChart } from "@/creative-report/components/CompareLineChart";
import { CompareBarChart } from "@/creative-report/components/CompareBarChart";
import { CreativePicker } from "@/creative-report/components/CreativePicker";
import { CreativeThumb } from "@/creative-report/components/CreativeThumb";
import { StateMessage } from "@/creative-report/components/states/StateMessage";
import { ComposerBar } from "@/creative-report/components/composer/ComposerBar";
import {
  useElementComposer,
  type ElementComposer,
} from "@/creative-report/components/composer/useElementComposer";
import { buildGenieHandoffUrl } from "@/creative-report/components/composer/genieHandoff";
import {
  useAnalysisSnapshot,
  deriveFrameworkStatus,
  canRunAnalysis,
  runAnalysis,
} from "@/creative-report/components/composer/frameworkGate";
import type { ColumnComposerProps } from "@/creative-report/components/composer/types";
import { foldRows, type CreativeRollup } from "@/creative-report/lib/selectors";
import { P, PLATFORM_LABELS, type Platform } from "@/creative-report/lib/paramSchema";
import { useReportBasePath } from "@/creative-report/state/ReportBasePathContext";
import {
  useCompareTray,
  addToCompare,
  removeFromCompare,
  setCompareIds,
  MAX_COMPARE,
} from "@/creative-report/lib/compareTrayStore";
import { ACCOUNT_BY_ID } from "@/data/accounts";
import type { AdInstance, DailyRow } from "@/data/model";

/** Chart-view axis — separate from compareMode (creatives/contexts), applies
 *  within either mode. Presentational only, so it's local state, not a URL
 *  param. */
type ChartViewMode = "cards" | "line" | "bar";

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

/** Daily revenue trend, dates kept — additive within a platform, safe to
 *  sum across that platform's own instances (never across platforms). Used
 *  by the Line chart, which needs the date axis. */
function revenueSeriesWithDates(
  instances: AdInstance[],
  from: string,
  to: string,
): { date: string; value: number }[] {
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
    .map(([date, value]) => ({ date, value }));
}

/** Same series, values only — for the CompareColumn sparkline which doesn't
 *  need a real date axis. */
function revenueSeries(instances: AdInstance[], from: string, to: string): number[] {
  return revenueSeriesWithDates(instances, from, to).map((p) => p.value);
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
  const basePath = useReportBasePath();
  const [viewMode, setViewMode] = useState<ChartViewMode>("cards");
  const composer = useElementComposer();

  // Built once per data load — element picks need every creative's real
  // metrics/thumbnail for the composer sheet, not just the ones currently
  // selected for comparison (a picked creative can be removed from Compare
  // without losing its already-picked elements).
  const rollupsById = useMemo(() => {
    const map = new Map<string, CreativeRollup>();
    for (const r of data.status === "ready" ? data.rollups : []) map.set(r.creative.id, r);
    return map;
  }, [data]);
  const angleIdByCreativeId = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of data.status === "ready" ? data.rollups : [])
      map.set(r.creative.id, r.creative.angleId);
    return map;
  }, [data]);

  // ONE subscription to the tray store (store discipline) — every value
  // below is read off this single `useCompareTray()` snapshot, never a
  // second subscription to the underlying external store.
  const tray = useCompareTray();
  const [trayHydrated, setTrayHydrated] = useState(false);

  // Reconcile the tray with the `?ids=` URL param — runs its "wins" half
  // exactly once, on mount.
  //
  // A URL with ids wins on load: a shared/bookmarked Compare link must show
  // exactly what it says, so if the URL already has ids when this screen
  // mounts, they're pushed into the tray (capped at MAX_COMPARE) here. After
  // that the tray is the source of truth for the rest of the session.
  //
  // Loop guard, part 1: the empty dependency array means this effect body
  // only ever runs once per mount. A later add/remove flows tray -> URL (see
  // the effect below), never URL -> here again, so this can't re-fire and
  // stomp a since-changed tray back to the original link's contents.
  useEffect(() => {
    if (view.compareIds.length > 0) {
      setCompareIds(view.compareIds);
    }
    setTrayHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Loop guard, part 2: mirror the tray back into the URL, but ONLY react to
  // `tray.ids` (and the one-time `trayHydrated` flip) — `view.compareIds` is
  // deliberately absent from the dependency list. That's what makes this a
  // one-way tray -> URL sync instead of a URL -> store -> URL bounce: a URL
  // change alone (including the one this very effect just made) never
  // re-runs it, only a genuine tray mutation does. It's also a no-op
  // whenever the two already agree, so the initial-hydration render (where
  // the effect above just set the tray to match the URL) doesn't fire a
  // redundant history write.
  useEffect(() => {
    if (!trayHydrated) return;
    const next = tray.ids;
    const current = view.compareIds;
    const same = current.length === next.length && current.every((id, i) => id === next[i]);
    if (!same) setParam(P.ids, next.length ? next.join(",") : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trayHydrated, tray.ids]);

  function handleSendToGenie() {
    navigate(buildGenieHandoffUrl(composer.picks, basePath, angleIdByCreativeId));
  }

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

  // The tray is the source of truth once hydrated (see the effects above).
  // Before that first effect flush completes, fall back to the raw URL ids
  // so a shared/bookmarked link paints its columns immediately instead of
  // flashing an empty grid for one frame while hydration is in flight.
  const selectedIds = trayHydrated || tray.ids.length > 0 ? tray.ids : view.compareIds;
  const selectedRollups = selectedIds
    .map((id) => data.rollups.find((r) => r.creative.id === id))
    .filter((r): r is CreativeRollup => !!r);

  // Adds/removes flow tray -> screen: both go straight through the shared
  // store (which already owns dedupe + the MAX_COMPARE cap), and the sync
  // effect above mirrors the result back into the URL. Removing a column
  // here also has to drop it from the floating tray — otherwise the tray
  // would silently re-add it on the next render and the two would disagree.
  const addId = (id: string) => {
    addToCompare(id);
  };
  const removeId = (id: string) => {
    removeFromCompare(id);
  };

  return (
    <div className="flex min-h-full flex-col p-6">
      <div className="flex-1 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Compare</h1>
            <p className="text-sm text-muted-foreground">
              Side-by-side creatives, or one creative across accounts and platforms.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
            <div className="inline-flex items-center rounded-md border border-border bg-muted p-0.5">
              {(
                [
                  { key: "cards", label: "Cards" },
                  { key: "line", label: "Line" },
                  { key: "bar", label: "Bar" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setViewMode(opt.key)}
                  className={cn(
                    "rounded-[5px] px-3 py-1.5 text-[13px] font-medium transition-colors",
                    viewMode === opt.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {view.compareMode === "creatives" ? (
          <CreativesMode
            rollups={data.rollups}
            selected={selectedRollups}
            selectedIds={selectedIds}
            onAdd={addId}
            onRemove={removeId}
            viewMode={viewMode}
            composer={composer}
          />
        ) : (
          <ContextsMode
            first={selectedRollups[0] ?? null}
            rollups={data.rollups}
            selectedIds={selectedIds}
            onAdd={addId}
            from={data.filterInput.from}
            to={data.filterInput.to}
            viewMode={viewMode}
          />
        )}
      </div>

      {/* Pick affordances only exist in creatives mode + cards view. The bar
          hides itself when it's empty AND unactionable there; with picks it
          stays so "Review & send" is never stranded (picks persist across
          mode/view switches). */}
      <ComposerBar
        composer={composer}
        rollupsById={rollupsById}
        onSend={handleSendToGenie}
        pickersAvailable={view.compareMode === "creatives" && viewMode === "cards"}
      />
    </div>
  );
}

function CreativesMode({
  rollups,
  selected,
  selectedIds,
  onAdd,
  onRemove,
  viewMode,
  composer,
}: {
  rollups: CreativeRollup[];
  selected: CreativeRollup[];
  selectedIds: string[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  viewMode: ChartViewMode;
  composer: ElementComposer;
}) {
  const canAddMore = selected.length < MAX_COMPARE;
  // ONE useSyncExternalStore subscription regardless of how many creatives
  // are selected (2-MAX_COMPARE) — per-creative status below is a pure
  // derivation, not a hook, so it's safe to call per item in the .map().
  const analysisSnapshot = useAnalysisSnapshot();

  if (viewMode !== "cards") {
    if (selected.length === 0) {
      return (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-4 text-center">
          <p className="text-sm text-muted-foreground">Pick 2–{MAX_COMPARE} creatives to compare</p>
          <CreativePicker rollups={rollups} selectedIds={selectedIds} onAdd={onAdd} />
        </div>
      );
    }
    return (
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {selected.length} of {MAX_COMPARE} creatives
          </p>
          {canAddMore && (
            <CreativePicker
              rollups={rollups}
              selectedIds={selectedIds}
              onAdd={onAdd}
              disabled={!canAddMore}
            />
          )}
        </div>
        {viewMode === "line" ? (
          <CompareLineChart
            columns={selected.map((r) => ({
              key: r.creative.id,
              title: r.creative.name,
              points: r.series.map((p) => ({ date: p.date, value: p.revenue })),
            }))}
          />
        ) : (
          <CompareBarChart
            columns={selected.map((r) => ({
              key: r.creative.id,
              title: r.creative.name,
              metrics: metricsFromFolded(r.metrics),
            }))}
          />
        )}
      </div>
    );
  }

  return (
    // Held at lg:grid-cols-4 even though MAX_COMPARE is 5: at ~1100px content
    // width, 5 even columns would squeeze each CompareColumn's thumbnail +
    // metrics + sparkline below a comfortable width, and the standing rule
    // here is "don't compress the 4/8/16/24/32 scale to force a fit." A 5th
    // selected creative (or the still-open add-slot below it) wraps to its
    // own row instead — the same wrap the add-slot already produced at 4/4
    // before this change, so the layout doesn't gain a new code path.
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {selected.map((r) => {
        const frameworkStatus = deriveFrameworkStatus(analysisSnapshot, r.creative.id);
        const folded = metricsFromFolded(r.metrics);
        const composerSlot: ColumnComposerProps = {
          picks: composer.picks,
          frameworkStatus,
          canRunAnalysis: canRunAnalysis(analysisSnapshot),
          onPickText: (key, value) => composer.pickText(key, r.creative, value, folded),
          onPickMedia: () => composer.pickMedia(r.creative, folded),
          onPickFramework: () => composer.pickFramework(r.creative, folded),
          onPickWholeAd: () =>
            composer.pickWholeAd(r.creative, folded, frameworkStatus === "analysed"),
          onRunAnalysis: () => runAnalysis(r.creative.id),
        };
        return (
          <CompareColumn
            key={r.creative.id}
            title={r.creative.name}
            subtitle={r.creative.product}
            bucket={r.bucket}
            creative={r.creative}
            metrics={folded}
            series={r.series.map((p) => p.revenue)}
            onRemove={() => onRemove(r.creative.id)}
            composerSlot={composerSlot}
          />
        );
      })}
      {canAddMore && (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-4 text-center">
          <p className="text-sm text-muted-foreground">
            {selected.length < 2 ? `Pick 2–${MAX_COMPARE} creatives to compare` : "Add another creative"}
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
  viewMode,
}: {
  first: CreativeRollup | null;
  rollups: CreativeRollup[];
  selectedIds: string[];
  onAdd: (id: string) => void;
  from: string;
  to: string;
  viewMode: ChartViewMode;
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
          <WhyDot id="compare.crossPlatformWarning" className="text-amber-700/70 hover:text-amber-700 dark:text-amber-400/70 dark:hover:text-amber-400" />
        </div>
      )}

      {!isCrossPlatform ? (
        <p className="text-sm text-muted-foreground">
          This creative only runs on one platform — nothing to compare across contexts yet.
        </p>
      ) : viewMode === "cards" ? (
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
      ) : (
        <div className="rounded-xl border border-border bg-card p-4">
          {viewMode === "line" ? (
            <CompareLineChart
              columns={platforms.map((platform) => {
                const instances = byPlatform.get(platform)!;
                return {
                  key: platform,
                  title: PLATFORM_LABELS[platform],
                  points: revenueSeriesWithDates(instances, from, to),
                };
              })}
            />
          ) : (
            <CompareBarChart
              columns={platforms.map((platform) => {
                const instances = byPlatform.get(platform)!;
                const folded = foldInstancesInRange(instances, from, to, isVideo);
                return {
                  key: platform,
                  title: PLATFORM_LABELS[platform],
                  metrics: metricsFromFolded(folded),
                };
              })}
            />
          )}
        </div>
      )}
    </div>
  );
}
