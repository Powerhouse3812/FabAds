import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Braces, Check, ChevronDown, ChevronRight, Copy, MoreVertical, Search, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  brands as ALL_BRANDS,
  products as ALL_PRODUCTS,
} from "@/mocks/shared";
import { getConceptById } from "../data/concepts";
import { autoFillForApproach, getSubType } from "../data/approach-subtypes";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { sampleOutputs } from "../../mocks/sample-outputs";
import { VIDEO_QUALITY_TIERS } from "../state/useWizard";
import {
  isProductShootState,
  isScriptLedState,
  scriptResetPatch,
  deriveScriptText,
} from "../state/useWizard";
import type {
  AttachSource,
  AttachedRef,
  UseWizardReturn,
  WizardState,
} from "../state/useWizard";
import { useOverviewVariant, BAND_CONTENT_MAX_W } from "../state/useOverviewVariant";
import { resolveFlowContext } from "../../flows/data/resolveFlowContext";
import type { FlowContext } from "../../flows/flowTypes";
import { HeroHeader } from "../components/HeroHeader";
import { SectionHeader } from "../components/SectionHeader";
import {
  PromptReferenceBar,
  RatioShapeOption,
  type ChipKind,
  ANGLE_CHIP_LABEL,
  RATIOS,
} from "../components/PromptReferenceBar";
import { RailGenerateConcepts } from "../components/RailGenerateConcepts";
import { GenerateConceptsForm } from "@/genie6/concepts/GenerateConceptsForm";
// The Angle+Concept edit surface is Step 3 itself, embedded — see the
// `railMode === "concept-angle"` block below. `ConceptAngleRail` (a separate,
// narrower picker, no longer imported here) used to render there; that
// surface and the standalone Angle+Concept card on this page were both
// retired 2026-09-09 (owner: "we have to show that either user choosed which
// approach or auto, or manual/custom... on clicking that chip edit modal
// will open, jisme previous step wala approach wala open ho jayega") in
// favour of reusing Step 3's own screen, prefilled, so there is exactly one
// place that UI is built rather than two that can drift.
import { Step3Approach } from "./Step3Approach";
import { PreviewVideo } from "../components/PreviewVideo";
import { AvatarVoiceRail } from "../components/AvatarVoiceRail";
import { PodcastSpeakersField } from "../components/PodcastSpeakersField";
import { ScriptRail } from "../components/ScriptRail";
import { KbInstructionRail } from "../components/KbInstructionRail";
import { LibraryColumnDrawer } from "../components/LibraryColumnDrawer";
import { BrandWinnerAdsDrawer } from "../components/BrandWinnerAdsDrawer";
import { ProductWinnerAdsDrawer } from "../components/ProductWinnerAdsDrawer";
import { IndustryInsightsPicker } from "../components/IndustryInsightsPicker";
import { SeedImageRail } from "../components/SeedImageRail";
import { TemplateRail } from "../components/TemplateRail";
import { StyleBrandRail } from "../components/StyleBrandRail";
import { InstructionsPickerModal } from "../components/InstructionsPickerModal";
import type { AlphaMode } from "./StudioHome";

export type RailMode =
  | null
  | "generate-concepts"
  | "ai-generate-concepts"
  | "library"
  | "pinterest"
  | "brand-winner-ads"
  | "product-winner-ads"
  | "concept-angle"
  | "avatar-voice"
  | "style-brand"
  | "script"
  | "kb-instruction"
  | "instructions"
  | "industry-insights"
  | "seed-image"
  | "template";

const VALID_PICKERS: ReadonlyArray<Exclude<RailMode, null>> = [
  "generate-concepts",
  "ai-generate-concepts",
  "library",
  "pinterest",
  "brand-winner-ads",
  "product-winner-ads",
  "concept-angle",
  "avatar-voice",
  "style-brand",
  "script",
  "kb-instruction",
  "instructions",
  "industry-insights",
  "seed-image",
  "template",
];

/** URL-backed accordion open state. Default behaviour preserved if no param.
 *  Pushes to history with replace=true (no clutter). */
function useAccordionUrl(key: string, defaultOpen: boolean): [boolean, (next: boolean) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get(key);
  const open = param === "open" || (param === null && defaultOpen);
  const setOpen = (next: boolean) => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (next === defaultOpen) sp.delete(key);
        else sp.set(key, next ? "open" : "closed");
        return sp;
      },
      { replace: true },
    );
  };
  return [open, setOpen];
}

/** Angles list in display order — 20 entries, shown in 2 rows (no scroll). */
const ANGLE_IDS: string[] = [
  "hero",
  "lifestyle",
  "social-proof",
  "urgency",
  "comparison",
  "ugc-style",
  "unboxing",
  "infographic",
  "testimonial",
  "before-after",
  "problem-solution",
  "feature-highlight",
  "benefit-led",
  "fomo",
  "scarcity",
  "premium",
  "value-prop",
  "story",
  "demo",
  "educational",
];

/**
 * DEFECT FIX (adversarial review) — §7.4 trend-angle → catalogue angle id.
 * A trend's angle arrives as a free-text sentence ("Delayed product reveal —
 * lead with the athlete or action, reveal the product only at the end."),
 * never a catalogue id. This used to get written straight into `angleId`,
 * which then rendered through `ANGLE_CHIP_LABEL[angleId] ?? angleId` — an
 * 89-char sentence in a one-word chip slot, and it renders through that same
 * fallback in FOUR places (the angle grid tiles, the collapsed summary row,
 * MasterPromptCard's "Overview", and KbInstructionRail's targetAngleLabel).
 * Match the sentence against the known ids/labels first; only a genuine hit
 * is chip-safe. No match → return null and let the caller carry the raw text
 * in a text slot instead (see `angleDescription` on WizardState).
 */
function matchTrendAngleId(trendAngle: string): string | null {
  const hay = trendAngle.toLowerCase();
  for (const id of ANGLE_IDS) {
    const label = (ANGLE_CHIP_LABEL[id] ?? id).toLowerCase();
    if (hay.includes(id) || hay.includes(label)) return id;
  }
  return null;
}

interface AlphaStep3Props {
  wizard: UseWizardReturn;
  studioMode?: AlphaMode;
  onBack?: () => void;
}

/**
 * AlphaStep3Configure (A-12.8) — Studio Alpha's Configure step.
 *
 * Differences from Beta's Step4Configure:
 *   - Prompt bar is at the TOP of the form (not bottom)
 *   - Below the prompt bar: a "Trending concepts" horizontal scroll
 *     strip (real ad creatives from sample-outputs.ts top-quality)
 *   - Click a trending concept = adds to selectedConceptIds
 *   - Footer (WizardNav) is HIDDEN on this step — Generate fires from
 *     the prompt bar's inline Send button (Variant A behavior, forced)
 *   - HeyGen-minimal — nothing else on the page
 */
export function AlphaStep3Configure({ wizard, studioMode: _studioMode, onBack }: AlphaStep3Props) {
  // Picker modal ↔ URL (?picker=concept-angle / script / etc.)
  // replace:false so browser Back closes the modal.
  const [searchParams, setSearchParams] = useSearchParams();
  // "rail" (default, aside owns Overview) vs "band" (Overview moves to a
  // full-width strip above the step, freeing the aside's ~300px back into
  // this column) — same reader the shell uses, so the two can never disagree.
  const [overviewVariant] = useOverviewVariant();
  const urlPicker = searchParams.get("picker");
  const railMode: RailMode =
    urlPicker && VALID_PICKERS.includes(urlPicker as Exclude<RailMode, null>)
      ? (urlPicker as RailMode)
      : null;
  // Rail-specific URL keys that need stripping when the modal closes —
  // otherwise stale `?scriptPrompt=…&scriptGen=…` lingers after backdrop /
  // Save / programmatic close. Single source of truth.
  const RAIL_OWNED_KEYS = ["scriptTab", "scriptPrompt", "scriptGen"] as const;
  const setRailMode = (next: RailMode) => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (next === null) {
          sp.delete("picker");
          for (const k of RAIL_OWNED_KEYS) sp.delete(k);
        } else {
          sp.set("picker", next);
        }
        return sp;
      },
      { replace: false },
    );
  };

  // Generation-settings popover ↔ URL (?settings=open).
  // replace:false so browser Back closes the popover first (mirrors picker).
  const settingsOpen = searchParams.get("settings") === "open";
  const setSettingsOpen = (next: boolean) => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (next) sp.set("settings", "open");
        else sp.delete("settings");
        return sp;
      },
      { replace: false },
    );
  };

  // §7.3 / §7.4 / §7 — flow context (Other Flows). Resolved from the SAME
  // three URL params every Studio step reads (?src/?ref/?act) — Configure
  // doesn't own the banner (Flows UI agent's job) but DOES own the
  // suggestions rail and the Angle·Concept card those flows feed. `null`
  // when Studio is running standalone (no flow), which is the common case.
  const flowCtx: FlowContext | null = resolveFlowContext(searchParams);

  // §21.2 "Script becomes a gated pre-step" — script-led = the SHARED
  // definition (useWizard.ts's isScriptLedState: UGC Video, a manually-set
  // "ugc-style" angle, OR Product Shoot via studioMode), so the chip label,
  // the Generate gate, and the ScriptRail's approve flow all agree on what
  // counts as script-led — including Product Shoot, which the old local
  // two-clause check here could never recognize.
  const isScriptLed = isScriptLedState(wizard.state);

  // Generate the button reads BEFORE a script exists, per the owner's ruling
  // 2026-09-09: the SAME Generate button that makes the ad first reads
  // "Generate script" while `state.script` is empty, drafting one (via the
  // same `deriveScriptText` the background auto-draft effect already uses —
  // this is that same draft, just user-triggered instead of automatic) and
  // opening the ONE script editor (ScriptRail, `railMode === "script"`) so
  // the draft is reviewed/edited/approved before the ad itself is made. Once
  // a script exists — by this path, a flow carry, or the background
  // auto-draft — the button relabels to "Generate" and does what it always
  // did. See `PromptReferenceBar`'s `onGenerateScript` prop for the other
  // half of this contract.
  const onGenerateScript = () => {
    wizard.patch({ script: deriveScriptText(wizard.state), scriptOrigin: "auto" });
    setRailMode("script");
  };

  // Script provenance. The comment this replaces asserted that "the CONTENT
  // needs no new plumbing — script already arrived pre-filled from whatever
  // hand-off set that source". That was FALSE: no hand-off carried script
  // text at all, so this label printed "Same script · Video Sage" over a
  // script `deriveScriptText()` had just written locally. Fixed 2026-09-09 —
  // `FlowSourceRef.script` now carries the real text (Video Sage is the only
  // module whose data actually holds one) and `flowInitialPatch` writes it.
  //
  // So the label is asserted off the TEXT, never off `generationSource`: it
  // shows only while what's in state is still character-for-character what
  // the flow handed over, and correctly disappears the moment the user edits
  // it — at which point it is their script, not the source's.
  const carriedScript = flowCtx?.ref.script;
  const scriptCarriedFrom =
    carriedScript && wizard.state.script === carriedScript
      ? (flowCtx?.module.label ?? "source")
      : null;

  // The trending-concepts strip (search + angle-matched re-ordering) lived
  // here only to feed this page's own Angle+Concept card, removed below.

  const handleAttachSave =
    (source: AttachSource) => (refs: AttachedRef[]) => {
      wizard.set("attachedReferences", [
        ...wizard.state.attachedReferences,
        ...refs.map((r) => ({ ...r, source })),
      ]);
      setRailMode(null);
    };
  const handleAttachCancel = () => setRailMode(null);

  const handleAttachPickerOpen = (source: AttachSource) => {
    if (source === "instruction") {
      setRailMode("instructions");
      return;
    }
    if (
      source === "library" ||
      source === "pinterest" ||
      source === "brand-winner-ads" ||
      source === "product-winner-ads" ||
      source === "industry-insights" ||
      source === "seed-image" ||
      source === "template"
    ) {
      setRailMode(source);
    }
  };

  const handleChipOpen = (chip: ChipKind) => {
    setRailMode(chip);
  };

  // A-12.9 (Maalik MOM 06-05): once the user touches angle OR concepts, stop
  // auto-filling — going back/forward through the wizard must not clobber a
  // manual pick. A ref (not state) so flipping it never triggers a re-render.
  //
  // §4/§6 "a flow-supplied angle lands in it, exactly as today": seeded TRUE
  // when angleId OR selectedConceptIds is already non-empty at first mount
  // (from flowInitialPatch's URL-restore, a `?concepts=` hand-off from
  // /iq/genie6/concepts, Rule 1's variation pre-fill, or any pick made on an
  // earlier step of this same wizard instance) — otherwise the mode-based
  // auto-fill effect below would overwrite that pick on this very mount,
  // since it only checks THIS ref and starts unaware anything was pre-filled.
  //
  // DEFECT FIX (adversarial review) — §13 "multi-select concepts": a
  // concepts-only hand-off carries `?concepts=` but never `?angle=`, so
  // angleId alone was false here even though selectedConceptIds already held
  // the user's N picks. That let the auto-fill effect below fire and stomp
  // the multi-select with `autoFillForApproach("scratch", …)`'s `[]` (or, if
  // an approach had since been picked, that approach's single default
  // concept) — N concepts silently collapsing to 0 or 1 before Generate.
  const userEditedRef = useRef(
    wizard.state.angleId !== null || wizard.state.selectedConceptIds.length > 0,
  );

  // Click trending → toggle into selectedConceptIds via synthetic prefix
  // (so it doesn't collide with library concept IDs).
  const toggleTrending = (sampleId: string) => {
    userEditedRef.current = true;
    const synthId = `trend:${sampleId}`;
    const current = wizard.state.selectedConceptIds;
    const next = current.includes(synthId)
      ? current.filter((x) => x !== synthId)
      : [...current, synthId];
    wizard.set("selectedConceptIds", next);
  };

  const isTrendingSelected = (id: string) =>
    wizard.state.selectedConceptIds.includes(`trend:${id}`);

  // The Angle+Concept editability locks (`getApproachLocks`) and the
  // angle-toggle handler that read them (`toggleAngle`) lived here only to
  // serve this page's own Angle+Concept card, which is removed below —
  // `Step3Approach` (now embedded via `railMode === "concept-angle"`)
  // computes its own locks internally, unrelated to this file.


  // A-12.57: Concepts strip ref + scroll-to-start on angle pick.
  // When wizard.state.angleId changes, smooth-scroll the strip back to the
  // start so the matching concepts (re-ordered first) are immediately visible.
  const conceptStripRef = useRef<HTMLUListElement | null>(null);
  useEffect(() => {
    if (!conceptStripRef.current) return;
    conceptStripRef.current.scrollTo({ left: 0, behavior: "smooth" });
  }, [wizard.state.angleId]);

  // A-12.9: auto-fill angle + concept from the chosen approach (+ sub-type).
  // Runs on mount and whenever mode/approachSubType change — but ONLY while the
  // user hasn't manually edited the picks (userEditedRef guard). Uses one
  // wizard.patch so angle + concepts land together.
  const { mode, approachSubType } = wizard.state;
  useEffect(() => {
    if (userEditedRef.current) return;
    const { angleId, conceptIds } = autoFillForApproach(mode, approachSubType);
    // DEFECT FIX (adversarial review) — belt-and-braces on top of the
    // userEditedRef guard above: only ever WRITE a field that is currently
    // empty. Never blindly `patch({ angleId, selectedConceptIds: conceptIds })`
    // — that overwrites a genuine selection with this approach's `null`/`[]`
    // default the instant mode/approachSubType next changes.
    const fillPatch: Partial<WizardState> = {};
    if (wizard.state.angleId === null && angleId !== null) {
      fillPatch.angleId = angleId;
    }
    if (wizard.state.selectedConceptIds.length === 0 && conceptIds.length > 0) {
      fillPatch.selectedConceptIds = conceptIds;
    }
    if (Object.keys(fillPatch).length > 0) wizard.patch(fillPatch);
    // wizard.patch is stable (useCallback); intentionally excluded so this
    // re-runs only on mode / approachSubType change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, approachSubType]);

  // §7.4 "Trends → Genie: BOTH travel — the trend fills the angle, and its
  // supporting creative arrives as a reference." Mount-only (flow context is
  // fixed for the life of this Configure mount) and idempotent — guarded so
  // it never re-applies (a later manual edit must win) and never double-
  // attaches a reference flowInitialPatch may have already added upstream.
  // Runs AFTER the mode-based auto-fill effect above (hook declaration order)
  // so a trend angle always wins over the approach's default for this mount.
  const flowSeededRef = useRef(false);
  useEffect(() => {
    if (flowSeededRef.current) return;
    flowSeededRef.current = true;
    if (!flowCtx || flowCtx.module.key !== "trends") return;
    // Gated on the ACTION, not just the module. "Use hook" is a trends action
    // too, and it carries the hook in `prompt` on purpose — seeding the
    // trend's angle underneath it would answer a question that flow
    // deliberately leaves open (a hook satisfies neither angle nor concept,
    // per SOURCE_CARRIES), so the user would silently lose the angle choice
    // the step is about to ask them for.
    const seedsTrendAngle =
      flowCtx.action.id === "generate-against-trend" ||
      flowCtx.action.id === "script-from-trend";
    if (!seedsTrendAngle) return;

    const patch: Partial<WizardState> = {};
    if (flowCtx.ref.trendAngle && !wizard.state.angleId) {
      // DEFECT FIX (adversarial review) — a trend's angle is a free-text
      // sentence, never a catalogue id. Try to resolve it to a real
      // ANGLE_IDS entry first (chip-safe); only a genuine miss falls back to
      // angleDescription, a text slot, never the angleId chip slot itself.
      const matchedAngleId = matchTrendAngleId(flowCtx.ref.trendAngle);
      if (matchedAngleId) {
        patch.angleId = matchedAngleId;
      } else {
        patch.angleDescription = flowCtx.ref.trendAngle;
      }
      userEditedRef.current = true; // protect from a later mode change re-auto-filling
    }
    const refId = `flow-${flowCtx.ref.id}`;
    const alreadyAttached = wizard.state.attachedReferences.some((r) => r.id === refId);
    if (!alreadyAttached) {
      patch.attachedReferences = [
        ...wizard.state.attachedReferences,
        {
          id: refId,
          source: "url",
          label: `Trend · ${flowCtx.ref.title}`,
          ...(flowCtx.ref.thumbnail ? { thumbnail: flowCtx.ref.thumbnail } : {}),
        },
      ];
    }
    if (Object.keys(patch).length > 0) wizard.patch(patch);
    // Mount-only by design — see comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Readable brand/product name for AvatarVoiceRail's "Suggested for [Name]"
  // banner. Product is the more specific context, so prefer its name; else fall
  // back to the brand. null when neither is set → rail hides the suggestion UI.
  // Mirrors ContextRail's product-then-brand resolution precedence.
  const avatarVoiceContextLabel = useMemo(() => {
    const product = wizard.state.productId
      ? ALL_PRODUCTS.find((p) => p.id === wizard.state.productId)
      : undefined;
    if (product) return product.name;
    const brand = wizard.state.brandId
      ? ALL_BRANDS.find((b) => b.id === wizard.state.brandId)
      : undefined;
    return brand?.name ?? null;
  }, [wizard.state.productId, wizard.state.brandId]);

  const promptSectionEl = (
    <>
      {/* AI prompt suggestions — ABOVE the prompt bar, sleek single-line strip.
          §7.3/§7.4: adapted to the flow source (Reports' ad performance,
          Trends' hook) when one exists; angle-aware fallback otherwise.

          DEFECT FIX (adversarial review) — this used to gate on an empty
          prompt only. flowInitialPatch() (resolveFlowContext.ts)
          pre-fills the prompt for every variation action AND all three
          Trends actions, so for exactly the flows §8.3/§8.4 wrote this
          rail for, the prompt is never empty on arrival and the rail
          could never render. A flow context now forces the rail open
          regardless of prompt content; plain Studio (no flow) keeps the
          original empty-prompt-only behaviour. */}
      {(flowCtx !== null || wizard.state.prompt.trim().length === 0) && (
        <PromptSuggestions
          angleId={wizard.state.angleId}
          flowSuggestions={flowCtx ? flowAdaptedSuggestions(flowCtx) : null}
          onPick={(p) => wizard.set("prompt", p)}
        />
      )}

      {/* Prompt bar — Layout A (inline Send) always.
          footerExtras injects the Generation-settings popover trigger
          between the aspect-ratio picker and the Generate button. */}
      <PromptReferenceBar
        wizard={wizard}
        onAttachPickerOpen={handleAttachPickerOpen}
        onChipOpen={handleChipOpen}
        onGenerateScript={onGenerateScript}
        hideLayoutToggle
        studioMode={wizard.state.studioMode ?? undefined}
        footerExtras={
          <GenerationSettingsButton
            wizard={wizard}
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
          />
        }
      />
    </>
  );

  return (
    <>
      {/* Form content — centered single column. ContextRail lives in the global shell.
          A-12.67 (Maalik): h-full so the step claims viewport height; the
          combined Angles+Concepts card becomes the single flex-1 min-h-0
          region absorbing leftover height. Concepts grid's max-h scroll
          becomes the only internal scroll surface — page never scrolls.
          Width: "rail" (default) keeps the historical max-w-2xl. "band"
          moves Overview out of the aside into a strip above the step, so
          the ~300px it used to own is free — the prompt card (this
          column's primary surface) widens into it via BAND_CONTENT_MAX_W —
          the ONE definition of that width, shared with the band above so the
          two align on the same edges. Other
          children below opt back OUT of that width individually rather
          than stretch by default — see the Podcast-speakers wrapper. */}
      <div
        className={cn(
          "mx-auto flex h-full w-full flex-col gap-4 overflow-y-auto px-4 pt-6 pb-6 md:gap-6 md:px-6 md:pt-8 md:pb-10",
          overviewVariant === "band" ? BAND_CONTENT_MAX_W : "max-w-2xl",
        )}
      >
        <HeroHeader title="Configure" onBack={onBack} />

          {/* Podcast Mode only (§9, Maalik 2026-09-08) — the speaker-count
              field is the one dimension unique to this Mode, so it renders
              here unconditionally, right under the header.
              Every other Mode: studioMode !== "podcast", so this branch
              renders nothing and nothing else on this screen changes. Reads
              wizard.state.studioMode rather than the studioMode prop above
              (still unused, still `_studioMode`) — that's the field the
              surrounding code already trusts, e.g. PromptReferenceBar below
              is fed `studioMode={wizard.state.studioMode ?? undefined}`.

              Width: this is a compact glass-card list of single-line rows
              (icon + label + edit affix) — it reads as sparse/stranded
              stretched to the wider band width, unlike the prompt card. In "band" it
              stays pinned to the historical max-w-2xl and centers inside
              the wider column instead of stretching with it; in "rail" the
              extra wrapper is a no-op (parent is already max-w-2xl), so the
              rail DOM/layout is unchanged. */}
          {wizard.state.studioMode === "podcast" && (
            overviewVariant === "band" ? (
              <div className="mx-auto w-full max-w-2xl">
                <PodcastSpeakersField wizard={wizard} />
              </div>
            ) : (
              <PodcastSpeakersField wizard={wizard} />
            )
          )}

          {/* The below-prompt-bar Script section (ScriptCard, then the
              script-picker/ comparison that briefly replaced it) was retired
              2026-09-09 — owner: consolidate script into the prompt bar
              itself rather than a separate section. The Script chip
              (PromptReferenceBar) and the Generate button's "Generate
              script" phase are now the ONLY script surface on this page;
              both open the same ScriptRail modal (`railMode === "script"`,
              below) that has been the one script editor since §6. */}
          {promptSectionEl}

          {/* Master-prompt card stays unwired (Maalik 06-06) — out of this
              audit's 4 defects; not reinstated here. */}

          {/* The standalone Angle+Concept card that used to render here was
              retired 2026-09-09 — owner: that decision is Step 3's, and this
              page should trust it rather than offer a second place to change
              it. What Step 3 decided is now surfaced by the "Approach" chip
              on the prompt bar above (PromptReferenceBar), and clicking it
              opens Step 3 itself, embedded, prefilled with the current pick
              — see `railMode === "concept-angle"` below. */}

      </div>

      {/* ── Picker modal — centered dialog over a blurred backdrop ──
          A stale `?picker=script` (or `?picker=concept-angle`) in a
          shared/refreshed URL lands on a working surface with its own Close,
          never a dead shell — every branch below is safe to open directly. */}
      {railMode !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6">
          {/* Backdrop — decorative only. Does NOT dismiss on click; every
              picker inside renders its own explicit close (X) / Cancel
              control, which is the only way to close this modal. */}
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
          {/* Dialog box — glass chassis */}
          <div className="v3-glass relative z-10 flex max-h-[85dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-2xl md:max-h-[70vh]">
            {railMode === "generate-concepts" && (
              <RailGenerateConcepts
                selectedIds={wizard.state.selectedConceptIds}
                onChange={(ids) => wizard.set("selectedConceptIds", ids)}
                onClose={handleAttachCancel}
              />
            )}
            {railMode === "ai-generate-concepts" && (
              <div className="flex flex-col p-4">
                <header className="mb-3 flex items-center gap-2">
                  <h3 className="text-[13px] font-semibold tracking-tight">
                    Generate concepts with AI
                  </h3>
                  <button
                    type="button"
                    onClick={handleAttachCancel}
                    aria-label="Close"
                    className="ml-auto text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </header>
                <GenerateConceptsForm
                  surface="rail"
                  entityContext={
                    wizard.state.brandId
                      ? {
                          type: "brand",
                          id: wizard.state.brandId,
                          label: wizard.state.brandId,
                        }
                      : undefined
                  }
                  onConceptSaved={(c) => {
                    wizard.set("selectedConceptIds", [
                      ...wizard.state.selectedConceptIds,
                      c.id,
                    ]);
                  }}
                  onClose={handleAttachCancel}
                />
              </div>
            )}
            {railMode === "concept-angle" && (
              // Step 3 itself, embedded — not a narrower picker. Prefilled
              // with whatever the run already carries (mode/sub-type/route/
              // angle/concepts all live on `wizard.state`, which Step3Approach
              // reads directly), so re-opening it always shows the real
              // current pick, never a reset one. `onAdvance` is given
              // `handleAttachCancel` rather than a step-navigating callback —
              // Configure stays on Step 4 the whole time; only the modal
              // closes. Step3Approach computes its own sub-type locks
              // internally, so no `locks`/`angleLock` prop is passed here.
              <Step3Approach
                wizard={wizard}
                embedded
                onAdvance={handleAttachCancel}
                onBack={handleAttachCancel}
                onClose={handleAttachCancel}
              />
            )}
            {railMode === "avatar-voice" && (
              <AvatarVoiceRail
                selectedAvatarId={wizard.state.avatarId}
                selectedVoiceId={wizard.state.voiceId}
                onAvatarChange={(id) => wizard.set("avatarId", id)}
                onVoiceChange={(id) => wizard.set("voiceId", id)}
                contextLabel={avatarVoiceContextLabel}
                auditAngleLabel={
                  wizard.state.angleId
                    ? ANGLE_CHIP_LABEL[wizard.state.angleId] ?? wizard.state.angleId
                    : undefined
                }
                onClose={handleAttachCancel}
              />
            )}
            {railMode === "style-brand" && (
              <StyleBrandRail
                brandId={wizard.state.brandId}
                onClose={handleAttachCancel}
              />
            )}
            {railMode === "script" && (
              // §21.2 "Script becomes a gated pre-step": generate → review →
              // edit → approve → then generate. `gated` restricts the
              // review/approve sequence to script-led approaches (UGC Video,
              // or anything else with angleId "ugc-style") — a non-script
              // approach saves and closes exactly as before.
              <ScriptRail
                currentScript={wizard.state.script}
                gated={isScriptLed}
                scriptApproved={wizard.state.scriptApproved}
                skipScriptReview={wizard.state.skipScriptReview}
                promptSeed={wizard.state.prompt}
                // §6 — these four were plumbed through ScriptRail's props
                // (all optional, so the rail compiled and rendered fine
                // without them) but never actually passed from here, which
                // is exactly why the waiting/shimmer view and the Product
                // Shoot "shot plan" copy never appeared: `scriptGenerating`
                // drives the shimmer, `isProductShoot` swaps the language,
                // `scriptOrigin` labels "Auto-written" vs "Edited by you" in
                // the review header, and `onRegenerate` wires the review
                // phase's Regenerate action to useWizard's own reset patch.
                scriptGenerating={wizard.state.scriptGenerating}
                isProductShoot={isProductShootState(wizard.state)}
                scriptOrigin={wizard.state.scriptOrigin}
                // Flow-carried provenance ("Same script · Video Sage") used
                // to render on a Configure-page card that's since been
                // removed (see the comment above `promptSectionEl`'s render
                // call). Surfaced here instead so the signal isn't lost.
                carriedFrom={scriptCarriedFrom}
                onRegenerate={() => wizard.patch(scriptResetPatch())}
                onApprove={() => wizard.set("scriptApproved", true)}
                onSkipReview={() => wizard.set("skipScriptReview", true)}
                onSave={(script) => {
                  // Editing an already-approved script invalidates that
                  // approval — the user must re-approve the new text. A
                  // no-op re-save of identical text doesn't reset it.
                  const changed = script !== wizard.state.script;
                  wizard.patch({
                    script,
                    ...(changed ? { scriptApproved: false } : {}),
                  });
                }}
                onClose={() => setRailMode(null)}
              />
            )}
            {railMode === "kb-instruction" && (
              <KbInstructionRail
                targetAngle={wizard.state.angleId}
                targetAngleLabel={
                  wizard.state.angleId
                    ? ANGLE_CHIP_LABEL[wizard.state.angleId] ?? wizard.state.angleId
                    : "general"
                }
                onSave={(inst) => {
                  wizard.set("customKbInstructions", [
                    ...wizard.state.customKbInstructions,
                    inst,
                  ]);
                  setRailMode(null);
                }}
                onClose={handleAttachCancel}
              />
            )}
            {railMode === "library" && (
              <LibraryColumnDrawer
                brandId={wizard.state.brandId}
                onSave={handleAttachSave("library")}
                onCancel={handleAttachCancel}
              />
            )}
            {railMode === "pinterest" && (
              <PinterestStub
                onSave={handleAttachSave("pinterest")}
                onCancel={handleAttachCancel}
              />
            )}
            {railMode === "brand-winner-ads" && (
              <BrandWinnerAdsDrawer
                brandId={wizard.state.brandId}
                onSave={handleAttachSave("brand-winner-ads")}
                onCancel={handleAttachCancel}
              />
            )}
            {railMode === "product-winner-ads" && (
              <ProductWinnerAdsDrawer
                productId={wizard.state.productId}
                onSave={handleAttachSave("product-winner-ads")}
                onCancel={handleAttachCancel}
              />
            )}
            {railMode === "industry-insights" && (
              <IndustryInsightsPicker
                brandId={wizard.state.brandId}
                productId={wizard.state.productId}
                onSave={handleAttachSave("industry-insights")}
                onClose={handleAttachCancel}
              />
            )}
            {railMode === "seed-image" && (
              <SeedImageRail
                brandId={wizard.state.brandId}
                productId={wizard.state.productId}
                onSave={handleAttachSave("seed-image")}
                onClose={handleAttachCancel}
              />
            )}
            {railMode === "template" && (
              <TemplateRail
                brandId={wizard.state.brandId}
                onSelect={(id) => {
                  wizard.set("selectedTemplateIds", [id]);
                  setRailMode(null);
                }}
                onClose={handleAttachCancel}
              />
            )}
            {railMode === "instructions" && (
              <InstructionsPickerModal
                brandId={wizard.state.brandId}
                productId={wizard.state.productId}
                categoryId={wizard.state.categoryId}
                customInstructions={[]}
                onSave={(refs) => {
                  wizard.set("attachedReferences", [
                    ...wizard.state.attachedReferences,
                    ...refs,
                  ]);
                  setRailMode(null);
                }}
                onClose={handleAttachCancel}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * AccordionSection — body-only accordion (no card chassis).
 * Used INSIDE a parent card to group multiple collapsible sections together
 * separated by gradient dividers. Header pattern + URL-backed open state
 * mirror AccordionStrip but without the v3-glass-card wrapper.
 * ───────────────────────────────────────────────────────────────────────── */
function AccordionSection({
  id,
  title,
  icon: Icon,
  count,
  hint,
  defaultOpen = false,
  children,
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  count: number;
  hint: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useAccordionUrl(`${id}-acc`, defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center px-4 py-3 text-left transition-colors hover:bg-foreground/[0.04]"
      >
        <SectionHeader
          title={title}
          icon={Icon}
          count={count}
          hint={hint}
          trailing={
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300",
                open && "rotate-180",
              )}
            />
          }
        />
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * AccordionStrip — bold collapsed strip used for Angles + Trending concepts.
 * Header uses the shared <SectionHeader> for the lime-stripe + mono uppercase
 * pattern. Chassis = .v3-glass-card so it reads as "lifted glass".
 * ───────────────────────────────────────────────────────────────────────── */
function AccordionStrip({
  id,
  title,
  icon: Icon,
  count,
  hint,
  defaultOpen = false,
  children,
}: {
  /** Unique slug used for the URL param (e.g. "angles" → ?angles-acc=open). */
  id: string;
  title: string;
  icon: React.ElementType;
  count: number;
  hint: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useAccordionUrl(`${id}-acc`, defaultOpen);
  return (
    <div className="v3-glass-card overflow-hidden rounded-2xl transition-colors hover:border-foreground/20">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center px-4 py-3 text-left transition-colors hover:bg-foreground/[0.04]"
      >
        <SectionHeader
          title={title}
          icon={Icon}
          count={count}
          hint={hint}
          trailing={
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300",
                open && "rotate-180",
              )}
            />
          }
        />
      </button>
      {open && <div className="border-t border-border/40 px-4 pb-4 pt-3">{children}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * PromptSuggestions — sleek horizontal cards with curated prompt starters.
 * Angle-aware: shows generic starters by default, angle-specific when set.
 * Click any card to prefill the prompt textarea.
 * ───────────────────────────────────────────────────────────────────────── */
const GENERIC_PROMPTS = [
  "Studio-quality hero shot — clean white bg, premium lighting",
  "Bold social-proof ad — real customer testimonial + product CTA",
  "Lifestyle scene — aspirational, warm tones, product in natural use",
  "Flash sale urgency — countdown, offer callout, high-contrast design",
  "Minimal aesthetic — product only, strong typography, no clutter",
];

const ANGLE_PROMPTS: Record<string, string[]> = {
  hero: [
    "Centered product on clean white — sharp shadows, premium lighting",
    "Hero packshot — 45° angle, soft gradient bg, brand colors",
    "Macro detail shot — surface texture, high contrast, no copy",
  ],
  lifestyle: [
    "Warm lifestyle scene — product in natural use, real-feeling moment",
    "Golden hour outdoor shot — hand-held product, bokeh background",
    "Cozy home setting — product styled on shelf, soft ambient light",
  ],
  "social-proof": [
    "5-star review quote overlay — product image + customer callout",
    "Before/after split — transformation result, honest framing",
    '"10,000+ customers" credibility badge — product + social proof copy',
  ],
  urgency: [
    "Flash sale banner — 48hr countdown, bold offer, red accent",
    "Limited edition callout — scarcity framing, high contrast CTA",
    "End of season deal — price-strike, new price, urgency copy",
  ],
  comparison: [
    "Side-by-side product comparison — ours vs competitor, clear win",
    "Then vs now — before clutter, after solution, simple layout",
    "Feature checklist ad — our product ticks all boxes, theirs don't",
  ],
  "ugc-style": [
    "Casual creator unboxing — phone-camera feel, genuine reaction",
    "Day-in-my-life product integration — natural, not scripted",
    "Quick TikTok-style demo — 3 benefits in 6 seconds, hook first",
  ],
  unboxing: [
    "Unboxing reveal — hands, tissue paper, product emerge moment",
    "First impression — reaction shot + product in hand, authentic",
    "Premium unbox — dark packaging, gold foil, slow reveal",
  ],
  infographic: [
    "Clean infographic — 3 key benefits, icon row, product at center",
    "Ingredient callout — product + ingredient icons + benefit labels",
    "How it works — 3-step flow, minimal icons, clean white bg",
  ],
};

/**
 * §7.3 / §7.4 — flow-adapted suggestions for the rail.
 *
 * §7.4 "Auto-inject trends into Configure's suggestions rail" — when the flow
 * came from Trends, suggestions are seeded from the trend's OWN hook/title
 * (the angle itself is set on the Angle·Concept card by the effect above —
 * this only covers the rail's prompt text).
 *
 * §7.3 "Reports gets suggestions only... adapted to that ad's performance" —
 * when the flow came from Reports, suggestions reference the SOURCE AD'S
 * ACTUAL metrics (ctx.ref.metrics), never a generic prompt.
 *
 * Returns null for every other module (or no flow at all) so the caller
 * falls back to the existing angle-aware GENERIC_PROMPTS / ANGLE_PROMPTS —
 * that's the zero-data path for this rail.
 */
function flowAdaptedSuggestions(ctx: FlowContext): string[] | null {
  if (ctx.module.key === "reports") {
    const metricLine = ctx.ref.metrics?.length
      ? ctx.ref.metrics.map((m) => `${m.label} ${m.value}`).join(" · ")
      : null;
    return [
      metricLine
        ? `Refresh "${ctx.ref.title}" — keep what's working (${metricLine}), swap the visual`
        : `Refresh "${ctx.ref.title}" — same offer, new creative angle`,
      `New hook for "${ctx.ref.title}" — this one's fatiguing`,
      `Bolder CTA on "${ctx.ref.title}" — test against the current control`,
    ];
  }
  if (ctx.module.key === "trends") {
    const angle = ctx.ref.trendAngle;
    return [
      angle
        ? `Generate against "${ctx.ref.title}" — ${angle} angle, trending now`
        : `Generate against "${ctx.ref.title}" — trending right now`,
      `Script pulling the same hook as "${ctx.ref.title}"`,
      `Remix "${ctx.ref.title}" for our own product line`,
    ];
  }
  return null;
}

/**
 * PromptSuggestions — A-12.18 sleek single-line strip ABOVE the prompt bar.
 * Inspired by Old Studio's "TRY:" pattern — minimal, glass-like pills, click to fill.
 */
function PromptSuggestions({
  angleId,
  flowSuggestions,
  onPick,
}: {
  angleId: string | null;
  /** From flowAdaptedSuggestions(ctx) — null/undefined falls back below. */
  flowSuggestions?: string[] | null;
  onPick: (prompt: string) => void;
}) {
  const fromFlow = flowSuggestions && flowSuggestions.length > 0;
  const suggestions = fromFlow
    ? flowSuggestions!
    : (angleId && ANGLE_PROMPTS[angleId]) ?? GENERIC_PROMPTS;

  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {fromFlow ? "From your source" : "Suggestions"}
      </span>
      <ul className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {suggestions.map((s) => (
          <li key={s} className="shrink-0">
            <button
              type="button"
              onClick={() => onPick(s)}
              className="group inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border/40 bg-background/40 px-3 py-1 text-[11px] text-foreground/70 backdrop-blur-sm transition-all hover:border-foreground/20 hover:bg-background/70 hover:text-foreground"
            >
              <Sparkles className="h-2.5 w-2.5 text-primary/60 group-hover:text-primary" />
              {s.length > 56 ? s.slice(0, 56) + "…" : s}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * GenerationSettingsButton — three-dot popover trigger that sits in the
 * prompt bar's footer row (between aspect-ratio picker and Generate).
 *
 * Surfaces two video-generation settings:
 *   1. Quality / video resolution (720p · 1080p · 4K) with cost-multiplier hints.
 *   2. Audio required (boolean) — only meaningful when format === "video";
 *      visually disabled with caption when format is image.
 *
 * Open/closed state is URL-backed (?settings=open). The toggles themselves
 * are URL-synced by the wizard's own state plumbing.
 * ───────────────────────────────────────────────────────────────────────── */
const RESOLUTION_OPTIONS: {
  value: "720p" | "1080p" | "4K";
  tier: string;
  multiplier: string;
}[] = [
  { value: "720p",  tier: "Standard", multiplier: "×1" },
  { value: "1080p", tier: "High",     multiplier: "×1.5" },
  { value: "4K",    tier: "Premium",  multiplier: "×3" },
];

/**
 * PLACEHOLDER NAME — Maalik hasn't finalized the word for the "Vary" meter
 * (candidates: "Variance" / "Deviation" / "Difference"). Single const so the
 * label can be renamed in ONE place once it's locked. (MOM 06-05.)
 */
const VARY_LABEL = "Vary";

function GenerationSettingsButton({
  wizard,
  open,
  onOpenChange,
}: {
  wizard: UseWizardReturn;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const { state } = wizard;
  const audioApplies = state.format === "video";

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Generation settings"
          title="Quality + audio"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-background/50 text-muted-foreground transition-colors hover:border-foreground/20 hover:bg-background/70 hover:text-foreground"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" side="top" className="w-[310px] rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-4">
          {/* — Aspect Ratio section (A-12.56: merged in from the standalone
              picker that used to live in PromptReferenceBar's Row 3) —
              §5 "show an example of each shape, not just the ratio name.
              This is what 'multi aspect ratio' means — a presentation fix,
              not a multi-output generation feature." Reuses the SAME
              RatioShapeOption row PromptReferenceBar's AspectRatioPopover
              renders (its own comment called it dead code "kept in case we
              want to revert" — revived here instead of a third ratio UI). */}
          <div className="flex flex-col gap-1.5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Aspect Ratio
            </p>
            <div className="flex flex-col gap-0.5">
              {RATIOS.map((r) => (
                <RatioShapeOption
                  key={r}
                  ratio={r}
                  active={state.aspectRatio === r}
                  onSelect={() => wizard.set("aspectRatio", r)}
                />
              ))}
            </div>
          </div>

          {/* Divider */}
          <div
            aria-hidden
            className="h-px bg-[linear-gradient(90deg,transparent_0%,hsl(var(--foreground)/0.12)_50%,transparent_100%)]"
          />

          {/* — Quality section — */}
          <div className="flex flex-col gap-1.5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Quality
            </p>
            <ul className="flex flex-col gap-1">
              {RESOLUTION_OPTIONS.map((opt) => {
                const active = state.videoResolution === opt.value;
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => wizard.set("videoResolution", opt.value)}
                      role="radio"
                      aria-checked={active}
                      className={cn(
                        "group flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-1.5 text-left transition-colors",
                        active
                          ? "border-primary/40 bg-primary/[0.08]"
                          : "border-transparent hover:border-border/60 hover:bg-foreground/[0.04]",
                      )}
                    >
                      {/* Radio dot */}
                      <span
                        aria-hidden
                        className={cn(
                          "relative inline-block h-3.5 w-3.5 shrink-0 rounded-full border transition-colors",
                          active
                            ? "border-primary bg-primary"
                            : "border-border bg-background",
                        )}
                      >
                        {active && (
                          <span className="absolute inset-[3px] rounded-full bg-primary-foreground" />
                        )}
                      </span>
                      <span
                        className={cn(
                          "text-[12px] font-medium",
                          active ? "text-foreground" : "text-foreground/80",
                        )}
                      >
                        {opt.tier}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {opt.value}
                      </span>
                      <span
                        className={cn(
                          "ml-auto font-mono text-[10px]",
                          active ? "text-primary" : "text-muted-foreground/70",
                        )}
                      >
                        {opt.multiplier}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Divider */}
          <div
            aria-hidden
            className="h-px bg-[linear-gradient(90deg,transparent_0%,hsl(var(--foreground)/0.12)_50%,transparent_100%)]"
          />

          {/* — Vary section (MOM 06-05: "variation meter, default 10%") —
              This is NOT the variation COUNT (selectedConceptIds × count); it's
              how MUCH each output differs from the base. Label is a PLACEHOLDER
              (VARY_LABEL) until Maalik locks the word. */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {VARY_LABEL}
              </p>
              <span className="font-mono text-[11px] font-semibold text-primary">
                {state.varyAmount}%
              </span>
            </div>
            <Slider
              value={[state.varyAmount]}
              min={0}
              max={100}
              step={5}
              onValueChange={(v) => wizard.set("varyAmount", v[0] ?? 0)}
              aria-label={`${VARY_LABEL} amount`}
              className="py-1"
            />
            <p className="text-[10px] italic leading-snug text-muted-foreground">
              How much each output differs from the base. Low % = safe, close
              variations.
            </p>
          </div>

          {/* Divider */}
          <div
            aria-hidden
            className="h-px bg-[linear-gradient(90deg,transparent_0%,hsl(var(--foreground)/0.12)_50%,transparent_100%)]"
          />

          {/* — Audio section — */}
          <div className="flex flex-col gap-1.5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Audio
            </p>
            <div
              className={cn(
                "flex items-center justify-between rounded-lg px-2.5 py-1.5 transition-opacity",
                !audioApplies && "pointer-events-none opacity-40",
              )}
            >
              <span className="text-[12px] font-medium text-foreground/80">
                Required for video
              </span>
              <Switch
                checked={state.videoAudio}
                onCheckedChange={(v) => wizard.set("videoAudio", v)}
                disabled={!audioApplies}
                aria-label="Audio required for video"
              />
            </div>
            {!audioApplies && (
              <p className="px-2.5 text-[10px] italic text-muted-foreground">
                Audio applies to video generations only
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Approach (Mode) → readable label, for the Master prompt assembly. No central
 * map exists for Mode, so it's defined locally (this file owns it).
 * ───────────────────────────────────────────────────────────────────────── */
const MODE_LABEL: Record<string, string> = {
  auto: "Auto",
  "product-demo": "Product demo",
  "lifestyle-scene": "Lifestyle scene",
  scratch: "From scratch",
  "create-variations": "Create variations",
  "ugc-video": "UGC Video",
  "image-to-video": "Image to video",
  broll: "B-roll",
  // No longer offerable on Step 3 (BG Remover is an Other App now) — the label
  // stays because historical runs still reach this map, and `Record<string, …>`
  // means TypeScript would not have caught its removal either way.
  "bg-remover": "Background remover",
  resize: "Resize",
};

/* ─────────────────────────────────────────────────────────────────────────
 * MasterPromptCard — A (MOM 06-05: "Master prompt for the video").
 * Read-only, collapsible (default collapsed) card showing the assembled brief
 * Genie will receive — derived LIVE from wizard state on each render. Copy
 * button copies the assembled text via navigator.clipboard.
 * ───────────────────────────────────────────────────────────────────────── */
function MasterPromptCard({ wizard }: { wizard: UseWizardReturn }) {
  const { state } = wizard;
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Assemble the labeled lines live from current state. Kept as an array so the
  // copied text and the rendered <pre> share one source of truth.
  const lines = useMemo(() => {
    const out: string[] = [];

    const approach = MODE_LABEL[state.mode] ?? state.mode;
    const sub = getSubType(state.mode, state.approachSubType);
    out.push(`Approach: ${approach}${sub ? ` · ${sub.label}` : ""}`);

    out.push(
      `Angle: ${
        state.angleId
          ? ANGLE_CHIP_LABEL[state.angleId] ?? state.angleId
          : state.angleDescription
            ? state.angleDescription
            : "Auto"
      }`,
    );

    const conceptNames = state.selectedConceptIds.map((id) =>
      id.startsWith("trend:")
        ? "Trending concept"
        : getConceptById(id)?.name ?? id,
    );
    out.push(`Concept: ${conceptNames.length ? conceptNames.join(", ") : "Auto"}`);

    const scriptLine =
      state.script && state.script.trim().length > 0
        ? state.script.trim().replace(/\s+/g, " ").slice(0, 120) +
          (state.script.trim().length > 120 ? "…" : "")
        : "Auto-written";
    out.push(`Script: ${scriptLine}`);

    out.push(`Prompt: ${state.prompt.trim() || "(none yet — describe your ad)"}`);

    if (state.useBrandGuidelines) out.push("Brand guidelines: on");
    if (state.useKnowledgeBase) out.push("Knowledge base: on");

    return out;
  }, [
    state.mode,
    state.approachSubType,
    state.angleId,
    state.angleDescription,
    state.selectedConceptIds,
    state.script,
    state.prompt,
    state.useBrandGuidelines,
    state.useKnowledgeBase,
  ]);

  const assembled = lines.join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(assembled);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable (insecure context / permissions) — no-op.
    }
  };

  return (
    <div className="v3-glass-card shrink-0 overflow-hidden rounded-2xl">
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-300",
              open && "rotate-90",
            )}
          />
          <SectionHeader
            title="Master prompt · what Genie receives"
            icon={Braces}
            size="compact"
          />
        </button>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy master prompt"
          className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-border/60 bg-background/50 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>
      {open && (
        <div className="border-t border-border/40 px-4 pb-3 pt-3">
          <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border/40 bg-muted/40 p-3 font-mono text-[11px] leading-relaxed text-foreground/90 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/10 [&::-webkit-scrollbar]:w-1.5">
            {assembled}
          </pre>
          <p className="mt-1.5 text-[10px] italic text-muted-foreground">
            Read-only · assembled live from your selections.
          </p>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── *
 * StyleBrandStub — placeholder picker for upcoming "Style packs" feature.
 * Same chassis as the real pickers (header / 3-col 4:5 grid / footer).
 * Cards are dimmed "Coming soon" stylepacks so the modal doesn't feel empty.
 * ────────────────────────────────────────────────────────────────────── */
const STYLE_PACK_PLACEHOLDERS: { id: string; name: string; vibe: string }[] = [
  { id: "sp-mono",  name: "Mono Editorial",  vibe: "Black · white · grain" },
  { id: "sp-warm",  name: "Warm Lifestyle",  vibe: "Beige · golden · soft" },
  { id: "sp-bold",  name: "Bold Promo",      vibe: "Hi-contrast · CTA-led" },
  { id: "sp-clean", name: "Clean Hero",      vibe: "White · centered · airy" },
];

function StyleBrandStub({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Brand profile
          </p>
          <h3 className="text-sm font-semibold text-foreground">Style · Brand</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <p className="mb-3 text-[11px] text-muted-foreground">
          Brand style is auto-pulled from the product's brand profile. Custom
          style packs are on the way:
        </p>
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {STYLE_PACK_PLACEHOLDERS.map((p) => (
            <li key={p.id}>
              <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-border/40 bg-card opacity-70">
                <div className="relative flex aspect-[4/5] w-full items-center justify-center bg-muted">
                  <Sparkles className="h-5 w-5 text-muted-foreground/50" />
                  <span className="absolute right-1.5 top-1.5 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase text-muted-foreground backdrop-blur">
                    Soon
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 px-2.5 py-2">
                  <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-foreground">
                    {p.name}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {p.vibe}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <footer className="shrink-0 flex items-center justify-end border-t border-border px-3 py-2.5">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90"
        >
          Done
        </button>
      </footer>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── *
 * PinterestStub — minimal pin grid for the "From Pinterest" rail mode.
 * Same chassis as Library / Winner Ads. Mock pins, multi-select, 3-col 4:5.
 * ────────────────────────────────────────────────────────────────────── */
const MOCK_PINS: { id: string; thumbnail: string; label: string; tag: string }[] = [
  {
    id: "pin-1",
    thumbnail: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=240&q=70",
    label: "Pastel flat-lay",
    tag: "Flat-lay",
  },
  {
    id: "pin-2",
    thumbnail: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=240&q=70",
    label: "Bold typography",
    tag: "Type",
  },
  {
    id: "pin-3",
    thumbnail: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=240&q=70",
    label: "Editorial fashion",
    tag: "Editorial",
  },
  {
    id: "pin-4",
    thumbnail: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=240&q=70",
    label: "Minimal product",
    tag: "Minimal",
  },
  {
    id: "pin-5",
    thumbnail: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=240&q=70",
    label: "Color block",
    tag: "Color",
  },
  {
    id: "pin-6",
    thumbnail: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=240&q=70",
    label: "Festive set",
    tag: "Festive",
  },
];

function PinterestStub({
  onSave,
  onCancel,
}: {
  onSave: (refs: AttachedRef[]) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const save = () => {
    onSave(
      MOCK_PINS.filter((p) => selected.has(p.id)).map((p) => ({
        id: p.id,
        source: "pinterest",
        label: p.label,
        thumbnail: p.thumbnail,
      })),
    );
  };
  const n = selected.size;

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            References
          </p>
          <h3 className="text-sm font-semibold text-foreground">Pinterest</h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {MOCK_PINS.map((p) => {
            const isSel = selected.has(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => toggle(p.id)}
                  aria-pressed={isSel}
                  className={cn(
                    "group flex h-full w-full flex-col overflow-hidden rounded-xl border bg-card/60 text-left backdrop-blur-sm transition-all",
                    isSel
                      ? "border-primary/50 bg-primary/5 ring-2 ring-primary/30"
                      : "border-border/40 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
                  )}
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                    <img
                      src={p.thumbnail}
                      alt={p.label}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform group-hover:scale-[1.04]"
                    />
                    <span className="absolute right-1.5 top-1.5 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase text-foreground backdrop-blur">
                      {p.tag}
                    </span>
                    {isSel && (
                      <span className="absolute right-1.5 bottom-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 px-2.5 py-2">
                    <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-foreground">
                      {p.label}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <footer className="shrink-0 flex items-center justify-end gap-2 border-t border-border px-3 py-2.5">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={n === 0}
          className={cn(
            "inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition-opacity",
            "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          Save{n > 0 && <span className="font-mono opacity-90">· {n}</span>}
        </button>
      </footer>
    </div>
  );
}
