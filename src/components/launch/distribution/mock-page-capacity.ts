/**
 * Deterministic mock capacity populator for Bulk Launch Distribution.
 *
 * `currentActive` for a page is seeded by a stable hash of its `fb_page_id`, so
 * the SAME Facebook Page always returns ONE stable 250-slot bucket regardless of
 * how many ad accounts link to it. The seed is spread into three bands:
 *   - healthy   (~30–120 active)
 *   - near-full (200–244 active)
 *   - full      (250 active — at least one page lands here)
 *
 * Pure: no React / no Supabase. Safe to import from tests and UI previews.
 */
import { MAX_ADS_PER_PAGE } from "@/lib/launch-distribution";
import type { PageCapacity, TargetPair } from "@/lib/launch-distribution";

/** Stable 32-bit FNV-1a hash of a string. Deterministic across runs. */
function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0; // unsigned
}

/** Map a fb_page_id to a deterministic `currentActive` in [0, 250]. */
export function mockCurrentActiveFor(fbPageId: string): number {
  const h = hashString(fbPageId);
  const band = h % 10; // 0–9

  if (band === 0) {
    // Full band (~10% of pages) — guarantees at least one full page across a set.
    return MAX_ADS_PER_PAGE; // 250
  }
  if (band <= 2) {
    // Near-full band (200–244).
    return 200 + (h % 45);
  }
  // Healthy band (30–120).
  return 30 + (h % 91);
}

function uniqueFbPageIds(input: TargetPair[] | string[]): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const item of input) {
    const id = typeof item === "string" ? item : item.fb_page_id;
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

/**
 * Deterministic capacities for the unique Facebook Pages referenced by the
 * given target pairs (or raw fb_page_ids). Duplicate fb_page_ids collapse to a
 * single bucket — the same page can never return two different capacities.
 */
export function getMockCapacities(input: TargetPair[] | string[]): PageCapacity[] {
  return uniqueFbPageIds(input).map((fbPageId) => ({
    fb_page_id: fbPageId,
    currentActive: mockCurrentActiveFor(fbPageId),
  }));
}

/**
 * Test/preview helper: force a specific page to be completely full while
 * leaving all other pages at their deterministic seed. Useful when a test needs
 * a guaranteed-full page without depending on which band the hash picked.
 */
export function withPageFull(capacities: PageCapacity[], fbPageId: string): PageCapacity[] {
  const found = capacities.some((c) => c.fb_page_id === fbPageId);
  const next = capacities.map((c) =>
    c.fb_page_id === fbPageId ? { ...c, currentActive: MAX_ADS_PER_PAGE } : c
  );
  if (!found) next.push({ fb_page_id: fbPageId, currentActive: MAX_ADS_PER_PAGE });
  return next;
}

/** Test/preview helper: set an explicit currentActive for one page. */
export function withPageCapacity(capacities: PageCapacity[], fbPageId: string, currentActive: number): PageCapacity[] {
  const clamped = Math.max(0, Math.min(MAX_ADS_PER_PAGE, currentActive));
  const found = capacities.some((c) => c.fb_page_id === fbPageId);
  const next = capacities.map((c) => (c.fb_page_id === fbPageId ? { ...c, currentActive: clamped } : c));
  if (!found) next.push({ fb_page_id: fbPageId, currentActive: clamped });
  return next;
}
