/**
 * ComponentBreakdown — Hook / Headline / Primary text / CTA / Visual style
 * rows, each with a hypothesis-framed signal line + confidence chip (handoff
 * §5.2). No composite score — every row states its own confidence honestly.
 *
 * Headline/Primary text/Visual style also carry the "possible drop point"
 * marker when the data layer's `likelyDropElement` points at them (Hook/CTA
 * share that value with the script's hook/CTA lines, so their marker lives in
 * ScriptElementsPanel instead — showing it twice would be redundant).
 */
import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { ConfidenceChip, type ChipConfidence } from "@/creative-report/components/ConfidenceChip";
import { WhyDot } from "@/creative-report/components/WhyDot";
import { useCreativeData } from "@/creative-report/hooks/useCreativeData";
import { fmtPct } from "@/creative-report/lib/format";
import { median } from "@/creative-report/lib/stats";
import type { ComponentKind } from "@/data/model";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

/** At least this many video creatives must carry a hook rate in the current
 *  view before "above/below your median" means anything — a median of one
 *  value is just that value, and comparing a creative to itself always reads
 *  "below". Under this, the row states the raw rate and no comparison. */
const MIN_PEERS_FOR_MEDIAN = 2;

interface Row {
  kind: string;
  componentKind: ComponentKind;
  value: string;
  signal: string;
  confidence: ChipConfidence;
}

/** Small inline marker for a possible (never certain) drop point — mirrors
 *  ScriptElementsPanel's DropMarker so the two bands read as one system. */
function DropMarker() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
      <AlertTriangle className="h-3.5 w-3.5" />
      Possible drop point
    </span>
  );
}

/** @param hookMedian real median hook rate across the video creatives in the
 *  current filtered view, or null when there aren't enough of them to compare
 *  against — in which case the row states the raw rate and stops there. */
function buildRows(rollup: CreativeRollup, hookMedian: number | null): Row[] {
  const { creative, metrics, confidence } = rollup;
  const isVideo = creative.format === "video";

  const hookSignal = !isVideo
    ? "N/A — no video on this creative."
    : metrics.hookRate === null
      ? "Not enough video data yet to read a 3s-view rate."
      : hookMedian === null
        ? `3s-view rate is ${fmtPct(metrics.hookRate, 0)} — not enough other video creatives in the current view to compare it against a median yet.`
        : (() => {
            const above = metrics.hookRate! > hookMedian;
            return `3s-view rate is ${fmtPct(metrics.hookRate!, 0)} — ${above ? "above" : "below"} your median of ${fmtPct(hookMedian, 0)} for the current view; the hook may be ${above ? "carrying" : "limiting"} the scroll-stop.`;
          })();

  return [
    {
      kind: "Hook",
      componentKind: "hook",
      value: creative.components.hook,
      signal: hookSignal,
      confidence: !isVideo ? "na" : confidence,
    },
    {
      kind: "Headline",
      componentKind: "headline",
      value: creative.components.headline,
      signal: `Headlines like "${creative.components.headline}" set the promise early — testing a benefit-led variant against it could reveal whether specificity is the lever.`,
      confidence,
    },
    {
      kind: "Primary text",
      componentKind: "primary-text",
      value: creative.components.primaryText,
      signal: `The "${creative.components.primaryText}" angle carries the body copy — worth testing a shorter, more direct version to see if brevity moves CVR.`,
      confidence: "low",
    },
    {
      kind: "CTA",
      componentKind: "cta",
      value: creative.components.cta,
      signal: `Direct CTAs like "${creative.components.cta}" tend to convert warm traffic — worth A/B testing against a softer ask.`,
      confidence: "low",
    },
    {
      kind: "Visual style",
      componentKind: "visual-style",
      value: creative.components.visualStyle,
      signal: `A "${creative.components.visualStyle}" treatment sets the first impression — worth testing against a contrasting style to see if the format itself is the lever.`,
      confidence: "low",
    },
  ];
}

// Hook/CTA share their drop-attribution value with the script's hook/CTA
// lines (ScriptElementsPanel already marks those) — avoid a duplicate marker.
const MARKED_HERE: readonly ComponentKind[] = ["headline", "primary-text", "visual-style"];

export function ComponentBreakdown({ rollup }: { rollup: CreativeRollup }) {
  // Real median hook rate across the video creatives in the CURRENT filtered
  // view — same derivation VisualSummaryPanel's hook/hold read uses, so the
  // two surfaces can never disagree. Never a hardcoded benchmark constant.
  const { rollups: viewRollups } = useCreativeData();
  const hookMedian = useMemo(() => {
    const rates = viewRollups
      .map((r) => r.metrics.hookRate)
      .filter((v): v is number => v !== null);
    return rates.length < MIN_PEERS_FOR_MEDIAN ? null : median(rates);
  }, [viewRollups]);

  const rows = buildRows(rollup, hookMedian);
  const drop = rollup.creative.likelyDropElement;

  return (
    <div className="space-y-1">
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground">Component breakdown</span>
          <WhyDot id="drawer.components.confidence" />
        </div>
        <p className="text-xs text-muted-foreground">
          How each part may be pulling its weight — hypotheses, not verdicts.
        </p>
      </div>

      <div>
        {rows.map((row) => (
          <div
            key={row.kind}
            className="grid grid-cols-[minmax(0,140px)_1fr_auto] items-start gap-4 border-b border-border py-3 last:border-0"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{row.kind}</p>
                {row.componentKind === "hook" && <WhyDot id="drawer.components.hookSignal" />}
                {MARKED_HERE.includes(row.componentKind) && drop === row.componentKind && <DropMarker />}
              </div>
              <p className="truncate text-sm font-medium text-foreground" title={row.value}>
                {row.value}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">{row.signal}</p>
            <ConfidenceChip confidence={row.confidence} />
          </div>
        ))}
      </div>
    </div>
  );
}
