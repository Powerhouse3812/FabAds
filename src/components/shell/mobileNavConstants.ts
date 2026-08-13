/**
 * Shell nav constants that other modules need WITHOUT importing the component
 * that renders them.
 *
 * These lived in `MobileTabBar.tsx` until `src/mobile-tour/tourContent.ts`
 * started reading `MOBILE_HOME_PATH` to describe the real tab bar. Once
 * `MobileTabBar` also had to import the tour flow (to mount it outside the More
 * sheet, which unmounts its own content), that produced a genuine cycle:
 *
 *   MobileTabBar → @/mobile-tour → tourContent → MobileTabBar
 *
 * ESM resolves cycles by returning a partially-evaluated module, so
 * `MOBILE_HOME_PATH` was still in its temporal dead zone when `tourContent`
 * read it at module scope — a hard `ReferenceError: Cannot access
 * 'MOBILE_HOME_PATH' before initialization` that blanked the whole app. Note it
 * type-checked perfectly; only running it surfaced the problem.
 *
 * Constants live here, with no imports of their own, so nothing can cycle
 * through them.
 */

/**
 * The bar's Home destination. Today that is the Dashboard, which is already
 * mobile-first and is where `/` redirects. When a dedicated mobile landing
 * ships, this constant is the only line that changes.
 */
export const MOBILE_HOME_PATH = "/dashboard";
