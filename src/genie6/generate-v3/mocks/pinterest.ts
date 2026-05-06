/**
 * Studio v3 — Pinterest reference mocks (A-11.23).
 *
 * Per Maalik's lock: Pinterest fetch results bias on the user's already-
 * provided form inputs (output, product+brand, angles, concepts) — NOT
 * audience. Mock for now; real backend wires in iter-8+.
 *
 * The mock returns a deterministic-but-varied pin set keyed off the query
 * so swapping inputs visibly changes the grid.
 */

export interface PinterestPin {
  id: string;
  /** Visible label / title pulled from the source. */
  title: string;
  /** Thumbnail URL — Unsplash placeholder for the mock. */
  thumbnail: string;
  /** Aspect of the pin tile: square / portrait / landscape. Drives masonry. */
  aspect: "square" | "portrait" | "landscape";
  /** Mock-only: the angle the pin loosely resonates with. */
  angleHint?: string;
}

export interface PinterestQuery {
  output: "image" | "video";
  productId: string | null;
  brandId: string | null;
  angleIds: string[];
  conceptIds: string[];
}

/**
 * Fixed pool of 24 pins. Real backend returns dynamic results — this is
 * just enough variety for the UI to read as "fetched & curated".
 */
const POOL: PinterestPin[] = [
  { id: "p-01", title: "Studio white · soft shadow", thumbnail: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=320&q=70", aspect: "square", angleHint: "lifestyle" },
  { id: "p-02", title: "Founder portrait · warm tone", thumbnail: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=320&q=70", aspect: "portrait", angleHint: "founder-quote" },
  { id: "p-03", title: "Hero on wood · low key", thumbnail: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=320&q=70", aspect: "square", angleHint: "lifestyle" },
  { id: "p-04", title: "Five-star pull-quote", thumbnail: "https://images.unsplash.com/photo-1488998427799-e3362cec87c3?auto=format&fit=crop&w=320&q=70", aspect: "portrait", angleHint: "social-proof" },
  { id: "p-05", title: "Before / after split", thumbnail: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=320&q=70", aspect: "landscape", angleHint: "before-after" },
  { id: "p-06", title: "FOMO countdown stamp", thumbnail: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=320&q=70", aspect: "portrait", angleHint: "fomo" },
  { id: "p-07", title: "Bold claim · oversized type", thumbnail: "https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&w=320&q=70", aspect: "square", angleHint: "bold-claim" },
  { id: "p-08", title: "Unboxing · slow reveal", thumbnail: "https://images.unsplash.com/photo-1607082352121-fa243f3dde32?auto=format&fit=crop&w=320&q=70", aspect: "portrait", angleHint: "unboxing" },
  { id: "p-09", title: "In-context lifestyle frame", thumbnail: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=320&q=70", aspect: "landscape", angleHint: "lifestyle" },
  { id: "p-10", title: "Problem → solution split", thumbnail: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=320&q=70", aspect: "portrait", angleHint: "problem-solution" },
  { id: "p-11", title: "Editorial product on black", thumbnail: "https://images.unsplash.com/photo-1622372738946-62e02505feb3?auto=format&fit=crop&w=320&q=70", aspect: "portrait", angleHint: "lifestyle" },
  { id: "p-12", title: "Talking head · UGC frame", thumbnail: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=70", aspect: "portrait", angleHint: "founder-quote" },
  { id: "p-13", title: "Social proof avatars row", thumbnail: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=320&q=70", aspect: "landscape", angleHint: "social-proof" },
  { id: "p-14", title: "Festive bg · warm bokeh", thumbnail: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&w=320&q=70", aspect: "square", angleHint: "lifestyle" },
  { id: "p-15", title: "Macro detail shot", thumbnail: "https://images.unsplash.com/photo-1556228841-7d2f1d2ec9b8?auto=format&fit=crop&w=320&q=70", aspect: "square", angleHint: "lifestyle" },
  { id: "p-16", title: "Bundle hero · 5 SKUs", thumbnail: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=320&q=70", aspect: "landscape", angleHint: "lifestyle" },
  { id: "p-17", title: "Dramatic side-light", thumbnail: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=320&q=70", aspect: "portrait", angleHint: "bold-claim" },
  { id: "p-18", title: "Lifestyle · outdoor warm", thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=320&q=70", aspect: "landscape", angleHint: "lifestyle" },
  { id: "p-19", title: "Hand model · simple bg", thumbnail: "https://images.unsplash.com/photo-1556228694-7adde2ea05d6?auto=format&fit=crop&w=320&q=70", aspect: "square", angleHint: "unboxing" },
  { id: "p-20", title: "Founder kitchen scene", thumbnail: "https://images.unsplash.com/photo-1607081692251-e91e3d7da42a?auto=format&fit=crop&w=320&q=70", aspect: "portrait", angleHint: "founder-quote" },
  { id: "p-21", title: "Type-led claim with arrow", thumbnail: "https://images.unsplash.com/photo-1607082352121-fa243f3dde32?auto=format&fit=crop&w=320&q=70", aspect: "square", angleHint: "bold-claim" },
  { id: "p-22", title: "Mood lifestyle · pastel", thumbnail: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=320&q=70", aspect: "landscape", angleHint: "lifestyle" },
  { id: "p-23", title: "Unboxing · top-down", thumbnail: "https://images.unsplash.com/photo-1556228653-15d46a2f8a86?auto=format&fit=crop&w=320&q=70", aspect: "square", angleHint: "unboxing" },
  { id: "p-24", title: "Reviews carousel hero", thumbnail: "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?auto=format&fit=crop&w=320&q=70", aspect: "portrait", angleHint: "social-proof" },
];

/**
 * Deterministic shuffle keyed on the query — same query → same order, so
 * swapping inputs reliably changes the grid. Pure mock, no real backend.
 */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function fetchPinterestRefs(query: PinterestQuery): PinterestPin[] {
  const seed = hashString(
    [
      query.output,
      query.brandId ?? "",
      query.productId ?? "",
      ...query.angleIds.sort(),
      ...query.conceptIds.sort(),
    ].join("|"),
  );

  // Bias the pool toward pins matching selected angles (when any).
  const angleSet = new Set(query.angleIds);
  const matching = POOL.filter((p) => p.angleHint && angleSet.has(p.angleHint));
  const others = POOL.filter((p) => !matching.includes(p));

  // Deterministic shuffle of each bucket.
  const shuffled = (arr: PinterestPin[], salt: number) =>
    [...arr].sort((a, b) => {
      const ah = hashString(a.id + seed + salt);
      const bh = hashString(b.id + seed + salt);
      return ah - bh;
    });

  const merged = angleSet.size
    ? [...shuffled(matching, 1), ...shuffled(others, 2).slice(0, 12)]
    : shuffled(others, 3);

  return merged.slice(0, 16);
}

/**
 * Mock fetch with realistic-feeling 600-1200ms delay. Returns Pin[].
 * Real backend wires later.
 */
export function fetchPinterestRefsAsync(query: PinterestQuery): Promise<PinterestPin[]> {
  return new Promise((resolve) => {
    const delay = 600 + Math.floor(Math.random() * 600);
    window.setTimeout(() => resolve(fetchPinterestRefs(query)), delay);
  });
}
