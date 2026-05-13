import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function IndustryInsightsAdsCardSkeleton({ className }: { className?: string }) {
  return (
    <Card
      className={cn(
        "relative block overflow-hidden bg-card border-border shadow-sm rounded-lg",
        className,
      )}
    >
      <Skeleton className="absolute top-2 right-2 h-7 w-7 rounded-md" />

      <div className="p-3 space-y-2.5">
        <div className="flex items-center gap-1.5 pr-9">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-3 w-40" />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-6" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-3.5 w-3.5 rounded-sm" />
            <Skeleton className="h-3.5 w-3.5 rounded-sm" />
            <Skeleton className="h-3.5 w-3.5 rounded-sm" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3.5 w-28 flex-1" />
          <Skeleton className="h-4 w-14 rounded-full" />
        </div>

        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>

        <Skeleton className="aspect-video w-full rounded-md" />

        <Skeleton className="h-3 w-1/3" />

        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-11/12" />
          <Skeleton className="h-3 w-3/4" />
        </div>

        <div className="border-t border-border pt-2 flex items-center gap-1">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md ml-auto" />
        </div>
      </div>
    </Card>
  );
}

export function IndustryInsightsAdsCardGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div
      className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 2xl:columns-5 gap-4 [column-fill:_balance]"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="mb-4 break-inside-avoid"
          style={{ minHeight: 280 + (i % 4) * 60 }}
        >
          <IndustryInsightsAdsCardSkeleton />
        </div>
      ))}
    </div>
  );
}
