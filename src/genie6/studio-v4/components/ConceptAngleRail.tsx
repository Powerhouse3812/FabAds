import { useMemo } from "react";
import { Check, Lock, Target, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONCEPTS, getConceptVisuals } from "../data/concepts";
import {
  getAngleVisual,
  videoForSeed,
  posterForSeed,
} from "../data/studio-visuals";
import { ANGLE_CHIP_LABEL } from "./PromptReferenceBar";
import { PreviewVideo } from "./PreviewVideo";

interface ConceptAngleRailProps {
  selectedAngleId: string | null;
  selectedConceptIds: string[];
  onAngleChange: (id: string | null) => void;
  onConceptsChange: (ids: string[]) => void;
  onClose: () => void;
  /**
   * A-12.9 (Maalik 06-05): when the chosen approach sub-type locks the angle,
   * the angle tiles become NOT-editable — greyed + lock overlay + reason banner.
   * `onAngleChange` is a no-op while locked. Concept selection stays editable.
   */
  angleLock?: { locked: boolean; reason?: string };
}

/**
 * ConceptAngleRail — A-12.71 → A-12.9 (Maalik MOM 06-05). Mirrors the
 * Angles + Concepts pattern from Step 3 Configure, inside the prompt-bar
 * "Concept" chip modal:
 *   - Angles are now VISUAL tiles at the top — autoplay-loop video
 *     (getAngleVisual) + label overlay, all 20 visible, single-select
 *     (lime ring + check when active).
 *   - Concepts grid below — also autoplay-loop video tiles, vertical
 *     scroll inside a fixed-height frame, MATCH-FIRST ordering when an
 *     angle is picked, multi-select.
 *   - No tab toggle. Both surfaces co-visible.
 */

const ANGLE_IDS = [
  "hero", "lifestyle", "social-proof", "urgency", "comparison",
  "ugc-style", "unboxing", "infographic", "testimonial", "before-after",
  "problem-solution", "feature-highlight", "benefit-led", "fomo",
  "scarcity", "premium", "value-prop", "story", "demo", "educational",
];

export function ConceptAngleRail({
  selectedAngleId,
  selectedConceptIds,
  onAngleChange,
  onConceptsChange,
  onClose,
  angleLock,
}: ConceptAngleRailProps) {
  const angleLocked = angleLock?.locked ?? false;
  const toggleConcept = (id: string) => {
    onConceptsChange(
      selectedConceptIds.includes(id)
        ? selectedConceptIds.filter((x) => x !== id)
        : [...selectedConceptIds, id],
    );
  };

  // Match-first reorder when an angle is picked. Tolerant lowercase
  // contains check against the concept's desc / name / category — same
  // strategy as the Step 4 Configure trending strip.
  const orderedConcepts = useMemo(() => {
    if (!selectedAngleId) return CONCEPTS;
    const label = (ANGLE_CHIP_LABEL[selectedAngleId] ?? selectedAngleId).toLowerCase();
    const idLc = selectedAngleId.toLowerCase();
    const matches: typeof CONCEPTS = [];
    const rest: typeof CONCEPTS = [];
    for (const c of CONCEPTS) {
      const hay = `${c.name ?? ""} ${c.desc ?? ""} ${c.category ?? ""}`.toLowerCase();
      if (hay.includes(label) || hay.includes(idLc)) matches.push(c);
      else rest.push(c);
    }
    return [...matches, ...rest];
  }, [selectedAngleId]);

  const angleLabel = selectedAngleId
    ? (ANGLE_CHIP_LABEL[selectedAngleId] ?? selectedAngleId)
    : null;

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

      {/* Angles — VISUAL tiles (autoplay-loop video + label overlay), all
          20 visible in a capped-height scroll frame. Single-select. */}
      <div className="shrink-0 border-b border-border px-3 py-2.5">
        <div className="mb-2 flex items-center gap-1.5">
          <Target className="h-3 w-3 text-muted-foreground" />
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Angles
          </p>
          <span className="font-mono text-[9px] text-muted-foreground/70">
            {angleLocked ? "· locked by approach" : "· pick one to filter concepts"}
          </span>
        </div>
        {/* Locked-angle banner — greyed angle grid is read-only; only the
            approach sub-type can change it. */}
        {angleLocked && (
          <div className="mb-2 flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-[10px] text-muted-foreground">
            <Lock className="h-3 w-3 shrink-0" />
            <span className="min-w-0 truncate">
              {angleLock?.reason ?? "Angle is fixed"} · change the sub-type to edit
            </span>
          </div>
        )}
        <ul
          className={cn(
            "grid max-h-[176px] grid-cols-3 gap-2 overflow-y-auto pr-0.5 sm:grid-cols-4 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/10 [&::-webkit-scrollbar]:w-1.5",
            angleLocked && "pointer-events-none opacity-50",
          )}
        >
          {ANGLE_IDS.map((id) => {
            const active = selectedAngleId === id;
            const label = ANGLE_CHIP_LABEL[id] ?? id;
            const v = getAngleVisual(id);
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => {
                    if (angleLocked) return;
                    onAngleChange(active ? null : id);
                  }}
                  aria-pressed={active}
                  aria-disabled={angleLocked || undefined}
                  className={cn(
                    "group relative block aspect-[4/5] w-full overflow-hidden rounded-lg border text-left transition-all",
                    active
                      ? "border-primary/60 ring-2 ring-primary/40"
                      : "border-border/50 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
                  )}
                >
                  <PreviewVideo src={v.video} poster={v.poster} />
                  {/* Label overlay — bottom gradient scrim for legibility */}
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-1.5 pb-1 pt-4">
                    <span className="line-clamp-1 text-[10px] font-semibold leading-tight text-white">
                      {label}
                    </span>
                  </span>
                  {active && angleLocked ? (
                    <span className="absolute right-1 top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-foreground/80 text-background shadow-sm">
                      <Lock className="h-2.5 w-2.5" strokeWidth={2.5} />
                    </span>
                  ) : active ? (
                    <span className="absolute right-1 top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Concepts — vertical scroll grid inside a fixed-height frame */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/10 [&::-webkit-scrollbar]:w-1.5">
        <div className="mb-2 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-muted-foreground" />
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Concepts
          </p>
          <span className="font-mono text-[9px] text-muted-foreground/70">
            {angleLabel ? `· matched to ${angleLabel}` : "· pre-built starting points"}
          </span>
          {selectedConceptIds.length > 0 && (
            <span className="ml-auto inline-flex items-center rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-primary">
              {selectedConceptIds.length} selected
            </span>
          )}
        </div>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {orderedConcepts.map((c) => {
            const active = selectedConceptIds.includes(c.id);
            const v = getConceptVisuals(c);
            // Positive accent if this concept matches the picked angle (front
            // of list pre-sorted). No dimming — matches the Step 4 fix.
            const isMatch = (() => {
              if (!selectedAngleId) return false;
              const label = (ANGLE_CHIP_LABEL[selectedAngleId] ?? selectedAngleId).toLowerCase();
              const idLc = selectedAngleId.toLowerCase();
              const hay = `${c.name ?? ""} ${c.desc ?? ""} ${c.category ?? ""}`.toLowerCase();
              return hay.includes(label) || hay.includes(idLc);
            })();
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => toggleConcept(c.id)}
                  className={cn(
                    "group flex h-full w-full flex-col overflow-hidden rounded-xl border text-left backdrop-blur-sm transition-all",
                    active
                      ? "border-primary/50 bg-primary/5 ring-2 ring-primary/30"
                      : isMatch
                        ? "border-primary/30 bg-card/60 hover:-translate-y-0.5 hover:shadow-md"
                        : "border-border/40 bg-card/60 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
                  )}
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                    <PreviewVideo
                      src={videoForSeed(`concept:${c.id}`)}
                      poster={v?.thumbnail ?? posterForSeed(`concept:${c.id}`)}
                      className="transition-transform group-hover:scale-[1.04]"
                    />
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
      </div>

      <footer className="shrink-0 flex items-center justify-end border-t border-border px-3 py-2.5">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
        >
          Done
        </button>
      </footer>
    </div>
  );
}
