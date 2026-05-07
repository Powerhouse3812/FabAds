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
          <ul className="grid grid-cols-2 gap-2">
            {ANGLES.map((a) => {
              const active = selectedAngleId === a.id;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => onAngleChange(active ? null : a.id)}
                    className={cn(
                      "relative flex h-full w-full flex-col gap-1 overflow-hidden rounded-lg border bg-background text-left transition-all",
                      active
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <AngleMockup variant={a.mockup} selected={active} />
                    {active && (
                      <span className="absolute right-1.5 top-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                        <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      </span>
                    )}
                    <p className="px-2 pb-1.5 text-[11px] font-semibold leading-tight text-foreground">
                      {a.label}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {tab === "concept" && (
          <ul className="grid grid-cols-2 gap-2">
            {CONCEPTS.map((c) => {
              const active = selectedConceptIds.includes(c.id);
              const v = getConceptVisuals(c);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => toggleConcept(c.id)}
                    className={cn(
                      "relative flex h-full w-full flex-col overflow-hidden rounded-lg border bg-background text-left transition-all",
                      active
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                      {v?.thumbnail ? (
                        <img
                          src={v.thumbnail}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl">
                          {c.emoji}
                        </div>
                      )}
                      {active && (
                        <span className="absolute right-1.5 top-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                          <Check className="h-2.5 w-2.5" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <p className="truncate px-2 py-1.5 text-[11px] font-semibold leading-tight text-foreground">
                      {c.name}
                    </p>
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
