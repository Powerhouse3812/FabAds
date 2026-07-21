/**
 * DemographicsPanel — real per-instance age/gender/geo performance split
 * (iter-2 P5). Folded straight from each AdInstance's own age/gender/geo tags
 * + daily[] rows via `demographicSplit()` — a different grouping of the same
 * real rows the rest of the drawer already uses, not a modeled/estimated
 * distribution. No composite score, no diagnosis language — literal readout.
 */
import {
  fmtCompactCurrency,
  fmtMultiple,
  fmtPct,
} from "@/creative-report/lib/format";
import {
  demographicSplit,
  type CreativeRollup,
  type DemographicSlice,
} from "@/creative-report/lib/selectors";

function genderLabel(key: string): string {
  return key === "all" ? "All genders" : key;
}

function SliceRow({ label, metrics }: { label: string; metrics: DemographicSlice["metrics"] }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="min-w-0 truncate text-foreground" title={label}>
        {label}
      </span>
      <div className="flex shrink-0 items-center gap-4 tabular-nums text-muted-foreground">
        <span className="w-16 text-right">{fmtCompactCurrency(metrics.spend)}</span>
        <span className="w-14 text-right text-foreground">{fmtMultiple(metrics.roas)}</span>
        <span className="w-14 text-right">{fmtPct(metrics.ctr)}</span>
      </div>
    </div>
  );
}

function DimensionGroup({ label, slices }: { label: string; slices: DemographicSlice[] }) {
  if (slices.length === 0) return null;
  return (
    <div className="border-b border-border py-3 last:border-0">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="flex shrink-0 items-center gap-4 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          <span className="w-16 text-right">Spend</span>
          <span className="w-14 text-right">ROAS</span>
          <span className="w-14 text-right">CTR</span>
        </div>
      </div>
      <div>
        {slices.map((s) => (
          <SliceRow
            key={s.key}
            label={label === "Gender" ? genderLabel(s.key) : s.key}
            metrics={s.metrics}
          />
        ))}
      </div>
    </div>
  );
}

export function DemographicsPanel({ rollup }: { rollup: CreativeRollup }) {
  const split = demographicSplit(rollup);
  const hasAny = split.byAge.length > 0 || split.byGender.length > 0 || split.byGeo.length > 0;

  return (
    <div>
      <span className="text-sm font-medium text-foreground">Demographics</span>

      {!hasAny ? (
        <p className="mt-1 text-sm text-muted-foreground">
          No targeting breakdown available for this creative.
        </p>
      ) : (
        <div className="mt-1">
          <DimensionGroup label="Age" slices={split.byAge} />
          <DimensionGroup label="Gender" slices={split.byGender} />
          <DimensionGroup label="Geo" slices={split.byGeo} />
        </div>
      )}
    </div>
  );
}
