import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Activity,
  CheckCircle2,
  Gauge,
  Link2,
  PlugZap,
  Radio,
  RotateCcw,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  KpiTile,
  LaunchCard,
  SectionHeader,
  Shelf,
  WinnerCard,
} from "@/launch2/components";
import { STRATEGY_ORDER, STRATEGY_PRESETS } from "@/launch2/lib/strategyPresets";
import {
  accounts,
  activity,
  drafts,
  launches,
  pages,
  winners,
} from "@/launch2/mocks";
import { useLaunch2Overlay } from "@/launch2/shell/Launch2OverlayProvider";
import type { LaunchSummary, Page } from "@/launch2/types";
import { AccountHealthStrip } from "../components/AccountHealthStrip";
import { RecentActivity, RecentDrafts } from "../components/LowerPanels";
import { SetupNudges, type SetupNudge } from "../components/SetupNudges";
import { StrategyQuickStartCard } from "../components/StrategyQuickStartCard";

const DAY_MS = 24 * 60 * 60 * 1000;

function greetingWord(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

/** Tightest page = least (capLimit - adCount). */
function tightestPage(list: Page[]): Page | null {
  return list.reduce<Page | null>((min, p) => {
    if (!min) return p;
    return p.capLimit - p.adCount < min.capLimit - min.adCount ? p : min;
  }, null);
}

/* ─────────────────────────────── Zero-data ─────────────────────────────── */

function ZeroDataHome() {
  const { open } = useLaunch2Overlay();
  const navigate = useNavigate();

  const nudges: SetupNudge[] = [
    {
      icon: <PlugZap className="h-5 w-5" />,
      title: "Connect an ad account",
      sub: "Link a Business Manager and ad account so launches have somewhere to go.",
      cta: "Connect account",
      primary: true,
      onClick: () => navigate("/launch2/settings"),
    },
    {
      icon: <Rocket className="h-5 w-5" />,
      title: "Try a demo launch",
      sub: "Walk a guided 50×1×$1 Bruno launch end-to-end — no spend, just the flow.",
      cta: "Start demo",
      primary: true,
      onClick: () => open("preset"),
    },
    {
      icon: <Link2 className="h-5 w-5" />,
      title: "Connect a Page",
      sub: "Pages carry the 250-ad cap. Connect at least one to start distributing.",
      cta: "Connect Page",
      onClick: () => navigate("/launch2/settings"),
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: "Install a Pixel",
      sub: "A live pixel unlocks conversion optimization and clean event attribution.",
      cta: "Install Pixel",
      onClick: () => navigate("/launch2/settings"),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-6 font-g6-sans">
      <header className="flex flex-col gap-4 rounded-lg border border-border bg-card p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <h1 className="font-g6-sans text-2xl font-bold tracking-tight text-foreground">
            Welcome to Launch 2.0
          </h1>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            The launcher that doesn&apos;t lose to Ads Manager. Connect your
            surfaces and your first bulk launch is minutes away — N=N, no data
            loss, every failure attributable.
          </p>
        </div>
      </header>

      <section>
        <SectionHeader
          title="Get set up"
          sub="Four steps to your first reliable launch."
        />
        <SetupNudges nudges={nudges} />
      </section>
    </div>
  );
}

/* ─────────────────────────────── Populated ─────────────────────────────── */

export function MissionControlHome() {
  const [params] = useSearchParams();
  if (params.get("empty") === "1") return <ZeroDataHome />;
  return <PopulatedHome />;
}

function PopulatedHome() {
  const navigate = useNavigate();
  const { open } = useLaunch2Overlay();

  const kpis = useMemo(() => {
    const now = Date.now();

    // Launched today: created across launches within the last 24h.
    const launchedToday = launches
      .filter((l) => now - new Date(l.createdAt).getTime() <= DAY_MS)
      .reduce((sum, l) => sum + l.progress.created, 0);

    // Live launches: currently dispatching.
    const liveLaunches = launches.filter((l) => l.status === "launching").length;

    // Launch integrity: failed≠launched. Failures across in-flight launches.
    const inFlight = launches.filter(
      (l) => l.status === "launching" || l.status === "partial",
    );
    const failed = inFlight.reduce((sum, l) => sum + l.progress.failed, 0);

    // Cap headroom: min remaining across pages.
    const tightest = tightestPage(pages);
    const headroom = tightest ? tightest.capLimit - tightest.adCount : Infinity;

    return { launchedToday, liveLaunches, failed, headroom, tightest };
  }, []);

  // launching / partial first, then the rest by recency.
  const sortedLaunches = useMemo(() => {
    const rank = (l: LaunchSummary) =>
      l.status === "launching" ? 0 : l.status === "partial" ? 1 : 2;
    return [...launches].sort((a, b) => {
      const r = rank(a) - rank(b);
      if (r !== 0) return r;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, []);

  const greeting = greetingWord();
  const headroomTone = kpis.headroom < 30 ? "warning" : "default";

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-6 font-g6-sans">
      {/* Hero header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <p className="font-g6-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Mission Control
          </p>
          <h1 className="font-g6-sans text-2xl font-bold tracking-tight text-foreground">
            Good {greeting}, Maalik
          </h1>
          <p className="text-sm text-muted-foreground">
            Every launch reconciled — N=N, no data loss, every failure
            attributable.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" onClick={() => open("quick")}>
            <RotateCcw className="h-4 w-4" />
            Quick relaunch
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => open()}
          >
            <Rocket className="h-4 w-4" />
            New Launch
          </Button>
        </div>
      </header>

      {/* Account-health strip */}
      <AccountHealthStrip
        accounts={accounts}
        pages={pages}
        onClick={() => navigate("/launch2/health")}
      />

      {/* KPI row — launch-ops only, NO ROAS/CTR */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile
          label="Launched today"
          value={kpis.launchedToday}
          sub="ads created in the last 24h"
          icon={<Rocket className="h-4 w-4" />}
        />
        <KpiTile
          label="Live launches"
          value={kpis.liveLaunches}
          sub="dispatching now"
          tone={kpis.liveLaunches > 0 ? "warning" : "default"}
          icon={<Radio className="h-4 w-4" />}
        />
        {kpis.failed > 0 ? (
          <KpiTile
            label="Launch integrity"
            value="N=N"
            sub={`${kpis.failed} failed — retry`}
            tone="warning"
            icon={<Activity className="h-4 w-4" />}
          />
        ) : (
          <KpiTile
            label="Launch integrity"
            value="100%"
            sub="no data loss"
            tone="success"
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
        )}
        <KpiTile
          label="Cap headroom"
          value={Number.isFinite(kpis.headroom) ? kpis.headroom : "—"}
          sub={kpis.tightest ? `tightest · ${kpis.tightest.name}` : "no Pages yet"}
          tone={headroomTone}
          icon={<Gauge className="h-4 w-4" />}
        />
      </section>

      {/* Recent launches + LIVE progress */}
      <section>
        <SectionHeader
          title="Recent launches"
          sub="Live dispatch first — failed≠launched is reconciled here."
          action={
            <button
              type="button"
              onClick={() => navigate("/launch2/activity")}
              className="text-xs font-semibold text-[hsl(var(--primary-text))] hover:underline"
            >
              View all
            </button>
          }
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {sortedLaunches.map((launch) => (
            <LaunchCard
              key={launch.id}
              launch={launch}
              onClick={(l) => navigate("/launch2/" + l.id)}
            />
          ))}
        </div>
      </section>

      {/* Winners shelf — NO perf metrics */}
      <section>
        <SectionHeader
          title="Quick relaunch · Winners"
          sub="Proven creatives, ready to redeploy. Ops signal only — no performance metrics."
        />
        <Shelf>
          {winners.map((winner) => (
            <WinnerCard
              key={winner.id}
              winner={winner}
              onRelaunch={() => open("quick")}
            />
          ))}
        </Shelf>
      </section>

      {/* Strategy quick-start shelf */}
      <section>
        <SectionHeader
          title="Strategy quick-start"
          sub="Pick a named playbook — structure and budget auto-configure, everything editable."
        />
        <Shelf>
          {STRATEGY_ORDER.map((key) => (
            <StrategyQuickStartCard
              key={key}
              preset={STRATEGY_PRESETS[key]}
              onClick={() => open("preset")}
            />
          ))}
        </Shelf>
      </section>

      {/* Two-column lower section */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <SectionHeader
            title="Recent drafts"
            sub="Autosaved — refresh never loses your place."
          />
          <RecentDrafts
            drafts={drafts}
            onResume={() => navigate("/launch2/new")}
          />
        </div>
        <div>
          <SectionHeader
            title="Recent activity"
            action={
              <button
                type="button"
                onClick={() => navigate("/launch2/activity")}
                className="text-xs font-semibold text-[hsl(var(--primary-text))] hover:underline"
              >
                View all
              </button>
            }
          />
          <RecentActivity activity={activity.slice(0, 5)} />
        </div>
      </section>
    </div>
  );
}
