import { cn } from "@/lib/utils";
import { AngleMockup, type AngleVariant } from "./AngleMockup";

/**
 * AnglePicker — multi-select grid of visual angle tiles (A-11.21).
 *
 * Per Maalik: angle picker must be visual — user knows what they're getting
 * without reading. Each tile has an `<AngleMockup />` SVG composition + a
 * label + 1-line description. No photos.
 */

export interface AngleDescriptor {
  id: string;
  label: string;
  description: string;
  variant: AngleVariant;
}

export const ANGLES: AngleDescriptor[] = [
  {
    id: "fomo",
    label: "FOMO",
    description: "Scarcity / countdown / limited-stock urgency",
    variant: "fomo",
  },
  {
    id: "founder-quote",
    label: "Founder quote",
    description: "Founder talking-head with on-screen quote",
    variant: "founder-quote",
  },
  {
    id: "lifestyle",
    label: "Lifestyle",
    description: "In-context use, mood-led setting",
    variant: "lifestyle",
  },
  {
    id: "problem-solution",
    label: "Problem → solution",
    description: "Pain state cut to product-as-fix",
    variant: "problem-solution",
  },
  {
    id: "social-proof",
    label: "Social proof",
    description: "Reviews, ratings, customer count",
    variant: "social-proof",
  },
  {
    id: "before-after",
    label: "Before / after",
    description: "Split-screen transformation",
    variant: "before-after",
  },
  {
    id: "bold-claim",
    label: "Bold claim",
    description: "Oversized type, single big proof point",
    variant: "bold-claim",
  },
  {
    id: "unboxing",
    label: "Unboxing",
    description: "Texture-led reveal, sound design",
    variant: "unboxing",
  },
];

export interface AnglePickerProps {
  selectedIds: string[];
  onToggle: (id: string) => void;
  /** Optional override list. Defaults to all ANGLES. */
  angles?: AngleDescriptor[];
}

export function AnglePicker({
  selectedIds,
  onToggle,
  angles = ANGLES,
}: AnglePickerProps) {
  return (
    <div className="space-y-1.5">
      {selectedIds.length > 0 && (
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {selectedIds.length} selected · multi-select for parallel render
        </p>
      )}
      {/* 2-col vertical-flow grid — fits the column width without cards
          getting too narrow (A-11.25). */}
      <div className="grid grid-cols-2 gap-2">
        {angles.map((a) => {
          const selected = selectedIds.includes(a.id);
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onToggle(a.id)}
              aria-pressed={selected}
              aria-label={`${selected ? "Deselect" : "Select"} angle: ${a.label} — ${a.description}`}
              className={cn(
                "group flex flex-col rounded-xl border bg-card text-left overflow-hidden transition-all",
                "hover:-translate-y-0.5 hover:shadow-md",
                "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                selected
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:border-primary/40",
              )}
            >
              <AngleMockup variant={a.variant} selected={selected} />
              <div className="px-2 py-1.5 space-y-0.5">
                <p className="truncate text-[11px] font-semibold text-foreground">
                  {a.label}
                </p>
                <p className="line-clamp-1 text-[10px] text-muted-foreground">
                  {a.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
