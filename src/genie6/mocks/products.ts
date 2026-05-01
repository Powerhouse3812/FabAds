/**
 * Re-export shim — canonical source moved to `src/mocks/shared/products.ts`
 * in iter-6 A-9 for the Catalogue ↔ Genie data sync.
 *
 * Helpers (`getProduct`, `productsForBrand`) preserved on this surface so the
 * 15+ existing genie6 importers (BrandSettings, etc.) don't break. New code
 * should import from `@/mocks/shared/products` directly.
 */
export { products, getProduct, productsForBrand, productsForCategory } from "@/mocks/shared/products";
