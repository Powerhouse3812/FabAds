import { useMemo, useState } from "react";
import { Check, ImageOff, PackageSearch, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { products as ALL_PRODUCTS } from "@/mocks/shared";
import type { AttachedRef } from "../state/useWizard";

/**
 * SeedImageRail — Step 4 picker body for "Product images" rail mode.
 *
 * A product SEED / hero-IMAGE picker (multi-select). These are the official
 * product shots pulled from the product profile — the user picks which ones
 * Genie should seed generation from.
 *
 * Mirrors LibraryColumnDrawer's chassis: sticky header (eyebrow + title +
 * count + close), a clarifying source line, scroll body (3-col 4:5 grid),
 * sticky footer (Cancel + "Save · n").
 *
 * On save → onSave(AttachedRef[]) using the EXISTING AttachSource value
 * "upload" (these are first-party product assets, not Library items). The
 * orchestrator's handleAttachSave re-stamps source anyway, but we set a
 * valid one so the component is correct standalone.
 *
 * Composed empty state when no product is in context.
 */

interface SeedImageRailProps {
  onSave: (refs: AttachedRef[]) => void;
  onClose: () => void;
  /** Resolved from wizard.state.productId. Drives the framing + empty state. */
  productId?: string | null;
  /** Resolved from wizard.state.brandId. Used only for the framing line. */
  brandId?: string | null;
}

interface SeedImage {
  id: string;
  label: string;
  thumbnail: string;
}

/** Inline mock — ~8 "official product shots". Brand-agnostic stock imagery
 *  standing in for the product profile's gallery. */
const SEED_IMAGES: SeedImage[] = [
  {
    id: "seed-pack-front",
    label: "Pack front",
    thumbnail:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=240&q=70",
  },
  {
    id: "seed-pack-angle",
    label: "Pack 45°",
    thumbnail:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=240&q=70",
  },
  {
    id: "seed-white-bg",
    label: "White bg cut-out",
    thumbnail:
      "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=240&q=70",
  },
  {
    id: "seed-in-hand",
    label: "In-hand shot",
    thumbnail:
      "https://images.unsplash.com/photo-1607602132700-068258431c6c?auto=format&fit=crop&w=240&q=70",
  },
  {
    id: "seed-lifestyle",
    label: "Lifestyle scene",
    thumbnail:
      "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=240&q=70",
  },
  {
    id: "seed-flat-lay",
    label: "Flat-lay set",
    thumbnail:
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=240&q=70",
  },
  {
    id: "seed-detail",
    label: "Detail macro",
    thumbnail:
      "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&w=240&q=70",
  },
  {
    id: "seed-group",
    label: "Range / group",
    thumbnail:
      "https://images.unsplash.com/photo-1598662779094-110c2bad80b5?auto=format&fit=crop&w=240&q=70",
  },
];

export function SeedImageRail({
  onSave,
  onClose,
  productId = null,
  brandId = null,
}: SeedImageRailProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Resolve a readable product name for the framing line (mirrors
  // AlphaStep3Configure's products.find pattern — no extra helper import).
  const product = useMemo(
    () => (productId ? ALL_PRODUCTS.find((p) => p.id === productId) : undefined),
    [productId],
  );
  const contextLabel = product?.name ?? null;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSave = () => {
    const refs: AttachedRef[] = SEED_IMAGES.filter((img) =>
      selected.has(img.id),
    ).map((img) => ({
      id: img.id,
      source: "upload",
      label: img.label,
      thumbnail: img.thumbnail,
    }));
    onSave(refs);
  };

  const n = selected.size;

  // Composed empty state — no product in context.
  if (!productId) {
    return (
      <div className="flex h-full flex-col">
        <header className="shrink-0 flex items-center justify-between border-b border-border px-3 py-2.5">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Product images
            </p>
            <h3 className="text-sm font-semibold text-foreground">Seed images</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ImageOff className="h-4 w-4" />
          </span>
          <p className="text-[13px] font-semibold text-foreground">
            No product selected
          </p>
          <p className="mt-1 max-w-[38ch] text-[11px] leading-snug text-muted-foreground">
            Official product shots are pulled from the product profile. Pick a
            product back in Step 2 to seed from its hero images.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 inline-flex items-center rounded-full border border-border/60 bg-background/50 px-3 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Sticky header */}
      <header className="shrink-0 border-b border-border px-3 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Product images
            </p>
            <h3 className="text-sm font-semibold text-foreground">
              Seed images
              <span className="ml-1.5 font-mono text-[11px] font-normal text-muted-foreground">
                {SEED_IMAGES.length}
              </span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close seed images"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
          Official product shots — pulled from the
          {contextLabel ? (
            <span className="font-semibold text-foreground"> {contextLabel} </span>
          ) : (
            " "
          )}
          product profile{brandId ? "" : ""}.
        </p>
      </header>

      {/* Scroll body — 3-col 4:5 grid */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {SEED_IMAGES.map((img) => {
            const isSelected = selected.has(img.id);
            return (
              <li key={img.id}>
                <button
                  type="button"
                  onClick={() => toggle(img.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "group flex h-full w-full flex-col overflow-hidden rounded-xl border bg-card/60 text-left backdrop-blur-sm transition-all",
                    isSelected
                      ? "border-primary/50 bg-primary/5 ring-2 ring-primary/30"
                      : "border-border/40 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
                  )}
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                    <img
                      src={img.thumbnail}
                      alt={img.label}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform group-hover:scale-[1.04]"
                    />
                    <span className="absolute left-1.5 top-1.5 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase text-foreground backdrop-blur">
                      Official
                    </span>
                    {isSelected && (
                      <span className="absolute right-1.5 bottom-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 px-2.5 py-2">
                    <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-foreground">
                      {img.label}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Sticky footer */}
      <footer className="shrink-0 flex items-center justify-between gap-2 border-t border-border px-3 py-2.5">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <PackageSearch className="h-3 w-3" />
          {n > 0 ? `${n} selected` : "None selected"}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={n === 0}
            className={cn(
              "inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition-opacity",
              "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            Save{n > 0 && <span className="font-mono opacity-90">· {n}</span>}
          </button>
        </div>
      </footer>
    </div>
  );
}
