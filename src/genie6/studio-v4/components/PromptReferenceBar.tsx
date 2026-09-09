import { useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  Coins,
  Database,
  Globe,
  Info,
  Plus,
  Search,
  Sparkles,
  X,
  Link as LinkIcon,
  // A-12.73: source + model icons (replacing emoji maps)
  Upload,
  Library,
  Pin,
  Trophy,
  Package,
  FileText,
  Zap,
  Rocket,
  Video,
  FlaskConical,
  ExternalLink,
  Image as ImageIcon,
  LayoutTemplate,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { avatars, voices } from "../../mocks/library";
import {
  CREDITS_LIMIT,
  CREDITS_REMAINING,
  computeBreakdown,
  exceedsBalance,
  formatCredits,
} from "../../lib/credits";
import { languageLabel, searchLanguages } from "../../lib/languages";
import { MODEL_CREDIT_MULTIPLIER } from "../data/modelPricing";
// MODE_LABEL is the approach-name map exported from useWizard.ts (2026-09-09)
// precisely so this chip reads off it. Three local copies of these labels
// already exist in the codebase (AlphaStep3Configure, batchDisplay, the
// wizard's own script derivation) — a fourth is not being added here.
import { buildCreditLines, MODE_LABEL, FREE_GENERATION_LABEL } from "../state/useWizard";
// Sub-type ("UGC Video · Unboxing") is DATA, read through the shared getter
// rather than re-derived from a `state.mode === "…"` conditional.
import { getSubType } from "../data/approach-subtypes";
// CHANGE #3: saved reference-URLs surfaced inside the URL-attach popover.
// Mirrors ContextRail.tsx, which imports the same helpers from "@/mocks/shared"
// (barrel re-exports src/mocks/shared/referenceUrls.ts).
import {
  getReferenceUrlsForEntity,
  shortUrl,
  type EntityType,
} from "@/mocks/shared";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CtaLayoutToggle } from "./CtaLayoutToggle";
import { AttachPopover } from "./AttachPopover";
import { getModelVisual } from "../data/studio-visuals";
import { PreviewVideo } from "./PreviewVideo";
import { isScriptLedState } from "../state/useWizard";
import type {
  UseWizardReturn,
  AttachSource,
  AttachedRef,
  ReferenceContext,
  WizardState,
  Format,
} from "../state/useWizard";
// Item #2 (model filtering) — `AlphaMode` (the ad-type/mode picked on Studio
// Home / Step 1, e.g. "performance-ad") lives in data/modes.ts, a shared data
// file, not inside either of the two files this task is fenced off from
// (ScriptRail.tsx / useWizard.ts / AlphaStep3Configure.tsx). It is threaded
// through as an OPTIONAL prop below — when the owner of AlphaStep3Configure
// wires `studioMode` through, the performance-marketing model filter turns
// on automatically; until then, filtering still runs off format + attached
// references, which are always available on `wizard.state`.
import type { AlphaMode } from "../data/modes";

/**
 * PromptReferenceBar — Step 4 prompt + reference dock.
 *
 * A-12.18 redesign (Maalik feedback):
 *   - Glass-effect container (backdrop-blur-xl, translucent bg, soft shadow).
 *   - Unified pill visual language across ALL controls — single shape, single
 *     muted-tinted active state. Lime is reserved exclusively for Generate CTA.
 *   - Aspect ratio + variations are both segmented controls (same DNA).
 *   - Brand Guidelines + Knowledge Base are subtle toggles (no solid black fills).
 *   - Char counter, big credits chip, two-line ChipBtn → all stripped down.
 *
 * Prompt ideas live ABOVE the bar (rendered by AlphaStep3Configure), not inside.
 *
 * Pinterest note (preserved): v3's column drawer is a follow-up integration.
 */

export type ChipKind =
  | "concept-angle"
  | "avatar-voice"
  | "style-brand"
  | "script"
  | "kb-instruction";

interface PromptReferenceBarProps {
  wizard: UseWizardReturn;
  onAttachPickerOpen?: (source: AttachSource) => void;
  onChipOpen?: (chip: ChipKind) => void;
  /** Forces inline Send + hides the dev CtaLayoutToggle. Used by Studio Alpha. */
  hideLayoutToggle?: boolean;
  /** Optional slot rendered in the footer row, just before the Generate button.
   *  Used by Studio Alpha to inject the Generation-settings popover trigger. */
  footerExtras?: React.ReactNode;
  /** §5 "Model list is filtered by context" — the ad-type mode picked on
   *  Studio Home / Step 1 (e.g. "performance-ad"). Optional: not wired from
   *  every call site yet. When present, it hides quick-draft models for a
   *  performance-marketing job; when absent, filtering still runs off
   *  format + attached references. */
  studioMode?: AlphaMode;
  /** §6 "Script as a pre-step" — two-phase Generate. When provided AND the
   *  wizard carries no script yet, the CTA generates the SCRIPT first
   *  (label + click both switch) instead of firing the batch. Optional on
   *  purpose: `screens/Step4Configure.tsx` (the dead predecessor screen)
   *  never passes it, so that mount keeps today's one-phase Generate with
   *  no change at its call site. */
  onGenerateScript?: () => void;
}

// A-12.73: emoji map → lucide icon map. DS §7 #10 (no emojis in product UI).
const SOURCE_ICON: Record<AttachSource, React.ElementType> = {
  upload: Upload,
  library: Library,
  pinterest: Pin,
  "brand-winner-ads": Trophy,
  "product-winner-ads": Package,
  url: LinkIcon,
  instruction: FileText,
  "industry-insights": Database,
  "seed-image": ImageIcon,
  template: LayoutTemplate,
};

/**
 * Item #2 — "Model list is filtered by context, not merely annotated ...
 * What's missing is removal: hide short-duration models for performance
 * marketing, and shortlist models by reference-video length. A user should
 * not be offered a model that cannot serve the job in front of them." (§5)
 *
 * `hint` (Fast / Higher quality / …) is the existing Figma-sourced
 * description — untouched, that part was never the defect. The three new
 * fields below are what the filter in `getAvailableModels()` reads:
 *   - `formats`      — which output formats this model can serve at all.
 *     Genie Video is video-only; offering it for an Image job is exactly
 *     the "cannot serve the job" case §5 calls out.
 *   - `maxRefDurationSec` — longest reference video this model can drive a
 *     generation from. `undefined` = uncapped. AttachedRef (useWizard.ts,
 *     out of scope for this file) does not carry a real duration field yet,
 *     so there is no real number to read per-reference. Rather than invent
 *     one, any attached reference on a video job is conservatively treated
 *     as "could be a full-length ad" (see ASSUMED_REFERENCE_DURATION_SEC)
 *     and compared against this cap — a model capped to short clips is
 *     never offered a reference it can't actually use.
 *   - `quickDraftOnly` — tuned for fast/cheap short-form drafts, not
 *     production-grade output. Hidden when the job is a performance-ad
 *     (ROAS-driven, "tested angles" per §5's Studio-mode roster) — that
 *     signal comes from the optional `studioMode` prop; see the prop doc.
 */
interface ModelOption {
  id: string;
  Icon: React.ElementType;
  name: string;
  hint?: string;
  formats: Format[];
  maxRefDurationSec?: number;
  quickDraftOnly?: boolean;
}

const MODELS: ModelOption[] = [
  {
    id: "genie-1.0",
    Icon: Sparkles,
    name: "Genie 1.0",
    hint: "Fast",
    formats: ["image", "video"],
    maxRefDurationSec: 60,
  },
  {
    id: "genie-2.0-pro",
    Icon: Rocket,
    name: "Genie 2.0 Pro",
    hint: "Higher quality",
    formats: ["image", "video"],
  },
  {
    id: "genie-flash",
    Icon: Zap,
    name: "Genie Flash",
    hint: "Ultra-fast",
    formats: ["image", "video"],
    maxRefDurationSec: 15,
    quickDraftOnly: true,
  },
  {
    id: "genie-video",
    Icon: Video,
    name: "Genie Video",
    formats: ["video"],
  },
  {
    id: "genie-labs",
    Icon: FlaskConical,
    name: "Genie Labs",
    hint: "Experimental",
    formats: ["image", "video"],
    maxRefDurationSec: 20,
    quickDraftOnly: true,
  },
];

/** Stand-in reference length used until AttachedRef carries a real duration
 *  — see the `maxRefDurationSec` doc above. 30s is a typical short-ad length,
 *  chosen so the filter errs toward NOT hiding a model that could actually
 *  serve a short reference, while still catching models capped well below
 *  it (Flash at 15s, Labs at 20s). */
const ASSUMED_REFERENCE_DURATION_SEC = 30;

/**
 * Real filtering (not annotation) off state the component already has:
 * format, attached references, and — when the caller wires it — the
 * performance-marketing signal. "If filtering would empty the list, fall
 * back to showing all and say why in a hint rather than presenting an empty
 * picker" (task spec) — `hint` carries that explanation when it happens.
 */
function getAvailableModels(
  state: Pick<WizardState, "format" | "attachedReferences">,
  studioMode?: AlphaMode,
): { models: ModelOption[]; hint: string | null } {
  const hasVideoReference =
    state.format === "video" && state.attachedReferences.length > 0;
  const isPerformanceJob = studioMode === "performance-ad";

  const filtered = MODELS.filter((m) => {
    if (state.format && !m.formats.includes(state.format)) return false;
    if (
      hasVideoReference &&
      m.maxRefDurationSec !== undefined &&
      m.maxRefDurationSec < ASSUMED_REFERENCE_DURATION_SEC
    )
      return false;
    if (isPerformanceJob && m.quickDraftOnly) return false;
    return true;
  });

  if (filtered.length === 0) {
    return {
      models: MODELS,
      hint: "Showing every model — none fully match this job, so nothing was hidden.",
    };
  }
  return { models: filtered, hint: null };
}

export const RATIOS = ["1:1", "4:5", "9:16", "16:9"] as const;
export type AspectRatio = (typeof RATIOS)[number];

/**
 * §8.2 "Every reference carries a context tag saying in what context the
 * referenced ad or video will be used" — display labels for `AttachedRef`'s
 * optional `context` field (useWizard.ts). Short, tag-safe (fits the
 * uppercase mono chip below) rather than the fuller phrasing in the type's
 * own doc comment.
 */
export const REFERENCE_CONTEXT_LABEL: Record<ReferenceContext, string> = {
  style: "Style",
  structure: "Structure",
  copy: "Copy",
  concept: "Concept",
  "whole-ad": "Whole ad",
};

export const ANGLE_CHIP_LABEL: Record<string, string> = {
  hero: "Hero",
  lifestyle: "Lifestyle",
  "social-proof": "Social Proof",
  urgency: "Urgency",
  comparison: "Comparison",
  "ugc-style": "UGC",
  unboxing: "Unboxing",
  infographic: "Infographic",
  testimonial: "Testimonial",
  "before-after": "Before / After",
  "problem-solution": "Problem · Solution",
  "feature-highlight": "Feature",
  "benefit-led": "Benefit-led",
  fomo: "FOMO",
  scarcity: "Scarcity",
  premium: "Premium",
  "value-prop": "Value Prop",
  story: "Story",
  demo: "Demo",
  educational: "Educational",
};

export function PromptReferenceBar({
  wizard,
  onAttachPickerOpen,
  onChipOpen,
  hideLayoutToggle = false,
  footerExtras,
  studioMode,
  onGenerateScript,
}: PromptReferenceBarProps) {
  const { state } = wizard;

  const [attachOpen, setAttachOpen] = useState(false);
  const [urlPopoverOpen, setUrlPopoverOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [modelOpen, setModelOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttachPick = (source: AttachSource) => {
    setAttachOpen(false);
    if (source === "upload") {
      fileInputRef.current?.click();
      return;
    }
    if (source === "url") {
      setUrlPopoverOpen(true);
      return;
    }
    // library / pinterest / brand-winner-ads / product-winner-ads / instruction
    // — all delegate to parent via onAttachPickerOpen
    onAttachPickerOpen?.(source);
  };

  const removeRef = (id: string) => {
    wizard.set(
      "attachedReferences",
      state.attachedReferences.filter((r) => r.id !== id),
    );
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newRefs: AttachedRef[] = files.map((f) => ({
      id: `up-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      source: "upload",
      label: f.name,
    }));
    wizard.set("attachedReferences", [
      ...state.attachedReferences,
      ...newRefs,
    ]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // CHANGE #3: shared url-attach handler. Both the manual paste flow and the
  // one-tap "saved for this brand/product" rows funnel through here so a URL
  // ref is built + appended + the popover closed in exactly one place.
  const attachUrlRef = (label: string, thumbnail?: string) => {
    const ref: AttachedRef = {
      id: `url-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      source: "url",
      label,
      ...(thumbnail ? { thumbnail } : {}),
    };
    wizard.set("attachedReferences", [...state.attachedReferences, ref]);
    setUrlInput("");
    setUrlPopoverOpen(false);
  };

  const submitUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    let host = trimmed;
    try {
      host = new URL(
        trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
      ).hostname;
    } catch {
      // fall back to raw
    }
    attachUrlRef(`URL · ${host}`);
  };

  // CHANGE #3: resolve the active entity for saved-URL lookup. Wizard selection
  // is XOR across brand / product / category (see WizardState docs); productId
  // is the more specific signal, so prefer it, else fall back to brandId. We do
  // not surface category here — the attach flow is brand/product-scoped per spec.
  const refEntity: { type: EntityType; id: string } | null = state.productId
    ? { type: "product", id: state.productId }
    : state.brandId
      ? { type: "brand", id: state.brandId }
      : null;
  const savedRefUrls = refEntity
    ? getReferenceUrlsForEntity(refEntity.type, refEntity.id)
    : [];

  const showInlineSend = hideLayoutToggle || state.ctaLayout === "inline";
  // isUgcMode answers a DIFFERENT question than script-led: it decides
  // whether the Avatar chip (+ "Voice follows avatar" copy) shows in place
  // of Style, below. UGC Video / a manually-set "ugc-style" angle need an
  // avatar; Product Shoot (also script-led, via studioMode) does not — it
  // has no avatar or voice concept at all. Keep this narrower than
  // isScriptLedState on purpose; do not fold Product Shoot into it.
  const isUgcMode = state.mode === "ugc-video" || state.angleId === "ugc-style";

  // §6 "Script as a pre-step" — "From there they can edit it, or go straight
  // to generate ... A review opportunity, not a hard gate." script-led now
  // comes from the SHARED useWizard.ts definition (isScriptLedState), which
  // adds Product Shoot (via studioMode) on top of the UGC/"ugc-style" cases
  // isUgcMode already covers — this local check used to hand-roll only those
  // two clauses, so Product Shoot's script sub-step never lit up the Script
  // chip or the review flow below.
  //
  // Item #1 defect: this used to also feed `generateDisabled` below, which
  // made it a HARD gate from a cold start — the only escape ("Skip review
  // from now on") lives inside the script rail's review phase, reachable
  // only after script text already exists, so Generate was simply disabled
  // with no way past it. `scriptNeedsReview` now only flags the Script chip
  // (still visible, still one click to the rail) — it no longer disables
  // anything.
  const isScriptLed = isScriptLedState(state);
  const scriptNeedsReview =
    isScriptLed && !state.scriptApproved && !state.skipScriptReview;

  // §21.2 "Credits need a breakdown" — the SAME buildCreditLines() the wizard
  // uses to set state.credits, recomputed fresh here so the Generate button
  // and the hover/click breakdown can never show a different number than the
  // one that gets charged, no matter how state.credits was last set.
  const creditBreakdown = computeBreakdown(buildCreditLines(state));
  const overBudget = exceedsBalance(creditBreakdown.total);
  const shortfall = overBudget ? creditBreakdown.total - CREDITS_REMAINING : 0;

  // §7 Rule 3 — "Generate stays disabled until every required field is
  // filled." A flow that carries no source format (Dashboard's fetched-ad
  // rows) or a hand-edited URL can land here with the Overview reading
  // "PICK A FORMAT" while this button stayed live and started a batch with
  // format undefined. Same for the entity (§4: every ad type needs one).
  // Script approval is deliberately NOT in this list — §6 says a review
  // opportunity, not a required field.
  const missingFormat = !state.format;
  const missingEntity =
    !state.brandId && !state.productId && !state.categoryId && !state.uploadedProductImage;

  // Defect audit #4 — the placeholder below promises "⌘+Enter to generate"
  // but nothing implemented it. `generateDisabled` mirrors the Generate
  // button's own `disabled` expression verbatim so the shortcut can never
  // fire a batch the button itself would refuse — same gate, same reasons.
  const generateDisabled =
    !state.prompt.trim() || overBudget || missingFormat || missingEntity;

  // §6 two-phase CTA. `scriptPhase` is true only when this mount was given an
  // onGenerateScript AND no script text exists yet — so the dead
  // screens/Step4Configure.tsx mount (which passes no handler) can never enter
  // it and keeps today's single-phase Generate verbatim. `generateDisabled` is
  // untouched and gates BOTH phases: a run missing a required field stays
  // disabled whether the button reads "Generate script" or "Generate".
  const hasScript = !!state.script?.trim();
  const scriptPhase = !hasScript && !!onGenerateScript;
  // One handler for the button and the ⌘+Enter shortcut, so the shortcut
  // always does exactly what clicking would do at that moment.
  const runGenerateAction = () => {
    if (generateDisabled) return;
    if (scriptPhase) {
      onGenerateScript?.();
      return;
    }
    wizard.goTo(5);
  };

  // Item #2 — real model filtering off format + attached references (and,
  // once wired by the caller, `studioMode`). See getAvailableModels() above.
  const { models: availableModels, hint: modelFilterHint } = useMemo(
    () => getAvailableModels(state, studioMode),
    [state.format, state.attachedReferences, studioMode],
  );

  // Approach chip value (owner ruling 2026-09-09). The big Angle+Concept card
  // is being removed from Configure, so this chip is the ONLY place Step 3's
  // decision is stated before the edit modal opens — it therefore reports what
  // Step 3 actually decided, not just the angle/concept fallout of it.
  // Three branches, in priority order:
  //   1. mode === "auto"          → "Auto"            (nothing was asked)
  //   2. approachRoute "custom"   → "Custom · <angle> · <n concepts>"
  //   3. a real preset approach   → "<Approach>[ · <sub-type>]"
  // Sub-type comes from the shared `getSubType` data lookup, never a
  // `state.mode === "…"` conditional (per-Mode rules are data, not branches).
  const approachSubTypeLabel =
    getSubType(state.mode, state.approachSubType)?.label ?? null;
  const approachValue = (() => {
    if (state.mode === "auto") return "Auto";
    if (state.approachRoute === "custom") {
      const angleLabel = state.angleId
        ? ANGLE_CHIP_LABEL[state.angleId] ?? state.angleId
        : "Auto";
      const n = state.selectedConceptIds.length;
      const conceptSummary =
        n === 0 ? "Auto" : `${n} concept${n === 1 ? "" : "s"}`;
      return `Custom · ${angleLabel} · ${conceptSummary}`;
    }
    return `${MODE_LABEL[state.mode]}${
      approachSubTypeLabel ? ` · ${approachSubTypeLabel}` : ""
    }`;
  })();

  // Avatar · Voice compound value — show the REAL selected names looked up by
  // id (null → "Auto"). Voice names are "Priya — Warm Hindi"; show the descriptor
  // after the em-dash ("Warm Hindi") so it reads distinctly from the avatar name.
  // e.g. "Priya · Warm Hindi", "Auto · Auto".
  const selectedAvatarName = state.avatarId
    ? avatars.find((a) => a.id === state.avatarId)?.name ?? "Auto"
    : "Auto";
  const selectedVoiceName = state.voiceId
    ? (voices.find((v) => v.id === state.voiceId)?.name ?? "Auto").split("—").pop()!.trim()
    : "Auto";
  const avatarVoiceValue = `${selectedAvatarName} · ${selectedVoiceName}`;

  const activeModel = MODELS.find((m) => m.id === state.modelId) ?? MODELS[0];

  return (
    <>
      {/* GLASS container — uses shared .v3-glass utility (light + dark tuned).
          `shrink-0` is load-bearing, not cosmetic. Configure's column is a
          `h-full overflow-y-auto` flex column, and this card was its only
          shrinkable child — so adding anything tall below it did NOT scroll
          the column, it squeezed this card instead. Measured: a 426px panel
          took it from 257px to 61px and clipped the Generate button out of
          sight. `getBoundingClientRect()` still reported Generate on-screen
          (clipped, not moved), so this is invisible to a rect assertion and
          only shows in a screenshot. With shrink-0 the column overflows and
          scrolls the way it was always meant to. */}
      <div
        className={cn(
          "v3-glass relative shrink-0 overflow-hidden rounded-3xl px-5 py-4",
        )}
      >
        <div className="flex w-full flex-col gap-3">
          {/* Row 0 — Reference chips (UNIFIED pill style) */}
          {onChipOpen && (
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Chip-kind stays "concept-angle" deliberately — the modal it
                  opens is being swapped elsewhere; keeping the identifier put
                  keeps this an isolated change. */}
              <RefChip
                label="Approach"
                value={approachValue}
                onClick={() => onChipOpen("concept-angle")}
              />
              <RefChip
                label="Script"
                value={
                  scriptNeedsReview
                    ? "Review"
                    : state.script
                      ? "Custom"
                      : "Auto"
                }
                emphasize={scriptNeedsReview}
                onClick={() => onChipOpen("script")}
              />
              {/* §5 locks exactly 5 chips: Concept · Script · Style · Brand
                  Guidelines · Knowledge Base. UGC-led approaches ALSO need an
                  Avatar picker (+ its "voice follows avatar" coupling) — that
                  used to render IN PLACE OF Style, silently dropping a
                  documented chip on exactly the approaches that need an
                  avatar. Avatar now renders ALONGSIDE Style instead of
                  replacing it; the row is already `flex-wrap` (above), so a
                  6th chip wraps to a second line rather than crowding one. */}
              <RefChip
                label="Style"
                value="Auto"
                onClick={() => onChipOpen("style-brand")}
              />
              {isUgcMode && (
                <>
                  <RefChip
                    label="Avatar"
                    value={avatarVoiceValue}
                    onClick={() => onChipOpen("avatar-voice")}
                  />
                  {/* Item #3 — §5/§14: "the constraint between the two
                      pickers must be visible, not discovered." A hover-only
                      title doesn't satisfy that, so this is rendered text,
                      always on when the Avatar chip is. Avatar rail itself
                      is owned elsewhere — this is the copy on the control
                      surface owned by this file. */}
                  <span className="inline-flex items-center whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                    Voice follows avatar
                  </span>
                </>
              )}
              <span aria-hidden className="mx-1 h-3.5 w-px bg-border/50" />
              <ToggleChip
                icon={<BookOpen className="h-3 w-3" />}
                label="Brand Guidelines"
                active={state.useBrandGuidelines}
                onClick={() => wizard.set("useBrandGuidelines", !state.useBrandGuidelines)}
              />
              <ToggleChip
                icon={<Database className="h-3 w-3" />}
                label="Knowledge Base"
                active={state.useKnowledgeBase}
                onClick={() => wizard.set("useKnowledgeBase", !state.useKnowledgeBase)}
              />
              {/* §15 "credits are now also shown in Studio" — a PERSISTENT
                  balance readout, not only inside the Generate button. Static
                  display (no popover) — the button's own breakdown covers the
                  interactive detail. */}
              <span
                title="Genie credit balance"
                className="ml-auto inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-border/40 bg-background/30 px-2.5 text-[11px] font-medium text-muted-foreground"
              >
                <Coins className="h-3 w-3" aria-hidden />
                <span className="font-mono text-foreground/80">
                  {formatCredits(CREDITS_REMAINING)}
                </span>
                <span aria-hidden className="text-muted-foreground/40">/</span>
                <span className="font-mono">{formatCredits(CREDITS_LIMIT)}</span>
              </span>
            </div>
          )}

          {/* Row 1 — attached refs (compact). CHANGE #2: each pill is its own
              component so it can own a per-pill hover state for the thumbnail
              preview without re-rendering the whole row. */}
          {state.attachedReferences.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {state.attachedReferences.map((ref) => (
                <AttachedRefPill
                  key={ref.id}
                  refItem={ref}
                  onRemove={() => removeRef(ref.id)}
                />
              ))}
            </div>
          )}

          {/* Row 2 — paperclip + textarea (NO char counter) */}
          <div className="relative flex items-start gap-2">
            <AttachPopover
              open={attachOpen}
              onOpenChange={setAttachOpen}
              onPick={handleAttachPick}
            >
              <button
                type="button"
                aria-label="Attach reference"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
              </button>
            </AttachPopover>

            {/* URL inline popover anchor */}
            <Popover open={urlPopoverOpen} onOpenChange={setUrlPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-hidden="true"
                  tabIndex={-1}
                  className="pointer-events-none absolute left-0 top-0 h-8 w-8 opacity-0"
                />
              </PopoverTrigger>
              <PopoverContent align="start" side="top" className="w-80 p-3">
                <div className="space-y-2">
                  {/* CHANGE #3: saved reference-URLs for the active brand/product.
                      One-tap rows attach via the shared url-attach handler. When
                      the entity has none, this whole block renders nothing. */}
                  {savedRefUrls.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="px-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Saved for this {refEntity?.type === "product" ? "product" : "brand"}
                      </div>
                      <div className="-mx-0.5 max-h-40 space-y-1 overflow-y-auto px-0.5">
                        {savedRefUrls.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => attachUrlRef(r.label, r.thumbnail)}
                            title={`${r.label} · ${r.url}`}
                            className="flex w-full items-center gap-2 rounded-md border border-border/60 bg-background/50 px-2 py-1.5 text-left transition-colors hover:border-foreground/20 hover:bg-background/70"
                          >
                            {r.thumbnail ? (
                              <img
                                src={r.thumbnail}
                                alt=""
                                aria-hidden
                                className="h-7 w-7 shrink-0 rounded object-cover"
                              />
                            ) : (
                              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                                <LinkIcon className="h-3 w-3" aria-hidden />
                              </span>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[11px] font-medium text-foreground">
                                {r.label}
                              </span>
                              <span className="block truncate text-[10px] text-muted-foreground">
                                {shortUrl(r.url)}
                              </span>
                            </span>
                            <Plus className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="h-px flex-1 bg-border/50" aria-hidden />
                        <span className="text-[10px] text-muted-foreground/70">or paste a new one</span>
                        <span className="h-px flex-1 bg-border/50" aria-hidden />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <LinkIcon className="h-3.5 w-3.5" />
                    Paste a URL
                  </div>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        submitUrl();
                      }
                    }}
                    placeholder="https://example.com/inspiration"
                    className="block w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs outline-none placeholder:text-muted-foreground focus:border-primary"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setUrlInput("");
                        setUrlPopoverOpen(false);
                      }}
                      className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={submitUrl}
                      disabled={!urlInput.trim()}
                      className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Fetch
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <textarea
              value={state.prompt}
              onChange={(e) => wizard.set("prompt", e.target.value)}
              onKeyDown={(e) => {
                // ⌘+Enter (Ctrl+Enter on Windows/Linux) — routed through the
                // SAME handler the button uses, so it fires whichever phase
                // the button currently shows (script-first or the batch), and
                // is gated by the exact same disabled condition: a missing
                // prompt, missing format/entity or an over-budget total can't
                // be bypassed by the shortcut.
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  runGenerateAction();
                }
              }}
              rows={2}
              placeholder="Describe the script, visual angle, hook… or tap a TRY prompt above to start.  ⌘+Enter to generate."
              className="block w-full flex-1 resize-none bg-transparent px-1 pt-1.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Row 3 — controls (UNIFIED segmented + pill DNA) */}
          <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-3">
            {/* Model dropdown — same pill style */}
            <Popover open={modelOpen} onOpenChange={setModelOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border/60 bg-background/50 px-3 text-[11px] font-medium text-foreground/80 transition-colors hover:border-foreground/20 hover:bg-background/70 hover:text-foreground"
                >
                  <activeModel.Icon className="h-3 w-3 text-muted-foreground" aria-hidden />
                  <span>{activeModel.name}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" side="top" className="w-[420px] p-3">
                {/* Tiny header */}
                <div className="mb-2 px-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Model
                </div>
                {/* Item #2 — only shown when filtering emptied the list and
                    fell back to showing everything (getAvailableModels). */}
                {modelFilterHint && (
                  <p className="mb-2 px-0.5 font-mono text-[11px] text-muted-foreground">
                    {modelFilterHint}
                  </p>
                )}
                {/* Visual card grid — autoplay-loop preview + name/hint + icon badge */}
                <div className="grid grid-cols-2 gap-2">
                  {availableModels.map((m) => {
                    const active = state.modelId === m.id;
                    const v = getModelVisual(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          wizard.set("modelId", m.id);
                          setModelOpen(false);
                        }}
                        aria-pressed={active}
                        className={cn(
                          "group relative flex flex-col overflow-hidden rounded-lg border text-left transition-all",
                          active
                            ? "border-primary ring-2 ring-primary"
                            : "border-border hover:border-foreground/30",
                        )}
                      >
                        {/* Video preview (16:9) */}
                        <div className="relative aspect-video w-full overflow-hidden bg-muted">
                          <PreviewVideo src={v.video} poster={v.poster} />
                          {/* Selected check badge */}
                          {active && (
                            <span
                              aria-hidden
                              className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
                            >
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        {/* Name + hint + icon badge */}
                        <div className="flex items-center gap-2 bg-card px-2.5 py-2">
                          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                            <m.Icon className="h-3.5 w-3.5" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12px] font-semibold text-foreground">
                              {m.name}
                            </span>
                            {m.hint && (
                              <span className="block truncate text-[10px] text-muted-foreground">
                                {m.hint}
                              </span>
                            )}
                          </span>
                          {/* §21.2 — model is one of the priced axes; showing
                              its multiplier right where it's picked means the
                              cost is visible on the action, not just after. */}
                          <span className="shrink-0 font-mono text-[10px] font-semibold text-muted-foreground">
                            ×{MODEL_CREDIT_MULTIPLIER[m.id] ?? 1}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            {/* Variations — number stepper input */}
            <NumberStepper
              label="Variations"
              value={state.count}
              onChange={(n) => wizard.set("count", n)}
              min={1}
              max={20}
            />

            {/* Language — added §5 "Language selector added to Configure, for
                choosing the output language of the ad". 175 options → a
                searchable popover, never a <select> scroll (Hick's law).
                Lives alongside Model + Variations — same pill DNA. */}
            <LanguagePopover wizard={wizard} />

            {/* A-12.56 (Maalik): aspect ratio merged into the 3-dot Generation
                Settings popover injected via footerExtras. AspectRatioPopover
                component kept in this file as dead code in case we want to
                revert. */}

            {/* Optional parent-provided slot (e.g. Generation-settings popover
                with Ratio + Quality + Audio sections) */}
            {footerExtras}

            {/* Generate — credits inline in label, gated + breakdown (§21.2) */}
            {showInlineSend && (
              <div className="ml-auto flex items-center gap-2">
                {/* Item #4 — §5 "'AI can make mistakes' disclaimer in the
                    flow." Quiet and factual: a Mono caption next to Generate,
                    not a banner. No copyright/platform-policy wording — that
                    is legal's call, not design's, per the same spec line. */}
                <span className="hidden shrink-0 whitespace-nowrap font-mono text-[10px] text-muted-foreground/60 sm:inline">
                  AI can make mistakes.
                </span>
                <CreditBreakdownInfo breakdown={creditBreakdown} />
                <button
                  type="button"
                  onClick={runGenerateAction}
                  disabled={generateDisabled}
                  title={
                    missingFormat
                      ? "Pick a format (Image or Video) on step 1 to generate"
                      : missingEntity
                        ? "Pick the brand, product or category this ad is for (step 2) to generate"
                        : overBudget
                        ? `Short ${formatCredits(shortfall)} credits — top up, or lower Outputs/Concepts`
                        : !state.prompt.trim()
                          ? "Describe what you want, or tap a suggestion above"
                          : scriptNeedsReview
                            ? "Script is ready to review (see the Script chip above) — or generate now, it's not required"
                            : undefined
                  }
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-5 text-[12px] font-bold text-primary-foreground transition-all",
                    "shadow-md shadow-primary/20",
                    "hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/30",
                    "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none",
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {/* A disabled button that doesn't say why is a dead end. The
                      budget shortfall already explains itself; the empty
                      prompt did not — it just greyed out, which reads as
                      broken rather than as "your turn". Script review is
                      intentionally NOT one of these reasons (§6) — it never
                      disables Generate, so it never appears in this ladder. */}
                  {missingFormat ? (
                    "Pick a format to generate"
                  ) : missingEntity ? (
                    "Pick who it's for to generate"
                  ) : !state.prompt.trim() ? (
                    "Describe your ad to generate"
                  ) : overBudget ? (
                    <>
                      Need {formatCredits(shortfall)} more
                      <span className="font-mono text-[10px] font-medium opacity-80">
                        credits
                      </span>
                    </>
                  ) : (
                    <>
                      {/* Script generation is free, and the house rule is
                          that a free target STATES it, rather than merely
                          not charging for it (`FREE_GENERATION_LABEL`,
                          useWizard.ts — "e.g. Generate script · Free instead
                          of Generate (12 credits)"). Showing the ad's total
                          here instead would read as "pressing this spends N
                          credits," which is false: nothing is charged until
                          the ad itself is generated, a separate, later click. */}
                      {scriptPhase ? "Generate script" : "Generate"}
                      <span className="font-mono text-[10px] font-medium opacity-80">
                        {scriptPhase
                          ? `· ${FREE_GENERATION_LABEL}`
                          : `(${formatCredits(creditBreakdown.total)} ${
                              creditBreakdown.total === 1 ? "credit" : "credits"
                            })`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Dev toggle — hidden in Alpha */}
            {!hideLayoutToggle && (
              <CtaLayoutToggle
                value={state.ctaLayout}
                onChange={(v) => wizard.set("ctaLayout", v)}
                className={showInlineSend ? "" : "ml-auto"}
              />
            )}
          </div>
        </div>

        {/* Hidden file input for Upload */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFiles}
        />
      </div>
    </>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  AttachedRefPill — a single attached-reference chip.
 *  CHANGE #2:
 *    - When refItem.thumbnail exists, a small rounded thumbnail replaces the
 *      source icon at the left (icon stays as the fallback).
 *    - Hovering / focusing a thumbnailed pill reveals a larger (~140px) image
 *      preview in an absolutely-positioned popover above the pill.
 *    - Remove × is preserved.
 * ────────────────────────────────────────────────────────── */
function AttachedRefPill({
  refItem,
  onRemove,
}: {
  refItem: AttachedRef;
  onRemove: () => void;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const SourceIcon = SOURCE_ICON[refItem.source];
  const hasThumb = Boolean(refItem.thumbnail);
  // §8.2 — the context tag, when the producer set one (see the field's doc
  // in useWizard.ts). Neither producer wired to this codebase yet (flow
  // hand-offs / the attach popover) supplies `context`, so the common case
  // today is still `null` — the tag segment below simply doesn't render,
  // which is the "sensible presentation when absent" the field asks for.
  const contextLabel = refItem.context
    ? REFERENCE_CONTEXT_LABEL[refItem.context]
    : null;

  return (
    <span
      className="relative inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/50 py-0.5 pl-1 pr-2 text-[11px] font-medium text-foreground"
      title={contextLabel ? `${contextLabel} reference · ${refItem.label}` : refItem.label}
      onMouseEnter={() => hasThumb && setPreviewOpen(true)}
      onMouseLeave={() => setPreviewOpen(false)}
    >
      {contextLabel && (
        <span className="shrink-0 rounded-full bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
          {contextLabel}
        </span>
      )}
      {hasThumb ? (
        <span
          className="inline-flex shrink-0"
          tabIndex={0}
          onFocus={() => setPreviewOpen(true)}
          onBlur={() => setPreviewOpen(false)}
        >
          <img
            src={refItem.thumbnail}
            alt=""
            aria-hidden
            className="h-[18px] w-[18px] rounded-full object-cover"
          />
        </span>
      ) : (
        <SourceIcon className="ml-0.5 h-3 w-3 text-muted-foreground" aria-hidden />
      )}
      <span className="max-w-[140px] truncate">{refItem.label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${refItem.label}`}
        className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
      >
        <X className="h-2.5 w-2.5" />
      </button>

      {/* Hover preview — larger thumbnail, anchored above the pill. */}
      {hasThumb && previewOpen && (
        <span
          role="tooltip"
          className="absolute bottom-full left-0 z-50 mb-1.5 block overflow-hidden rounded-lg border border-border/60 bg-popover p-1 shadow-lg"
        >
          <img
            src={refItem.thumbnail}
            alt={refItem.label}
            className="block h-[140px] w-[140px] rounded-md object-cover"
          />
        </span>
      )}
    </span>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  RefChip — picker reference chip (Concept · Avatar · Style).
 *  Single-line, label + value, unified pill DNA.
 * ────────────────────────────────────────────────────────── */
function RefChip({
  label,
  value,
  onClick,
  emphasize = false,
}: {
  label: string;
  value: string;
  onClick: () => void;
  /** §21.2 script gate — flags the chip (e.g. "Needs approval") so the
   *  requirement is visible without opening the rail. */
  emphasize?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium transition-colors",
        emphasize
          ? "border-primary/50 bg-primary/[0.08] hover:border-primary/70"
          : "border-border/60 bg-background/50 hover:border-foreground/20 hover:bg-background/70",
      )}
    >
      <span className="text-muted-foreground">{label}</span>
      <span aria-hidden className="text-muted-foreground/40">·</span>
      <span className={emphasize ? "font-semibold text-primary" : "text-foreground"}>
        {value}
      </span>
    </button>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  ToggleChip — Brand Guidelines / Knowledge Base on-off pill.
 *  Visible state indicators so it reads clearly AS a toggle:
 *    - Tiny status dot (lime-on / muted-off)
 *    - Title attribute reads "{label} · ON" / "{label} · OFF"
 *    - Active = subtle tint; Off = line-through + dimmed
 * ────────────────────────────────────────────────────────── */
function ToggleChip({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="switch"
      aria-checked={active}
      title={`${label} · ${active ? "ON" : "OFF"} — click to toggle`}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium transition-all",
        active
          ? "border-foreground/20 bg-foreground/[0.06] text-foreground"
          : "border-border/40 bg-background/30 text-muted-foreground/60 hover:text-muted-foreground",
      )}
    >
      {/* Status dot — clear visual signal for ON/OFF */}
      <span
        aria-hidden
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full transition-colors",
          active ? "bg-primary shadow-[0_0_6px_hsl(74_81%_59%/0.6)]" : "bg-muted-foreground/30",
        )}
      />
      {icon}
      <span className={cn(!active && "line-through decoration-muted-foreground/40")}>
        {label}
      </span>
    </button>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  NumberStepper — minimal number input with − / + steppers.
 *  Used for variation count. No fixed presets, type any number.
 * ────────────────────────────────────────────────────────── */
function NumberStepper({
  label,
  value,
  onChange,
  min = 1,
  max = 20,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <div
      className="inline-flex h-7 items-center gap-0.5 rounded-full border border-border/60 bg-background/50 px-1"
      title={label}
    >
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label="Decrease"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
      >
        <span className="text-[14px] leading-none">−</span>
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) onChange(clamp(n));
        }}
        min={min}
        max={max}
        className="w-7 bg-transparent text-center font-mono text-[11px] font-semibold text-foreground outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label="Increase"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
      >
        <span className="text-[12px] leading-none">+</span>
      </button>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  Aspect ratio SHAPE preview — §5 "show an example of each shape, not just
 *  the ratio name. This is what 'multi aspect ratio' means — a presentation
 *  fix, not a multi-output generation feature."
 *
 *  RATIO_PREVIEW + RatioShapeOption are the ONE ratio presentation in the
 *  codebase (exported so AlphaStep3Configure's Generation-settings popover —
 *  where the ratio picker actually lives today, A-12.56 — reuses this exact
 *  markup instead of a third hand-rolled version). AspectRatioPopover below
 *  is kept as a self-contained trigger+popover for a future standalone use;
 *  both now share the same option row.
 * ────────────────────────────────────────────────────────── */
/**
 * Item #5 defect — the previous literal table had 9:16 at w/h = 0.600 and
 * 16:9 at 1.833 instead of the true 0.5625 / 1.778, and 4:5 (w:16) vs 9:16
 * (w:12) differed by only 4px inside a 24px well — not visibly distinct
 * shapes. Computed from the real ratio below instead of hand-typed numbers,
 * so this class of arithmetic slip can't recur; RATIO_WELL_PX also grew
 * (24 → 28) to give the three portrait/square ratios (24 / 19 / 14px wide)
 * real separation instead of a few px.
 */
const RATIO_MAX_DIM = 24; // longer side of the inner shape
export const RATIO_WELL_PX = 28; // outer swatch box — RATIO_MAX_DIM + margin

function computeRatioShape(ratio: (typeof RATIOS)[number]): { w: number; h: number } {
  const [wPart, hPart] = ratio.split(":").map(Number);
  const trueRatio = wPart / hPart; // width ÷ height
  return trueRatio >= 1
    ? { w: RATIO_MAX_DIM, h: Math.round(RATIO_MAX_DIM / trueRatio) }
    : { w: Math.round(RATIO_MAX_DIM * trueRatio), h: RATIO_MAX_DIM };
}

export const RATIO_PREVIEW: Record<typeof RATIOS[number], { w: number; h: number; hint: string }> = {
  "1:1": { ...computeRatioShape("1:1"), hint: "Square" },
  "4:5": { ...computeRatioShape("4:5"), hint: "Portrait" },
  "9:16": { ...computeRatioShape("9:16"), hint: "Story / Reel" },
  "16:9": { ...computeRatioShape("16:9"), hint: "Landscape" },
};

/** One selectable row: proportioned shape swatch + ratio + its use. */
export function RatioShapeOption({
  ratio,
  active,
  onSelect,
}: {
  ratio: typeof RATIOS[number];
  active: boolean;
  onSelect: () => void;
}) {
  const { w, h, hint } = RATIO_PREVIEW[ratio];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
        active ? "bg-primary/[0.08]" : "hover:bg-muted",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-sm border",
          active ? "border-primary bg-primary/10" : "border-foreground/40",
        )}
        style={{ width: `${RATIO_WELL_PX}px`, height: `${RATIO_WELL_PX}px` }}
      >
        <span
          aria-hidden
          className={cn(
            "block rounded-[1px]",
            active ? "bg-primary" : "bg-foreground/40",
          )}
          style={{ width: `${w}px`, height: `${h}px` }}
        />
      </span>
      <span className="font-mono text-[11px] font-semibold">{ratio}</span>
      <span className="ml-auto text-[10px] text-muted-foreground">{hint}</span>
      {active && <Check className="h-3 w-3 shrink-0 text-primary" strokeWidth={3} />}
    </button>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  AspectRatioPopover — pill trigger + popover with visual previews.
 *  Minimal: shows current ratio in the trigger, dropdown for selection.
 * ────────────────────────────────────────────────────────── */
function AspectRatioPopover({
  value,
  onChange,
}: {
  value: typeof RATIOS[number];
  onChange: (r: typeof RATIOS[number]) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border/60 bg-background/50 px-3 text-[11px] font-medium text-foreground/80 transition-colors hover:border-foreground/20 hover:bg-background/70 hover:text-foreground"
          title="Aspect ratio"
        >
          <span className="font-mono">{value}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className="w-44 p-1">
        {RATIOS.map((r) => (
          <RatioShapeOption
            key={r}
            ratio={r}
            active={value === r}
            onSelect={() => {
              onChange(r);
              setOpen(false);
            }}
          />
        ))}
      </PopoverContent>
    </Popover>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  LanguagePopover — §5 "Language selector added to Configure, for choosing
 *  the output language of the ad." 175 options (src/genie6/lib/languages.ts)
 *  → a SEARCHABLE popover, never a <select> scroll (Hick's law). Reads/writes
 *  wizard.state.language directly — no new props needed, the wizard is
 *  already threaded through. The Shell agent owns ?lang= in the URL; this
 *  only touches wizard state.
 * ────────────────────────────────────────────────────────── */
function LanguagePopover({ wizard }: { wizard: UseWizardReturn }) {
  const { state } = wizard;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchLanguages(query), [query]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Output language"
          className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border/60 bg-background/50 px-3 text-[11px] font-medium text-foreground/80 transition-colors hover:border-foreground/20 hover:bg-background/70 hover:text-foreground"
        >
          <Globe className="h-3 w-3 text-muted-foreground" aria-hidden />
          <span className="font-mono">{languageLabel(state.language)}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className="w-72 p-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Globe className="h-3.5 w-3.5" />
          Output language
        </div>
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 175 languages…"
            aria-label="Search output languages"
            autoFocus
            className="h-8 w-full rounded-full border border-border/60 bg-background/50 pl-7 pr-2 text-[12px] outline-none transition-colors focus:border-primary"
          />
        </div>
        <ul className="max-h-64 space-y-0.5 overflow-y-auto pr-0.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/10 [&::-webkit-scrollbar]:w-1.5">
          {results.map((l) => {
            const active = state.language === l.code;
            return (
              <li key={l.code}>
                <button
                  type="button"
                  onClick={() => {
                    wizard.set("language", l.code);
                    setOpen(false);
                    setQuery("");
                  }}
                  aria-pressed={active}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">
                    {l.name}{" "}
                    <span className="text-muted-foreground">({l.region})</span>
                  </span>
                  <span className="shrink-0 font-mono text-[10px] uppercase text-muted-foreground">
                    {l.code}
                  </span>
                  {active && <Check className="h-3 w-3 shrink-0 text-primary" />}
                </button>
              </li>
            );
          })}
          {results.length === 0 && (
            <li className="px-2 py-6 text-center text-[11px] italic text-muted-foreground">
              No languages match "{query}"
            </li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  CreditBreakdownInfo — §21.2 "Credits need a breakdown, not just a
 *  number." Small info trigger next to Generate; click (Popover) or hover
 *  (native title) shows the exact multiplier chain computeBreakdown() will
 *  charge — outputs × concepts × model × quality — so a 6× jump between
 *  Configure and Results never again arrives unexplained.
 * ────────────────────────────────────────────────────────── */
function CreditBreakdownInfo({
  breakdown,
}: {
  breakdown: ReturnType<typeof computeBreakdown>;
}) {
  const [open, setOpen] = useState(false);
  const titleText = breakdown.lines
    .map((l) => `${l.label} ${l.op === "base" ? l.factor : `×${l.factor}`}${l.note ? ` (${l.note})` : ""}`)
    .join(" · ");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Credit cost breakdown"
          title={titleText}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" side="top" className="w-64 p-3">
        <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Credit breakdown
        </p>
        <ul className="space-y-1">
          {breakdown.lines.map((l, i) => (
            <li key={i} className="flex items-center justify-between text-[12px]">
              <span className="text-foreground/80">
                {l.label}
                {l.note ? ` · ${l.note}` : ""}
              </span>
              <span className="font-mono text-foreground">
                {l.op === "base" ? l.factor : `×${l.factor}`}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-2">
          <span className="text-[12px] font-semibold text-foreground">Total</span>
          <span className="font-mono text-[13px] font-bold text-primary">
            {formatCredits(breakdown.total)} credits
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
