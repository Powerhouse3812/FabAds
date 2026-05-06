import { useCallback, useState } from "react";

export type Category = "asset" | "ad" | "social";
export type Format = "image" | "video";
export type Method = "scratch" | "iterate";
export type QuickMode =
  | "ugc-video"
  | "image-to-video"
  | "broll"
  | "variations"
  | "bg-remover"
  | "resize";

export interface UploadedFile {
  id: string;
  name: string;
}

export interface WizardState {
  step: 1 | 2 | 3 | 4;
  category: Category | null;
  format: Format | null;
  /** Step 2 selection — XOR with categoryId. User picks EITHER a product
   *  OR a category, never both. Picking one clears the other. */
  productId: string | null;
  categoryId: string | null;
  method: Method | null;
  modelId: string;
  angleId: string | null;
  quickMode: QuickMode | null;
  prompt: string;
  uploadedFiles: UploadedFile[];
  selectedTemplateIds: string[];
  selectedLibraryIds: string[];
  credits: number;
  count: number;
}

const INITIAL_STATE: WizardState = {
  step: 1,
  category: null,
  format: null,
  productId: null,
  categoryId: null,
  method: null,
  modelId: "genie-1.0",
  angleId: null,
  quickMode: null,
  prompt: "",
  uploadedFiles: [],
  selectedTemplateIds: [],
  selectedLibraryIds: [],
  credits: 4,
  count: 4,
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
      if (key === "count") {
        const c = value as number;
        updated.credits = c * 1;
      }
      return updated;
    });
  }, []);

  const patch = useCallback((p: Partial<WizardState>) => {
    setState((prev) => {
      const merged: WizardState = { ...prev, ...p };
      if (typeof p.count === "number") {
        merged.credits = p.count * 1;
      }
      return merged;
    });
  }, []);

  const next = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: Math.min(4, prev.step + 1) as WizardState["step"],
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
