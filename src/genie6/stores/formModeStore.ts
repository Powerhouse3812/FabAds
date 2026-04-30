import { useSyncExternalStore } from "react";
import type { FormMode } from "../generate/modeConfigs";

/**
 * formModeStore — Quick vs Advanced form-mode toggle (P-5).
 *
 * Module-level store with localStorage persistence. Default = quick (new
 * users land on the 3-field minimal form). Power users flip to advanced
 * once and the choice sticks.
 */

const STORAGE_KEY = "g6:formMode";

function readStorage(): FormMode {
  if (typeof window === "undefined") return "quick";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "advanced" ? "advanced" : "quick";
  } catch {
    return "quick";
  }
}

let mode: FormMode = readStorage();
const listeners = new Set<() => void>();

export function setFormMode(next: FormMode) {
  mode = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore quota/private-mode errors
  }
  listeners.forEach((l) => l());
}

function getSnapshot(): FormMode {
  return mode;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useFormMode(): [FormMode, (m: FormMode) => void] {
  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return [value, setFormMode];
}
