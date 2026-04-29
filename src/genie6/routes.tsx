import { Route } from "react-router-dom";
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
import { GenerateOutlet } from "./generate/GenerateOutlet";
import { GenerateScaffold } from "./generate/GenerateScaffold";
import { ModePicker } from "./generate/ModePicker";
import { FormScaffold } from "./generate/FormScaffold";
import { WizardTour } from "./onboarding/WizardTour";
import { ProgressScreen } from "./generate/ProgressScreen";
import { ResultsScreen } from "./generate/ResultsScreen";

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

    {/* Workspace */}
    <Route path="workspace" element={<WorkspaceIndex />} />
    <Route path="workspace/brands" element={<WorkspaceView key="ws-brands" />} />
    <Route path="workspace/brands/:brandId" element={<WorkspaceView key="ws-brand-detail" />} />
    <Route path="workspace/categories" element={<WorkspaceView key="ws-categories" />} />
    <Route path="workspace/categories/:categoryId" element={<WorkspaceView key="ws-category-detail" />} />

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

    {/* Generate */}
    <Route path="generate" element={<GenerateOutlet />}>
      <Route index element={<ModePicker />} />
      <Route path=":mode" element={<GenerateScaffold />} />
      <Route path=":mode/form" element={<FormScaffold />} />
      <Route path=":mode/progress/:batchId" element={<ProgressScreen />} />
      <Route path=":mode/results/:batchId" element={<ResultsScreen />} />
    </Route>

    {/* Onboarding wizard / tour — stub for now, real flow built last */}
    <Route path="wizard" element={<WizardTour />} />
  </Route>
);
