/**
 * VisualSummaryPanel — the free (no credit gate) sub-tab of Analysis.
 *
 * Everything here is real, already-folded FB data — never gated, because the
 * report must stay fully useful without ever running an analysis (Maalik:
 * "Analysis is a super + point but with the use of credits. Without this it
 * will be still good."):
 *
 *  - hookRate (video3s ÷ impressions) vs holdRate (thruplays ÷ video3s) —
 *    two genuinely distinct measured numbers. Together they're the "hook
 *    good but rest bad" read, shown prominently and free.
 *  - componentRollups() spend-weighted win-rate for each of this creative's
 *    own tagged element values, across the whole account (real, free).
 *
 * No per-element score for a SINGLE creative is shown here — that number
 * cannot be computed from this data model (no elementId on DailyRow) and
 * belongs only in the credit-gated, clearly-"Predicted" Cognitive Insights
 * sub-tab. Mirrors ComponentBreakdown/BenchmarkPanel's flat hairline-row
 * layout — one sub-container level max.
 */
import { useMemo } from "react";
import { getDataset } from "@/data/generator";
import {
  componentRollups,
  fullRangeFilter,
  type ComponentRow,
  type CreativeRollup,
} from "@/creative-report/lib/selectors";
import { useCreativeData } from "@/creative-report/hooks/useCreativeData";
import { median } from "@/creative-report/lib/stats";
import { useBucketThresholds } from "@/creative-report/lib/thresholds";
import type { ComponentKind, Creative } from "@/data/model";
import type { ComponentTab } from "@/creative-report/lib/paramSchema";
import { fmtPct, NA_NO_VIDEO } from "@/creative-report/lib/format";
import { ConfidenceChip } from "@/creative-report/components/ConfidenceChip";
import { MeasuredBadge } from "@/creative-report/drawer/analysis/AnalysisBadges";

const TAB_FOR_KIND: Record<ComponentKind, ComponentTab> = {
  hook: "hooks",
  headline: "headlines",
  "primary-text": "primary-text",
  cta: "ctas",
  "visual-style": "visual-styles",
};

const KIND_LABEL: Record<ComponentKind, string> = {
  hook: "Hook",
  headline: "Headline",
  "primary-text": "Primary text",
  cta: "CTA",
  "visual-style": "Visual style",
};

const KINDS: readonly ComponentKind[] = ["hook", "headline", "primary-text", "cta", "visual-style"];

function valueForKind(creative: Creative, kind: ComponentKind): string {
  switch (kind) {
    case "hook":
      return creative.components.hook;
    case "headline":
      return creative.components.headline;
    case "primary-text":
      return creative.components.primaryText;
    case "cta":
      return creative.components.cta;
    case "visual-style":
      return creative.components.visualStyle;
  }
}

interface TagRow {
  kind: ComponentKind;
  value: string;
  row: ComponentRow | null;
}

export function VisualSummaryPanel({ rollup }: { rollup: CreativeRollup }) {
  const { creative, metrics } = rollup;
  const isVideo = creative.format === "video";
  const thresholds = useBucketThresholds();

  const tagRows = useMemo<TagRow[]>(() => {
    const dataset = getDataset();
    const filter = fullRangeFilter();
    return KINDS.map((kind) => {
      const rows = componentRollups(dataset, filter, TAB_FOR_KIND[kind], thresholds);
      const value = valueForKind(creative, kind);
      const row = rows.find((r) => r.value === value) ?? null;
      return { kind, value, row };
    });
  }, [creative, thresholds]);

  // Real median hook/hold rate across the video creatives in the CURRENT
  // filtered view (not a hardcoded constant, not the whole-account fold
  // tagRows above uses) — so "above/below" is an honest comparison against
  // data that's actually in scope, not an invented benchmark constant.
  const { rollups: viewRollups } = useCreativeData();
  const hookMedian = useMemo(
    () => median(viewRollups.map((r) => r.metrics.hookRate).filter((v): v is number => v !== null)),
    [viewRollups],
  );
  const holdMedian = useMemo(
    () => median(viewRollups.map((r) => r.metrics.holdRate).filter((v): v is number => v !== null)),
    [viewRollups],
  );

  const hookAbove = metrics.hookRate !== null && hookMedian !== null && metrics.hookRate > hookMedian;
  const holdAbove = metrics.holdRate !== null && holdMedian !== null && metrics.holdRate > holdMedian;
  const canCompare =
    metrics.hookRate !== null && metrics.holdRate !== null && hookMedian !== null && holdMedian !== null;
  const splitNote = !canCompare
    ? null
    : hookAbove && !holdAbove
      ? "The hook is earning the scroll-stop, but something after it is losing viewers before they finish — worth testing the body or CTA before touching the hook."
      : !hookAbove && holdAbove
        ? "Viewers who stop tend to stay, but the hook itself isn't earning enough stops — worth testing a stronger opening before anything downstream."
        : hookAbove && holdAbove
          ? "Both the hook and the hold are pulling their weight here — a rare clean read."
          : "Neither the hook nor the hold is clearing your median for the current view — the whole opening third may need a rework, not just one piece.";
  const noMedianNote =
    isVideo && (metrics.hookRate !== null || metrics.holdRate !== null) && !canCompare
      ? "Not enough other video creatives in the current view yet to compare against a median — showing raw rates only."
      : null;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground">Hook vs. hold</span>
          <MeasuredBadge />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Two distinct, already-measured numbers — hook rate is whole-ad delivery through 3s;
          hold rate is retention among the people who stopped.
        </p>

        {!isVideo ? (
          <p className="mt-3 text-sm text-muted-foreground">{NA_NO_VIDEO}</p>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Hook rate <span className="normal-case text-muted-foreground/70">(video3s ÷ impressions)</span>
                </p>
                {metrics.hookRate === null ? (
                  <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                    Not enough data yet (n={metrics.impressions})
                  </p>
                ) : (
                  <>
                    <p className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">
                      {fmtPct(metrics.hookRate, 1)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {hookMedian === null
                        ? "no median yet for this view"
                        : `vs your median ${fmtPct(hookMedian, 1)}`}
                    </p>
                  </>
                )}
              </div>
              <div className="rounded-lg border border-border px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Hold rate <span className="normal-case text-muted-foreground/70">(thruplays ÷ video3s)</span>
                </p>
                {metrics.holdRate === null ? (
                  <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                    Not enough data yet (n={metrics.video3s ?? 0})
                  </p>
                ) : (
                  <>
                    <p className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">
                      {fmtPct(metrics.holdRate, 1)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {holdMedian === null
                        ? "no median yet for this view"
                        : `vs your median ${fmtPct(holdMedian, 1)}`}
                    </p>
                  </>
                )}
              </div>
            </div>
            {splitNote && <p className="mt-2 text-xs text-muted-foreground">{splitNote}</p>}
            {noMedianNote && <p className="mt-2 text-xs text-muted-foreground">{noMedianNote}</p>}
          </>
        )}
      </div>

      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground">Element win-rates</span>
          <MeasuredBadge />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Spend-weighted win-rate for this creative's own tagged values, across every creative that
          shares them — real data folded from daily rows, not a per-element score for this creative alone.
        </p>

        <div className="mt-2">
          {tagRows.map(({ kind, value, row }) => (
            <div
              key={kind}
              className="grid grid-cols-[minmax(0,120px)_1fr_auto] items-start gap-4 border-b border-border py-2.5 last:border-0"
            >
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{KIND_LABEL[kind]}</p>
                <p className="truncate text-sm font-medium text-foreground" title={value}>
                  {value}
                </p>
              </div>
              {row ? (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium tabular-nums text-foreground">{fmtPct(row.winRate, 0)}</span> win-rate
                  {" · "}
                  <span className={row.vsMedianPct >= 0 ? "text-primary-text" : "text-destructive"}>
                    {row.vsMedianPct >= 0 ? "+" : ""}
                    {row.vsMedianPct.toFixed(0)}pp vs median
                  </span>
                  {" · n="}
                  {row.creativeCount} creatives
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Not enough data to fold a win-rate yet.</p>
              )}
              {row ? (
                <ConfidenceChip confidence={row.confidence} />
              ) : (
                <ConfidenceChip confidence="low" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
