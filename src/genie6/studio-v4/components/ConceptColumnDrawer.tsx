import { useMemo, useState } from "react";
import { Check, Search, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CONCEPTS,
  CONCEPT_CATEGORIES,
  type ConceptCategory,
} from "../data/concepts";

/**
 * ConceptColumnDrawer — multi-select picker rendered inside a RightRail panel.
 *
 * Mirrors the LibraryColumnDrawer / *-WinnerAdsDrawer chassis: sticky header,
 * search + category filter, scroll body of cards, sticky footer with
 * Cancel + Save actions. Selection is local state until Save fires onSave
 * with the final id list.
 */

interface ConceptColumnDrawerProps {
  initialSelected: string[];
  onSave: (ids: string[]) => void;
  onCancel: () => void;
}

export function ConceptColumnDrawer({
  initialSelected,
  onSave,
  onCancel,
}: ConceptColumnDrawerProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ConceptCategory | null>(null);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSelected),
  );

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const filtered = useMemo(() => {
    let list = CONCEPTS;
    if (category) list = list.filter((c) => c.category === category);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.desc.toLowerCase().includes(q),
      );
    }
    return list;
  }, [search, category]);

  return (
    <div className="flex h-full flex-col">
      {/* Sticky header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <div className="flex-1">
          <div className="text-sm font-bold text-foreground">Concepts</div>
          <div className="text-[11px] text-muted-foreground">
            Multi-select · {selected.size} chosen
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="rounded-md p-1 hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search + category filter */}
      <div className="space-y-2 border-b border-border px-4 py-3">
        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search concepts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>

        {/* Category filter chips */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={cn(
              "inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-medium transition-colors",
              category === null
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            All
          </button>
          {CONCEPT_CATEGORIES.map((c) => {
            const active = category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={cn(
                  "inline-flex h-6 items-center gap-1 rounded-full border px-2.5 text-[11px] font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <span aria-hidden>{c.emoji}</span>
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scroll body */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <ul className="grid grid-cols-2 gap-2">
          {filtered.map((concept) => {
            const isSelected = selected.has(concept.id);
            return (
              <li key={concept.id}>
                <button
                  type="button"
                  onClick={() => toggle(concept.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "group relative flex h-full w-full flex-col items-start gap-1.5 rounded-xl border bg-background p-3 text-left transition-all",
                    isSelected
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:-translate-y-0.5 hover:border-primary/40",
                  )}
                >
                  {isSelected && (
                    <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                  <span className="text-2xl leading-none">{concept.emoji}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">
                      {concept.name}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                      {concept.desc}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="col-span-2 px-3 py-8 text-center text-xs text-muted-foreground">
              No concepts match {search ? `"${search}"` : "this filter"}.
            </li>
          )}
        </ul>
      </div>

      {/* Sticky footer */}
      <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave(Array.from(selected))}
          disabled={selected.size === 0}
          className={cn(
            "inline-flex items-center rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
            selected.size === 0
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : "bg-primary text-primary-foreground hover:opacity-90",
          )}
        >
          Save · {selected.size}
        </button>
      </div>
    </div>
  );
}
