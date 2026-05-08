import { useCallback, useState } from "react";
import type { KbInstruction } from "../data/kbInstructions";

export type Category = "asset" | "ad" | "social";
export type Format = "image" | "video";

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
  | "url";

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
  aspectRatio: "1:1" | "4:5" | "9:16" | "16:9";
  useKnowledgeBase: boolean;
  useBrandGuidelines: boolean;
  /** User-created KB instructions (additive over the built-in defaults). */
  customKbInstructions: KbInstruction[];
}

const INITIAL_STATE: WizardState = {
  step: 1,
  category: null,
  format: null,
  brandId: null,
  productId: null,
  categoryId: null,
  mode: "scratch",
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
  aspectRatio: "1:1",
  useKnowledgeBase: true,
  useBrandGuidelines: true,
  customKbInstructions: [],
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

export function useWizard(): UseWizardReturn {
  const [state, setState] = useState<WizardState>(INITIAL_STATE);

  const set = useCallback<UseWizardReturn["set"]>((key, value) => {
    setState((prev) => {
      const updated: WizardState = { ...prev, [key]: value };
      // Recompute credits whenever count or selectedConceptIds change
      if (key === "count" || key === "selectedConceptIds") {
        const conceptCount = updated.selectedConceptIds.length;
        const variations = updated.count;
        updated.credits = Math.max(conceptCount, 1) * variations;
      }
      return updated;
    });
  }, []);

  const patch = useCallback((p: Partial<WizardState>) => {
    setState((prev) => {
      const merged: WizardState = { ...prev, ...p };
      if ("count" in p || "selectedConceptIds" in p) {
        const conceptCount = merged.selectedConceptIds.length;
        const variations = merged.count;
        merged.credits = Math.max(conceptCount, 1) * variations;
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
