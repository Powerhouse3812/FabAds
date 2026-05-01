/**
 * Re-export shim — canonical source moved to `src/mocks/shared/categories.ts`
 * in iter-6 A-9 for the Catalogue ↔ Genie data sync.
 *
 * Helpers (`getCategory`) preserved on this surface so existing genie6
 * importers don't break.
 */
export { categories, getCategory } from "@/mocks/shared/categories";
