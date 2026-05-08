import type { BrandId, ProductId, CategoryId } from "@/genie6/types/entities";

/**
 * Activity log — audit trail of edits / saves / runs across catalogue entities.
 *
 * A-12.42: introduced for Brand Detail's Activity tab. Surfaces in the rail
 * timeline view; future: also Product + Category detail pages.
 *
 * In-memory mock for now. Future: backend audit table + websocket push.
 */

export type ActivityKind =
  | "instruction-added"
  | "instruction-edited"
  | "product-added"
  | "winner-ad-saved"
  | "concept-saved"
  | "generation-run"
  | "reference-added"
  | "brand-edited";

export type ActivityEntityType = "brand" | "product" | "category";
export type ActivityEntityId = BrandId | ProductId | CategoryId;

export interface ActivityLogEntry {
  id: string;
  entityType: ActivityEntityType;
  entityId: ActivityEntityId;
  kind: ActivityKind;
  /** Human-readable summary, e.g. "Vidhi added a custom instruction". */
  summary: string;
  /** Optional secondary text. e.g. "Festive campaigns guide". */
  detail?: string;
  /** Who performed the action. */
  actor: string;
  at: Date;
}

const NOW = new Date("2026-05-08T16:00:00");
const ago = (days: number, hours = 0): Date =>
  new Date(NOW.getTime() - days * 86_400_000 - hours * 3_600_000);

export const ACTIVITY_LOG: ActivityLogEntry[] = [
  // ── Mamaearth (8) ──────────────────────────────────────────
  { id: "act-me-1", entityType: "brand", entityId: "mamaearth", kind: "winner-ad-saved",
    summary: "Vidhi saved a Winner Ad", detail: "Diwali bundle — Mom's haircare ritual",
    actor: "Vidhi", at: ago(0, 2) },
  { id: "act-me-2", entityType: "brand", entityId: "mamaearth", kind: "instruction-added",
    summary: "Maalik added a custom instruction", detail: "Festive campaigns — premium tone overlay",
    actor: "Maalik", at: ago(0, 8) },
  { id: "act-me-3", entityType: "brand", entityId: "mamaearth", kind: "generation-run",
    summary: "Aarav generated 12 outputs", detail: "Onion Shampoo · Hero Shot angle",
    actor: "Aarav", at: ago(1, 3) },
  { id: "act-me-4", entityType: "brand", entityId: "mamaearth", kind: "concept-saved",
    summary: "Vidhi saved 'POV creator demo' concept",
    actor: "Vidhi", at: ago(1, 14) },
  { id: "act-me-5", entityType: "brand", entityId: "mamaearth", kind: "product-added",
    summary: "Vidhi added a new product", detail: "Vit C Face Wash",
    actor: "Vidhi", at: ago(2) },
  { id: "act-me-6", entityType: "brand", entityId: "mamaearth", kind: "reference-added",
    summary: "Maalik added a reference URL", detail: "amazon.in/mamaearth-onion-shampoo",
    actor: "Maalik", at: ago(3) },
  { id: "act-me-7", entityType: "brand", entityId: "mamaearth", kind: "brand-edited",
    summary: "Vidhi updated brand voice", detail: "Tone shifted toward 'family-safe'",
    actor: "Vidhi", at: ago(5) },
  { id: "act-me-8", entityType: "brand", entityId: "mamaearth", kind: "winner-ad-saved",
    summary: "Aarav saved a Winner Ad from Insights", detail: "30% off Onion Shampoo — limited time",
    actor: "Aarav", at: ago(7) },

  // ── Plum (5) ───────────────────────────────────────────────
  { id: "act-plum-1", entityType: "brand", entityId: "plum", kind: "winner-ad-saved",
    summary: "Vidhi saved a Winner Ad", detail: "Pro-clean Vit C serum — visible glow",
    actor: "Vidhi", at: ago(2, 4) },
  { id: "act-plum-2", entityType: "brand", entityId: "plum", kind: "instruction-added",
    summary: "Maalik added a custom instruction", detail: "Hero shot guide — clean, ingredient-forward",
    actor: "Maalik", at: ago(4) },
  { id: "act-plum-3", entityType: "brand", entityId: "plum", kind: "generation-run",
    summary: "Aarav generated 8 outputs", detail: "Vit C Serum · Before / After angle",
    actor: "Aarav", at: ago(6) },
  { id: "act-plum-4", entityType: "brand", entityId: "plum", kind: "concept-saved",
    summary: "Vidhi saved 'Glow grid' concept",
    actor: "Vidhi", at: ago(9) },
  { id: "act-plum-5", entityType: "brand", entityId: "plum", kind: "reference-added",
    summary: "Aarav added a reference URL", detail: "plumgoodness.com/vc-serum",
    actor: "Aarav", at: ago(12) },

  // ── Boat (5) ───────────────────────────────────────────────
  { id: "act-boat-1", entityType: "brand", entityId: "boat", kind: "winner-ad-saved",
    summary: "Maalik saved a Winner Ad", detail: "Airdopes 161 — 40hr battery, ₹999",
    actor: "Maalik", at: ago(1, 8) },
  { id: "act-boat-2", entityType: "brand", entityId: "boat", kind: "generation-run",
    summary: "Aarav generated 16 outputs", detail: "Airdopes 161 · Spec-led pricing hook",
    actor: "Aarav", at: ago(3, 5) },
  { id: "act-boat-3", entityType: "brand", entityId: "boat", kind: "product-added",
    summary: "Vidhi added a new product", detail: "Stone 1100 Speaker",
    actor: "Vidhi", at: ago(8) },
  { id: "act-boat-4", entityType: "brand", entityId: "boat", kind: "reference-added",
    summary: "Aarav added a reference URL", detail: "boat-lifestyle.com/products/airdopes-161",
    actor: "Aarav", at: ago(11) },
  { id: "act-boat-5", entityType: "brand", entityId: "boat", kind: "instruction-edited",
    summary: "Maalik updated 'Spec-led format' instruction",
    actor: "Maalik", at: ago(14) },

  // ── Noise (3) ──────────────────────────────────────────────
  { id: "act-noise-1", entityType: "brand", entityId: "noise", kind: "winner-ad-saved",
    summary: "Aarav saved a Winner Ad", detail: "ColorFit Pro 5 — fitness Gen Z hero",
    actor: "Aarav", at: ago(1, 18) },
  { id: "act-noise-2", entityType: "brand", entityId: "noise", kind: "concept-saved",
    summary: "Vidhi saved 'Workout flex' concept",
    actor: "Vidhi", at: ago(5, 4) },
  { id: "act-noise-3", entityType: "brand", entityId: "noise", kind: "generation-run",
    summary: "Aarav generated 12 outputs", detail: "ColorFit Pro 5 · UGC Style angle",
    actor: "Aarav", at: ago(10) },

  // ── Sleepyhead (3) ─────────────────────────────────────────
  { id: "act-sh-1", entityType: "brand", entityId: "sleepyhead", kind: "instruction-added",
    summary: "Maalik added a custom instruction", detail: "Settling-in couple voice",
    actor: "Maalik", at: ago(2, 10) },
  { id: "act-sh-2", entityType: "brand", entityId: "sleepyhead", kind: "winner-ad-saved",
    summary: "Vidhi saved a Winner Ad", detail: "First-home mattress — quality sleep proof",
    actor: "Vidhi", at: ago(6, 8) },
  { id: "act-sh-3", entityType: "brand", entityId: "sleepyhead", kind: "generation-run",
    summary: "Aarav generated 8 outputs", detail: "Original Mattress · Lifestyle angle",
    actor: "Aarav", at: ago(13) },

  // ── Sugar (3) ──────────────────────────────────────────────
  { id: "act-sg-1", entityType: "brand", entityId: "sugar", kind: "concept-saved",
    summary: "Vidhi saved 'Indian skin shade range' concept",
    actor: "Vidhi", at: ago(0, 6) },
  { id: "act-sg-2", entityType: "brand", entityId: "sugar", kind: "winner-ad-saved",
    summary: "Maalik saved a Winner Ad", detail: "Matte lipstick — 30 shades for Indian skin",
    actor: "Maalik", at: ago(4, 12) },
  { id: "act-sg-3", entityType: "brand", entityId: "sugar", kind: "reference-added",
    summary: "Vidhi added a reference URL", detail: "instagram.com/sugarcosmetics",
    actor: "Vidhi", at: ago(9) },
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
