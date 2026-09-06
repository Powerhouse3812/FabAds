/**
 * Other Flows — shared state-coverage building blocks.
 *
 * Genie 2.0 build rules require populated / partial / zero-data / loading on
 * every screen, and forbid an empty state that just says "No data." Both
 * OtherFlows and FlowModuleDetail hit the same three shapes (a module with no
 * sources at all, a module whose sources are all unanalysed, a shimmer
 * loading pass) so the composed markup lives here once instead of drifting
 * between the two pages.
 */
import { Link } from "react-router-dom";
import { ArrowUpRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

/** A module/search result set with nothing in it yet — always names the next action. */
export function FlowZeroNote({
  text = "Nothing here yet",
  ctaLabel,
  to,
  className,
}: {
  text?: string;
  ctaLabel: string;
  to: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-2.5 py-2",
        className,
      )}
    >
      <span className="text-[11px] text-muted-foreground">{text}</span>
      <Link
        to={to}
        className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
      >
        {ctaLabel}
        <ArrowUpRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

/** Sources exist but none are analysed yet — names WHY the action is gated. */
export function FlowPartialNote({
  count,
  label,
  to,
  className,
}: {
  count: number;
  label: string;
  to: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-warning-text/30 bg-warning-text/10 px-2.5 py-2",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5 text-[11px] text-warning-text">
        <Clock className="h-3 w-3 shrink-0" />
        {count} waiting on analysis
      </span>
      <Link
        to={to}
        className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
      >
        Analyse in {label}
        <ArrowUpRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

/** Shimmer card matching the real module-card footprint. Never a bare spinner. */
export function FlowCardSkeleton({ tall = false, className }: { tall?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl border border-border bg-card p-4",
        tall ? "h-40" : "h-28",
        className,
      )}
    >
      <div className="mb-3 h-9 w-9 rounded-xl bg-muted" />
      <div className="mb-2 h-3.5 w-2/3 rounded bg-muted" />
      <div className="h-2.5 w-full rounded bg-muted/70" />
      <div className="mt-1.5 h-2.5 w-4/5 rounded bg-muted/70" />
    </div>
  );
}

/** Shimmer row matching a source-picker tile. */
export function FlowRowSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex animate-pulse items-center gap-3 rounded-xl border border-border bg-card p-3", className)}>
      <div className="h-12 w-12 shrink-0 rounded-lg bg-muted" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="h-2.5 w-3/4 rounded bg-muted/70" />
      </div>
      <div className="h-5 w-16 shrink-0 rounded-full bg-muted" />
    </div>
  );
}
