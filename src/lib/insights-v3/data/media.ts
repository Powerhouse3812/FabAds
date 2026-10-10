/**
 * Media URL pools, copied from the old prototype's patterns (sample videos,
 * seeded placeholder photos, seeded avatars). Nothing here is fetched at build time.
 */

export const VIDEO_URLS = [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
];

export const VIDEO_ASPECTS = ["9/16", "4/5", "1/1", "9/16", "16/9"];
export const IMAGE_ASPECTS = ["1/1", "4/5", "2/3", "1/1", "16/9"];
export const CAROUSEL_ASPECTS = ["1/1", "4/5"];

const DIMS: Record<string, [number, number]> = {
  "9/16": [450, 800],
  "4/5": [600, 750],
  "1/1": [600, 600],
  "2/3": [600, 900],
  "16/9": [800, 450],
};

export function thumbnailUrl(seed: string, aspect: string): string {
  const [w, h] = DIMS[aspect] ?? [600, 600];
  return `https://picsum.photos/seed/iiv2-${seed}/${w}/${h}`;
}

export function avatarUrl(seed: string): string {
  return `https://i.pravatar.cc/150?u=iiv2-${seed}`;
}

export function logoUrl(seed: string): string {
  return `https://picsum.photos/seed/iiv2-logo-${seed}/96/96`;
}

export function screenshotUrl(seed: string): string {
  return `https://picsum.photos/seed/iiv2-lp-${seed}/600/900`;
}
