import { Route } from "react-router-dom";
import ConceptGallery from "@/auth-concepts/ConceptGallery";
import { ConceptSwitcher } from "@/auth-concepts/shared/ConceptSwitcher";
import Concept01Spotlight from "@/auth-concepts/concepts/Concept01Spotlight";
import Concept02BlobDivide from "@/auth-concepts/concepts/Concept02BlobDivide";
import Concept03ReactiveCompanion from "@/auth-concepts/concepts/Concept03ReactiveCompanion";
import Concept04TypeTexture from "@/auth-concepts/concepts/Concept04TypeTexture";
import Concept05IridescentAI from "@/auth-concepts/concepts/Concept05IridescentAI";
import Concept06ScatteredDesk from "@/auth-concepts/concepts/Concept06ScatteredDesk";
import Concept07HandDrawnJourney from "@/auth-concepts/concepts/Concept07HandDrawnJourney";
import Concept08StepperInScene from "@/auth-concepts/concepts/Concept08StepperInScene";
import Concept09MinimalMono from "@/auth-concepts/concepts/Concept09MinimalMono";
import Concept10NatureSplit from "@/auth-concepts/concepts/Concept10NatureSplit";
import Concept11LiquidGlass from "@/auth-concepts/concepts/Concept11LiquidGlass";

/**
 * auth-concepts — PUBLIC design-review routes for the 10-direction login
 * exploration (see shared/formSpec.ts). No auth, no app shell — mirrors the
 * onboarding-print / upsell-print pattern of standalone public print/review
 * surfaces. Separate track: does NOT touch /auth or its components.
 *
 * Every concept route renders its component PLUS a floating ConceptSwitcher
 * (bottom-right, mirrors the real /auth screens' StatePicker) so all 10
 * directions + the gallery are one click away — no manual URL editing, no
 * full page reload (react-router Link, client-side nav).
 *
 * URL: /auth-concepts (gallery) · /auth-concepts/:slug (one per direction)
 */
export const authConceptsRoutes = (
  <>
    <Route path="auth-concepts" element={<ConceptGallery />} />
    <Route
      path="auth-concepts/01-spotlight"
      element={<><Concept01Spotlight /><ConceptSwitcher active="01-spotlight" /></>}
    />
    <Route
      path="auth-concepts/02-blob-divide"
      element={<><Concept02BlobDivide /><ConceptSwitcher active="02-blob-divide" /></>}
    />
    <Route
      path="auth-concepts/03-reactive-companion"
      element={<><Concept03ReactiveCompanion /><ConceptSwitcher active="03-reactive-companion" /></>}
    />
    <Route
      path="auth-concepts/04-type-texture"
      element={<><Concept04TypeTexture /><ConceptSwitcher active="04-type-texture" /></>}
    />
    <Route
      path="auth-concepts/05-iridescent-ai"
      element={<><Concept05IridescentAI /><ConceptSwitcher active="05-iridescent-ai" /></>}
    />
    <Route
      path="auth-concepts/06-scattered-desk"
      element={<><Concept06ScatteredDesk /><ConceptSwitcher active="06-scattered-desk" /></>}
    />
    <Route
      path="auth-concepts/07-hand-drawn-journey"
      element={<><Concept07HandDrawnJourney /><ConceptSwitcher active="07-hand-drawn-journey" /></>}
    />
    <Route
      path="auth-concepts/08-stepper-in-scene"
      element={<><Concept08StepperInScene /><ConceptSwitcher active="08-stepper-in-scene" /></>}
    />
    <Route
      path="auth-concepts/09-minimal-mono"
      element={<><Concept09MinimalMono /><ConceptSwitcher active="09-minimal-mono" /></>}
    />
    <Route
      path="auth-concepts/10-nature-split"
      element={<><Concept10NatureSplit /><ConceptSwitcher active="10-nature-split" /></>}
    />
    <Route
      path="auth-concepts/11-liquid-glass"
      element={<><Concept11LiquidGlass /><ConceptSwitcher active="11-liquid-glass" /></>}
    />
  </>
);
