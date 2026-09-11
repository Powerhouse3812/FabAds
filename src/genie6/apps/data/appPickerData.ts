/**
 * Other Apps — picker contents (Genie 2.0 §8).
 *
 * §8's override rule is "second inputs always come from a picker" — every
 * PickerSource tab needs something to actually list. Rather than invent a
 * parallel dataset, every pool below is DERIVED from the real mock pools
 * that already exist, the same way `flows/data/flowSources.ts` builds its
 * catalogue: never hand-transcribe what a real module already generates.
 *
 * Owner ruling 2026-09-09 — the media sources for every app are Upload,
 * Library, Report, Industry Insights, Folder, Genie — and Library/Genie are
 * now two DIFFERENT pools (see PickerSource's own doc comment in
 * appTypes.ts). This file draws the line as follows:
 *
 *  - `library` (brought-in media) = Video Sage's 8 real `demo-video-*`
 *    titles (`src/lib/video-sage-dummy-data.ts`) + a brand-spread sample of
 *    LIBRARY_MEDIA (`src/mocks/shared/library-items.ts`). Video Sage rows
 *    are ANALYSED UPLOADS, not generations — a user drops footage in, Video
 *    Sage breaks it down. Nothing about that footage was made by Genie, so
 *    it stays in `library`, exactly where it already was.
 *  - `genie` (Genie's own past output) is NEW — built from
 *    `genieRunStore.ts`'s live batches, joined back to `sample-outputs.ts`
 *    for the rich creative fields (headline, brand, product, quality
 *    score). Only `"done"` items with a real `outputId` are eligible — a
 *    still-running or failed item has nothing to hand another app. READ-ONLY
 *    against `sampleOutputs`: never fork or mutate it (15+ importers hold
 *    its exact reference).
 *  - `report` reads `getDataset()` (`src/lib/reports-dummy-data.ts`) the
 *    same filtered-not-indexed way flowSources.ts does — Reports runs its
 *    own disjoint 5-account universe, never crossed with Launch's.
 *  - `industry-insights` reads `DUMMY_ADS` (`src/lib/insights-dummy-data.ts`,
 *    800 rows) — these are COMPETITOR ads, so every row is labelled as one
 *    in its `meta`/`details`, never presented as the user's own creative.
 *  - `folder` has no real backing data: `flows/data/flowRegistry.ts`'s
 *    `folders` module is `state: "coming-soon"` with `actions: []` — there
 *    is nothing to list honestly. `PICKER_FOLDERS` stays an empty array on
 *    purpose; `MediaPickerField` renders a composed "coming soon" state for
 *    this tab instead of inventing folders that don't exist anywhere else
 *    in the product.
 *  - `PICKER_AUDIO` / `PICKER_DOCS` are unchanged from before — no audio or
 *    PPT/PDF mock exists elsewhere in the repo, so they stay hand-authored,
 *    grounded in the same brand universe as everything else here.
 *
 * Every item also carries an optional `details` list — pre-formatted
 * label/value facts for the selected-media overview (§ owner ask: "show
 * size, current language, name, format, other basic details, source etc").
 * `details` is built ONLY from fields the source data genuinely has —
 * nothing here is a fabricated file size or an invented language. See each
 * pool's builder below for exactly which facts exist per source.
 */
import { getDummyVideos } from "@/lib/video-sage-dummy-data";
import { LIBRARY_MEDIA, type LibraryAsset } from "@/mocks/shared/library-items";
import { getDataset, type ReportEntity } from "@/lib/reports-dummy-data";
import { DUMMY_ADS } from "@/lib/insights-dummy-data";
import type { AppField } from "../appTypes";
import type { RunBatch, RunOrigin } from "../../lib/genieRunTypes";
import { sampleOutputs } from "../../mocks/sample-outputs";
// Read-only import of an out-of-scope file's exported helper (reuse, not a
// rebuild of the same "Xm ago" formatting logic) — `import type` is the only
// thing fieldHelpers.ts takes back from this file, so there is no runtime
// circular dependency (type-only imports are erased at build time).
import { formatRelativeTime } from "../lib/fieldHelpers";
// Read-only lookups into two other agents' registries, purely for labelling
// where a Genie output came from ("Made via Other Apps · Face Swap"). Do not
// edit either file — see this task's OUT OF SCOPE list.
import { getApp } from "./appRegistry";
import { getFlowModule } from "../../flows/data/flowRegistry";

export interface PickerItem {
  id: string;
  title: string;
  /** Second line in the picker row — duration/pages plus source, e.g. "2:14 · 1080p · Library". */
  meta: string;
  thumbnail?: string;
  durationSec?: number;
  pageCount?: number;
  /**
   * Pre-formatted label/value facts for the selected-media overview. Only
   * ever populated with fields the underlying source genuinely carries —
   * see the file header. Absent (not empty-string-filled) fields are simply
   * omitted from this array rather than padded with a placeholder.
   */
  details?: { label: string; value: string }[];
}

/** The `media` a `media-picker` field declares — re-exported so the field
 *  renderer and the pool builders below share one definition. */
export type PickerMedia = Extract<AppField, { kind: "media-picker" }>["media"];

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** "8.2 MB" from a byte count — used only where the source data carries a
 *  real `file_size` (LIBRARY_MEDIA does; nothing else here does). */
function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

/** Upper-cased file extension, e.g. "mamaearth-vo.wav" → "WAV". Genuine data
 *  (it's literally in the filename), not an inferred guess. */
function extFormat(filename: string): string | undefined {
  const m = filename.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toUpperCase() : undefined;
}

/**
 * Deterministic per-id "randomness" for the LIBRARY_MEDIA videos, which
 * carry no duration field of their own (buildMedia() never set one — it's
 * an image/video asset library, not a cut list). A hash of the id keeps the
 * spread looking natural while staying identical on every load, unlike
 * Math.random().
 */
function pseudoDuration(id: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 997;
  return min + (hash % (max - min));
}

/** One item per brand (then a few orphans) so the sample reads as a real spread, not one brand's folder. */
function brandSpread(items: LibraryAsset[], perBrand: number, orphanCap: number): LibraryAsset[] {
  const seen = new Map<string, number>();
  const branded: LibraryAsset[] = [];
  const orphan: LibraryAsset[] = [];
  for (const item of items) {
    if (item.brand_id) {
      const n = seen.get(item.brand_id) ?? 0;
      if (n < perBrand) {
        branded.push(item);
        seen.set(item.brand_id, n + 1);
      }
    } else if (orphan.length < orphanCap) {
      orphan.push(item);
    }
  }
  return [...branded, ...orphan];
}

const LIBRARY_SOURCE_LABEL: Record<LibraryAsset["source"], string> = {
  uploaded: "Uploaded",
  generated: "Generated by Genie",
  "pinned-insights": "Pinned from Industry Insights",
  reference: "Brand reference",
  imported: "Imported",
};

// ─────────────────────────────────────────────────────────────────────────
// `library` pool — brought-in media. Video Sage (analysed uploads) + a
// brand-spread sample of LIBRARY_MEDIA. See file header for why Video Sage
// stays here rather than moving to `genie`.
// ─────────────────────────────────────────────────────────────────────────

// Video Sage's 8 real videos — fixed durations pinned per id (see file header).
const VIDEO_SAGE_DURATIONS: Record<string, number> = {
  "demo-video-1": 34,
  "demo-video-2": 52,
  "demo-video-3": 47,
  "demo-video-4": 61,
  "demo-video-5": 38,
  "demo-video-6": 73,
  "demo-video-7": 44,
  "demo-video-8": 29,
};

const videoSageItems: PickerItem[] = getDummyVideos().map((v) => {
  const dur = VIDEO_SAGE_DURATIONS[v.id] ?? 40;
  return {
    id: v.id,
    title: v.title,
    meta: `${formatDuration(dur)} · ${v.language} · Video Sage`,
    thumbnail: v.thumbnail_url,
    durationSec: dur,
    details: [
      { label: "Language", value: v.language },
      { label: "Origin", value: "Video Sage upload" },
      { label: "Analysis status", value: v.status },
    ],
  };
});

const libraryVideoItems: PickerItem[] = brandSpread(
  LIBRARY_MEDIA.filter((m) => m.file_type === "video"),
  1,
  3,
).map((m) => {
  const dur = pseudoDuration(m.id, 11, 94);
  const details: { label: string; value: string }[] = [
    { label: "Resolution", value: `${m.width ?? 1080}×${m.height ?? 1920}` },
    { label: "Origin", value: LIBRARY_SOURCE_LABEL[m.source] },
  ];
  if (m.file_size != null) details.push({ label: "File size", value: formatBytes(m.file_size) });
  return {
    id: m.id,
    title: m.file_name,
    meta: `${formatDuration(dur)} · 1080p · Library`,
    thumbnail: m.url,
    durationSec: dur,
    details,
  };
});

/** >=12 — Video Sage's 8 real titles plus a brand-spread sample from LIBRARY_MEDIA. */
export const PICKER_VIDEOS: PickerItem[] = [...videoSageItems, ...libraryVideoItems];

/**
 * Still images from the Library.
 *
 * Exists because PPT/PDF to Video takes "additional images" alongside the deck
 * (§8's input list), and §8's overriding rule is that a second input ALWAYS
 * comes from a picker, never a second upload box. Without a pool the Library
 * tab on that field rendered "Nothing matches" forever — technically not a
 * crash, but it reads as a broken picker, which is worse than an honest empty
 * state because the user has no way to tell the difference.
 *
 * Derived from the same real LIBRARY_MEDIA filenames the video pool uses, so
 * the two tabs are visibly the same library.
 */
const libraryImageItems: PickerItem[] = brandSpread(
  LIBRARY_MEDIA.filter((m) => m.file_type !== "video"),
  1,
  3,
).map((m) => {
  const details: { label: string; value: string }[] = [
    { label: "Resolution", value: `${m.width ?? 1080}×${m.height ?? 1350}` },
    { label: "Origin", value: LIBRARY_SOURCE_LABEL[m.source] },
  ];
  if (m.file_size != null) details.push({ label: "File size", value: formatBytes(m.file_size) });
  return {
    id: m.id,
    title: m.file_name,
    meta: `${m.width ?? 1080}×${m.height ?? 1350} · Library`,
    thumbnail: m.url,
    details,
  };
});

export const PICKER_IMAGES: PickerItem[] = libraryImageItems;

/**
 * >=8. No audio mock exists elsewhere in the repo, so these are authored
 * fresh — a mix of short voiceover cuts (already fairly clean, quick to
 * process) and long raw recordings (founder interviews, a podcast episode,
 * a webinar) that read as genuinely needing Speech Cleanup's noise/level/
 * pacing pass, not just a re-export of a finished VO track.
 */
export const PICKER_AUDIO: PickerItem[] = [
  { id: "aud-mamaearth-founder-vo", title: "mamaearth-founder-story-vo-raw.wav", meta: "1:47 · WAV · Library", durationSec: 107 },
  { id: "aud-boat-airdopes-narration", title: "boat-airdopes-161-launch-narration.mp3", meta: "0:52 · MP3 · Library", durationSec: 52 },
  { id: "aud-sleepyhead-testimonial-raw", title: "sleepyhead-100-night-trial-testimonial-raw.wav", meta: "2:23 · WAV · Uploaded", durationSec: 143 },
  { id: "aud-plum-vc-serum-vo", title: "plum-vitamin-c-serum-vo-raw.m4a", meta: "1:12 · M4A · Uploaded", durationSec: 72 },
  { id: "aud-mcaffeine-founder-interview", title: "mcaffeine-founder-interview-raw.wav", meta: "6:38 · WAV · Uploaded", durationSec: 398 },
  { id: "aud-noise-launch-script-vo", title: "noise-colorfit-pro5-launch-script-vo.mp3", meta: "0:41 · MP3 · Library", durationSec: 41 },
  { id: "aud-dermaco-dermatologist-qna", title: "the-derma-co-dermatologist-qna-raw.wav", meta: "9:14 · WAV · Uploaded", durationSec: 554 },
  { id: "aud-minimalist-niacinamide-vo", title: "minimalist-niacinamide-explainer-vo.m4a", meta: "1:29 · M4A · Library", durationSec: 89 },
  { id: "aud-podcast-ep14-raw-mix", title: "podcast-ep14-raw-mix.wav", meta: "23:07 · WAV · Uploaded", durationSec: 1387 },
  { id: "aud-webinar-qna-session", title: "webinar-qna-session-audio.m4a", meta: "17:52 · M4A · Uploaded", durationSec: 1072 },
].map((a) => ({
  ...a,
  details: [
    { label: "Format", value: extFormat(a.title) ?? "—" },
    { label: "Origin", value: a.meta.endsWith("Library") ? "Library" : "Uploaded" },
  ],
}));

/**
 * >=6. `Mamaearth Q3 Brand Deck.pptx` (18 slides) and `boAt Airdopes launch
 * one-pager.pdf` (4 slides) are the two named directly in the brief; the
 * other four round out the same brand universe with the same PPTX/PPT/PDF
 * mix PPT/PDF to Video's accept list expects.
 */
export const PICKER_DOCS: PickerItem[] = [
  { id: "doc-mamaearth-q3-brand-deck", title: "Mamaearth Q3 Brand Deck.pptx", meta: "18 slides · PPTX · Library", pageCount: 18, thumbnail: "https://picsum.photos/seed/doc-mamaearth-q3/400/300" },
  { id: "doc-boat-airdopes-onepager", title: "boAt Airdopes launch one-pager.pdf", meta: "4 slides · PDF · Uploaded", pageCount: 4, thumbnail: "https://picsum.photos/seed/doc-boat-airdopes/400/300" },
  { id: "doc-sleepyhead-catalogue", title: "Sleepyhead Product Catalogue.pptx", meta: "23 slides · PPTX · Library", pageCount: 23, thumbnail: "https://picsum.photos/seed/doc-sleepyhead-cat/400/300" },
  { id: "doc-plum-ingredient-deck", title: "Plum Goodness Ingredient Deck.pdf", meta: "9 slides · PDF · Uploaded", pageCount: 9, thumbnail: "https://picsum.photos/seed/doc-plum-ingredient/400/300" },
  { id: "doc-noise-launch-brief", title: "Noise ColorFit Launch Brief.ppt", meta: "13 slides · PPT · Library", pageCount: 13, thumbnail: "https://picsum.photos/seed/doc-noise-launch/400/300" },
  { id: "doc-boldfit-q2-review", title: "Boldfit Q2 Performance Review.pdf", meta: "7 slides · PDF · Uploaded", pageCount: 7, thumbnail: "https://picsum.photos/seed/doc-boldfit-q2/400/300" },
].map((d) => ({
  ...d,
  details: [
    { label: "Format", value: extFormat(d.title) ?? "—" },
    { label: "Pages", value: `${d.pageCount} slides` },
    { label: "Origin", value: d.meta.endsWith("Library") ? "Library" : "Uploaded" },
  ],
}));

// ─────────────────────────────────────────────────────────────────────────
// `genie` pool — Genie's OWN past output. Built from the live run store
// (genieRunStore.ts) joined back to sampleOutputs for the rich creative
// fields. Only "done" items with a real outputId are eligible: a running,
// failed or cancelled item has nothing another app can pick up.
// READ-ONLY against sampleOutputs — never fork/mutate it (file's own header).
// ─────────────────────────────────────────────────────────────────────────

const outputById = new Map(sampleOutputs.map((o) => [o.id, o] as const));

/** Where a generation came from, for the overview's "Made via" fact. Reads
 *  the other two agents' registries (getApp / getFlowModule) purely to
 *  resolve a human label — never mutated, never re-exported. */
function originLabel(origin: RunOrigin): string {
  switch (origin.kind) {
    case "studio":
      return "Studio";
    case "app":
      return `Other Apps · ${getApp(origin.app)?.name ?? origin.app}`;
    case "flow":
      return `Other Flows · ${getFlowModule(origin.module)?.label ?? origin.module}`;
    case "upload":
      return "Direct upload";
    case "imported":
      return `Imported · ${getFlowModule(origin.module)?.label ?? origin.module}`;
    default:
      return "Genie";
  }
}

/** Genie only ever produces image/video/text-only creative (OutputData's
 *  own MediaType) — there is no honest audio or document pool here, so
 *  those media kinds correctly return []. Capped at 40 (newest batches
 *  first — `useBatches()` already sorts that way) so a long-lived demo
 *  session doesn't dump its entire history into one tab. */
export function genieItemsFor(batches: RunBatch[], media: PickerMedia): PickerItem[] {
  if (media !== "video" && media !== "image") return [];
  const wantVideo = media === "video";
  const items: PickerItem[] = [];
  for (const batch of batches) {
    for (const item of batch.items) {
      if (item.status !== "done" || !item.outputId) continue;
      const out = outputById.get(item.outputId);
      if (!out || out.mediaType === "text-only") continue;
      if ((out.mediaType === "video") !== wantVideo) continue;

      // Format comes from THIS output's own mediaType, never
      // `batch.config.format` — that is derived from the batch's FIRST output
      // (genieRunStore.ts's `configFor()` reads `chunk[0]`), so a mixed-media
      // batch labelled every sibling with the wrong word: a video row in the
      // video picker printed "Image" and vice versa, in the row meta AND in
      // the selected-media overview's Format fact. The item is already
      // filtered to the requested media kind two lines above, so this is the
      // one honest value.
      const format = wantVideo ? "Video" : "Image";
      const brandName = batch.config?.brandName ?? out.brand?.name;
      const productName = batch.config?.productName ?? out.product?.name;
      const generated = formatRelativeTime(batch.createdAt);

      const details: { label: string; value: string }[] = [{ label: "Format", value: format }];
      if (batch.config?.language) details.push({ label: "Language", value: batch.config.language });
      if (batch.config?.aspectRatio) details.push({ label: "Aspect ratio", value: batch.config.aspectRatio });
      if (brandName) details.push({ label: "Brand", value: brandName });
      if (productName) details.push({ label: "Product", value: productName });
      if (out.qualityScore !== undefined) details.push({ label: "Quality score", value: String(out.qualityScore) });
      details.push({ label: "Made via", value: originLabel(batch.origin) });
      details.push({ label: "Generated", value: generated });
      details.push({ label: "Batch", value: batch.batchId });
      details.push({ label: "Credits charged", value: String(item.credits) });

      items.push({
        id: item.id,
        title: item.title || out.headline || `${brandName ?? "Untitled"} output`,
        meta: `${format} · ${generated} · Genie`,
        thumbnail: item.thumbnail ?? out.thumbnail,
        details,
      });
      if (items.length >= 40) return items;
    }
  }
  return items;
}

// ─────────────────────────────────────────────────────────────────────────
// `report` pool — getDataset() (src/lib/reports-dummy-data.ts). Filtered,
// not indexed, same reasoning as flowSources.ts's reportsRefs(): the
// generator is a private seeded-random pool, so real ad-level entities are
// picked by SHAPE (has creative, video vs image) rather than guessed
// positions — deterministic (seed fixed at 0), always real rows.
// ─────────────────────────────────────────────────────────────────────────

const REPORT_ACCOUNT_NAMES = ["Acme Corp US", "Acme Corp EU", "BrandX Global", "ShopMax Direct", "TrendWave Media"];

function reportAccountOf(id: string): number {
  return Number(id.split("_")[1]);
}

type ReportAdEntity = ReportEntity & { creative: NonNullable<ReportEntity["creative"]> };

function buildReportPools(): { video: PickerItem[]; image: PickerItem[] } {
  const allAds = getDataset(0).filter((e): e is ReportAdEntity => e.level === "ad" && !!e.creative);
  const video: PickerItem[] = [];
  const image: PickerItem[] = [];
  const perAccount = new Map<number, number>();
  const CAP = 12;
  for (const ad of allAds) {
    if (video.length >= CAP && image.length >= CAP) break;
    const acct = reportAccountOf(ad.id);
    const seen = perAccount.get(acct) ?? 0;
    // Cap per account so the pool reads as a spread across Reports' 5
    // accounts, not one account's whole ledger.
    if (seen >= 3) continue;
    const isVideo = ad.creative.type === "video";
    const bucket = isVideo ? video : image;
    if (bucket.length >= CAP) continue;
    perAccount.set(acct, seen + 1);
    const accountName = REPORT_ACCOUNT_NAMES[acct] ?? "Reports account";
    bucket.push({
      id: ad.id,
      title: ad.creative.headline || ad.name,
      meta: `${ad.creative.adType} · ${ad.platform} · ${accountName}`,
      thumbnail: ad.creative.thumbnailUrl,
      details: [
        { label: "Format", value: isVideo ? "Video" : "Image" },
        { label: "Ad type", value: ad.creative.adType },
        { label: "Platform", value: ad.platform },
        { label: "Account", value: accountName },
        { label: "Country", value: ad.country },
        { label: "Status", value: ad.status },
        { label: "ROAS", value: `${ad.metrics.roas.toFixed(2)}×` },
        { label: "Spend", value: `$${ad.metrics.spend.toLocaleString()}` },
      ],
    });
  }
  return { video, image };
}

const REPORT_POOLS = buildReportPools();

/** Reports only tracks image/video ad creative — audio/document/product
 *  correctly return []. */
export function reportItemsFor(media: PickerMedia): PickerItem[] {
  if (media === "video") return REPORT_POOLS.video;
  if (media === "image") return REPORT_POOLS.image;
  return [];
}

// ─────────────────────────────────────────────────────────────────────────
// `industry-insights` pool — DUMMY_ADS (src/lib/insights-dummy-data.ts),
// 800 rows. These are COMPETITOR ads — every item's `details` says so
// explicitly, which is the labelling the task calls for; it does not change
// whether the media is pickable.
// ─────────────────────────────────────────────────────────────────────────

function buildInsightsPools(): { video: PickerItem[]; image: PickerItem[] } {
  const video: PickerItem[] = [];
  const image: PickerItem[] = [];
  const perBrand = new Map<string, number>();
  const CAP = 12;
  for (const ad of DUMMY_ADS) {
    if (video.length >= CAP && image.length >= CAP) break;
    const seen = perBrand.get(ad.brand) ?? 0;
    if (seen >= 2) continue; // spread across brands, not one brand's whole feed
    const isVideo = ad.mediaType === "video";
    const bucket = isVideo ? video : image;
    if (bucket.length >= CAP) continue;
    perBrand.set(ad.brand, seen + 1);
    const details: { label: string; value: string }[] = [
      { label: "Source", value: "Competitor ad — Industry Insights" },
      { label: "Brand", value: ad.brand },
      { label: "Format", value: isVideo ? "Video" : "Image" },
      { label: "Platform", value: ad.platform },
      { label: "Ad type", value: ad.adType },
      { label: "Active", value: ad.activeDuration },
      { label: "Spend", value: ad.spend },
    ];
    if (ad.languages[0]) details.push({ label: "Language", value: ad.languages[0] });
    bucket.push({
      id: ad.id,
      title: ad.headline || ad.primaryText,
      meta: `Competitor · ${ad.brand} · ${ad.spend} spent`,
      thumbnail: ad.thumbUrl || ad.mediaUrl,
      details,
    });
  }
  return { video, image };
}

const INSIGHTS_POOLS = buildInsightsPools();

/** Industry Insights only tracks image/video competitor creative —
 *  audio/document/product correctly return []. */
export function insightsItemsFor(media: PickerMedia): PickerItem[] {
  if (media === "video") return INSIGHTS_POOLS.video;
  if (media === "image") return INSIGHTS_POOLS.image;
  return [];
}

// ─────────────────────────────────────────────────────────────────────────
// `folder` pool — deliberately empty. flowRegistry.ts's `folders` module is
// `state: "coming-soon"` with `actions: []`; there is no real folder-level
// data anywhere in the product to list here. MediaPickerField renders a
// composed "coming soon" state for this tab instead of inventing folders.
// ─────────────────────────────────────────────────────────────────────────

export const PICKER_FOLDERS: PickerItem[] = [];
