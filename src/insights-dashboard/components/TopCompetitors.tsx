/**
 * TopCompetitors — "who's shipping, and how much" in one card.
 *
 * Merges what used to be two separate blocks — `MarketMovers` (a ranked list)
 * and the standalone `LaunchCadenceChart` (a 12-week bar chart) — because they
 * answered one question from two angles and disagreed on layout for no
 * reason. `useTopCompetitors()` hands back both halves built from the SAME
 * fixture slice, so the ranked five and the cadence chart can never drift
 * apart the way two independently-fetched blocks could.
 *
 * Row grammar (scannable pass): rank · domain · proportional bar ·
 * `New ads (30d)` · signed delta · followed indicator. One line each, five
 * rows, no evidence quotes or basis paragraphs on the surface — those move to
 * a tooltip or the one footer line, per the dashboard-wide "prose → marks"
 * rule.
 *
 * NAMING — read before touching labels: the 30-day column is always
 * `NEW_ADS_30D_COLUMN_LABEL` ("New ads (30d)"), never "live ads". A
 * competitor's `adCount30d` is ads LAUNCHED in the last 30 days;
 * `followedCompetitorLiveAds` (the footer total) is ads RUNNING right now —
 * different questions, and the footer total is worded to say so. No
 * "velocity", "momentum", or "share of voice" anywhere in this file.
 *
 * The cadence chart mirrors `LaunchCadenceChart`'s compact variant (≤16px
 * bars, 4px rounded tops, one hairline-gridline baseline, single hue with
 * only the spike at full strength, `isAnimationActive={false}`) but is its
 * own implementation — this file owns exactly one component and nothing here
 * imports that chart.
 *
 * Follow is LOCAL OPTIMISTIC UI ONLY — a `useState` set plus a `sonner`
 * toast, matching the pattern every other follow/track action on this
 * dashboard uses (`CoverageRescue`, the old `MarketMovers`). Nothing here
 * writes to Supabase or a shared store.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDelta } from "@/creative-report-v2/lib/format";
import { InsightsV2EmptyState } from "@/components/insights-v2/InsightsV2EmptyState";
import { Provenance } from "@/insights-dashboard/components/Provenance";
import { InfoTip } from "@/insights-dashboard/components/InfoTip";
import {
  useTopCompetitors,
  useDashboardMeta,
  NEW_ADS_30D_COLUMN_LABEL,
  NEW_ADS_30D_DELTA_LABEL,
  type LaunchCadenceWeek,
  type TopCompetitorRow,
} from "@/insights-dashboard/lib/selectors";

/** Rows the merged card always ranks — same as `TOP_COMPETITOR_COUNT`. */
const ROW_COUNT = 5;

const CHART_HEIGHT = 90;
const TOP_MARGIN = 16;
const BAR_SIZE = 12;
/** Value label above each bar — small, tabular-nums, never colour-only. */
const VALUE_LABEL_STYLE = {
  fontSize: 9,
  fontWeight: 500,
  fontVariantNumeric: "tabular-nums" as const,
  fill: "hsl(var(--foreground) / 0.85)",
};

function formatInt(n: number): string {
  return n.toLocaleString("en-US");
}

/** Signed, tabular-nums delta for the header — costs no extra height since it
 * shares the row the section label already occupies. Icon + sign, never
 * colour alone. */
function HeaderDeltaChip({ pct }: { pct: number }): JSX.Element {
  const isUp = pct >= 0;
  const Icon = isUp ? ArrowUpRight : ArrowDownRight;
  // A native `title=` used to hang here: invisible to keyboard users, no
  // screen-reader guarantee, and styled by the OS rather than the app. The
  // chip is now its own InfoTip trigger (`asChild` adds no extra glyph, so
  // this costs no width beside the block heading's existing InfoTip).
  // Inline copy, not a registry key — it explains this one chip and nothing
  // else on the page renders the same figure. Deliberately possessive-free:
  // in `firstTime`/`empty` this cadence is the market preview, not the
  // user's own followed set.
  return (
    <InfoTip
      tip={{
        label: "Week over week",
        what: "Ads launched in the latest full week, against the week before it.",
        gives: "Says whether launch pace is speeding up or slowing down right now.",
      }}
      asChild
    >
      <span
        tabIndex={0}
        className="inline-flex cursor-help items-center gap-0.5 rounded-sm font-mono text-[10px] font-medium tabular-nums text-foreground/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <Icon className="h-2.5 w-2.5" aria-hidden="true" />
        {isUp ? "+" : ""}
        {pct}%
      </span>
    </InfoTip>
  );
}

function directionMeta(deltaPct: number) {
  if (deltaPct > 0) return { Icon: TrendingUp, tone: "up" as const };
  if (deltaPct < 0) return { Icon: TrendingDown, tone: "down" as const };
  return { Icon: Minus, tone: "flat" as const };
}

/** Row-level signed delta. Tooltip carries the exact counts plus the
 * `NEW_ADS_30D_DELTA_LABEL` wording, so the comparison basis is reachable
 * without a second line on the surface. */
function DeltaTag({ row }: { row: TopCompetitorRow }) {
  const { Icon, tone } = directionMeta(row.deltaPct);
  const delta = fmtDelta(row.deltaPct);
  return (
    <span
      title={`${formatInt(row.adCount30d)} vs ${formatInt(row.adCountPrev30d)} — ${NEW_ADS_30D_DELTA_LABEL}`}
      className={cn(
        "inline-flex w-14 shrink-0 items-center justify-end gap-1 font-mono text-xs font-semibold tabular-nums",
        tone === "up" && "text-primary-text",
        tone === "down" && "text-foreground",
        tone === "flat" && "text-foreground",
      )}
    >
      <Icon className="h-3 w-3 shrink-0" strokeWidth={2.4} aria-hidden="true" />
      {delta.label}
    </span>
  );
}

function CompetitorRow({
  row,
  maxAdCount,
  followed,
  onFollow,
}: {
  row: TopCompetitorRow;
  maxAdCount: number;
  followed: boolean;
  onFollow: (domain: string) => void;
}) {
  const barPct = maxAdCount > 0 ? Math.max(6, Math.round((row.adCount30d / maxAdCount) * 100)) : 0;

  return (
    <li className="flex items-center gap-2 py-0.5">
      <span className="w-4 shrink-0 text-right font-mono text-[10px] tabular-nums text-foreground/70">
        {row.rank}
      </span>
      <Link
        to={row.discoverHref}
        title={`${row.domain} — ${row.industry} — open in Discover`}
        className="min-w-0 flex-1 truncate text-sm font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
      >
        {row.domain}
      </Link>
      <div className="h-1 w-10 shrink-0 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className="h-full rounded-full bg-primary/50" style={{ width: `${barPct}%` }} />
      </div>
      <span className="w-9 shrink-0 text-right font-mono text-xs tabular-nums text-foreground">
        {formatInt(row.adCount30d)}
      </span>
      <DeltaTag row={row} />
      <div className="w-[70px] shrink-0 text-right">
        {followed ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground/70">
            <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
            Following
          </span>
        ) : (
          <InfoTip tip="action.follow-competitor" asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-6 px-2 text-[11px]"
              onClick={() => onFollow(row.domain)}
            >
              Follow
            </Button>
          </InfoTip>
        )}
      </div>
    </li>
  );
}

function weekTickRenderer(anchorIndices: Set<number>) {
  return function WeekTick(props: {
    x?: number;
    y?: number;
    payload?: { value: string };
    index?: number;
  }) {
    const { x, y, payload, index } = props;
    if (index === undefined || !anchorIndices.has(index) || x === undefined || y === undefined) {
      return null;
    }
    return (
      <text x={x} y={y + 11} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 8 }}>
        {payload?.value}
      </text>
    );
  };
}

/**
 * Compact cadence chart, mirroring `LaunchCadenceChart`'s `compact` variant:
 * ≤16px bars, 4px rounded tops, single hairline baseline, one hue with only
 * the annotated spike at full strength, `isAnimationActive={false}`. Kept as
 * its own small implementation rather than importing that file — this block
 * owns exactly one file.
 */
function CadenceMiniChart({
  weeks,
  spikeWeekIndex,
}: {
  weeks: readonly LaunchCadenceWeek[];
  spikeWeekIndex: number;
}) {
  const lastIndex = weeks.length - 1;
  const anchors = new Set<number>([0, lastIndex]);
  if (spikeWeekIndex >= 0) anchors.add(spikeWeekIndex);
  const renderTick = weekTickRenderer(anchors);
  const maxValue = Math.max(1, ...weeks.map((w) => w.adsLaunched));

  return (
    <div style={{ height: CHART_HEIGHT }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={[...weeks]} margin={{ top: TOP_MARGIN, right: 4, left: 4, bottom: 2 }} barCategoryGap={5}>
          <CartesianGrid horizontal vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
          <YAxis hide domain={[0, maxValue * 1.3]} width={0} />
          <XAxis dataKey="weekStartLabel" tickLine={false} axisLine={false} interval={0} tick={renderTick} height={14} />
          <Bar dataKey="adsLaunched" maxBarSize={BAR_SIZE} radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {weeks.map((week) => (
              <Cell
                key={week.weekIndex}
                fill={week.isSpike ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.28)"}
                aria-label={`Week of ${week.weekStartLabel}: ${week.adsLaunched.toLocaleString("en-US")} ads launched`}
              />
            ))}
            <LabelList dataKey="adsLaunched" position="top" offset={4} style={VALUE_LABEL_STYLE} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopCompetitors({ className }: { className?: string }): JSX.Element {
  const {
    competitors,
    maxAdCount,
    followedCompetitorCount,
    followedCompetitorLiveAds,
    cadence,
    isEmpty,
    isLoading,
  } = useTopCompetitors();
  // `isFirstTime` / `isEmptyState` (renamed from `isThin` / `isZero`) tell us
  // whether the ranked five below are still a market preview the user hasn't
  // connected to yet — see `isMarketFraming`'s use below, same naming
  // `ChangeFeed.tsx` uses for the identical distinction.
  const { isFirstTime, isEmptyState } = useDashboardMeta();

  // Local optimistic follow state only — never persisted, never a store write.
  const [followedOverrides, setFollowedOverrides] = useState<Record<string, boolean>>({});
  const isFollowed = (row: TopCompetitorRow) => row.tracked || Boolean(followedOverrides[row.domain]);

  function handleFollow(domain: string) {
    setFollowedOverrides((prev) => (prev[domain] ? prev : { ...prev, [domain]: true }));
    toast.success(`Following ${domain}`, {
      description: "Added for this session only — nothing written to your workspace.",
    });
  }

  // CHECK isLoading BEFORE isEmpty — the ranked list and the cadence chart are
  // both `[]` while the fixture resolves, which looks identical to a genuine
  // zero-competitor state but means the opposite thing.
  if (isLoading) {
    return (
      <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <header className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">
            Top competitors
          </h2>
          <Skeleton className="h-3 w-16" />
        </header>
        <ul className="space-y-1">
          {Array.from({ length: ROW_COUNT }).map((_, i) => (
            <li key={i} className="flex items-center gap-2 py-0.5">
              <Skeleton className="h-3 w-4 shrink-0" />
              <Skeleton className="h-3.5 min-w-0 flex-1" />
              <Skeleton className="h-1 w-10 shrink-0 rounded-full" />
              <Skeleton className="h-3.5 w-9 shrink-0" />
              <Skeleton className="h-3.5 w-14 shrink-0" />
              <Skeleton className="h-6 w-[70px] shrink-0" />
            </li>
          ))}
        </ul>
        <div className="mt-2 border-t border-border/60 pt-2">
          <Skeleton className="w-full rounded-md" style={{ height: CHART_HEIGHT + 24 }} />
        </div>
      </section>
    );
  }

  if (isEmpty) {
    return (
      <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <header className="mb-2 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1">
            <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">
              Top competitors
            </h2>
            <InfoTip tip="block.top-competitors" />
          </span>
        </header>
        <InsightsV2EmptyState
          icon={TrendingUp}
          title="Not enough history to rank competitors yet"
          description="We rank by new ads launched over two 30-day windows — we haven't scanned twice a month apart yet."
        />
      </section>
    );
  }

  const spikeWeekIndex = cadence.weeks.findIndex((w) => w.isSpike);

  // Same distinction `ChangeFeed.tsx` makes: in `firstTime` / `empty` the
  // ranked five are a market preview the user hasn't connected to yet, not
  // "your competitors" — see the caption-trap note in the file header.
  const isMarketFraming = isFirstTime || isEmptyState;
  const topCompetitor = competitors[0] ?? null;
  // Grounded in real fixture numbers only (the leader's actual 30-day count),
  // never a fabricated threat — Maalik's own "GlowSkin ran 412 ads, you're
  // tracking 0" example, worded with this file's own "new ads (30d)" vocabulary
  // instead of "live ads". Still reports the exact followed-count/live-ads
  // pair `metric.top-competitors-basis` explains, just with the market
  // leader's number prefixed — so the tooltip's definition never drifts from
  // what's on screen.
  //
  // Both figures carry their own words. The earlier form was
  // "You follow 0 · 0 live ads now" — two bare numbers separated by a dot,
  // and in `empty` BOTH of them are zero, which reads as a broken widget
  // rather than a fact. Same failure Maalik rejected on the angle-mix block
  // ("ek % samajh ati, why 2"); a zero follow count has nothing to pair with
  // and just says so in words.
  const followClause =
    followedCompetitorCount === 0
      ? "You follow none of them yet."
      : `You follow ${followedCompetitorCount}, running ${formatInt(followedCompetitorLiveAds)} live ads right now.`;
  const basisLine =
    isMarketFraming && topCompetitor
      ? `${topCompetitor.domain} shipped ${formatInt(topCompetitor.adCount30d)} new ads in 30d. ${followClause}`
      : followClause;

  return (
    <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <header className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1">
          <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/70">
            Top competitors
          </h2>
          <InfoTip tip="block.top-competitors" />
        </span>
        <div className="flex shrink-0 items-center gap-2">
          {cadence.latestDeltaPct !== null && <HeaderDeltaChip pct={cadence.latestDeltaPct} />}
          <Provenance tier="derived" compact />
          <Link
            to="/insights/competitors"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-text hover:underline"
          >
            View all
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2 pr-0.5">
          <span className="w-4 shrink-0" />
          <span className="min-w-0 flex-1" />
          <span className="w-10 shrink-0" />
          {/* asChild, not glyph mode: this cell already wraps to several
              lines inside its fixed `w-9` width (matches the number column
              below it), so a separate icon would grow this row's height.
              Wrapping the existing label as the trigger explains it with
              zero extra footprint. Shared key with `DomainsTeaser` — do not
              fork this copy, both blocks print the same column. */}
          <InfoTip tip="column.new-ads-30d" asChild>
            <span
              tabIndex={0}
              className="w-9 shrink-0 cursor-help rounded-sm text-right font-mono text-[9px] uppercase leading-tight tracking-[0.08em] text-foreground/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {NEW_ADS_30D_COLUMN_LABEL}
            </span>
          </InfoTip>
          <span className="w-14 shrink-0" aria-hidden="true" />
          <span className="w-[70px] shrink-0" />
        </div>
        <ul className="divide-y divide-border/60">
          {competitors.map((row) => (
            <CompetitorRow key={row.domain} row={row} maxAdCount={maxAdCount} followed={isFollowed(row)} onFollow={handleFollow} />
          ))}
        </ul>
      </div>

      <div className="mt-2 border-t border-border/60 pt-2">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1">
            <span className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-foreground/70">
              Launch cadence
            </span>
            <InfoTip tip="chart.launch-cadence" />
          </span>
          {cadence.rangeLabel && (
            <span className="font-mono text-[9px] text-foreground/70">{cadence.rangeLabel}</span>
          )}
        </div>
        <CadenceMiniChart weeks={cadence.weeks} spikeWeekIndex={spikeWeekIndex} />
        {cadence.spike && cadence.spikeNote && (
          <p className="mt-1 text-[10px] leading-snug text-foreground">
            <span className="font-mono font-medium uppercase tracking-[0.1em] text-foreground/70">
              Week of {cadence.spike.weekStartLabel}
            </span>{" "}
            · {cadence.spikeNote}
          </p>
        )}
      </div>

      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-1.5">
        <InfoTip tip="metric.top-competitors-basis" asChild>
          <p
            tabIndex={0}
            className="cursor-help rounded-sm text-xs text-foreground/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {basisLine}
          </p>
        </InfoTip>
      </div>
    </section>
  );
}
