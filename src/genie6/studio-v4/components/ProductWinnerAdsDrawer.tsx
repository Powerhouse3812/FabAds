import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AttachedRef } from "../state/useWizard";

/**
 * ProductWinnerAdsDrawer — Step 4 right-rail body for top-performing
 * product creatives (Track C). Same chassis as LibraryColumnDrawer;
 * mock-only.
 *
 * Card baseline: glass (bg-card/60), 4:5 aspect, brand chip top-left,
 * format chip top-right, price + CTR shown as primary stats.
 */

interface ProductWinnerAdsDrawerProps {
  onSave: (refs: AttachedRef[]) => void;
  onCancel: () => void;
}

interface ProductWinnerItem {
  id: string;
  thumbnail: string;
  label: string;
  brand: string;
  format: "Static" | "Video" | "Carousel";
  price: string;
  ctr: string;
}

const MOCK_PRODUCT_WINNERS: ProductWinnerItem[] = [
  {
    id: "pwa-1",
    thumbnail: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=240&q=70",
    label: "Onion Hair Oil 250ml",
    brand: "Mamaearth",
    format: "Static",
    price: "₹399",
    ctr: "3.6% CTR",
  },
  {
    id: "pwa-2",
    thumbnail: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=240&q=70",
    label: "Airdopes 141 TWS",
    brand: "Boat",
    format: "Video",
    price: "₹1,299",
    ctr: "4.1% CTR",
  },
  {
    id: "pwa-3",
    thumbnail: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=240&q=70",
    label: "ColorFit Pro 5 Watch",
    brand: "Noise",
    format: "Carousel",
    price: "₹3,499",
    ctr: "3.2% CTR",
  },
  {
    id: "pwa-4",
    thumbnail: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=240&q=70",
    label: "Ortho Mattress Queen",
    brand: "Sleepyhead",
    format: "Static",
    price: "₹18,999",
    ctr: "2.5% CTR",
  },
  {
    id: "pwa-5",
    thumbnail: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=240&q=70",
    label: "Vitamin C Face Serum",
    brand: "Plum",
    format: "Static",
    price: "₹599",
    ctr: "3.8% CTR",
  },
  {
    id: "pwa-6",
    thumbnail: "https://images.unsplash.com/photo-1599751449128-eb7249c3d6b1?auto=format&fit=crop&w=240&q=70",
    label: "Plant Protein Choco 1kg",
    brand: "Plix",
    format: "Video",
    price: "₹1,899",
    ctr: "2.9% CTR",
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
      <header className="shrink-0 flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Product winners · last 30 days
          </p>
          <h3 className="text-sm font-semibold text-foreground">Top creatives</h3>
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
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {MOCK_PRODUCT_WINNERS.map((item) => {
            const isSelected = selected.has(item.id);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
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
                      src={item.thumbnail}
                      alt={item.label}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform group-hover:scale-[1.04]"
                    />
                    <span className="absolute left-1.5 top-1.5 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
                      {item.brand}
                    </span>
                    <span className="absolute right-1.5 top-1.5 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase text-foreground backdrop-blur">
                      {item.format}
                    </span>
                    {isSelected && (
                      <span className="absolute right-1.5 bottom-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 px-2.5 py-2">
                    <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-foreground">
                      {item.label}
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {item.price} · {item.ctr}
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
