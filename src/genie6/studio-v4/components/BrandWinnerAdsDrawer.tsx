import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AttachedRef } from "../state/useWizard";

/**
 * BrandWinnerAdsDrawer — Step 4 right-rail body for top-performing brand
 * creatives (Track C). Same chassis as LibraryColumnDrawer; mock-only.
 */

interface BrandWinnerAdsDrawerProps {
  onSave: (refs: AttachedRef[]) => void;
  onCancel: () => void;
}

const MOCK_BRAND_WINNERS: {
  id: string;
  thumbnail: string;
  label: string;
  meta: string;
}[] = [
  {
    id: "bwa-1",
    thumbnail:
      "https://images.unsplash.com/photo-1522335789203-aaa5cf9b7a7e?auto=format&fit=crop&w=240&q=70",
    label: "Mamaearth · Winner",
    meta: "4.2M imp · 3.1% CTR",
  },
  {
    id: "bwa-2",
    thumbnail:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=240&q=70",
    label: "Noise · Winner",
    meta: "2.8M imp · 2.7% CTR",
  },
  {
    id: "bwa-3",
    thumbnail:
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=240&q=70",
    label: "Boat · Winner",
    meta: "5.6M imp · 3.4% CTR",
  },
  {
    id: "bwa-4",
    thumbnail:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=240&q=70",
    label: "Sleepyhead · Winner",
    meta: "1.9M imp · 2.4% CTR",
  },
  {
    id: "bwa-5",
    thumbnail:
      "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?auto=format&fit=crop&w=240&q=70",
    label: "Mensa Brands · Winner",
    meta: "3.3M imp · 2.9% CTR",
  },
  {
    id: "bwa-6",
    thumbnail:
      "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=240&q=70",
    label: "Plix · Winner",
    meta: "2.1M imp · 3.0% CTR",
  },
];

export function BrandWinnerAdsDrawer({
  onSave,
  onCancel,
}: BrandWinnerAdsDrawerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSave = () => {
    const refs: AttachedRef[] = MOCK_BRAND_WINNERS.filter((i) =>
      selected.has(i.id),
    ).map((i) => ({
      id: i.id,
      source: "brand-winner-ads",
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
            Brand knowledge · Winner Ads
          </h3>
          <p className="text-[10px] text-muted-foreground leading-snug">
            Top-performing brand creatives · last 30 days
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close brand winners"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        <ul className="grid grid-cols-2 gap-3">
          {MOCK_BRAND_WINNERS.map((item) => {
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
