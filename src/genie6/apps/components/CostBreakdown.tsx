import { cn } from "@/lib/utils";
import { formatCredits } from "../../lib/credits";
import type { AppCostPreview } from "../appTypes";

/**
 * Credit-cost breakdown under the primary action (§21.2: "Credits need a
 * breakdown, not just a number... showing the multipliers"). While required
 * fields are still missing, `preview.provisional` is true and the total is
 * presented as a floor ("From N credits"), not a quote.
 */
export function CostBreakdown({ preview, className }: { preview: AppCostPreview; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-0.5 font-mono text-[11px] text-muted-foreground",
        className,
      )}
    >
      <p className="flex flex-wrap items-center justify-center gap-1.5">
        {preview.provisional && <span>From ~</span>}
        {preview.lines.map((line, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>×</span>}
            <span title={line.label}>
              {/* appCost's unit lines already carry the count in the label
                  ("2 shots"); appending the factor again printed "2 shots 2". */}
              {line.note ?? (/\d/.test(line.label) ? line.label : `${line.label} ${line.factor}`)}
            </span>
          </span>
        ))}
        <span aria-hidden>=</span>
        <span className="font-semibold text-foreground">{formatCredits(preview.total)} credits</span>
      </p>
      {preview.provisional && <p>Floor — some required fields are still missing.</p>}
    </div>
  );
}
