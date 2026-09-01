/**
 * ShareOfVoice — creative share of voice, per followed industry.
 *
 * This is the headline metric of the enterprise ad-intelligence tier (Sensor
 * Tower, SimilarWeb, MediaRadar) and is absent from the DTC/agency tier this
 * product competes in. Bringing it down-market is real differentiation — but
 * only if the naming stays honest.
 *
 * THE ONE THING NOT TO GET WRONG: this is share of LIVE CREATIVE (what
 * fraction of the ads currently running in an industry are yours), never
 * share of spend. The Meta Ad Library shows creatives, not dollars — treating
 * creative count as a spend proxy is the single most-criticised lie in this
 * product category. `metricLabel` and `basisNote` come straight from the
 * selector and are rendered verbatim; nothing in this file introduces the
 * words "spend" or "budget".
 *
 * Chart discipline: the stacked bar uses exactly one hue (`--primary`) at
 * stepped opacities — solid for you, stepping down across the named leaders,
 * quietest for "Everyone else" (an unnamed aggregate, not a real advertiser).
 * No categorical rainbow, no new tokens.
 *
 * DOORWAYS: the industry name opens Discover scoped to `?industry=`; every
 * named leader and the "you" row open it scoped to `?domain=`. "Everyone
 * else" is deliberately NOT a link — it is an unnamed aggregate, not an
 * advertiser Discover can filter to, so linking it would be the lying-link
 * this page exists to avoid. "You" only links once we know your own domain
 * (`useMyBrandVsMarket().brand.domain`) — `useShareOfVoice()` carries your
 * name and share but not your domain, so this is the one place in the file
 * that reaches for a second selector hook rather than re-deriving it.
 *
 * CHIP CONSOLIDATION: every row here is `provenance: "derived"` (see
 * `buildShareOfVoice` in fixtures.ts) — a chip per industry row repeated the
 * same claim up to three times. One block-level chip in the header now
 * carries it; a row only gets its own chip if its tier genuinely diverges.
 */
import { Link } from "react-router-dom";
import { PieChart } from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { InsightsV2EmptyState } from "@/components/insights-v2/InsightsV2EmptyState";
import { Provenance } from "@/insights-dashboard/components/Provenance";
import {
  useDashboardMeta,
  useMyBrandVsMarket,
  useShareOfVoice,
  type CreativeShareRow,
  type CreativeShareSegment,
  type ProvenanceTier,
} from "@/insights-dashboard/lib/selectors";

/** `/insights/discover?industry=<industry>`. */
function industryHref(industry: string): string {
  return `/insights/discover?industry=${encodeURIComponent(industry)}`;
}
/** `/insights/discover?domain=<domain>`. */
function domainHref(domain: string): string {
  return `/insights/discover?domain=${encodeURIComponent(domain)}`;
}

/** Opacity steps for named leaders, by rank (1-based). Floors at the last step. */
const LEADER_ALPHA_STEPS = [0.6, 0.42, 0.28, 0.2] as const;
const LONG_TAIL_ALPHA = 0.12;

/** One dominant hue (`--primary`) at stepped opacity — never a new colour. */
function leaderColor(rank: number): string {
  const idx = Math.max(0, rank - 1);
  const alpha = LEADER_ALPHA_STEPS[Math.min(idx, LEADER_ALPHA_STEPS.length - 1)];
  return `hsl(var(--primary) / ${alpha})`;
}

const YOU_COLOR = "hsl(var(--primary))";
const LONG_TAIL_COLOR = `hsl(var(--primary) / ${LONG_TAIL_ALPHA})`;

/** Resolve a segment's colour by looking up its rank among the row's leaders. */
function segmentColor(segment: CreativeShareSegment, row: CreativeShareRow): string {
  if (segment.isYou) return YOU_COLOR;
  if (segment.isLongTail) return LONG_TAIL_COLOR;
  const rank = row.leaders.find((l) => l.domain === segment.key)?.rank ?? 1;
  return leaderColor(rank);
}

function rankSentence(row: CreativeShareRow): string {
  if (row.yourRank === 1) {
    return `You lead ${row.industry}'s live creative.`;
  }
  const leaderName = row.leaders[0]?.domain ?? "the leader";
  const namedCount = row.leaders.length + 1;
  return `#${row.yourRank} of ${namedCount} — ${row.gapToLeaderPct} points behind ${leaderName}.`;
}

function ShareOfVoiceRowView({
  row,
  yourDomain,
  dominantTier,
}: {
  row: CreativeShareRow;
  /** Your own domain, so the "you" segment can link like every other one. */
  yourDomain: string | null;
  /** Block-level chip tier — see file header. Row keeps its own chip only
   * when it genuinely diverges. */
  dominantTier: ProvenanceTier | null;
}) {
  return (
    <div className="border-t border-border/60 pt-3 first:border-t-0 first:pt-0">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to={industryHref(row.industry)}
            title={row.industry}
            className="max-w-[220px] truncate text-sm font-semibold text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
          >
            {row.industry}
          </Link>
          {row.provenance !== dominantTier && <Provenance tier={row.provenance} compact />}
        </div>
        <span className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {row.totalLiveAds.toLocaleString()} live ads tracked
        </span>
      </div>

      <div
        role="img"
        aria-label={`${row.industry}: ${row.you.name} holds ${row.you.creativeSharePct}% of live creative, versus ${row.leaders
          .map((l) => `${l.domain} at ${l.creativeSharePct}%`)
          .join(", ")}, and ${row.longTailPct}% spread across everyone else.`}
        className="flex h-5 w-full gap-px overflow-hidden rounded-full bg-muted"
      >
        {row.segments
          .filter((segment) => segment.creativeSharePct > 0)
          .map((segment) => (
            <div
              key={segment.key}
              title={`${segment.label} — ${segment.creativeSharePct}% (${segment.adCount.toLocaleString()} ads)`}
              style={{
                width: `${segment.creativeSharePct}%`,
                backgroundColor: segmentColor(segment, row),
              }}
              className="h-full first:rounded-l-full last:rounded-r-full"
            />
          ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        {yourDomain ? (
          <Link
            to={domainHref(yourDomain)}
            title={`${row.you.name} — open in Discover`}
            className="inline-flex min-w-0 max-w-[220px] items-center gap-1.5 text-xs font-semibold text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: YOU_COLOR }}
              aria-hidden="true"
            />
            <span className="truncate">
              {row.you.name} {row.you.creativeSharePct}%
            </span>
            <span className="shrink-0 font-normal tabular-nums text-muted-foreground">
              ({row.you.adCount.toLocaleString()} ads)
            </span>
          </Link>
        ) : (
          <span className="inline-flex min-w-0 max-w-[220px] items-center gap-1.5 text-xs font-semibold text-foreground">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: YOU_COLOR }}
              aria-hidden="true"
            />
            <span className="truncate" title={row.you.name}>
              {row.you.name} {row.you.creativeSharePct}%
            </span>
            <span className="shrink-0 font-normal tabular-nums text-muted-foreground">
              ({row.you.adCount.toLocaleString()} ads)
            </span>
          </span>
        )}
        {row.leaders.map((leader) => (
          <Link
            key={leader.domain}
            to={domainHref(leader.domain)}
            title={`${leader.domain} — open in Discover`}
            className="inline-flex min-w-0 max-w-[200px] items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: leaderColor(leader.rank) }}
              aria-hidden="true"
            />
            <span className="truncate">{leader.domain}</span>
            <span className="shrink-0 tabular-nums">{leader.creativeSharePct}%</span>
          </Link>
        ))}
        {/* Not a link — an unnamed aggregate isn't something Discover can
            filter to, so linking it would be a lie. */}
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/70">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: LONG_TAIL_COLOR }}
            aria-hidden="true"
          />
          Everyone else <span className="tabular-nums">{row.longTailPct}%</span>
        </span>
      </div>

      <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{rankSentence(row)}</p>
    </div>
  );
}

export function ShareOfVoice({ className }: { className?: string }): JSX.Element {
  const { rows, isEmpty, isLoading, metricLabel, basisNote, strongest, weakest } =
    useShareOfVoice();
  const { followedIndustryCount } = useDashboardMeta();
  const { brand } = useMyBrandVsMarket();
  const yourDomain = brand?.domain ?? null;

  // CHECK isLoading BEFORE `isEmpty`. `rows` is `[]` in both `loading` and a
  // genuinely empty share-of-voice — bar-row skeletons keep first paint from
  // claiming "no industries followed" while the scan is still running.
  if (isLoading) {
    return (
      <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <header className="mb-1 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">{metricLabel}</h2>
        </header>
        <Skeleton className="mb-4 h-3 w-2/3" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border-t border-border/60 pt-3 first:border-t-0 first:pt-0">
              <div className="mb-2 flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-full rounded-full" />
              <div className="mt-2 flex items-center gap-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // See file header: every row here is currently `derived`. Computed rather
  // than hardcoded so a future mixed-tier fixture still renders honestly.
  const dominantTier: ProvenanceTier | null = (() => {
    if (rows.length === 0) return null;
    const counts = new Map<ProvenanceTier, number>();
    for (const row of rows) counts.set(row.provenance, (counts.get(row.provenance) ?? 0) + 1);
    let best: ProvenanceTier | null = null;
    let bestCount = -1;
    for (const [tier, count] of counts) {
      if (count > bestCount) {
        best = tier;
        bestCount = count;
      }
    }
    return best;
  })();

  return (
    <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
      {/* `flex-wrap` + `whitespace-nowrap` so the strongest/weakest line either
          shares the title's row or takes a full line of its own. As a
          `shrink-0` sibling it squeezed "Share of live creative" into a
          three-line sliver in the 2-up column. */}
      <header className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">{metricLabel}</h2>
          {!isEmpty && dominantTier && <Provenance tier={dominantTier} compact />}
        </div>
        {!isEmpty && strongest && weakest && strongest.industry !== weakest.industry && (
          <span className="whitespace-nowrap font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Strongest {strongest.industry} · Weakest {weakest.industry}
          </span>
        )}
      </header>

      {!isEmpty && (
        <p className="mb-4 max-w-prose text-xs leading-snug text-muted-foreground">{basisNote}</p>
      )}

      {isEmpty ? (
        <InsightsV2EmptyState
          icon={PieChart}
          title={
            followedIndustryCount === 0
              ? "No industries followed yet"
              : "First scan still in progress"
          }
          description={
            followedIndustryCount === 0
              ? "Follow an industry to see your share of live creative against everyone else running ads there."
              : "Nothing indexed yet in your followed industries — there's no live creative to measure your share against."
          }
        />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <ShareOfVoiceRowView
              key={row.industry}
              row={row}
              yourDomain={yourDomain}
              dominantTier={dominantTier}
            />
          ))}
        </div>
      )}
    </section>
  );
}
