import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AngleMockup,
  type AngleVariant,
} from "../../generate-v3/forms/components/AngleMockup";
import { CONCEPTS, getConceptVisuals } from "../data/concepts";

interface ConceptAngleRailProps {
  selectedAngleId: string | null;
  selectedConceptIds: string[];
  onAngleChange: (id: string | null) => void;
  onConceptsChange: (ids: string[]) => void;
  onClose: () => void;
}

const ANGLES: { id: string; label: string; mockup: AngleVariant }[] = [
  { id: "hero",         label: "Hero Shot",     mockup: "founder-quote" },
  { id: "lifestyle",    label: "Lifestyle",     mockup: "lifestyle" },
  { id: "social-proof", label: "Social Proof",  mockup: "social-proof" },
  { id: "urgency",      label: "Urgency",       mockup: "fomo" },
  { id: "comparison",   label: "Comparison",    mockup: "problem-solution" },
  { id: "ugc-style",    label: "UGC Style",     mockup: "before-after" },
  { id: "unboxing",     label: "Unboxing",      mockup: "unboxing" },
  { id: "infographic",  label: "Infographic",   mockup: "bold-claim" },
];

type Tab = "angle" | "concept";

/**
 * ConceptAngleRail — combined picker for the merged "Concept · Angle"
 * chip in PromptReferenceBar. Tabbed interface — Angle (single-select)
 * + Concept (multi-select). Sleek 280px-wide rail.
 */
export function ConceptAngleRail({
  selectedAngleId,
  selectedConceptIds,
  onAngleChange,
  onConceptsChange,
  onClose,
}: ConceptAngleRailProps) {
  const [tab, setTab] = useState<Tab>("angle");

  const toggleConcept = (id: string) => {
    onConceptsChange(
      selectedConceptIds.includes(id)
        ? selectedConceptIds.filter((x) => x !== id)
        : [...selectedConceptIds, id],
    );
  };

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Edit picks
          </p>
          <h3 className="text-sm font-semibold text-foreground">Concept · Angle</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      {/* Tab toggle */}
      <div className="shrink-0 flex border-b border-border bg-muted/20 px-2 py-1">
        <TabBtn active={tab === "angle"} onClick={() => setTab("angle")}>
          Angle{selectedAngleId ? " · 1" : ""}
        </TabBtn>
        <TabBtn active={tab === "concept"} onClick={() => setTab("concept")}>
          Concept{selectedConceptIds.length > 0 ? ` · ${selectedConceptIds.length}` : ""}
        </TabBtn>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {tab === "angle" && (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ANGLES.map((a) => {
              const active = selectedAngleId === a.id;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => onAngleChange(active ? null : a.id)}
                    className={cn(
                      "group relative flex h-full w-full flex-col overflow-hidden rounded-xl border text-left backdrop-blur-sm transition-all",
                      active
                        ? "border-primary/50 bg-primary/5 ring-2 ring-primary/30"
                        : "border-border/40 bg-card/60 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
                    )}
                  >
                    <div className="relative w-full overflow-hidden bg-muted">
                      <AngleMockup variant={a.mockup} selected={active} />
                      {active && (
                        <span className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <p className="px-2.5 py-2 text-[11px] font-semibold leading-tight text-foreground">
                      {a.label}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {tab === "concept" && (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CONCEPTS.map((c) => {
              const active = selectedConceptIds.includes(c.id);
              const v = getConceptVisuals(c);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => toggleConcept(c.id)}
                    className={cn(
                      "group flex h-full w-full flex-col overflow-hidden rounded-xl border text-left backdrop-blur-sm transition-all",
                      active
                        ? "border-primary/50 bg-primary/5 ring-2 ring-primary/30"
                        : "border-border/40 bg-card/60 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
                    )}
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                      {v?.thumbnail ? (
                        <img
                          src={v.thumbnail}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl">
                          {c.emoji}
                        </div>
                      )}
                      {v?.brand && (
                        <span className="absolute left-1.5 top-1.5 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
                          {v.brand}
                        </span>
                      )}
                      <span className="absolute right-1.5 top-1.5 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase text-foreground backdrop-blur">
                        {c.category}
                      </span>
                      {active && (
                        <span className="absolute right-1.5 bottom-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 px-2.5 py-2">
                      <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-foreground">
                        {c.name}
                      </p>
                      <p className="line-clamp-1 font-mono text-[10px] text-muted-foreground">
                        {c.desc}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <footer className="shrink-0 flex items-center justify-end border-t border-border px-3 py-2.5">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90"
        >
          Done
        </button>
      </footer>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
