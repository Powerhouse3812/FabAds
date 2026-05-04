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

    {/* Phase A backward-compat dual-mount — same Old Studio components, also
        served under the original /generate/* paths so nothing breaks during
        the transition. Phase B will swap these for New Studio components. */}
    <Route path="generate" element={<GenerateOutlet />}>
      <Route index element={<FormScaffold />} />
      <Route path="product/:productId" element={<FormScaffold />} />
      <Route path="product/:productId/progress/:batchId" element={<ProgressScreen />} />
      <Route path="product/:productId/results/:batchId" element={<ResultsScreen />} />
      <Route path=":mode/form" element={<Navigate to="/iq/genie6/generate" replace />} />
      <Route path="legacy" element={<ModePicker />} />
      <Route path="legacy/:mode" element={<GenerateScaffold />} />
    </Route>

    {/* Guided tour — slide deck + walkthrough overlay */}
    <Route path="wizard" element={<TourPresentation />} />
  </Route>
);
