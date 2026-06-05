/**
 * Launch 2.0 — Home (genie-style hub).
 *
 * The launch command center. Content region only (the FabAds shell supplies the
 * rail, sub-nav, breadcrumb + outer padding). Reads live data straight from the
 * MetaLaunchService in render, so the seeded live run visibly progresses and
 * retries / draft edits reflect immediately (the Provider re-renders us on every
 * service event).
 *
 * Section order (top → bottom):
 *   1. Hero            — primary "+ New Launch" CTA + quick-start chips
 *   2. Recent launches — listLaunches() rows w/ StatusPill + RunProgressBar
 *   3. Account health  — listAccountHealth() busiest-page cap chips
 *   4. Winners shelf   — listWinners() OPS-ONLY relaunch strip (no ROAS/CTR)
 *   5. Strategy start  — the 7 STRATEGIES (Bruno verified · 6 [I] Est.)
 *   6. Drafts + Activity peek
 *   7. Subtle setup nudge
 *
 * Locked product rules honoured here:
 *   - Winners surface ops signal ONLY (proven · last-launched · ↻count · Relaunch).
 *   - Reliability cues: "Retry failed (N)" only when run.failed>0 (never retry-all).
 *   - Strategy provenance: Bruno verified; the other 6 get an "[I] Est." tag +
 *     inferredNote tooltip so inferred numbers aren't presented as locked.
 */
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  FileEdit,
  Inbox,
  Layers,
  Plug,
  Repeat2,
  RotateCcw,
  Rocket,
  Sparkles,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { useLaunch2 } from "../state/Launch2Context";
import { STRATEGIES, getStrategy, adsPerDestination } from "../data/strategies";
import { formatRelative, formatMoney } from "../utils/time";
import { RunProgressBar, StatusPill } from "../components/runViz";
import type { ActivityEvent, AccountHealth, LaunchPlan, LaunchRun, WinnerStrategy } from "../types";
import { CapMeter, EmptyState, InferredTag, SectionHeader } from "./home/parts";
import { STATUS } from "./home/tokens";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Compact "page A · page B · +N" summary of a run/plan's targets. */
function targetSummary(targets: { pageName: string }[]): string {
  if (targets.length === 0) return "No destination";
  const names = targets.map((t) => t.pageName);
  if (names.length <= 2) return names.join(" · ");
  return `${names.slice(0, 2).join(" · ")} · +${names.length - 2}`;
}

/** The single page closest to the 250 cap drives a health chip's meter. */
function busiestPage(health: AccountHealth) {
  return health.pages.reduce((top, p) => (p.activeAds > top.activeAds ? p : top), health.pages[0]);
}

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function Launch2Home() {
  const service = useLaunch2();
  const navigate = useNavigate();

  // Live reads — re-evaluated on every service event (progress / retry / drafts).
  const launches = service.listLaunches();
  const health = service.listAccountHealth();
  const winners = service.listWinners();
  const drafts = service.listDrafts();
  const activity = service.listActivity();

  const goNew = (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    navigate(`/launch2/new${qs}`);
  };
  const resumeDraft = (id: string) => navigate(`/launch2/new?draft=${encodeURIComponent(id)}`);

  return (
    <TooltipProvider delayDuration={150}>
      <div data-screen="launch2-home" className="mx-auto max-w-6xl space-y-7 pb-4">
        <Hero
          onNew={() => goNew()}
          onBrunoSpray={() => goNew({ mode: "quick", strategy: "bruno" })}
          onRelaunchWinner={() => goNew({ mode: "quick" })}
          firstDraftId={drafts[0]?.id}
          onResumeDraft={resumeDraft}
        />

        {/* Asymmetric primary row: recent launches (wide) + account health (rail). */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <RecentLaunches
            className="lg:col-span-2"
            launches={launches}
            onOpen={(id) => navigate(`/launch2/${id}`)}
            onRetry={(id) => service.retryFailed(id)}
            onNew={() => goNew()}
          />
          <AccountHealthStrip
            health={health}
            onViewAll={() => navigate("/launch2/health")}
          />
        </div>

        <WinnersShelf winners={winners} onRelaunch={(w) => goNew({ mode: "quick", strategy: w.strategyId })} />

        <StrategyQuickStart onPick={(id) => goNew({ strategy: id })} />

        {/* Asymmetric closing row: drafts (wide) + activity peek (rail). */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <DraftsPanel
            className="lg:col-span-2"
            drafts={drafts}
            onResume={resumeDraft}
            onDelete={(id) => service.deleteDraft(id)}
            onNew={() => goNew()}
          />
          <ActivityPeek activity={activity} onViewAll={() => navigate("/launch2/activity")} />
        </div>

        <SetupNudge />
      </div>
    </TooltipProvider>
  );
}

/* ================================================================== */
/*  1 · Hero                                                          */
/* ================================================================== */

function Hero({
  onNew,
  onBrunoSpray,
  onRelaunchWinner,
  firstDraftId,
  onResumeDraft,
}: {
  onNew: () => void;
  onBrunoSpray: () => void;
  onRelaunchWinner: () => void;
  firstDraftId?: string;
  onResumeDraft: (id: string) => void;
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border-primary/20 bg-gradient-to-br from-primary/[0.07] via-card to-card">
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-background/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3 text-foreground" />
            Launch command center
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Start a launch, watch it go live
          </h1>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Pick a mode and strategy, then five guided steps. Bulk-launch across pages with the 250-cap
            checked inline.
          </p>

          {/* Quick-start chips */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Quick start
            </span>
            <QuickChip icon={Rocket} label="Bruno spray" onClick={onBrunoSpray} />
            <QuickChip icon={Repeat2} label="Relaunch a winner" onClick={onRelaunchWinner} />
            {firstDraftId && (
              <QuickChip icon={FileEdit} label="Resume a draft" onClick={() => onResumeDraft(firstDraftId)} />
            )}
          </div>
        </div>

        <div className="shrink-0">
          <Button size="lg" onClick={onNew} className="shadow-sm">
            <Rocket className="h-4 w-4" />
            New Launch
          </Button>
        </div>
      </div>
    </Card>
  );
}

function QuickChip({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {label}
    </button>
  );
}

/* ================================================================== */
/*  2 · Recent launches                                              */
/* ================================================================== */

function RecentLaunches({
  launches,
  onOpen,
  onRetry,
  onNew,
  className,
}: {
  launches: LaunchRun[];
  onOpen: (id: string) => void;
  onRetry: (id: string) => void;
  onNew: () => void;
  className?: string;
}) {
  // Most-recent first, top 4. Live runs naturally sort high (recent createdAt).
  const recent = [...launches]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);
  const liveCount = recent.filter((r) => r.status === "launching" || r.status === "queued").length;

  return (
    <section className={className} aria-labelledby="h-recent">
      <SectionHeader
        id="h-recent"
        title="Recent launches"
        right={
          liveCount > 0 ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium leading-none"
              style={{ color: "#5B7611", backgroundColor: "rgba(143,184,33,0.14)" }}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ backgroundColor: "#5B7611" }} />
              <span className="font-mono tabular-nums">{liveCount}</span> live now
            </span>
          ) : (
            <button
              type="button"
              onClick={onNew}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              New launch
            </button>
          )
        }
      />

      {recent.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No launches yet"
          body="Your launches show up here with live progress and a failed-only retry. Kick off the first one."
          action={
            <Button size="sm" onClick={onNew}>
              <Rocket className="h-4 w-4" />
              New Launch
            </Button>
          }
        />
      ) : (
        <Card className="divide-y divide-border overflow-hidden rounded-2xl">
          {recent.map((run) => (
            <LaunchRow key={run.id} run={run} onOpen={() => onOpen(run.id)} onRetry={() => onRetry(run.id)} />
          ))}
        </Card>
      )}
    </section>
  );
}

function LaunchRow({ run, onOpen, onRetry }: { run: LaunchRun; onOpen: () => void; onRetry: () => void }) {
  const strategy = getStrategy(run.strategyId);
  const scheduled = run.status === "scheduled";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group flex cursor-pointer flex-col gap-3 p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:bg-muted/50 sm:flex-row sm:items-center"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <StatusPill status={run.status} />
          <span className="truncate text-sm font-medium text-foreground">{run.name}</span>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {run.strategyName} · {targetSummary(run.targets)} ·{" "}
          <span className="font-mono tabular-nums">{formatRelative(run.createdAt)}</span>
          {strategy && !strategy.verified && (
            <>
              {" "}
              <InferredTag note={strategy.inferredNote} className="ml-0.5 align-middle" />
            </>
          )}
        </p>
      </div>

      {/* Progress / schedule + retry */}
      <div className="flex items-center gap-3 sm:w-[280px] sm:shrink-0 sm:justify-end">
        {scheduled ? (
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            Runs {run.scheduledFor ? formatRelative(run.scheduledFor) : "soon"}
          </span>
        ) : (
          <div className="w-full max-w-[200px]">
            <RunProgressBar run={run} />
          </div>
        )}

        {run.failed > 0 ? (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            className="shrink-0"
            style={{ color: STATUS.err, borderColor: `${STATUS.err}55` }}
          >
            <RotateCcw className="h-4 w-4" />
            Retry failed ({run.failed})
          </Button>
        ) : (
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  3 · Account-health strip                                         */
/* ================================================================== */

function AccountHealthStrip({ health, onViewAll }: { health: AccountHealth[]; onViewAll: () => void }) {
  return (
    <section aria-labelledby="h-health">
      <SectionHeader
        id="h-health"
        title="Account health"
        right={
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        }
      />
      {health.length === 0 ? (
        <EmptyState
          icon={Plug}
          title="No accounts connected"
          body="Connect an ad account to see per-Page cap headroom against the 250 active-ads limit."
        />
      ) : (
        <Card className="rounded-2xl p-2">
          <div className="space-y-0.5">
            {health.slice(0, 4).map((h) => (
              <HealthChip key={h.accountId} health={h} />
            ))}
          </div>
          <p className="px-2 pb-1 pt-2 text-[11px] text-muted-foreground">Busiest Page per account, vs the 250 cap.</p>
        </Card>
      )}
    </section>
  );
}

function HealthChip({ health }: { health: AccountHealth }) {
  const page = busiestPage(health);
  const restricted = health.status === "restricted" || health.status === "disabled";
  const overCap = page.activeAds >= page.capacity;
  const nearCap = !overCap && page.activeAds / page.capacity >= 0.8;

  const flag = restricted
    ? { label: "restricted", color: STATUS.err }
    : overCap
      ? { label: "cap full", color: STATUS.err }
      : nearCap
        ? { label: "near cap", color: STATUS.warn }
        : { label: "healthy", color: STATUS.ok };

  return (
    <div className="rounded-lg px-2 py-2 transition-colors hover:bg-muted/50">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          {(restricted || overCap) && (
            <TriangleAlert className="h-3.5 w-3.5 shrink-0" style={{ color: STATUS.err }} />
          )}
          <span className="truncate text-xs font-medium text-foreground">{health.accountName}</span>
        </span>
        <span className="shrink-0 text-[10px] font-medium" style={{ color: flag.color }}>
          {flag.label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <CapMeter active={page.activeAds} capacity={page.capacity} restricted={restricted} className="flex-1" />
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
          {page.activeAds}/{page.capacity}
        </span>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  4 · Winners shelf — OPS SIGNAL ONLY (no ROAS / CTR / spend)       */
/* ================================================================== */

function WinnersShelf({ winners, onRelaunch }: { winners: WinnerStrategy[]; onRelaunch: (w: WinnerStrategy) => void }) {
  return (
    <section aria-labelledby="h-winners">
      <SectionHeader
        id="h-winners"
        title="Winners — quick relaunch"
        caption="Ops signal only — no performance metrics shown."
      />
      {winners.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No proven winners yet"
          body="Launches you mark as proven land here for one-tap relaunch across destinations."
        />
      ) : (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-3 pb-3">
            {winners.map((w) => (
              <WinnerCard key={w.id} winner={w} onRelaunch={() => onRelaunch(w)} />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </section>
  );
}

function WinnerCard({ winner, onRelaunch }: { winner: WinnerStrategy; onRelaunch: () => void }) {
  const strategy = getStrategy(winner.strategyId);
  return (
    <Card className="flex w-[248px] shrink-0 flex-col gap-3 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none",
            winner.proven ? "" : "bg-muted text-muted-foreground",
          )}
          style={winner.proven ? { color: STATUS.ok, backgroundColor: "rgba(82,196,26,0.12)" } : undefined}
        >
          {winner.proven && <CheckCircle2 className="h-3 w-3" />}
          {winner.proven ? "Proven" : "Tested"}
        </span>
        {strategy && !strategy.verified && <InferredTag note={strategy.inferredNote} />}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground" title={winner.name}>
          {winner.name}
        </p>
        <p className="mt-1 flex items-center gap-2 font-mono text-[11px] tabular-nums text-muted-foreground">
          <span>{formatRelative(winner.lastLaunchedAt)}</span>
          <span className="text-foreground/30">·</span>
          <span className="inline-flex items-center gap-0.5">
            <Repeat2 className="h-3 w-3" />
            {winner.relaunchCount}
          </span>
        </p>
      </div>

      <Button size="sm" variant="outline" onClick={onRelaunch} className="mt-auto w-full">
        <Repeat2 className="h-4 w-4" />
        Relaunch
      </Button>
    </Card>
  );
}

/* ================================================================== */
/*  5 · Strategy quick-start (the 7 playbooks)                       */
/* ================================================================== */

function StrategyQuickStart({ onPick }: { onPick: (id: string) => void }) {
  return (
    <section aria-labelledby="h-strategy">
      <SectionHeader
        id="h-strategy"
        title="Strategy quick-start"
        caption="Bruno is verified. The other six show [I] Est. numbers to confirm before you rely on them."
      />
      {/* Asymmetric grid: Bruno (verified) spans wider on the lead row. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STRATEGIES.map((s, i) => (
          <StrategyCard
            key={s.id}
            strategyId={s.id}
            onPick={() => onPick(s.id)}
            featured={i === 0}
            className={i === 0 ? "sm:col-span-2 lg:col-span-1" : undefined}
          />
        ))}
      </div>
    </section>
  );
}

function StrategyCard({
  strategyId,
  onPick,
  featured,
  className,
}: {
  strategyId: string;
  onPick: () => void;
  featured?: boolean;
  className?: string;
}) {
  const s = getStrategy(strategyId);
  if (!s) return null;
  const { campaigns, adSetsPerCampaign, adsPerAdSet } = s.structure;
  const structureLabel = `${campaigns} × ${adSetsPerCampaign} × ${adsPerAdSet}`;
  const total = adsPerDestination(s);

  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        "group flex flex-col rounded-2xl border bg-card p-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        featured ? "border-primary/30 bg-primary/[0.04]" : "border-border",
        className,
      )}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          {featured && <Sparkles className="h-3.5 w-3.5 text-foreground" />}
          {s.name}
        </span>
        {s.verified ? (
          <span
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-none"
            style={{ color: STATUS.ok, backgroundColor: "rgba(82,196,26,0.12)" }}
          >
            <CheckCircle2 className="h-3 w-3" />
            Verified
          </span>
        ) : (
          <InferredTag note={s.inferredNote} />
        )}
      </div>
      <p className="text-xs text-muted-foreground">{s.tagline}</p>
      <div className="mt-3 flex items-center gap-2 font-mono text-[11px] tabular-nums text-muted-foreground">
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-foreground">{structureLabel}</span>
        <span>{formatMoney(s.budgetPerAdSet, "USD")}/day</span>
        <span className="text-foreground/30">·</span>
        <span>{total} ads/dest</span>
      </div>
    </button>
  );
}

/* ================================================================== */
/*  6 · Drafts + Activity peek                                       */
/* ================================================================== */

function DraftsPanel({
  drafts,
  onResume,
  onDelete,
  onNew,
  className,
}: {
  drafts: LaunchPlan[];
  onResume: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  className?: string;
}) {
  const recent = [...drafts]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  return (
    <section className={className} aria-labelledby="h-drafts">
      <SectionHeader id="h-drafts" title="Drafts" caption="Autosaved as you build — pick up where you left off." />
      {recent.length === 0 ? (
        <EmptyState
          icon={FileEdit}
          title="No drafts"
          body="Start a launch and it autosaves here automatically, so an interrupted setup is never lost."
          action={
            <Button size="sm" variant="outline" onClick={onNew}>
              <Rocket className="h-4 w-4" />
              New Launch
            </Button>
          }
        />
      ) : (
        <Card className="divide-y divide-border overflow-hidden rounded-2xl">
          {recent.map((d) => (
            <DraftRow key={d.id} draft={d} onResume={() => onResume(d.id)} onDelete={() => onDelete(d.id)} />
          ))}
        </Card>
      )}
    </section>
  );
}

function DraftRow({ draft, onResume, onDelete }: { draft: LaunchPlan; onResume: () => void; onDelete: () => void }) {
  const strategy = getStrategy(draft.strategyId);
  return (
    <div className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/50">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <FileEdit className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{draft.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {strategy ? strategy.name : "No strategy yet"} · {targetSummary(draft.targets)} ·{" "}
          <span className="font-mono tabular-nums">{formatRelative(draft.updatedAt)}</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button size="sm" variant="outline" onClick={onResume}>
          Resume
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={onDelete}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              aria-label={`Delete draft ${draft.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="text-xs">Delete draft</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

function ActivityPeek({ activity, onViewAll }: { activity: ActivityEvent[]; onViewAll: () => void }) {
  const recent = activity.slice(0, 5);
  return (
    <section aria-labelledby="h-activity">
      <SectionHeader
        id="h-activity"
        title="Recent activity"
        right={
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        }
      />
      {recent.length === 0 ? (
        <EmptyState icon={Inbox} title="Nothing yet" body="Launches, retries and recoveries get logged here as they happen." />
      ) : (
        <Card className="rounded-2xl p-3">
          <ol className="space-y-0">
            {recent.map((ev, i) => (
              <li key={ev.id}>
                {i > 0 && <Separator className="my-0.5" />}
                <ActivityItem event={ev} />
              </li>
            ))}
          </ol>
        </Card>
      )}
    </section>
  );
}

const ACTIVITY_DOT: Record<ActivityEvent["type"], string> = {
  launch: STATUS.ok,
  recovery: STATUS.ok,
  retry: STATUS.warn,
  schedule: STATUS.warn,
  failure: STATUS.err,
  draft: "rgba(15,15,12,0.3)",
  settings: "rgba(15,15,12,0.3)",
};

function ActivityItem({ event }: { event: ActivityEvent }) {
  return (
    <div className="flex gap-2.5 px-1 py-2">
      <span
        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: ACTIVITY_DOT[event.type] }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium leading-snug text-foreground">{event.title}</p>
        {event.detail && <p className="truncate text-[11px] text-muted-foreground">{event.detail}</p>}
      </div>
      <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground/70">
        {formatRelative(event.at)}
      </span>
    </div>
  );
}

/* ================================================================== */
/*  7 · Subtle setup nudge                                           */
/* ================================================================== */

function SetupNudge() {
  return (
    <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground">
          <Layers className="h-4 w-4" />
        </span>
        <p className="text-xs text-muted-foreground">
          Connect more ad accounts, Pages and a Pixel to widen where you can launch.
        </p>
      </div>
      <Button size="sm" variant="ghost" className="shrink-0 text-muted-foreground hover:text-foreground" disabled>
        <Plug className="h-4 w-4" />
        Manage connections
      </Button>
    </div>
  );
}
