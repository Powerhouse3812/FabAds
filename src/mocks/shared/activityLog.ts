import type { BrandId, ProductId, CategoryId } from "@/genie6/types/entities";

/**
 * Activity log — GENERATION HISTORY only.
 *
 * Genie 2.0 §10: "Activity log — for generation history. So a user can see
 * when what was generated, and where their credits went." §18 explicitly
 * DROPS "Activity Logs as an audit trail" — the log is kept only as
 * generation history, nothing else.
 *
 * This file used to double as a general CRUD audit trail (instruction-
 * added/edited, product-added, winner-ad-saved, concept-saved, reference-
 * added, brand-edited) with no cost field anywhere and zero "credit" hits
 * in the whole file — exactly the two defects §10/§18 call out. Fixed here:
 *   1. `ActivityKind` is narrowed to `"generation-run"` only. Those other
 *      actions already have their own surface (KB tab for instructions,
 *      Winners tab for winner ads, Products tab for product-added) — they
 *      don't belong in a "where did my credits go" ledger, and keeping them
 *      here is exactly the audit-trail scope §18 rules out.
 *   2. Every entry now carries `outputCount` + `creditsSpent` — the credit
 *      math the summary text used to only gesture at ("Aarav generated 12
 *      outputs" with no cost anywhere).
 *
 * Coverage — only 3 of the 13 Catalogue asset types (brand / product /
 * category) have an entityType here; the other 10 (Avatars, Voices,
 * Scripts, Concepts, Hooks, CTAs, Frameworks, Angles, Templates,
 * Audiences) still have no activity surface at all — see
 * `CatalogueDetailPage.tsx` report notes for the full list.
 *
 * Deliberately uneven coverage across brand/product/category — some
 * brands (Sugar) and most individual products/categories have ZERO
 * entries, on purpose (design system §3 state coverage: zero-data is a
 * real state, not a gap to paper over with invented rows). A "generated"
 * event is logged at brand grain always, and ALSO indexed at the
 * product/category grain for the handful of runs where the product/
 * category is unambiguous — real fan-out indexing, not duplicated filler.
 *
 * In-memory mock. Session-scoped; no backend yet.
 */

export type ActivityKind = "generation-run";

export type ActivityEntityType = "brand" | "product" | "category";
export type ActivityEntityId = BrandId | ProductId | CategoryId;

export interface ActivityLogEntry {
  id: string;
  entityType: ActivityEntityType;
  entityId: ActivityEntityId;
  kind: ActivityKind;
  /** Human-readable summary, e.g. "Aarav generated 12 outputs". */
  summary: string;
  /** Optional secondary text. e.g. "Onion Shampoo · Hero Shot angle". */
  detail?: string;
  /** Who ran the generation. */
  actor: string;
  at: Date;
  /** How many outputs this run produced — feeds `summary` and the credit math. */
  outputCount: number;
  /**
   * Credits spent on this run — §10 "where their credits went". A flat,
   * already-settled number (this is history, not a live estimate) — not
   * reconstructed from `genie6/lib/credits.ts`'s `computeBreakdown()` since
   * that needs the full request shape (avatar/format/resolution
   * multipliers) this historical log doesn't carry; the number here is the
   * amount that was actually charged for the run.
   */
  creditsSpent: number;
}

const NOW = new Date("2026-05-08T16:00:00");
const ago = (days: number, hours = 0): Date =>
  new Date(NOW.getTime() - days * 86_400_000 - hours * 3_600_000);

export const ACTIVITY_LOG: ActivityLogEntry[] = [
  // ── Mamaearth — populated (brand + 1 product-indexed run) ──────────
  { id: "act-me-1", entityType: "brand", entityId: "mamaearth", kind: "generation-run",
    summary: "Aarav generated 12 outputs", detail: "Onion Shampoo · Hero Shot angle",
    actor: "Aarav", at: ago(1, 3), outputCount: 12, creditsSpent: 28 },
  { id: "act-me-2", entityType: "brand", entityId: "mamaearth", kind: "generation-run",
    summary: "Vidhi generated 6 outputs", detail: "Vit C Face Wash · UGC Style angle",
    actor: "Vidhi", at: ago(4), outputCount: 6, creditsSpent: 15 },
  { id: "act-me-3", entityType: "brand", entityId: "mamaearth", kind: "generation-run",
    summary: "Aarav generated 20 outputs", detail: "Biotin Gummies · Before/After angle (video)",
    actor: "Aarav", at: ago(9), outputCount: 20, creditsSpent: 64 },
  { id: "act-me-1-prod", entityType: "product", entityId: "mamaearth-onion-shampoo", kind: "generation-run",
    summary: "Aarav generated 12 outputs", detail: "Onion Hair Shampoo for Hair Fall Control · Hero Shot angle",
    actor: "Aarav", at: ago(1, 3), outputCount: 12, creditsSpent: 28 },

  // ── Plum — populated (brand + 1 product-indexed run) ────────────────
  { id: "act-plum-1", entityType: "brand", entityId: "plum", kind: "generation-run",
    summary: "Aarav generated 8 outputs", detail: "Vit C Serum · Before / After angle",
    actor: "Aarav", at: ago(6), outputCount: 8, creditsSpent: 19 },
  { id: "act-plum-2", entityType: "brand", entityId: "plum", kind: "generation-run",
    summary: "Vidhi generated 10 outputs", detail: "Niacinamide Serum · Hero Shot angle",
    actor: "Vidhi", at: ago(15), outputCount: 10, creditsSpent: 24 },
  { id: "act-plum-1-prod", entityType: "product", entityId: "plum-gh-serum", kind: "generation-run",
    summary: "Aarav generated 8 outputs", detail: "Green Tea Skin Clarifying Serum · Before / After angle",
    actor: "Aarav", at: ago(6), outputCount: 8, creditsSpent: 19 },

  // ── Boat — populated (brand + 1 product-indexed run) ────────────────
  { id: "act-boat-1", entityType: "brand", entityId: "boat", kind: "generation-run",
    summary: "Aarav generated 16 outputs", detail: "Airdopes 141 · Spec-led pricing hook",
    actor: "Aarav", at: ago(3, 5), outputCount: 16, creditsSpent: 38 },
  { id: "act-boat-2", entityType: "brand", entityId: "boat", kind: "generation-run",
    summary: "Maalik generated 4 outputs", detail: "Rockerz 450 · Lifestyle angle",
    actor: "Maalik", at: ago(10), outputCount: 4, creditsSpent: 11 },
  { id: "act-boat-1-prod", entityType: "product", entityId: "boat-airdopes-141", kind: "generation-run",
    summary: "Aarav generated 16 outputs", detail: "Airdopes 141 with 42hr Battery · Spec-led pricing hook",
    actor: "Aarav", at: ago(3, 5), outputCount: 16, creditsSpent: 38 },

  // ── Noise — partial (brand + 1 product-indexed run) ─────────────────
  { id: "act-noise-1", entityType: "brand", entityId: "noise", kind: "generation-run",
    summary: "Aarav generated 12 outputs", detail: "ColorFit Pro 5 · UGC Style angle",
    actor: "Aarav", at: ago(10), outputCount: 12, creditsSpent: 30 },
  { id: "act-noise-1-prod", entityType: "product", entityId: "noise-colorfit-pro-5", kind: "generation-run",
    summary: "Aarav generated 12 outputs", detail: "ColorFit Pro 5 Buzz with Bluetooth Calling · UGC Style angle",
    actor: "Aarav", at: ago(10), outputCount: 12, creditsSpent: 30 },

  // ── Sleepyhead — partial (brand + 1 product-indexed run) ────────────
  { id: "act-sh-1", entityType: "brand", entityId: "sleepyhead", kind: "generation-run",
    summary: "Aarav generated 8 outputs", detail: "Original Mattress · Lifestyle angle",
    actor: "Aarav", at: ago(13), outputCount: 8, creditsSpent: 21 },
  { id: "act-sh-1-prod", entityType: "product", entityId: "sleepyhead-original-mattress", kind: "generation-run",
    summary: "Aarav generated 8 outputs", detail: "The Original Memory Foam Mattress · Lifestyle angle",
    actor: "Aarav", at: ago(13), outputCount: 8, creditsSpent: 21 },

  // ── Sugar — deliberately ZERO. No generation-run has been logged for
  // this brand yet; its Activity tab must read as empty, not "0 of
  // something we forgot to seed". Real zero-data state (design system §3).

  // ── Categories — sparse, aggregated view of the product runs above.
  // Most of the 55 categories have zero entries on purpose. ───────────
  { id: "act-cat-hair-care", entityType: "category", entityId: "hair-care", kind: "generation-run",
    summary: "Aarav generated 12 outputs", detail: "Mamaearth · Onion Hair Shampoo · Hero Shot angle",
    actor: "Aarav", at: ago(1, 3), outputCount: 12, creditsSpent: 28 },
  { id: "act-cat-wireless-earbuds", entityType: "category", entityId: "wireless-earbuds", kind: "generation-run",
    summary: "Aarav generated 16 outputs", detail: "boAt · Airdopes 141 · Spec-led pricing hook",
    actor: "Aarav", at: ago(3, 5), outputCount: 16, creditsSpent: 38 },
  { id: "act-cat-mattresses", entityType: "category", entityId: "mattresses", kind: "generation-run",
    summary: "Aarav generated 8 outputs", detail: "Sleepyhead · Original Mattress · Lifestyle angle",
    actor: "Aarav", at: ago(13), outputCount: 8, creditsSpent: 21 },
];

export function getActivityLogForBrand(
  brandId: BrandId,
  limit = 50,
): ActivityLogEntry[] {
  return ACTIVITY_LOG
    .filter((e) => e.entityType === "brand" && e.entityId === brandId)
    .sort((a, b) => +b.at - +a.at)
    .slice(0, limit);
}

export function getActivityLogForEntity(
  entityType: ActivityEntityType,
  entityId: ActivityEntityId,
  limit = 50,
): ActivityLogEntry[] {
  return ACTIVITY_LOG
    .filter((e) => e.entityType === entityType && e.entityId === entityId)
    .sort((a, b) => +b.at - +a.at)
    .slice(0, limit);
}

/** Sum of `creditsSpent` across an entity's generation history — §10
 *  "where their credits went", as one settled total rather than making the
 *  reader add up the list themselves. 0 for a genuinely untouched entity,
 *  never fabricated. */
export function totalCreditsForEntity(
  entityType: ActivityEntityType,
  entityId: ActivityEntityId,
): number {
  return getActivityLogForEntity(entityType, entityId).reduce(
    (sum, e) => sum + e.creditsSpent,
    0,
  );
}

/** Sum of `outputCount` across an entity's generation history. */
export function totalOutputsForEntity(
  entityType: ActivityEntityType,
  entityId: ActivityEntityId,
): number {
  return getActivityLogForEntity(entityType, entityId).reduce(
    (sum, e) => sum + e.outputCount,
    0,
  );
}
