/**
 * Client-side downloads (Q16).
 *  - ad:                         creative media (url) + a .txt of copy and analysis
 *  - framework/hook/angle/concept/domain/page/offer: Markdown one-pager
 *  - landing-page:               screenshot (url) + page text
 *
 * `buildDownload(ref)` returns the primary file (the text/markdown one — media
 * can be missing). `buildDownloads(ref)` returns every file for the item.
 */
import { DEFAULT_SCOPE, FUNNEL_TYPE_LABEL, SAVABLE_LABEL } from "../types";
import type { Ad, DownloadFile, ElementType, SavedItemRef, Scope } from "../types";
import { COUNTRY_NAME, FRAMEWORK_ELEMENT_LABEL, INDEX, slugify } from "../data";
import type { DataIndex } from "../data";
import { formatDays } from "./context";
import { advertiserDetail, elementDetail, landingPageDetail, offerDetail } from "./details";
import type { MixBlock } from "./details";
import { scopeLabel } from "./scope";
import { isWinner } from "./winner";

export interface DownloadCtx {
  /** Scope the one-pager follows. Default: All / All / All time. */
  scope?: Scope;
  now?: number;
  data?: DataIndex;
  /** Source ads (default: the whole universe). */
  baseAds?: Ad[];
}

const ELEMENT_TYPES: ElementType[] = ["framework", "hook", "angle", "concept"];

function dateOnly(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "Unknown";
}

function mixLines(block: MixBlock, limit = 8): string[] {
  if (!block.basedOn || !block.items.length) return ["- Not enough data"];
  return block.items.slice(0, limit).map((i) => `- ${i.label}: ${i.count} ads (${i.sharePct}%)`);
}

function fileBase(type: string, label: string): string {
  return `${type}-${slugify(label).slice(0, 60) || "item"}`;
}

/* ── ad ─────────────────────────────────────────────────────────────────── */

function adText(ad: Ad, data: DataIndex): string {
  const a = ad.analysis;
  const lp = ad.landingPageId ? data.landingPageById.get(ad.landingPageId) : undefined;
  const domain = ad.domainAdvertiserId ? data.advertiserById.get(ad.domainAdvertiserId)?.name : null;
  const label = (type: ElementType, id: string | null) => (id ? data.elementById[type].get(id)?.label ?? id : "Not identified");
  const lines: string[] = [
    ad.headline,
    "",
    `Competitor: ${ad.pageName}${domain ? ` (${domain})` : ""}`,
    `Ad ID: ${ad.externalId}`,
    `Industry / category: ${data.industryById.get(ad.industryId)?.label ?? ad.industryId} / ${data.categoryById.get(ad.categoryId)?.label ?? ad.categoryId}`,
    `Status: ${ad.status === "active" ? "Seen live in the last 14 days" : "Not seen live in the last 14 days"}${isWinner(ad) ? " · Winner" : ""}`,
    `Days live: ${formatDays(ad.daysLive)}`,
    `Clones: ${ad.clones}`,
    `AI score: ${ad.aiScore.total}/100 (${ad.aiScore.tier})`,
    `First seen: ${dateOnly(ad.firstSeenAt)} · Started: ${ad.startedAt ? dateOnly(ad.startedAt) : "Start date unknown"}`,
    `Platforms: ${ad.platforms.join(", ")}`,
    `Countries: ${ad.countries.length ? ad.countries.map((c) => COUNTRY_NAME[c] ?? c).join(", ") : "Not reported"}`,
    "",
    "COPY",
    `Headline: ${ad.headline}`,
    `Primary text: ${ad.primaryText}`,
    `CTA button: ${ad.ctaLabel ?? "None"}`,
    "",
    "ANALYSIS",
    `Hook style: ${label("hook", a.hookStyle)}`,
    `Hook: ${a.hookText ?? "Not identified"}`,
    `Angle: ${label("angle", a.angle)}${a.angleText ? ` (${a.angleText})` : ""}`,
    `Framework: ${label("framework", a.framework)}`,
    `Concept: ${label("concept", a.concept)}`,
    `Framework elements: ${a.frameworkElements.length ? a.frameworkElements.map((k) => FRAMEWORK_ELEMENT_LABEL[k]).join(", ") : "Not identified"}`,
    `Keywords: ${a.keywords.join(", ")}`,
    `Closing CTA: ${a.ctaText ?? "Not identified"}`,
    `How it sells: ${a.summary ?? "Not available"}`,
    "",
    "SCRIPT",
    ...(a.beats
      ? a.beats.map(
          (b) =>
            `${b.start != null && b.end != null ? `[${b.start}–${b.end}s] ` : ""}${FRAMEWORK_ELEMENT_LABEL[b.element]}: ${b.text}${b.visual ? ` (on screen: ${b.visual})` : ""}`,
        )
      : ["No script data for this ad."]),
    "",
    "TRANSCRIPT",
    a.transcript ?? "No transcript for this ad.",
    "",
    "LANDING PAGE",
    lp ? `URL: ${lp.url}` : "No landing page captured.",
    ...(lp
      ? [
          `Funnel: ${lp.funnelType ? FUNNEL_TYPE_LABEL[lp.funnelType] : "Unclassified"}`,
          `Offer: ${lp.offerDomain ?? "Not traced"}`,
        ]
      : []),
    "",
    "AI SCORE BREAKDOWN",
    ...ad.aiScore.parts.map((p) => `${p.label}: ${p.available ? `${p.value} / ${p.max}` : "Not reported"} — ${p.reason}`),
    ad.aiScore.explanation,
    "",
    `Media: ${ad.videoUrl ?? ad.thumbnailUrl ?? "No media file"}`,
  ];
  return lines.join("\n");
}

/* ── one-pagers ─────────────────────────────────────────────────────────── */

function resolveCtx(ctx: DownloadCtx) {
  const data = ctx.data ?? INDEX;
  return {
    data,
    scope: ctx.scope ?? DEFAULT_SCOPE,
    now: ctx.now ?? data.now,
    baseAds: ctx.baseAds ?? data.ads,
  };
}

function elementMarkdown(type: ElementType, id: string, ctx: DownloadCtx): DownloadFile | null {
  const { data, scope, now, baseAds } = resolveCtx(ctx);
  const d = elementDetail(type, id, baseAds, scope, { now, data });
  if (!d) return null;
  const k = Object.fromEntries(d.kpis.map((x) => [x.key, x]));
  const md = [
    `# ${d.element.label}`,
    "",
    `_${SAVABLE_LABEL[type]}_${d.element.description ? ` · ${d.element.description}` : ""}`,
    "",
    `**Based on ${d.basedOn} ads** · ${scopeLabel(scope, data)}`,
    "",
    "## At a glance",
    `- Ads using it: ${d.basedOn} (${k.share?.display ?? "0%"} of ads in scope)`,
    `- Winning ads: ${k.winning?.display ?? "0"}`,
    `- Live ads: ${k.active?.display ?? "0"}`,
    `- Avg days live: ${k.avgDaysLive?.display ?? "—"}`,
    `- Longest run: ${k.longestRun?.display ?? "—"}`,
    `- Competitors: ${k.advertisers?.display ?? "0"}`,
    `- Total clones: ${k.clones?.display ?? "0"}`,
    "",
    "## Summary",
    d.summary.text,
    "",
    "## Where it works",
    "### Categories",
    ...mixLines(d.whereItWorks.categories),
    "### Industries",
    ...mixLines(d.whereItWorks.industries),
    "### Competitors",
    ...mixLines(d.whereItWorks.advertisers),
    "",
    "## Works well with",
    ...d.worksWellWith.groups.flatMap((g) => [
      `### ${g.label}`,
      ...(g.items.length ? g.items.slice(0, 5).map((i) => `- ${i.label}: ${i.count} ads together (lift ${i.lift}×)`) : ["- Not enough data"]),
    ]),
    "",
    "## Example hooks",
    ...(d.exampleHooks.items.length ? d.exampleHooks.items.map((h) => `> ${h.text}`) : ["Not enough data"]),
  ];
  return { kind: "text", filename: `${fileBase(type, d.element.label)}.md`, mime: "text/markdown", content: md.join("\n") };
}

function advertiserMarkdown(kind: "domain" | "page", id: string, ctx: DownloadCtx): DownloadFile | null {
  const { data, scope, now, baseAds } = resolveCtx(ctx);
  const d = advertiserDetail(kind, id, baseAds, scope, { now, data });
  if (!d) return null;
  const md = [
    `# ${d.advertiser.name}`,
    "",
    `_${SAVABLE_LABEL[kind]}_ · first seen ${dateOnly(d.advertiser.firstSeenAt)}`,
    "",
    `**Based on ${d.basedOn} ads** · ${scopeLabel(scope, data)}`,
    "",
    "## Key numbers",
    ...d.kpis.map((k) => `- ${k.label}: ${k.display}${k.sub ? ` (${k.sub})` : ""}`),
    "",
    "## Summary",
    d.summary.text,
    "",
    "## Hook styles",
    ...mixLines(d.hooks),
    "## Angles",
    ...mixLines(d.angles),
    "## Frameworks",
    ...mixLines(d.frameworks),
    "## Concepts",
    ...mixLines(d.concepts),
    "## CTA mix",
    ...mixLines(d.ctas),
    "## Keywords",
    ...mixLines(d.keywords, 12),
    "",
    "## Landing pages",
    ...(d.landingPages.rows.length
      ? d.landingPages.rows.slice(0, 10).map((r) => `- ${r.landingPage.url} · ${r.funnelLabel ?? "Unclassified"} · offer: ${r.offerDomain ?? "Not traced"} · ${r.adsTotal} ads`)
      : ["- No landing pages captured"]),
  ];
  return { kind: "text", filename: `${fileBase(kind, d.advertiser.name)}.md`, mime: "text/markdown", content: md.join("\n") };
}

function offerMarkdown(domain: string, ctx: DownloadCtx): DownloadFile | null {
  const { data, scope, now, baseAds } = resolveCtx(ctx);
  const d = offerDetail(domain, baseAds, scope, { now, data });
  if (!d) return null;
  const md = [
    `# ${d.offer.domain}`,
    "",
    `_Offer_${d.offer.url ? ` · ${d.offer.url}` : ""}`,
    "",
    `**Based on ${d.basedOn} ads** · ${scopeLabel(scope, data)}`,
    "",
    "## Key numbers",
    ...d.kpis.map((k) => `- ${k.label}: ${k.display}`),
    "",
    "## Summary",
    d.summary.text,
    "",
    "## Landing pages pointing here",
    ...(d.landingPages.rows.length ? d.landingPages.rows.map((r) => `- ${r.landingPage.url} · ${r.funnelLabel ?? "Unclassified"} · ${r.adsTotal} ads`) : ["- None in this scope"]),
    "",
    "## Competitors",
    ...(d.advertisers.pages.length ? d.advertisers.pages.slice(0, 10).map((p) => `- ${p.label}: ${p.count} ads`) : ["- None in this scope"]),
    "",
    "## Creative mix",
    "### Hook styles",
    ...mixLines(d.creativeMix.hooks),
    "### Frameworks",
    ...mixLines(d.creativeMix.frameworks),
    "### Concepts",
    ...mixLines(d.creativeMix.concepts),
  ];
  return { kind: "text", filename: `${fileBase("offer", d.offer.domain)}.md`, mime: "text/markdown", content: md.join("\n") };
}

function landingPageText(id: string, ctx: DownloadCtx): DownloadFile | null {
  const { data, scope, now, baseAds } = resolveCtx(ctx);
  const d = landingPageDetail(id, baseAds, scope, { now, data });
  if (!d) return null;
  const c = d.capture;
  const lines = [
    c.title ?? c.url,
    "",
    `URL: ${c.url}`,
    `Final URL: ${c.finalUrl ?? "Not captured"}`,
    `HTTP status: ${c.httpStatus ?? "Not captured"}`,
    `Word count: ${c.wordCount ?? "Not captured"}`,
    `Captured: ${dateOnly(c.capturedAt)}`,
    `Funnel: ${d.funnel.label ?? "Unclassified"}`,
    `Offer: ${d.funnel.offerDomain ?? "Not traced"}`,
    `Redirect path: ${d.funnel.redirectPath.join(" → ")}`,
    `Ads landing here: ${d.basedOn}`,
    "",
    "PAGE TEXT",
    c.pageText ?? "Page text was not captured for this landing page.",
  ];
  return { kind: "text", filename: `${fileBase("landing-page", d.landingPage.domain)}-${id}.txt`, mime: "text/plain", content: lines.join("\n") };
}

/* ── public ─────────────────────────────────────────────────────────────── */

function extension(url: string, fallback: string): string {
  const m = /\.([a-z0-9]{2,4})(?:\?|$)/i.exec(url);
  return m ? m[1].toLowerCase() : fallback;
}

/** Every file for an item. Empty array when the item can't be found. */
export function buildDownloads(ref: SavedItemRef, ctx: DownloadCtx = {}): DownloadFile[] {
  const data = ctx.data ?? INDEX;
  switch (ref.type) {
    case "ad": {
      const ad = data.adById.get(ref.id);
      if (!ad) return [];
      const files: DownloadFile[] = [];
      const media = ad.videoUrl ?? ad.thumbnailUrl;
      if (media) files.push({ kind: "url", filename: `ad-${ad.externalId}.${extension(media, ad.videoUrl ? "mp4" : "jpg")}`, url: media });
      files.push({ kind: "text", filename: `ad-${ad.externalId}.txt`, mime: "text/plain", content: adText(ad, data) });
      return files;
    }
    case "landing-page": {
      const lp = data.landingPageById.get(ref.id);
      if (!lp) return [];
      const text = landingPageText(ref.id, ctx);
      const files: DownloadFile[] = [];
      if (lp.screenshotUrl) files.push({ kind: "url", filename: `${fileBase("landing-page", lp.domain)}-${lp.id}.jpg`, url: lp.screenshotUrl });
      if (text) files.push(text);
      return files;
    }
    case "domain":
    case "page": {
      const f = advertiserMarkdown(ref.type, ref.id, ctx);
      return f ? [f] : [];
    }
    case "offer": {
      const f = offerMarkdown(ref.id, ctx);
      return f ? [f] : [];
    }
    default: {
      if ((ELEMENT_TYPES as string[]).includes(ref.type)) {
        const f = elementMarkdown(ref.type as ElementType, ref.id, ctx);
        return f ? [f] : [];
      }
      return [];
    }
  }
}

/** The primary file: the .txt / .md (media is a second file, see buildDownloads). Null when not found. */
export function buildDownload(ref: SavedItemRef, ctx: DownloadCtx = {}): DownloadFile | null {
  const files = buildDownloads(ref, ctx);
  return files.find((f) => f.kind === "text") ?? files[0] ?? null;
}
