/**
 * useLaunch2Flow — wizard state for the 5-step guided launch flow.
 *
 * Owns the in-progress LaunchPlan + the current step. Autosaves (debounced) to
 * the service draft store AND sessionStorage so a refresh mid-flow restores the
 * draft. Strategy selection patches the structure / budget / objective from the
 * chosen playbook.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AdType,
  AllocationMode,
  DistributionStrategy,
  LaunchMode,
  LaunchPlan,
  LaunchTarget,
  LaunchTemplate,
  Objective,
  SpecialAdCategory,
  StrategyId,
} from "../types";
import { getStrategy } from "../data/strategies";
import { metaLaunchService } from "../services/mockMetaLaunchService";

export type FlowStep = 1 | 2 | 3 | 4 | 5;

const SS_KEY = (id: string) => `launch2:flow:${id}`;

function genId(): string {
  return `plan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function newPlan(): LaunchPlan {
  const ts = new Date().toISOString();
  return {
    id: genId(),
    name: "Untitled launch",
    mode: "custom",
    strategyId: null,
    objective: null,
    targets: [],
    distribution: "fill-first",
    audienceLabel: null,
    catalogueId: null,
    productSetId: null,
    budgetPerAdSet: 1,
    adType: "single-image",
    creatives: [],
    structure: { campaigns: 1, adSetsPerCampaign: 1, adsPerAdSet: 1 },
    allocation: "distribute",
    creativeSlotMap: {},
    destinationUrl: "",
    displayLink: null,
    utmTemplate: "utm_source=facebook&utm_medium=paid&utm_campaign={{campaign}}&utm_content={{adset}}",
    specialAdCategories: [],
    namingPattern: "{brand}_{strategy}_{objective}_{date}",
    templateId: null,
    scheduledFor: null,
    createdAt: ts,
    updatedAt: ts,
  };
}

export interface UseLaunch2FlowReturn {
  plan: LaunchPlan;
  step: FlowStep;
  patch: (p: Partial<LaunchPlan>) => void;
  setStep: (s: FlowStep) => void;
  next: () => void;
  back: () => void;
  /** Choose a strategy → hydrate structure / budget / objective from the playbook. */
  chooseStrategy: (id: StrategyId) => void;
  setMode: (m: LaunchMode) => void;
  setObjective: (o: Objective) => void;
  setDistribution: (d: DistributionStrategy) => void;
  setTargets: (t: LaunchTarget[]) => void;
  setAdType: (t: AdType) => void;
  setAllocation: (a: AllocationMode) => void;
  setDestinationUrl: (u: string) => void;
  setUtmTemplate: (u: string) => void;
  setSpecialAdCategories: (c: SpecialAdCategory[]) => void;
  /** Apply a saved Targeting Template onto the plan. */
  applyTemplate: (t: LaunchTemplate) => void;
  reset: () => void;
}

export function useLaunch2Flow(draftId?: string): UseLaunch2FlowReturn {
  const [plan, setPlan] = useState<LaunchPlan>(() => {
    if (draftId) {
      const existing = metaLaunchService.getDraft(draftId);
      if (existing) return { ...existing };
      try {
        const raw = sessionStorage.getItem(SS_KEY(draftId));
        if (raw) return JSON.parse(raw) as LaunchPlan;
      } catch {
        /* ignore */
      }
    }
    return newPlan();
  });
  const [step, setStepState] = useState<FlowStep>(1);

  // Debounced autosave → draft store + sessionStorage.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const stamped = { ...plan, updatedAt: new Date().toISOString() };
      metaLaunchService.saveDraft(stamped);
      try {
        sessionStorage.setItem(SS_KEY(plan.id), JSON.stringify(stamped));
      } catch {
        /* ignore quota */
      }
    }, 600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [plan]);

  const patch = useCallback((p: Partial<LaunchPlan>) => {
    setPlan((prev) => ({ ...prev, ...p }));
  }, []);

  const chooseStrategy = useCallback((id: StrategyId) => {
    const s = getStrategy(id);
    if (!s) return;
    setPlan((prev) => ({
      ...prev,
      strategyId: id,
      objective: prev.objective ?? s.objective,
      structure: { ...s.structure },
      budgetPerAdSet: s.budgetPerAdSet,
      name: prev.name === "Untitled launch" ? `${s.name} launch` : prev.name,
    }));
  }, []);

  const setStep = useCallback((s: FlowStep) => setStepState(s), []);
  const next = useCallback(() => setStepState((s) => (Math.min(5, s + 1) as FlowStep)), []);
  const back = useCallback(() => setStepState((s) => (Math.max(1, s - 1) as FlowStep)), []);
  const setMode = useCallback((m: LaunchMode) => patch({ mode: m }), [patch]);
  const setObjective = useCallback((o: Objective) => patch({ objective: o }), [patch]);
  const setDistribution = useCallback((d: DistributionStrategy) => patch({ distribution: d }), [patch]);
  const setTargets = useCallback((t: LaunchTarget[]) => patch({ targets: t }), [patch]);
  const setAdType = useCallback((t: AdType) => patch({ adType: t }), [patch]);
  const setAllocation = useCallback((a: AllocationMode) => patch({ allocation: a }), [patch]);
  const setDestinationUrl = useCallback((u: string) => patch({ destinationUrl: u }), [patch]);
  const setUtmTemplate = useCallback((u: string) => patch({ utmTemplate: u }), [patch]);
  const setSpecialAdCategories = useCallback(
    (c: SpecialAdCategory[]) => patch({ specialAdCategories: c }),
    [patch],
  );
  const applyTemplate = useCallback((t: LaunchTemplate) => {
    setPlan((prev) => {
      const s = t.strategyId ? getStrategy(t.strategyId) : undefined;
      return {
        ...prev,
        templateId: t.id,
        strategyId: t.strategyId ?? prev.strategyId,
        objective: t.objective ?? prev.objective,
        audienceLabel: t.audienceLabel ?? prev.audienceLabel,
        distribution: t.distribution,
        specialAdCategories: t.specialAdCategories,
        budgetPerAdSet: t.budgetPerAdSet,
        structure: s ? { ...s.structure } : prev.structure,
        name: prev.name === "Untitled launch" && s ? `${s.name} launch` : prev.name,
      };
    });
  }, []);
  const reset = useCallback(() => {
    setPlan(newPlan());
    setStepState(1);
  }, []);

  return {
    plan,
    step,
    patch,
    setStep,
    next,
    back,
    chooseStrategy,
    setMode,
    setObjective,
    setDistribution,
    setTargets,
    setAdType,
    setAllocation,
    setDestinationUrl,
    setUtmTemplate,
    setSpecialAdCategories,
    applyTemplate,
    reset,
  };
}
