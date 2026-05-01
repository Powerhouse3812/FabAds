/**
 * Re-export shim — canonical source moved to `src/mocks/shared/brands.ts`
 * in iter-6 A-9 for the Catalogue ↔ Genie data sync.
 *
 * Helpers (`getBrand`) preserved on this surface so existing genie6 importers
 * don't break. New code should import from `@/mocks/shared/brands` directly.
 */
export { brands, getBrand } from "@/mocks/shared/brands";
