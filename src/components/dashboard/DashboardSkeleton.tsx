import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>

      {/* Performance Graph */}
      <Skeleton className="h-64 rounded-xl" />

      {/* Two column rows */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <Skeleton className="h-48 rounded-xl lg:col-span-3" />
          <Skeleton className="h-48 rounded-xl lg:col-span-2" />
        </div>
      ))}

      {/* Full width */}
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
