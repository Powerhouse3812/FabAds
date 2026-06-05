import { ChevronRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LaunchSummary } from "../types";
import { relativeTime } from "../lib/format";
import { StatusPill } from "./StatusPill";
import { StrategyBadge } from "./StrategyBadge";

/** Mini progress bar — created (green) / failed (red) / pending (muted). */
function ProgressBar({ progress }: { progress: LaunchSummary["progress"] }) {
  const { total, created, failed } = progress;
  const safe = Math.max(1, total);
  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full bg-[#52c41a]" style={{ width: `${(created / safe) * 100}%` }} />
      <div className="h-full bg-[#ff4d4f]" style={{ width: `${(failed / safe) * 100}%` }} />
    </div>
  );
}

export function LaunchCard({
  launch,
  onClick,
  className,
}: {
  launch: LaunchSummary;
  onClick?: (launch: LaunchSummary) => void;
  className?: string;
}) {
  const { progress } = launch;
  const showProgress = launch.status === "launching" || launch.status === "partial";

  return (
    <button
      type="button"
      onClick={() => onClick?.(launch)}
      className={cn(
        "group flex w-full flex-col gap-2 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-foreground/20 hover:bg-muted/40",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground" title={launch.name}>
            {launch.name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <StrategyBadge strategy={launch.strategy} />
            <span className="text-[10px] capitalize text-muted-foreground">{launch.objective}</span>
          </div>
        </div>
        <StatusPill status={launch.status} />
      </div>

      {showProgress && (
        <div className="space-y-1">
          <ProgressBar progress={progress} />
          <div className="flex items-center gap-3 font-g6-mono text-[10px] text-muted-foreground">
            <span className="text-[hsl(var(--success-text))]">{progress.created} live</span>
            {progress.failed > 0 && <span className="text-[hsl(var(--error-text))]">{progress.failed} failed</span>}
            {progress.pending > 0 && <span>{progress.pending} pending</span>}
            <span className="ml-auto">{progress.created}/{progress.total}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="font-g6-mono">
          {launch.counts.campaigns}c · {launch.counts.adsets}as · {launch.counts.ads} ads
        </span>
        <span className="flex items-center gap-2">
          {launch.accountSpan > 1 && (
            <span className="inline-flex items-center gap-0.5">
              <Users className="h-3 w-3" />
              {launch.accountSpan}
            </span>
          )}
          {launch.createdBy} · {relativeTime(launch.createdAt)}
          <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
      </div>
    </button>
  );
}
