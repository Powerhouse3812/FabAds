/**
 * LaunchV2Hub — Launch 2.0 redesigned hub.
 * Heavy dashboard + light start-launch path per locked decisions
 * (.design-docs/lv2-redesign/01-hub-locks.md).
 *
 * Zones (top → bottom):
 *  1. Ops bar          — sticky, 5 KPI tiles (72px)
 *  2. Needs attention  — conditional, cap 4 + "View all (N)"
 *  3. Live launches    — 3-up grid (max 6 + "View all live →")
 *  4. Start a launch   — strategy tag chips + Blank launch + Manage strategies →
 *  5. Drafts           — resume mid-wizard (up to 3)
 *  6. Recent (7 days)  — tag-filterable compact rows + See all →
 *
 * Currency: USD only (`$`). Tabular-nums for numerics; mono ONLY for IDs.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Command,
  Plus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLaunchV2 } from "../state/LaunchV2Context";
import type { LaunchRunV2, RunStatus } from "../types";

/* ---------- mock data (Hub-local — UI-only redesign) ---------- */

interface OpsKpi {
  key: string;
  label: string;
  primary: string;
  secondary?: string;
  tone: "neutral" | "warn" | "danger";
}

interface NeedsAttentionItem {
  id: string;
  severity: "warn" | "danger";
  title: string;
  context: string;
  action: string;
}

interface LiveLaunch {
  id: string;
  name: string;
  account: string;
  strategyTag: string;
  adsLive: number;
  adsTotal: number;
  spendToday: number;
  budgetDay: number;
  startedAgo: string;
  health: "ok" | "watch" | "risk";
}

interface StrategyTag {
  id: string;
  label: string;
  count: number;
}

interface DraftRun {
  id: string;
  name: string;
  step: 1 | 2 | 3 | 4;
  stepLabel: string;
  account: string;
  savedAgo: string;
}

interface RecentRun {
  id: string;
  name: string;
  account: string;
  tag: string;
  status: "active" | "completed" | "failed" | "paused";
  spend: number;
  finishedAgo: string;
}

const OPS_KPIS: OpsKpi[] = [
  { key: "accounts", label: "Accounts",       primary: "5 active",  secondary: "1 disconnected", tone: "warn" },
  { key: "pixels",   label: "Pixels",         primary: "6 healthy", secondary: "1 stale",        tone: "warn" },
  { key: "cap",      label: "250-cap risk",   primary: "3 accounts", secondary: ">85% full",     tone: "danger" },
  { key: "spend",    label: "Spend today",    primary: "$1,243",    secondary: "vs $1,180 yest", tone: "neutral" },
  { key: "needs",    label: "Needs attention", primary: "4 items",   secondary: "2 high",         tone: "danger" },
];

const NEEDS_ATTENTION: NeedsAttentionItem[] = [
  { id: "na_1", severity: "danger", title: "Mamaearth — Sales Q2 paused by Meta",       context: "Policy review · 38 min ago",        action: "Review" },
  { id: "na_2", severity: "danger", title: "boAt — Audio Always-On at 247/250 ads",     context: "Within 3 of cap · act_boat_main",   action: "Trim" },
  { id: "na_3", severity: "warn",   title: "Sleepyhead pixel — 0 events in 6h",         context: "Was firing 4.2k/day · act_sleepy",  action: "Check" },
  { id: "na_4", severity: "warn",   title: "Noise — Retargeting CPA up 38% (24h)",      context: "$312 → $432 · LAL 1% — Tech",       action: "Open" },
];
const NEEDS_ATTENTION_TOTAL = 6;

const LIVE_LAUNCHES: LiveLaunch[] = [
  { id: "lr_1", name: "Mamaearth — Summer Glow Scale",  account: "act_mamaearth_in", strategyTag: "scale",     adsLive: 18, adsTotal: 18, spendToday: 412, budgetDay: 480, startedAgo: "2h ago", health: "ok"    },
  { id: "lr_2", name: "Noise — ColorFit Pro Carousel",  account: "act_noise_main",   strategyTag: "test",      adsLive: 10, adsTotal: 12, spendToday: 188, budgetDay: 240, startedAgo: "5h ago", health: "watch" },
  { id: "lr_3", name: "boAt — Airdopes LAL Retarget",   account: "act_boat_main",    strategyTag: "evergreen", adsLive: 24, adsTotal: 24, spendToday: 386, budgetDay: 400, startedAgo: "1d ago", health: "ok"    },
  { id: "lr_4", name: "Sleepyhead — Mattress Awareness", account: "act_sleepy",      strategyTag: "scale",     adsLive: 6,  adsTotal: 8,  spendToday: 142, budgetDay: 200, startedAgo: "3h ago", health: "risk"  },
];
const LIVE_TOTAL = 7;

const STRATEGY_TAGS: StrategyTag[] = [
  { id: "tag_scale",     label: "#scale",     count: 12 },
  { id: "tag_test",      label: "#test",      count: 8  },
  { id: "tag_evergreen", label: "#evergreen", count: 5  },
];

const DRAFTS: DraftRun[] = [
  { id: "dr_1", name: "Mamaearth — Q3 Onion Hair Refresh", step: 3, stepLabel: "Targeting",   account: "act_mamaearth_in", savedAgo: "12m ago" },
  { id: "dr_2", name: "Noise — Smartwatch Festive Push",   step: 2, stepLabel: "Setup",       account: "act_noise_main",   savedAgo: "4h ago"  },
  { id: "dr_3", name: "boAt — Diwali UGC Bundle",          step: 4, stepLabel: "Distribution", account: "act_boat_main",   savedAgo: "yesterday" },
];

const RECENT: RecentRun[] = [
  { id: "rr_1", name: "Mamaearth — Vitamin C Test Batch",  account: "act_mamaearth_in", tag: "test",      status: "completed", spend: 184,  finishedAgo: "6h ago" },
  { id: "rr_2", name: "Noise — Smartwatch Awareness V2",   account: "act_noise_main",   tag: "scale",     status: "active",    spend: 1240, finishedAgo: "1d ago" },
  { id: "rr_3", name: "boAt — Rockerz Always-On",          account: "act_boat_main",    tag: "evergreen", status: "active",    spend: 3120, finishedAgo: "2d ago" },
  { id: "rr_4", name: "Sleepyhead — Pillow Combo Test",    account: "act_sleepy",       tag: "test",      status: "paused",    spend: 96,   finishedAgo: "3d ago" },
  { id: "rr_5", name: "Mensa — Lead Gen Form V4",          account: "act_mensa",        tag: "scale",     status: "completed", spend: 824,  finishedAgo: "4d ago" },
  { id: "rr_6", name: "Mamaearth — Ubtan Carousel Test",   account: "act_mamaearth_in", tag: "test",      status: "failed",    spend: 12,   finishedAgo: "5d ago" },
];

/* ---------- helpers ---------- */

function formatUsd(amount: number): string {
  if (amount >= 1000) {
    return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  return `$${Math.round(amount)}`;
}

/* ---------- main ---------- */

export default function LaunchV2Hub() {
  const navigate = useNavigate();
  // Service kept available for future wiring; UI is dashboard-mocked per spec.
  useLaunchV2();

  const [recentTag, setRecentTag] = useState<string>("all");

  const recentFiltered = useMemo(() => {
    if (recentTag === "all") return RECENT;
    return RECENT.filter((r) => r.tag === recentTag);
  }, [recentTag]);

  const showNeedsAttention = NEEDS_ATTENTION.length > 0;
  const liveVisible = LIVE_LAUNCHES.slice(0, 6);
  const liveOverflow = Math.max(0, LIVE_TOTAL - liveVisible.length);

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 pb-12">

        {/* ─── Header ─── */}
        <header className="flex items-center justify-between gap-4 pt-6 pb-4">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight">
            Launches
          </h1>
          <div className="flex items-center gap-2">
            <CommandHint />
            <Button
              size="sm"
              onClick={() => navigate("/launchv2/new")}
              className="h-8 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Launch
            </Button>
          </div>
        </header>

        {/* ─── Zone 1 · Ops bar (sticky) ─── */}
        <section
          aria-label="Ops bar"
          className="sticky top-0 z-20 -mx-1 mb-6 bg-background/95 px-1 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {OPS_KPIS.map((k) => (
              <OpsTile key={k.key} kpi={k} />
            ))}
          </div>
        </section>

        {/* ─── Zone 2 · Needs attention (conditional) ─── */}
        {showNeedsAttention && (
          <section aria-label="Needs attention" className="mb-8">
            <SectionLabel
              title="Needs attention"
              count={NEEDS_ATTENTION_TOTAL}
              tone="danger"
            />
            <div className="mt-2 overflow-hidden rounded-2xl border border-destructive/20 bg-card">
              {NEEDS_ATTENTION.slice(0, 4).map((item, idx) => (
                <NeedsAttentionRow
                  key={item.id}
                  item={item}
                  isLast={idx === Math.min(3, NEEDS_ATTENTION.length - 1)}
                />
              ))}
            </div>
            {NEEDS_ATTENTION_TOTAL > 4 && (
              <button
                type="button"
                className="mt-2 text-xs font-medium text-foreground/80 hover:text-foreground"
              >
                View all ({NEEDS_ATTENTION_TOTAL}) →
              </button>
            )}
          </section>
        )}

        {/* ─── Zone 3 · Live launches ─── */}
        <section aria-label="Live launches" className="mb-8">
          <SectionLabel title="Live launches" count={LIVE_TOTAL} />
          {liveVisible.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No live launches. Last finished 2h ago —{" "}
              <button className="text-foreground underline-offset-2 hover:underline">
                Mamaearth — Vitamin C Test Batch →
              </button>
            </p>
          ) : (
            <>
              <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {liveVisible.map((run) => (
                  <LiveLaunchCard
                    key={run.id}
                    run={run}
                    onClick={() => navigate(`/launchv2/${run.id}`)}
                  />
                ))}
              </div>
              {liveOverflow > 0 && (
                <button
                  type="button"
                  className="mt-3 text-xs font-medium text-foreground/80 hover:text-foreground"
                >
                  View all live ({LIVE_TOTAL}) →
                </button>
              )}
            </>
          )}
        </section>

        {/* ─── Zone 4 · Start a launch ─── */}
        <section aria-label="Start a launch" className="mb-8">
          <SectionLabel title="Start a launch" />
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-4">
            <span className="mr-1 text-xs text-muted-foreground">
              From strategy
            </span>
            {STRATEGY_TAGS.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate(`/launchv2/new?tag=${t.label.replace("#", "")}`)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-foreground/40 hover:bg-foreground/[0.03]"
              >
                <span>{t.label}</span>
                <span className="tabular-nums text-muted-foreground">· {t.count}</span>
              </button>
            ))}
            <span className="mx-1 text-border">·</span>
            <button
              onClick={() => navigate("/launchv2/new")}
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              <Plus className="h-3 w-3" />
              Blank launch
            </button>
            <span className="ml-auto" />
            <button
              type="button"
              onClick={() => navigate("/launchv2/settings/strategy")}
              className="text-xs font-medium text-foreground/80 hover:text-foreground"
            >
              Manage strategies →
            </button>
          </div>
        </section>

        {/* ─── Zone 5 · Drafts ─── */}
        {DRAFTS.length > 0 && (
          <section aria-label="Drafts" className="mb-8">
            <SectionLabel title="Drafts" count={DRAFTS.length} />
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
              {DRAFTS.slice(0, 3).map((d) => (
                <DraftCard
                  key={d.id}
                  draft={d}
                  onResume={() => navigate(`/launchv2/new?draft=${d.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ─── Zone 6 · Recent (7 days) ─── */}
        <section aria-label="Recent" className="mb-4">
          <div className="flex items-end justify-between gap-3">
            <SectionLabel title="Recent (7 days)" count={RECENT.length} />
            <div className="flex flex-wrap items-center gap-1.5 pb-1">
              {[
                { id: "all",       label: "All" },
                { id: "scale",     label: "#scale" },
                { id: "test",      label: "#test" },
                { id: "evergreen", label: "#evergreen" },
              ].map((t) => {
                const active = recentTag === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setRecentTag(t.id)}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                      active
                        ? "border-foreground/40 bg-foreground/[0.04] text-foreground"
                        : "border-border bg-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-2 overflow-hidden rounded-2xl border border-border bg-card">
            {recentFiltered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Nothing tagged that in the last 7 days.
              </div>
            ) : (
              recentFiltered.map((r, idx) => (
                <RecentRow
                  key={r.id}
                  run={r}
                  isLast={idx === recentFiltered.length - 1}
                  onClick={() => navigate(`/launchv2/${r.id}`)}
                />
              ))
            )}
          </div>

          <button
            type="button"
            className="mt-3 text-xs font-medium text-foreground/80 hover:text-foreground"
          >
            See all in History →
          </button>
        </section>
      </div>
    </div>
  );
}

/* ---------- subcomponents ---------- */

function SectionLabel({
  title,
  count,
  tone = "neutral",
}: {
  title: string;
  count?: number;
  tone?: "neutral" | "danger";
}) {
  return (
    <h2
      className={cn(
        "text-[13px] font-medium",
        tone === "danger" ? "text-destructive" : "text-foreground"
      )}
    >
      {title}
      {typeof count === "number" && (
        <span className="ml-1.5 font-normal tabular-nums text-muted-foreground">
          · {count}
        </span>
      )}
    </h2>
  );
}

function CommandHint() {
  return (
    <div
      role="presentation"
      aria-hidden
      className="hidden items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground sm:inline-flex"
    >
      <Command className="h-3 w-3" />
      <span>K</span>
      <span className="mx-1 text-border">·</span>
      <span>Jump to launch, strategy, or account</span>
    </div>
  );
}

function OpsTile({ kpi }: { kpi: OpsKpi }) {
  const toneText =
    kpi.tone === "danger"
      ? "text-destructive"
      : kpi.tone === "warn"
      ? "text-amber-500"
      : "text-foreground";
  const toneBorder =
    kpi.tone === "danger"
      ? "border-destructive/20"
      : kpi.tone === "warn"
      ? "border-amber-500/20"
      : "border-border";
  return (
    <div
      className={cn(
        "flex h-[72px] flex-col justify-center rounded-2xl border bg-card px-3",
        toneBorder
      )}
    >
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {kpi.label}
      </span>
      <span className={cn("mt-0.5 text-base font-semibold tabular-nums leading-tight", toneText)}>
        {kpi.primary}
      </span>
      {kpi.secondary && (
        <span className="truncate text-[11px] tabular-nums text-muted-foreground">
          {kpi.secondary}
        </span>
      )}
    </div>
  );
}

function NeedsAttentionRow({
  item,
  isLast,
}: {
  item: NeedsAttentionItem;
  isLast: boolean;
}) {
  const dot =
    item.severity === "danger" ? "bg-destructive" : "bg-amber-500";
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3",
        !isLast && "border-b border-border"
      )}
    >
      <span className={cn("h-2 w-2 shrink-0 rounded-full", dot)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {item.title}
        </p>
        <p className="truncate text-xs text-muted-foreground">{item.context}</p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-7 rounded-lg px-2.5 text-xs"
      >
        {item.action}
      </Button>
    </div>
  );
}

function LiveLaunchCard({
  run,
  onClick,
}: {
  run: LiveLaunch;
  onClick: () => void;
}) {
  const pace = run.budgetDay > 0 ? run.spendToday / run.budgetDay : 0;
  const pacePct = Math.min(100, Math.round(pace * 100));

  const healthLabel =
    run.health === "ok" ? "On pace" : run.health === "watch" ? "Watch" : "At risk";
  const healthPill =
    run.health === "ok"
      ? "bg-primary/10 text-primary-foreground/80 border-primary/20"
      : run.health === "watch"
      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
      : "bg-destructive/10 text-destructive border-destructive/20";

  return (
    <button
      onClick={onClick}
      className="group flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-foreground/30"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 min-w-0 flex-1 text-sm font-medium leading-snug text-foreground">
          {run.name}
        </p>
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
            healthPill
          )}
        >
          {healthLabel}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="truncate">{run.account}</span>
        <span className="text-border">·</span>
        <span className="rounded-full bg-foreground/[0.04] px-1.5 py-0.5 text-[11px] text-foreground/80">
          #{run.strategyTag}
        </span>
      </div>

      <div className="mt-1 flex items-center justify-between gap-3 text-xs">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Ads live
          </span>
          <span className="tabular-nums text-foreground">
            {run.adsLive}
            <span className="text-muted-foreground">/{run.adsTotal}</span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Spend today
          </span>
          <span className="tabular-nums text-foreground">
            {formatUsd(run.spendToday)}
            <span className="text-muted-foreground">/{formatUsd(run.budgetDay)}</span>
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Started
          </span>
          <span className="tabular-nums text-foreground">{run.startedAgo}</span>
        </div>
      </div>

      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted/50">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            run.health === "risk"
              ? "bg-destructive/70"
              : run.health === "watch"
              ? "bg-amber-500/80"
              : "bg-foreground/40"
          )}
          style={{ width: `${pacePct}%` }}
        />
      </div>
    </button>
  );
}

function DraftCard({
  draft,
  onResume,
}: {
  draft: DraftRun;
  onResume: () => void;
}) {
  return (
    <button
      onClick={onResume}
      className="group flex flex-col gap-1.5 rounded-2xl border border-dashed border-border bg-card p-3 text-left transition-colors hover:border-foreground/40 hover:bg-foreground/[0.02]"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {draft.name}
        </p>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-foreground/80 group-hover:text-foreground">
          Resume <ArrowRight className="h-3 w-3" />
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Step {draft.step}</span>
        <span className="text-border">·</span>
        <span>{draft.stepLabel}</span>
        <span className="text-border">·</span>
        <span className="truncate">{draft.account}</span>
        <span className="ml-auto shrink-0 tabular-nums">{draft.savedAgo}</span>
      </div>
    </button>
  );
}

function RecentRow({
  run,
  isLast,
  onClick,
}: {
  run: RecentRun;
  isLast: boolean;
  onClick: () => void;
}) {
  const statusPill: Record<RecentRun["status"], string> = {
    active:    "bg-primary/10 text-foreground/80 border-primary/20",
    completed: "bg-foreground/[0.04] text-muted-foreground border-border",
    paused:    "bg-amber-500/10 text-amber-600 border-amber-500/20",
    failed:    "bg-destructive/10 text-destructive border-destructive/20",
  };
  const statusLabel: Record<RecentRun["status"], string> = {
    active: "Active",
    completed: "Done",
    paused: "Paused",
    failed: "Failed",
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-foreground/[0.02]",
        !isLast && "border-b border-border"
      )}
    >
      <span
        className={cn(
          "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
          statusPill[run.status]
        )}
      >
        {statusLabel[run.status]}
      </span>
      <p className="min-w-0 flex-1 truncate text-sm text-foreground">{run.name}</p>
      <span className="hidden truncate text-xs text-muted-foreground sm:inline">
        {run.account}
      </span>
      <span className="rounded-full bg-foreground/[0.04] px-1.5 py-0.5 text-[11px] text-foreground/70">
        #{run.tag}
      </span>
      <span className="w-16 shrink-0 text-right text-xs tabular-nums text-foreground">
        {formatUsd(run.spend)}
      </span>
      <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {run.finishedAgo}
      </span>
    </button>
  );
}

/* ---------- types touched (silence unused warnings) ---------- */
// Re-export the legacy run types so any callers that imported from the hub
// module continue to compile; the redesigned Hub itself only uses mocked
// view-models above and the service hook above for context bind.
export type { LaunchRunV2, RunStatus };
