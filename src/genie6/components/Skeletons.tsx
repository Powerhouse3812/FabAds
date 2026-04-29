import { cn } from "@/lib/utils";

/**
 * Skeleton loaders for Genie 6 surfaces. Match the actual layout of each
 * target screen so there's no jarring layout shift on data arrival.
 *
 * Demo: append `?loading=1` to any Library / Assets URL to force-render the
 * skeleton state (useful for stakeholder demos).
 */

export function SkeletonShimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-g6-base bg-g6-bg-spotlight/60",
        className
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-g6-bg-elevated/40 to-transparent" />
    </div>
  );
}

/** 4-column output card grid (matches GeneratedOutputsTab layout). */
export function SkeletonOutputGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonShimmer className="aspect-[4/5] w-full rounded-g6-card" />
          <div className="space-y-1.5 px-1">
            <SkeletonShimmer className="h-3 w-3/4" />
            <SkeletonShimmer className="h-3 w-1/2" />
            <SkeletonShimmer className="h-2.5 w-2/3 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Brand list skeleton (matches Workspace cards). */
export function SkeletonBrandCards({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-4 space-y-3">
          <SkeletonShimmer className="h-10 w-10 rounded-g6-base" />
          <div className="space-y-1.5">
            <SkeletonShimmer className="h-4 w-3/4" />
            <SkeletonShimmer className="h-3 w-1/2" />
          </div>
          <SkeletonShimmer className="h-2.5 w-full mt-2" />
        </div>
      ))}
    </div>
  );
}

/** Table-row skeleton (matches Command variants). */
export function SkeletonTable({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-g6-base border border-g6-border-secondary overflow-hidden">
      <div className="bg-g6-bg-base px-3 py-2 border-b border-g6-border-secondary">
        <div className="grid gap-3" style={{ gridTemplateColumns: `2fr ${"1fr ".repeat(cols - 1).trim()}` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <SkeletonShimmer key={i} className="h-3" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-g6-border-secondary">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-3 py-3">
            <div className="grid gap-3" style={{ gridTemplateColumns: `2fr ${"1fr ".repeat(cols - 1).trim()}` }}>
              {Array.from({ length: cols }).map((_, c) => (
                <SkeletonShimmer key={c} className="h-3" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
