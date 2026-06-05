import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, ListFilter, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { EmptyState, SectionHeader } from "@/launch2/components";
import { formatDateTime, relativeTime } from "@/launch2/lib/format";
import { activity } from "@/launch2/mocks";
import type { ActivityEntry } from "@/launch2/types";

/* ───────────────────────── filters ───────────────────────── */

type StatusFilter = "all" | "ok" | "warn" | "error";
type DateFilter = "all" | "24h" | "7d";

const DATE_WINDOWS: Record<DateFilter, number> = {
  all: Infinity,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

const STATUS_DOT: Record<NonNullable<ActivityEntry["status"]>, string> = {
  ok: "bg-[#52c41a]",
  warn: "bg-[#faad14]",
  error: "bg-[#ff4d4f]",
};

const STATUS_TEXT: Record<NonNullable<ActivityEntry["status"]>, string> = {
  ok: "text-[hsl(var(--success-text))]",
  warn: "text-[hsl(var(--warning-text))]",
  error: "text-[hsl(var(--error-text))]",
};

/* ───────────────────────── day grouping ───────────────────────── */

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (same(d, today)) return "Today";
  if (same(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/* ───────────────────────── row ───────────────────────── */

function ActivityRow({
  entry,
  isLast,
  onOpenLaunch,
}: {
  entry: ActivityEntry;
  isLast: boolean;
  onOpenLaunch: (id: string) => void;
}) {
  const status = entry.status ?? "ok";
  return (
    <li className="flex gap-3 px-1 py-3">
      <div className="flex flex-col items-center pt-1">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", STATUS_DOT[status])} />
        {!isLast && <span className="mt-1 w-px flex-1 bg-border" />}
      </div>
      <div className="min-w-0 flex-1 pb-1">
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="text-sm font-semibold text-foreground">{entry.user}</span>
          <span className={cn("text-sm", STATUS_TEXT[status])}>{entry.action}</span>
          {entry.launchName && entry.launchId && (
            <button
              type="button"
              onClick={() => onOpenLaunch(entry.launchId!)}
              className="max-w-full truncate text-sm font-medium text-foreground underline-offset-2 hover:underline"
              title={`Open ${entry.launchName}`}
            >
              {entry.launchName}
            </button>
          )}
          <span
            className="ml-auto shrink-0 font-g6-mono text-[11px] text-muted-foreground"
            title={formatDateTime(entry.ts)}
          >
            {relativeTime(entry.ts)}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{entry.detail}</p>
      </div>
    </li>
  );
}

/* ───────────────────────── screen ───────────────────────── */

export function Launch2Activity() {
  const navigate = useNavigate();

  const [userFilter, setUserFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  const users = useMemo(
    () => Array.from(new Set(activity.map((a) => a.user))).sort(),
    [],
  );

  const filtered = useMemo(() => {
    const window = DATE_WINDOWS[dateFilter];
    const now = Date.now();
    return activity
      .filter((e) => {
        if (userFilter !== "all" && e.user !== userFilter) return false;
        if (statusFilter !== "all" && (e.status ?? "ok") !== statusFilter) return false;
        if (window !== Infinity && now - new Date(e.ts).getTime() > window) return false;
        return true;
      })
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
  }, [userFilter, statusFilter, dateFilter]);

  // Group filtered entries by day, preserving newest-first order.
  const groups = useMemo(() => {
    const out: { label: string; entries: ActivityEntry[] }[] = [];
    for (const e of filtered) {
      const label = dayLabel(e.ts);
      const last = out[out.length - 1];
      if (last && last.label === label) last.entries.push(e);
      else out.push({ label, entries: [e] });
    }
    return out;
  }, [filtered]);

  const hasFilters = userFilter !== "all" || statusFilter !== "all" || dateFilter !== "all";

  function exportLog() {
    // Mock export — wire to CSV/download later.
    // eslint-disable-next-line no-console
    console.log("Export activity log", filtered);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-6 font-g6-sans">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => navigate("/launch2")}
            className="font-g6-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            ← Launch 2.0
          </button>
          <h1 className="font-g6-sans text-xl font-bold tracking-tight text-foreground">
            Activity log
          </h1>
          <p className="text-xs text-muted-foreground">
            Who launched, retried, and edited — attributable governance trail across every launch.
          </p>
        </div>
        <Button variant="outline" className="shrink-0" onClick={exportLog}>
          <Download className="h-4 w-4" />
          Export
        </Button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
        <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <ListFilter className="h-3.5 w-3.5" />
          Filter
        </span>

        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="User" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            {users.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="ok">OK</SelectItem>
            <SelectItem value="warn">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-9 text-xs"
            onClick={() => {
              setUserFilter("all");
              setStatusFilter("all");
              setDateFilter("all");
            }}
          >
            Clear
          </Button>
        )}
        <span className="ml-auto font-g6-mono text-[11px] text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "event" : "events"}
        </span>
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="h-5 w-5" />}
          title="No activity matches these filters"
          description="Loosen the user, status, or date filter to see more of the trail."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUserFilter("all");
                setStatusFilter("all");
                setDateFilter("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <section className="space-y-5">
          {groups.map((group) => (
            <div key={group.label}>
              <SectionHeader title={group.label} className="mb-1" />
              <ul className="rounded-lg border border-border bg-card px-3 py-1">
                {group.entries.map((entry, i) => (
                  <ActivityRow
                    key={entry.id}
                    entry={entry}
                    isLast={i === group.entries.length - 1}
                    onOpenLaunch={(launchId) => navigate(`/launch2/${launchId}`)}
                  />
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
