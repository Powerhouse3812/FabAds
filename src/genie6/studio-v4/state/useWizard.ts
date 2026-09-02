import { useCallback, useState } from "react";
import type { KbInstruction } from "../data/kbInstructions";
import type { StudioMode, PerformanceSubType } from "../data/modeMatrix";

export type Category = "asset" | "ad" | "social";
export type Format = "image" | "video";
export type VideoResolution = "720p" | "1080p" | "4K";

export type Mode =
  | "scratch"
  | "create-variations"
  | "ugc-video"
  | "image-to-video"
  | "broll"
  | "bg-remover"
  | "resize"
  // FB-5752 mode-aware creative approaches (see data/modeMatrix.ts catalog).
  | "product-hero"
  | "problem-solution"
  | "offer-push"
  | "eligibility-quiz"
  | "founder-story"
  | "feature-demo";

/**
 * Industry-Insights "Create Variant" handoff payload. Captured when the user
 * starts a generation from a competitor ad — which elements to borrow + what
 * to substitute + how close to clone. (FB-5752 hero feature.)
 */
export type InsightReuseElement =
  | "hook"
  | "layout"
  | "visual-style"
  | "script"
  | "visual-direction";
export type InsightSubstitution = "product" | "brand" | "copy" | "cta";

export type AttachSource =
  | "upload"
  | "library"
  | "pinterest"
  | "brand-winner-ads"
  | "product-winner-ads"
  | "url"
  | "instruction"
  | "industry-insights"
  | "seed-image"
  | "template";

export interface AttachedRef {
  id: string;
  source: AttachSource;
  label: string;
  thumbnail?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
}

export interface WizardState {
  step: 1 | 2 | 3 | 4 | 5;
  category: Category | null;
  /** Top-level studio mode (Product Ad / Brand Ad / Product Shoot / Performance
   *  Ad / Social). Drives the mode-aware input engine (data/modeMatrix.ts):
   *  required inputs on Step 2 + offered approaches on Step 3. */
  studioMode: StudioMode | null;
  /** Performance Ad only — "What are you promoting?" 3-way split. */
  performanceSubType: PerformanceSubType | null;
  /** Brand Ad only — "Feature a product?" toggle. When true, a product may be
   *  selected and Product-Hero is surfaced among the approaches. */
  featureProduct: boolean;
  format: Format | null;
  /** Step 2 selection — XOR across brand / product / category. User picks
   *  EITHER a brand, a product, or a category — never more than one.
   *  Picking one clears the other two. */
  brandId: string | null;
  productId: string | null;
  categoryId: string | null;
  mode: Mode;
  /** Sub-type within the chosen approach (e.g. UGC Video → tutorial / unboxing
   *  / talking-head). null = approach has no sub-type or none picked yet. */
  approachSubType: string | null;
  modelId: string;
  angleId: string | null;
  /** UGC Video mode — avatar + voice picks. null = AI auto-decides. */
  avatarId: string | null;
  voiceId: string | null;
  /** Script — null = Auto (Genie writes one). String = user-provided/AI-generated. */
  script: string | null;
  prompt: string;
  uploadedFiles: UploadedFile[];
  selectedTemplateIds: string[];
  selectedLibraryIds: string[];
  selectedConceptIds: string[];
  attachedReferences: AttachedRef[];
  ctaLayout: "inline" | "footer";
  credits: number;
  count: number;
  /**
   * "Vary" amount (0–100) — how MUCH each generated output should differ from
   * the base. This is NOT the variation COUNT (that's `count`). Default 10
   * (safe, close variations). Surfaced via the Generation-settings slider on
   * the Configure screen. (Maalik MOM 06-05: "variation meter, default 10%".)
   * NOTE: not part of the credit recompute — it doesn't change output volume.
   */
  varyAmount: number;
  aspectRatio: "1:1" | "4:5" | "9:16" | "16:9";
  videoResolution: VideoResolution;
  videoAudio: boolean;
  useKnowledgeBase: boolean;
  useBrandGuidelines: boolean;
  /** User-created KB instructions (additive over the built-in defaults). */
  customKbInstructions: KbInstruction[];

  /* ── Industry Insights "Create Variant" handoff (FB-5752) ── */
  /** Source competitor ad id when the flow was started from Industry Insights.
   *  null = normal flow (not a remix). */
  insightAdId: string | null;
  /** Fidelity 0–100: 0 = Inspire (loosely borrow), 100 = Clone (match closely).
   *  Drives the brand-safety warning at high values. */
  insightFidelity: number;
  /** Which elements of the reference ad to reuse. */
  insightReuse: InsightReuseElement[];
  /** Which of the user's own assets replace the competitor's. */
  insightSubstitutions: InsightSubstitution[];
}

const INITIAL_STATE: WizardState = {
  step: 1,
  category: null,
  studioMode: null,
  performanceSubType: null,
  featureProduct: false,
  format: null,
  brandId: null,
  productId: null,
  categoryId: null,
  mode: "scratch",
  approachSubType: null,
  modelId: "genie-1.0",
  angleId: null,
  avatarId: null,
  voiceId: null,
  script: null,
  prompt: "",
  uploadedFiles: [],
  selectedTemplateIds: [],
  selectedLibraryIds: [],
  selectedConceptIds: [],
  attachedReferences: [],
  ctaLayout: "inline",
  credits: 4,
  count: 4,
  varyAmount: 10,
  aspectRatio: "1:1",
  videoResolution: "1080p",
  videoAudio: true,
  useKnowledgeBase: true,
  useBrandGuidelines: true,
  customKbInstructions: [],
  insightAdId: null,
  insightFidelity: 35,
  insightReuse: [],
  insightSubstitutions: [],
};

export interface UseWizardReturn {
  state: WizardState;
  set: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  patch: (patch: Partial<WizardState>) => void;
  next: () => void;
  back: () => void;
  goTo: (step: WizardState["step"]) => void;
  reset: () => void;
}

export function useWizard(
  initialPatch?: Partial<WizardState>,
): UseWizardReturn {
  // A-12.49 (Maalik): accept an `initialPatch` so the wizard can hydrate from
  // URL params at the very first render — no effect tick required. Used by
  // StudioAlpha to make deep links + hard refresh restore the correct step on
  // first paint (incl. for headless capture tools like HTML.to.design).
  const [state, setState] = useState<WizardState>(() =>
    initialPatch ? { ...INITIAL_STATE, ...initialPatch } : INITIAL_STATE,
  );

  const set = useCallback<UseWizardReturn["set"]>((key, value) => {
    setState((prev) => {
      const updated: WizardState = { ...prev, [key]: value };
      // Recompute credits whenever count, selectedConceptIds, videoResolution,
      // or format changes — video output has a resolution-based multiplier.
      if (
        key === "count" ||
        key === "selectedConceptIds" ||
        key === "videoResolution" ||
        key === "format"
      ) {
        const conceptCount = updated.selectedConceptIds.length;
        const variations = updated.count;
        const baseCredits = Math.max(conceptCount, 1) * variations;
        const resolutionMultiplier =
          updated.format === "video"
            ? (updated.videoResolution === "4K" ? 3
              : updated.videoResolution === "1080p" ? 1.5
              : 1)
            : 1;
        updated.credits = Math.ceil(baseCredits * resolutionMultiplier);
      }
      return updated;
    });
  }, []);

  const patch = useCallback((p: Partial<WizardState>) => {
    setState((prev) => {
      const merged: WizardState = { ...prev, ...p };
      if (
        "count" in p ||
        "selectedConceptIds" in p ||
        "videoResolution" in p ||
        "format" in p
      ) {
        const conceptCount = merged.selectedConceptIds.length;
        const variations = merged.count;
        const baseCredits = Math.max(conceptCount, 1) * variations;
        const resolutionMultiplier =
          merged.format === "video"
            ? (merged.videoResolution === "4K" ? 3
              : merged.videoResolution === "1080p" ? 1.5
              : 1)
            : 1;
        merged.credits = Math.ceil(baseCredits * resolutionMultiplier);
      }
      return merged;
    });
  }, []);

  const next = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: Math.min(5, prev.step + 1) as WizardState["step"],
    }));
  }, []);

  const back = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: Math.max(1, prev.step - 1) as WizardState["step"],
    }));
  }, []);

  const goTo = useCallback((step: WizardState["step"]) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return { state, set, patch, next, back, goTo, reset };
}
