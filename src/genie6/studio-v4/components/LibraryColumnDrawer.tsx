import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AttachedRef } from "../state/useWizard";

/**
 * LibraryColumnDrawer — Step 4 right-rail body for "From Library" (Track C).
 *
 * Multi-select grid of past generations / saved assets. Mock-only for now.
 * Sticky header (title + close), scroll body (3-col 4:5 grid with brand
 * chip + format chip), sticky footer (Cancel + Save · n).
 *
 * Card baseline matches AvatarVoiceRail's voice-card pattern:
 * rounded-xl + glass + hover-lift + selected ring.
 */

interface LibraryColumnDrawerProps {
  onSave: (refs: AttachedRef[]) => void;
  onCancel: () => void;
}

interface LibraryItem {
  id: string;
  thumbnail: string;
  label: string;
  brand: string;
  format: "Static" | "Video" | "Carousel";
  age: string;
}

const MOCK_LIBRARY: LibraryItem[] = [
  {
    id: "lib-1",
    thumbnail: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=240&q=70",
    label: "Studio white shoot",
    brand: "Mamaearth",
    format: "Static",
    age: "2h ago",
  },
  {
    id: "lib-2",
    thumbnail: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=240&q=70",
    label: "Festive launch",
    brand: "Noise",
    format: "Carousel",
    age: "Yesterday",
  },
  {
    id: "lib-3",
    thumbnail: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=240&q=70",
    label: "Bundle hero",
    brand: "Boat",
    format: "Static",
    age: "Yesterday",
  },
  {
    id: "lib-4",
    thumbnail: "https://images.unsplash.com/photo-1622372738946-62e02505feb3?auto=format&fit=crop&w=240&q=70",
    label: "Editorial product",
    brand: "Sleepyhead",
    format: "Video",
    age: "2 days",
  },
  {
    id: "lib-5",
    thumbnail: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=240&q=70",
    label: "Lifestyle edit",
    brand: "Mamaearth",
    format: "Static",
    age: "3 days",
  },
  {
    id: "lib-6",
    thumbnail: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=240&q=70",
    label: "Hero pack",
    brand: "Boat",
    format: "Carousel",
    age: "4 days",
  },
  {
    id: "lib-7",
    thumbnail: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=240&q=70",
    label: "Detail shot",
    brand: "Noise",
    format: "Static",
    age: "5 days",
  },
  {
    id: "lib-8",
    thumbnail: "https://images.unsplash.com/photo-1512446816042-444d641267d4?auto=format&fit=crop&w=240&q=70",
    label: "Mood test",
    brand: "Mensa",
    format: "Video",
    age: "1 week",
  },
];

export function LibraryColumnDrawer({
  onSave,
  onCancel,
}: LibraryColumnDrawerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSave = () => {
    const refs: AttachedRef[] = MOCK_LIBRARY.filter((i) => selected.has(i.id)).map(
      (i) => ({
        id: i.id,
        source: "library",
        label: i.label,
        thumbnail: i.thumbnail,
      }),
    );
    onSave(refs);
  };

  const n = selected.size;

  return (
    <div className="flex h-full flex-col">
      {/* Sticky header — matches voice rail (px-3 py-2.5 + eyebrow) */}
      <header className="shrink-0 flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Saved assets
          </p>
          <h3 className="text-sm font-semibold text-foreground">Library</h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close library"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      {/* Scroll body — 3-col 4:5 grid */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {MOCK_LIBRARY.map((item) => {
            const isSelected = selected.has(item.id);
            return (
              <li key={item.id}>
                <MediaCard
                  thumbnail={item.thumbnail}
                  alt={item.label}
                  brand={item.brand}
                  format={item.format}
                  title={item.label}
                  stats={item.age}
                  selected={isSelected}
                  onClick={() => toggle(item.id)}
                />
              </li>
            );
          })}
        </ul>
      </div>

      {/* Sticky footer */}
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

/* ────────────────────────────────────────────────────────────────────── *
 * MediaCard — shared baseline for all picker media tiles.
 * Glass card (rounded-xl, bg-card/60, backdrop-blur), 4:5 thumb,
 * brand chip top-left, format chip top-right, selected ring + check.
 * Title (line-2) + stats (mono).
 * ────────────────────────────────────────────────────────────────────── */
function MediaCard({
  thumbnail,
  alt,
  brand,
  format,
  title,
  stats,
  selected,
  onClick,
}: {
  thumbnail: string;
  alt: string;
  brand?: string;
  format?: string;
  title: string;
  stats?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group flex h-full w-full flex-col overflow-hidden rounded-xl border bg-card/60 text-left backdrop-blur-sm transition-all",
        selected
          ? "border-primary/50 bg-primary/5 ring-2 ring-primary/30"
          : "border-border/40 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
      )}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
        <img
          src={thumbnail}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform group-hover:scale-[1.04]"
        />
        {brand && (
          <span className="absolute left-1.5 top-1.5 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
            {brand}
          </span>
        )}
        {format && (
          <span className="absolute right-1.5 top-1.5 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase text-foreground backdrop-blur">
            {format}
          </span>
        )}
        {selected && (
          <span className="absolute right-1.5 bottom-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0.5 px-2.5 py-2">
        <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-foreground">
          {title}
        </p>
        {stats && (
          <p className="font-mono text-[10px] text-muted-foreground">{stats}</p>
        )}
      </div>
    </button>
  );
}
