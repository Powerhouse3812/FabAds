/**
 * BenchmarkPanel — the 3-source honest benchmark band (iter-2 W2): grades
 * this creative against (1) the buyer's own Winners bank, (2) the category
 * norm across every creative sharing this categoryId, and (3) a static
 * platform best-practice checklist — then ranks suggested edits by a
 * transparent gap-vs-Winners number. No composite score, no ROI prediction,
 * no diagnosis language — every number here is inspectable and re-derivable.
 */
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  categoryNorm,
  platformBestPractice,
  rankComponentEdits,
} from "@/creative-report-v2/lib/benchmarks";
import { useWinnersBank } from "@/creative-report-v2/lib/winnersBank";
import { getDataset } from "@/data/generator";
import { getCategory } from "@/mocks/shared/categories";
import { fmtMultiple, fmtPct } from "@/creative-report-v2/lib/format";
import { WhyDot } from "@/creative-report-v2/components/WhyDot";
import type { CreativeRollup } from "@/creative-report-v2/lib/selectors";

export function BenchmarkPanel({ rollup }: { rollup: CreativeRollup }) {
  const dataset = getDataset();
  const bank = useWinnersBank();
  const norm = categoryNorm(dataset, rollup.creative.categoryId, rollup.creative.id);
  const category = rollup.creative.categoryId ? getCategory(rollup.creative.categoryId) : undefined;
  const checks = platformBestPractice(rollup);
  const rankedEdits = rankComponentEdits(rollup, bank.entries);

  return (
    <div>
      <div className="border-b border-border py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground">Benchmarks</span>
          <span className="text-[11px] text-muted-foreground">
            vs {bank.source === "curated" ? "your Winners" : "starter Winners (bootstrap — mark a winner to refine)"}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Three sources, always visible — your own Winners, this category's norm, and a static
          platform checklist. No single score.
        </p>
      </div>

      {/* Category norm */}
      <div className="border-b border-border py-3">
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Category norm</p>
          <WhyDot id="drawer.benchmark.categoryNorm" />
        </div>
        {norm ? (
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {category?.name ?? rollup.creative.categoryId} · n={norm.sampleSize}
            </span>
            <span className="tabular-nums text-foreground">
              median {fmtMultiple(norm.medianRoas)} · {fmtPct(norm.medianCtr)} CTR
            </span>
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            No category linked or not enough peers yet to compute a norm.
          </p>
        )}
      </div>

      {/* Platform best-practice checklist */}
      <div className="border-b border-border py-3">
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Platform best-practice
          </p>
          <WhyDot id="drawer.benchmark.platformBestPractice" />
        </div>
        <div className="mt-1.5 space-y-1.5">
          {checks.map((check) => (
            <div key={check.label} className="flex items-start gap-2 text-sm">
              {check.pass ? (
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-text" />
              ) : (
                <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
              )}
              <span className="text-muted-foreground">{check.detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ranked edit suggestions */}
      <div className="py-3">
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Suggested test order
          </p>
          <WhyDot id="drawer.benchmark.rankedEdits" />
        </div>
        {rankedEdits.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Nothing sits meaningfully below your Winners bank on the data available — no changes to
            prioritize right now.
          </p>
        ) : (
          <div className="mt-1.5 space-y-2">
            {rankedEdits.slice(0, 3).map((edit, i) => (
              <div key={edit.dimension} className="flex items-start gap-2 text-sm">
                <span
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums",
                    "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                  )}
                >
                  {i + 1}
                </span>
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">{edit.label}</span> — this creative's{" "}
                  {fmtMultiple(edit.creativeRoas)} vs your Winners' {fmtMultiple(edit.bankAvgRoas)} on "
                  {edit.currentValue}"
                </span>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground">
              Ranked by gap vs your Winners bank — transparent, not a prediction.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
