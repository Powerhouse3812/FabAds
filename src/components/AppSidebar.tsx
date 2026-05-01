/**
 * AppSidebar — variant router.
 *
 * As of iter-6 A-2 (2026-05-01) the FabAds shell supports two nav variants:
 *
 *   rail      — original two-tier (60px icon rail + 200px collapsible sub-panel).
 *               File: src/components/sidebar/AppSidebarRail.tsx
 *
 *   sections  — sectioned single-pane (240px expanded / 60px collapsed) with
 *               group labels (RUN / DISCOVER / CREATE / AUTOMATE) and inline
 *               accordion sub-items.
 *               File: src/components/sidebar/AppSidebarSections.tsx
 *
 * Picked at runtime via `useFabAdsNavVariant()` hook (localStorage-persisted,
 * default = "rail"). Toggled from the bottom dock via `NavVariantToggle` —
 * single icon, click cycles, mirrors the dark/light toggle pattern.
 *
 * MobileNavContent is re-exported from the Rail variant since mobile
 * already uses a single-pane sheet (variant-agnostic).
 */
import { useFabAdsNavVariant } from "@/components/sidebar/useFabAdsNavVariant";
import { AppSidebarRail } from "@/components/sidebar/AppSidebarRail";
import { AppSidebarSections } from "@/components/sidebar/AppSidebarSections";

export { MobileNavContent } from "@/components/sidebar/AppSidebarRail";

export function AppSidebar() {
  const { variant } = useFabAdsNavVariant();
  return variant === "sections" ? <AppSidebarSections /> : <AppSidebarRail />;
}
