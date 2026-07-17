/**
 * ComponentBreakdown — Hook / Headline / Primary text / CTA rows, each with a
 * hypothesis-framed signal line + confidence chip (handoff §5.2). No composite
 * score — every row states its own confidence honestly.
 */
import { ConfidenceChip, type ChipConfidence } from "@/creative-report/components/ConfidenceChip";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

const HOOK_RATE_NORM = 28; // % — rough account-norm cutover for wording only.

interface Row {
  kind: string;
  value: string;
  signal: string;
  confidence: ChipConfidence;
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
      value: creative.components.hook,
      signal: hookSignal,
      confidence: !isVideo ? "na" : confidence,
    },
    {
      kind: "Headline",
      value: creative.components.headline,
      signal: `Headlines like "${creative.components.headline}" set the promise early — testing a benefit-led variant against it could reveal whether specificity is the lever.`,
      confidence,
    },
    {
      kind: "Primary text",
      value: creative.components.primaryText,
      signal: `The "${creative.components.primaryText}" angle carries the body copy — worth testing a shorter, more direct version to see if brevity moves CVR.`,
      confidence: "low",
    },
    {
      kind: "CTA",
      value: creative.components.cta,
      signal: `Direct CTAs like "${creative.components.cta}" tend to convert warm traffic — worth A/B testing against a softer ask.`,
      confidence: "low",
    },
  ];
}

export function ComponentBreakdown({ rollup }: { rollup: CreativeRollup }) {
  const rows = buildRows(rollup);

  return (
    <div className="space-y-1">
      <div>
        <span className="text-sm font-medium text-foreground">Component breakdown</span>
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
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{row.kind}</p>
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
