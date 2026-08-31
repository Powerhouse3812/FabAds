/**
 * Industry Insights → Home ("This week" blocks) selectors.
 *
 * HARD RULE: every selector here DERIVES from data that already exists —
 * the Trends module's mock corpus (ALL_TRENDS / META_ADS / TIKTOK_HOOKS in
 * src/insights-trends/mocks/trendsData.ts) and the Insights dummy ad/brand
 * corpus (src/lib/insights-dummy-data.ts) — plus the real (mock-backed)
 * useInsightCompetitors() hook. No second corpus is authored here.
 *
 * Trends-doc language (Maalik's locked decision) applies to anything that
 * touches a TrendItem's `intelligence`: no urgency countdown (bounded test
 * window + rationale only), no Safe/Caution badge (adaptation risk + its
 * specific reason only), confidence is a level + evidence count + refreshed
 * timestamp — never a percentage. useActNowSignal returns the whole
 * TrendItem so callers render intelligence via the existing STAGE_META /
 * CONFIDENCE_META / RISK_META helpers in src/insights-trends/lib/trendsDisplay.ts
 * rather than inventing parallel display logic.
 *
 * Deterministic throughout — hash-seeded, no Math.random anywhere so every
 * render (and every viewer) sees the same numbers until the underlying mock
 * corpora change.
 */
import { useMemo } from "react";
import { useInsightCompetitors } from "@/hooks/use-insight-competitors";
import { useInsightPreferences } from "@/hooks/use-insight-preferences";
import { DUMMY_ADS, BRANDS, HEADLINES_BY_INTENT, type InsightAd } from "@/lib/insights-dummy-data";
import { ALL_TRENDS, META_ADS, TIKTOK_HOOKS } from "@/insights-trends/mocks/trendsData";
import type { TrendItem, ConfidenceLevel } from "@/insights-trends/types";

/* ------------------------------------------------------------------ */
/*  Deterministic pseudo-randomness — same pattern as insights-digest's */
/*  hashString/rangeFromSeed (kept local here; that file doesn't export */
/*  them). No Math.random anywhere in this file.                       */
/* ------------------------------------------------------------------ */
function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/* ------------------------------------------------------------------ */
/*  useThinCoverage — SINGLE SOURCE OF TRUTH for "does this user have    */
/*  real inventory to show". ThinCoverageRescue.tsx (the rescue UI) and  */
/*  InsightsOverview.tsx (which decides whether to mount the gallery/    */
/*  ActNow/charts row at all, vs. that rescue block instead) both read   */
/*  this exact same computation, so the two surfaces can never disagree  */
/*  about what counts as "thin". Previously this lived only inside      */
/*  ThinCoverageRescue itself — pulled up here so the page can gate on   */
/*  it without re-deriving the same threshold logic a second time.       */
/* ------------------------------------------------------------------ */
const THIN_AD_THRESHOLD = 15;

export interface FollowedIndustryStat {
  industry: string;
  adCount: number;
  advertiserCount: number;
}

const INDUSTRY_STATS: Map<string, { adCount: number; advertiserCount: number }> = (() => {
  const raw = new Map<string, { adCount: number; advertisers: Set<string> }>();
  for (const ad of DUMMY_ADS) {
    const entry = raw.get(ad.industry) ?? { adCount: 0, advertisers: new Set<string>() };
    entry.adCount += 1;
    entry.advertisers.add(ad.brand);
    raw.set(ad.industry, entry);
  }
  const out = new Map<string, { adCount: number; advertiserCount: number }>();
  for (const [industry, { adCount, advertisers }] of raw) {
    out.set(industry, { adCount, advertiserCount: advertisers.size });
  }
  return out;
})();

export function statsForIndustry(industry: string): { adCount: number; advertiserCount: number } {
  return INDUSTRY_STATS.get(industry) ?? { adCount: 0, advertiserCount: 0 };
}

export function useThinCoverage(): {
  followed: string[];
  followedStats: FollowedIndustryStat[];
  thinFollowed: FollowedIndustryStat[];
  isThin: boolean;
  loading: boolean;
} {
  const { preferences, isLoading } = useInsightPreferences();

  const followed = useMemo(() => preferences?.industries ?? [], [preferences?.industries]);
  const followedStats = useMemo(
    () => followed.map((industry) => ({ industry, ...statsForIndustry(industry) })),
    [followed],
  );
  const thinFollowed = useMemo(
    () => followedStats.filter((f) => f.adCount < THIN_AD_THRESHOLD),
    [followedStats],
  );
  const isThin = followed.length === 0 || thinFollowed.length > 0;

  return { followed, followedStats, thinFollowed, isThin, loading: isLoading };
}

/* ------------------------------------------------------------------ */
/*  Public shapes                                                      */
/* ------------------------------------------------------------------ */
export interface TopMover {
  id: string;
  domain: string;
  changePct: number;
  industry: string;
  tracked: boolean;
}

export interface CadencePoint {
  weekLabel: string;
  launches: number;
  spike?: { advertiser: string; pct: number };
}

export interface AngleSlice {
  angle: string;
  share: number;
  adCount: number;
}

export interface DomainRow {
  id: string;
  domain: string;
  industry: string;
  liveAds: number;
  estSalesPerMonth: string;
  estVisits: string;
  products: number;
  platform: string;
  tracked: boolean;
}

/* ------------------------------------------------------------------ */
/*  useTopAds — Meta ads ranked by activeDays desc, TikTok hooks ranked  */
/*  by recency. Each source keeps its OWN ranking rule (doc §E: never   */
/*  mix sources into one combined score) — the two ranked lists are     */
/*  simply concatenated for the gallery, not re-ranked against a shared  */
/*  metric.                                                             */
/* ------------------------------------------------------------------ */
export function useTopAds(limit = 8): { items: TrendItem[]; loading: boolean } {
  const items = useMemo(() => {
    const safeLimit = Math.max(0, limit);
    const metaSorted = [...META_ADS].sort((a, b) => (b.activeDays ?? 0) - (a.activeDays ?? 0));
    const tiktokSorted = [...TIKTOK_HOOKS].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
    const metaShare = Math.ceil(safeLimit / 2);
    const tiktokShare = safeLimit - metaShare;
    const combined = [...metaSorted.slice(0, metaShare), ...tiktokSorted.slice(0, tiktokShare)];
    // Backfill from whichever source has more left, in case one list is short.
    if (combined.length < safeLimit) {
      const rest = [...metaSorted.slice(metaShare), ...tiktokSorted.slice(tiktokShare)];
      combined.push(...rest.slice(0, safeLimit - combined.length));
    }
    return combined.slice(0, safeLimit);
  }, [limit]);

  return { items, loading: false };
}

/* ------------------------------------------------------------------ */
/*  useActNowSignal — single highest-signal TrendItem. Prefers growing/ */
/*  peaking stage + confidence that isn't "insufficient". Returns the   */
/*  whole TrendItem so the card renders doc-compliant intelligence      */
/*  (bounded test window + rationale, adaptation risk + reason) via the */
/*  existing trendsDisplay.ts helpers — NEVER a countdown, NEVER a      */
/*  Safe/Caution badge.                                                 */
/* ------------------------------------------------------------------ */
const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = { high: 3, medium: 2, low: 1, insufficient: 0 };

export function useActNowSignal(): { signal: TrendItem | null; loading: boolean } {
  const signal = useMemo(() => {
    const preferred = ALL_TRENDS.filter(
      (t) =>
        (t.intelligence.trendStage === "growing" || t.intelligence.trendStage === "peaking") &&
        t.intelligence.confidence.level !== "insufficient",
    );
    const pool = preferred.length ? preferred : ALL_TRENDS;
    if (!pool.length) return null;

    const sorted = [...pool].sort((a, b) => {
      const confDiff = CONFIDENCE_RANK[b.intelligence.confidence.level] - CONFIDENCE_RANK[a.intelligence.confidence.level];
      if (confDiff !== 0) return confDiff;
      const evDiff = b.intelligence.confidence.evidenceCount - a.intelligence.confidence.evidenceCount;
      if (evDiff !== 0) return evDiff;
      return a.id.localeCompare(b.id); // stable, deterministic tie-break
    });
    return sorted[0];
  }, []);

  return { signal, loading: false };
}

/* ------------------------------------------------------------------ */
/*  useTopMovers — domains pulled from the dummy ad corpus, changePct   */
/*  deterministic from a hash of the domain string (mix of positive and */
/*  negative, no Math.random). tracked reflects whether the domain (or  */
/*  its brand) is already in the user's real competitor list.          */
/* ------------------------------------------------------------------ */
function changePctForDomain(domain: string): number {
  const h = hashString(`mover:${domain}`);
  const magnitude = 3 + (h % 43); // 3..45
  const sign = (h >> 3) % 2 === 0 ? 1 : -1;
  return sign * magnitude;
}

function uniqueDomainAds(): InsightAd[] {
  const seen = new Set<string>();
  const out: InsightAd[] = [];
  for (const ad of DUMMY_ADS) {
    if (seen.has(ad.domain)) continue;
    seen.add(ad.domain);
    out.push(ad);
  }
  return out;
}

export function useTopMovers(limit = 6): { movers: TopMover[]; loading: boolean } {
  const { competitors, isLoading } = useInsightCompetitors();

  const movers = useMemo(() => {
    if (isLoading) return [];
    const trackedDomains = new Set(
      competitors.filter((c) => c.competitor_type === "domain").map((c) => c.identifier),
    );
    const trackedBrands = new Set(
      competitors.filter((c) => c.competitor_type === "brand").map((c) => c.name),
    );

    const candidates: TopMover[] = uniqueDomainAds().map((ad) => ({
      id: `mover-${slug(ad.domain)}`,
      domain: ad.domain,
      changePct: changePctForDomain(ad.domain),
      industry: ad.industry,
      tracked: trackedDomains.has(ad.domain) || trackedBrands.has(ad.brand),
    }));

    return candidates
      .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
      .slice(0, Math.max(0, limit));
  }, [competitors, isLoading, limit]);

  return { movers, loading: isLoading };
}

/* ------------------------------------------------------------------ */
/*  useLaunchCadence — 12 weekly points, deterministic launch counts,   */
/*  exactly ONE point carries a { advertiser, pct } spike annotation —  */
/*  that annotation (not the line itself) is the whole point of the    */
/*  chart.                                                             */
/* ------------------------------------------------------------------ */
const CADENCE_WEEKS = 12;

function weekLabelFor(weeksAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - weeksAgo * 7);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function useLaunchCadence(): { points: CadencePoint[]; loading: boolean } {
  const points = useMemo(() => {
    const spikeIndex = hashString("cadence-spike-week") % CADENCE_WEEKS;
    const spikeAdvertiser = BRANDS[hashString("cadence-spike-brand") % BRANDS.length];
    const spikePct = 40 + (hashString("cadence-spike-pct") % 61); // 40..100

    const out: CadencePoint[] = [];
    for (let w = 0; w < CADENCE_WEEKS; w++) {
      const weeksAgo = CADENCE_WEEKS - 1 - w; // oldest → newest
      const baseline = 18 + (hashString(`cadence-week-${w}`) % 55); // 18..72
      const point: CadencePoint = { weekLabel: weekLabelFor(weeksAgo), launches: baseline };
      if (w === spikeIndex) {
        point.launches = Math.round(baseline * (1 + spikePct / 100));
        point.spike = { advertiser: spikeAdvertiser, pct: spikePct };
      }
      out.push(point);
    }
    return out;
  }, []);

  return { points, loading: false };
}

/* ------------------------------------------------------------------ */
/*  useAngleMix — InsightAd has no angle field, but the headline bank it */
/*  draws from (HEADLINES_BY_INTENT in insights-dummy-data.ts) is ALREADY */
/*  grouped by intent: six contiguous groups of five, in the order       */
/*  question / stat-proof / urgency / benefit / curiosity / direct. So   */
/*  an ad's angle is looked up from its headline's position in that bank */
/*  — a real classification, not a guess.                                */
/*                                                                       */
/*  An earlier revision hashed the headline into a bucket instead. That  */
/*  was fabricated labelling: it filed "Today only" under Curiosity and  */
/*  "Now available" under Urgency. It went unnoticed while the donut     */
/*  linked to a search param that matched nothing; once the slices       */
/*  actually filter Discover, every mislabel is on screen next to the    */
/*  headline that contradicts it.                                        */
/* ------------------------------------------------------------------ */
export const ANGLE_BUCKETS = ["Question hook", "Social proof", "Urgency", "Benefit-led", "Curiosity", "Direct offer"] as const;

const HEADLINES_PER_INTENT = 5;

/** headline → angle, built once from the bank's own grouping. */
const ANGLE_BY_HEADLINE: Map<string, string> = (() => {
  const out = new Map<string, string>();
  HEADLINES_BY_INTENT.forEach((headline, i) => {
    const bucket = ANGLE_BUCKETS[Math.floor(i / HEADLINES_PER_INTENT)];
    if (bucket) out.set(headline, bucket);
  });
  return out;
})();

/**
 * The bucket an ad belongs to. EXPORTED because Discover
 * (src/pages/insights/InsightsDiscover.tsx) filters on `?angle=` with this
 * exact function — the donut's slices and Discover's filtered grid must be
 * the same partition of DUMMY_ADS, or clicking a slice would land on a
 * result set that doesn't match the share it just showed.
 */
export function angleForAd(ad: InsightAd): string {
  // Fallback only covers a headline written outside the bank (none today);
  // deterministic either way.
  return (
    ANGLE_BY_HEADLINE.get(ad.headline) ??
    ANGLE_BUCKETS[hashString(`angle:${ad.headline}`) % ANGLE_BUCKETS.length]
  );
}

export function useAngleMix(): { slices: AngleSlice[]; totalAds: number; loading: boolean } {
  const { slices, totalAds } = useMemo(() => {
    const counts = new Map<string, number>(ANGLE_BUCKETS.map((b) => [b, 0]));
    for (const ad of DUMMY_ADS) {
      const angle = angleForAd(ad);
      counts.set(angle, (counts.get(angle) ?? 0) + 1);
    }

    const total = DUMMY_ADS.length;

    // Largest-remainder (Hamilton) apportionment: floor every share, then
    // hand the leftover points to the largest fractional remainders. Shares
    // still sum to exactly 100, but no slice is off by more than 1 point.
    //
    // The previous approach rounded each share independently and dumped the
    // whole residual on the LAST slice, which printed "Direct offer 15% ·
    // 133" directly beneath "Curiosity 17% · 133" — two slices with an
    // identical ad count showing a 2-point difference. Ties break by bucket
    // order, so the result stays deterministic.
    const exact = ANGLE_BUCKETS.map((angle) => {
      const adCount = counts.get(angle) ?? 0;
      return { angle, adCount, value: total > 0 ? (adCount / total) * 100 : 0 };
    });

    const rawSlices: AngleSlice[] = exact.map((e) => ({
      angle: e.angle,
      share: Math.floor(e.value),
      adCount: e.adCount,
    }));

    if (total > 0) {
      let leftover = 100 - rawSlices.reduce((s, sl) => s + sl.share, 0);
      const byRemainder = exact
        .map((e, i) => ({ i, remainder: e.value - Math.floor(e.value) }))
        .sort((a, b) => b.remainder - a.remainder || a.i - b.i);
      for (const { i } of byRemainder) {
        if (leftover <= 0) break;
        rawSlices[i].share += 1;
        leftover -= 1;
      }
    }

    return { slices: rawSlices, totalAds: total };
  }, []);

  return { slices, totalAds, loading: false };
}

/* ------------------------------------------------------------------ */
/*  useDomainRows — tracked domain-type competitors first (real, mock-  */
/*  backed via useInsightCompetitors), enriched with deterministic mock */
/*  economics; padded with untracked domains from the dummy ad corpus   */
/*  so the table always has body.                                      */
/* ------------------------------------------------------------------ */
function economicsForDomain(domain: string): { estSalesPerMonth: string; estVisits: string; products: number } {
  const h = hashString(`econ:${domain}`);
  const salesK = 5 + (h % 495); // $5K..$500K
  const visitsK = 10 + ((h >> 4) % 990); // 10K..1,000K
  const products = 3 + (h % 120);
  return {
    estSalesPerMonth: `$${salesK}K`,
    estVisits: `${visitsK}K`,
    products,
  };
}

function liveAdsForDomain(domain: string): number {
  return DUMMY_ADS.filter((a) => a.domain === domain && a.status === "active").length;
}

export function useDomainRows(limit = 12): { rows: DomainRow[]; loading: boolean } {
  const { competitors, isLoading } = useInsightCompetitors();

  const rows = useMemo(() => {
    if (isLoading) return [];
    const safeLimit = Math.max(0, limit);

    const trackedRows: DomainRow[] = competitors
      .filter((c) => c.competitor_type === "domain")
      .map((c) => {
        const domain: string = c.identifier;
        const matchingAd = DUMMY_ADS.find((a) => a.domain === domain);
        const econ = economicsForDomain(domain);
        return {
          id: `domain-${c.id}`,
          domain,
          industry: matchingAd?.industry ?? "E-commerce",
          liveAds: liveAdsForDomain(domain),
          estSalesPerMonth: econ.estSalesPerMonth,
          estVisits: econ.estVisits,
          products: econ.products,
          platform: matchingAd?.platform ?? "Meta",
          tracked: true,
        };
      });

    const trackedDomainSet = new Set(trackedRows.map((r) => r.domain));
    const remaining = Math.max(0, safeLimit - trackedRows.length);
    const untrackedRows: DomainRow[] = remaining
      ? uniqueDomainAds()
          .filter((ad) => !trackedDomainSet.has(ad.domain))
          .slice(0, remaining)
          .map((ad) => {
            const econ = economicsForDomain(ad.domain);
            return {
              id: `domain-${slug(ad.domain)}`,
              domain: ad.domain,
              industry: ad.industry,
              liveAds: liveAdsForDomain(ad.domain),
              estSalesPerMonth: econ.estSalesPerMonth,
              estVisits: econ.estVisits,
              products: econ.products,
              platform: ad.platform,
              tracked: false,
            };
          })
      : [];

    return [...trackedRows, ...untrackedRows].slice(0, safeLimit);
  }, [competitors, isLoading, limit]);

  return { rows, loading: isLoading };
}

/* ------------------------------------------------------------------ */
/*  useHomeBrief — composes today's story from the ACTUAL derived      */
/*  values of the other selectors (spike advertiser, biggest mover,     */
/*  leading angle, live-domain count). Never a canned sentence, never   */
/*  labelled "AI" (Maalik: the brief is generated from the day's        */
/*  updates, not an AI feature).                                       */
/* ------------------------------------------------------------------ */
export function useHomeBrief(): { text: string; loading: boolean } {
  const { points, loading: cadenceLoading } = useLaunchCadence();
  const { movers, loading: moversLoading } = useTopMovers(8);
  const { rows, loading: domainLoading } = useDomainRows(20);
  const { slices, totalAds, loading: angleLoading } = useAngleMix();

  const loading = cadenceLoading || moversLoading || domainLoading || angleLoading;

  const text = useMemo(() => {
    if (loading) return "";

    const parts: string[] = [];

    const spikeWeek = points.find((p) => p.spike);
    if (spikeWeek?.spike) {
      parts.push(`${spikeWeek.spike.advertiser} spiked launches ${spikeWeek.spike.pct}% the week of ${spikeWeek.weekLabel}`);
    }

    if (movers.length) {
      const topMover = [...movers].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))[0];
      const verb = topMover.changePct >= 0 ? "up" : "down";
      parts.push(`${topMover.domain} is ${verb} ${Math.abs(topMover.changePct)}% in ${topMover.industry}`);
    }

    if (slices.length && totalAds > 0) {
      const topAngle = [...slices].sort((a, b) => b.share - a.share)[0];
      parts.push(`${topAngle.angle} angles lead the mix at ${topAngle.share}% of ${totalAds} tracked ads`);
    }

    // TRACKED rows only. useDomainRows() pads its list with untracked
    // domains from the ad corpus so the table always has body — counting
    // those here would tell the user they're "watching" domains they never
    // added. The claim has to be true of the competitor list itself.
    const liveDomainCount = rows.filter((r) => r.tracked && r.liveAds > 0).length;
    if (liveDomainCount > 0) {
      parts.push(`${liveDomainCount} domain${liveDomainCount === 1 ? "" : "s"} you're watching ${liveDomainCount === 1 ? "is" : "are"} running live ads right now`);
    }

    return parts.length
      ? parts.join(". ") + "."
      : "No updates yet — track a competitor to start building today's story.";
  }, [loading, points, movers, rows, slices, totalAds]);

  return { text, loading };
}
