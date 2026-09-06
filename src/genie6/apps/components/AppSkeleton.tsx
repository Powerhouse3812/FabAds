import { Skeleton } from "@/components/ui/skeleton";

/** Loading state for `AppScreen` (`?loading=1`) — shimmer blocks sized to the
 *  real 750px setup column + section rhythm, never a bare spinner. */
export function AppScreenSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[750px] flex-col gap-8 px-6 pb-16 pt-14">
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-3 border-t border-border pt-6 first:border-t-0 first:pt-0">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ))}
      <Skeleton className="h-12 w-full rounded-full" />
      <Skeleton className="mx-auto h-3 w-40" />
    </div>
  );
}

/** Loading state for `OtherApps` (`?loading=1`) — mirrors the asymmetric
 *  live/coming-soon grid so nothing reflows once data lands. */
export function OtherAppsSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-16 pt-10">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>
      <Skeleton className="h-9 w-80 rounded-full" />
      <div className="grid grid-cols-6 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={`lg-${i}`} className="col-span-6 h-40 rounded-2xl sm:col-span-3" />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={`sm-${i}`} className="col-span-6 h-32 rounded-2xl sm:col-span-3 lg:col-span-2" />
        ))}
      </div>
    </div>
  );
}
