/**
 * Shared mock data — single source of truth for the FabAds catalogue.
 *
 * Catalogue (top-level FabAds module) and Genie 6.0 both consume from here.
 * Sync rule: any change to brands / categories / products lands in this folder
 * first; consumers re-export from `src/genie6/mocks/{brands,categories,products}.ts`
 * for backward compat with Genie's existing 15+ importers.
 *
 * Iter-6 A-9 — initial migration. Future iters will move other entity types
 * (audiences, angles, hooks, concepts, avatars, voices) here as well.
 */

export { brands } from "./brands";
export { categories } from "./categories";
export { products } from "./products";

export type { Brand, Category, Product } from "@/genie6/types/entities";
