import { ArrowRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { StrategyBadge, EmptyState } from "@/launch2/components";
import { relativeTime } from "@/launch2/lib/format";
import type { ActivityEntry, DraftSummary } from "@/launch2/types";

const TOTAL_STEPS = 5;

const ACTIVITY_DOT: Record<NonNullable<ActivityEntry["status"]>, string> = {
  ok: "bg-[#52c41a]",
  warn: "bg-[#faad14]",
  error: "bg-[#ff4d4f]",
};

/** Recent drafts panel — autosaved flows, resumable from the furthest step. */
export function RecentDrafts({
  drafts,
  onResume,
  className,
}: {
  drafts: DraftSummary[];
  onResume?: (draft: DraftSummary) => void;
  className?: string;
}) {
  if (drafts.length === 0) {
    return (
      <EmptyState
        compact
        icon={<FileText className="h-4 w-4" />}
        title="No drafts"
        description="Autosaved launches will appear here — refresh never loses your place."
        className={className}
      />
    );
  }

  return (
    <div className={cn("divide-y divide-border rounded-lg border border-border bg-card", className)}>
      {drafts.map((draft) => (
        <div key={draft.id} className="flex items-center gap-3 p-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-foreground" title={draft.name}>
                {draft.name}
              </p>
              {draft.strategy && <StrategyBadge strategy={draft.strategy} showVerified />}
            </div>
            <p className="mt-0.5 font-g6-mono text-[11px] text-muted-foreground">
              step {draft.step} of {TOTAL_STEPS} · {relativeTime(draft.updatedAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onResume?.(draft)}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[hsl(var(--primary-text))] hover:underline"
          >
            Resume
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

/** Recent activity panel — last N log entries, status-dotted. */
export function RecentActivity({
  activity,
  className,
}: {
  activity: ActivityEntry[];
  className?: string;
}) {
  if (activity.length === 0) {
    return (
      <EmptyState
        compact
        title="No activity yet"
        description="Launches, retries and edits will show up here."
        className={className}
      />
    );
  }

  return (
    <div className={cn("divide-y divide-border rounded-lg border border-border bg-card", className)}>
      {activity.map((entry) => (
        <div key={entry.id} className="flex items-start gap-3 p-3">
          <span
            className={cn(
              "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
              entry.status ? ACTIVITY_DOT[entry.status] : "bg-muted-foreground/50",
            )}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground">
              <span className="font-medium capitalize">{entry.action}</span>
              {entry.launchName && (
                <span className="text-muted-foreground"> · {entry.launchName}</span>
              )}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground" title={entry.detail}>
              {entry.detail}
            </p>
          </div>
          <span className="shrink-0 font-g6-mono text-[11px] text-muted-foreground">
            {relativeTime(entry.ts)}
          </span>
        </div>
      ))}
    </div>
  );
}
