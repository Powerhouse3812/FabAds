import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { sampleOutputs } from "../../mocks/sample-outputs";
import type {
  AttachSource,
  AttachedRef,
  UseWizardReturn,
} from "../state/useWizard";
import { HeroHeader } from "../components/HeroHeader";
import { PromptReferenceBar, type ChipKind } from "../components/PromptReferenceBar";
import { RightRail } from "../components/RightRail";
import { RailGenerateConcepts } from "../components/RailGenerateConcepts";
import { ConceptAngleRail } from "../components/ConceptAngleRail";
import { AvatarVoiceRail } from "../components/AvatarVoiceRail";
import { LibraryColumnDrawer } from "../components/LibraryColumnDrawer";
import { BrandWinnerAdsDrawer } from "../components/BrandWinnerAdsDrawer";
import { ProductWinnerAdsDrawer } from "../components/ProductWinnerAdsDrawer";

export type RailMode =
  | null
  | "generate-concepts"
  | "library"
  | "pinterest"
  | "brand-winner-ads"
  | "product-winner-ads"
  | "concept-angle"
  | "avatar-voice"
  | "style-brand";

interface AlphaStep3Props {
  wizard: UseWizardReturn;
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
export function AlphaStep3Configure({ wizard }: AlphaStep3Props) {
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
    <div className="mx-auto flex min-h-full w-full max-w-5xl gap-4 px-6 pt-4 pb-6">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <HeroHeader title="Configure" />

        {/* Prompt bar at TOP (not bottom). Force ctaLayout = "inline"
            so the Send button is inside the bar (footer is hidden via
            StudioAlpha shell). */}
        <PromptReferenceBar
          wizard={wizard}
          onAttachPickerOpen={handleAttachPickerOpen}
          onChipOpen={handleChipOpen}
        />

        {/* Trending concepts strip — below the prompt bar */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Trending concepts
          </h2>
          <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 snap-x snap-mandatory">
            {trending.map((t) => {
              const active = isTrendingSelected(t.id);
              return (
                <li key={t.id} className="snap-start shrink-0 w-[140px]">
                  <button
                    type="button"
                    onClick={() => toggleTrending(t.id)}
                    className={cn(
                      "group relative flex w-full flex-col gap-1 overflow-hidden rounded-lg border bg-card text-left transition-all",
                      active
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border hover:-translate-y-0.5 hover:border-primary/40",
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

      {/* Right rail — on-demand */}
      {railMode !== null && (
        <RightRail>
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
          {railMode === "library" && (
            <LibraryColumnDrawer
              onSave={handleAttachSave("library")}
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
        </RightRail>
      )}
    </div>
  );
}

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
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <p className="text-[11px] text-muted-foreground">
          Brand style is auto-pulled from the product's brand profile.
          Custom style preset picker coming soon.
        </p>
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
