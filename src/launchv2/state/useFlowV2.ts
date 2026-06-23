/**
 * useFlowV2 — the 4-step wizard state. The reducer (reducer.ts) drives the
 * "smart reduction": choosing an intent prefills structure/budget/spread;
 * choosing objective+format sets the destination + optimization defaults and
 * gates downstream. Autosaves to sessionStorage.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { AccountDistribution, AdFormat, Intent, MediaScope, NamingPatterns, Objective, PageDistribution, PlanV2, StructureCounts, TargetPair, TargetingSpec } from "../types";
import { gcNodeOverrides } from "../gcOverrides";
import {
  cascade,
  defaultBudgetMode,
  defaultDestination,
  intentDefaults,
} from "../reducer";
import { DEFAULT_PLACEMENTS, TARGETING_TEMPLATES, makeTargetV2 } from "../data";
import { templatesService } from "../templates/service";
import {
  extractDistributionPayload,
  extractSetupPayload,
} from "../templates/edits";
import type {
  DistributionTemplate,
  SetupTemplate,
} from "../templates/types";
import { loadDefaults } from "../services/defaultsService";

export type StepV2 = 1 | 2 | 3 | 4 | 5;

export interface DeepLinkState {
  plan: PlanV2;
  step: number;
  variant: 'v1' | 'v2' | 'v3';
  ui: {
    openPanels: string[];
    focusedItems: Record<string, string>;
  };
}

const SS_KEY = (id: string) => `launchv2:flow:${id}`;

function genId(): string {
  return `lv2_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function newPlanV2(): PlanV2 {
  const defaults = loadDefaults();
  const ts = new Date().toISOString();
  return {
    id: genId(),
    name: "Untitled launch",
    source: { type: null, ref: null },
    intent: defaults.intent,
    objective: null,
    format: null,
    targets: [],
    destinationType: null,
    optimizationGoal: null,
    conversionEvent: null,
    budgetMode: defaults.budgetMode,
    budgetAmount: defaults.budgetAmount,
    budgetPeriod: "daily" as const,
    bidStrategy: defaults.bidStrategy,
    bidValue: null,
    advantagePlus: defaults.advantagePlus,
    targetingTemplateId: TARGETING_TEMPLATES[0]?.id ?? null,
    advantageAudience: defaults.advantageAudience,
    advantageCreative: defaults.advantageCreative,
    specialAdCategories: [],
    specialAdDeclared: false,
    payor: "",
    beneficiary: "",
    attribution: "7d_click_1d_view",
    strategyId: null,
    catalogueToggle: false,
    catalogSelections: {},
    catalogFormat: "carousel",
    abTest: false,
    mediaScope: "individual_media" as MediaScope,
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
    carouselCards: [],
    collectionCoverCreativeId: null,
    structure: { campaigns: 1, adSetsPerCampaign: 1, adsPerAdSet: 1 },
    pageDistribution: "fill_first",
    pageWeights: {},
    namingPattern: defaults.adNamePattern,
    scheduledFor: null,
    nodeOverrides: {},
    appliedSetupTemplateId: null,
    appliedDistributionTemplateId: null,
    useExistingPostByAccount: {},
    postIdsByAccount: {},
    useCustomAudience: false,
    customAudienceId: null,
    customAudienceMode: "select",
    catalogueByAccount: {},
    productSetByAccount: {},
    catalogueAccountConfigs: {},
    placementMode: "advantage",
    placements: DEFAULT_PLACEMENTS,
    // Meeting redesign additions
    flowMode: "custom",
    fastLaunch: false,
    accountDistribution: "equal",
    accountWeights: {},
    structureByAccount: {},
    pageDistributionByAccount: {},
    distVariant: "v1",
    targeting: {
      geoLocations: {
        countries: [],
        regions: [],
        cities: [],
        zips: [],
        customLocations: [],
        geoMarkets: [],
        locationTypes: ["home"],
      },
      ageMin: 18,
      ageMax: 65,
      genders: [],
      locales: [],
      customAudiences: [],
      excludedCustomAudiences: [],
      flexibleSpec: [],
      exclusions: { interests: [], behaviors: [], demographics: [] },
      advantageAudience: true,
    },
    specialAdCountries: [],
    namingPatterns: { campaign: "", adset: "", ad: "" },
    reviewVariant: "tree",
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
  /** Restore a persisted plan + step (e.g. from localStorage on mount). */
  restorePlan: (snapshot: PlanV2, s: number) => void;
  /** Intent → prefill structure/budget/spread/bid/advantage+ (the smart reduction). */
  chooseIntent: (i: Intent) => void;
  /** Strategy preset/saved → prefill all budget+structure+spread+advantage fields. */
  chooseStrategy: (id: string | null) => void;
  /**
   * Apply a saved-setup/strategy snapshot (Step 1, strategy-first flow).
   * Runs the objective cascade FIRST (so destination/optimization defaults +
   * downstream locks are correct) then layers the snapshot's explicit values
   * on top. Sets flowMode = "template". Everything stays editable downstream.
   */
  applySavedStrategy: (snapshot: Partial<PlanV2>) => void;
  /**
   * Start-fresh / manual path (Step 1 "Custom" card). Resets flowMode to
   * "custom"; clears any prior strategy snapshot. Objective is chosen after.
   */
  chooseCustomFlow: () => void;
  /** Objective+format → set destination + optimization defaults + gate. */
  chooseObjectiveFormat: (o: Objective, f: AdFormat | null) => void;
  setTargets: (t: TargetPair[]) => void;
  reset: () => void;

  /* ── Templates v2 ─────────────────────────────────────────────────
   * Apply / unlink / save-as-new for Setup (Step 2) and Distribution (Step 4).
   * No "update existing template" — fork-only by design.
   */
  applySetupTemplate: (id: string) => void;
  unlinkSetupTemplate: () => void;
  saveCurrentSetupAsTemplate: (name: string) => SetupTemplate;

  applyDistributionTemplate: (id: string) => void;
  unlinkDistributionTemplate: () => void;
  saveCurrentDistributionAsTemplate: (name: string) => DistributionTemplate;

}

export function useFlowV2(draftId?: string, initialState?: DeepLinkState): UseFlowV2 {
  const [plan, setPlan] = useState<PlanV2>(() => {
    // Priority: ?s= deep-link > sessionStorage draft > fresh plan
    if (initialState?.plan) {
      return initialState.plan;
    }
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
  const [step, setStepState] = useState<StepV2>(() => (initialState?.step as StepV2) ?? 1);

  // ── Cross-tab sync via BroadcastChannel ───────────────────────────
  const channel = useRef<BroadcastChannel | null>(null);
  /** True while applying an incoming broadcast — prevents re-broadcasting. */
  const isBroadcastUpdate = useRef(false);

  useEffect(() => {
    const bc = new BroadcastChannel("fabads_launchv2_sync");
    channel.current = bc;

    bc.onmessage = (evt: MessageEvent) => {
      if (
        evt.data?.type === "plan-update" &&
        evt.data?.planId === plan.id
      ) {
        isBroadcastUpdate.current = true;
        setPlan(evt.data.plan as PlanV2);
        isBroadcastUpdate.current = false;
      }
    };

    return () => {
      bc.close();
      channel.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount/unmount only — plan.id is stable after mount

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

  const SHAPE_KEYS = ["structure", "targets", "spread"] as const;
  const patch = useCallback((updates: Partial<PlanV2>) => {
    setPlan((prev) => {
      const merged: PlanV2 = { ...prev, ...updates };
      const needsGC =
        (SHAPE_KEYS as readonly string[]).some((k) => k in updates) ||
        (updates.nodeOverrides !== undefined &&
          Object.values(updates.nodeOverrides).some((f) => "adsPerAdSet" in f));
      const newPlan = needsGC ? gcNodeOverrides(merged) : merged;

      // Broadcast to other tabs (skip if this update itself came from a broadcast)
      if (!isBroadcastUpdate.current) {
        channel.current?.postMessage({
          type: "plan-update",
          planId: newPlan.id,
          plan: newPlan,
        });
      }

      return newPlan;
    });
  }, []);

  const chooseIntent = useCallback((i: Intent) => {
    setPlan((prev) => {
      const d = intentDefaults(i, prev.objective);
      return gcNodeOverrides({
        ...prev,
        intent: i,
        budgetMode: d.budgetMode,
        spread: d.spread,
        bidStrategy: d.bidStrategy,
        structure: { ...d.structure },
        advantagePlus: d.advantagePlus,
        budgetAmount: d.budgetAmount,
      });
    });
  }, []);

  const chooseStrategy = useCallback((id: string | null) => {
    setPlan((prev) => {
      if (!id) return { ...prev, strategyId: null, intent: "custom" as Intent };
      const intentMap: Record<string, Intent> = {
        preset_test: "test",
        preset_scale: "scale",
      };
      const mappedIntent = intentMap[id] as Intent | undefined;
      if (mappedIntent) {
        const d = intentDefaults(mappedIntent, prev.objective);
        return gcNodeOverrides({
          ...prev,
          strategyId: id,
          intent: mappedIntent,
          budgetMode: d.budgetMode,
          spread: d.spread,
          bidStrategy: d.bidStrategy,
          structure: { ...d.structure },
          advantagePlus: d.advantagePlus,
          budgetAmount: d.budgetAmount,
        });
      }
      return { ...prev, strategyId: id };
    });
  }, []);

  const applySavedStrategy = useCallback((snapshot: Partial<PlanV2>) => {
    setPlan((prev) => {
      // 1) Establish objective from the snapshot (or keep prior) and run the
      //    SAME cascade chooseObjectiveFormat uses so destination + optimization
      //    defaults + downstream locks resolve correctly.
      const objective = (snapshot.objective ?? prev.objective) as Objective | null;
      let cascaded: Partial<PlanV2> = {};
      if (objective) {
        const fallback = defaultDestination(objective);
        // Snapshot destination wins when present (it's already a valid Meta pick);
        // else fall back to the objective default.
        const dest = snapshot.destinationType ?? fallback;
        const c = cascade(objective, dest);
        cascaded = {
          objective,
          destinationType: dest,
          optimizationGoal: c.lockedGoal ?? c.optimizationGoals[0] ?? null,
          conversionEvent: null,
          budgetMode: defaultBudgetMode(objective, snapshot.intent ?? prev.intent),
        };
      }
      // 2) Layer the snapshot's explicit values on TOP of the cascade so the
      //    template's budget/structure/spread/bid/etc. take precedence, while
      //    keeping cascade-derived destination/optimization where the snapshot
      //    is silent. flowMode flips to "template"; everything stays editable.
      return gcNodeOverrides({
        ...prev,
        ...cascaded,
        ...snapshot,
        objective: objective ?? prev.objective,
        flowMode: "template",
        name:
          prev.name === "Untitled launch" && objective
            ? `${objective.replace("OUTCOME_", "").toLowerCase()} launch`
            : prev.name,
      });
    });
  }, []);

  const chooseCustomFlow = useCallback(() => {
    setPlan((prev) => ({
      ...prev,
      flowMode: "custom",
      // Clear any strategy linkage from a prior template pick. Objective is left
      // as-is so re-selecting Custom doesn't wipe an objective the user kept.
      strategyId: null,
    }));
  }, []);

  const chooseObjectiveFormat = useCallback((o: Objective, f: AdFormat | null) => {
    setPlan((prev) => {
      const tpl = prev.targetingTemplateId
        ? TARGETING_TEMPLATES.find((t) => t.id === prev.targetingTemplateId)
        : undefined;
      // Prefer template's destinationType when it is valid for this objective.
      const fallback = defaultDestination(o);
      const dest = tpl?.destinationType ?? fallback;
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
  const next = useCallback(() => setStepState((s) => Math.min(5, s + 1) as StepV2), []);
  const back = useCallback(() => setStepState((s) => Math.max(1, s - 1) as StepV2), []);
  const restorePlan = useCallback((snapshot: PlanV2, s: number) => {
    setPlan(snapshot);
    setStepState(s as StepV2);
  }, []);
  const reset = useCallback(() => {
    setPlan(newPlanV2());
    setStepState(1);
  }, []);

  /* ── Templates v2: Setup ──────────────────────────────────────── */
  const applySetupTemplate = useCallback((id: string) => {
    const tpl = templatesService.getSetup(id);
    if (!tpl) return;
    const p = tpl.payload;
    setPlan((prev) => {
      // Re-hydrate destinations → TargetPair[] via the existing mock.
      const nextTargets: TargetPair[] = [];
      for (const d of p.destinations) {
        for (const pageId of d.pageIds) {
          const t = makeTargetV2(d.accountId, pageId);
          if (t) nextTargets.push({ ...t, pixelId: d.pixelId ?? t.pixelId });
        }
      }
      const budget =
        p.campaign.dailyBudget ?? p.campaign.lifetimeBudget ?? prev.budgetAmount;
      return gcNodeOverrides({
        ...prev,
        targets: nextTargets.length ? nextTargets : prev.targets,
        objective: p.campaign.objective ?? prev.objective,
        format: p.campaign.format ?? prev.format,
        intent: p.campaign.intent,
        budgetMode: p.campaign.budgetMode,
        advantagePlus: p.campaign.advantagePlus,
        bidStrategy: p.campaign.bidStrategy,
        budgetAmount: budget,
        optimizationGoal: p.adset.optimizationGoal ?? prev.optimizationGoal,
        destinationType: p.adset.destinationType ?? prev.destinationType,
        conversionEvent: p.adset.conversionEvent,
        specialAdCategories: [...p.adset.specialAdCategory],
        attribution: p.adset.attribution,
        advantageAudience: p.audience.advantageAudience,
        advantageCreative: p.audience.advantageCreative,
        // Audience values populate inline; clear the legacy targetingTemplateId
        // so the inline snapshot wins and Setup-template diffs are accurate.
        targetingTemplateId: null,
        appliedSetupTemplateId: tpl.id,
      });
    });
  }, []);

  const unlinkSetupTemplate = useCallback(() => {
    setPlan((prev) => ({ ...prev, appliedSetupTemplateId: null }));
  }, []);

  const saveCurrentSetupAsTemplate = useCallback(
    (name: string): SetupTemplate => {
      const payload = extractSetupPayload(plan);
      const saved = templatesService.saveSetup(name, payload);
      setPlan((prev) => ({ ...prev, appliedSetupTemplateId: saved.id }));
      return saved;
    },
    [plan],
  );

  /* ── Templates v2: Distribution ───────────────────────────────── */
  const applyDistributionTemplate = useCallback((id: string) => {
    const tpl = templatesService.getDistribution(id);
    if (!tpl) return;
    const p = tpl.payload;
    setPlan((prev) => gcNodeOverrides({
      ...prev,
      structure: { ...p.structure },
      spread: p.spread,
      pageDistribution: p.pageDistribution,
      adCopy: { ...prev.adCopy, utmTemplate: p.utmTemplate },
      appliedDistributionTemplateId: tpl.id,
    }));
  }, []);

  const unlinkDistributionTemplate = useCallback(() => {
    setPlan((prev) => ({ ...prev, appliedDistributionTemplateId: null }));
  }, []);

  const saveCurrentDistributionAsTemplate = useCallback(
    (name: string): DistributionTemplate => {
      const payload = extractDistributionPayload(plan);
      const saved = templatesService.saveDistribution(name, payload);
      setPlan((prev) => ({ ...prev, appliedDistributionTemplateId: saved.id }));
      return saved;
    },
    [plan],
  );

  return {
    plan,
    step,
    setStep,
    next,
    back,
    patch,
    restorePlan,
    chooseIntent,
    chooseStrategy,
    applySavedStrategy,
    chooseCustomFlow,
    chooseObjectiveFormat,
    setTargets,
    reset,
    applySetupTemplate,
    unlinkSetupTemplate,
    saveCurrentSetupAsTemplate,
    applyDistributionTemplate,
    unlinkDistributionTemplate,
    saveCurrentDistributionAsTemplate,
  };
}
