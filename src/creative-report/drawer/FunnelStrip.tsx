/**
 * FunnelStrip — full-funnel metric strip (handoff §5.2).
 * CPM → CTR → Outbound CTR → CVR → CPA → ROAS, folded (never averaged)
 * metrics from the rollup's FoldedMetrics.
 *
 * iter-2 W4 decision: funnel-stage detail lives here ONLY. The grid
 * (CreativeCard), table (CreativeTable) and bucket rows (BucketRow) show
 * summary metrics, not the stage-by-stage funnel — duplicating it there
 * would repeat the same numbers at a smaller, less legible size for no
 * added triage value. Open the drawer for funnel detail.
 */
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtCurrency, fmtPct, fmtMultiple, fmtDelta, type DeltaTone } from "@/creative-report/lib/format";
import { WhyDot } from "@/creative-report/components/WhyDot";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

/** Maps a raw fmtDelta tone to a good/bad/flat verdict given directionality. */
function toneClass(tone: DeltaTone, higherIsBetter: boolean): string {
  if (tone === "flat") return "text-muted-foreground";
  const isGood = higherIsBetter ? tone === "up" : tone === "down";
  return isGood ? "text-primary-text" : "text-destructive";
}

interface Cell {
  label: string;
  value: string;
  muted?: boolean;
  title?: string;
  delta?: { label: string; className: string };
  whyId: string;
}

export function FunnelStrip({ rollup }: { rollup: CreativeRollup }) {
  const { metrics, roasDeltaPct, cpaDeltaPct } = rollup;

  const cpaDelta = fmtDelta(cpaDeltaPct);
  const roasDelta = fmtDelta(roasDeltaPct);

  const cells: Cell[] = [
    { label: "CPM", value: fmtCurrency(metrics.cpm, { decimals: 2 }), whyId: "drawer.funnel.cpm" },
    { label: "CTR", value: fmtPct(metrics.ctr, 2), whyId: "drawer.funnel.ctr" },
    { label: "Outbound CTR", value: fmtPct(metrics.outboundCtr, 2), whyId: "drawer.funnel.outboundCtr" },
    { label: "CVR", value: fmtPct(metrics.cvr, 2), whyId: "drawer.funnel.cvr" },
    metrics.cpa === null
      ? {
          label: "CPA",
          value: "—",
          muted: true,
          title: "No purchases in range",
          whyId: "drawer.funnel.cpa",
        }
      : {
          label: "CPA",
          value: fmtCurrency(metrics.cpa, { decimals: 2 }),
          delta:
            cpaDeltaPct !== null
              ? { label: cpaDelta.label, className: toneClass(cpaDelta.tone, false) }
              : undefined,
          whyId: "drawer.funnel.cpa",
        },
    {
      label: "ROAS",
      value: fmtMultiple(metrics.roas),
      delta:
        roasDeltaPct !== null
          ? { label: roasDelta.label, className: toneClass(roasDelta.tone, true) }
          : undefined,
      whyId: "drawer.funnel.roas",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {cells.map((cell, i) => (
        <div key={cell.label} className="relative flex flex-col gap-0.5 px-2 py-1.5">
          {i > 0 && (
            <ChevronRight
              className="absolute -left-1 top-1/2 hidden h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40 sm:block"
              aria-hidden
            />
          )}
          <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {cell.label}
            <WhyDot id={cell.whyId} className="h-3 w-3" />
          </span>
          <span
            className={cn(
              "font-semibold tabular-nums text-sm",
              cell.muted ? "text-muted-foreground" : "text-foreground",
            )}
            title={cell.title}
          >
            {cell.value}
          </span>
          {cell.delta && (
            <span className={cn("text-xs tabular-nums font-medium", cell.delta.className)}>
              {cell.delta.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
