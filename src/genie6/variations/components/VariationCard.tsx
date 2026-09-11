import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Pencil,
  ScrollText,
  Search,
  Sparkles,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { computeBreakdown } from "../../lib/credits";
import { buildCreditLines } from "../../studio-v4/state/useWizard";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getDummyVideos } from "@/lib/video-sage-dummy-data";
import { angles } from "@/mocks/shared/angles";
import { avatars } from "@/mocks/shared/avatars";
import { brands } from "@/mocks/shared/brands";
import { categories } from "@/mocks/shared/categories";
import { concepts } from "@/mocks/shared/concepts";
import { products } from "@/mocks/shared/products";
import { scripts } from "@/mocks/shared/scripts";
import { voices } from "@/mocks/shared/voices";
import { LANGUAGES, languageLabel, searchLanguages } from "../../lib/languages";
import { AvatarVoiceRail } from "../../studio-v4/components/AvatarVoiceRail";
import { BrandWinnerAdsDrawer } from "../../studio-v4/components/BrandWinnerAdsDrawer";
import { InstructionsPickerModal } from "../../studio-v4/components/InstructionsPickerModal";
import { KbInstructionRail } from "../../studio-v4/components/KbInstructionRail";
import { ProductWinnerAdsDrawer } from "../../studio-v4/components/ProductWinnerAdsDrawer";
import {
  PromptReferenceBar,
  RATIOS,
  RatioShapeOption,
  type ChipKind,
} from "../../studio-v4/components/PromptReferenceBar";
import { RailGenerateConcepts } from "../../studio-v4/components/RailGenerateConcepts";
import { StyleBrandRail } from "../../studio-v4/components/StyleBrandRail";
import { Step3Approach } from "../../studio-v4/screens/Step3Approach";
import {
  isScriptLedState,
  useWizard,
  type AttachSource,
  type AttachedRef,
  type Format,
  type UseWizardReturn,
  type WizardState,
} from "../../studio-v4/state/useWizard";
import { adTypeLabel } from "../data/analyseAd";
import { angleLabel } from "../data/angleLabel";
import {
  flatTimelineScript,
  fromFlatScript,
  fromVideoSageScript,
  serializeTimelineScript,
  summarizeTimelineScript,
  type TimelineScript,
} from "../data/timelineScript";
import { EntityControl } from "./EntityControl";
import { ScriptTimelineModal } from "./ScriptTimelineModal";
import type {
  AdAnalysis,
  AdTypeKind,
  AnalysedField,
  AnyElementId,
  AssetAnalysis,
  EntitySelection,
  RecommendedAction,
  VariationCardState,
  VariationCardSummary,
  VariationSource,
} from "../types";

/**
 * VariationCard — one variation, one card, one whole configuration.
 *
 * Maalik, 2026-09-10: "Each card will contain the configuration wala
 * card/section from wizard stepper, in which all the details will be prefilled
 * from source… Each card can be edited with every detail. Suggested action will
 * come in each card/variation."
 *
 * So the card is not a summary of a variation — it IS the wizard's Configure
 * step, N times over. That forces three architectural choices:
 *
 * 1. EACH CARD MOUNTS ITS OWN `useWizard`. `PromptReferenceBar`, the rails and
 *    `PromptReferenceBar` and the rails all require a real `UseWizardReturn`; a lighter
 *    fake config shape would mean maintaining a
 *    parallel copy of the wizard's API forever. `useWizard` is plain
 *    `useState` — no module state, no context, no provider — so N instances
 *    are safe and independent.
 * 2. NO `useStudioAlphaUrlSync`. It owns ~18 UNQUALIFIED query params
 *    (`?format ?brand ?angle ?count …`); twenty cards would fight over one
 *    namespace and the last writer would win. The card is deliberately
 *    URL-less: its state lives and dies with the mount, and the parent keeps
 *    card ids stable across a count change so nothing is lost.
 * 3. THE MODAL SWITCHBOARD IS LOCAL STATE, NOT `?picker=`. Configure keeps
 *    "which rail is open" in the URL; here that would open the same rail on
 *    all twenty cards at once. `railMode` below is a plain `useState`.
 *
 * The rails themselves are reused verbatim from studio-v4 — the whole point of
 * the redesign is that "change element" needs no bespoke editor, because the
 * wizard's own prompt bar and chips already open one for every element.
 */

/* ─────────────────────────────────────────────────────────── props */

export interface VariationCardProps {
  /** 0-based. Rendered as "Variation {index + 1}". */
  index: number;
  card: VariationCardState;
  /** The source analysis every field is seeded from. */
  analysis: AdAnalysis | AssetAnalysis;
  /** The 3-4 contextual suggestions, shown on every card. */
  recommendations: RecommendedAction[];
  onAdTypeChange: (adType: AdTypeKind | null) => void;
  onSummaryChange: (summary: VariationCardSummary) => void;
  onRemove?: () => void;
  /**
   * PromptReferenceBar's Generate calls `wizard.goTo(5)` — inside a card that
   * moves a wizard nothing renders, i.e. a dead button. The step change is
   * caught below, undone, and surfaced here so the parent can honour it (its
   * own `generate()` fires the whole run). Omitted = the click is a no-op and
   * the card says so.
   */
  onGenerateRequest?: () => void;
  /**
   * Cards open COLLAPSED by default: expanded, one card is ~700px of prompt
   * bar + chips, so twenty of them is an unusable page. The parent can open a
   * card explicitly (e.g. the first one, or the only one at N=1).
   */
  defaultExpanded?: boolean;
  className?: string;
}

/* ────────────────────────────────────────────── rail switchboard */

/**
 * Local mirror of Configure's `RailMode`, trimmed to the rails a variation can
 * actually use, plus two the prompt bar has no modal for (`aspect-ratio`,
 * `language` live in its own popovers, which a recommendation cannot open) and
 * `entity`, which on this screen is `EntityControl` rather than Step 2.
 */
type CardRail =
  | null
  | "concept-angle"
  | "generate-concepts"
  | "avatar-voice"
  | "style-brand"
  | "kb-instruction"
  | "instructions"
  | "brand-winner-ads"
  | "product-winner-ads"
  | "entity"
  | "aspect-ratio"
  | "language";

/**
 * What a recommended action opens. `"script-timeline"` is NOT a rail — the
 * script left the switchboard entirely (owner ruling, 2026-09-10: the script
 * is a timeline with an additive visuals column, which `ScriptTimelineModal`
 * owns), so it is a separate target rather than a `CardRail` value that no
 * branch would render.
 */
type CardTarget = Exclude<CardRail, null> | "script-timeline";

/** Which surface a recommended action opens. Both element families, one table. */
const TARGET_FOR_ELEMENT: Record<AnyElementId, CardTarget> = {
  product: "entity",
  entity: "entity",
  angle: "concept-angle",
  concept: "concept-angle",
  // An asset's framework IS its script's beat order, and the script timeline is
  // where those beats are edited. There is no separate framework surface.
  framework: "script-timeline",
  avatar: "avatar-voice",
  voice: "avatar-voice",
  language: "language",
  script: "script-timeline",
  // A concept IS the visual direction (`Concept.visualDirection`), so the
  // approach rail is where visuals are actually changed. StyleBrandRail is a
  // READ-ONLY brand-personality panel — it has no save path at all — so it
  // stays reachable from the prompt bar's Style chip and is never the answer
  // to "Add visuals".
  "visual-direction": "concept-angle",
  "aspect-ratio": "aspect-ratio",
};

const RAIL_TITLE: Record<Exclude<CardRail, null>, string> = {
  "concept-angle": "Change approach",
  "generate-concepts": "Generate concepts",
  "avatar-voice": "Avatar & voice",
  "style-brand": "Style & brand",
  "kb-instruction": "New brand instruction",
  instructions: "Brand knowledge",
  "brand-winner-ads": "Brand winner ads",
  "product-winner-ads": "Product winner ads",
  entity: "Who this ad is for",
  "aspect-ratio": "Aspect ratio",
  language: "Language",
};

/* ───────────────────────────────────────────────── seeding */

function isAssetAnalysis(a: AdAnalysis | AssetAnalysis): a is AssetAnalysis {
  return "assetKind" in a;
}

/** A found string, or null. `not-found` never yields a value to seed from. */
function found(field: AnalysedField | undefined): string | null {
  if (!field || field.provenance === "not-found") return null;
  const v = field.value;
  return typeof v === "string" && v.trim() ? v : null;
}

/**
 * §7.2 — the competitor rule. `entityName` is DISPLAY TEXT on a competitor's
 * ad; resolving it to a real id would pre-fill the user's variation with a
 * rival's brand. So a competitor-owned source seeds no entity at all, and the
 * card opens asking who it's for.
 */
function seedEntity(analysis: AdAnalysis | AssetAnalysis): Partial<WizardState> {
  const src = analysis.source;
  if (src.competitorOwned) return {};
  const name = found(analysis.entityName);
  if (!name) return {};

  const brandHint = analysis.entityName.detail ?? null;
  const product = products.find((p) => p.name === name);
  const category = categories.find((c) => c.name === name);
  const brand =
    brands.find((b) => b.name === name) ??
    (brandHint ? brands.find((b) => b.name === brandHint) : undefined) ??
    (product ? brands.find((b) => b.id === product.brandId) : undefined);

  const kind = analysis.type.provenance === "not-found" ? null : analysis.type.value;

  if (product && (kind === "product" || kind === "category-product" || kind === null)) {
    return {
      entityMode: "entity",
      brandId: brand?.id ?? null,
      productId: product.id,
      productIds: [product.id],
      categoryId: kind === "category-product" ? (category?.id ?? null) : null,
    };
  }
  if (category && (kind === "category" || kind === "category-product")) {
    return { entityMode: "entity", brandId: brand?.id ?? null, categoryId: category.id };
  }
  if (brand) return { entityMode: "entity", brandId: brand.id };
  return {};
}

function seedFormat(analysis: AdAnalysis | AssetAnalysis): Format | undefined {
  switch (analysis.source.sourceFormat) {
    case "video":
      return "video";
    case "image":
    case "carousel":
      return "image";
    default:
      // "flexible" and absent are genuinely undecided — seeding one would be a
      // fabricated fact, and Step 1's format gate is the honest prompt for it.
      return undefined;
  }
}

/** The angle roster is keyed by label; a sentence that matches nothing goes to
 *  `angleDescription`, never to `angleId` (which must hold a catalogue id). */
function seedAngle(analysis: AdAnalysis | AssetAnalysis): Partial<WizardState> {
  const label = found(analysis.angle);
  if (!label) return {};
  const hit = angles.find((a) => a.label === label);
  return hit ? { angleId: hit.id } : { angleDescription: label };
}

function seedConcept(analysis: AdAnalysis | AssetAnalysis): Partial<WizardState> {
  const name = found(analysis.concept);
  if (!name) return {};
  const hit = concepts.find((c) => c.name === name);
  return hit ? { selectedConceptIds: [hit.id] } : {};
}

function seedLanguage(analysis: AdAnalysis | AssetAnalysis): Partial<WizardState> {
  const label = found(analysis.language);
  if (!label) return {};
  const hit = LANGUAGES.find((l) => languageLabel(l.code) === label);
  return hit ? { language: hit.code } : {};
}

/** Asset analyses report no ratio at all — there is nothing to seed from. */
function seedAspectRatio(analysis: AdAnalysis | AssetAnalysis): Partial<WizardState> {
  if (isAssetAnalysis(analysis)) return {};
  const value = found(analysis.aspectRatio);
  if (!value) return {};
  const hit = RATIOS.find((r) => r === value);
  return hit ? { aspectRatio: hit } : {};
}

/**
 * The one structured script in the whole source catalogue.
 * `VideoSageAnalysis.script` is already `{ time, visual, dialogue }[]` — real
 * timecodes, real visual directions — and a Video Sage `FlowSourceRef` carries
 * the video's own id (`videoSageRefs()` in `flows/data/flowSources.ts`), which
 * is the join back to it. Every other source stores a script as one blob, so
 * this is the only path that needs no parsing and the only one whose
 * provenance can honestly read "from Video Sage".
 *
 * `AdAnalysis.script` deliberately reports the OVERVIEW of this
 * ("PAS · 5 beats", `analyseVideoSage`), not the words, which is why the rows
 * have to be re-read here rather than lifted off the analysis.
 */
function videoSageTimeline(source: VariationSource): TimelineScript | null {
  if (source.kind !== "flow-ref" || source.module !== "video-sage") return null;
  const rows = getDummyVideos().find((v) => v.id === source.id)?.analysis?.script;
  return rows?.length ? fromVideoSageScript(rows) : null;
}

/**
 * `AdAnalysis.script` reports the script's TITLE (with framework + duration in
 * `detail`), not its words — so the title is resolved back to the roster asset
 * and the BODY is what gets seeded. An unresolvable title seeds nothing rather
 * than putting a headline where the read-aloud text belongs.
 *
 * A Video Sage source skips that resolution entirely: its structured rows are
 * serialized in, so `WizardState.script` (one blob, all the wizard has) holds
 * the real beats — timecodes in brackets, visuals behind `VISUAL:` — instead of
 * being empty while the card displays a timeline the run payload never sees.
 */
function seedScript(analysis: AdAnalysis | AssetAnalysis): Partial<WizardState> {
  if (isAssetAnalysis(analysis)) {
    if (analysis.assetKind === "concept") return {};
    const body = found(analysis.body);
    return body ? { script: body, scriptOrigin: "user" } : {};
  }
  const fromVideoSage = videoSageTimeline(analysis.source);
  // "user" origin, not "auto": the source's own script must survive the
  // wizard's background auto-fill, which refuses to touch a user script.
  if (fromVideoSage) {
    return { script: serializeTimelineScript(fromVideoSage), scriptOrigin: "user" };
  }
  const title = found(analysis.script);
  if (!title) return {};
  const hit = scripts.find((s) => s.title === title);
  return hit ? { script: hit.body, scriptOrigin: "user" } : {};
}

function seedCast(analysis: AdAnalysis | AssetAnalysis): Partial<WizardState> {
  if (isAssetAnalysis(analysis)) return {};
  const patch: Partial<WizardState> = {};
  const avatarName = found(analysis.avatar);
  const voiceName = found(analysis.voice);
  const avatar = avatarName ? avatars.find((a) => a.name === avatarName) : undefined;
  const voice = voiceName ? voices.find((v) => v.name === voiceName) : undefined;
  if (avatar) patch.avatarId = avatar.id;
  if (voice) patch.voiceId = voice.id;
  return patch;
}

const PROMPT_CAP = 180;

/** Derived from what was actually detected — never invented copy. A thin
 *  source yields just the honest one-liner naming it. */
function seedPrompt(analysis: AdAnalysis | AssetAnalysis): string {
  const bits = [`Variation of "${analysis.source.title}"`];
  const angle = found(analysis.angle);
  if (angle) bits.push(`keep the ${angle} angle`);
  const direction = found(analysis.visualDirection);
  if (direction) bits.push(direction);
  return bits.join(" · ").slice(0, PROMPT_CAP);
}

function buildSeed(analysis: AdAnalysis | AssetAnalysis): Partial<WizardState> {
  const format = seedFormat(analysis);
  return {
    // Pinned to Configure: the card IS the configuration step. The effect
    // below snaps it back if a nested rail tries to navigate the wizard.
    step: 4,
    category: "ad",
    ...(format ? { format } : {}),
    // Every run of this flow produces a whole ad, whatever the source was.
    generationTarget: "ad",
    generationSource: isAssetAnalysis(analysis)
      ? analysis.assetKind === "storyboard"
        ? "storyboard"
        : analysis.assetKind === "script"
          ? "script"
          : "concept"
      : "none",
    isVariation: true,
    // §7 Rule 1's ONE documented opt-out. Without it `resolveGenerationSteps`
    // marks steps 0-3 "skipped", and Step3Approach's defensive guard then
    // calls `onAdvance()` on mount — the approach rail closed itself the
    // instant it opened. A card IS the "adjust first" fork of a variation, so
    // this is the honest flag, not a workaround.
    variationTweak: true,
    // One card = one variation. The parent's count owns how many cards exist.
    count: 1,
    prompt: seedPrompt(analysis),
    ...seedEntity(analysis),
    ...seedAngle(analysis),
    ...seedConcept(analysis),
    ...seedLanguage(analysis),
    ...seedAspectRatio(analysis),
    ...seedScript(analysis),
    ...seedCast(analysis),
  };
}

/* ─────────────────────────────────────────────── ad type */

/**
 * The derivation `useContextSummary.deriveAdType` performs, re-expressed in
 * this flow's `AdTypeKind` vocabulary. (That helper and its label map are not
 * exported, so it cannot be imported — see the report note.)
 */
function deriveAdType(state: WizardState): AdTypeKind {
  if (state.categoryId && state.productId) return "category-product";
  if (state.categoryId) return "category";
  if (state.productId) return "product";
  if (state.brandId) return "brand";
  return "not-found";
}

const AD_TYPE_CHOICES: AdTypeKind[] = [
  "brand",
  "product",
  "category",
  "category-product",
  "other",
];

/* ─────────────────────────────────────────────── component */

export function VariationCard({
  index,
  card,
  analysis,
  recommendations,
  onAdTypeChange,
  onSummaryChange,
  onRemove,
  onGenerateRequest,
  defaultExpanded = false,
  className,
}: VariationCardProps) {
  // Computed once per mount — `useWizard` only reads `initialPatch` in its lazy
  // state initializer, and a new source rebuilds the cards with fresh ids.
  const seed = useMemo(() => buildSeed(analysis), [analysis]);
  const wizard = useWizard(seed);
  const { state, set, patch, goTo } = wizard;

  const [expanded, setExpanded] = useState(defaultExpanded);
  const [railMode, setRailMode] = useState<CardRail>(null);
  const [scriptOpen, setScriptOpen] = useState(false);
  const [adTypeOpen, setAdTypeOpen] = useState(false);
  const [langQuery, setLangQuery] = useState("");

  /* ── the card's wizard is pinned to Configure ───────────────────────────
   * Two nested surfaces navigate the wizard: PromptReferenceBar's Generate
   * (`goTo(5)`) and Step3Approach's "switch the format on step 1"
   * (`goTo(1)`). Neither has anywhere to go inside a card, so the step is put
   * back — and a step-5 attempt is read as what the user meant by it. */
  const generateRef = useRef(onGenerateRequest);
  generateRef.current = onGenerateRequest;
  const step = state.step;
  useEffect(() => {
    if (step === 4) return;
    goTo(4);
    if (step === 5) generateRef.current?.();
  }, [step, goTo]);

  /* ── report upward ───────────────────────────────────────────────────── */

  /**
   * Resolved through `angleLabel()`, never off one roster: the seed can hold an
   * `angles.ts` id OR a `ANGLE_CHIP_LABEL` id, and a raw slug is never an
   * acceptable label anywhere on the card (the digest chips, the summary the
   * parent renders, and the strip below all read this one value).
   */
  const angleText = useMemo(() => {
    if (state.angleId) return angleLabel(state.angleId);
    return state.angleDescription;
  }, [state.angleId, state.angleDescription]);

  const derivedAdType = deriveAdType(state);
  const effectiveAdType = card.adType ?? derivedAdType;

  /* ── the script, as a timeline ───────────────────────────────────────────
   * The wizard stores a script as ONE blob, so the timeline is DERIVED from
   * `state.script` on every change — an edit made anywhere (here, a rail, the
   * seed) is reflected without a second copy of the text to keep in sync.
   *
   * The Video Sage rows are kept beside it because they carry what a blob
   * cannot prove: that the timecodes and visual directions are the source's
   * own, not a parser's reading. While the blob still IS that serialization
   * the structured script answers; the moment the text differs it is the
   * user's, and only the parser may speak for it. (Same content-equality
   * precedence `scriptCarriedFrom` uses in Studio — it goes stale on edit.) */
  const sourceTimeline = useMemo(() => videoSageTimeline(analysis.source), [analysis.source]);
  const scriptText = state.script?.trim() ?? "";
  const timeline = useMemo<TimelineScript>(() => {
    if (sourceTimeline && scriptText === serializeTimelineScript(sourceTimeline).trim()) {
      return sourceTimeline;
    }
    // `fromFlatScript("")` yields ZERO rows, which the modal cannot edit —
    // one empty row is the editable resting state.
    return scriptText ? fromFlatScript(scriptText) : flatTimelineScript("");
  }, [sourceTimeline, scriptText]);

  /** §21.2's script gate, the signal `ScriptPreviewRow` carries in Studio. It
   *  never blocks Generate (PromptReferenceBar states this explicitly) — it
   *  only says the user hasn't read this script through yet. */
  const scriptNeedsReview =
    isScriptLedState(state) && !state.scriptApproved && !state.skipScriptReview;

  const saveScript = useCallback(
    (next: TimelineScript) => {
      const text = serializeTimelineScript(next);
      patch({
        script: text,
        // Same reasoning as the seed: a human-supplied script must survive the
        // wizard's background auto-fill, which refuses to touch a "user" one.
        scriptOrigin: "user",
        // Saving from the timeline IS the review — the user just read every
        // beat. Without this the "Needs review" signal has no way to clear,
        // since the card no longer mounts ScriptRail's Approve control.
        scriptApproved: !!text.trim(),
      });
    },
    [patch],
  );

  const summary: VariationCardSummary = useMemo(
    () => ({
      id: card.id,
      // The EFFECTIVE type, not the override. `card.adType` is null while the
      // card is on Auto, so reporting it dropped the ad type out of the
      // generate payload for exactly the cards the user never touched.
      adType: effectiveAdType,
      format: state.format,
      angle: angleText,
      conceptCount: state.selectedConceptIds.length,
      hasScript: !!state.script?.trim(),
      prompt: state.prompt,
      model: state.modelId,
      aspectRatio: state.aspectRatio,
      creditsTotal: computeBreakdown(buildCreditLines(state)).total,
    }),
    [
      state,
      card.id,
      effectiveAdType,
      state.format,
      angleText,
      state.selectedConceptIds.length,
      state.script,
      state.prompt,
      state.modelId,
      state.aspectRatio,
    ],
  );

  // Derived with useMemo, reported from an effect keyed on it — so a report
  // cannot re-enter the render that produced it. The parent shallow-compares
  // and bails when nothing moved.
  useEffect(() => {
    onSummaryChange(summary);
  }, [summary, onSummaryChange]);

  /* ── rail plumbing ───────────────────────────────────────────────────── */

  const closeRail = useCallback(() => setRailMode(null), []);

  const handleChipOpen = useCallback((chip: ChipKind) => {
    // "script" is unreachable from this mount — the bar is handed a
    // script-blind wizard below, so its own ScriptPreviewRow never renders —
    // but the chip kind still exists, and the timeline modal is the only
    // honest answer to it either way.
    if (chip === "script") {
      setScriptOpen(true);
      return;
    }
    setRailMode(chip);
  }, []);

  const handleAttachPickerOpen = useCallback((source: AttachSource) => {
    if (source === "instruction") {
      setRailMode("instructions");
      return;
    }
    if (source === "brand-winner-ads" || source === "product-winner-ads") {
      setRailMode(source);
    }
    // Everything else (upload / url / library / pinterest / seed-image /
    // template / industry-insights) is deliberately unhandled here: those
    // pickers are Studio's, and a variation card is not the place to grow a
    // second copy of them. The prompt bar's own upload/URL paths still work.
  }, []);

  const attachRefs = useCallback(
    (source: AttachSource) => (refs: AttachedRef[]) => {
      set("attachedReferences", [
        ...state.attachedReferences,
        ...refs.map((r) => ({ ...r, source })),
      ]);
      setRailMode(null);
    },
    [set, state.attachedReferences],
  );

  const applyEntity = useCallback(
    (next: EntitySelection) => {
      const productId = next.productId ?? null;
      patch({
        brandId: next.brandId ?? null,
        productId,
        // `productIds[0]` must always equal `productId` when the set is
        // non-empty (useWizard's own invariant).
        productIds: productId ? [productId] : [],
        categoryId: next.categoryId ?? null,
      });
    },
    [patch],
  );

  const entityValue: EntitySelection = useMemo(
    () => ({
      brandId: state.brandId,
      productId: state.productId,
      categoryId: state.categoryId,
    }),
    [state.brandId, state.productId, state.categoryId],
  );

  const openForElement = useCallback(
    (element: AnyElementId) => {
      setExpanded(true);
      // "Change Concept" with nothing selected has nothing to change — the
      // honest rail is the one that MAKES concepts, not the one that swaps
      // them. (This is the case `recommendedActions` justifies with "no
      // concept stored".)
      if (element === "concept" && state.selectedConceptIds.length === 0) {
        setRailMode("generate-concepts");
        return;
      }
      const target = TARGET_FOR_ELEMENT[element];
      if (target === "script-timeline") {
        setScriptOpen(true);
        return;
      }
      setRailMode(target);
    },
    [state.selectedConceptIds.length],
  );

  /**
   * PromptReferenceBar embeds `ScriptPreviewRow` and renders it whenever
   * `state.script` is non-empty — a SECOND script surface, stating the same
   * fact as the row above in different words two rows apart. That is exactly
   * the Nielsen #4 duplication `ScriptPreviewRow`'s own docs forbid ("Do not
   * reintroduce a second script status surface"), and the card's row is the
   * one that can carry the timeline's has-visuals datum, so the bar is handed
   * a script-BLIND view of this wizard. Contained on purpose: `state.script`
   * is read at exactly two places in that component — this row, and
   * `hasScript`, which only matters when `onGenerateScript` is passed (it
   * isn't here). Every setter is the real one, so nothing the bar writes is
   * affected.
   */
  const promptBarWizard = useMemo<UseWizardReturn>(
    () => ({ ...wizard, state: { ...state, script: null } }),
    [wizard, state],
  );

  const languageResults = useMemo(() => {
    const q = langQuery.trim();
    return q ? searchLanguages(q).slice(0, 40) : LANGUAGES.slice(0, 40);
  }, [langQuery]);

  /* ── chips for the collapsed row ─────────────────────────────────────── */

  const chips = useMemo(() => {
    const out: string[] = [];
    if (state.format) out.push(state.format === "video" ? "Video" : "Image");
    if (angleText) out.push(angleText);
    if (state.selectedConceptIds.length > 0) {
      out.push(
        `${state.selectedConceptIds.length} concept${
          state.selectedConceptIds.length === 1 ? "" : "s"
        }`,
      );
    }
    if (state.script?.trim()) out.push("Script");
    out.push(state.aspectRatio);
    out.push(languageLabel(state.language));
    return out;
  }, [
    state.format,
    angleText,
    state.selectedConceptIds.length,
    state.script,
    state.aspectRatio,
    state.language,
  ]);

  /* ── render ──────────────────────────────────────────────────────────── */

  const label = `Variation ${index + 1}`;

  return (
    <section
      aria-label={label}
      className={cn(
        "rounded-xl border border-g6-border bg-g6-bg-container",
        className,
      )}
    >
      {/* Header — always visible, always identifies the variation */}
      <div className="flex items-start gap-3 px-4 py-3">
        <span aria-hidden className="mt-1 h-8 w-1 shrink-0 rounded-full bg-g6-primary" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-md border border-g6-primary-border bg-g6-primary-bg px-2 py-0.5 text-[11px] font-semibold leading-4 text-g6-primary-active">
              {label}
            </span>

            {/* Ad type — an OVERRIDE. null shows the derived value, marked
                "Auto", so the user can see what the entity implies before
                deciding to overrule it. */}
            <Popover open={adTypeOpen} onOpenChange={setAdTypeOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium leading-4 transition-colors",
                    card.adType
                      ? "border-g6-primary-border bg-g6-primary-bg text-g6-primary-active"
                      : "border-g6-border bg-g6-bg-container text-g6-text-secondary hover:border-g6-primary-border",
                  )}
                >
                  {card.adType ? (
                    <span>{adTypeLabel(card.adType)} ad</span>
                  ) : (
                    <>
                      <span className="text-g6-text-tertiary">Auto</span>
                      <span>
                        {derivedAdType === "not-found"
                          ? "no entity yet"
                          : `${adTypeLabel(derivedAdType)} ad`}
                      </span>
                    </>
                  )}
                  <ChevronDown className="h-3 w-3" aria-hidden />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 p-2">
                <p className="px-1 pb-1.5 text-[11px] leading-4 text-g6-text-tertiary">
                  What kind of ad this variation generates.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onAdTypeChange(null);
                    setAdTypeOpen(false);
                  }}
                  aria-pressed={card.adType === null}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[12px] leading-5 transition-colors",
                    card.adType === null
                      ? "bg-g6-primary-bg text-g6-primary-active"
                      : "text-g6-text hover:bg-g6-primary-bg",
                  )}
                >
                  <span>Auto — follow the entity</span>
                  <span className="text-[11px] leading-4 text-g6-text-tertiary">
                    {derivedAdType === "not-found" ? "N/F" : adTypeLabel(derivedAdType)}
                  </span>
                </button>
                <div className="my-1 h-px bg-g6-border" />
                {AD_TYPE_CHOICES.map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => {
                      onAdTypeChange(kind);
                      setAdTypeOpen(false);
                    }}
                    aria-pressed={card.adType === kind}
                    className={cn(
                      "flex w-full items-center rounded-md px-2 py-1.5 text-left text-[12px] leading-5 transition-colors",
                      card.adType === kind
                        ? "bg-g6-primary-bg text-g6-primary-active"
                        : "text-g6-text hover:bg-g6-primary-bg",
                    )}
                  >
                    {adTypeLabel(kind)} ad
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            {/* Format — Approaches filter by format, so it has to be
                changeable here; the wizard's own Step 1 is unreachable. */}
            <span
              role="group"
              aria-label="Format"
              className="inline-flex overflow-hidden rounded-md border border-g6-border"
            >
              {(["image", "video"] as Format[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => set("format", f)}
                  aria-pressed={state.format === f}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium leading-4 transition-colors",
                    state.format === f
                      ? "bg-g6-primary-bg text-g6-primary-active"
                      : "text-g6-text-tertiary hover:text-g6-text",
                  )}
                >
                  {f === "image" ? (
                    <ImageIcon className="h-3 w-3" aria-hidden />
                  ) : (
                    <Video className="h-3 w-3" aria-hidden />
                  )}
                  {f === "image" ? "Image" : "Video"}
                </button>
              ))}
            </span>
          </div>

          {/* Collapsed digest. Kept when expanded too — it is the one line
              that stays readable while scrolling a stack of twenty. */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
            {chips.map((c) => (
              <span
                key={c}
                className="rounded border border-g6-border px-1.5 py-0.5 text-[11px] leading-4 text-g6-text-secondary"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="inline-flex items-center gap-1 rounded-md border border-g6-primary-border bg-g6-primary-bg px-2.5 py-1 text-[11px] font-semibold leading-4 text-g6-primary-active transition-colors hover:bg-g6-primary-bg-hover"
          >
            {expanded ? "Collapse" : "Edit details"}
            <ChevronDown
              aria-hidden
              className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")}
            />
          </button>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${label}`}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-g6-text-tertiary transition-colors hover:bg-g6-primary-bg hover:text-g6-text"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </div>
      </div>

      {/* Expanded — the wizard's own configuration section, verbatim */}
      {expanded && (
        <div className="space-y-3 border-t border-g6-border px-4 py-3">

          {/* Nothing was detected: say so, rather than presenting an empty
              form as if the prefill had worked. */}
          {derivedAdType === "not-found" && (
            <p className="rounded-lg border border-g6-primary-border bg-g6-primary-bg px-3 py-2 text-[12px] leading-5 text-g6-text-secondary">
              This source carried no brand, product or category
              {analysis.source.competitorOwned ? " you own" : ""} — so this
              variation starts blank on purpose.{" "}
              <button
                type="button"
                onClick={() => setRailMode("entity")}
                className="font-semibold text-g6-primary-active underline underline-offset-2"
              >
                Pick who it&apos;s for
              </button>
            </p>
          )}

          {/* Suggested actions — a sleek strip directly ABOVE the prompt bar,
              the same place Configure puts its prompt suggestions. Each one
              still acts on THIS card. */}
          {recommendations.length > 0 && (
            <SuggestionStrip
              recommendations={recommendations}
              onPick={openForElement}
            />
          )}

          {/* Script — its own full-width row, directly above the prompt card,
              because the prompt bar may show an OVERVIEW only (owner ruling)
              and the whole timeline lives in the modal this row opens. */}
          <VariationScriptRow
            timeline={timeline}
            hasText={!!scriptText}
            scriptOrigin={state.scriptOrigin}
            needsReview={scriptNeedsReview}
            onEdit={() => setScriptOpen(true)}
          />

          <PromptReferenceBar
            wizard={promptBarWizard}
            hideLayoutToggle
            onChipOpen={handleChipOpen}
            onAttachPickerOpen={handleAttachPickerOpen}
          />

          {!onGenerateRequest && (
            <p className="text-[11px] leading-4 text-g6-text-tertiary">
              Generate fires for the whole run from the bar below the cards.
            </p>
          )}
        </div>
      )}

      {/* ── modal switchboard ───────────────────────────────────────────
          Local state, never `?picker=` — that param is Configure's, and one
          URL namespace shared by twenty cards would open every card's rail at
          once. Backdrop deliberately has NO onClick: overlays never dismiss on
          outside click; every rail ships its own explicit X / Cancel. */}
      {railMode !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${label} — ${RAIL_TITLE[railMode]}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6"
        >
          <div aria-hidden className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
          <div className="v3-glass relative z-10 flex max-h-[85dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-2xl md:max-h-[70vh]">
            {railMode === "concept-angle" && (
              // Step 3 itself, embedded. It reads the card's wizard directly,
              // so re-opening always shows the real current pick.
              <Step3Approach
                wizard={wizard}
                embedded
                onAdvance={closeRail}
                onBack={closeRail}
                onClose={closeRail}
              />
            )}
            {railMode === "generate-concepts" && (
              <RailGenerateConcepts
                selectedIds={state.selectedConceptIds}
                onChange={(ids) => set("selectedConceptIds", ids)}
                onClose={closeRail}
              />
            )}
            {railMode === "avatar-voice" && (
              <AvatarVoiceRail
                selectedAvatarId={state.avatarId}
                selectedVoiceId={state.voiceId}
                onAvatarChange={(id) => set("avatarId", id)}
                onVoiceChange={(id) => set("voiceId", id)}
                auditAngleLabel={angleText ?? undefined}
                contextLabel={label}
                onClose={closeRail}
              />
            )}
            {railMode === "style-brand" && (
              <StyleBrandRail brandId={state.brandId} onClose={closeRail} />
            )}
            {railMode === "kb-instruction" && (
              <KbInstructionRail
                targetAngle={state.angleId}
                targetAngleLabel={angleText ?? "general"}
                onSave={(inst) => {
                  set("customKbInstructions", [...state.customKbInstructions, inst]);
                  setRailMode(null);
                }}
                onClose={closeRail}
              />
            )}
            {railMode === "instructions" && (
              <InstructionsPickerModal
                brandId={state.brandId}
                productId={state.productId}
                categoryId={state.categoryId}
                customInstructions={[]}
                onSave={(refs) => {
                  set("attachedReferences", [...state.attachedReferences, ...refs]);
                  setRailMode(null);
                }}
                onClose={closeRail}
              />
            )}
            {railMode === "brand-winner-ads" && (
              <BrandWinnerAdsDrawer
                brandId={state.brandId}
                onSave={attachRefs("brand-winner-ads")}
                onCancel={closeRail}
              />
            )}
            {railMode === "product-winner-ads" && (
              <ProductWinnerAdsDrawer
                productId={state.productId}
                onSave={attachRefs("product-winner-ads")}
                onCancel={closeRail}
              />
            )}
            {railMode === "entity" && (
              <RailShell title={RAIL_TITLE.entity} onClose={closeRail}>
                <EntityControl
                  value={entityValue}
                  onChange={applyEntity}
                  detectedLabel={found(analysis.entityName)}
                  detectedIsCompetitor={analysis.source.competitorOwned}
                />
              </RailShell>
            )}
            {railMode === "aspect-ratio" && (
              <RailShell title={RAIL_TITLE["aspect-ratio"]} onClose={closeRail}>
                <div className="space-y-0.5">
                  {RATIOS.map((r) => (
                    <RatioShapeOption
                      key={r}
                      ratio={r}
                      active={state.aspectRatio === r}
                      onSelect={() => {
                        set("aspectRatio", r);
                        setRailMode(null);
                      }}
                    />
                  ))}
                </div>
              </RailShell>
            )}
            {railMode === "language" && (
              <RailShell title={RAIL_TITLE.language} onClose={closeRail}>
                <label className="mb-2 flex items-center gap-2 rounded-md border border-g6-border px-2.5 py-1.5">
                  <Search className="h-3.5 w-3.5 shrink-0 text-g6-text-tertiary" aria-hidden />
                  <input
                    value={langQuery}
                    onChange={(e) => setLangQuery(e.target.value)}
                    placeholder="Search 175 languages"
                    className="w-full bg-transparent text-[12px] leading-5 text-g6-text outline-none placeholder:text-g6-text-tertiary"
                  />
                </label>
                <div className="space-y-0.5">
                  {languageResults.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        set("language", l.code);
                        setRailMode(null);
                      }}
                      aria-pressed={state.language === l.code}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                        state.language === l.code
                          ? "bg-g6-primary-bg text-g6-primary-active"
                          : "text-g6-text hover:bg-g6-primary-bg",
                      )}
                    >
                      <span className="text-[12px] font-medium leading-5">{l.name}</span>
                      <span className="ml-auto text-[11px] leading-4 text-g6-text-tertiary">
                        {l.region}
                      </span>
                    </button>
                  ))}
                  {languageResults.length === 0 && (
                    <p className="px-2 py-3 text-[12px] leading-5 text-g6-text-tertiary">
                      No language matches “{langQuery}”.
                    </p>
                  )}
                </div>
              </RailShell>
            )}
          </div>
        </div>
      )}

      {/* The script's own modal — NOT part of the rail switchboard: it is the
          one surface the owner specified as a timeline with an additive
          visuals column, and it ships its own Dialog (outside-click dismissal
          is already disabled house-wide in `ui/dialog.tsx`). Mounted at the
          section level so an open script survives collapsing the card. */}
      <ScriptTimelineModal
        open={scriptOpen}
        onOpenChange={setScriptOpen}
        script={timeline}
        contextLabel={label}
        onSave={saveScript}
      />
    </section>
  );
}

/* ─────────────────────────────────────────────────────── script row */

/**
 * VariationScriptRow — the card's ONE script surface.
 *
 * Owner ruling (2026-09-10): "Script ka only overview we can show in prompt
 * bar, because a script has every timeline's dialoge in it, and sometime a
 * script has visual directions also in it. So it is a lengthy context." Plus,
 * on the overview specifically: keep the clamped preview, and ADD A DATUM FOR
 * WHETHER IT HAS VISUALS OR NOT.
 *
 * So: `ScriptPreviewRow`'s grammar (mono eyebrow · provenance · 2-line clamp ·
 * trailing Edit) with the visuals datum as a pill that cannot be missed — it
 * is the one thing he asked to be added, and it decides whether the modal's
 * toggle can do anything at all. Reproduced rather than imported because
 * `ScriptPreviewRow` lives in studio-v4 (read-only here) and knows nothing
 * about a `TimelineScript`.
 *
 * Unlike Studio's row this one NEVER renders nothing: on a card the empty
 * script is a normal resting state — the source may simply not have carried
 * one — and a card that silently omits the row reads as a missing feature
 * rather than an empty field.
 */
function VariationScriptRow({
  timeline,
  hasText,
  scriptOrigin,
  needsReview,
  onEdit,
}: {
  timeline: TimelineScript;
  /** False = nothing in the wizard's script field yet: the resting state. */
  hasText: boolean;
  scriptOrigin: "auto" | "user" | null;
  needsReview: boolean;
  onEdit: () => void;
}) {
  const summary = useMemo(() => summarizeTimelineScript(timeline), [timeline]);

  // Newlines are collapsed by the browser (no `whitespace-pre-wrap`), which is
  // what makes a 2-line clamp land predictably — the same reasoning as
  // ScriptPreviewRow's own preview.
  // A visuals-only script (visuals, no dialogue) would preview as empty and
  // make the row claim "no script" while the datum beside it counts beats.
  // Fall back to the visuals so the preview describes what is actually there.
  const dialoguePreview = timeline.rows
    .map((r) => r.dialogue.trim())
    .filter(Boolean)
    .join(" ");
  const preview =
    dialoguePreview ||
    timeline.rows
      .map((r) => r.visual?.trim() ?? "")
      .filter(Boolean)
      .join(" ");

  const provenance =
    timeline.provenance === "video-sage"
      ? "From Video Sage"
      : scriptOrigin === "user"
        ? "Edited by you"
        : scriptOrigin === "auto"
          ? "Auto-written"
          : null;

  const beatsText = !hasText
    ? "No script yet"
    : timeline.provenance === "flat"
      ? "No timeline"
      : `${summary.rowCount} beat${summary.rowCount === 1 ? "" : "s"}${
          summary.durationLabel ? ` · ${summary.durationLabel}` : ""
        }`;

  return (
    <section
      aria-label="Script"
      className="flex w-full flex-col gap-2 rounded-xl border border-g6-border bg-g6-bg-base px-3 py-2.5 sm:flex-row sm:items-start sm:gap-3"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <ScrollText className="h-3 w-3 shrink-0 text-g6-primary-active" aria-hidden />
          <span className="font-g6-mono text-[10px] font-semibold uppercase leading-4 tracking-[0.14em] text-g6-text-tertiary">
            Script
          </span>
          {/* STATUS first, then PROVENANCE — the actionable token leads, the
              same order (and the same copy) Studio's row uses. */}
          {needsReview && hasText && (
            <>
              <span aria-hidden className="text-[10px] leading-4 text-g6-text-tertiary">
                ·
              </span>
              <span
                className="shrink-0 font-g6-mono text-[10px] font-semibold uppercase leading-4 tracking-wider text-g6-primary-active"
                title="This script hasn't been read through yet — open it and Save to clear this."
              >
                Needs review
              </span>
            </>
          )}
          {provenance && hasText && (
            <>
              <span aria-hidden className="text-[10px] leading-4 text-g6-text-tertiary">
                ·
              </span>
              <span className="min-w-0 truncate font-g6-mono text-[10px] uppercase leading-4 tracking-wider text-g6-text-secondary">
                {provenance}
              </span>
            </>
          )}
        </div>

        {/* The two data the overview is allowed to state: how much script
            there is, and — the thing the owner asked for — whether visual
            directions are in it. Both at rest, no hover required. */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center rounded-md border border-g6-border bg-g6-bg-container px-1.5 py-0.5 font-g6-mono text-[10px] uppercase leading-4 tracking-wide text-g6-text-secondary">
            {beatsText}
          </span>
          {hasText && (
            <span
              title={
                summary.hasVisuals
                  ? "Open the script and switch on “Add visual directions” to see them per beat."
                  : "Nothing to add — this script carries dialogue only."
              }
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-4",
                summary.hasVisuals
                  ? "border-g6-primary-border bg-g6-primary-bg text-g6-primary-active"
                  : "border-g6-border bg-g6-bg-container text-g6-text-tertiary",
              )}
            >
              {summary.hasVisuals ? (
                <Eye className="h-3 w-3 shrink-0" aria-hidden />
              ) : (
                <EyeOff className="h-3 w-3 shrink-0" aria-hidden />
              )}
              {summary.hasVisuals
                ? `${summary.visualCount} of ${summary.rowCount} beat${
                    summary.rowCount === 1 ? "" : "s"
                  } have visuals`
                : "No visual directions"}
            </span>
          )}
        </div>

        <p
          className={cn(
            "mt-1.5 line-clamp-2 break-words text-[12px] leading-5",
            hasText && preview ? "text-g6-text-secondary" : "text-g6-text-tertiary",
          )}
        >
          {hasText && preview
            ? preview
            : "This source carried no script. Genie writes one at generate time — or write it now."}
        </p>
      </div>

      <button
        type="button"
        onClick={onEdit}
        aria-label={hasText ? "Edit script" : "Add script"}
        title={hasText ? "Edit script" : "Add script"}
        className="inline-flex h-7 shrink-0 items-center gap-1.5 self-start rounded-md border border-g6-primary-border bg-g6-primary-bg px-2.5 text-[11px] font-semibold leading-4 text-g6-primary-active transition-colors hover:bg-g6-primary-bg-hover"
      >
        <Pencil className="h-3 w-3" aria-hidden />
        {hasText ? "Edit" : "Add"}
      </button>
    </section>
  );
}

/* ──────────────────────────────────────────────── suggestion strip */

/**
 * SuggestionStrip — Maalik, 2026-09-10: "Suggested action sleek bar would be
 * enough, like in some apps we show suggested prompts above prompt bar."
 *
 * So: one slim scrolling row of pills, matching `PromptSuggestions` in
 * `AlphaStep3Configure` (mono-caps label + horizontally scrolling pill list,
 * scrollbar hidden). It cannot be imported — that component is file-local to a
 * screen — so the grammar is reproduced with g6 tokens.
 *
 * `reason` has nowhere to live in a pill, and dropping it would cost the
 * grounding that makes a suggestion trustworthy, so it becomes the button's
 * `title` — a tooltip that takes no layout.
 */
function SuggestionStrip({
  recommendations,
  onPick,
}: {
  recommendations: RecommendedAction[];
  onPick: (element: AnyElementId) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 font-mono text-[10px] font-semibold uppercase leading-4 tracking-[0.18em] text-g6-text-tertiary">
        Suggested
      </span>
      <ul className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {recommendations.map((rec) => (
          <li key={`${rec.element}-${rec.label}`} className="shrink-0">
            <button
              type="button"
              onClick={() => onPick(rec.element)}
              title={rec.reason}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-g6-primary-border bg-g6-primary-bg px-3 py-1 text-[11px] font-medium leading-4 text-g6-primary-active transition-colors hover:bg-g6-primary-bg-hover"
            >
              <Sparkles className="h-2.5 w-2.5 shrink-0" aria-hidden />
              <span className="block max-w-[240px] truncate">{rec.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The header + scroll split every studio-v4 rail brings with it, for the three
 * surfaces here that are plain controls rather than rails (EntityControl, the
 * ratio list, the language list). Its X is the only way to close — no
 * outside-click dismiss, per the app-wide rule.
 */
function RailShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-2 border-b border-g6-border px-4 py-3">
        <h3 className="text-[13px] font-semibold leading-5 tracking-tight text-g6-text">
          {title}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-g6-text-tertiary transition-colors hover:bg-g6-primary-bg hover:text-g6-text"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">{children}</div>
    </div>
  );
}

export default VariationCard;
