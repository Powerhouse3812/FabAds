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
 * Realistic placeholder clips — real Mixkit stock footage (skincare / beauty /
 * lifestyle categories), 360p. Direct `assets.mixkit.co` URLs: CORS-friendly,
 * token-free, no expiry → embed + autoplay reliably in a `<video>` (unlike
 * Facebook Ad Library clips, which are fbcdn token-gated/CORS-locked and would
 * fail to embed). Free under the Mixkit License (commercial use, no attribution
 * required) — fine as design-phase placeholders.
 *
 * ~16 distinct URLs → the browser caches them across all tiles. When the real
 * UGC-generation backend lands, swap this pool for real preview URLs; the
 * PreviewVideo component + every call site stay unchanged.
 */
export const MOCK_VIDEO_POOL: string[] = [
  "https://assets.mixkit.co/active_storage/video_items/100163/1721153027/100163-video-360.mp4",
  "https://assets.mixkit.co/active_storage/video_items/100607/1730159956/100607-video-360.mp4",
  "https://assets.mixkit.co/active_storage/video_items/100608/1730160112/100608-video-360.mp4",
  "https://assets.mixkit.co/active_storage/video_items/100610/1730160235/100610-video-360.mp4",
  "https://assets.mixkit.co/active_storage/video_items/100611/1730160284/100611-video-360.mp4",
  "https://assets.mixkit.co/active_storage/video_items/100626/1730161374/100626-video-360.mp4",
  "https://assets.mixkit.co/active_storage/video_items/100627/1730161415/100627-video-360.mp4",
  "https://assets.mixkit.co/videos/1164/1164-360.mp4",
  "https://assets.mixkit.co/videos/1192/1192-360.mp4",
  "https://assets.mixkit.co/videos/1196/1196-360.mp4",
  "https://assets.mixkit.co/videos/1198/1198-360.mp4",
  "https://assets.mixkit.co/videos/1203/1203-360.mp4",
  "https://assets.mixkit.co/videos/1232/1232-360.mp4",
  "https://assets.mixkit.co/videos/39764/39764-360.mp4",
  "https://assets.mixkit.co/videos/39874/39874-360.mp4",
  "https://assets.mixkit.co/videos/39877/39877-360.mp4",
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

/** Deterministic video URL for any seed string. */
export function videoForSeed(seed: string): string {
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
