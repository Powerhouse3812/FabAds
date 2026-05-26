import { createContext, useContext, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

export type Plan = "full" | "ai";

interface PlanContextValue {
  plan: Plan;
  setPlan: (next: Plan) => void;
}

const PlanContext = createContext<PlanContextValue | undefined>(undefined);

/**
 * Plan provider — URL is the source of truth (A-12.189).
 *
 * Maalik flagged two issues:
 *   1. Toggling Full ↔ AI didn't change the URL — no deep-link, no back
 *      button parity, no reload-safety.
 *   2. Opening /dashboard from a fresh tab booted into the "full" plan
 *      because the old `useState<Plan>("full")` defaulted there. He
 *      expected AI plan to be the default surface.
 *
 * Fix: the `?plan=ai|full` query param drives state. No local useState
 * — `plan` is derived from `searchParams.get("plan")` on every render,
 * so URL and UI can't drift.
 *
 *   no `?plan`      → AI  (default — Maalik's primary working surface)
 *   `?plan=full`    → Full plan
 *   `?plan=ai`      → AI (accepted but stripped on write — cleaner URLs)
 *
 * `setPlan("full")` writes `?plan=full`; `setPlan("ai")` strips the
 * param entirely. Both use `replace: false` so the browser back button
 * navigates between plan states.
 *
 * The "full" plan shows every module in the nav rail; the "ai" plan
 * hides Reports / Launch / Automation, leaving an AI-generation-focused
 * surface (Dashboard, Industry Insights, Genie, Catalogue, Creative
 * Library, Video Sage, Copilot, Brand Book, Onboarding).
 *
 * The toggle lives at the bottom of the nav rail — see PlanShiftToggle.
 */
export function PlanProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const plan: Plan = searchParams.get("plan") === "full" ? "full" : "ai";

  const setPlan = (next: Plan) => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (next === "full") {
          sp.set("plan", "full");
        } else {
          // AI is the default — strip the param so URLs stay clean.
          sp.delete("plan");
        }
        return sp;
      },
      { replace: false },
    );
  };

  return (
    <PlanContext.Provider value={{ plan, setPlan }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) {
    // Fail open — treat as full plan when used outside a provider so
    // existing screens that haven't been wrapped yet still render
    // every module.
    return { plan: "full", setPlan: () => {} };
  }
  return ctx;
}
