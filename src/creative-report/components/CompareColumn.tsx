/**
 * CompareColumn — one flat card in the Compare grid.
 *
 * Works for both "creatives" mode (whole-rollup metrics) and "contexts" mode
 * (per-platform slice of a single creative). Props are the shared surface —
 * no fetching/folding happens here, callers pass already-folded numbers.
 */
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreativeThumb } from "@/creative-report/components/CreativeThumb";
import { BucketChip } from "@/creative-report/components/BucketChip";
import { Sparkline } from "@/creative-report/components/Sparkline";
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
}

function buildRows(m: CompareMetrics): MetricRow[] {
  return [
    { label: "Spend", value: fmtCurrency(m.spend) },
    { label: "ROAS", value: fmtMultiple(m.roas) },
    {
      label: "CPA",
      value: m.cpa === null ? "—" : fmtCurrency(m.cpa),
      title: m.cpa === null ? "No purchases" : undefined,
    },
    { label: "CTR", value: fmtPct(m.ctr) },
    { label: "CVR", value: fmtPct(m.cvr) },
    { label: "Frequency", value: m.frequency.toFixed(1) },
    {
      label: "Hook rate",
      value: m.hookRate === null ? NA_NO_VIDEO : fmtPct(m.hookRate),
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
          {bucket && <BucketChip bucket={bucket} size="xs" className="mt-1.5" />}
        </div>
      </div>

      <div className="mt-3 divide-y divide-border border-y border-border">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between py-1.5 text-[13px]"
          >
            <span className="text-muted-foreground">{row.label}</span>
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
    </div>
  );
}
