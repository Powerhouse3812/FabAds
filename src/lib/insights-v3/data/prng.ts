/**
 * Seeded PRNG + helpers. Same seed → same universe, every time.
 * mulberry32: tiny, fast, good enough for dummy data.
 */

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Derive an independent stream from a parent seed + label (stable across code changes elsewhere). */
export function childRng(seed: number, label: string): Rng {
  let h = seed ^ 0x9e3779b9;
  for (let i = 0; i < label.length; i++) {
    h = Math.imul(h ^ label.charCodeAt(i), 0x85ebca6b);
    h ^= h >>> 13;
  }
  return mulberry32(h >>> 0);
}

export function int(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function chance(rng: Rng, p: number): boolean {
  return rng() < p;
}

export function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function weighted<T>(rng: Rng, items: readonly T[], weights: readonly number[]): T {
  let total = 0;
  for (const w of weights) total += w;
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r < 0) return items[i];
  }
  return items[items.length - 1];
}

/** Pick from a record of { value: weight }. */
export function weightedKey<K extends string>(rng: Rng, table: Partial<Record<K, number>>): K {
  const keys = Object.keys(table) as K[];
  return weighted(rng, keys, keys.map((k) => table[k] ?? 0));
}

export function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

export function sample<T>(rng: Rng, arr: readonly T[], n: number): T[] {
  return shuffle(rng, arr).slice(0, Math.max(0, Math.min(n, arr.length)));
}

/** Log-normal-ish positive number around `median`. */
export function logNormal(rng: Rng, median: number, spread: number): number {
  // Box–Muller
  const u = Math.max(1e-9, rng());
  const v = rng();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return median * Math.exp(z * spread);
}

/** Zipf-like weights for n ranked items. */
export function zipfWeights(n: number, s = 1): number[] {
  return Array.from({ length: n }, (_, i) => 1 / Math.pow(i + 1, s));
}
