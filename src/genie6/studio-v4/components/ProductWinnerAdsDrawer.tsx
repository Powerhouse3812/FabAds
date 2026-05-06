import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AttachedRef } from "../state/useWizard";

/**
 * ProductWinnerAdsDrawer — Step 4 right-rail body for top-performing
 * product creatives (Track C). Same chassis as LibraryColumnDrawer;
 * mock-only.
 */

interface ProductWinnerAdsDrawerProps {
  onSave: (refs: AttachedRef[]) => void;
  onCancel: () => void;
}

const MOCK_PRODUCT_WINNERS: {
  id: string;
  thumbnail: string;
  label: string;
  meta: string;
}[] = [
  {
    id: "pwa-1",
    thumbnail:
      "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=240&q=70",
    label: "Onion Hair Oil 250ml",
    meta: "₹399 · 3.6% CTR",
  },
  {
    id: "pwa-2",
    thumbnail:
      "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=240&q=70",
    label: "Airdopes 141 TWS",
    meta: "₹1,299 · 4.1% CTR",
  },
  {
    id: "pwa-3",
    thumbnail:
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=240&q=70",
    label: "ColorFit Pro 5 Watch",
    meta: "₹3,499 · 3.2% CTR",
  },
  {
    id: "pwa-4",
    thumbnail:
      "https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=240&q=70",
    label: "Orthopedic Mattress Q",
    meta: "₹18,999 · 2.5% CTR",
  },
  {
    id: "pwa-5",
    thumbnail:
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=240&q=70",
    label: "Vitamin C Face Serum",
    meta: "₹599 · 3.8% CTR",
  },
  {
    id: "pwa-6",
    thumbnail:
      "https://images.unsplash.com/photo-1599751449128-eb7249c3d6b1?auto=format&fit=crop&w=240&q=70",
    label: "Plant Protein Choco 1kg",
    meta: "₹1,899 · 2.9% CTR",
  },
];

export function ProductWinnerAdsDrawer({
  onSave,
  onCancel,
}: ProductWinnerAdsDrawerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSave = () => {
    const refs: AttachedRef[] = MOCK_PRODUCT_WINNERS.filter((i) =>
      selected.has(i.id),
    ).map((i) => ({
      id: i.id,
      source: "product-winner-ads",
      label: i.label,
      thumbnail: i.thumbnail,
    }));
    onSave(refs);
  };

  const n = selected.size;

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 flex items-center justify-between border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground leading-tight">
            Product knowledge · Winner Ads
          </h3>
          <p className="text-[10px] text-muted-foreground leading-snug">
            Top-performing product creatives · last 30 days
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close product winners"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        <ul className="grid grid-cols-2 gap-3">
          {MOCK_PRODUCT_WINNERS.map((item) => {
            const isSelected = selected.has(item.id);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
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
                      src={item.thumbnail}
                      alt={item.label}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {isSelected && (
                      <span className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <div className="px-2 py-1.5">
                    <div className="truncate text-xs font-medium text-foreground">
                      {item.label}
                    </div>
                    <div className="truncate font-mono text-[10px] text-muted-foreground">
                      {item.meta}
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
          onClick={onCancel}
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
      </footer>
    </div>
  );
}
