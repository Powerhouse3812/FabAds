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
 * The bar's Home destination.
 *
 * CHANGED (2026-08-21, mobile scope cut — MOBILE_SPEC.md 2.2): this used to
 * be the Dashboard, which was already mobile-first and was where `/`
 * redirects. Mobile scope narrowed to Industry Insights + Genie's library +
 * Onboarding only, and Dashboard flipped to `blocked` in
 * `mobileRoutePolicy.ts` — it can no longer be the landing, so this now
 * points at the Insights feed instead.
 *
 * Known consumers at the time of this change: `MobileTabBar.tsx` (its Home
 * tab's `to`, and it re-exports this constant) and `mobile-tour/tourContent.ts`
 * (the checklist's "back to normal" copy). Neither was edited here — this
 * file only owns the constant, not its consumers.
 *
 * NOT covered by this constant, left for their own owners: `App.tsx`'s `/` →
 * `/dashboard` redirect, `MobileTopBar.tsx`'s hardcoded `"/dashboard"`
 * no-history fallback, and the post-auth / no-access redirects in
 * `pages/Auth.tsx` and `pages/NoAccess.tsx` — all still point at a route that
 * is now `blocked` on mobile and should eventually read this constant too.
 */
export const MOBILE_HOME_PATH = "/insights-v2/feed";
