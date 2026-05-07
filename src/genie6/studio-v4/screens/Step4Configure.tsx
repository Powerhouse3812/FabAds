import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  AttachSource,
  AttachedRef,
  UseWizardReturn,
} from "../state/useWizard";
import { Step4TopBar } from "../components/Step4TopBar";
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

interface Step4Props {
  wizard: UseWizardReturn;
}


export function Step4Configure({ wizard }: Step4Props) {
  // null = rail hidden (default). Set to a mode value when user triggers
  // a heavy attach source or "Generate new concept".
  const [railMode, setRailMode] = useState<RailMode>(null);

  // Rail picker save handler — routes by attach source. Closing returns
  // form to full width.
  const handleAttachSave =
    (source: AttachSource) => (refs: AttachedRef[]) => {
      wizard.set("attachedReferences", [
        ...wizard.state.attachedReferences,
        ...refs.map((r) => ({ ...r, source })),
      ]);
      setRailMode(null);
    };
  const handleAttachCancel = () => setRailMode(null);

  // PromptReferenceBar's attach popover delegates here for heavy sources.
  // Triggers the rail to slide in.
  const handleAttachPickerOpen = (source: AttachSource) => {
    if (
      source === "library" ||
      source === "pinterest" ||
      source === "brand-winner-ads" ||
      source === "product-winner-ads"
    ) {
      setRailMode(source);
    }
    // upload + url are handled inline by PromptReferenceBar
  };

  // Top-row chip click → opens corresponding rail picker
  const handleChipOpen = (chip: ChipKind) => setRailMode(chip);

  return (
    <>
      {wizard.state.ctaLayout === "inline" && <Step4TopBar wizard={wizard} />}

      {/* 2-column wrapper — form on left, on-demand rail on right.
          When railMode === null the rail is unmounted entirely; the form
          column gets the full width. min-h-full so the form fills the
          scroll viewport (lets `mt-auto` push the prompt bar to the
          bottom even when content is short). */}
      <div className="mx-auto flex min-h-full w-full max-w-5xl gap-4 px-6 pt-4 pb-6">
        {/* Left: form column — Angle/Concept moved to chips inside the
            prompt bar. Form is now just header + (optional future content)
            + prompt bar at bottom. mt-auto on the prompt bar wrapper
            pushes it to the bottom of the form column. */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <HeroHeader title="Configure & generate" />

          <div className="mt-auto">
            <PromptReferenceBar
              wizard={wizard}
              onAttachPickerOpen={handleAttachPickerOpen}
              onChipOpen={handleChipOpen}
            />
          </div>
        </div>

        {/* Right: on-demand rail — only renders when a mode is active */}
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
              <StyleBrandRailStub onClose={handleAttachCancel} />
            )}
            {railMode === "library" && (
              <LibraryColumnDrawer
                onSave={handleAttachSave("library")}
                onCancel={handleAttachCancel}
              />
            )}
            {railMode === "pinterest" && (
              <PinterestRailPanel
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
          </RightRail>
        )}
      </div>
    </>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  PinterestRailPanel — inline mock pin grid for the rail.
 *  v3's PinterestColumnDrawer requires a deeper query/selection
 *  contract that doesn't fit the { onSave, onCancel } pattern.
 *  Migrated here from PromptReferenceBar (A-12.3 location).
 * ────────────────────────────────────────────────────────── */
const MOCK_PINS = [
  {
    id: "pin-1",
    thumbnail:
      "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=240&q=70",
    label: "Pastel flat-lay",
  },
  {
    id: "pin-2",
    thumbnail:
      "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=240&q=70",
    label: "Bold typography",
  },
  {
    id: "pin-3",
    thumbnail:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=240&q=70",
    label: "Editorial fashion",
  },
  {
    id: "pin-4",
    thumbnail:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=240&q=70",
    label: "Minimal product",
  },
  {
    id: "pin-5",
    thumbnail:
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=240&q=70",
    label: "Color block",
  },
  {
    id: "pin-6",
    thumbnail:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=240&q=70",
    label: "Festive set",
  },
];

function StyleBrandRailStub({ onClose }: { onClose: () => void }) {
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

function PinterestRailPanel({
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
        source: "pinterest" as AttachSource,
        label: p.label,
        thumbnail: p.thumbnail,
      })),
    );
  };

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 flex items-center justify-between border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            References
          </p>
          <h3 className="text-sm font-bold text-foreground">Pinterest</h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <ul className="grid grid-cols-2 gap-2">
          {MOCK_PINS.map((p) => {
            const isSel = selected.has(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => toggle(p.id)}
                  aria-pressed={isSel}
                  className={cn(
                    "relative flex w-full flex-col overflow-hidden rounded-md border bg-card text-left transition-colors",
                    isSel
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-foreground/30",
                  )}
                >
                  <div className="aspect-square w-full overflow-hidden bg-muted">
                    <img
                      src={p.thumbnail}
                      alt={p.label}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="truncate px-2 py-1.5 text-xs font-medium text-foreground">
                    {p.label}
                  </div>
                  {isSel && (
                    <span className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <footer className="shrink-0 flex items-center justify-end gap-2 border-t border-border px-4 py-3">
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
          disabled={selected.size === 0}
          className={cn(
            "inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition-opacity",
            "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          Save{selected.size > 0 ? ` · ${selected.size}` : ""}
        </button>
      </footer>
    </div>
  );
}
