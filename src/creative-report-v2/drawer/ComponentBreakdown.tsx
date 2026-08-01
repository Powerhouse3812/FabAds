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
import { AlertTriangle } from "lucide-react";
import { ConfidenceChip, type ChipConfidence } from "@/creative-report-v2/components/ConfidenceChip";
import { WhyDot } from "@/creative-report-v2/components/WhyDot";
import type { ComponentKind } from "@/data/model";
import type { CreativeRollup } from "@/creative-report-v2/lib/selectors";

const HOOK_RATE_NORM = 28; // % — rough account-norm cutover for wording only.

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

function buildRows(rollup: CreativeRollup): Row[] {
  const { creative, metrics, confidence } = rollup;
  const isVideo = creative.format === "video";

  const hookSignal = !isVideo
    ? "N/A — no video on this creative."
    : metrics.hookRate === null
      ? "Not enough video data yet to read a 3s-view rate."
      : (() => {
          const above = metrics.hookRate! > HOOK_RATE_NORM;
          return `3s-view rate is ${metrics.hookRate!.toFixed(0)}% — ${above ? "above" : "below"} the account norm; the hook may be ${above ? "carrying" : "limiting"} the scroll-stop.`;
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
  const rows = buildRows(rollup);
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
