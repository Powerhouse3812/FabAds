import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, ChevronDown, MoreVertical, Search, Sparkles, Target, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
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
} from "../components/PromptReferenceBar";
import { RailGenerateConcepts } from "../components/RailGenerateConcepts";
import { ConceptAngleRail } from "../components/ConceptAngleRail";
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
  const setRailMode = (next: RailMode) => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (next === null) sp.delete("picker");
        else sp.set("picker", next);
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
    if (!q) return trending;
    return trending.filter(
      (t) =>
        (t.headline ?? "").toLowerCase().includes(q) ||
        (t.brand?.name ?? "").toLowerCase().includes(q),
    );
  }, [trending, conceptSearch]);

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

  // Click trending → toggle into selectedConceptIds via synthetic prefix
  // (so it doesn't collide with library concept IDs).
  const toggleTrending = (sampleId: string) => {
    const synthId = `trend:${sampleId}`;
    const current = wizard.state.selectedConceptIds;
    const next = current.includes(synthId)
      ? current.filter((x) => x !== synthId)
      : [...current, synthId];
    wizard.set("selectedConceptIds", next);
  };

  const isTrendingSelected = (id: string) =>
    wizard.state.selectedConceptIds.includes(`trend:${id}`);

  // Click an angle chip → toggle (set null if already selected, else replace).
  const toggleAngle = (angleId: string) => {
    const next = wizard.state.angleId === angleId ? null : angleId;
    wizard.set("angleId", next);
  };



  return (
    <>
      {/* Form content — centered single column. ContextRail lives in the global shell. */}
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 pt-8 pb-10">
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

          {/* Angles + Concepts — combined glass card. Both sections always
              open. Angles: 20 chips in 2 rows (no scroll). Concepts:
              horizontal scroll strip with search bar. Designed to fit
              without vertical page scroll. */}
          <div className="v3-glass-card overflow-hidden rounded-2xl">
            {/* Section 1: Angles — flex-wrap chips, 2 rows on desktop */}
            <div className="px-4 py-3">
              <SectionHeader
                title="Angles"
                icon={Target}
                count={ANGLE_IDS.length}
                hint="pick one to guide style"
              />
              <ul className="mt-2 flex flex-wrap items-center gap-1.5">
                {ANGLE_IDS.map((id) => {
                  const active = wizard.state.angleId === id;
                  const label = ANGLE_CHIP_LABEL[id] ?? id;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => toggleAngle(id)}
                        aria-pressed={active}
                        className={cn(
                          "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                          active
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-border/60 bg-background/60 text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                        )}
                      >
                        {label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Gradient divider — parent-nav rail style */}
            <div
              aria-hidden
              className="mx-3 h-px bg-[linear-gradient(90deg,transparent_0%,hsl(var(--foreground)/0.12)_50%,transparent_100%)]"
            />

            {/* Section 2: Trending concepts — horizontal scroll strip + search */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-3">
                <SectionHeader
                  title="Concepts"
                  icon={Sparkles}
                  count={filteredTrending.length}
                  hint="pre-built starting points"
                />
                <div className="relative ml-auto w-44">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={conceptSearch}
                    onChange={(e) => setConceptSearch(e.target.value)}
                    placeholder="Search concepts…"
                    className="h-7 w-full rounded-full border border-border/60 bg-background/50 pl-7 pr-2 text-[11px] outline-none transition-colors focus:border-foreground/30"
                  />
                </div>
              </div>

              {/* Horizontal scroll strip — bleeds to card edge so cards
                  scroll under boundary. Hidden scrollbar, snap-to-card. */}
              <ul className="-mx-4 mt-2 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                {filteredTrending.map((t) => {
                  const active = isTrendingSelected(t.id);
                  return (
                    <li key={t.id} className="snap-start shrink-0 w-[150px]">
                      <button
                        type="button"
                        onClick={() => toggleTrending(t.id)}
                        className={cn(
                          "group relative flex w-full flex-col gap-1 overflow-hidden rounded-xl border bg-card text-left transition-all",
                          active
                            ? "border-primary/50 ring-2 ring-primary/30"
                            : "border-border/40 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
                        )}
                      >
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                          {t.thumbnail ? (
                            <img
                              src={t.thumbnail}
                              alt=""
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform group-hover:scale-[1.04]"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-2xl text-muted-foreground/50">
                              ✨
                            </div>
                          )}
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
                  <li className="flex shrink-0 items-center px-2 text-[11px] italic text-muted-foreground">
                    No concepts match "{conceptSearch}"
                  </li>
                )}
              </ul>
            </div>
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
            {railMode === "concept-angle" && (
              <ConceptAngleRail
                selectedAngleId={wizard.state.angleId}
                selectedConceptIds={wizard.state.selectedConceptIds}
                onAngleChange={(id) => wizard.set("angleId", id)}
                onConceptsChange={(ids) =>
                  wizard.set("selectedConceptIds", ids)
                }
                onClose={handleAttachCancel}
              />
            )}
            {railMode === "avatar-voice" && (
              <AvatarVoiceRail
                selectedAvatarId={wizard.state.avatarId}
                selectedVoiceId={wizard.state.voiceId}
                onAvatarChange={(id) => wizard.set("avatarId", id)}
                onVoiceChange={(id) => wizard.set("voiceId", id)}
                onClose={handleAttachCancel}
              />
            )}
            {railMode === "style-brand" && (
              <StyleBrandStub onClose={handleAttachCancel} />
            )}
            {railMode === "script" && (
              <ScriptRail
                currentScript={wizard.state.script}
                onSave={(script) => {
                  wizard.set("script", script);
                  setRailMode(null);
                }}
                onClose={handleAttachCancel}
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
      <PopoverContent align="end" side="top" className="w-[280px] rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-4">
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
