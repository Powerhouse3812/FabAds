import { Route, Navigate } from "react-router-dom";
import { Genie6Bridge } from "./shell/Genie6Bridge";
import { Home } from "./home/Home";
import { OutputCardShowcase } from "./dev/OutputCardShowcase";
import { Library } from "./library/Library";
import { SettingsHub } from "./settings/SettingsHub";
import { BrandSettings } from "./settings/BrandSettings";
import { BrandProfileEditor } from "./settings/BrandProfileEditor";
import { CategorySettings } from "./settings/CategorySettings";
import { CategoryKBEditor } from "./settings/CategoryKBEditor";
import { AvatarLibrarySettings } from "./settings/AvatarLibrarySettings";
import { VoiceLibrarySettings } from "./settings/VoiceLibrarySettings";
import { TemplateLibrarySettings } from "./settings/TemplateLibrarySettings";
import { DisclosureSettings } from "./settings/DisclosureSettings";
import { WorkspaceView, WorkspaceIndex } from "./workspace/WorkspaceView";
import { GenerateOutlet } from "./generate-legacy/GenerateOutlet";
import { GenerateScaffold } from "./generate-legacy/GenerateScaffold";
import { ModePicker } from "./generate-legacy/ModePicker";
import { FormScaffold } from "./generate-legacy/FormScaffold";
import { TourPresentation } from "./tour/TourPresentation";
import { ProgressScreen } from "./generate-legacy/ProgressScreen";
import { ResultsScreen } from "./generate-legacy/ResultsScreen";
import { GenerateLanding } from "./generate-new/GenerateLanding";
import { StudioBrandAdForm } from "./generate-new/forms/StudioBrandAdForm";
import { StudioProductAdForm } from "./generate-new/forms/StudioProductAdForm";
import { StudioAffiliateAdForm } from "./generate-new/forms/StudioAffiliateAdForm";
import { StudioVariationForm } from "./generate-new/forms/StudioVariationForm";
import { StudioV3Landing } from "./generate-v3/StudioV3Landing";
import { SubModePlaceholder } from "./generate-v3/SubModePlaceholder";
import { ProductShootForm } from "./generate-v3/forms/ProductShootForm";
import { ProductFocusedAdForm } from "./generate-v3/forms/ProductFocusedAdForm";
import { StudioV3Lab } from "./generate-v3/_dev/StudioV3Lab";
import { StudioV3Finder } from "./generate-v3/_dev/StudioV3Finder";
import { RailPopoverVariants } from "./generate-v3/_dev/RailPopoverVariants";

/**
 * Genie 6.0 routes — mounted inside FabAds AppLayout at /iq/genie6/*
 * (matching Genie 5.0 pattern at /iq/genie5/*).
 *
 * <Genie6Bridge> wraps every sub-route so:
 *   - useGenie6Theme() mirrors FabAds' next-themes onto <html data-theme=...>
 *   - NewGenerationOverlayProvider wraps everything so the topbar CTA can open()
 *   - g6-root applies Geist font + base token colors to page content
 */
export const genie6Routes = (
  <Route path="iq/genie6" element={<Genie6Bridge />}>
    <Route index element={<Home />} />

    {/* Library */}
    <Route path="library" element={<Library />} />
    <Route path="library/:assetType" element={<Library />} />
    <Route path="library/:assetType/:assetId" element={<Library />} />

    {/* Assets (URL still /workspace for routing — user-facing label is "Assets") */}
    <Route path="workspace" element={<WorkspaceIndex />} />
    <Route path="workspace/brands" element={<WorkspaceView key="ws-brands" />} />
    <Route path="workspace/brands/:brandId" element={<WorkspaceView key="ws-brand-detail" />} />
    <Route path="workspace/categories" element={<WorkspaceView key="ws-categories" />} />
    <Route path="workspace/categories/:categoryId" element={<WorkspaceView key="ws-category-detail" />} />
    <Route path="workspace/hooks" element={<WorkspaceView key="ws-hooks" />} />
    <Route path="workspace/angles" element={<WorkspaceView key="ws-angles" />} />
    <Route path="workspace/concepts" element={<WorkspaceView key="ws-concepts" />} />
    <Route path="workspace/templates" element={<WorkspaceView key="ws-templates" />} />
    <Route path="workspace/avatars" element={<WorkspaceView key="ws-avatars" />} />
    <Route path="workspace/audiences" element={<WorkspaceView key="ws-audiences" />} />

    {/* Settings */}
    <Route path="settings" element={<SettingsHub />} />
    <Route path="settings/brands" element={<BrandSettings />} />
    <Route path="settings/brands/:brandId" element={<BrandProfileEditor />} />
    <Route path="settings/categories" element={<CategorySettings />} />
    <Route path="settings/categories/:categoryId" element={<CategoryKBEditor />} />
    <Route path="settings/avatars" element={<AvatarLibrarySettings />} />
    <Route path="settings/voices" element={<VoiceLibrarySettings />} />
    <Route path="settings/templates" element={<TemplateLibrarySettings />} />
    <Route path="settings/disclosure" element={<DisclosureSettings />} />

    {/* Dev */}
    <Route path="_dev/output-card" element={<OutputCardShowcase />} />
    {/* Studio v3 design lab — header variants + glass / gradient / animation
        system showcase (A-11.22). Dev-only; not surfaced in sub-nav. */}
    <Route path="_dev/studio-v3-lab" element={<StudioV3Lab />} />
    {/* Studio v3 Finder layout wireframe — column-view drawer pattern for
        Audience / Angle / Concepts / References (A-11.24). Wireframe only. */}
    <Route path="_dev/studio-v3-finder" element={<StudioV3Finder />} />
    {/* Rail hover popover variants — pick one (A-11.26). */}
    <Route path="_dev/rail-popover" element={<RailPopoverVariants />} />

    {/* Old Studio (A-11.1: preserved as full copy of the previous Generate
        flow). Mounted at /generate-legacy/* AND simultaneously dual-mounted
        at the original /generate/* paths so existing deep-links (Catalogue's
        "Generate ad" CTA, in-app navigations, bookmarks) keep working
        without changes. In Phase B the /generate/* mounts get replaced by
        New Studio components; /generate-legacy/* stays as the Old Studio
        access route, surfaced via the "Old Studio" sub-nav item.
        Genie6Bridge wraps both to share theme + overlay providers. */}
    <Route path="generate-legacy" element={<GenerateOutlet />}>
      <Route index element={<FormScaffold />} />
      <Route path="product/:productId" element={<FormScaffold />} />
      <Route path="product/:productId/progress/:batchId" element={<ProgressScreen />} />
      <Route path="product/:productId/results/:batchId" element={<ResultsScreen />} />
      <Route path=":mode/form" element={<Navigate to="/iq/genie6/generate-legacy" replace />} />
      <Route path="legacy" element={<ModePicker />} />
      <Route path="legacy/:mode" element={<GenerateScaffold />} />
    </Route>

    {/* New Studio (Phase B, A-11.3+) — Form Specs locked.
        - /generate         → GenerateLanding (6-tile picker; Variations
                              direct-routes, others open the Gate modal)
        - /generate/{type}  → Type-specific form (mounts in B3-B6)
        Old Studio paths (/generate/product/:productId) get backward-compat
        redirects so Catalogue's "Generate ad" CTA + bookmarks keep working
        until B4 migrates them to /generate/product-ad?product=:id. */}
    <Route path="generate" element={<GenerateOutlet />}>
      <Route index element={<GenerateLanding />} />
      {/* Type-form placeholders — fill in during B3-B6 */}
      <Route path="brand-ad" element={<StudioBrandAdForm />} />
      <Route path="product-ad" element={<StudioProductAdForm />} />
      <Route path="affiliate-ad" element={<StudioAffiliateAdForm />} />
      <Route path="variation" element={<StudioVariationForm />} />
      {/* Backward-compat for Old Studio deep-links (until B4 cleanup) */}
      <Route path="product/:productId" element={<Navigate to="/iq/genie6/generate-legacy" replace />} />
      <Route path=":mode/form" element={<Navigate to="/iq/genie6/generate" replace />} />
      <Route path="legacy" element={<ModePicker />} />
      <Route path="legacy/:mode" element={<GenerateScaffold />} />
    </Route>

    {/* Studio v3 — 3-category picker + sub-mode forms.
        A-11.14 — picker landed.
        A-11.19 — first real sub-mode form: Brand → Product Shoot.
        Other sub-mode forms ship one-by-one. Until then they fall through
        to <SubModePlaceholder />. */}
    <Route path="generate-v3">
      <Route index element={<StudioV3Landing />} />
      {/* Product Shoot — first real Studio v3 form (A-11.19) */}
      <Route path="brand/product-shoot" element={<ProductShootForm />} />
      {/* Product-focused Brand Ad — second real Studio v3 form (A-11.21).
          Product-led angle of a Brand Ad. Sibling to Brand-focused +
          Product Shoot. */}
      <Route path="brand/product-focused" element={<ProductFocusedAdForm />} />
      {/* Other sub-modes — placeholder until their forms ship */}
      <Route path=":categoryId/:subModeId" element={<SubModePlaceholder />} />
      <Route path="quick/:quickModeId" element={<SubModePlaceholder />} />
    </Route>

    {/* Guided tour — slide deck + walkthrough overlay */}
    <Route path="wizard" element={<TourPresentation />} />
  </Route>
);

/* ─────────────────────────────────────────────────────────
 *  Phase B (A-11.1 → A-11.9) complete:
 *    - All 4 Type CTAs (Brand / Product / Affiliate / Variation) wired with
 *      Studio-prefixed forms.
 *    - 2 Preset CTAs (Product Shoot / UGC Video) resolve via GateModal to a
 *      Type form with locked pre-fills.
 *    - Old Studio preserved fully under /generate-legacy/*.
 *    - Catalogue's "Generate ad" CTA migrated to /generate/product-ad.
 *  Out of scope (deferred to iter-8+):
 *    - Home dashboard rebuild (Section 11.2)
 *    - Workspace Finder rework (Section 11.3)
 *    - Library 15-day rolling room
 *    - Backend wiring (Quality Confidence, C2PA, real generation pipeline)
 *    - Canvas/Command/Modular variants of the New Studio forms
 *    - More-modes popover (Image-led / Brief-led / Content)
 * ───────────────────────────────────────────────────────── */
