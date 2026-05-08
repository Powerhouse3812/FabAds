import { useMemo, useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { sampleOutputs } from "../../mocks/sample-outputs";
import type {
  AttachSource,
  AttachedRef,
  UseWizardReturn,
} from "../state/useWizard";
import { HeroHeader } from "../components/HeroHeader";
import { PromptReferenceBar, type ChipKind } from "../components/PromptReferenceBar";
import { RailGenerateConcepts } from "../components/RailGenerateConcepts";
import { ConceptAngleRail } from "../components/ConceptAngleRail";
import { AvatarVoiceRail } from "../components/AvatarVoiceRail";
import { ScriptRail } from "../components/ScriptRail";
import { LibraryColumnDrawer } from "../components/LibraryColumnDrawer";
import { BrandWinnerAdsDrawer } from "../components/BrandWinnerAdsDrawer";
import { ProductWinnerAdsDrawer } from "../components/ProductWinnerAdsDrawer";
import { ContextRail } from "../components/ContextRail";
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
  | "script";

interface AlphaStep3Props {
  wizard: UseWizardReturn;
  studioMode?: AlphaMode;
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
export function AlphaStep3Configure({ wizard, studioMode }: AlphaStep3Props) {
  const [railMode, setRailMode] = useState<RailMode>(null);

  // Trending concepts — top 8 sample outputs by qualityScore desc
  const trending = useMemo(() => {
    const all = sampleOutputs.slice();
    all.sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0));
    return all.slice(0, 8);
  }, []);

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

  return (
    <>
      {/* ── Main layout — 2-column on xl: form + ContextRail ── */}
      <div className="flex min-h-0 w-full gap-6 px-6 pt-8 pb-10">
        {/* Left: form content */}
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          <HeroHeader title="Configure" />

          {/* AI prompt suggestions — ABOVE the prompt bar, sleek single-line strip */}
          {wizard.state.prompt.trim().length === 0 && (
            <PromptSuggestions
              angleId={wizard.state.angleId}
              onPick={(p) => wizard.set("prompt", p)}
            />
          )}

          {/* Prompt bar — Layout A (inline Send) always. */}
          <PromptReferenceBar
            wizard={wizard}
            onAttachPickerOpen={handleAttachPickerOpen}
            onChipOpen={handleChipOpen}
            hideLayoutToggle
          />

          {/* Trending concepts — vertical grid (more space available, easier to scan) */}
          <section className="space-y-2">
            <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Trending concepts
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {trending.map((t) => {
                const active = isTrendingSelected(t.id);
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => toggleTrending(t.id)}
                      className={cn(
                        "group relative flex w-full flex-col gap-1 overflow-hidden rounded-xl border bg-card/60 text-left backdrop-blur-sm transition-all",
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
            </ul>
          </section>
        </div>
        {/* Right: ContextRail */}
        <div className="hidden w-[280px] shrink-0 xl:block">
          <ContextRail wizard={wizard} studioMode={studioMode} />
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
          {/* Dialog box */}
          <div className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl max-h-[70vh]">
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
          </div>
        </div>
      )}
    </>
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
        Try
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
              <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm opacity-70">
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
