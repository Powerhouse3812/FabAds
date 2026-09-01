import { useMemo } from "react";
import { useInsightPreferences } from "@/hooks/use-insight-preferences";
import { useInsightCompetitors } from "@/hooks/use-insight-competitors";
import {
  DUMMY_ADS,
  BRANDS,
  TRENDING_TAGS,
  INSIGHT_INDUSTRIES,
  type InsightAd,
} from "@/lib/insights-dummy-data";

export type InsightsDigestRow = {
  id: string;
  kind: "competitor" | "trend" | "feed" | "top-ad";
  title: string;
  meta?: string;
  actionLabel: string;
  to: string;
};

// ── Deterministic pseudo-randomness ───────────────────────────────
// Same spirit as dashboard-selectors.ts's seededRandom, but keyed off a
// string (brand/industry/tag name) instead of a numeric date-seed — the
// digest's numbers stay put across re-renders without touching Math.random.
function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function rangeFromSeed(seed: string, min: number, max: number): number {
  return min + (hashString(seed) % (max - min + 1));
}

function pickFromSeed<T>(arr: readonly T[], seed: string): T {
  return arr[hashString(seed) % arr.length];
}

// Well-known dummy brands used only when the workspace has zero tracked
// competitors — keeps the digest from rendering empty/broken, per spec.
const FALLBACK_COMPETITOR_BRANDS = BRANDS.slice(0, 3);

// InsightsV2Feed reads filters from ?search= (matched against brand,
// headline, description, primaryText, pageName — see readFiltersFromSearch
// in src/pages/insights-v2/InsightsV2Feed.tsx). There is no ?competitor=
// param in the feed today, so brand deep-links go through ?search= instead.
function feedUrlForBrand(brand: string): string {
  return `/insights-v2/feed?search=${encodeURIComponent(brand)}`;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function useInsightsDigest(limit = 4): { rows: InsightsDigestRow[]; loading: boolean } {
  const { preferences, isLoading: prefsLoading, followedBrands } = useInsightPreferences();
  const { competitors, isLoading: competitorsLoading } = useInsightCompetitors();

  const loading = prefsLoading || competitorsLoading;

  const rows = useMemo<InsightsDigestRow[]>(() => {
    if (loading) return [];
    if (!preferences?.onboarded) return [];
    if (limit <= 0) return [];

    const industries = preferences.industries?.length
      ? preferences.industries
      : [...INSIGHT_INDUSTRIES].slice(0, 3);

    // Prefer real tracked competitors, then followed brands, then a small
    // set of well-known dummy brands so the digest never looks broken.
    const trackedNames = competitors.map((c) => c.name).filter(Boolean);
    const brandSource = trackedNames.length
      ? trackedNames
      : followedBrands.length
        ? followedBrands
        : FALLBACK_COMPETITOR_BRANDS;
    const isTracked = trackedNames.length > 0;
    const competitorBrands = Array.from(new Set(brandSource)).slice(0, 2);

    const candidates: InsightsDigestRow[] = [];

    // ── competitor rows ──
    for (const brand of competitorBrands) {
      const newAds = rangeFromSeed(`competitor-count:${brand}`, 3, 18);
      candidates.push({
        id: `competitor-${slug(brand)}`,
        kind: "competitor",
        title: `${brand} launched ${newAds} new ad${newAds === 1 ? "" : "s"} this week`,
        meta: isTracked ? "Tracked competitor" : "Suggested competitor",
        actionLabel: "View ads",
        to: feedUrlForBrand(brand),
      });
    }

    // ── feed summary row ──
    const feedSeed = `feed:${industries.join(",")}:${brandSource.join(",")}`;
    const feedMatches = rangeFromSeed(feedSeed, 8, 46);
    candidates.push({
      id: "feed-summary",
      kind: "feed",
      title: `${feedMatches} new ads match your feed`,
      meta: industries.slice(0, 2).join(", "),
      actionLabel: "Open feed",
      to: "/insights-v2/feed",
    });

    // ── trend row ──
    const trendIndustry = pickFromSeed(industries, `trend-industry:${industries.join(",")}`);
    const trendTag = pickFromSeed(TRENDING_TAGS, `trend-tag:${trendIndustry}`);
    candidates.push({
      id: `trend-${slug(trendIndustry)}`,
      kind: "trend",
      title: `${trendTag} trending in ${trendIndustry}`,
      actionLabel: "Generate with Genie",
      to: "/iq/genie6/generate",
    });

    // ── top-ad row ──
    const inIndustry = (a: InsightAd) => industries.includes(a.industry);
    const pool = DUMMY_ADS.filter(inIndustry);
    const topAdPool = pool.length ? pool : DUMMY_ADS;
    if (topAdPool.length) {
      const topAd = pickFromSeed(topAdPool, `top-ad:${industries.join(",")}`);
      candidates.push({
        id: `top-ad-${topAd.id}`,
        kind: "top-ad",
        title: `${topAd.brand}'s ad is standing out in ${topAd.industry}`,
        meta: topAd.headline,
        actionLabel: "View ad",
        to: feedUrlForBrand(topAd.brand),
      });
    }

    return candidates.slice(0, limit);
  }, [loading, preferences, competitors, followedBrands, limit]);

  return { rows, loading };
}
