import { Check, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONCEPTS } from "../data/concepts";

interface ConceptStripProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** wizard.state.count — used in the helper math line */
  variations: number;
  /** Triggers Step 4 to set railMode = "generate-concepts" */
  onGenerateNew: () => void;
}

export function ConceptStrip({
  selectedIds,
  onChange,
  variations,
  onGenerateNew,
}: ConceptStripProps) {
  const toggle = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    onChange(next);
  };

  return (
    <section className="space-y-2">
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Concepts
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          multi-select · {selectedIds.length} chosen
        </span>
        {selectedIds.length > 0 && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {selectedIds.length} × {variations} = {selectedIds.length * variations} outputs
          </span>
        )}
      </div>

      {/* Horizontal scroll-snap strip */}
      <div className="-mx-1 flex items-stretch gap-3 overflow-x-auto px-1 pb-2 snap-x snap-mandatory">
        {CONCEPTS.map((concept) => {
          const active = selectedIds.includes(concept.id);
          return (
            <button
              key={concept.id}
              type="button"
              onClick={() => toggle(concept.id)}
              className={cn(
                "snap-start shrink-0 flex w-[140px] flex-col gap-1 overflow-hidden rounded-lg border bg-card text-left transition-all",
                active
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:border-primary/40 hover:-translate-y-0.5",
              )}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                <img
                  src={concept.thumbnail}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                {active && (
                  <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </div>
              <p className="truncate px-2 pb-2 pt-0.5 text-[12px] font-bold leading-tight text-foreground">
                {concept.name}
              </p>
            </button>
          );
        })}

        {/* "+ Generate new" affordance — sits at end of strip */}
        <button
          type="button"
          onClick={onGenerateNew}
          className="snap-start shrink-0 flex w-[140px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 text-center transition-colors hover:bg-primary/10"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Plus className="h-4 w-4" />
          </span>
          <span className="text-[11px] font-bold leading-tight text-primary">
            Generate new concept
          </span>
        </button>
      </div>
    </section>
  );
}
