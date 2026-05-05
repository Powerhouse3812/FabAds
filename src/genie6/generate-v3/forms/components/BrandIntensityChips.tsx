import { cn } from "@/lib/utils";

/**
 * BrandIntensityChips — 4-step chip group for "Brand identity intensity".
 *
 * Per Maalik spec: Hide / Minimum / Moderate / Strong. Controls how much
 * brand identity (logo, palette, typography) shows up in the generated
 * shoot. "Hide" = anonymous product photo, "Strong" = full brand wrap.
 */

export type BrandIntensity = "hide" | "minimum" | "moderate" | "strong";

const OPTIONS: { id: BrandIntensity; label: string; sub: string }[] = [
  { id: "hide", label: "Hide", sub: "Anonymous · no brand cues" },
  { id: "minimum", label: "Minimum", sub: "Subtle · color hints only" },
  { id: "moderate", label: "Moderate", sub: "Balanced · default brand wrap" },
  { id: "strong", label: "Strong", sub: "Full · logo + palette + type" },
];

export interface BrandIntensityChipsProps {
  value: BrandIntensity;
  onChange: (next: BrandIntensity) => void;
}

export function BrandIntensityChips({ value, onChange }: BrandIntensityChipsProps) {
  return (
    <div role="radiogroup" aria-label="Brand identity intensity" className="flex flex-wrap gap-1.5">
      {OPTIONS.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.id)}
            title={opt.sub}
            className={cn(
              "inline-flex items-center rounded-md border px-2.5 py-1 text-xs transition-all",
              "outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-1",
              active
                ? "border-primary/40 bg-primary/10 text-foreground font-medium"
                : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
