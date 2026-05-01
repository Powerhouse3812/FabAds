/**
 * AppSidebar — variant router.
 *
 * As of iter-6 A-3 (2026-05-01) the FabAds shell supports three nav variants:
 *
 *   rail      — original two-tier (60px icon rail + 200px collapsible sub-panel).
 *               File: src/components/sidebar/AppSidebarRail.tsx
 *
 *   sections  — sectioned single-pane (240px expanded / 60px collapsed) with
 *               group labels (RUN / DISCOVER / CREATE / AUTOMATE) and inline
 *               accordion sub-items.
 *               File: src/components/sidebar/AppSidebarSections.tsx
 *
 *   focus     — drill-in pane (220px). Active module's sub-items foregrounded
 *               in a card; other modules demoted to a compact quick-jump strip.
 *               File: src/components/sidebar/AppSidebarFocus.tsx
 *
 * Picked at runtime via `useFabAdsNavVariant()` hook (localStorage-persisted,
 * default = "rail"). Toggled from the bottom dock via `NavVariantToggle` —
 * single icon, click cycles rail → sections → focus → rail. Mirrors the
 * dark/light toggle pattern.
 *
 * MobileNavContent is re-exported from the Rail variant since mobile
 * already uses a single-pane sheet (variant-agnostic).
 */
import { useFabAdsNavVariant } from "@/components/sidebar/useFabAdsNavVariant";
import { AppSidebarRail } from "@/components/sidebar/AppSidebarRail";
import { AppSidebarSections } from "@/components/sidebar/AppSidebarSections";
import { AppSidebarFocus } from "@/components/sidebar/AppSidebarFocus";

export { MobileNavContent } from "@/components/sidebar/AppSidebarRail";

export function AppSidebar() {
  const { variant } = useFabAdsNavVariant();
  switch (variant) {
    case "sections":
      return <AppSidebarSections />;
    case "focus":
      return <AppSidebarFocus />;
    case "rail":
    default:
      return <AppSidebarRail />;
  }
}
