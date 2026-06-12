import { createContext, useCallback, useContext, useEffect, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

export type Plan = "full" | "ai";

interface PlanContextValue {
  plan: Plan;
  setPlan: (next: Plan) => void;
}

const PlanContext = createContext<PlanContextValue | undefined>(undefined);

const SESSION_KEY = "fabads:plan";

function readPlanFromURL(searchParams: URLSearchParams): Plan | null {
  const v = searchParams.get("plan");
  return v === "full" || v === "ai" ? v : null;
}

/**
 * A-12.203: Growth-only UI params imply the Growth ("full") plan. Some
 * surfaces exist ONLY on the Growth dashboard — e.g. the KPI customize
 * popover (`?kpi-customize=open`). A copied / exported URL carrying one of
 * these is by definition meant for Growth, so resolve to "full" even when
 * the link omits `?plan=full` and the session is empty (fresh tab /
 * incognito — which otherwise falls back to the "ai" default and renders
 * the wrong dashboard, so the popover never mounts).
 *
 * Keep this list tight: only params that genuinely cannot exist on AI.
 */
const GROWTH_ONLY_PARAMS: Array<[key: string, value: string]> = [
  ["kpi-customize", "open"],
];

function readPlanFromGrowthOnlyParams(searchParams: URLSearchParams): Plan | null {
  for (const [key, value] of GROWTH_ONLY_PARAMS) {
    if (searchParams.get(key) === value) return "full";
  }
  return null;
}

function readPlanFromSession(): Plan | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.sessionStorage.getItem(SESSION_KEY);
    return v === "full" || v === "ai" ? v : null;
  } catch {
    return null;
  }
}

function writePlanToSession(next: Plan): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_KEY, next);
  } catch {
    // sessionStorage unavailable (private mode, quota) — no-op
  }
}

/**
 * Plan provider — sessionStorage persistence with URL as deep-link override
 * (A-12.xxx — fixes "plan reverts to AI on every navigate" bug).
 *
 * Resolution order (every render):
 *   1. URL `?plan=full|ai` — canonical when present, drives deep-linking
 *   2. sessionStorage `fabads:plan` — survives navigation that drops the
 *      URL param (the cause of the original bug: `navigate("/launch")` was
 *      wiping `?plan=full` because it didn't carry the search string)
 *   3. "ai" default — fresh tabs/sessions land on AI per Maalik's intent
 *
 * `setPlan` writes BOTH sessionStorage AND the URL. The URL keeps the
 * existing shareable / back-button-aware behavior; sessionStorage prevents
 * the silent revert. A useEffect syncs whatever plan resolved on initial
 * mount back into sessionStorage, so deep-links via `?plan=full` hydrate
 * the session correctly even without a subsequent setPlan call.
 *
 * Use sessionStorage (not localStorage) because Maalik wants AI to be the
 * default surface for new tabs/sessions; only intra-session navigation
 * should preserve the toggle.
 */
export function PlanProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Resolve plan: explicit URL ?plan= wins, then a Growth-only UI param
  // (kpi-customize=open ⇒ full), then sessionStorage, then the "ai"
  // default. The growth-only check sits above session so a fresh
  // incognito tab opening an exported Growth deep-link resolves correctly.
  const plan: Plan =
    readPlanFromURL(searchParams) ??
    readPlanFromGrowthOnlyParams(searchParams) ??
    readPlanFromSession() ??
    "full";

  // Hydrate sessionStorage from the resolved plan. Covers both:
  //   - deep-link via ?plan=full (URL → session sync, so subsequent
  //     navigates that drop ?plan still resolve to "full")
  //   - first-mount default (writes "ai" so reads never miss)
  useEffect(() => {
    writePlanToSession(plan);
  }, [plan]);

  const setPlan = useCallback(
    (next: Plan) => {
      // Write session first — so even if setSearchParams batching delays
      // the URL update, sessionStorage is already authoritative.
      writePlanToSession(next);
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (next === "full") {
            sp.set("plan", "full");
          } else {
            // AI is the default; keep URLs clean (matches prior behavior).
            sp.delete("plan");
          }
          return sp;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  return (
    <PlanContext.Provider value={{ plan, setPlan }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) {
    // Fail open — full plan when used outside a provider so screens that
    // haven't been wrapped yet still render every module.
    return { plan: "full", setPlan: () => {} };
  }
  return ctx;
}
