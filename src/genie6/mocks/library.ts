/**
 * Genie 6.0 library — re-exports from src/mocks/shared (the single FabAds
 * catalogue source of truth). Kept here for backward-compat with Genie's
 * existing importers; new code should import from "@/mocks/shared" directly.
 *
 * Iter-6 A-10: data moved to `src/mocks/shared/{audiences,angles,hooks,
 * concepts,avatars,voices}.ts` so Catalogue + Genie share one canonical
 * dataset. This file now exists only as an import-path shim.
 */
export { audiences, angles, hooks, concepts, avatars, voices } from "@/mocks/shared";
