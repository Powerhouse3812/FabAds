import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

/**
 * InsightAdCardSkeleton — single-card placeholder matching InsightAdCard's
 * layout: header strip (status + time + platforms), brand row, headline,
 * media block (aspect-video), domain line, body lines, footer action row.
 *
 * Skeleton dimensions deliberately track the real card so there's no
 * layout shift when data lands.
 */
export function InsightAdCardSkeleton() {
  return (
    <Card className="border border-border shadow-sm rounded-xl">
      <CardContent className="p-3.5 space-y-2.5">
        {/* Row 1: status + time + platforms */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
        {/* Row 2: brand avatar + name + ad-type badge */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3.5 w-1/2" />
          <Skeleton className="h-4 w-12 ml-auto rounded-full" />
        </div>
        {/* Headline */}
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-11/12" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>
        {/* Media block */}
        <Skeleton className="aspect-video w-full rounded-md" />
        {/* Domain */}
        <Skeleton className="h-3 w-1/3" />
        {/* Body description */}
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
        {/* Footer action row */}
        <div className="flex items-center gap-1.5 pt-1">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md ml-auto" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * InsightAdGridSkeleton — full responsive grid (1 → 2 → 3 → 4 → 5 cols at
 * the same breakpoints as the real grid in Discover / Feed / SavedAdsTab).
 * Default count = 12, matching the default per-page in those surfaces.
 */
export function InsightAdGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <InsightAdCardSkeleton key={i} />
      ))}
    </div>
  );
}
