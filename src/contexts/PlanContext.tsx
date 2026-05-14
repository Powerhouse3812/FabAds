import { createContext, useContext, useState, type ReactNode } from "react";

export type Plan = "full" | "ai";

interface PlanContextValue {
  plan: Plan;
  setPlan: (next: Plan) => void;
}

const PlanContext = createContext<PlanContextValue | undefined>(undefined);

/**
 * Plan provider. In-memory only — resets on refresh (per Maalik). The
 * "full" plan shows every module in the nav rail; the "ai" plan hides
 * Reports / Launch / Automation, leaving an AI-generation-focused
 * surface (Dashboard, Industry Insights, Genie, Catalogue, Creative
 * Library, Video Sage, Copilot, Brand Book, Onboarding).
 *
 * The toggle lives at the bottom of the nav rail (above the
 * NotificationBell) — see PlanShiftToggle.
 */
export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<Plan>("full");
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
