import { cn } from "@/lib/utils";

/**
 * AspectRatioMulti — multi-select chip group for aspect ratios (A-11.19).
 *
 * Maalik flagged "aspect ratio bhul gya tha. add krna." — placed at the
 * top-level form (not buried in Advanced) since it's a primary render
 * setting. Multi-select so the user can render the same shoot at
 * multiple ratios in one go (1:1 + 9:16 for Reels + 16:9 for YouTube).
 */

export type AspectRatio = "1:1" | "4:5" | "9:16" | "16:9" | "1.91:1";

const OPTIONS: { id: AspectRatio; label: string; hint: string }[] = [
  { id: "1:1",     label: "1:1",     hint: "Feed · Square" },
  { id: "4:5",     label: "4:5",     hint: "Feed · Portrait" },
  { id: "9:16",    label: "9:16",    hint: "Reels · Stories" },
  { id: "16:9",    label: "16:9",    hint: "YouTube · Display" },
  { id: "1.91:1",  label: "1.91:1",  hint: "Link preview" },
];

export interface AspectRatioMultiProps {
  value: AspectRatio[];
  onChange: (next: AspectRatio[]) => void;
}

export function AspectRatioMulti({ value, onChange }: AspectRatioMultiProps) {
  const toggle = (a: AspectRatio) => {
    onChange(value.includes(a) ? value.filter((x) => x !== a) : [...value, a]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {OPTIONS.map((o) => {
        const active = value.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => toggle(o.id)}
            aria-pressed={active}
            title={o.hint}
            className={cn(
              "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-mono tabular-nums transition-colors",
              "outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-1",
              active
                ? "border-primary/40 bg-primary/10 text-foreground font-bold"
                : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
