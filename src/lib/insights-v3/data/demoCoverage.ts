/**
 * Demo coverage for the module singleton (Industry Insights V2).
 *
 * `generateUniverse` stays a pure, realistic generator. On top of it, the
 * singleton (`UNIVERSE` / `INDEX` in `./index`) gets a small set of deterministic
 * POST-GENERATION OVERRIDES so that My Feeds contains every kind of data a demo
 * needs: very long page names, every engagement shape, a 400+ day run, a 0-day
 * run, dead creative URLs, an ad with every optional field missing, and a
 * New + Winner ad.
 *
 * Rules the overrides follow:
 *  - Only ads that are already in the seeded My Feeds are touched. The seeded
 *    prefs follow the Telehealth industry and the VSL page `pg-029`, so every ad
 *    that `inDemoFeed` accepts is always in the feed. `demoCoverage.test.ts`
 *    asserts feed membership against the real seeded prefs.
 *  - Nothing that feeds a documented aggregate changes: total ads, industry /
 *    category counts, active count, winner count, every tag count, the all-time
 *    KPI row, the launch series. Where a tag-feeding or launch-feeding field has
 *    to change it MOVES between two ads (CTA label, start dates, clones), so
 *    counts, sums and the multiset of launch dates stay identical.
 *    The one intended exception: the New + Winner ad's launch moves ~12 days
 *    earlier (a Winner needs 14+ days live). The test pins the full list.
 *  - Deterministic: no Math.random / Date.now. Numbers come from `childRng`.
 *  - Ids are pinned for the default seed and each one is guarded by a
 *    precondition (page / industry). A guard that fails skips that override
 *    instead of throwing, and the test then reports the gap.
 *
 * AI scores of touched ads are recomputed with `scoreAd`, so the drawer never
 * says "likes not reported" next to a likes number.
 */
import type { Ad, Engagement, LandingPage } from "../types";
import { DEFAULT_AD_COUNT, DEFAULT_SEED } from "./generate";
import type { Universe } from "./generate";
import { childRng, logNormal } from "./prng";
import { scoreAd } from "./score";

const DAY = 86_400_000;

/** URLs that never resolve (`.invalid` is reserved) so the broken-image fallback is exercised. */
export const DEAD_THUMBNAIL_URLS = [
  "https://images.invalid/missing-creative.jpg",
  "https://images.invalid/creative-removed-404.jpg",
] as const;

/** Page renames → names of 60–85 characters, still starting with the original brand. */
const LONG_PAGE_NAMES: { pageId: string; from: string; to: string }[] = [
  { pageId: "pg-042", from: "Vela Rx", to: "Vela Rx Online Prescription Care, Lab Testing & Metabolic Weight Management Clinic" },
  { pageId: "pg-035", from: "Onward Rx", to: "Onward Rx Doctor-Led Hormone & Longevity Care Network of North America" },
];

const HERO = { id: "ad-0050", pageId: "pg-041", minDays: 400 } as const;
const ZERO_DAY_AD = { id: "ad-0109", pageId: "pg-049" } as const;
/** The ad with every optional field missing. */
const BARE_AD = { id: "ad-0418", pageId: "pg-041" } as const;
/** Recent ad that becomes New + Winner, and the same-page winner that hands over clones. */
const NEW_WINNER = { newId: "ad-0414", pageId: "pg-029", days: 14 } as const;
/** Seeded prefs follow Telehealth and the top VSL page; ads outside these are never touched. */
const ANCHOR_PAGE_ID = "pg-029";
const inDemoFeed = (a: Ad) => a.industryId === "telehealth" || a.pageAdvertiserId === ANCHOR_PAGE_ID;

/** Engagement shapes to add (4 ads each), plus one tiny and one all-zero. */
type Shape = "likes" | "comments" | "shares" | "likes+shares";
const SHAPES: Shape[] = ["likes", "comments", "shares", "likes+shares"];
const ADS_PER_SHAPE = 4;

/** Ids touched by the overrides, for tests. Filled by `applyDemoCoverage`. */
export interface DemoCoverageReport {
  applied: string[];
  skipped: string[];
  touchedAdIds: string[];
}

function scoreInput(ad: Ad, lp: LandingPage | undefined) {
  return {
    daysLive: ad.daysLive,
    likes: ad.engagement.likes,
    comments: ad.engagement.comments,
    shares: ad.engagement.shares,
    clones: ad.clones,
    mediaKind: ad.mediaKind,
    hasVideo: !!ad.videoUrl,
    headline: ad.headline,
    primaryText: ad.primaryText,
    transcript: ad.analysis.transcript,
    ctaLabel: ad.ctaLabel,
    frameworkElements: ad.analysis.frameworkElements,
    hookText: ad.analysis.hookText,
    landing: lp
      ? {
          url: lp.url,
          domain: lp.domain,
          finalUrl: lp.finalUrl,
          offerDomain: lp.offerDomain,
          offerUrl: lp.offerUrl,
          redirectHops: lp.redirectPath.length,
          pageText: lp.pageText,
        }
      : null,
  };
}

/** Same inputs the generator feeds `scoreAd`, so an untouched ad rescored here equals its original score. */
export function rescoreAd(ad: Ad, landingPageById: Map<string, LandingPage>): void {
  ad.aiScore = scoreAd(scoreInput(ad, ad.landingPageId ? landingPageById.get(ad.landingPageId) : undefined));
}

const iso = (ms: number) => new Date(ms).toISOString();

/** Start date so the ad has exactly `days` days live (start → lastSeen). */
function setRunDays(ad: Ad, days: number): void {
  const last = Date.parse(ad.lastSeenAt);
  ad.startedAt = iso(last - days * DAY);
  ad.daysLive = days;
}

/** Zero-day run: start = first seen, which is within 12h of last seen for this ad. */
function setRunFromFirstSeen(ad: Ad): void {
  const start = Math.min(Date.parse(ad.firstSeenAt), Date.parse(ad.lastSeenAt));
  ad.startedAt = iso(start);
  ad.daysLive = Math.max(0, Math.round((Date.parse(ad.lastSeenAt) - start) / DAY));
}

const daysBetween = (startIso: string, lastIso: string) => Math.max(0, Math.round((Date.parse(lastIso) - Date.parse(startIso)) / DAY));

/** Exchange start dates: the multiset of launch dates and the sum of days live stay the same. */
function swapStarts(a: Ad, b: Ad): void {
  const sa = a.startedAt as string;
  const sb = b.startedAt as string;
  a.startedAt = sb;
  b.startedAt = sa;
  a.daysLive = daysBetween(sb, a.lastSeenAt);
  b.daysLive = daysBetween(sa, b.lastSeenAt);
}

const utcMonth = (ms: number) => new Date(ms).toISOString().slice(0, 7);

function engagementFor(universe: Universe, ad: Ad, shape: Shape): Engagement {
  const rng = childRng(universe.seed, `demo-coverage:${ad.id}`);
  const likes = Math.max(1, Math.round(logNormal(rng, 420, 1.3)));
  const comments = Math.max(1, Math.round(logNormal(rng, 60, 1.2)));
  const shares = Math.max(1, Math.round(logNormal(rng, 40, 1.4)));
  switch (shape) {
    case "likes": return { likes, comments: null, shares: null };
    case "comments": return { likes: null, comments, shares: null };
    case "shares": return { likes: null, comments: null, shares };
    case "likes+shares": return { likes, comments: null, shares };
  }
}

/**
 * Mutates `universe` in place and returns it. No-op for any universe that is not the
 * default 800-ad one, so tests with their own seeds see the raw generator.
 */
export function applyDemoCoverage(universe: Universe, report?: DemoCoverageReport): Universe {
  if (universe.seed !== DEFAULT_SEED || universe.ads.length !== DEFAULT_AD_COUNT) return universe;

  const adById = new Map(universe.ads.map((a) => [a.id, a]));
  const lpById = new Map(universe.landingPages.map((l) => [l.id, l]));
  const advertiserById = new Map(universe.advertisers.map((a) => [a.id, a]));
  const touched = new Set<Ad>();
  const reserved = new Set<string>();
  const log = report ?? { applied: [], skipped: [], touchedAdIds: [] };

  const ok = (what: string) => log.applied.push(what);
  const skip = (what: string) => log.skipped.push(what);
  const touch = (ad: Ad) => touched.add(ad);
  const get = (id: string, pageId: string): Ad | null => {
    reserved.add(id);
    const ad = adById.get(id);
    return ad && ad.pageAdvertiserId === pageId ? ad : null;
  };
  const telehealth = universe.ads.filter((a) => a.industryId === "telehealth");

  /* 1. Page names of 60–85 chars. Advertiser name and every ad's pageName stay equal. */
  for (const r of LONG_PAGE_NAMES) {
    const adv = advertiserById.get(r.pageId);
    if (!adv || adv.kind !== "page" || adv.name !== r.from) {
      skip(`long page name ${r.pageId}`);
      continue;
    }
    adv.name = r.to;
    for (const ad of universe.ads) {
      if (ad.pageAdvertiserId !== r.pageId) continue;
      ad.pageName = r.to;
      // Some brand-led copy names the page ("… by Vela Rx"); keep it in step.
      const swap = (s: string | null) => (s == null ? s : s.split(r.from).join(r.to));
      ad.headline = swap(ad.headline) as string;
      ad.primaryText = swap(ad.primaryText) as string;
      ad.analysis.hookText = swap(ad.analysis.hookText);
      ad.analysis.summary = swap(ad.analysis.summary);
      ad.analysis.transcript = swap(ad.analysis.transcript);
      if (ad.analysis.beats) ad.analysis.beats = ad.analysis.beats.map((b) => ({ ...b, text: swap(b.text) as string }));
      touch(ad);
    }
    ok(`long page name ${r.pageId} (${r.to.length} chars)`);
  }

  /* 2a. Hero: Winner, 400+ days, huge engagement (shows the Winner badge's engagement mark).
   *     No ad launched 400 days before its last sighting, so it swaps start dates with an
   *     inactive Telehealth ad that launched earlier (launch dates + days-live sum unchanged). */
  const hero = get(HERO.id, HERO.pageId);
  if (hero && hero.industryId === "telehealth" && hero.status === "active" && (hero.daysLive ?? 0) >= 14 && hero.clones >= 2 && hero.startedAt) {
    const heroStart = Date.parse(hero.startedAt);
    const cutoff = Date.parse(hero.lastSeenAt) - HERO.minDays * DAY;
    const partner = telehealth
      .filter(
        (a) =>
          a.id !== hero.id && !reserved.has(a.id) && a.status === "inactive" && a.startedAt != null && Date.parse(a.startedAt) <= cutoff &&
          Date.parse(a.firstSeenAt) >= heroStart && Date.parse(a.lastSeenAt) >= heroStart,
      )
      .sort((a, b) => (b.startedAt as string).localeCompare(a.startedAt as string) || (a.id < b.id ? -1 : 1))[0];
    if (partner) {
      reserved.add(partner.id);
      swapStarts(hero, partner);
      hero.engagement = { likes: 1_240_000, comments: 48_300, shares: 9_100 };
      touch(hero);
      touch(partner);
      ok(`hero ${hero.id}: ${hero.daysLive} days (start date from ${partner.id}), 1.24M likes`);
    } else skip("hero partner");
  } else skip("hero");

  /* 2b. Zero-day ad (non-winner, stays active; clones 0). */
  const zero = get(ZERO_DAY_AD.id, ZERO_DAY_AD.pageId);
  if (zero && zero.status === "active" && zero.clones < 2 && Date.parse(zero.lastSeenAt) - Date.parse(zero.firstSeenAt) < DAY / 2) {
    setRunFromFirstSeen(zero);
    touch(zero);
    ok(`zero-day ${zero.id}`);
  } else skip("zero-day ad");

  /* 6. Bare ad: every optional field missing. Tag-feeding values MOVE to ads that lacked them. */
  const bare = get(BARE_AD.id, BARE_AD.pageId);
  if (
    bare && bare.status === "inactive" && bare.domainAdvertiserId == null && bare.landingPageId == null &&
    bare.countries.length === 0 && !bare.analysis.hookStyle && !bare.analysis.angle && !bare.analysis.framework &&
    !bare.analysis.concept && bare.ctaLabel && bare.startedAt && bare.daysLive != null
  ) {
    // CTA label → a Telehealth ad that had none (cta tag counts unchanged).
    const ctaDonor = telehealth.find((a) => a.id !== bare.id && !reserved.has(a.id) && a.status === "inactive" && !a.ctaLabel);
    // Start date → an inactive ad with an unknown start and no element tags (so no element table moves) that was
    // first seen in the same month as the new start (same days live, same launch month: avg-days KPI and launch
    // series unchanged). Prefers a donor first seen on or before the new start; one day later is tolerated.
    const days = bare.daysLive as number;
    const noElements = (a: Ad) => !a.analysis.hookStyle && !a.analysis.framework && !a.analysis.angle && !a.analysis.concept;
    const lateBy = (a: Ad) => Date.parse(a.firstSeenAt) - (Date.parse(a.lastSeenAt) - days * DAY);
    const startDonor = universe.ads
      .filter(
        (a) =>
          inDemoFeed(a) && a.id !== bare.id && !reserved.has(a.id) && a.id !== ctaDonor?.id && a.status === "inactive" && a.startedAt == null &&
          noElements(a) && lateBy(a) <= DAY && utcMonth(Date.parse(a.firstSeenAt)) === utcMonth(Date.parse(a.lastSeenAt) - days * DAY),
      )
      .sort((a, b) => Number(lateBy(a) < 0 ? 0 : 1) - Number(lateBy(b) < 0 ? 0 : 1) || (a.id < b.id ? -1 : 1))[0];
    if (ctaDonor && startDonor) {
      reserved.add(ctaDonor.id);
      reserved.add(startDonor.id);
      ctaDonor.ctaLabel = bare.ctaLabel;
      setRunDays(startDonor, days);
      bare.ctaLabel = null;
      bare.startedAt = null;
      bare.daysLive = null;
      bare.thumbnailUrl = null;
      bare.delivery = { spendTillNow: null, estAudienceSize: null, impressions: null, totalReach: null, brReach: null, euReach: null };
      bare.demographics = [];
      bare.locations = [];
      bare.transparencyRegions = [];
      bare.lastSyncedAt = null;
      touch(bare);
      touch(ctaDonor);
      touch(startDonor);
      ok(`bare ${bare.id} (CTA → ${ctaDonor.id}, start date → ${startDonor.id})`);
    } else skip("bare ad donors");
  } else skip("bare ad");

  /* 9. New + Winner: a recent ad gets 14 days live and 2+ clones; the most similar same-page winner
   *    hands its clones over and stops being a winner (winner count unchanged). */
  const fresh = get(NEW_WINNER.newId, NEW_WINNER.pageId);
  if (fresh && fresh.status === "active" && fresh.clones < 2 && Date.parse(fresh.lastSeenAt) - Date.parse(fresh.firstSeenAt) < 2 * DAY) {
    // Element tables count winners per hook / framework / angle / concept, so match those first.
    const same = (x: string | null, y: string | null) => (x != null && x === y ? 2 : 0);
    const similarity = (w: Ad) =>
      same(w.analysis.hookStyle, fresh.analysis.hookStyle) + same(w.analysis.framework, fresh.analysis.framework) +
      same(w.analysis.angle, fresh.analysis.angle) + same(w.analysis.concept, fresh.analysis.concept) +
      (w.domainAdvertiserId === fresh.domainAdvertiserId ? 1 : 0) + (w.mediaKind === fresh.mediaKind ? 0.5 : 0);
    const giver = universe.ads
      .filter(
        (w) =>
          w.id !== fresh.id && !reserved.has(w.id) && w.pageAdvertiserId === fresh.pageAdvertiserId && w.industryId === fresh.industryId &&
          w.categoryId === fresh.categoryId && w.status === "active" && (w.daysLive ?? 0) >= 14 && w.clones >= 2,
      )
      .sort((a, b) => similarity(b) - similarity(a) || (a.id < b.id ? -1 : 1))[0];
    if (giver) {
      reserved.add(giver.id);
      fresh.clones += giver.clones - 1;
      giver.clones = 1;
      setRunDays(fresh, NEW_WINNER.days);
      touch(fresh);
      touch(giver);
      ok(`new+winner ${fresh.id} (clones from ${giver.id})`);
    } else skip("new + winner giver");
  } else skip("new + winner ad");

  /* 5. Two dead creative URLs: first Telehealth image and video ad with a thumbnail that are not otherwise special or recent. */
  const isRecent = (a: Ad) => universe.now - Date.parse(a.firstSeenAt) < 48 * 3_600_000;
  const deadTargets = (["image", "video"] as const).map((kind) =>
    telehealth.find((a) => a.mediaKind === kind && a.thumbnailUrl && !reserved.has(a.id) && !isRecent(a)),
  );
  deadTargets.forEach((ad, i) => {
    if (!ad) return skip(`dead thumbnail ${i}`);
    reserved.add(ad.id);
    ad.thumbnailUrl = DEAD_THUMBNAIL_URLS[i];
    touch(ad);
    ok(`dead thumbnail ${ad.id}`);
  });

  /* 2c. Engagement shapes on Telehealth ads that report nothing today. */
  const pool = telehealth.filter((a) => !reserved.has(a.id) && a.engagement.likes == null && a.engagement.comments == null && a.engagement.shares == null);
  const wanted = SHAPES.length * ADS_PER_SHAPE + 2;
  const stride = Math.max(1, Math.floor(pool.length / wanted));
  const pick = (i: number): Ad | undefined => pool[Math.min(pool.length - 1, i * stride + 1)];
  let slot = 0;
  for (const shape of SHAPES) {
    for (let k = 0; k < ADS_PER_SHAPE; k++) {
      const ad = pick(slot++);
      if (!ad) {
        skip(`engagement ${shape}`);
        continue;
      }
      ad.engagement = engagementFor(universe, ad, shape);
      touch(ad);
    }
    ok(`engagement ${shape} x${ADS_PER_SHAPE}`);
  }
  const tiny = pick(slot++);
  const allZero = pick(slot++);
  if (tiny && allZero) {
    tiny.engagement = { likes: 3, comments: 0, shares: 1 };
    allZero.engagement = { likes: 0, comments: 0, shares: 0 };
    touch(tiny);
    touch(allZero);
    ok(`engagement tiny ${tiny.id}, all-zero ${allZero.id}`);
  } else skip("engagement tiny / zero");

  for (const ad of touched) rescoreAd(ad, lpById);
  log.touchedAdIds = Array.from(touched, (a) => a.id).sort();
  return universe;
}
