/**
 * Shown while My Feeds is sorted by likes / comments / shares. Engagement is reported on only a minority of ads,
 * so the order ranks those ads and lists every other ad after them. The page says so in plain words instead of
 * letting the order read as a complete ranking.
 */
import { TriangleAlert } from "lucide-react";
import type { Engagement } from "@/lib/insights-v3/types";
import { fmtInt } from "@/components/insights-v3/shared";

export interface EngagementSortNoticeProps {
  field: keyof Engagement;
  /** Ads in the current view that report this metric. */
  reported: number;
  /** All ads in the current view. */
  total: number;
  onSwitch: () => void;
}

export function EngagementSortNotice({ field, reported, total, onSwitch }: EngagementSortNoticeProps) {
  const rest = Math.max(0, total - reported);
  return (
    <div
      role="status"
      className="flex flex-wrap items-start gap-x-2 gap-y-1 rounded-lg border border-warning-text/30 bg-warning-text/10 px-3 py-2 text-xs leading-5 text-foreground"
    >
      <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning-text" aria-hidden="true" />
      <p className="min-w-0 flex-1">
        <span className="font-semibold text-warning-text">Not every ad has {field} data.</span>{" "}
        {reported === 0 ? (
          <>None of these {fmtInt(total)} ads do, so this sort can’t rank them.</>
        ) : (
          <>
            Only <span className="font-mono font-medium tabular-nums">{fmtInt(reported)}</span> of{" "}
            <span className="font-mono font-medium tabular-nums">{fmtInt(total)}</span> ads here do, and they come first. The other{" "}
            <span className="font-mono font-medium tabular-nums">{fmtInt(rest)}</span> are listed last, so this order can hide ads that are doing well.
          </>
        )}
      </p>
      <button
        type="button"
        onClick={onSwitch}
        className="shrink-0 rounded-sm font-medium text-primary-text underline underline-offset-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-sm:min-h-8"
      >
        Back to Newest
      </button>
    </div>
  );
}
