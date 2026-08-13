/**
 * DemographicsPanel — real per-instance age/gender/geo performance split
 * (iter-2 P5, redesigned Maalik 2026-08-01: bars instead of a plain number
 * table, matching the "distribution + visual representation" brief).
 * Folded straight from each AdInstance's own age/gender/geo tags + daily[]
 * rows via `demographicSplit()` — a different grouping of the same real rows
 * the rest of the drawer already uses, not a modeled/estimated distribution.
 * No composite score, no diagnosis language — literal readout.
 *
 * Two things the brief asked for that this dataset doesn't actually track,
 * handled honestly rather than invented:
 * - "Reach" (unique people) isn't tracked separately from impressions in
 *   this mock dataset — labelled "Impressions" here, not "Reach".
 * - "Bounce rate" doesn't exist as a metric on ad creatives in this app (it's
 *   a website-analytics concept) — there's nothing honest to show for it, so
 *   it's dropped rather than faked.
 *
 * Each bar's share is impressions-share within its OWN dimension (Age/Gender/
 * Geo bars each sum to ~100% independently) — the top line's total impression
 * count is the shared denominator readers can anchor the bars to. This is a
 * local sort by impressions for display only; `demographicSplit()`'s own
 * spend-sort is untouched since `EditTargetingModal` depends on spend-order
 * for its "top segment" default.
 */
import { fmtCompact, fmtPct } from "@/creative-report/lib/format";
import { Progress } from "@/components/ui/progress";
import { WhyDot } from "@/creative-report/components/WhyDot";
import {
  demographicSplit,
  type CreativeRollup,
  type DemographicSlice,
} from "@/creative-report/lib/selectors";

function genderLabel(key: string): string {
  return key === "all" ? "All genders" : key;
}

function DemographicBar({ label, impressions, share }: { label: string; impressions: number; share: number }) {
  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="min-w-0 truncate text-foreground" title={label}>
          {label}
        </span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {fmtCompact(impressions)} <span className="text-foreground">· {fmtPct(share, 1)}</span>
        </span>
      </div>
      <Progress value={share} className="mt-1 h-1.5" />
    </div>
  );
}

function DimensionGroup({ label, slices }: { label: string; slices: DemographicSlice[] }) {
  if (slices.length === 0) return null;
  const totalImpressions = slices.reduce((sum, s) => sum + s.metrics.impressions, 0);
  // Local display sort by impressions (largest bar first) — does not mutate
  // or re-sort demographicSplit()'s own spend-ordered result.
  const ordered = [...slices].sort((a, b) => b.metrics.impressions - a.metrics.impressions);
  return (
    <div className="border-b border-border py-3 last:border-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1">
        {ordered.map((s) => (
          <DemographicBar
            key={s.key}
            label={label === "Gender" ? genderLabel(s.key) : s.key}
            impressions={s.metrics.impressions}
            share={totalImpressions > 0 ? (s.metrics.impressions / totalImpressions) * 100 : 0}
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
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-foreground">Demographics</span>
        <WhyDot id="drawer.demographics.split" />
      </div>

      {!hasAny ? (
        <p className="mt-1 text-sm text-muted-foreground">
          No targeting breakdown available for this creative.
        </p>
      ) : (
        <>
          <p className="mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
            {fmtCompact(rollup.metrics.impressions)} impressions · {fmtCompact(rollup.metrics.clicks)} clicks
            <span className="text-foreground"> in view</span>
          </p>
          <div className="mt-1">
            <DimensionGroup label="Age" slices={split.byAge} />
            <DimensionGroup label="Gender" slices={split.byGender} />
            <DimensionGroup label="Geo" slices={split.byGeo} />
          </div>
        </>
      )}
    </div>
  );
}
