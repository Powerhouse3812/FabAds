import { AlertCircle, RefreshCw, Mail } from "lucide-react";

/**
 * Error state component. Used when an API call fails or a permission denied
 * blocks the user. Always offers two paths forward: retry + escalate.
 *
 * Demo: append `?error=1` to any Library / Assets URL to force-render this.
 */

export interface ErrorStateProps {
  /** Short human-readable error category — "Network error" / "Permission denied" */
  title?: string;
  /** Specific error message — concrete, action-oriented */
  message?: string;
  /** Recovery action — retry handler */
  onRetry?: () => void;
  /** Custom retry CTA label */
  retryLabel?: string;
  /** When true, hide the retry button (e.g., for permission errors that can't be retried) */
  hideRetry?: boolean;
}

export function ErrorState({
  title = "Something didn't load",
  message = "We couldn't fetch this list. The connection may have dropped, or the server may be temporarily unavailable.",
  onRetry,
  retryLabel = "Try again",
  hideRetry,
}: ErrorStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-5 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-g6-2xl bg-g6-error/10 ring-1 ring-g6-error/30">
        <AlertCircle className="h-6 w-6 text-g6-error" />
      </div>

      <div className="max-w-md space-y-2">
        <h3 className="text-g6-h4 font-bold text-g6-text">{title}</h3>
        <p className="text-g6-sm text-g6-text-secondary leading-relaxed">{message}</p>
      </div>

      <div className="flex items-center gap-2">
        {!hideRetry && (
          <button
            type="button"
            onClick={() => onRetry?.() ?? window.location.reload()}
            className="inline-flex items-center gap-1.5 rounded-g6-base bg-g6-primary px-4 py-2 text-g6-sm font-semibold text-g6-text-on-accent shadow-g6-primary-btn"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {retryLabel}
          </button>
        )}
        <a
          href="mailto:support@fabads.com?subject=Genie%206%20issue"
          className="inline-flex items-center gap-1.5 rounded-g6-base border border-g6-border bg-g6-bg-container px-4 py-2 text-g6-sm font-medium text-g6-text-secondary hover:text-g6-text"
        >
          <Mail className="h-3.5 w-3.5" />
          Report
        </a>
      </div>

      <p className="font-g6-mono text-g6-xs text-g6-text-tertiary">
        If this keeps happening, drop a note — we'll investigate.
      </p>
    </div>
  );
}
