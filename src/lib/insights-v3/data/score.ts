/**
 * AI score — reference A §3, implemented as-is (Q6).
 *
 * Parts (base weights, sum 100): longevity 18 · likes 16 · comments & shares 8 ·
 * clones 16 · craft 42, plus a separate branded penalty (−12 / −6).
 * Missing parts score 0 with max 0; their weight is only partly recovered
 * (RECOVERED_SHARE 0.6) and spread over the available parts.
 * Tiers: Elite ≥80 · Strong ≥60 · Average ≥40 · Weak <40.
 *
 * Note on clones: the reference counts the original as 1 and uses
 * `clone_count − 1`. Our `Ad.clones` already excludes the original, so it is
 * used directly.
 */
import { AI_SCORE_TIER_MIN } from "../types";
import type { AiScore, AiScorePart, AiScoreTier, FrameworkElementKey, MediaKind } from "../types";

export const SCORE_WEIGHTS = { longevity: 18, likes: 16, social: 8, clones: 16, craft: 42 } as const;
export const SCORE_BENCHMARKS = { longevity: 120, likes: 5000, social: 800, clones: 10 } as const;
export const RECOVERED_SHARE = 0.6;
export const CRAFT_MULTIPLIER = 1.55;
export const BRANDED_PENALTY = { none: -12, thin: -6 } as const;

export interface ScoreLanding {
  url: string;
  /** Landing domain (host without www). */
  domain: string;
  finalUrl: string | null;
  offerDomain: string | null;
  offerUrl: string | null;
  /** Number of hops in the redirect path. */
  redirectHops: number;
  pageText: string | null;
}

export interface ScoreInput {
  daysLive: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  /** Null = clone data not reported. */
  clones: number | null;
  mediaKind: MediaKind;
  hasVideo: boolean;
  headline: string;
  primaryText: string;
  transcript: string | null;
  ctaLabel: string | null;
  frameworkElements: FrameworkElementKey[];
  /** Used only to quote an example. */
  hookText: string | null;
  landing: ScoreLanding | null;
  tracker?: string | null;
  network?: string | null;
}

/* ── helpers ────────────────────────────────────────────────────────────── */

const round1 = (n: number) => Math.round(n * 10) / 10;

/** curve(v, bench, max) = min(1, log10(1+v)/log10(1+bench)) × max, rounded to 0.1. v ≤ 0 → 0. */
export function curve(v: number, bench: number, max: number): number {
  if (!(v > 0)) return 0;
  return round1(Math.min(1, Math.log10(1 + v) / Math.log10(1 + bench)) * max);
}

export function scoreTier(total: number): AiScoreTier {
  if (total >= AI_SCORE_TIER_MIN.elite) return "elite";
  if (total >= AI_SCORE_TIER_MIN.strong) return "strong";
  if (total >= AI_SCORE_TIER_MIN.average) return "average";
  return "weak";
}

export const TIER_LABEL: Record<AiScoreTier, string> = {
  elite: "Elite",
  strong: "Strong",
  average: "Average",
  weak: "Weak",
};

/** Partial redistribution factor for a given available max. */
export function redistributionFactor(availableMax: number): number {
  if (availableMax <= 0) return 0;
  const effectiveMax = availableMax + RECOVERED_SHARE * (100 - availableMax);
  return effectiveMax / availableMax;
}

function words(s: string): string[] {
  return s.split(/\s+/).filter(Boolean);
}

function cleanCopy(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function compact(n: number): string {
  if (n >= 1_000_000) return `${round1(n / 1_000_000)}M`;
  if (n >= 1_000) return `${round1(n / 1_000)}K`;
  return String(n);
}

function quote(s: string, max = 90): string {
  const t = s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
  return `“${t}”`;
}

function rootDomain(host: string): string {
  const h = host.toLowerCase().replace(/^www\./, "");
  const parts = h.split(".");
  return parts.length <= 2 ? h : parts.slice(-2).join(".");
}

function hostOf(url: string | null): string | null {
  if (!url) return null;
  const m = /^[a-z]+:\/\/([^/?#]+)/i.exec(url);
  return m ? m[1].toLowerCase() : null;
}

function pathOf(url: string): string {
  const m = /^[a-z]+:\/\/[^/?#]+([^?#]*)/i.exec(url);
  return m ? m[1] : "";
}

/* ── craft regexes (reference A §3, simplified where noted) ─────────────── */

const RE_CLICKBAIT =
  /\b(shocking|weird|banned|doctors hate|they don'?t want|exposed|leaked|this is why|you won'?t believe|watch (what|until|till)|wait (for|until) the end|shut down|controversial|scam|angry|furious|desperate|forced to|refus(e|es|ed) to|(goes|went) viral|crazy|insane|scary|terrifying|nightmare|regret|mistakes?|never do|stop doing|do this|try this|one (simple |weird |strange )?trick|hack|loophole|little-known|nobody talks about|what happened next|hidden|the real reason|finally exposed|shocked)\b/i;
const RE_LISTICLE = /\b\d+\s+(ways|reasons|things|signs|foods|tips|mistakes|secrets|steps)\b/i;
const RE_CURIOUS_PUNCT = /(\?|…|\.\.\.|!)/;
const RE_SECOND_PERSON = /\b(you|your)\b/i;
const RE_HOOK =
  /\b(how i|how to|why|what if|secret|discover|revealed|stop|warning|attention|finally|introducing|the truth|nobody tells|before you)\b/i;
const RE_OFFER = /(\bfree\b|\boff\b|\bsave\b|\$\d+|\d+\s?%|\bdiscount\b|\bdeal\b|\bbogo\b|\btrial\b|\bguarantee\b|money back|\bshipping\b)/i;
const RE_URGENCY = /\b(today|now|limited|last chance|hurry|ends|only \d+|while supplies|don'?t miss|instant)\b/i;
const RE_SOCIAL_PROOF =
  /(\b\d[\d,.]*\+?\s*(people|customers|users|reviews|patients)\b|\brated\b|\breviews\b|\bclinically\b|\bdoctor\b|\bdermatologist\b|\bproven\b|\bstud(y|ies)\b)/i;
const RE_BODY =
  /\b(i was|my (wife|husband|mom|doctor)|years|suffer|pain|struggl|tired of|problem|finally|discovered|until|then i|because)/i;
const RE_SPOKEN_CTA =
  /\b(click the (link|button)|tap|link below|order (now|today)|visit|get yours|go to|check it out|learn more|claim|sign up|shop now|buy now)\b/i;
const RE_LP_OFFER_CTA =
  /(see (the )?(top|best)-rated|check (price|availability)|see today'?s (price|deal|offer)|claim (your|the)|order now|get (yours|it now|it today)|visit the official|→)/i;
const RE_BRIDGE_PATH =
  /\/(article|advertorial|story|news|blog|reviews?|health|report|presell|pre-sell|lp|landing|quiz|survey|vsl|watch|discover|read)\b/i;
const RE_LP_AFFILIATE =
  /(affiliate links|earn a commission|advertorial|this is an advertisement|paid advertisement|sponsored content|we may be compensated)/i;
const RE_LP_ADVERTORIAL = /(affiliate links?|we (may )?earn (a )?commission|advertorial|see (the )?(top|best)-rated)/i;
const RE_THROWAWAY_TLD = /\.(info|xyz|top|click|online|site|live|icu|buzz|shop|store)$/i;
const RE_DIGIT_STUFFED = /[a-z]+\d{2,}/i;
const RE_AFF_PARAMS =
  /[?&](affid|aff_id|aff_sub\d*|affiliate_id|affiliate|hop|hopid|clickid|click_id|cid|sub_id\d*|subid|s[1-3]|utm_term|transaction_id|offer_id|oid|pid|tid|gclid|ttclid|fbclid|source_id|traffic_source|zoneid|campaignid|camp_id)=/i;
const RE_AFF_HOSTS =
  /(clickbank|digistore24|buygoods|maxweb|jvzoo|warriorplus|shareasale|cj\.com|impact|partnerize|awin|hasoffers|go2cloud|^trk\.|^track\.|^click\.|^redirect\.|linkstorm|voluum|redtrack|clickflare|binom|keitaro|thrivetracker)/i;

const DR_ELEMENTS = new Set<FrameworkElementKey>([
  "hook", "pain", "agitation", "fear", "curiosity_loop", "story", "mechanism", "social_proof",
  "authority", "offer", "urgency", "scarcity", "cta", "guarantee", "objection",
]);

/* ── craft ──────────────────────────────────────────────────────────────── */

interface CraftResult {
  raw: number;
  notes: string[];
  examples: string[];
  penalty: number;
  penaltyReason: string | null;
}

function craftScore(input: ScoreInput): CraftResult {
  const notes: string[] = [];
  const examples: string[] = [];
  let raw = 0;

  let copy = cleanCopy(`${input.headline} ${input.primaryText}`);
  let copyWords = words(copy).length;
  if (copyWords < 15 && input.transcript) {
    copy = cleanCopy(`${copy} ${input.transcript}`);
    copyWords = words(copy).length;
  }

  // Format
  if (input.mediaKind === "video" && input.hasVideo) {
    raw += 4;
    notes.push("video creative");
  } else if (input.mediaKind === "carousel") {
    raw += 2.5;
    notes.push("carousel creative");
  } else {
    raw += 1;
  }

  // Script depth
  if (copyWords >= 90) {
    raw += 5;
    notes.push("long-form sales script");
  } else if (copyWords >= 40) {
    raw += 3.5;
    notes.push("long-form script");
  } else if (copyWords >= 15) {
    raw += 2;
    notes.push("developed copy");
  }

  // Angle (first match only)
  const clickbait = RE_CLICKBAIT.test(copy);
  const listicle = !clickbait && RE_LISTICLE.test(copy);
  const curious = !clickbait && !listicle && RE_CURIOUS_PUNCT.test(copy) && RE_SECOND_PERSON.test(copy);
  if (clickbait) {
    raw += 6;
    notes.push("clickbait / curiosity angle");
  } else if (listicle) {
    raw += 4;
    notes.push("listicle angle");
  } else if (curious) {
    raw += 2;
    notes.push("curiosity phrasing");
  }

  const hook = RE_HOOK.test(copy);
  if (hook) {
    raw += 4;
    notes.push("strong hook");
    if (input.hookText) examples.push(quote(input.hookText));
  }

  const offerMatch = RE_OFFER.exec(copy);
  if (offerMatch) {
    raw += 4;
    notes.push("explicit offer");
    examples.push(`offer: “${offerSnippet(copy, offerMatch.index)}”`);
  }

  const urgency = RE_URGENCY.test(copy);
  if (urgency) {
    raw += 3;
    notes.push("urgency");
  }

  if (RE_SOCIAL_PROOF.test(copy)) {
    raw += 2.5;
    notes.push("social proof");
  }

  const hasCta = !!(input.ctaLabel && input.ctaLabel.trim());
  if (hasCta) {
    raw += 2.5;
    notes.push("clear CTA");
    examples.push(`CTA: “${input.ctaLabel}”`);
  }

  // Spoken-script DR
  let scriptHits = 0;
  if (input.transcript) {
    const tw = words(input.transcript);
    if (tw.length >= 20) {
      const first = tw.slice(0, 35).join(" ");
      const last = tw.slice(-60).join(" ");
      if (RE_HOOK.test(first) || RE_CLICKBAIT.test(first) || first.includes("?")) scriptHits++;
      if (tw.length >= 80 && RE_BODY.test(input.transcript)) scriptHits++;
      if (RE_SPOKEN_CTA.test(last)) scriptHits++;
      if (scriptHits === 3) {
        raw += 6;
        notes.push("spoken direct-response script");
      } else if (scriptHits === 2) {
        raw += 3.5;
        notes.push("partly scripted for response");
      }
    }
  }

  // Framework elements in the DR set
  const drCount = new Set(input.frameworkElements.filter((k) => DR_ELEMENTS.has(k))).size;
  if (drCount >= 6) {
    raw += 5;
    notes.push(`${drCount} direct-response elements`);
  } else if (drCount >= 4) {
    raw += 3;
    notes.push(`${drCount} direct-response elements`);
  }

  // Funnel
  let bridged = false;
  let affiliate = false;
  let lpAffiliate = false;
  let lpAdvertorial = false;
  let throwaway = false;
  let lpRedirect = false;
  let affiliateNote = "affiliate / tracked link";
  const lp = input.landing;
  if (lp) {
    const landingRoot = rootDomain(lp.domain);
    const finalHost = hostOf(lp.finalUrl);
    lpRedirect = !!finalHost && rootDomain(finalHost) !== landingRoot;
    const text = lp.pageText ?? "";
    lpAdvertorial = text.length > 200 && RE_LP_ADVERTORIAL.test(text);
    if (
      (lp.offerDomain && rootDomain(lp.offerDomain) !== landingRoot) ||
      lp.redirectHops > 1 ||
      lpRedirect ||
      (text.length > 200 && RE_LP_OFFER_CTA.test(text)) ||
      RE_BRIDGE_PATH.test(pathOf(lp.url))
    ) {
      bridged = true;
    }
    lpAffiliate = RE_LP_AFFILIATE.test(text);
    const label = landingRoot.split(".")[0];
    throwaway = RE_DIGIT_STUFFED.test(label) || RE_THROWAWAY_TLD.test(landingRoot);
    const urls = [lp.url, lp.offerUrl ?? "", lp.finalUrl ?? ""].join(" ");
    const hosts = [lp.domain, hostOf(lp.offerUrl) ?? "", finalHost ?? ""];
    if (input.tracker || input.network) affiliate = true;
    else if (lpAffiliate) {
      affiliate = true;
      affiliateNote = "affiliate disclosure on landing page";
    } else if (throwaway) {
      affiliate = true;
      affiliateNote = "throwaway funnel domain";
    } else if (RE_AFF_PARAMS.test(urls) || hosts.some((h) => RE_AFF_HOSTS.test(h))) {
      affiliate = true;
    }
    if (bridged) {
      raw += 6;
      notes.push(lpAdvertorial ? "advertorial page with offer CTA" : "advertorial / bridge funnel");
    }
    if (affiliate) {
      raw += 6;
      notes.push(affiliateNote);
    }
    if (!bridged && !affiliate) raw += 0.5;
  }

  // Branded penalty
  let penalty = 0;
  let penaltyReason: string | null = null;
  const looksBranded =
    !affiliate && !bridged && !lpAffiliate && !lpAdvertorial && !throwaway && !lpRedirect &&
    scriptHits < 2 && drCount < 4 && copyWords > 0;
  if (looksBranded) {
    const drSignals = [!!offerMatch, urgency, clickbait || listicle || curious, hasCta, hook].filter(Boolean).length;
    if (drSignals === 0) {
      penalty = BRANDED_PENALTY.none;
      penaltyReason = "branded ad: no offer, urgency, hook or CTA";
    } else if (drSignals === 1 && copyWords < 40) {
      penalty = BRANDED_PENALTY.thin;
      penaltyReason = "mostly branded: thin copy, one direct-response signal";
    }
  }

  return { raw, notes, examples: examples.slice(0, 3), penalty, penaltyReason };
}

function offerSnippet(copy: string, idx: number): string {
  const start = Math.max(0, copy.lastIndexOf(" ", Math.max(0, idx - 12)) + 1);
  const endSpace = copy.indexOf(" ", Math.min(copy.length, idx + 14));
  const end = endSpace === -1 ? copy.length : endSpace;
  return copy.slice(start, end).replace(/[.,;:!?]+$/, "");
}

/* ── main ───────────────────────────────────────────────────────────────── */

export function scoreAd(input: ScoreInput): AiScore {
  const likesAvailable = input.likes != null;
  const socialAvailable = input.comments != null || input.shares != null;
  const clonesAvailable = input.clones != null;

  const availableMax =
    SCORE_WEIGHTS.longevity +
    SCORE_WEIGHTS.craft +
    (likesAvailable ? SCORE_WEIGHTS.likes : 0) +
    (socialAvailable ? SCORE_WEIGHTS.social : 0) +
    (clonesAvailable ? SCORE_WEIGHTS.clones : 0);
  const factor = redistributionFactor(availableMax);

  const runDays = input.daysLive ?? 0;
  const longevityMax = round1(SCORE_WEIGHTS.longevity * factor);
  const longevity: AiScorePart = {
    key: "longevity",
    label: "Longevity",
    value: curve(runDays, SCORE_BENCHMARKS.longevity, longevityMax),
    max: longevityMax,
    available: true,
    reason: input.daysLive != null ? `${input.daysLive} days live` : "no run length reported",
    examples: input.daysLive != null ? [`${input.daysLive} days live`] : ["Start date unknown"],
  };

  const likesMax = likesAvailable ? round1(SCORE_WEIGHTS.likes * factor) : 0;
  const likes: AiScorePart = {
    key: "likes",
    label: "Likes",
    value: likesAvailable ? curve(input.likes ?? 0, SCORE_BENCHMARKS.likes, likesMax) : 0,
    max: likesMax,
    available: likesAvailable,
    reason: likesAvailable ? `${compact(input.likes ?? 0)} likes` : "likes not reported",
    examples: likesAvailable ? [`${compact(input.likes ?? 0)} likes`] : [],
  };

  const socialTotal = (input.comments ?? 0) + (input.shares ?? 0);
  const socialMax = socialAvailable ? round1(SCORE_WEIGHTS.social * factor) : 0;
  const socialExamples: string[] = [];
  if (input.comments != null) socialExamples.push(`${compact(input.comments)} comments`);
  if (input.shares != null) socialExamples.push(`${compact(input.shares)} shares`);
  const social: AiScorePart = {
    key: "social",
    label: "Comments & shares",
    value: socialAvailable ? curve(socialTotal, SCORE_BENCHMARKS.social, socialMax) : 0,
    max: socialMax,
    available: socialAvailable,
    reason: socialAvailable ? `${compact(socialTotal)} comments + shares` : "comments and shares not reported",
    examples: socialExamples,
  };

  const clonesMax = clonesAvailable ? round1(SCORE_WEIGHTS.clones * factor) : 0;
  const cloneCount = input.clones ?? 0;
  const clones: AiScorePart = {
    key: "clones",
    label: "Clones",
    value: clonesAvailable ? curve(cloneCount, SCORE_BENCHMARKS.clones, clonesMax) : 0,
    max: clonesMax,
    available: clonesAvailable,
    reason: !clonesAvailable
      ? "clone data not reported"
      : cloneCount > 0
        ? `${cloneCount} competitor clone${cloneCount === 1 ? "" : "s"}`
        : "no clones yet",
    examples: clonesAvailable && cloneCount > 0 ? [`${cloneCount} clone${cloneCount === 1 ? "" : "s"} seen across advertisers`] : [],
  };

  const c = craftScore(input);
  const craftMax = round1(SCORE_WEIGHTS.craft * factor);
  const craftValue = round1(Math.min(SCORE_WEIGHTS.craft, c.raw * CRAFT_MULTIPLIER) * factor);
  const craft: AiScorePart = {
    key: "craft",
    label: "Performance craft",
    value: Math.min(craftValue, craftMax),
    max: craftMax,
    available: true,
    reason: c.notes.length ? c.notes.slice(0, 4).join(", ") : "thin direct-response signals",
    examples: c.examples,
  };

  const penalty: AiScorePart = {
    key: "branded-penalty",
    label: "Branded penalty",
    value: c.penalty,
    max: 0,
    available: true,
    reason: c.penaltyReason ?? "no penalty: direct-response signals present",
    examples: c.penaltyReason ? [c.penaltyReason] : [],
  };

  const parts = [longevity, likes, social, clones, craft, penalty];
  const sum = parts.reduce((s, p) => s + p.value, 0);
  const total = Math.max(1, Math.min(100, Math.round(sum)));
  const tier = scoreTier(total);

  return { total, tier, parts, explanation: explain(total, tier, parts, input) };
}

function explain(total: number, tier: AiScoreTier, parts: AiScorePart[], input: ScoreInput): string {
  const drivers: string[] = [];
  const byKey = Object.fromEntries(parts.map((p) => [p.key, p])) as Record<string, AiScorePart>;
  if (input.daysLive != null && input.daysLive > 0) drivers.push(`${input.daysLive} days live`);
  if ((input.clones ?? 0) > 0) drivers.push(`${input.clones} clone${input.clones === 1 ? "" : "s"}`);
  if (byKey.likes.available && (input.likes ?? 0) > 0) drivers.push(`${compact(input.likes ?? 0)} likes`);
  const craftNotes = byKey.craft.reason;
  const penaltyValue = byKey["branded-penalty"].value;
  const penaltyClause = penaltyValue < 0 ? `, minus a branded penalty of ${Math.abs(penaltyValue)}` : "";
  const first =
    `${TIER_LABEL[tier]} at ${total}/100` +
    (drivers.length
      ? `, built on ${joinList(drivers)} and craft signals (${craftNotes})${penaltyClause}.`
      : `, built mostly on craft signals (${craftNotes})${penaltyClause}.`);
  const missing = parts.filter((p) => !p.available).map((p) => p.label.toLowerCase());
  const second = missing.length
    ? ` ${capitalize(joinList(missing))} ${missing.length === 1 ? "is" : "are"} not reported, so part of that weight moves to the other parts.`
    : "";
  return `${first}${second}`.trim();
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
