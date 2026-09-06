import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCcw, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { flowSearchParams, type FlowActionId } from "@/genie6/flows/flowTypes";
import type { ReportEntity } from "@/lib/reports-dummy-data";
import { currencyForCountry } from "@/lib/reports-accounts";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Genie 2.0 §7.3 — the other half of Reports' suggestions.
 *
 * "Reports gets suggestions only. There is no editor here. Suggestions appear
 * in BOTH places — on Reports, next to the performance data, **so the decision
 * sits beside the evidence**, and in Genie's Configure suggestions rail,
 * adapted to that ad's performance."
 *
 * The Configure half shipped. This is the Reports half. Reports has no detail
 * panel to host a sidebar, so "next to the performance data" is taken
 * literally: the chip renders in the ad's own row, inches from the ROAS and
 * spend numbers that justify it.
 *
 * WHY THE SUGGESTION IS DERIVED, NOT AUTHORED
 * A hand-written suggestion per ad would be fiction, and §6 bans fabricated
 * metrics. Every suggestion here is a function of that row's real metrics, so
 * it can be checked against the numbers sitting beside it. The thresholds are
 * deliberately conservative and named, not tuned to make more chips appear.
 */

interface Suggestion {
  action: FlowActionId;
  /** Chip label — short enough to sit in a table row. */
  label: string;
  /** Why we're suggesting it, in terms of the numbers on this row. */
  reason: string;
  Icon: typeof Sparkles;
}

/**
 * ROAS below this, on an ad that has actually spent, reads as fatigue rather
 * than a bad concept — the creative earned its spend at some point.
 */
const FATIGUE_ROAS = 1.6;
/**
 * Enough spend that the numbers mean something at all.
 *
 * Calibrated against the ACTUAL dataset, not a guess: ad-level spend in
 * `reports-dummy-data.ts` clusters around 5,000-5,500, so an earlier 15,000
 * floor silently suppressed every suggestion on every row — the feature
 * looked shipped and did nothing. Checked in the browser, not assumed.
 */
const MEANINGFUL_SPEND = 3000;
/** A clear winner worth cloning rather than repairing. */
const STRONG_ROAS = 3.2;

/**
 * Reports spans five accounts across different countries, so money here is
 * NOT rupees — the same table shows €, £ and R$ rows (see `resolveCurrency`
 * / `currencyForCountry`). Hardcoding ₹ in the reason would have mislabelled
 * a euro account's spend, which is the "wrong currency" defect class §20
 * already lists as a bug. Resolve per row.
 */
function money(entity: ReportEntity, amount: number): string {
  const { symbol } = currencyForCountry(entity.country);
  return `${symbol}${Math.round(amount).toLocaleString("en-IN")}`;
}

export function suggestionFor(entity: ReportEntity): Suggestion | null {
  // Only ads carry a creative to act on. A suggestion on a campaign or an
  // account row would have nothing to send into Genie.
  if (entity.level !== "ad") return null;
  // Archived creative isn't worth a recommendation; it's already retired.
  if (entity.status === "Archived") return null;

  const { roas, spend, ctr } = entity.metrics;
  if (spend < MEANINGFUL_SPEND) return null;

  if (roas >= STRONG_ROAS) {
    return {
      action: "generate-variation",
      label: "Vary this winner",
      reason: `ROAS ${roas.toFixed(2)}× on ${money(entity, spend)} spend — worth more of the same idea.`,
      Icon: TrendingUp,
    };
  }
  if (roas <= FATIGUE_ROAS) {
    return {
      action: "refresh-fatigued",
      label: "Refresh — fatiguing",
      // `metrics.ctr` is ALREADY a percentage (reports-dummy-data.ts:167
      // computes `clicks / impressions * 100`), so multiplying by 100 again
      // printed "332.00% CTR" — a fabricated-looking number sitting next to
      // the real one in the same row. And ROAS needs 2dp here: 0.96 rendered
      // at 1dp reads as "1.0", i.e. break-even, when it is actually a loss.
      reason: `ROAS down to ${roas.toFixed(2)}× at ${ctr.toFixed(2)}% CTR after ${money(entity, spend)} — the hook is tiring.`,
      Icon: RefreshCcw,
    };
  }
  return null;
}

export function GenieSuggestionChip({
  entity,
  className,
}: {
  entity: ReportEntity;
  className?: string;
}) {
  const navigate = useNavigate();
  const suggestion = useMemo(() => suggestionFor(entity), [entity]);
  if (!suggestion) return null;

  const { action, label, reason, Icon } = suggestion;

  const go = (e: React.MouseEvent) => {
    // The row itself drills down on click — a suggestion is a different
    // destination, so it must not also trigger the row's navigation.
    e.stopPropagation();
    const sp = flowSearchParams("reports", entity.id, action);
    // Both of these are Rule-1 actions (§6): they ask nothing and land on
    // Configure with the source carried over.
    navigate(`/iq/genie6/studio-alpha/configure?${sp.toString()}`);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={go}
          aria-label={`${label} in Genie — ${reason}`}
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5",
            "font-mono text-[10px] font-semibold uppercase tracking-[0.06em]",
            "border-primary/30 bg-primary/[0.10] text-primary-text",
            "transition-colors hover:border-primary/50 hover:bg-primary/[0.16]",
            className,
          )}
        >
          <Icon className="h-3 w-3" aria-hidden />
          {label}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[260px]">
        <p className="font-mono text-[11px] leading-relaxed">{reason}</p>
      </TooltipContent>
    </Tooltip>
  );
}
