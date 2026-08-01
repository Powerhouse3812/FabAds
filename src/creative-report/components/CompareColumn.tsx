/**
 * CompareColumn — one flat card in the Compare grid.
 *
 * Works for both "creatives" mode (whole-rollup metrics) and "contexts" mode
 * (per-platform slice of a single creative). Props are the shared surface —
 * no fetching/folding happens here, callers pass already-folded numbers.
 *
 * Element picking (cross-creative composer, replacing Brief Builder): when a
 * caller passes both `creative` and `composerSlot`, an "Use from this
 * creative" row renders below the sparkline. Purely presentational — every
 * chip click calls back into `composerSlot`, whose actual state lives in
 * Compare.tsx's useElementComposer instance. Contexts mode never passes
 * `creative`, so its per-platform columns never grow the picker (a single
 * creative broken out by platform has nothing distinct to pick per column).
 */
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreativeThumb } from "@/creative-report/components/CreativeThumb";
import { BucketChip } from "@/creative-report/components/BucketChip";
import { Sparkline } from "@/creative-report/components/Sparkline";
import { WhyDot } from "@/creative-report/components/WhyDot";
import { ElementPickerRow } from "@/creative-report/components/composer/ElementPickerRow";
import type { ColumnComposerProps } from "@/creative-report/components/composer/types";
import {
  fmtCurrency,
  fmtMultiple,
  fmtPct,
  NA_NO_VIDEO,
  truncate,
  NAME_MAX,
} from "@/creative-report/lib/format";
import type { BucketKey } from "@/creative-report/lib/paramSchema";
import type { Creative } from "@/data/model";

/** Subset of FoldedMetrics this column actually renders. */
export interface CompareMetrics {
  spend: number;
  roas: number;
  cpa: number | null;
  ctr: number;
  cvr: number;
  frequency: number;
  hookRate: number | null;
}

interface MetricRow {
  label: string;
  value: string;
  title?: string;
  /** Reuses the grid's `grid.metric.<key>` ids — same derivation as the card/table. */
  annotationId: string;
}

function buildRows(m: CompareMetrics): MetricRow[] {
  return [
    { label: "Spend", value: fmtCurrency(m.spend), annotationId: "grid.metric.spend" },
    { label: "ROAS", value: fmtMultiple(m.roas), annotationId: "grid.metric.roas" },
    {
      label: "CPA",
      value: m.cpa === null ? "—" : fmtCurrency(m.cpa),
      title: m.cpa === null ? "No purchases" : undefined,
      annotationId: "grid.metric.cpa",
    },
    { label: "CTR", value: fmtPct(m.ctr), annotationId: "grid.metric.ctr" },
    { label: "CVR", value: fmtPct(m.cvr), annotationId: "grid.metric.cvr" },
    { label: "Frequency", value: m.frequency.toFixed(1), annotationId: "grid.metric.frequency" },
    {
      label: "Hook rate",
      value: m.hookRate === null ? NA_NO_VIDEO : fmtPct(m.hookRate),
      annotationId: "grid.metric.hookRate",
    },
  ];
}

export function CompareColumn({
  title,
  subtitle,
  metrics,
  series,
  bucket,
  creative,
  onRemove,
  attributionNote,
  className,
  composerSlot,
}: {
  title: string;
  subtitle?: string;
  metrics: CompareMetrics;
  series?: number[];
  bucket?: BucketKey | null;
  creative?: Creative;
  onRemove?: () => void;
  attributionNote?: string;
  className?: string;
  /** Element-composer wiring — omit to render the column with no picker
   *  (contexts mode, or any future caller that doesn't need it). */
  composerSlot?: ColumnComposerProps;
}) {
  const { text: titleText, truncated } = truncate(title, NAME_MAX);
  const rows = buildRows(metrics);

  return (
    <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
      <div className="flex items-start gap-2.5">
        {creative && <CreativeThumb creative={creative} size={40} />}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p
              className="min-w-0 truncate text-sm font-semibold text-foreground"
              title={truncated ? title : undefined}
            >
              {titleText}
            </p>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove ${title} from comparison`}
                className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {subtitle && (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
          {bucket && (
            <div className="mt-1.5 flex items-center gap-1">
              <BucketChip bucket={bucket} size="xs" />
              <WhyDot id="grid.bucket" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 divide-y divide-border border-y border-border">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between py-1.5 text-[13px]"
          >
            <span className="flex items-center gap-1 text-muted-foreground">
              {row.label}
              <WhyDot id={row.annotationId} />
            </span>
            <span
              className="font-medium tabular-nums text-foreground"
              title={row.title}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {series && series.length > 0 && (
        <div className="mt-3">
          <Sparkline data={series} tone="neutral" height={28} />
        </div>
      )}

      {attributionNote && (
        <p className="mt-2 text-xs text-muted-foreground">{attributionNote}</p>
      )}

      {creative && composerSlot && (
        <ElementPickerRow
          creative={creative}
          metrics={{ roas: metrics.roas, spend: metrics.spend }}
          composer={composerSlot}
        />
      )}
    </div>
  );
}
