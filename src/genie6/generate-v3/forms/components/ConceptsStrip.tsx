import { useState } from "react";
import { Lightbulb, RefreshCw, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  savedConcepts,
  newConcepts,
  type ConceptDescriptor,
} from "@/genie6/generate-v3/mocks/concepts";

/**
 * ConceptsStrip — A-11.21 (Brand → Product-focused).
 *
 * Maalik's lock:
 *   "by default hum system me saved dikha dekhnge, with a button to
 *    regenerate fresh concepts now, and unme se select kre fir. We can
 *    add a toggle chip may be to select between new create and saved ones."
 *
 * - Saved view shows seeded concepts.
 * - New view shows freshly generated concepts (mock 1.5s loader).
 * - "Regenerate fresh" is the explicit re-generate trigger; flips view
 *   to New automatically.
 * - User selects 0..N. Empty selection at submit = "AI decides."
 */

export type ConceptSource = "saved" | "new";

export interface ConceptsStripProps {
  source: ConceptSource;
  onSourceChange: (next: ConceptSource) => void;
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export function ConceptsStrip({
  source,
  onSourceChange,
  selectedIds,
  onToggle,
}: ConceptsStripProps) {
  const [regenerating, setRegenerating] = useState(false);
  const [newList, setNewList] = useState<ConceptDescriptor[]>(newConcepts);

  const concepts = source === "saved" ? savedConcepts : newList;

  const regenerate = () => {
    setRegenerating(true);
    onSourceChange("new");
    // Mock 1.5s "AI is generating"
    window.setTimeout(() => {
      // Simulate a fresh shuffle / new IDs to show movement
      const shuffled = [...newConcepts]
        .map((c, i) => ({
          ...c,
          id: `${c.id}-r${Date.now().toString(36).slice(-3)}-${i}`,
        }))
        .sort(() => Math.random() - 0.5);
      setNewList(shuffled);
      setRegenerating(false);
    }, 1500);
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Generated concepts
          </h2>
          <span className="text-[10px] text-muted-foreground/80">
            · empty = let AI decide
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <SourceToggle source={source} onChange={onSourceChange} />
          <button
            type="button"
            onClick={regenerate}
            disabled={regenerating}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors",
              "hover:border-primary/40 hover:text-foreground",
              "disabled:opacity-50 disabled:cursor-progress",
            )}
          >
            {regenerating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            {regenerating ? "Generating…" : "Regenerate fresh"}
          </button>
        </div>
      </div>

      {/* Vertical stack inside the column (A-11.25). */}
      <div className="space-y-2">
        {regenerating && source === "new" ? (
          <ConceptSkeletonRow />
        ) : (
          concepts.map((c) => (
            <ConceptCard
              key={c.id}
              concept={c}
              selected={selectedIds.includes(c.id)}
              onToggle={() => onToggle(c.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────── */

function SourceToggle({
  source,
  onChange,
}: {
  source: ConceptSource;
  onChange: (next: ConceptSource) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Concept source"
      className="inline-flex rounded-full border border-border bg-card p-0.5"
    >
      {(["saved", "new"] as const).map((s) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={source === s}
          onClick={() => onChange(s)}
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider transition-colors",
            source === s
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

function ConceptCard({
  concept,
  selected,
  onToggle,
}: {
  concept: ConceptDescriptor;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      aria-label={`${selected ? "Deselect" : "Select"} concept: ${concept.name}`}
      className={cn(
        "w-full rounded-xl border bg-card p-2.5 text-left transition-all space-y-1.5",
        "hover:-translate-y-0.5 hover:shadow-md",
        "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        selected
          ? "border-primary ring-2 ring-primary/30 bg-primary/5"
          : "border-border hover:border-primary/40",
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="text-xs font-semibold text-foreground leading-tight">
          {concept.name}
        </p>
        {selected && (
          <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-2 w-2" strokeWidth={3} />
          </span>
        )}
      </div>
      <p className="line-clamp-2 text-[10px] text-muted-foreground leading-snug">
        {concept.gist}
      </p>
      <div className="flex flex-wrap gap-1 pt-0.5">
        {concept.angleTag && <Pill>{concept.angleTag}</Pill>}
        {concept.audienceTag && <Pill muted>{concept.audienceTag}</Pill>}
      </div>
    </button>
  );
}

function Pill({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
        muted
          ? "bg-muted/70 text-muted-foreground"
          : "bg-primary/10 text-foreground",
      )}
    >
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────────────── */

function ConceptSkeletonRow() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-full rounded-xl border border-border bg-card p-2.5 space-y-1.5 animate-pulse"
        >
          <div className="h-3 w-3/4 rounded bg-muted/70" />
          <div className="h-2 w-full rounded bg-muted/50" />
          <div className="h-2 w-2/3 rounded bg-muted/50" />
          <div className="flex gap-1 pt-0.5">
            <div className="h-3 w-12 rounded-full bg-muted/60" />
            <div className="h-3 w-14 rounded-full bg-muted/40" />
          </div>
        </div>
      ))}
    </>
  );
}
