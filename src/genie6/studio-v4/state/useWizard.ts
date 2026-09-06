import { useCallback, useState } from "react";
import { DEFAULT_LANGUAGE } from "../../lib/languages";
import { computeBreakdown, type CreditLine } from "../../lib/credits";
import { MODEL_CREDIT_MULTIPLIER, MODEL_LABEL } from "../data/modelPricing";
import type { KbInstruction } from "../data/kbInstructions";

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
  | "resize";

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
  /**
   * Output language of the ad (§5 — "Language selector added to Configure").
   * A code from src/genie6/lib/languages.ts, not a display name, so the
   * selector, the URL (?lang=) and the batch config all carry one value.
   */
  language: string;
  /**
   * §9 bulk product selection — applies to Category Ad and Product Ad.
   * Selecting N products produces ONE ad containing all of them, NOT N
   * separate ads. `productId` stays the hero; these are the co-stars.
   * Empty = single-product ad.
   */
  bulkProductIds: string[];
  /**
   * §21.2 — Product Shoot must accept a brand plus ONE UPLOADED IMAGE, not
   * only a Catalogue product, for brands whose product isn't in the Catalogue
   * yet and for one-offs. When set, Step 2 is satisfied by brand + image and
   * the Overview card must stop gating "Ready to generate" on a product id.
   */
  uploadedProductImage: string | null;
  /**
   * §21.2 — script is a GATED pre-step for every script-led approach:
   * generate → review → edit → approve → then generate the ad. Generate stays
   * disabled until this is true. At 30-40 min per video an unseen auto-script
   * is an expensive mistake. `skipScriptReview` is the explicit power-user
   * escape, and it satisfies the gate on its own.
   */
  scriptApproved: boolean;
  skipScriptReview: boolean;
  videoResolution: VideoResolution;
  videoAudio: boolean;
  useKnowledgeBase: boolean;
  useBrandGuidelines: boolean;
  /** User-created KB instructions (additive over the built-in defaults). */
  customKbInstructions: KbInstruction[];
}

export const INITIAL_STATE: WizardState = {
  step: 1,
  category: null,
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
  language: DEFAULT_LANGUAGE,
  bulkProductIds: [],
  uploadedProductImage: null,
  scriptApproved: false,
  skipScriptReview: false,
  videoResolution: "1080p",
  videoAudio: true,
  useKnowledgeBase: true,
  useBrandGuidelines: true,
  customKbInstructions: [],
};

/**
 * §21.2 "Credits need a breakdown, not just a number" — Configure said
 * `Generate (4 credits)` while the Results edit bar said `Generate (24
 * credits)`, a 6× jump with no explanation. This builds the EXACT line list
 * that `computeBreakdown()` (src/genie6/lib/credits.ts) turns into the
 * charged total, so the number shown on the Generate button and the number
 * actually charged can never diverge — both this recompute and
 * PromptReferenceBar's hover/click breakdown call this same function.
 *
 * Axes: outputs × concepts × model × quality. Model multiplier comes from
 * MODEL_CREDIT_MULTIPLIER (PromptReferenceBar.tsx — one roster, not a second
 * copy). Quality (video-only) reuses the existing resolution multiplier;
 * WizardState has no separate "duration" field, so resolution stands in for
 * it here — see the doc comment on `videoResolution`.
 */
export function buildCreditLines(state: WizardState): CreditLine[] {
  const conceptFactor = Math.max(state.selectedConceptIds.length, 1);
  const modelMultiplier = MODEL_CREDIT_MULTIPLIER[state.modelId] ?? 1;
  const modelName = MODEL_LABEL[state.modelId] ?? state.modelId;

  const lines: CreditLine[] = [
    { label: "Outputs", factor: state.count, op: "base" },
    {
      label: "Concepts",
      factor: conceptFactor,
      op: "multiply",
      note: `${conceptFactor} concept${conceptFactor === 1 ? "" : "s"}`,
    },
    { label: "Model", factor: modelMultiplier, op: "multiply", note: modelName },
  ];

  if (state.format === "video") {
    const resolutionMultiplier =
      // Integer factors only — must match batchDisplay.ts's copy of this
      // formula; a fractional per-item rate rounds differently in the run
      // store and Configure/Library end up quoting two figures.
      state.videoResolution === "4K" ? 3 : state.videoResolution === "1080p" ? 2 : 1;
    lines.push({
      label: "Quality",
      factor: resolutionMultiplier,
      op: "multiply",
      note: state.videoResolution,
    });
  }

  return lines;
}

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
      // format, or modelId changes — model is one of the four priced axes
      // (§21.2) and was previously missing from this trigger list entirely,
      // so switching models never updated the displayed number.
      if (
        key === "count" ||
        key === "selectedConceptIds" ||
        key === "videoResolution" ||
        key === "format" ||
        key === "modelId"
      ) {
        updated.credits = computeBreakdown(buildCreditLines(updated)).total;
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
        "format" in p ||
        "modelId" in p
      ) {
        merged.credits = computeBreakdown(buildCreditLines(merged)).total;
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
