import { useMemo, useState } from "react";
import { Check, Plus, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  CONCEPTS,
  CONCEPT_CATEGORIES,
  type ConceptCategory,
} from "../data/concepts";

interface ConceptSectionProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** wizard.state.count — used in the helper math line */
  variations: number;
}

export function ConceptSection({
  selectedIds,
  onChange,
  variations,
}: ConceptSectionProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ConceptCategory | null>(null);

  const filtered = useMemo(() => {
    let list = CONCEPTS;
    if (category) list = list.filter((c) => c.category === category);
    const q = search.trim().toLowerCase();
    if (q)
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.desc.toLowerCase().includes(q),
      );
    return list;
  }, [search, category]);

  const toggle = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    onChange(next);
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      {/* Header row */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Concepts
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          multi-select
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {selectedIds.length} chosen
        </span>
        <button
          type="button"
          onClick={() =>
            toast.message("Generate custom — coming soon", { duration: 2500 })
          }
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
        >
          <Plus className="h-3 w-3" />
          Generate custom
        </button>
      </div>

      {/* Helper line */}
      {selectedIds.length > 0 && (
        <p className="mb-3 text-[11px] text-muted-foreground">
          Each concept generates {variations} variation
          {variations === 1 ? "" : "s"}.
          <span className="font-mono">
            {" "}
            {selectedIds.length} × {variations} ={" "}
            {selectedIds.length * variations} outputs
          </span>
        </p>
      )}

      {/* Search + category filter */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search concepts…"
            className="h-8 w-full rounded-lg border border-border bg-background py-1.5 pl-9 pr-3 text-xs outline-none transition-colors focus:border-primary"
          />
        </div>
        {/* Category chips */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={cn(
              "inline-flex h-7 items-center rounded-full border px-2.5 text-[11px] font-medium transition-colors",
              category === null
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            All
          </button>
          {CONCEPT_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={cn(
                "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[11px] font-medium transition-colors",
                category === c.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <span>{c.emoji}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Concept card grid */}
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((concept) => {
          const active = selectedIds.includes(concept.id);
          return (
            <li key={concept.id}>
              <button
                type="button"
                onClick={() => toggle(concept.id)}
                className={cn(
                  "group relative flex h-full w-full flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all",
                  active
                    ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                    : "border-border bg-background hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm",
                )}
              >
                {active && (
                  <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
                <span className="text-2xl leading-none">{concept.emoji}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">
                    {concept.name}
                  </p>
                  <p className="line-clamp-2 text-[11px] text-muted-foreground">
                    {concept.desc}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="col-span-full px-3 py-8 text-center text-xs text-muted-foreground">
            No concepts match {search ? `"${search}"` : "this filter"}.
          </li>
        )}
      </ul>
    </section>
  );
}
