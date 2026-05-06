import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AttachedRef } from "../state/useWizard";

/**
 * LibraryColumnDrawer — Step 4 right-rail body for "From Library" (Track C).
 *
 * Multi-select grid of past generations / saved assets. Mock-only for now.
 * Sticky header (title + close), scroll body (2-col grid), sticky footer
 * (Cancel + Save · n).
 */

interface LibraryColumnDrawerProps {
  onSave: (refs: AttachedRef[]) => void;
  onCancel: () => void;
}

const MOCK_LIBRARY: {
  id: string;
  thumbnail: string;
  label: string;
  meta: string;
}[] = [
  {
    id: "lib-1",
    thumbnail:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=240&q=70",
    label: "Studio white shoot",
    meta: "Mamaearth · 2h ago",
  },
  {
    id: "lib-2",
    thumbnail:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=240&q=70",
    label: "Festive launch",
    meta: "Noise · Yesterday",
  },
  {
    id: "lib-3",
    thumbnail:
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=240&q=70",
    label: "Bundle hero",
    meta: "Boat · Yesterday",
  },
  {
    id: "lib-4",
    thumbnail:
      "https://images.unsplash.com/photo-1622372738946-62e02505feb3?auto=format&fit=crop&w=240&q=70",
    label: "Editorial product",
    meta: "Sleepyhead · 2 days",
  },
  {
    id: "lib-5",
    thumbnail:
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=240&q=70",
    label: "Lifestyle edit",
    meta: "Mamaearth · 3 days",
  },
  {
    id: "lib-6",
    thumbnail:
      "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=240&q=70",
    label: "Hero pack",
    meta: "Boat · 4 days",
  },
  {
    id: "lib-7",
    thumbnail:
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=240&q=70",
    label: "Detail shot",
    meta: "Noise · 5 days",
  },
  {
    id: "lib-8",
    thumbnail:
      "https://images.unsplash.com/photo-1512446816042-444d641267d4?auto=format&fit=crop&w=240&q=70",
    label: "Mood test",
    meta: "Mensa · 1 week",
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
      {/* Sticky header */}
      <header className="shrink-0 flex items-center justify-between border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground leading-tight">
            Library
          </h3>
          <p className="text-[10px] text-muted-foreground leading-snug">
            Saved generations & assets · click to select
          </p>
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

      {/* Scroll body */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        <ul className="grid grid-cols-2 gap-3">
          {MOCK_LIBRARY.map((item) => {
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
                    <div className="truncate text-[10px] text-muted-foreground">
                      {item.meta}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Sticky footer */}
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
