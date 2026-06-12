import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Pause,
  Play,
  RefreshCcw,
  Rocket,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLaunchV2 } from "../state/LaunchV2Context";
import type { LaunchRunV2, RunStatus } from "../types";

/* ---------- helpers ---------- */

type FilterKey = "all" | "live" | "today" | "failed" | "scheduled";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "today", label: "Today" },
  { key: "failed", label: "Failed" },
  { key: "scheduled", label: "Scheduled" },
];

/** Status is "live" while launching or partial (still in flight / serving). */
function isLive(status: RunStatus) {
  return status === "launching" || status === "partial";
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function statusLabel(status: RunStatus) {
  switch (status) {
    case "queued": return "Queued";
    case "launching": return "Launching";
    case "partial": return "Partial";
    case "completed": return "Done";
    case "failed": return "Failed";
    case "scheduled": return "Scheduled";
    default: return status;
  }
}

/** Tailwind classes for the status pill, using semantic tokens only. */
function statusPillClasses(status: RunStatus) {
  switch (status) {
    case "completed":
      return "text-primary border-primary/20 bg-primary/5";
    case "launching":
      return "text-amber-400 border-amber-500/20 bg-amber-500/5";
    case "partial":
      return "text-orange-400 border-orange-500/20 bg-orange-500/5";
    case "failed":
      return "text-destructive border-destructive/30 bg-destructive/5";
    case "scheduled":
      return "text-sky-400 border-sky-500/20 bg-sky-500/5";
    case "queued":
    default:
      return "text-muted-foreground border-border bg-muted/40";
  }
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const CURRENCY_SYMBOL: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

function formatSpend(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOL[currency] ?? "";
  if (amount >= 100000) return `${sym}${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${sym}${(amount / 1000).toFixed(1)}k`;
  return `${sym}${Math.round(amount)}`;
}

/** Primary ad-account chip for a run (first unit's target). */
function runAccountName(run: LaunchRunV2): string | null {
  return run.units[0]?.target.accountName ?? null;
}

/* ---------- main ---------- */

export default function LaunchV2Hub() {
  const navigate = useNavigate();
  const service = useLaunchV2();
  const allRuns = service.listRuns();
  const [filter, setFilter] = useState<FilterKey>("all");

  const counts = useMemo(() => {
    const liveCount = allRuns.filter((r) => isLive(r.status)).length;
    const adsLive = allRuns
      .filter((r) => isLive(r.status) || r.status === "completed")
      .reduce((sum, r) => sum + r.created, 0);
    const failedCount = allRuns.filter(
      (r) => r.status === "failed" || (r.status === "partial" && r.failed > 0)
    ).length;
    const scheduledCount = allRuns.filter((r) => r.status === "scheduled").length;
    return { liveCount, adsLive, failedCount, scheduledCount };
  }, [allRuns]);

  const filtered = useMemo(() => {
    switch (filter) {
      case "live":
        return allRuns.filter((r) => isLive(r.status));
      case "today":
        return allRuns.filter((r) => isToday(r.createdAt));
      case "failed":
        return allRuns.filter(
          (r) => r.status === "failed" || (r.status === "partial" && r.failed > 0)
        );
      case "scheduled":
        return allRuns.filter((r) => r.status === "scheduled");
      case "all":
      default:
        return allRuns;
    }
  }, [allRuns, filter]);

  const featured = filtered[0];
  const strip = filtered.slice(1, 6);

  const heroSentence = (() => {
    if (allRuns.length === 0) return "All clear. Start a new launch?";
    if (counts.failedCount > 0) {
      return `${counts.liveCount} ${
        counts.liveCount === 1 ? "launch" : "launches"
      } running. ${counts.failedCount} need attention.`;
    }
    if (counts.liveCount > 0) {
      return `${counts.liveCount} ${
        counts.liveCount === 1 ? "launch" : "launches"
      } running.`;
    }
    return "All clear. Start a new launch?";
  })();

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-6 px-5 py-6">

        {/* Title row */}
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold leading-tight">Launch v2</h1>
          <p className="text-sm text-muted-foreground">{heroSentence}</p>
        </div>

        {/* A. Today hero strip — primary action + KPI cluster */}
        <section
          aria-label="Today"
          className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-stretch"
        >
          {/* Prompt-style start button */}
          <button
            onClick={() => navigate("/launchv2/new")}
            className={cn(
              "group relative flex h-full min-h-[88px] items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-left",
              "transition-all hover:border-primary/40 hover:bg-card/80",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:border-primary/60",
              "focus-visible:shadow-[0_0_0_4px_rgba(195,235,66,0.08)]"
            )}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-base font-medium leading-tight">Start a launch</span>
              <span className="truncate text-xs text-muted-foreground">
                Pick an objective, format, and creatives — bulk Meta in four steps.
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
          </button>

          {/* KPI cluster */}
          <div className="grid grid-cols-3 gap-2 md:w-[280px]">
            <KpiTile label="In-flight" value={counts.liveCount} tone="neutral" />
            <KpiTile label="Ads live" value={counts.adsLive} tone="primary" />
            <KpiTile
              label="Need attention"
              value={counts.failedCount}
              tone={counts.failedCount > 0 ? "danger" : "neutral"}
            />
          </div>
        </section>

        {/* B. Recent launches */}
        <section aria-label="Recent launches" className="space-y-3">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Recent launches
            </p>
            {/* Filter chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {FILTERS.map((f) => {
                const active = filter === f.key;
                // Hide Scheduled chip when there are none (unless already active).
                const showZero =
                  f.key === "scheduled" &&
                  counts.scheduledCount === 0 &&
                  filter !== "scheduled";
                if (showZero) return null;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                      active
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-border bg-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body */}
          {allRuns.length === 0 ? (
            <EmptyState onStart={() => navigate("/launchv2/new")} />
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">
                Nothing here for{" "}
                <span className="text-foreground">
                  {FILTERS.find((f) => f.key === filter)?.label}
                </span>
                .
              </p>
            </div>
          ) : (
            <>
              {featured && (
                <FeaturedRunCard
                  run={featured}
                  onView={() => navigate(`/launchv2/${featured.id}`)}
                  onRelaunch={() => navigate(`/launchv2/new?from=${featured.planId}`)}
                />
              )}

              {strip.length > 0 && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {strip.map((run) => (
                    <CompactRunCard
                      key={run.id}
                      run={run}
                      onClick={() => navigate(`/launchv2/${run.id}`)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>

      </div>
    </div>
  );
}

/* ---------- subcomponents ---------- */

function KpiTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "primary" | "danger";
}) {
  const valueColor =
    tone === "primary"
      ? "text-primary"
      : tone === "danger"
      ? "text-destructive"
      : "text-foreground";
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border bg-card px-3 py-2.5">
      <span
        className={cn(
          "font-mono text-xl font-semibold tabular-nums leading-none",
          valueColor
        )}
      >
        {value}
      </span>
      <span className="mt-1.5 text-[10px] uppercase tracking-wider leading-tight text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function StatusPill({ status }: { status: RunStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        statusPillClasses(status)
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

function AccountChip({ name }: { name: string }) {
  return (
    <span className="inline-flex max-w-[160px] items-center gap-1 truncate rounded-md border border-border bg-muted/30 px-1.5 py-0.5 text-[11px] text-muted-foreground">
      <span className="truncate">{name}</span>
    </span>
  );
}

function FeaturedRunCard({
  run,
  onView,
  onRelaunch,
}: {
  run: LaunchRunV2;
  onView: () => void;
  onRelaunch: () => void;
}) {
  const live = isLive(run.status);
  const account = runAccountName(run);
  const total = run.requested || 1;
  const progress = Math.min(100, Math.round((run.created / total) * 100));
  const showProgress =
    live || (run.created > 0 && run.created < run.requested);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card p-4",
        live ? "border-primary/30" : "border-border"
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <button
          onClick={onView}
          className="flex min-w-0 flex-1 flex-col items-start text-left"
        >
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={run.status} />
            {account && <AccountChip name={account} />}
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {relativeTime(run.createdAt)}
            </span>
          </div>
          <p className="mt-2 truncate text-sm font-medium leading-tight">
            {run.name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>
              <span className="font-mono tabular-nums text-foreground">
                {run.created}
              </span>
              <span className="text-muted-foreground">/{run.requested}</span> ads live
            </span>
            <span className="text-border">·</span>
            <span>
              <span className="font-mono tabular-nums text-foreground">
                {formatSpend(run.budgetPerDay, run.currency)}
              </span>{" "}
              <span className="text-muted-foreground">/day</span>
            </span>
            {run.failed > 0 && (
              <>
                <span className="text-border">·</span>
                <span className="text-destructive">
                  <span className="font-mono tabular-nums">{run.failed}</span> failed
                </span>
              </>
            )}
          </div>
        </button>

        {/* Inline actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={onView}
            className="h-7 rounded-lg px-2.5 text-xs"
          >
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onRelaunch}
            className="h-7 rounded-lg px-2.5 text-xs"
          >
            <RefreshCcw className="mr-1 h-3 w-3" />
            Re-launch
          </Button>
          {live && (
            <Button
              size="sm"
              variant="outline"
              onClick={onView}
              className="h-7 rounded-lg px-2.5 text-xs"
              aria-label="Pause"
            >
              <Pause className="h-3 w-3" />
            </Button>
          )}
          {run.status === "scheduled" && (
            <Button
              size="sm"
              variant="outline"
              onClick={onView}
              className="h-7 rounded-lg px-2.5 text-xs"
              aria-label="Resume"
            >
              <Play className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {showProgress && (
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted/50">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              run.status === "failed" || run.status === "partial"
                ? "bg-destructive/70"
                : "bg-primary"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

function CompactRunCard({
  run,
  onClick,
}: {
  run: LaunchRunV2;
  onClick: () => void;
}) {
  const account = runAccountName(run);
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-1.5 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/30 hover:bg-card/80"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-medium leading-tight">
          {run.name}
        </p>
        <StatusPill status={run.status} />
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex min-w-0 items-center gap-1.5">
          {account && <AccountChip name={account} />}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="font-mono tabular-nums text-foreground">
            {formatSpend(run.budgetPerDay, run.currency)}
          </span>
          <span className="text-border">·</span>
          <span className="font-mono tabular-nums">
            {relativeTime(run.createdAt)}
          </span>
        </div>
      </div>
    </button>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
        <Rocket className="h-5 w-5" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium">No launches yet</p>
        <p className="text-xs text-muted-foreground">
          Your launches will appear here. Start one to see it tracked in real time.
        </p>
      </div>
      <Button
        onClick={onStart}
        size="sm"
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        Start your first launch
      </Button>
    </div>
  );
}
