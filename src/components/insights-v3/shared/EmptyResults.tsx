import type { ReactNode } from "react";
import { Inbox, SearchX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  body?: ReactNode;
  /** A button / link — the empty state always offers a next step. */
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/** Composed empty state: never just "No data". */
export function EmptyState({ title, body, action, icon, className }: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary-text">
        {icon ?? <Inbox className="h-5 w-5" aria-hidden="true" />}
      </span>
      <h3 className="mt-3 text-base font-semibold text-foreground">{title}</h3>
      {body && <p className="mt-1 max-w-md text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export interface EmptyResultsProps {
  onClear: () => void;
  /** Plural noun: "ads", "advertisers", "landing pages". */
  noun: string;
  className?: string;
}

/** No results after tag filtering → one-click clear. */
export function EmptyResults({ onClear, noun, className }: EmptyResultsProps) {
  return (
    <EmptyState
      className={className}
      icon={<SearchX className="h-5 w-5" aria-hidden="true" />}
      title={`No ${noun} match the selected tags`}
      body="Tags are combined with “any of”, so this usually means the scope itself is narrow. Clear the tags to see everything in this scope."
      action={
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Clear tags
        </button>
      }
    />
  );
}

/** Row placeholders matching a list/table row (thumb, name lines, metrics). */
export function ListSkeleton({ rows = 8, className }: { rows?: number; className?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading"
      className={cn("divide-y divide-border overflow-hidden rounded-xl border border-border bg-card", className)}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="hidden h-3.5 w-16 sm:block" />
          <Skeleton className="hidden h-6 w-[72px] md:block" />
          <Skeleton className="h-7 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}

/** Ad-card placeholders. Same footprint as a real card so nothing shifts when data lands. */
/**
 * Mirrors OverviewShell's expanded layout (KPI tiles → summary + chart → groups) so the
 * page doesn't jump when the real overview mounts. Decorative: the list skeleton below
 * it is the page's single "Loading" status node.
 */
export function OverviewSkeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("rounded-2xl border border-border bg-card/60 p-3 sm:p-4", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3.5 w-28" />
      </div>
      <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(148px,1fr))] gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-border border-t-2 border-t-primary/30 bg-card px-3 py-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-3">
          <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-11/12" />
            <Skeleton className="h-3.5 w-3/4" />
          </div>
          <div className="space-y-2 rounded-xl border border-border bg-card p-3">
            <Skeleton className="h-4 w-28" />
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-24 rounded-full" />
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <Skeleton className="h-4 w-32" />
          <div className="mt-6 flex h-40 items-end gap-3">
            {[40, 55, 50, 60, 48, 66, 72, 70, 84, 100, 78].map((h, i) => (
              <Skeleton key={i} className="w-full rounded-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-xl border border-border bg-card p-3">
            <Skeleton className="h-4 w-24" />
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 7 }).map((_, j) => (
                <Skeleton key={j} className="h-7 w-28 rounded-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading"
      className={cn("grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3", className)}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2.5 rounded-lg border border-border bg-card p-3 shadow-sm">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-4 w-14 rounded-full" />
            <Skeleton className="ml-auto h-4 w-12 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-3.5 flex-1" />
          </div>
          <Skeleton className="aspect-video w-full rounded-md" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-11/12" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-[68px] rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
