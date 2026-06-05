import { sampleOutputs } from "../../mocks/sample-outputs";

/**
 * studio-visuals — shared visual + video helpers for the Studio Alpha
 * "Selection & Preview" redesign (Maalik MOM 06-05).
 *
 * Design-phase MOCK: there is no real UGC-video generation yet, so the
 * autoplay-loop previews use a small pool of lightweight public sample MP4s
 * with a poster image pulled from our own sample-outputs (keeps brands /
 * thumbnails consistent with the rest of Genie 6). Everything is deterministic
 * (seeded by id) so a given angle / approach / model always shows the same
 * preview across renders + reloads.
 *
 * When the real generation pipeline lands, swap `videoForSeed` to resolve a
 * real preview URL and `posterForSeed` to the real thumbnail — the call sites
 * (angle tiles, approach cards, model cards) don't change.
 */

/**
 * Realistic placeholder clips — real Mixkit stock footage, 360p, BUNDLED LOCALLY
 * under `public/studio-previews/` and served SAME-ORIGIN (`/studio-previews/*.mp4`).
 *
 * Why local, NOT a CDN URL (verified on a real deploy + Maalik's Chrome):
 * ad/privacy blockers + some network policies silently STALL cross-origin
 * `<video>` media requests — every external clip, even Google's BigBuckBunny,
 * hung at readyState 0, while a plain `fetch` slipped through (blockers key on
 * the `media` request type, not `fetch`/XHR). The tile then falls back to its
 * (subtle) Ken-Burns poster and reads as "static". Same-origin first-party media
 * is not blocked, so bundling is the only reliable autoplay path. Clips are free
 * under the Mixkit License (commercial use, no attribution) — design placeholders.
 *
 * When the real UGC-generation backend lands, swap this pool (or the per-theme
 * buckets layered on top) for real preview URLs; PreviewVideo + every call site
 * stay unchanged.
 */
export const MOCK_VIDEO_POOL: string[] = [
  "/studio-previews/mk-1164.mp4",
  "/studio-previews/mk-1192.mp4",
  "/studio-previews/mk-1196.mp4",
  "/studio-previews/mk-1198.mp4",
  "/studio-previews/mk-1203.mp4",
  "/studio-previews/mk-1232.mp4",
  "/studio-previews/mk-39764.mp4",
  "/studio-previews/mk-39874.mp4",
  "/studio-previews/mk-39877.mp4",
];

/** FNV-1a string hash → stable non-negative int. Used for deterministic picks. */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * ON-THEME MAPPING (Maalik MOM 06-05 — "har tile on-theme, Higgsfield-style").
 *
 * Every preview tile is seeded as `<kind>:<id>` (angle:/concept:/model:/approach:).
 * We map each id → a semantic THEME, then pick a clip from that theme's bucket —
 * so a Testimonial angle shows a person-to-camera clip, an Unboxing sub-type shows
 * hands-on-a-box, a Product concept shows a product macro, etc. Deterministic
 * (seeded) so a given tile is stable across renders. Unknown ids (e.g. recent:/
 * output:) fall back to the full pool. Empty buckets fall back to `abstract`.
 */
export type Theme =
  | "talking-head"
  | "unboxing"
  | "tutorial"
  | "testimonial"
  | "lifestyle"
  | "product-closeup"
  | "hero-cinematic"
  | "abstract";

/** Clips bucketed by theme (filenames in public/studio-previews/). Each clip is
 *  real Mixkit stock footage chosen to match its theme — content verified. */
const CLIPS_BY_THEME: Record<Theme, string[]> = {
  "talking-head": [
    "/studio-previews/mk-42323.mp4", // influencer talking to camera
    "/studio-previews/mk-41289.mp4", // youtuber recording himself, studio
    "/studio-previews/mk-8784.mp4",  // woman recording a social video in a cafe
    "/studio-previews/mk-1232.mp4",  // intimate portrait, warm light
  ],
  "unboxing": [
    "/studio-previews/mk-382.mp4",   // hand opening a lipstick (product reveal)
    "/studio-previews/mk-39907.mp4", // taking makeup items out of a bag
    "/studio-previews/mk-42606.mp4", // opening an envelope — reveal motion
  ],
  "tutorial": [
    "/studio-previews/mk-50417.mp4", // how-to: using a skincare product, ring light
    "/studio-previews/mk-384.mp4",   // applying mascara, close-up demo
    "/studio-previews/mk-9158.mp4",  // applying skincare cream to face
  ],
  "testimonial": [
    "/studio-previews/mk-5721.mp4",  // beauty vlogger answering subscribers
    "/studio-previews/mk-49141.mp4", // influencer recording a product video
    "/studio-previews/mk-34486.mp4", // speaker talking on camera (interview feel)
  ],
  "lifestyle": [
    "/studio-previews/mk-50406.mp4", // skincare routine being filmed at home
    "/studio-previews/mk-4948.mp4",  // woman reading — calm daily moment
    "/studio-previews/mk-39764.mp4", // mother + child outdoors
  ],
  "product-closeup": [
    "/studio-previews/mk-20766.mp4", // pressing a perfume bottle (hero macro)
    "/studio-previews/mk-21694.mp4", // spraying a perfume sample
    "/studio-previews/mk-40549.mp4", // cosmetics arranged on a table (flat-lay)
  ],
  "hero-cinematic": [
    "/studio-previews/mk-805.mp4",   // model in a dress — fashion hero
    "/studio-previews/mk-39874.mp4", // beauty / glitter editorial
    "/studio-previews/mk-39877.mp4", // beauty close-up, blue tones
  ],
  "abstract": [
    "/studio-previews/mk-1164.mp4",  // ocean surface
    "/studio-previews/mk-1192.mp4",  // peach + blue paint swirl
    "/studio-previews/mk-1196.mp4",  // teal liquid
    "/studio-previews/mk-1198.mp4",  // warm gradient
    "/studio-previews/mk-1203.mp4",  // lavender gradient
  ],
};

/**
 * id → theme. Keys cover every Studio Alpha angle / concept / approach-mode /
 * approach-sub-type / model id. (Duplicate ids across dimensions — e.g.
 * `unboxing` as both angle and sub-type — resolve to the same theme.)
 */
const THEME_BY_ID: Record<string, Theme> = {
  // Angles (20)
  hero: "hero-cinematic", lifestyle: "lifestyle", "social-proof": "testimonial",
  urgency: "abstract", comparison: "testimonial", "ugc-style": "talking-head",
  unboxing: "unboxing", infographic: "abstract", testimonial: "testimonial",
  "before-after": "testimonial", "problem-solution": "tutorial",
  "feature-highlight": "product-closeup", "benefit-led": "lifestyle", fomo: "abstract",
  scarcity: "abstract", premium: "product-closeup", "value-prop": "abstract",
  story: "hero-cinematic", demo: "tutorial", educational: "tutorial",
  // Concepts (12)
  "c-hero-pack": "product-closeup", "c-detail-macro": "product-closeup",
  "c-bundle-stack": "product-closeup", "c-founder-note": "talking-head",
  "c-before-after": "testimonial", "c-heritage": "hero-cinematic",
  "c-morning-ritual": "lifestyle", "c-fest-scene": "lifestyle",
  "c-ugc-creator": "talking-head", "c-flash-sale": "abstract", "c-bogo": "abstract",
  "c-launch-tease": "hero-cinematic",
  // Approach modes (7)
  scratch: "abstract", "create-variations": "product-closeup", "ugc-video": "talking-head",
  "image-to-video": "product-closeup", broll: "lifestyle", "bg-remover": "product-closeup",
  resize: "abstract",
  // Approach sub-types (the ones not already keyed above)
  "talking-head": "talking-head", tutorial: "tutorial", reaction: "talking-head",
  "day-in-life": "lifestyle", "whole-ad": "hero-cinematic", "media-only": "lifestyle",
  "copy-only": "product-closeup", subtle: "product-closeup", "full-ai": "hero-cinematic",
  // Models (5)
  "genie-1.0": "abstract", "genie-2.0-pro": "hero-cinematic", "genie-flash": "abstract",
  "genie-video": "hero-cinematic", "genie-labs": "abstract",
};

/** Pick a clip from a theme's bucket (deterministic); fall back to abstract, then pool. */
function clipForTheme(theme: Theme, seed: string): string {
  const bucket = CLIPS_BY_THEME[theme]?.length
    ? CLIPS_BY_THEME[theme]
    : CLIPS_BY_THEME.abstract;
  const usable = bucket.length ? bucket : MOCK_VIDEO_POOL;
  return usable[hashSeed(seed) % usable.length];
}

/**
 * Deterministic video URL for any seed string. Routes `<kind>:<id>` seeds through
 * the on-theme buckets; unknown ids fall back to the full pool.
 */
export function videoForSeed(seed: string): string {
  const id = seed.includes(":") ? seed.slice(seed.indexOf(":") + 1) : seed;
  const theme = THEME_BY_ID[id];
  if (theme) return clipForTheme(theme, seed);
  return MOCK_VIDEO_POOL[hashSeed(seed) % MOCK_VIDEO_POOL.length];
}

/** Sample-output thumbnails (those that actually have an image). */
const POSTER_POOL: string[] = sampleOutputs
  .map((s) => s.thumbnail)
  .filter((t): t is string => typeof t === "string" && t.length > 0);

/** Deterministic poster (thumbnail) image for any seed string. */
export function posterForSeed(seed: string): string | undefined {
  if (POSTER_POOL.length === 0) return undefined;
  return POSTER_POOL[hashSeed(seed) % POSTER_POOL.length];
}

export interface StudioVisual {
  /** Poster/thumbnail image (shown at rest + as <video poster>). */
  poster: string | undefined;
  /** Looping preview video URL (autoplay muted loop). */
  video: string;
}

/** Visual for an angle tile (seeded by `angle:<id>`). */
export function getAngleVisual(angleId: string): StudioVisual {
  const seed = `angle:${angleId}`;
  return { poster: posterForSeed(seed), video: videoForSeed(seed) };
}

/** Visual for an approach / sub-type card (seeded by `approach:<id>`). */
export function getApproachVisual(approachId: string): StudioVisual {
  const seed = `approach:${approachId}`;
  return { poster: posterForSeed(seed), video: videoForSeed(seed) };
}

/** Visual for a model card (seeded by `model:<id>`). */
export function getModelVisual(modelId: string): StudioVisual {
  const seed = `model:${modelId}`;
  return { poster: posterForSeed(seed), video: videoForSeed(seed) };
}
