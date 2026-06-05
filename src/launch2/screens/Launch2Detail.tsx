/**
 * Launch 2.0 — Launch Detail / live progress.
 *
 * Reads one live run via useLaunchRun(id) (re-renders as the mock ticks). The
 * spine here is reliability accounting: a tri-segment progress bar + four
 * distinct stat tiles (requested / created / failed / pending) so it's always
 * legible that a *failed* ad was never launched. Retry-failed-only touches only
 * the failed units and says so. Covers live, scheduled, completed/partial and
 * not-found states.
 */
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarClock,
  RotateCcw,
  Target,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useLaunch2, useLaunchRun } from "../state/Launch2Context";
import { getStrategy } from "../data/strategies";
import { formatMoney, formatRelative } from "../utils/time";
import { RunProgressBar, StatusPill } from "../components/runViz";
import { EmptyState, StatTile } from "./detail/parts";
import { UnitTree, type UnitFilter } from "./detail/UnitTree";

const FILTERS: { id: UnitFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "failed", label: "Failed" },
  { id: "created", label: "Created" },
  { id: "pending", label: "Pending" },
];

export default function Launch2Detail() {
  const { id } = useParams();
  const service = useLaunch2();
  const run = useLaunchRun(id);
  const navigate = useNavigate();
  const [filter, setFilter] = useState<UnitFilter>("all");

  /* ---- not found ---- */
  if (!run) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <EmptyState
          icon={<Target className="h-5 w-5" />}
          title="Launch not found"
          description="This launch doesn't exist or may have been removed. It might still be a draft."
          action={
            <Button variant="outline" onClick={() => navigate("/launch2")}>
              <ArrowLeft className="h-4 w-4" />
              Back to Launch 2.0
            </Button>
          }
        />
      </div>
    );
  }

  const strategy = getStrategy(run.strategyId);
  const isScheduled = run.status === "scheduled";
  const isLive = run.status === "launching";
  const targetLabel =
    run.targets.length === 1
      ? run.targets[0].pageName
      : `${run.targets.length} Pages`;

  const counts = filterCounts(run);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Back + header */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate("/launch2")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Launch 2.0
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight">{run.name}</h1>
              <StatusPill status={run.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>{run.strategyName}</span>
              {strategy && !strategy.verified && (
                <span className="font-mono text-[11px] text-muted-foreground/70">[I] inferred</span>
              )}
              <Separator orientation="vertical" className="h-3.5" />
              <span className="inline-flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" />
                {targetLabel}
              </span>
              <Separator orientation="vertical" className="h-3.5" />
              <span className="inline-flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5" />
                <span className="font-mono tabular-nums">
                  {formatMoney(run.budgetPerDay, run.currency)}
                </span>
                /day
              </span>
              <Separator orientation="vertical" className="h-3.5" />
              <span>{formatRelative(run.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scheduled state — no progress churn */}
      {isScheduled ? (
        <ScheduledCard scheduledFor={run.scheduledFor} requested={run.requested} />
      ) : (
        <>
          {/* Reliability accounting */}
          <Card className="rounded-2xl">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">
                  {isLive ? "Launching — live" : "Launch result"}
                </h2>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {run.requested} requested
                </span>
              </div>

              <RunProgressBar run={run} showCounts={false} />

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile label="Requested" value={run.requested} hint="ads in this launch" />
                <StatTile label="Created" value={run.created} tone="created" hint="live on Meta" />
                <StatTile
                  label="Failed"
                  value={run.failed}
                  tone="failed"
                  hint="not launched"
                />
                <StatTile
                  label="Pending"
                  value={run.pending}
                  tone="pending"
                  hint={isLive ? "in progress" : "awaiting"}
                />
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
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isLive}
                      onClick={() => service.retryFailed(run.id)}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Retry failed only ({run.failed})
                    </Button>
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
                  const count = counts[f.id];
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilter(f.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                        active
                          ? "border-transparent bg-primary text-primary-foreground"
                          : "bg-card text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {f.label}
                      <span className="font-mono tabular-nums opacity-70">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <UnitTree units={run.units} filter={filter} />
          </div>
        </>
      )}
    </div>
  );
}

/* ---- helpers ---- */

function filterCounts(run: { units: { status: string }[] }): Record<UnitFilter, number> {
  let created = 0;
  let failed = 0;
  let pending = 0;
  for (const u of run.units) {
    if (u.status === "created") created++;
    else if (u.status === "failed") failed++;
    else pending++; // pending + creating
  }
  return { all: run.units.length, created, failed, pending };
}

function ScheduledCard({
  scheduledFor,
  requested,
}: {
  scheduledFor?: string;
  requested: number;
}) {
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
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {requested} ads queued
        </span>
      </CardContent>
    </Card>
  );
}
