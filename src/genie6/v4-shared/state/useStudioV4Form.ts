import { useCallback, useState } from "react";
import type { ActiveColumnInput, StudioV4Form } from "../types";

/**
 * useStudioV4Form — single source of truth for both Wizard and Flow
 * shells. Returns the full form, a partial setter, a reset, and the
 * "active column input" handle that drives the persistent right column.
 *
 * Defaults are intentionally bland: subMode "custom", path "scratch",
 * everything else empty/false/null. Callers layer smart defaults on top
 * via `useSmartDefaults`.
 */

export const DEFAULT_FORM: StudioV4Form = {
  subMode: "custom",
  path: "scratch",
  productId: null,
  brandId: null,
  output: "image",
  aspectRatios: ["1:1"],
  audienceIds: [],
  angleIds: [],
  conceptIds: [],
  brandIntensity: "moderate",
  voiceTone: null,
  modelId: null,
  scriptMode: "ai",
  scriptText: "",
  preserveLayout: false,
  preserveColors: false,
  preserveCopy: false,
  variationIntensity: "medium",
  prompt: "",
  count: 4,
  promptBarModelId: "",
};

export interface UseStudioV4FormResult {
  form: StudioV4Form;
  update: <K extends keyof StudioV4Form>(key: K, value: StudioV4Form[K]) => void;
  reset: () => void;
  activeColumnInput: ActiveColumnInput;
  setActiveColumnInput: (next: ActiveColumnInput) => void;
}

export function useStudioV4Form(
  initial?: Partial<StudioV4Form>,
): UseStudioV4FormResult {
  const [form, setForm] = useState<StudioV4Form>({
    ...DEFAULT_FORM,
    ...(initial ?? {}),
  });
  const [activeColumnInput, setActiveColumnInput] =
    useState<ActiveColumnInput>(null);

  const update = useCallback(
    <K extends keyof StudioV4Form>(key: K, value: StudioV4Form[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const reset = useCallback(() => {
    setForm({ ...DEFAULT_FORM, ...(initial ?? {}) });
    setActiveColumnInput(null);
  }, [initial]);

  return {
    form,
    update,
    reset,
    activeColumnInput,
    setActiveColumnInput,
  };
}
