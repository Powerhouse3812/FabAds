/**
 * Deterministic pseudo-random helpers for the Creative Report data generator.
 *
 * Repo rule: NO Math.random in the mock/data layer. Every number is derived
 * from a stable seed so the dataset is byte-identical across reloads (audits,
 * screenshots, and shareable URLs all depend on this). Mirrors the LCG +
 * FNV-1a approach already used in src/lib/reports-dummy-data.ts.
 */

/** Lehmer / MINSTD linear-congruential generator → uniform [0, 1). */
export function seededRandom(seed: number): () => number {
  // Keep the state a positive 31-bit integer.
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** FNV-1a string hash → positive 31-bit int, usable as an LCG seed. */
export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 2147483646 + 1;
}

/** A stable RNG keyed off any string id. */
export function rngFor(id: string): () => number {
  return seededRandom(hashString(id));
}

export function pick<T>(arr: readonly T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

/** Integer in [min, max] inclusive. */
export function randInt(rand: () => number, min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}

/** Float in [min, max). */
export function randFloat(rand: () => number, min: number, max: number): number {
  return min + rand() * (max - min);
}

/** Weighted pick — weights need not sum to 1. */
export function weightedPick<T>(
  items: readonly { value: T; weight: number }[],
  rand: () => number,
): T {
  const total = items.reduce((sum, it) => sum + it.weight, 0);
  let r = rand() * total;
  for (const it of items) {
    r -= it.weight;
    if (r <= 0) return it.value;
  }
  return items[items.length - 1].value;
}

/**
 * Approx. standard-normal sample via the mean of 6 uniforms (Bates), scaled to
 * unit-ish variance. Good enough for plausible metric jitter, fully seeded.
 * Returns a value roughly in [-1, 1] most of the time.
 */
export function gaussish(rand: () => number): number {
  let sum = 0;
  for (let i = 0; i < 6; i++) sum += rand();
  return (sum / 6 - 0.5) * 2;
}

/** Deterministic Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(arr: readonly T[], rand: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Round to n decimal places. */
export function round(value: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}
