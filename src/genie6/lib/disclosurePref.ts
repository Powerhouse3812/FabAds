import { useEffect, useState } from "react";

/**
 * AI-generated disclosure preference (Track 4.10 — C2PA stamp).
 *
 * Three modes:
 *   always   — every download/export carries the stamp
 *   regulated — stamp only when region detected as regulated (EU / CA / India default)
 *   never    — user accepts liability, no stamp
 *
 * Default: regulated (safe-by-default; matches major-region compliance + lets US/UK customers
 * who don't need it experience an unstamped flow).
 *
 * Phase D: actual C2PA-compliant metadata embedding on export. For now, this hook drives
 * a visible chip on outputs + a watermark badge on downloads.
 */

export type DisclosurePref = "always" | "regulated" | "never";

const STORAGE_KEY = "genie6-disclosure-pref";
const DEFAULT_PREF: DisclosurePref = "regulated";

function read(): DisclosurePref {
  if (typeof window === "undefined") return DEFAULT_PREF;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "always" || v === "regulated" || v === "never" ? v : DEFAULT_PREF;
}

export function useDisclosurePref(): {
  pref: DisclosurePref;
  setPref: (p: DisclosurePref) => void;
} {
  const [pref, setPrefState] = useState<DisclosurePref>(read);

  useEffect(() => {
    // Sync across tabs
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setPrefState(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setPref = (p: DisclosurePref) => {
    window.localStorage.setItem(STORAGE_KEY, p);
    setPrefState(p);
  };

  return { pref, setPref };
}

/**
 * Should the disclosure stamp be visible?
 * - always → yes
 * - regulated → yes (we're in India default; later this will use IP/region detection)
 * - never → no
 */
export function shouldShowDisclosure(pref: DisclosurePref): boolean {
  if (pref === "always") return true;
  if (pref === "regulated") return true; // India default = regulated for safety
  return false;
}

export const DISCLOSURE_LABELS: Record<DisclosurePref, string> = {
  always: "Always disclose",
  regulated: "Regulated regions only (EU · CA · India default)",
  never: "Never disclose",
};
