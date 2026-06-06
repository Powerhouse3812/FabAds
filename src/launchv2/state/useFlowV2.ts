/**
 * useFlowV2 — the 4-step wizard state. The reducer (reducer.ts) drives the
 * "smart reduction": choosing an intent prefills structure/budget/spread;
 * choosing objective+format sets the destination + optimization defaults and
 * gates downstream. Autosaves to sessionStorage.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { AdFormat, Intent, Objective, PlanV2, TargetPair } from "../types";
import {
  cascade,
  defaultBudgetMode,
  defaultDestination,
  intentDefaults,
} from "../reducer";
import { TARGETING_TEMPLATES } from "../data";

export type StepV2 = 1 | 2 | 3 | 4;
const SS_KEY = (id: string) => `launchv2:flow:${id}`;

function genId(): string {
  return `lv2_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function newPlanV2(): PlanV2 {
  const ts = new Date().toISOString();
  return {
    id: genId(),
    name: "Untitled launch",
    source: { type: null, ref: null },
    intent: "custom",
    objective: null,
    format: null,
    targets: [],
    destinationType: null,
    optimizationGoal: null,
    conversionEvent: null,
    budgetMode: "ABO",
    budgetAmount: 20,
    bidStrategy: "LOWEST_COST_WITHOUT_CAP",
    bidValue: null,
    advantagePlus: false,
    targetingTemplateId: TARGETING_TEMPLATES[0]?.id ?? null,
    advantageAudience: true,
    advantageCreative: true,
    specialAdCategories: [],
    creatives: [
      {
        id: "pre_cr_001",
        name: "Mamaearth — Summer Glow Campaign",
        format: "single_image" as const,
        source: "library" as const,
        thumbnail: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80",
        itemType: "media" as const,
      },
      {
        id: "pre_cr_002",
        name: "boAt Wireless — Freedom Spot",
        format: "single_image" as const,
        source: "library" as const,
        thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
        itemType: "media" as const,
      },
      {
        id: "pre_cr_003",
        name: "Sleepyhead — Deep Rest Video",
        format: "single_video" as const,
        source: "genie" as const,
        thumbnail: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=400&q=80",
        itemType: "media" as const,
      },
    ],
    spread: "one_per_adset",
    creativeSlotMap: {},
    combination: "paired",
    adCopy: {
      primaryText: "Discover the difference quality makes. Crafted for people who expect more.",
      headline: "Premium quality at an honest price",
      description: "",
      cta: "SHOP_NOW",
      destinationUrl: "",
      displayLink: "",
      utmTemplate: "utm_source=facebook&utm_medium=paid&utm_campaign={{campaign}}&utm_content={{adset}}",
    },
    copyOverrides: {},
    structure: { campaigns: 1, adSetsPerCampaign: 1, adsPerAdSet: 1 },
    pageDistribution: "fill_first",
    namingPattern: "{brand}_{intent}_{objective}_{date}",
    scheduledFor: null,
    createdAt: ts,
    updatedAt: ts,
  };
}

export interface UseFlowV2 {
  plan: PlanV2;
  step: StepV2;
  setStep: (s: StepV2) => void;
  next: () => void;
  back: () => void;
  patch: (p: Partial<PlanV2>) => void;
  /** Intent → prefill structure/budget/spread/bid/advantage+ (the smart reduction). */
  chooseIntent: (i: Intent) => void;
  /** Objective+format → set destination + optimization defaults + gate. */
  chooseObjectiveFormat: (o: Objective, f: AdFormat | null) => void;
  setTargets: (t: TargetPair[]) => void;
  reset: () => void;
}

export function useFlowV2(draftId?: string): UseFlowV2 {
  const [plan, setPlan] = useState<PlanV2>(() => {
    if (draftId) {
      try {
        const raw = sessionStorage.getItem(SS_KEY(draftId));
        if (raw) return JSON.parse(raw) as PlanV2;
      } catch {
        /* ignore */
      }
    }
    return newPlanV2();
  });
  const [step, setStepState] = useState<StepV2>(1);

  // autosave
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        sessionStorage.setItem(SS_KEY(plan.id), JSON.stringify({ ...plan, updatedAt: new Date().toISOString() }));
      } catch {
        /* ignore */
      }
    }, 500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [plan]);

  const patch = useCallback((p: Partial<PlanV2>) => setPlan((prev) => ({ ...prev, ...p })), []);

  const chooseIntent = useCallback((i: Intent) => {
    setPlan((prev) => {
      const d = intentDefaults(i, prev.objective);
      return {
        ...prev,
        intent: i,
        budgetMode: d.budgetMode,
        spread: d.spread,
        bidStrategy: d.bidStrategy,
        structure: { ...d.structure },
        advantagePlus: d.advantagePlus,
        budgetAmount: d.budgetAmount,
      };
    });
  }, []);

  const chooseObjectiveFormat = useCallback((o: Objective, f: AdFormat | null) => {
    setPlan((prev) => {
      const dest = defaultDestination(o);
      const c = cascade(o, dest);
      return {
        ...prev,
        objective: o,
        format: f,
        destinationType: dest,
        optimizationGoal: c.lockedGoal ?? c.optimizationGoals[0] ?? null,
        conversionEvent: null,
        budgetMode: defaultBudgetMode(o, prev.intent),
        name: prev.name === "Untitled launch" ? `${o.replace("OUTCOME_", "").toLowerCase()} launch` : prev.name,
      };
    });
  }, []);

  const setTargets = useCallback((t: TargetPair[]) => patch({ targets: t }), [patch]);
  const setStep = useCallback((s: StepV2) => setStepState(s), []);
  const next = useCallback(() => setStepState((s) => Math.min(4, s + 1) as StepV2), []);
  const back = useCallback(() => setStepState((s) => Math.max(1, s - 1) as StepV2), []);
  const reset = useCallback(() => {
    setPlan(newPlanV2());
    setStepState(1);
  }, []);

  return { plan, step, setStep, next, back, patch, chooseIntent, chooseObjectiveFormat, setTargets, reset };
}
