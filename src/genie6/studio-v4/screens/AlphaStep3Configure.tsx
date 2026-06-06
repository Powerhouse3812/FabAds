import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Braces, Check, ChevronDown, ChevronRight, Copy, FileText, Lock, MoreVertical, Pencil, Search, Sparkles, Target, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  brands as ALL_BRANDS,
  products as ALL_PRODUCTS,
} from "@/mocks/shared";
import { getConceptById } from "../data/concepts";
import {
  getAngleVisual,
  videoForSeed,
  posterForSeed,
} from "../data/studio-visuals";
import { autoFillForApproach, getApproachLocks, getSubType } from "../data/approach-subtypes";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { sampleOutputs } from "../../mocks/sample-outputs";
import type {
  AttachSource,
  AttachedRef,
  UseWizardReturn,
} from "../state/useWizard";
import { HeroHeader } from "../components/HeroHeader";
import { SectionHeader } from "../components/SectionHeader";
import {
  PromptReferenceBar,
  type ChipKind,
  ANGLE_CHIP_LABEL,
  RATIOS,
} from "../components/PromptReferenceBar";
import { RailGenerateConcepts } from "../components/RailGenerateConcepts";
import { GenerateConceptsForm } from "@/genie6/concepts/GenerateConceptsForm";
import { ConceptAngleRail } from "../components/ConceptAngleRail";
import { PreviewVideo } from "../components/PreviewVideo";
import { AvatarVoiceRail } from "../components/AvatarVoiceRail";
import { ScriptRail } from "../components/ScriptRail";
import { KbInstructionRail } from "../components/KbInstructionRail";
import { LibraryColumnDrawer } from "../components/LibraryColumnDrawer";
import { BrandWinnerAdsDrawer } from "../components/BrandWinnerAdsDrawer";
import { ProductWinnerAdsDrawer } from "../components/ProductWinnerAdsDrawer";
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
  | "instructions";

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

  // Trending concepts — top 16 sample outputs by qualityScore desc.
  // Pool is bigger so the horizontal-scroll strip has substance.
  const trending = useMemo(() => {
    const all = sampleOutputs.slice();
    all.sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0));
    return all.slice(0, 16);
  }, []);

  // Concept search input — local state, filters the trending strip in-place.
  const [conceptSearch, setConceptSearch] = useState("");
  const filteredTrending = useMemo(() => {
    const q = conceptSearch.trim().toLowerCase();
    const base = !q
      ? trending
      : trending.filter(
          (t) =>
            (t.headline ?? "").toLowerCase().includes(q) ||
            (t.brand?.name ?? "").toLowerCase().includes(q),
        );

    // A-12.57 (Maalik): when an angle is picked, re-order the strip so
    // matching concepts move to the FRONT (preserving relative order).
    // OutputData has no formal `angle` field — tolerant lowercase-contains
    // match against headline / body / mode / angle (if present).
    const angleId = wizard.state.angleId;
    if (!angleId) return base;
    const label = (ANGLE_CHIP_LABEL[angleId] ?? angleId).toLowerCase();
    const id = angleId.toLowerCase();
    const matches: typeof base = [];
    const rest: typeof base = [];
    for (const t of base) {
      const hay = `${t.headline ?? ""} ${t.body ?? ""} ${t.mode ?? ""} ${(t as { angle?: string }).angle ?? ""}`.toLowerCase();
      if (hay.includes(label) || hay.includes(id)) matches.push(t);
      else rest.push(t);
    }
    return [...matches, ...rest];
  }, [trending, conceptSearch, wizard.state.angleId]);

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
      source === "product-winner-ads"
    ) {
      setRailMode(source);
    }
  };

  const handleChipOpen = (chip: ChipKind) => setRailMode(chip);

  // A-12.9 (Maalik MOM 06-05): once the user touches angle OR concepts, stop
  // auto-filling — going back/forward through the wizard must not clobber a
  // manual pick. A ref (not state) so flipping it never triggers a re-render.
  const userEditedRef = useRef(false);

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

  // A-12.9 (Maalik 06-05): per-sub-type editability locks for the auto-filled
  // angle/concept. When locks.angle is true the angle is fixed by the approach
  // sub-type (e.g. Unboxing → unboxing) — greyed + lock + reason, no-op setter.
  // Concept always stays editable.
  const locks = getApproachLocks(wizard.state.mode, wizard.state.approachSubType);

  // Click an angle chip → toggle (set null if already selected, else replace).
  // No-op while the angle is locked: a locked angle can't be user-edited (it's
  // already auto-filled to the sub-type's angle).
  const toggleAngle = (angleId: string) => {
    if (locks.angle) return;
    userEditedRef.current = true;
    const next = wizard.state.angleId === angleId ? null : angleId;
    wizard.set("angleId", next);
  };

  // A-12.57 (Maalik): Angles section is single-row horizontal-scroll by
  // default; "View more" expands to the full 2-row flex-wrap layout.
  // URL-backed via ?angles=open (mirrors the existing accordion convention
  // used elsewhere in this file).
  const [anglesExpanded, setAnglesExpanded] = useAccordionUrl("angles", false);

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
    wizard.patch({ angleId, selectedConceptIds: conceptIds });
    // wizard.patch is stable (useCallback); intentionally excluded so this
    // re-runs only on mode / approachSubType change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, approachSubType]);

  // Inline Angles+Concepts card open/closed state. STARTS COLLAPSED because the
  // picks are auto-filled (A-12.9). URL-backed via ?picks=open so back/forward
  // is predictable and matches the existing accordion convention in this file.
  const [picksExpanded, setPicksExpanded] = useAccordionUrl("picks", false);

  // Resolved labels for the collapsed summary row.
  const angleLabel = wizard.state.angleId
    ? ANGLE_CHIP_LABEL[wizard.state.angleId] ?? wizard.state.angleId
    : null;
  // Concept summary — first selected concept's display name. trend:* ids are
  // sample-output picks (no concepts.ts entry); fall back to a generic label.
  const firstConceptId = wizard.state.selectedConceptIds[0] ?? null;
  const conceptLabel = firstConceptId
    ? firstConceptId.startsWith("trend:")
      ? "Trending concept"
      : getConceptById(firstConceptId)?.name ?? firstConceptId
    : null;
  const extraConceptCount = Math.max(
    0,
    wizard.state.selectedConceptIds.length - 1,
  );
  const angleVisual = wizard.state.angleId
    ? getAngleVisual(wizard.state.angleId)
    : null;

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

  return (
    <>
      {/* Form content — centered single column. ContextRail lives in the global shell.
          A-12.67 (Maalik): h-full so the step claims viewport height; the
          combined Angles+Concepts card becomes the single flex-1 min-h-0
          region absorbing leftover height. Concepts grid's max-h scroll
          becomes the only internal scroll surface — page never scrolls. */}
      <div className="mx-auto flex h-full w-full max-w-2xl flex-col gap-6 overflow-y-auto px-6 pt-8 pb-10">
        <HeroHeader title="Configure" onBack={onBack} />

          {/* AI prompt suggestions — ABOVE the prompt bar, sleek single-line strip */}
          {wizard.state.prompt.trim().length === 0 && (
            <PromptSuggestions
              angleId={wizard.state.angleId}
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
            hideLayoutToggle
            footerExtras={
              <GenerationSettingsButton
                wizard={wizard}
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
              />
            }
          />

          {/* Script + Master-prompt cards removed (Maalik 06-06) — prompt bar
              + auto-filled Angle/Concept below are the focus. */}

          {/* Angles + Concepts — combined glass card. A-12.9 (Maalik MOM 06-05):
              STARTS COLLAPSED because angle + concept are auto-filled from the
              chosen approach. Collapsed = a compact summary row (preview thumb +
              "Angle: X · Concept: Y" + Auto badge + Edit). Expanding reveals the
              full VISUAL angle tiles + VISUAL concept tiles. When expanded the
              card claims flex-1 min-h-0 so the Concepts grid is the only internal
              scroll surface; collapsed it's just a short auto-height row. */}
          <div
            className={cn(
              "v3-glass-card flex flex-col overflow-hidden rounded-2xl",
              "shrink-0",
            )}
          >
            {/* Collapsed summary row — always rendered. Acts as the toggle. */}
            {!picksExpanded && (
              <button
                type="button"
                onClick={() => setPicksExpanded(true)}
                className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-foreground/[0.04]"
              >
                {/* Preview thumbnail of the picked angle (poster still) */}
                <span className="relative h-11 w-9 shrink-0 overflow-hidden rounded-md border border-border/50 bg-muted">
                  {angleVisual?.poster ? (
                    <img
                      src={angleVisual.poster}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <Sparkles className="h-4 w-4 text-muted-foreground/50" />
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <SectionHeader title="Angle · Concept" icon={Target} size="compact" />
                    {/* When the angle is locked, swap the generic "Auto" badge
                        for a Lock + reason chip so the lock reads at a glance.
                        Concept stays auto/editable below. */}
                    {locks.angle ? (
                      <span
                        className="inline-flex min-w-0 shrink items-center gap-1 rounded-full bg-foreground/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-foreground/70"
                        title={locks.reason ?? "Angle locked"}
                      >
                        <Lock className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate normal-case tracking-normal">
                          {locks.reason ?? "Angle locked"}
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-primary">
                        <Sparkles className="h-2.5 w-2.5" />
                        Auto
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[12px] text-foreground">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Angle:
                    </span>{" "}
                    {locks.angle && (
                      <Lock className="mr-0.5 inline-block h-2.5 w-2.5 -translate-y-px text-muted-foreground" />
                    )}
                    <span className="font-semibold">{angleLabel ?? "None"}</span>
                    <span className="mx-1.5 text-muted-foreground/50">·</span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Concept:
                    </span>{" "}
                    <span className="font-semibold">{conceptLabel ?? "None"}</span>
                    {extraConceptCount > 0 && (
                      <span className="ml-1 font-mono text-[10px] text-muted-foreground">
                        +{extraConceptCount}
                      </span>
                    )}
                  </p>
                </div>
                <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-border/60 bg-background/50 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary">
                  <Pencil className="h-3 w-3" />
                  Edit / Change
                </span>
              </button>
            )}

            {/* Expanded — full visual selection. Section 1: Angles VISUAL tiles. */}
            {picksExpanded && (
              <>
            <div className="px-4 py-3">
              <SectionHeader
                title="Angles"
                icon={Target}
                count={ANGLE_IDS.length}
                hint="pick one to guide style"
                trailing={
                  <button
                    type="button"
                    onClick={() => setPicksExpanded(false)}
                    aria-label="Collapse to summary"
                    className="ml-auto inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/50 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                  >
                    Collapse
                    <ChevronDown className="h-3 w-3" />
                  </button>
                }
              />
              {/* Locked-angle banner — the angle is fixed by the approach
                  sub-type; tiles below are greyed + non-interactive. */}
              {locks.angle && (
                <div className="mt-2 flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2.5 py-1.5 text-[11px] text-muted-foreground">
                  <Lock className="h-3 w-3 shrink-0" />
                  <span className="min-w-0 truncate">
                    {locks.reason ?? "Angle is fixed"} · change the sub-type to edit
                  </span>
                </div>
              )}
              <div
                className={cn(
                  "mt-2 overflow-hidden transition-[max-height] duration-300 ease-out",
                  anglesExpanded ? "max-h-[400px] overflow-y-auto" : "max-h-[112px]",
                  locks.angle && "pointer-events-none opacity-50",
                )}
              >
                <ul
                  className={cn(
                    "grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-6",
                    !anglesExpanded &&
                      "[&::-webkit-scrollbar]:hidden [scrollbar-width:none]",
                  )}
                >
                  {ANGLE_IDS.map((id) => {
                    const active = wizard.state.angleId === id;
                    const label = ANGLE_CHIP_LABEL[id] ?? id;
                    const v = getAngleVisual(id);
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => toggleAngle(id)}
                          aria-pressed={active}
                          aria-disabled={locks.angle || undefined}
                          className={cn(
                            "group relative block aspect-[4/5] w-full overflow-hidden rounded-lg border text-left transition-all",
                            active
                              ? "border-primary/60 ring-2 ring-primary/40"
                              : "border-border/50 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
                          )}
                        >
                          <PreviewVideo src={v.video} poster={v.poster} />
                          <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-1.5 pb-1 pt-4">
                            <span className="line-clamp-1 text-[10px] font-semibold leading-tight text-white">
                              {label}
                            </span>
                          </span>
                          {active && locks.angle ? (
                            <span className="absolute right-1 top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-foreground/80 text-background shadow-sm">
                              <Lock className="h-2.5 w-2.5" strokeWidth={2.5} />
                            </span>
                          ) : active ? (
                            <span className="absolute right-1 top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                              <Check className="h-2.5 w-2.5" strokeWidth={3} />
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
              {ANGLE_IDS.length > 12 && (
                <button
                  type="button"
                  onClick={() => setAnglesExpanded(!anglesExpanded)}
                  aria-expanded={anglesExpanded}
                  className="mt-1.5 inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                >
                  {anglesExpanded ? "Show fewer angles" : "Show all angles"}
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform duration-300",
                      anglesExpanded && "rotate-180",
                    )}
                  />
                </button>
              )}
            </div>

            {/* Gradient divider — parent-nav rail style */}
            <div
              aria-hidden
              className="mx-3 h-px bg-[linear-gradient(90deg,transparent_0%,hsl(var(--foreground)/0.12)_50%,transparent_100%)]"
            />

            {/* Section 2: Concepts — A-12.64 (Maalik):
                  • Collapsed by default; auto-expands when an angle is picked.
                  • Vertical scroll inside a fixed max-height frame
                    (not horizontal anymore).
                  • Dim-all-when-no-match bug gone — matching concepts get a
                    positive lime accent instead of dimming the rest.
                  • Generate button in header → opens the AI generate
                    rail picker (same one /iq/genie6/concepts/generate uses).
            */}
            {(() => {
              const userOpenedConcepts =
                searchParams.get("concepts-acc") === "open";
              const conceptsOpen =
                userOpenedConcepts || !!wizard.state.angleId;
              const toggleConcepts = () => {
                setSearchParams(
                  (prev) => {
                    const sp = new URLSearchParams(prev);
                    if (conceptsOpen) sp.delete("concepts-acc");
                    else sp.set("concepts-acc", "open");
                    return sp;
                  },
                  { replace: true },
                );
              };
              return (
            <div className="px-4 py-3">
              <button
                type="button"
                onClick={toggleConcepts}
                aria-expanded={conceptsOpen}
                className="flex w-full items-center gap-3"
              >
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-300",
                    conceptsOpen && "rotate-90",
                  )}
                />
                <SectionHeader
                  title="Concepts"
                  icon={Sparkles}
                  count={filteredTrending.length}
                  hint={
                    wizard.state.angleId
                      ? "matched to your angle"
                      : conceptsOpen
                        ? "pre-built starting points"
                        : "pick an angle to expand"
                  }
                />
                {conceptsOpen && (
                  <>
                    {/* A-12.65 (Maalik): demoted to ghost-outline so the
                        bottom prompt-bar Generate stays the only primary
                        CTA on this step. */}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setRailMode("ai-generate-concepts");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          setRailMode("ai-generate-concepts");
                        }
                      }}
                      title="Generate concepts with AI"
                      className="ml-auto inline-flex h-7 cursor-pointer items-center gap-1 rounded-full border border-border/60 bg-background px-2.5 text-[11px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/[0.08] hover:text-primary"
                    >
                      <Sparkles className="h-3 w-3" />
                      Generate
                    </span>
                    <div
                      className="relative w-44"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={conceptSearch}
                        onChange={(e) => setConceptSearch(e.target.value)}
                        placeholder="Search concepts…"
                        className="h-7 w-full rounded-full border border-border/60 bg-background/50 pl-7 pr-2 text-[11px] outline-none transition-colors focus:border-foreground/30"
                      />
                    </div>
                  </>
                )}
              </button>

              {conceptsOpen && (
              <ul
                ref={conceptStripRef}
                className="mt-2 grid max-h-[360px] grid-cols-2 gap-3 overflow-y-auto pb-1 sm:grid-cols-3 lg:grid-cols-4 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/10 [&::-webkit-scrollbar]:w-1.5"
              >
                {filteredTrending.map((t) => {
                  const active = isTrendingSelected(t.id);
                  const anglePicked = !!wizard.state.angleId;
                  // A-12.64 (Maalik): drop the universal dim. Matching concepts
                  // get a POSITIVE lime accent ring instead of dimming the rest.
                  let isAngleMatch = false;
                  if (anglePicked) {
                    const angleLabel = (
                      ANGLE_CHIP_LABEL[wizard.state.angleId!] ??
                      wizard.state.angleId!
                    ).toLowerCase();
                    const angleIdLc = wizard.state.angleId!.toLowerCase();
                    const hay = `${t.headline ?? ""} ${t.body ?? ""} ${t.mode ?? ""} ${(t as { angle?: string }).angle ?? ""}`.toLowerCase();
                    isAngleMatch =
                      hay.includes(angleLabel) || hay.includes(angleIdLc);
                  }
                  return (
                    <li key={t.id} className="transition-all duration-300 ease-out">
                      <button
                        type="button"
                        onClick={() => toggleTrending(t.id)}
                        className={cn(
                          "group relative flex w-full flex-col gap-1 overflow-hidden rounded-xl border bg-card text-left transition-all",
                          active
                            ? "border-primary/50 ring-2 ring-primary/30"
                            : isAngleMatch
                              ? "border-primary/30 hover:-translate-y-0.5 hover:shadow-md"
                              : "border-border/40 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
                        )}
                      >
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                          {/* A-12.9: autoplay-loop video preview (poster = the
                              concept's existing thumbnail; deterministic video
                              seeded by id). Replaces the old still image + the
                              stray text-emoji fallback. */}
                          <PreviewVideo
                            src={videoForSeed(`concept:${t.id}`)}
                            poster={t.thumbnail ?? posterForSeed(`concept:${t.id}`)}
                            className="transition-transform group-hover:scale-[1.04]"
                          />
                          {t.brand?.name && (
                            <span className="absolute bottom-1.5 left-1.5 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
                              {t.brand.name}
                            </span>
                          )}
                          {active && (
                            <span className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <p className="truncate px-2 pb-1.5 pt-0.5 text-[11px] font-semibold leading-tight text-foreground">
                          {t.headline ?? "Concept"}
                        </p>
                      </button>
                    </li>
                  );
                })}
                {filteredTrending.length === 0 && (
                  <li className="col-span-full px-2 py-6 text-center text-[11px] italic text-muted-foreground">
                    No concepts match "{conceptSearch}"
                  </li>
                )}
              </ul>
              )}
            </div>
              );
            })()}
              </>
            )}
          </div>
      </div>

      {/* ── Picker modal — centered dialog over a blurred backdrop ── */}
      {railMode !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          {/* Backdrop — click to dismiss */}
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={handleAttachCancel}
          />
          {/* Dialog box — glass chassis */}
          <div className="v3-glass relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-2xl max-h-[70vh]">
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
              <ConceptAngleRail
                selectedAngleId={wizard.state.angleId}
                selectedConceptIds={wizard.state.selectedConceptIds}
                onAngleChange={(id) => wizard.set("angleId", id)}
                onConceptsChange={(ids) =>
                  wizard.set("selectedConceptIds", ids)
                }
                angleLock={{ locked: locks.angle, reason: locks.reason ?? undefined }}
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
                onClose={handleAttachCancel}
              />
            )}
            {railMode === "style-brand" && (
              <StyleBrandStub onClose={handleAttachCancel} />
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
                onSave={handleAttachSave("brand-winner-ads")}
                onCancel={handleAttachCancel}
              />
            )}
            {railMode === "product-winner-ads" && (
              <ProductWinnerAdsDrawer
                onSave={handleAttachSave("product-winner-ads")}
                onCancel={handleAttachCancel}
              />
            )}
            {railMode === "instructions" && (
              <InstructionsPickerModal
                brandId={wizard.state.brandId}
                productId={wizard.state.productId}
                categoryId={wizard.state.categoryId}
                customInstructions={wizard.state.customKbInstructions}
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
        onClick={() => setOpen((v) => !v)}
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
 * PromptSuggestions — A-12.18 sleek single-line strip ABOVE the prompt bar.
 * Inspired by Old Studio's "TRY:" pattern — minimal, glass-like pills, click to fill.
 */
function PromptSuggestions({
  angleId,
  onPick,
}: {
  angleId: string | null;
  onPick: (prompt: string) => void;
}) {
  const suggestions =
    (angleId && ANGLE_PROMPTS[angleId]) ?? GENERIC_PROMPTS;

  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Suggestions
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
              picker that used to live in PromptReferenceBar's Row 3) — */}
          <div className="flex flex-col gap-1.5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Aspect Ratio
            </p>
            <div className="flex flex-wrap gap-1.5">
              {RATIOS.map((r) => {
                const active = state.aspectRatio === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => wizard.set("aspectRatio", r)}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex h-7 items-center justify-center rounded-full border px-3 font-mono text-[11px] font-medium transition-colors",
                      active
                        ? "border-primary/40 bg-primary/[0.10] text-primary"
                        : "border-border/60 bg-background/50 text-foreground/80 hover:border-foreground/30",
                    )}
                  >
                    {r}
                  </button>
                );
              })}
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
 * ScriptCard — A (MOM 06-05: "script show krni hogi" / "Script showcase").
 * Surfaces the script prominently on Configure (not just the prompt-bar chip).
 *   • script set  → readable block (max ~4 lines, expand for more) + Edit.
 *   • script null → Auto explainer + a muted "preview after Generate" note +
 *                   a "Write / paste script" CTA.
 * Both CTAs open the existing ScriptRail (railMode === "script").
 * ───────────────────────────────────────────────────────────────────────── */
function ScriptCard({
  script,
  onOpenRail,
}: {
  script: string | null;
  onOpenRail: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasScript = script !== null && script.trim().length > 0;
  // "Long" = worth offering an expand toggle (rough line-count heuristic).
  const isLong =
    hasScript && (script!.length > 220 || script!.split("\n").length > 4);

  return (
    <div className="v3-glass-card shrink-0 overflow-hidden rounded-2xl">
      <div className="flex items-center gap-2 px-4 pt-3">
        <SectionHeader title="Script" icon={FileText} size="compact" />
        {!hasScript && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-2.5 w-2.5" />
            Auto
          </span>
        )}
        <button
          type="button"
          onClick={onOpenRail}
          className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-border/60 bg-background/50 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          <Pencil className="h-3 w-3" />
          {hasScript ? "Edit script" : "Write / paste script"}
        </button>
      </div>

      <div className="px-4 pb-3 pt-2">
        {hasScript ? (
          <>
            <p
              className={cn(
                "whitespace-pre-wrap text-[12px] leading-relaxed text-foreground/90",
                !expanded && isLong && "line-clamp-4",
                expanded && isLong && "max-h-44 overflow-y-auto pr-1",
              )}
            >
              {script}
            </p>
            {isLong && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="mt-1.5 inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
              >
                {expanded ? "Show less" : "Show full script"}
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform duration-300",
                    expanded && "rotate-180",
                  )}
                />
              </button>
            )}
          </>
        ) : (
          <>
            <p className="text-[12px] leading-relaxed text-foreground/90">
              Auto — Genie writes the script from your prompt, angle &amp;
              product.
            </p>
            <p className="mt-1 text-[11px] italic text-muted-foreground">
              Script preview appears after Generate.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Approach (Mode) → readable label, for the Master prompt assembly. No central
 * map exists for Mode, so it's defined locally (this file owns it).
 * ───────────────────────────────────────────────────────────────────────── */
const MODE_LABEL: Record<string, string> = {
  scratch: "From scratch",
  "create-variations": "Create variations",
  "ugc-video": "UGC Video",
  "image-to-video": "Image to video",
  broll: "B-roll",
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
