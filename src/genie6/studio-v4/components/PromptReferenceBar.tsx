import { useRef, useState } from "react";
import { Plus, Sparkles, X, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CtaLayoutToggle } from "./CtaLayoutToggle";
import { AttachPopover } from "./AttachPopover";
import { RightRail } from "./RightRail";
import { LibraryColumnDrawer } from "./LibraryColumnDrawer";
import { BrandWinnerAdsDrawer } from "./BrandWinnerAdsDrawer";
import { ProductWinnerAdsDrawer } from "./ProductWinnerAdsDrawer";
import type {
  UseWizardReturn,
  AttachSource,
  AttachedRef,
} from "../state/useWizard";

/**
 * PromptReferenceBar — Step 4 merged prompt + reference dock (Track C).
 *
 * Single textarea + clip/+ icon to attach references. Heavy sources
 * (library / pinterest / *-winner-ads) open a right-rail column drawer.
 * Lighter sources (upload / url) fire inline (file picker / URL popover).
 *
 * Handles BOTH CTA-layout variants:
 *   - "inline":  inline Send button on the right of the bar (Variant A)
 *   - "footer":  no Send here — WizardNav owns the Generate button (Variant B)
 *
 * The CtaLayoutToggle dev pill always renders far-right so Maalik can flip
 * layouts at runtime.
 *
 * Pinterest note: v3's `PinterestColumnDrawer` requires a deep query/selection
 * contract (PinterestPin[], onReplaceSelection, brand/concept ctx) that
 * doesn't fit Track C's clean { onSave, onCancel } pattern. For first ship
 * we render a minimal mock-pin grid inside our RightRail. Integration with
 * the v3 component (or a v4-native rewrite) is a follow-up.
 */

interface PromptReferenceBarProps {
  wizard: UseWizardReturn;
}

const SOURCE_ICON: Record<AttachSource, string> = {
  upload: "🖼",
  library: "🗂",
  pinterest: "📌",
  "brand-winner-ads": "🏆",
  "product-winner-ads": "📦",
  url: "🔗",
};

const MOCK_PINS: { id: string; thumbnail: string; label: string }[] = [
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

export function PromptReferenceBar({ wizard }: PromptReferenceBarProps) {
  const { state } = wizard;

  const [attachOpen, setAttachOpen] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<AttachSource | null>(null);
  const [urlPopoverOpen, setUrlPopoverOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pinterest placeholder local select state
  const [pinSelected, setPinSelected] = useState<Set<string>>(new Set());

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
    setActiveDrawer(source);
  };

  const handleSave =
    (source: AttachSource) => (refs: AttachedRef[]) => {
      wizard.set("attachedReferences", [
        ...state.attachedReferences,
        ...refs.map((r) => ({ ...r, source })),
      ]);
      setActiveDrawer(null);
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

  const submitUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    let host = trimmed;
    try {
      host = new URL(
        trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
      ).hostname;
    } catch {
      // fall back to raw input
    }
    const ref: AttachedRef = {
      id: `url-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      source: "url",
      label: `URL · ${host}`,
    };
    wizard.set("attachedReferences", [...state.attachedReferences, ref]);
    setUrlInput("");
    setUrlPopoverOpen(false);
  };

  const togglePin = (id: string) =>
    setPinSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const closePinterest = () => {
    setActiveDrawer(null);
    setPinSelected(new Set());
  };

  const savePinterest = () => {
    const refs: AttachedRef[] = MOCK_PINS.filter((p) => pinSelected.has(p.id)).map(
      (p) => ({
        id: p.id,
        source: "pinterest",
        label: p.label,
        thumbnail: p.thumbnail,
      }),
    );
    wizard.set("attachedReferences", [...state.attachedReferences, ...refs]);
    closePinterest();
  };

  const railOpen =
    activeDrawer !== null && activeDrawer !== "upload" && activeDrawer !== "url";

  const showInlineSend = state.ctaLayout === "inline";

  // Generate-CTA math: derive concept count from credits / count (mirrors WizardNav).
  const totalOutputs = state.credits;
  const variations = state.count;
  const conceptCount = Math.max(
    1,
    Math.round(totalOutputs / Math.max(variations, 1)),
  );

  return (
    <>
      <div
        className={cn(
          "sticky bottom-0 z-30",
          "border-t border-border bg-background/95 backdrop-blur",
          "px-6 py-3",
        )}
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2">
          {/* Row 1 — attached refs chips */}
          {state.attachedReferences.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Attached
              </span>
              {state.attachedReferences.map((ref) => (
                <span
                  key={ref.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground"
                >
                  <span aria-hidden>{SOURCE_ICON[ref.source]}</span>
                  <span className="max-w-[160px] truncate">{ref.label}</span>
                  <button
                    type="button"
                    onClick={() => removeRef(ref.id)}
                    aria-label={`Remove ${ref.label}`}
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Row 2 — main bar */}
          <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
            {/* + icon — wraps the AttachPopover */}
            <AttachPopover
              open={attachOpen}
              onOpenChange={setAttachOpen}
              onPick={handleAttachPick}
            >
              <button
                type="button"
                aria-label="Attach reference"
                className={cn(
                  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background transition-colors",
                  "hover:border-primary/40",
                )}
              >
                <Plus className="h-4 w-4" />
              </button>
            </AttachPopover>

            {/* URL inline popover — separate trigger so it doesn't conflict
                with the AttachPopover anchored on the same + icon. Hidden
                button anchored next to the + button. */}
            <Popover open={urlPopoverOpen} onOpenChange={setUrlPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-hidden="true"
                  tabIndex={-1}
                  className="pointer-events-none absolute left-2 top-2 h-9 w-9 opacity-0"
                />
              </PopoverTrigger>
              <PopoverContent align="start" side="top" className="w-80 p-3">
                <div className="space-y-2">
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

            {/* Textarea */}
            <textarea
              value={state.prompt}
              onChange={(e) => wizard.set("prompt", e.target.value)}
              rows={2}
              placeholder="Describe what you want to generate…"
              className="block w-full flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
            />

            {/* Right meta — char counter + (optional) inline Send */}
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {state.prompt.length} chars
              </span>
              {showInlineSend && (
                <button
                  type="button"
                  onClick={() => wizard.goTo(5)}
                  disabled={!state.prompt.trim()}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground transition-transform",
                    "hover:scale-[1.02]",
                    "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100",
                  )}
                >
                  <Sparkles className="h-4 w-4" />
                  Generate
                  <span className="font-mono text-[10px] opacity-80">
                    {conceptCount === 1
                      ? `· ${variations}× · ${totalOutputs} cr`
                      : `· ${conceptCount}×${variations} = ${totalOutputs} · ${totalOutputs} cr`}
                  </span>
                </button>
              )}
            </div>

            {/* Dev toggle — always rendered far right */}
            <CtaLayoutToggle
              value={state.ctaLayout}
              onChange={(v) => wizard.set("ctaLayout", v)}
              className="self-center"
            />
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

      {/* Right-rail drawer — heavy sources */}
      <RightRail open={railOpen} onClose={() => setActiveDrawer(null)}>
        {activeDrawer === "library" && (
          <LibraryColumnDrawer
            onSave={handleSave("library")}
            onCancel={() => setActiveDrawer(null)}
          />
        )}
        {activeDrawer === "brand-winner-ads" && (
          <BrandWinnerAdsDrawer
            onSave={handleSave("brand-winner-ads")}
            onCancel={() => setActiveDrawer(null)}
          />
        )}
        {activeDrawer === "product-winner-ads" && (
          <ProductWinnerAdsDrawer
            onSave={handleSave("product-winner-ads")}
            onCancel={() => setActiveDrawer(null)}
          />
        )}
        {activeDrawer === "pinterest" && (
          <div className="flex h-full flex-col">
            <header className="shrink-0 flex items-center justify-between border-b border-border px-4 py-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground leading-tight">
                  Pinterest
                </h3>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Auto-fetched mood-board pins · click to attach
                </p>
              </div>
              <button
                type="button"
                onClick={closePinterest}
                aria-label="Close pinterest"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </header>
            <div className="flex-1 min-h-0 overflow-y-auto p-3">
              <ul className="grid grid-cols-2 gap-3">
                {MOCK_PINS.map((p) => {
                  const isSelected = pinSelected.has(p.id);
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => togglePin(p.id)}
                        aria-pressed={isSelected}
                        className={cn(
                          "group relative flex w-full flex-col overflow-hidden rounded-md border bg-card text-left transition-colors",
                          isSelected
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-border hover:border-foreground/30",
                        )}
                      >
                        <div className="relative aspect-square w-full overflow-hidden bg-muted">
                          <img
                            src={p.thumbnail}
                            alt={p.label}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="px-2 py-1.5">
                          <div className="truncate text-xs font-medium text-foreground">
                            {p.label}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            <footer className="shrink-0 flex items-center justify-end gap-2 border-t border-border px-4 py-3">
              <button
                type="button"
                onClick={closePinterest}
                className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={savePinterest}
                disabled={pinSelected.size === 0}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition-opacity",
                  "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                Save
                {pinSelected.size > 0 && (
                  <span className="font-mono opacity-90">
                    · {pinSelected.size}
                  </span>
                )}
              </button>
            </footer>
          </div>
        )}
      </RightRail>
    </>
  );
}
