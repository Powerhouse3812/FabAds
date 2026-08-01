/**
 * OverviewBreakdown — Brand / Category / Product spend breakdown card for
 * the Overview screen. Maalik: Catalogue-dimension data (brand/category/
 * product) belongs on the morning-triage screen, not only in the Owner
 * Report. Reuses breakdownRollups() (selectors.ts) — same sums-then-
 * recompute discipline as brandRollups/accountRollups, and the same honest
 * exclusion: a creative with no link on the active dimension is left out of
 * the table rather than folded into a fake "Unknown" row. This card owns
 * its own surface (no wrapping section from Overview.tsx), so it stays a
 * single container — no nested bordered box inside.
 */
import { useState } from "react";
import { cn } from "@/lib/utils";
import { WhyDot } from "@/creative-report-v2/components/WhyDot";
import {
  breakdownRollups,
  type BreakdownDimension,
  type CreativeRollup,
} from "@/creative-report-v2/lib/selectors";
import { fmtCompactCurrency, fmtMultiple, pluralize, truncate } from "@/creative-report-v2/lib/format";

const DIMENSIONS: { key: BreakdownDimension; label: string; noun: string }[] = [
  { key: "brand", label: "Brand", noun: "brand" },
  { key: "category", label: "Category", noun: "category" },
  { key: "product", label: "Product", noun: "product" },
];

const ROW_CAP = 6;
const LABEL_MAX = 28;

export function OverviewBreakdown({ rollups }: { rollups: CreativeRollup[] }) {
  const [dimension, setDimension] = useState<BreakdownDimension>("brand");
  const active = DIMENSIONS.find((d) => d.key === dimension)!;

  const rows = breakdownRollups(rollups, dimension);
  const visibleRows = rows.slice(0, ROW_CAP);
  const hiddenCount = rows.length - visibleRows.length;

  // Honesty check: creatives excluded because they have no link on this
  // dimension. Never silently drop them — say so.
  const linkedCount = rows.reduce((sum, r) => sum + r.creativeCount, 0);
  const unlinkedCount = Math.max(0, rollups.length - linkedCount);

  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card/70 p-4 shadow-sm backdrop-blur-xl",
        "transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          <h3 className="text-sm font-semibold text-foreground">Breakdown</h3>
          <WhyDot id="overview.breakdown" />
        </div>

        <div className="inline-flex items-center rounded-md border border-border bg-muted p-0.5">
          {DIMENSIONS.map((d) => (
            <button
              key={d.key}
              type="button"
              aria-pressed={dimension === d.key}
              onClick={() => setDimension(d.key)}
              className={cn(
                "rounded-[5px] px-3 py-1.5 text-[13px] font-medium transition-colors",
                dimension === d.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-xs text-muted-foreground">
          No {active.noun} links on these creatives yet.
        </p>
      ) : (
        <>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="pb-2 text-left font-mono text-[10px] font-normal uppercase tracking-wider text-muted-foreground"
                >
                  {active.label}
                </th>
                <th
                  scope="col"
                  className="pb-2 pr-2 text-right font-mono text-[10px] font-normal uppercase tracking-wider text-muted-foreground"
                >
                  Creatives
                </th>
                <th
                  scope="col"
                  className="pb-2 pr-2 text-right font-mono text-[10px] font-normal uppercase tracking-wider text-muted-foreground"
                >
                  Spend
                </th>
                <th
                  scope="col"
                  className="pb-2 text-right font-mono text-[10px] font-normal uppercase tracking-wider text-muted-foreground"
                >
                  ROAS
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const { text, truncated } = truncate(row.label, LABEL_MAX);
                return (
                  <tr key={row.id} className="border-t border-border/60">
                    <td
                      className="py-2 pr-2 text-foreground"
                      title={truncated ? row.label : undefined}
                    >
                      {text}
                    </td>
                    <td className="py-2 pr-2 text-right font-mono tabular-nums text-muted-foreground">
                      {row.creativeCount}
                    </td>
                    <td className="py-2 pr-2 text-right font-mono tabular-nums text-foreground">
                      {fmtCompactCurrency(row.metrics.spend)}
                    </td>
                    <td className="py-2 text-right font-mono tabular-nums text-foreground">
                      {fmtMultiple(row.metrics.roas)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-2 space-y-1">
            {hiddenCount > 0 && (
              <p className="text-xs text-muted-foreground">
                +{hiddenCount} more {active.noun}
                {hiddenCount === 1 ? "" : "s"} not shown — see the Owner Report for the full list.
              </p>
            )}
            {unlinkedCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {pluralize(unlinkedCount, "creative")} {unlinkedCount === 1 ? "has" : "have"} no{" "}
                {active.noun} link and {unlinkedCount === 1 ? "isn't" : "aren't"} counted here.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
