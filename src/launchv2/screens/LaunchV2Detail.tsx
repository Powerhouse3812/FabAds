/**
 * Launch v2 — Detail / live progress (/launchv2/:id).
 *
 * Reads one live run via useRunV2(id) (re-renders as the mock ticks). The spine
 * is reliability accounting: a tri-segment progress bar + four distinct stat
 * tiles (requested / created / failed / pending) so it's always legible that a
 * *failed* ad was never launched. "Retry failed only" touches only the failed
 * units and says so. Covers live, scheduled, completed/partial and not-found.
 *
 * Mirrors launch2's Detail quality; uses the launchv2 LaunchRunV2 shape.
 */
import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  BookmarkPlus,
  CalendarClock,
  Check,
  Info,
  RotateCcw,
  Target,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useLaunchV2, useRehydratedRunId, useRunV2 } from "../state/LaunchV2Context";
import { formatMoney, formatRelative } from "@/launch2/utils/time";
import type { LaunchRunV2, PlanV2, RunStatus } from "../types";
import { DetailUnitTree, type UnitFilter } from "./review/DetailUnitTree";
import { ERR, ERR_TEXT, OK, OK_TEXT, WARN, WARN_TEXT } from "./review/reviewParts";
import { strategiesService } from "../services/strategiesService";

const FILTERS: { id: UnitFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "failed", label: "Failed" },
  { id: "created", label: "Created" },
  { id: "pending", label: "Pending" },
];

/** Read the PlanV2 snapshot from sessionStorage (saved by useFlowV2 autosave). */
function readPlanFromSession(planId: string): Partial<PlanV2> | null {
  try {
    const raw = typeof sessionStorage !== "undefined"
      ? sessionStorage.getItem(`launchv2:flow:${planId}`)
      : null;
    if (!raw) return null;
    return JSON.parse(raw) as PlanV2;
  } catch {
    return null;
  }
}

/** Build a minimal saveable plan from a run when the full plan isn't in sessionStorage. */
function minimalPlanFromRun(run: LaunchRunV2): Partial<PlanV2> {
  const unique = new Map(run.units.map((u) => [u.target.fbPageId, u.target]));
  const targets = [...unique.values()].map((t) => ({
    accountId: t.accountId,
    accountName: t.accountName,
    currency: run.currency,
    pageId: t.pageId,
    fbPageId: t.fbPageId,
    pageName: t.pageName,
    pixelId: t.pixelId,
  }));
  return {
    name: run.name,
    budgetAmount: run.budgetPerDay,
    budgetMode: "CBO" as const,
    targets,
  };
}

/**
 * Inline "Save as Strategy" widget — shown in the success / partial card.
 * Reads the full plan from sessionStorage; falls back to a minimal run-derived snapshot.
 */
function SaveAsStrategyRow({ run }: { run: LaunchRunV2 }) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const defaultName = `${run.name} · ${new Date().toISOString().slice(0, 10)}`;
  const [name, setName] = useState(defaultName);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleOpen() {
    setOpen(true);
    // Focus the input on next tick
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleSave() {
    if (!name.trim()) return;
    const planSnapshot = readPlanFromSession(run.planId) ?? minimalPlanFromRun(run);
    strategiesService.save(name.trim(), planSnapshot);
    setSaved(true);
    // Reset after 3 s so user can save again with a different name
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
      setName(defaultName);
    }, 3000);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") { setOpen(false); setName(defaultName); }
  }

  if (saved) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-green-500/25 bg-green-500/8 px-3.5 py-2.5 text-sm text-green-700 dark:text-green-400">
        <Check className="h-4 w-4 shrink-0" />
        <span>Strategy saved — find it in <span className="font-medium">Launch v2 → Strategies</span>.</span>
      </div>
    );
  }

  if (open) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Strategy name…"
          className={cn(
            "h-8 flex-1 min-w-48 rounded-lg border bg-background px-3 text-sm outline-none",
            "focus:ring-2 focus:ring-primary/25 focus:border-primary",
            "placeholder:text-muted-foreground/50",
          )}
        />
        <Button size="sm" onClick={handleSave} disabled={!name.trim()}>
          Save
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => { setOpen(false); setName(defaultName); }}
          className="text-muted-foreground"
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleOpen}>
      <BookmarkPlus className="h-4 w-4" />
      Save as Strategy
    </Button>
  );
}

export default function LaunchV2Detail() {
  const { id } = useParams();
  const service = useLaunchV2();
  const run = useRunV2(id);
  const navigate = useNavigate();
  const [filter, setFilter] = useState<UnitFilter>("all");
  const rehydratedRunId = useRehydratedRunId();
  const wasRehydrated = !!id && id === rehydratedRunId;

  /* ---- not found ---- */
  if (!run) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-5 py-6">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Target className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Launch not found</h2>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              This launch doesn't exist or may have been removed. It might still be a draft.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/launchv2")}>
            <ArrowLeft className="h-4 w-4" />
            Back to Launch v2
          </Button>
        </div>
      </div>
    );
  }

  const isScheduled = run.status === "scheduled";
  const isLive = run.status === "launching";
  const targetLabel = run.units.length
    ? uniquePages(run) === 1
      ? run.units[0].target.pageName
      : `${uniquePages(run)} Pages`
    : "—";
  const counts = filterCounts(run);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-5 py-6">
      {/* Back + header */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate("/launchv2")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Launch v2
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight">{run.name}</h1>
              <StatusPill status={run.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" />
                {targetLabel}
              </span>
              <Separator orientation="vertical" className="h-3.5" />
              <span className="inline-flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5" />
                <span className="font-mono tabular-nums">{formatMoney(run.budgetPerDay, run.currency)}</span>
                /day
              </span>
              <Separator orientation="vertical" className="h-3.5" />
              <span className="font-mono tabular-nums">{run.requested} requested</span>
              <Separator orientation="vertical" className="h-3.5" />
              <span>{formatRelative(run.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Re-hydration / stale banners */}
      {wasRehydrated && run.status !== "stale" && (
        <div className="flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm text-primary">
          <Info className="h-4 w-4 shrink-0" />
          <span>Refreshed from previous session — showing your last launch progress.</span>
        </div>
      )}
      {run.status === "stale" && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            The plan changed since this launch was started — the progress below may not match the current plan.
          </span>
        </div>
      )}

      {/* Scheduled state — no progress churn */}
      {isScheduled ? (
        <ScheduledCard scheduledFor={run.scheduledFor} requested={run.requested} />
      ) : (
        <>
          {/* Reliability accounting */}
          <Card className="rounded-2xl">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">{isLive ? "Launching — live" : "Launch result"}</h2>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">{run.requested} requested</span>
              </div>

              <RunProgressBar run={run} />

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile label="Requested" value={run.requested} hint="ads in this launch" />
                <StatTile label="Created" value={run.created} tone="created" hint="live on Meta" />
                <StatTile label="Failed" value={run.failed} tone="failed" hint="not launched" />
                <StatTile label="Pending" value={run.pending} tone="pending" hint={isLive ? "in progress" : "awaiting"} />
              </div>

              {/* failed ≠ launched, said plainly */}
              {run.failed > 0 && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Failed ads were not launched.</span>{" "}
                  Only the {run.created} created ads are live on Meta — the {run.failed} failed{" "}
                  {run.failed === 1 ? "ad" : "ads"} created nothing.
                </p>
              )}

              {/* Retry failed only */}
              {run.failed > 0 && (
                <>
                  <Separator />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="max-w-md text-xs text-muted-foreground">
                      Retries only the{" "}
                      <span className="font-medium text-foreground">
                        {run.failed} failed {run.failed === 1 ? "ad" : "ads"}
                      </span>{" "}
                      · never re-runs the {run.created} already created.
                      {run.retryCount > 0 && (
                        <span className="ml-1 font-mono text-[11px] tabular-nums text-muted-foreground/70">
                          retried ×{run.retryCount}
                        </span>
                      )}
                    </p>
                    <Button variant="outline" size="sm" disabled={isLive} onClick={() => service.retryFailed(run.id)}>
                      <RotateCcw className="h-4 w-4" />
                      Retry failed only ({run.failed})
                    </Button>
                  </div>
                </>
              )}

              {/* Save as Strategy — shown once the launch has settled (completed or partial) */}
              {(run.status === "completed" || run.status === "partial") && (
                <>
                  <Separator />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Reuse this setup for future launches.
                    </p>
                    <SaveAsStrategyRow run={run} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Unit tree + filters */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">Ads in this launch</h2>
              <div className="flex flex-wrap items-center gap-1.5">
                {FILTERS.map((f) => {
                  const active = filter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilter(f.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                        active ? "border-transparent bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {f.label}
                      <span className="font-mono tabular-nums opacity-70">{counts[f.id]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <DetailUnitTree units={run.units} filter={filter} />
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Local run visuals (launchv2 RunStatus shape)                       */
/* ------------------------------------------------------------------ */
function StatusPill({ status }: { status: RunStatus }) {
  const meta: Record<RunStatus, { label: string; color: string; bg: string; pulse?: boolean }> = {
    launching: { label: "Launching", color: "#5B7611", bg: "rgba(143,184,33,0.14)", pulse: true },
    completed: { label: "Completed", color: OK, bg: "rgba(82,196,26,0.12)" },
    partial: { label: "Partial", color: WARN, bg: "rgba(250,173,20,0.14)" },
    failed: { label: "Failed", color: ERR, bg: "rgba(255,77,79,0.12)" },
    scheduled: { label: "Scheduled", color: "rgba(15,15,12,0.55)", bg: "rgba(15,15,12,0.06)" },
    queued: { label: "Queued", color: "rgba(15,15,12,0.55)", bg: "rgba(15,15,12,0.06)" },
    stale: { label: "Stale", color: WARN, bg: "rgba(250,173,20,0.12)" },
  };
  const m = meta[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium leading-none"
      style={{ color: m.color, backgroundColor: m.bg }}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", m.pulse && "animate-pulse")} style={{ backgroundColor: m.color }} />
      {m.label}
    </span>
  );
}

/** Tri-segment bar: created (green) · failed (red) · pending (muted track). */
function RunProgressBar({ run }: { run: Pick<LaunchRunV2, "requested" | "created" | "failed" | "pending"> }) {
  const total = Math.max(run.requested, 1);
  const pct = (n: number) => `${(n / total) * 100}%`;
  return (
    <div className="space-y-1.5">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-foreground/[0.06]">
        <div style={{ width: pct(run.created), backgroundColor: OK }} />
        <div style={{ width: pct(run.failed), backgroundColor: ERR }} />
      </div>
      <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums text-muted-foreground">
        <span style={{ color: OK_TEXT }}>{run.created} created</span>
        {run.failed > 0 && <span style={{ color: ERR_TEXT }}>{run.failed} failed</span>}
        {run.pending > 0 && <span>{run.pending} pending</span>}
        <span className="text-foreground/40">of {run.requested}</span>
      </div>
    </div>
  );
}

type Tone = "neutral" | "created" | "failed" | "pending";
function StatTile({ label, value, tone = "neutral", hint }: { label: string; value: number; tone?: Tone; hint?: string }) {
  const color = tone === "created" ? OK_TEXT : tone === "failed" ? ERR_TEXT : undefined;
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-xl border bg-card px-3 py-2.5",
        tone === "failed" && value > 0 && "border-[color:rgba(255,77,79,0.35)]",
      )}
    >
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span
        className={cn("font-mono text-xl font-semibold tabular-nums leading-none", tone === "pending" && "text-muted-foreground")}
        style={color ? { color } : undefined}
      >
        {value}
      </span>
      {hint && <span className="text-[11px] leading-tight text-muted-foreground">{hint}</span>}
    </div>
  );
}

function ScheduledCard({ scheduledFor, requested }: { scheduledFor?: string; requested: number }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <CalendarClock className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Not yet launched</h2>
          <p className="text-sm text-muted-foreground">
            Scheduled to launch{" "}
            {scheduledFor ? (
              <span className="font-medium text-foreground">{formatRelative(scheduledFor)}</span>
            ) : (
              "later"
            )}
            . No ads have been created yet.
          </p>
        </div>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">{requested} ads queued</span>
      </CardContent>
    </Card>
  );
}

/* ---- helpers ---- */
function filterCounts(run: LaunchRunV2): Record<UnitFilter, number> {
  let created = 0;
  let failed = 0;
  let pending = 0;
  for (const u of run.units) {
    if (u.status === "created") created++;
    else if (u.status === "failed") failed++;
    else pending++;
  }
  return { all: run.units.length, created, failed, pending };
}

function uniquePages(run: LaunchRunV2): number {
  return new Set(run.units.map((u) => u.target.fbPageId)).size;
}
