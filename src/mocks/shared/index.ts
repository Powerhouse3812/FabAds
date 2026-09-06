/**
 * Shared mock data — single source of truth for the FabAds catalogue.
 *
 * Catalogue (top-level FabAds module) and Genie 6.0 both consume from here.
 * Sync rule: any change to brands / categories / products / audiences / angles /
 * hooks / concepts / avatars / voices lands in this folder first; the Genie
 * shim at `src/genie6/mocks/library.ts` re-exports for backward compat with
 * Genie's existing 15+ importers.
 *
 * Iter-6 A-9 — initial migration (brands, categories, products).
 * Iter-6 A-10 — extended to all entity types (audiences, angles, hooks,
 *               concepts, avatars, voices). Audience promoted to a first-class
 *               Catalogue entity with full UI (Finder + List + Detail).
 */

export { brands } from "./brands";
export { categories } from "./categories";
export { products } from "./products";
export { audiences } from "./audiences";
export { angles } from "./angles";
export { hooks } from "./hooks";
export { concepts } from "./concepts";
export { avatars } from "./avatars";
export { voices } from "./voices";

export type {
  Brand, Category, Product, Variant,
  Audience, Angle, Hook, Concept, Avatar, Voice,
  BrandId, ProductId, CategoryId,
} from "@/genie6/types/entities";

// Knowledge Base structure — entity-keyed instructions, winner ads, concepts.
// Iter-6 directive (Maalik): Brand / Product / Category each carry a KB.
export * from "./kbInstructions";
export * from "./winnerAds";
export * from "./kbConcepts";
export * from "./referenceUrls";

// Activity log — audit trail of edits / saves / runs across entities.
// A-12.42: introduced for Brand Detail's Activity tab.
export * from "./activityLog";

// New Creative asset types — Genie 2.0 §9 / §21.1 (Catalogue merge) /
// §21.2 (Angle, Template, Audience, Reference join the list). Angle and
// Audience already existed above; Scripts / CTAs / Templates / References
// are new. See src/catalogue/assetTypes.ts for the registry that ties all
// fourteen types (3 Business + 11 Creative) together.
export * from "./scripts";
export * from "./ctas";
export * from "./templates";
export * from "./references";
