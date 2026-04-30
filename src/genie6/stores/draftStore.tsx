import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from "react";
import type { ModeId, OutputType } from "../types/output";

export interface DraftState {
  mode: ModeId | null;
  subMethod: string | null;
  outputType: OutputType | null;   // Track 4.2 — universal output type field
  brandId: string | null;
  productIds: string[];
  audienceFreeform: string;
  angle: string | null;
  tone: string | null;
  format: string;
  count: number;
  prompt: string;
  briefText: string;
  references: string[];
  sourceImageUrl: string | null;
  avatarId: string | null;
  voiceId: string | null;
  script: string;
  conceptId: string | null;
  sceneId: string | null;             // P-3: visual scene/composition (image modes)
  sourceUrl: string;
  wizardStep: number;
}

type DraftAction =
  | { type: "SET_MODE"; mode: ModeId }
  | { type: "SET_SUBMETHOD"; subMethod: string }
  | { type: "SET_OUTPUT_TYPE"; outputType: OutputType }
  | { type: "SET_BRAND"; brandId: string | null }
  | { type: "TOGGLE_PRODUCT"; productId: string }
  | { type: "SET_AUDIENCE"; audienceFreeform: string }
  | { type: "SET_ANGLE"; angle: string | null }
  | { type: "SET_TONE"; tone: string }
  | { type: "SET_FORMAT"; format: string }
  | { type: "SET_COUNT"; count: number }
  | { type: "SET_PROMPT"; prompt: string }
  | { type: "SET_BRIEF"; briefText: string }
  | { type: "SET_SOURCE_URL"; sourceUrl: string }
  | { type: "SET_SOURCE_IMAGE"; sourceImageUrl: string | null }
  | { type: "SET_AVATAR"; avatarId: string | null }
  | { type: "SET_VOICE"; voiceId: string | null }
  | { type: "SET_SCRIPT"; script: string }
  | { type: "SET_CONCEPT"; conceptId: string | null }
  | { type: "SET_SCENE"; sceneId: string | null }
  | { type: "ADD_REFERENCE"; url: string }
  | { type: "REMOVE_REFERENCE"; index: number }
  | { type: "SET_WIZARD_STEP"; step: number }
  | { type: "RESET" }
  | { type: "PATCH"; patch: Partial<DraftState> };

const defaultDraft: DraftState = {
  mode: null,
  subMethod: null,
  outputType: null,
  brandId: null,
  productIds: [],
  audienceFreeform: "",
  angle: null,
  tone: "Premium",
  format: "4:5",
  count: 5,
  prompt: "",
  briefText: "",
  references: [],
  sourceImageUrl: null,
  avatarId: null,
  voiceId: null,
  script: "",
  conceptId: null,
  sceneId: null,
  sourceUrl: "",
  wizardStep: 1,
};

function draftReducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case "SET_MODE":
      return { ...defaultDraft, mode: action.mode, wizardStep: 1 };
    case "SET_SUBMETHOD":
      return { ...state, subMethod: action.subMethod };
    case "SET_OUTPUT_TYPE":
      return { ...state, outputType: action.outputType };
    case "SET_BRAND":
      return { ...state, brandId: action.brandId, productIds: [] };
    case "TOGGLE_PRODUCT":
      return {
        ...state,
        productIds: state.productIds.includes(action.productId)
          ? state.productIds.filter((id) => id !== action.productId)
          : [...state.productIds, action.productId],
      };
    case "SET_AUDIENCE":
      return { ...state, audienceFreeform: action.audienceFreeform };
    case "SET_ANGLE":
      return { ...state, angle: action.angle };
    case "SET_TONE":
      return { ...state, tone: action.tone };
    case "SET_FORMAT":
      return { ...state, format: action.format };
    case "SET_COUNT":
      return { ...state, count: action.count };
    case "SET_PROMPT":
      return { ...state, prompt: action.prompt };
    case "SET_BRIEF":
      return { ...state, briefText: action.briefText };
    case "SET_SOURCE_URL":
      return { ...state, sourceUrl: action.sourceUrl };
    case "SET_SOURCE_IMAGE":
      return { ...state, sourceImageUrl: action.sourceImageUrl };
    case "SET_AVATAR":
      return { ...state, avatarId: action.avatarId };
    case "SET_VOICE":
      return { ...state, voiceId: action.voiceId };
    case "SET_SCRIPT":
      return { ...state, script: action.script };
    case "SET_CONCEPT":
      return { ...state, conceptId: action.conceptId };
    case "SET_SCENE":
      return { ...state, sceneId: action.sceneId };
    case "ADD_REFERENCE":
      return { ...state, references: [...state.references, action.url] };
    case "REMOVE_REFERENCE":
      return {
        ...state,
        references: state.references.filter((_, i) => i !== action.index),
      };
    case "SET_WIZARD_STEP":
      return { ...state, wizardStep: action.step };
    case "RESET":
      return defaultDraft;
    case "PATCH":
      return { ...state, ...action.patch };
    default:
      return state;
  }
}

interface DraftContextValue {
  draft: DraftState;
  dispatch: Dispatch<DraftAction>;
}

const DraftContext = createContext<DraftContextValue | null>(null);

export function DraftProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: Partial<DraftState>;
}) {
  const [draft, dispatch] = useReducer(draftReducer, {
    ...defaultDraft,
    ...initial,
  });
  return (
    <DraftContext.Provider value={{ draft, dispatch }}>
      {children}
    </DraftContext.Provider>
  );
}

export function useDraft() {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error("useDraft must be used within DraftProvider");
  return ctx;
}
