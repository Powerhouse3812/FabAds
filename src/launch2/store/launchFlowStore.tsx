import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type Dispatch,
  type ReactNode,
} from "react";
import type {
  AdType,
  BudgetLevel,
  CopySet,
  CreativeSource,
  DistributionEntry,
  LaunchFlowState,
  LaunchMode,
  LaunchObjective,
  StrategyKey,
} from "../types";
import { makeDedupeKey, makeId } from "../lib/ids";
import { getPreset } from "../lib/strategyPresets";
import { defaultCopy } from "../mocks";

/* ───────────────────────── Default state ───────────────────────── */

export function makeInitialFlowState(): LaunchFlowState {
  return {
    mode: null,
    strategy: null,
    objective: null,
    accountIds: [],
    pageIds: [],
    pixelId: null,
    autoSpread: true,
    distribution: [],
    budgetLevel: "adset",
    dailyBudget: 10,
    optimizationEvent: null,
    audienceId: null,
    placementsAuto: true,
    scheduleStart: null,
    scheduleEnd: null,
    dayparting: false,
    useCatalogue: false,
    catalogId: null,
    productSetId: null,
    adType: "image",
    creativeSource: "library",
    creativeIds: [],
    copy: { ...defaultCopy },
    adsetCount: 5,
    creativesPerAdset: 1,
    cloneSourceId: null,
    draftId: makeId("draft"),
    dedupeKey: makeDedupeKey(),
    currentStep: 2,
    lastSavedAt: null,
  };
}

/* ───────────────────────── Actions ───────────────────────── */

export type FlowAction =
  | { type: "SET_MODE"; mode: LaunchMode }
  | { type: "SET_STRATEGY"; strategy: StrategyKey | null }
  | { type: "SET_OBJECTIVE"; objective: LaunchObjective }
  | { type: "TOGGLE_ACCOUNT"; accountId: string }
  | { type: "TOGGLE_PAGE"; pageId: string }
  | { type: "SET_PIXEL"; pixelId: string | null }
  | { type: "SET_AUTOSPREAD"; autoSpread: boolean }
  | { type: "SET_DISTRIBUTION"; distribution: DistributionEntry[] }
  | { type: "SET_BUDGET_LEVEL"; budgetLevel: BudgetLevel }
  | { type: "SET_ADTYPE"; adType: AdType }
  | { type: "SET_CREATIVE_SOURCE"; source: CreativeSource }
  | { type: "TOGGLE_CREATIVE"; creativeId: string }
  | { type: "PATCH_COPY"; copy: Partial<CopySet> }
  | { type: "SET_STEP"; step: number }
  | { type: "PATCH"; patch: Partial<LaunchFlowState> }
  | { type: "HYDRATE"; state: LaunchFlowState }
  | { type: "MARK_SAVED"; at: string }
  | { type: "RESET" };

/* ───────────────────────── Reducer ───────────────────────── */

function flowReducer(state: LaunchFlowState, action: FlowAction): LaunchFlowState {
  switch (action.type) {
    case "SET_MODE":
      return { ...state, mode: action.mode };

    case "SET_STRATEGY": {
      const preset = getPreset(action.strategy);
      if (!preset) return { ...state, strategy: null };
      // A strategy auto-configures structure + budget (all editable downstream).
      return {
        ...state,
        strategy: action.strategy,
        budgetLevel: preset.budgetLevel,
        adsetCount: preset.adsetCount,
        creativesPerAdset: preset.creativesPerAdset,
        dailyBudget: preset.perUnitBudget,
        objective: state.objective ?? preset.defaultObjective,
      };
    }

    case "SET_OBJECTIVE":
      return {
        ...state,
        objective: action.objective,
        // leaving Sales clears catalogue (catalogue is Sales-only).
        useCatalogue: action.objective === "sales" ? state.useCatalogue : false,
      };

    case "TOGGLE_ACCOUNT": {
      const has = state.accountIds.includes(action.accountId);
      const accountIds = has
        ? state.accountIds.filter((id) => id !== action.accountId)
        : [...state.accountIds, action.accountId];
      return { ...state, accountIds };
    }

    case "TOGGLE_PAGE": {
      const has = state.pageIds.includes(action.pageId);
      const pageIds = has
        ? state.pageIds.filter((id) => id !== action.pageId)
        : [...state.pageIds, action.pageId];
      return { ...state, pageIds };
    }

    case "SET_PIXEL":
      return { ...state, pixelId: action.pixelId };

    case "SET_AUTOSPREAD":
      return { ...state, autoSpread: action.autoSpread };

    case "SET_DISTRIBUTION":
      return { ...state, distribution: action.distribution };

    case "SET_BUDGET_LEVEL":
      return { ...state, budgetLevel: action.budgetLevel };

    case "SET_ADTYPE":
      return { ...state, adType: action.adType };

    case "SET_CREATIVE_SOURCE":
      return { ...state, creativeSource: action.source };

    case "TOGGLE_CREATIVE": {
      const has = state.creativeIds.includes(action.creativeId);
      const creativeIds = has
        ? state.creativeIds.filter((id) => id !== action.creativeId)
        : [...state.creativeIds, action.creativeId];
      return { ...state, creativeIds };
    }

    case "PATCH_COPY":
      return { ...state, copy: { ...state.copy, ...action.copy } };

    case "SET_STEP":
      return { ...state, currentStep: Math.max(2, Math.min(5, action.step)) };

    case "PATCH":
      return { ...state, ...action.patch };

    case "HYDRATE":
      return action.state;

    case "MARK_SAVED":
      return { ...state, lastSavedAt: action.at };

    case "RESET":
      return makeInitialFlowState();

    default:
      return state;
  }
}

/* ───────────────────────── Context + autosave ───────────────────────── */

interface FlowContextValue {
  state: LaunchFlowState;
  dispatch: Dispatch<FlowAction>;
}

const FlowContext = createContext<FlowContextValue | null>(null);

const DRAFT_PREFIX = "launch2-draft-";
const ACTIVE_DRAFT_KEY = "launch2-active-draft";

/** Serialize everything *except* lastSavedAt so autosave never self-loops. */
function fingerprint(state: LaunchFlowState): string {
  const { lastSavedAt: _omit, ...rest } = state;
  return JSON.stringify(rest);
}

export function loadDraft(draftId: string): LaunchFlowState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_PREFIX + draftId);
    return raw ? (JSON.parse(raw) as LaunchFlowState) : null;
  } catch {
    return null;
  }
}

export function loadActiveDraft(): LaunchFlowState | null {
  if (typeof window === "undefined") return null;
  const id = window.localStorage.getItem(ACTIVE_DRAFT_KEY);
  return id ? loadDraft(id) : null;
}

export function LaunchFlowProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: Partial<LaunchFlowState>;
}) {
  const [state, dispatch] = useReducer(
    flowReducer,
    undefined,
    () => ({ ...makeInitialFlowState(), ...initial })
  );

  const lastFingerprint = useRef<string>(fingerprint(state));

  // Autosave (debounced). Writes the whole draft to localStorage so a refresh
  // or crash restores 100% of the form — the zero-data-loss invariant.
  useEffect(() => {
    const fp = fingerprint(state);
    if (fp === lastFingerprint.current && state.lastSavedAt) return;
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_PREFIX + state.draftId, JSON.stringify(state));
        window.localStorage.setItem(ACTIVE_DRAFT_KEY, state.draftId);
        lastFingerprint.current = fp;
        dispatch({ type: "MARK_SAVED", at: new Date().toISOString() });
      } catch {
        /* storage full / disabled — non-fatal for the demo */
      }
    }, 500);
    return () => clearTimeout(t);
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

export function useLaunchFlow() {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error("useLaunchFlow must be used within LaunchFlowProvider");
  return ctx;
}
