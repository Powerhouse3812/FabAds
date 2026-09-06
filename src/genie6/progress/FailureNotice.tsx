import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatCredits, creditsLabel } from "../lib/credits";
import { FAILURE_COPY, type FailureReason, type RetryScope } from "../lib/genieRunTypes";

/**
 * FailureNotice — the ONE inline failure block for all of Genie (§18).
 *
 * "On failure the item stays visible in the list in an error state, with
 * Retry — never a toast that disappears." So this is a block, not a toast:
 * callers render it in place, it never times out or auto-dismisses.
 *
 * Copy always comes from FAILURE_COPY (genieRunTypes.ts) — a generic
 * "something went wrong" is impossible because there is no code path that
 * doesn't key off a specific FailureReason.
 */

const RETRY_ORDER: RetryScope[] = ["this-item", "all-failed", "whole-batch", "different-model"];

function retryVerb(scope: RetryScope, failedCount?: number): string {
  switch (scope) {
    case "this-item":
      return "Retry this ad";
    case "all-failed":
      return failedCount != null ? `Retry all ${failedCount} failed` : "Retry all failed";
    case "whole-batch":
      return "Retry the whole batch";
    case "different-model":
      return "Retry with a different model";
  }
}

/**
 * Shared retry-button copy (§21.3: "Button copy must state the credit
 * consequence"). Exported so BatchProgressHeader — which knows the exact
 * failed-item count — can produce "Retry all 3 failed (12 credits)" with the
 * same wording this component uses, instead of drifting into its own phrasing.
 */
export function retryButtonCopy(
  scope: RetryScope,
  opts?: { credits?: number; failedCount?: number },
): string {
  const base = retryVerb(scope, opts?.failedCount);
  return opts?.credits != null ? `${base} (${creditsLabel(opts.credits)})` : base;
}

export function FailureNotice({
  reason,
  onRetry,
  retryCredits,
  className,
}: {
  reason: FailureReason;
  onRetry?: (s: RetryScope) => void;
  retryCredits?: Partial<Record<RetryScope, number>>;
  className?: string;
}) {
  const copy = FAILURE_COPY[reason];

  // Which scopes to offer: whatever the caller priced via retryCredits, in
  // canonical order. If the caller supplied onRetry but no pricing at all,
  // still offer a single "this-item" retry rather than a dead block — but
  // never invent a scope, or a button, when onRetry itself is absent.
  const priced = retryCredits ? RETRY_ORDER.filter((s) => retryCredits[s] != null) : [];
  const scopesToShow: RetryScope[] = priced.length > 0 ? priced : onRetry ? ["this-item"] : [];

  return (
    <div
      role="alert"
      className={cn(
        "rounded-2xl border border-destructive/30 bg-destructive/[0.06] p-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 text-destructive"
        >
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-sm font-semibold text-foreground">{copy.title}</p>
          <p className="text-[13px] leading-snug text-muted-foreground">{copy.detail}</p>
        </div>
      </div>

      {onRetry && scopesToShow.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 pl-11">
          {scopesToShow.map((scope, i) => (
            <Button
              key={scope}
              type="button"
              size="sm"
              variant={i === 0 ? "default" : "outline"}
              onClick={() => onRetry(scope)}
              className="rounded-full"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              {retryButtonCopy(scope, { credits: retryCredits?.[scope] })}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
