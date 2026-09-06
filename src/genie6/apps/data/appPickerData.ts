/**
 * Other Apps — picker contents (Genie 2.0 §8).
 *
 * §8's override rule is "second inputs always come from a picker" — Video,
 * Audio and Document tabs need something to actually list. Rather than
 * invent a parallel dataset, these three arrays are DERIVED from the real
 * mock pools that already exist:
 *  - `PICKER_VIDEOS` mixes Video Sage's 8 real `demo-video-*` titles
 *    (`src/lib/video-sage-dummy-data.ts`) with a brand-spread sample of the
 *    real video assets in `LIBRARY_MEDIA`
 *    (`src/mocks/shared/library-items.ts`) — real filenames like
 *    `mamaearth-hair-growth-day21-04.mp4`, not invented ones.
 *  - `PICKER_AUDIO` has no repo source to derive from (nothing in this repo
 *    ships an audio-only mock), so these are authored fresh — but grounded
 *    in the same brand universe as the rest of the demo (Mamaearth, boAt,
 *    Sleepyhead, Plum, mCaffeine, Noise, The Derma Co, Minimalist) so a
 *    Speech Cleanup run still feels like it belongs to the same workspace.
 *  - `PICKER_DOCS` is likewise authored fresh (no PPT/PDF mock exists yet),
 *    seeded from the two examples the brief calls out by name plus four
 *    more in the same brand universe.
 *
 * Products, avatars and voices are NOT duplicated here — Product Placement
 * and every avatar-picker read `src/mocks/shared/products.ts`, `avatars.ts`
 * and `voices.ts` directly, per the brief. This file only covers the three
 * upload-style pickers (video / audio / document) that appCost.ts and
 * AppRunner need a options list for.
 *
 * Every duration below is a FIXED, deterministic number, not a re-roll of
 * `getDummyVideos()`'s own `28 + random(20)` — that randomiser suits Video
 * Sage's own demo (a fresh number each render is fine there) but a picker
 * list has to stay stable across renders so the live credit-cost preview in
 * appCost.ts doesn't recompute a different total every time the component
 * re-renders. None of the numbers below are round.
 */
import { getDummyVideos } from "@/lib/video-sage-dummy-data";
import { LIBRARY_MEDIA, type LibraryAsset } from "@/mocks/shared/library-items";

export interface PickerItem {
  id: string;
  title: string;
  /** Second line in the picker row — duration/pages plus source, e.g. "2:14 · 1080p · Library". */
  meta: string;
  thumbnail?: string;
  durationSec?: number;
  pageCount?: number;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
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
  };
});

const libraryVideoItems: PickerItem[] = brandSpread(
  LIBRARY_MEDIA.filter((m) => m.file_type === "video"),
  1,
  3,
).map((m) => {
  const dur = pseudoDuration(m.id, 11, 94);
  return {
    id: m.id,
    title: m.file_name,
    meta: `${formatDuration(dur)} · 1080p · Library`,
    thumbnail: m.url,
    durationSec: dur,
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
).map((m) => ({
  id: m.id,
  title: m.file_name,
  meta: `${m.width ?? 1080}×${m.height ?? 1350} · Library`,
  thumbnail: m.url,
}));

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
];

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
];
