/**
 * Template-based AI summaries (non-negotiables #8 and #9).
 *
 * - Every summary opens with its basis: "Based on N ads …" and returns `ads: N`.
 * - Never presents the most common item as the best one. Allowed: "most used",
 *   "appears in", "X of the Y winners use …". Not allowed: "best",
 *   "top-performing", "works best" (enforced by a unit test).
 */
import { ACTIVE_WINDOW_DAYS, FUNNEL_TYPE_LABEL } from "../types";
import type { Ad, Advertiser, AdvertiserKind, AiSummary, CreativeElement, ElementType, LandingPage } from "../types";
import { ELEMENT_TYPE_PLURAL, INDEX } from "../data";
import type { DataIndex } from "../data";
import { formatCompact, pct } from "./context";
import { elementValue } from "./kpis";
import { isWinner } from "./winner";

export type SummarySubject =
  | { kind: "scope"; ads: Ad[]; scopeLabel?: string }
  | { kind: "my-feeds"; ads: Ad[] }
  | { kind: "advertiser"; advertiser: Advertiser; ads: Ad[] }
  | { kind: "element"; elementType: ElementType; element: CreativeElement; ads: Ad[]; scopeAds: Ad[] }
  | { kind: "landing-page"; landingPage: LandingPage; ads: Ad[] }
  | { kind: "offer"; offerDomain: string; ads: Ad[]; landingPageCount: number }
  | { kind: "advertiser-list"; advertiserKind: AdvertiserKind; ads: Ad[] }
  | { kind: "landing-page-list"; ads: Ad[] }
  | { kind: "element-list"; elementType: ElementType; ads: Ad[] };

/** Phrases a summary must never contain (tested). */
export const FORBIDDEN_SUMMARY_PATTERNS: RegExp[] = [
  /\bbest\b/i,
  /\btop[- ]performing\b/i,
  /\bworks? best\b/i,
  /\bmost effective\b/i,
  /\bhighest[- ]performing\b/i,
  /\bwinning formula\b/i,
  /\boutperform/i,
];

interface Most {
  id: string;
  label: string;
  count: number;
  /** % of the ads where this element type was identified. */
  share: number;
  analysed: number;
}

function mostUsed(ads: Ad[], type: ElementType, data: DataIndex): Most | null {
  const counts = new Map<string, number>();
  let analysed = 0;
  for (const a of ads) {
    const v = elementValue(a, type);
    if (!v) continue;
    analysed++;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let lead: [string, number] | null = null;
  for (const e of counts) if (!lead || e[1] > lead[1] || (e[1] === lead[1] && e[0] < lead[0])) lead = e;
  if (!lead) return null;
  return {
    id: lead[0],
    label: data.elementById[type].get(lead[0])?.label ?? lead[0],
    count: lead[1],
    share: pct(lead[1], analysed),
    analysed,
  };
}

function quoteLabel(type: ElementType, label: string): string {
  if (type === "angle") return `“${label}”`;
  if (type === "hook") return `${label.toLowerCase()} hooks`;
  return label;
}

function adsWord(n: number): string {
  return `${formatCompact(n)} ad${n === 1 ? "" : "s"}`;
}

/** "X of the Y winners use Z" — or a plain note when there are no winners. */
function winnersClause(ads: Ad[], type: ElementType, data: DataIndex, verb = "use"): string {
  const winners = ads.filter(isWinner);
  if (!winners.length) return "None of these ads pass the Winner rule yet.";
  const m = mostUsed(winners, type, data);
  if (!m) return `${capitalize(passClause(winners.length))}, but the ${type} isn't identified on ${winners.length === 1 ? "it" : "them"}.`;
  if (winners.length === 1) return `The one winner ${verb === "use" ? "uses" : "opens with"} ${quoteLabel(type, m.label)}.`;
  return `${formatCompact(m.count)} of the ${formatCompact(winners.length)} winners ${verb} ${quoteLabel(type, m.label)}.`;
}

/**
 * Only the "X of the Y winners use Z" part, for summaries that already stated
 * the winner count via `liveAndWinners` (QA-06: never state the winner fact twice).
 * Empty when there are no winners or their element isn't identified.
 */
function winnersUsage(ads: Ad[], type: ElementType, data: DataIndex): string {
  const winners = ads.filter(isWinner);
  if (!winners.length) return "";
  const m = mostUsed(winners, type, data);
  if (!m) return "";
  if (winners.length === 1) return ` The one winner uses ${quoteLabel(type, m.label)}.`;
  return ` ${formatCompact(m.count)} of the ${formatCompact(winners.length)} winners use ${quoteLabel(type, m.label)}.`;
}

function passClause(winners: number): string {
  if (winners === 0) return "none pass the Winner rule yet";
  return `${formatCompact(winners)} ${winners === 1 ? "passes" : "pass"} the Winner rule`;
}

function liveAndWinners(ads: Ad[]): string {
  const active = ads.filter((a) => a.status === "active").length;
  const winners = ads.filter(isWinner).length;
  const live =
    ads.length < 10
      ? `${formatCompact(active)} of ${formatCompact(ads.length)} ${active === 1 ? "was" : "were"} seen live in the last ${ACTIVE_WINDOW_DAYS} days`
      : `${pct(active, ads.length)}% were seen live in the last ${ACTIVE_WINDOW_DAYS} days`;
  return `${live} and ${passClause(winners)}.`;
}

function empty(): AiSummary {
  return { ads: 0, text: "No ads match this scope yet, so there is nothing to summarise." };
}

export function aiSummary(subject: SummarySubject, data: DataIndex = INDEX): AiSummary {
  const ads = subject.ads;
  const n = ads.length;
  if (n === 0) return empty();

  switch (subject.kind) {
    case "scope":
    case "my-feeds": {
      const where = subject.kind === "my-feeds" ? " from your followed pages, industries and competitors" : subject.scopeLabel ? ` in ${subject.scopeLabel}` : "";
      const hook = mostUsed(ads, "hook", data);
      const fw = mostUsed(ads, "framework", data);
      const usage =
        hook && fw
          ? `The most used hook style is ${hook.label.toLowerCase()} (in ${hook.share}% of analysed ads) and the most used framework is ${fw.label}.`
          : "Hook and framework data are too thin here to show a pattern.";
      return { ads: n, text: `Based on ${adsWord(n)}${where}. ${liveAndWinners(ads)} ${usage}${winnersUsage(ads, "framework", data)}` };
    }

    case "advertiser": {
      const { advertiser } = subject;
      const longest = ads.reduce<number | null>((m, a) => (a.daysLive != null && (m == null || a.daysLive > m) ? a.daysLive : m), null);
      const angle = mostUsed(ads, "angle", data);
      const concept = mostUsed(ads, "concept", data);
      const run = longest != null ? ` Their longest-running ad has been live ${longest} days.` : " Start dates are unknown for their ads.";
      const usage =
        angle || concept
          ? ` Their most used ${angle ? `angle is ${quoteLabel("angle", angle.label)}` : ""}${angle && concept ? " and their most used " : ""}${concept ? `concept is ${concept.label}` : ""}.`
          : "";
      return {
        ads: n,
        text: `Based on ${adsWord(n)} from ${advertiser.name}. ${liveAndWinners(ads)}${run}${usage}${winnersUsage(ads, "framework", data)}`,
      };
    }

    case "element": {
      const { elementType: type, element, scopeAds } = subject;
      const share = pct(n, scopeAds.length);
      const winners = ads.filter(isWinner).length;
      const known = ads.filter((a) => a.daysLive != null);
      const avg = known.length ? Math.round(known.reduce((s, a) => s + (a.daysLive ?? 0), 0) / known.length) : null;
      const catCounts = new Map<string, number>();
      for (const a of ads) catCounts.set(a.categoryId, (catCounts.get(a.categoryId) ?? 0) + 1);
      let topCat: [string, number] | null = null;
      for (const e of catCounts) if (!topCat || e[1] > topCat[1] || (e[1] === topCat[1] && e[0] < topCat[0])) topCat = e;
      const advertisers = new Set(ads.map((a) => a.pageAdvertiserId)).size;
      const catLabel = topCat ? data.categoryById.get(topCat[0])?.label ?? topCat[0] : null;
      const avgText = avg != null ? ` and run ${avg} days on average (where the start date is known)` : "";
      return {
        ads: n,
        text:
          `Based on ${adsWord(n)} using ${quoteLabel(type, element.label)}, ${share}% of ads in scope. ` +
          `${capitalize(passClause(winners).replace(/^(\d[\d.,KM]*) /, "$1 of them "))}${avgText}. ` +
          (catLabel ? `It appears most in ${catLabel} and is used by ${formatCompact(advertisers)} advertiser${advertisers === 1 ? "" : "s"}. ` : "") +
          `Usage counts show popularity, not results.`,
      };
    }

    case "landing-page": {
      const lp = subject.landingPage;
      const funnel = lp.funnelType ? FUNNEL_TYPE_LABEL[lp.funnelType].toLowerCase() : "unclassified";
      const pages = new Set(ads.map((a) => a.pageAdvertiserId)).size;
      const hook = mostUsed(ads, "hook", data);
      const offer = lp.offerDomain ? ` It sends visitors on to ${lp.offerDomain}.` : " Its offer is not traced.";
      return {
        ads: n,
        text:
          `Based on ${adsWord(n)} sending traffic to this ${funnel} page on ${lp.domain}. ` +
          `${formatCompact(pages)} advertiser${pages === 1 ? " uses" : "s use"} it. ${liveAndWinners(ads)}` +
          (hook ? ` The most used hook style leading here is ${hook.label.toLowerCase()}.` : "") +
          offer,
      };
    }

    case "offer": {
      const pages = new Set(ads.map((a) => a.pageAdvertiserId)).size;
      const fw = mostUsed(ads, "framework", data);
      return {
        ads: n,
        text:
          `Based on ${adsWord(n)} across ${formatCompact(subject.landingPageCount)} landing page${subject.landingPageCount === 1 ? "" : "s"} that send to ${subject.offerDomain}. ` +
          `${formatCompact(pages)} advertiser${pages === 1 ? " promotes" : "s promote"} it. ${liveAndWinners(ads)}` +
          (fw ? ` The most used framework in these ads is ${fw.label}.` : ""),
      };
    }

    case "advertiser-list": {
      const key = (a: Ad) => (subject.advertiserKind === "page" ? a.pageAdvertiserId : a.domainAdvertiserId);
      const groups = new Map<string, Ad[]>();
      for (const a of ads) {
        const k = key(a);
        if (!k) continue;
        const list = groups.get(k);
        if (list) list.push(a);
        else groups.set(k, [a]);
      }
      const noun = subject.advertiserKind === "page" ? "page" : "domain";
      let withWinner = 0;
      let biggest: [string, number] | null = null;
      for (const [id, list] of groups) {
        if (list.some(isWinner)) withWinner++;
        if (!biggest || list.length > biggest[1] || (list.length === biggest[1] && id < biggest[0])) biggest = [id, list.length];
      }
      const bigName = biggest ? data.advertiserById.get(biggest[0])?.name ?? biggest[0] : null;
      return {
        ads: n,
        text:
          `Based on ${adsWord(n)} from ${formatCompact(groups.size)} ${noun}${groups.size === 1 ? "" : "s"}. ` +
          `${formatCompact(withWinner)} of them have at least one winning ad.` +
          (bigName && biggest ? ` ${bigName} runs the most ads in scope (${formatCompact(biggest[1])}); ad volume reflects spend and testing, not results.` : ""),
      };
    }

    case "landing-page-list": {
      const lps = new Map<string, LandingPage>();
      for (const a of ads) {
        if (!a.landingPageId) continue;
        const lp = data.landingPageById.get(a.landingPageId);
        if (lp) lps.set(lp.id, lp);
      }
      const funnels = new Map<string, number>();
      let traced = 0;
      for (const lp of lps.values()) {
        if (lp.offerDomain) traced++;
        if (lp.funnelType) funnels.set(lp.funnelType, (funnels.get(lp.funnelType) ?? 0) + 1);
      }
      let topFunnel: [string, number] | null = null;
      for (const e of funnels) if (!topFunnel || e[1] > topFunnel[1] || (e[1] === topFunnel[1] && e[0] < topFunnel[0])) topFunnel = e;
      const onLp = ads.filter((a) => a.landingPageId).length;
      return {
        ads: onLp,
        text:
          `Based on ${adsWord(onLp)} landing on ${formatCompact(lps.size)} page${lps.size === 1 ? "" : "s"}. ` +
          (topFunnel ? `${FUNNEL_TYPE_LABEL[topFunnel[0] as keyof typeof FUNNEL_TYPE_LABEL]} is the most used funnel type (${pct(topFunnel[1], lps.size)}% of pages). ` : "") +
          `Offers are traced for ${pct(traced, lps.size)}% of pages; the rest show "Not traced".`,
      };
    }

    case "element-list": {
      const type = subject.elementType;
      const m = mostUsed(ads, type, data);
      if (!m) return { ads: 0, text: `None of the ads in this scope have a ${type} identified, so there is nothing to summarise.` };
      const distinct = new Set(ads.map((a) => elementValue(a, type)).filter(Boolean)).size;
      return {
        ads: m.analysed,
        text:
          `Based on ${adsWord(m.analysed)} with a ${type} identified. ${formatCompact(distinct)} ${ELEMENT_TYPE_PLURAL[type]} are in use; the most used is ${quoteLabel(type, m.label)} at ${m.share}%. ` +
          winnersClause(ads, type, data, type === "hook" ? "open with" : "use"),
      };
    }

    default:
      return empty();
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
