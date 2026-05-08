import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AttachedRef } from "../state/useWizard";

/**
 * BrandWinnerAdsDrawer — Step 4 right-rail body for top-performing brand
 * creatives (Track C). Same chassis as LibraryColumnDrawer; mock-only.
 *
 * Card baseline: glass (bg-card/60), 4:5 aspect, brand chip top-left,
 * format chip top-right, CTR shown as primary stat.
 */

interface BrandWinnerAdsDrawerProps {
  onSave: (refs: AttachedRef[]) => void;
  onCancel: () => void;
}

interface BrandWinnerItem {
  id: string;
  thumbnail: string;
  label: string;
  brand: string;
  format: "Static" | "Video" | "Carousel";
  ctr: string;
  imp: string;
}

const MOCK_BRAND_WINNERS: BrandWinnerItem[] = [
  {
    id: "bwa-1",
    thumbnail: "https://images.unsplash.com/photo-1522335789203-aaa5cf9b7a7e?auto=format&fit=crop&w=240&q=70",
    label: "Hero serum drop",
    brand: "Mamaearth",
    format: "Static",
    ctr: "3.1% CTR",
    imp: "4.2M imp",
  },
  {
    id: "bwa-2",
    thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=240&q=70",
    label: "Bass-boost demo",
    brand: "Noise",
    format: "Video",
    ctr: "2.7% CTR",
    imp: "2.8M imp",
  },
  {
    id: "bwa-3",
    thumbnail: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=240&q=70",
    label: "Wireless launch",
    brand: "Boat",
    format: "Carousel",
    ctr: "3.4% CTR",
    imp: "5.6M imp",
  },
  {
    id: "bwa-4",
    thumbnail: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=240&q=70",
    label: "Sleep solved",
    brand: "Sleepyhead",
    format: "Static",
    ctr: "2.4% CTR",
    imp: "1.9M imp",
  },
  {
    id: "bwa-5",
    thumbnail: "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?auto=format&fit=crop&w=240&q=70",
    label: "Glow routine",
    brand: "Mensa",
    format: "Video",
    ctr: "2.9% CTR",
    imp: "3.3M imp",
  },
  {
    id: "bwa-6",
    thumbnail: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=240&q=70",
    label: "Plant-power flex",
    brand: "Plix",
    format: "Carousel",
    ctr: "3.0% CTR",
    imp: "2.1M imp",
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
      label: `${i.brand} · ${i.label}`,
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
            Brand winners · last 30 days
          </p>
          <h3 className="text-sm font-semibold text-foreground">Top creatives</h3>
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
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {MOCK_BRAND_WINNERS.map((item) => {
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
                      {item.ctr} · {item.imp}
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
