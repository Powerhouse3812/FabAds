import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AspectRatioFieldProps {
  value: string | undefined;
  onChange: (value: string) => void;
}

/**
 * Aspect ratio picker — §5: "show an example of each shape, not just the
 * ratio name." Same 4 ratios + proportioned-rectangle idiom as
 * `PromptReferenceBar.tsx`'s `RATIO_PREVIEW` (studio-v4), scaled up into
 * full cards since this is a top-level setup field, not a corner popover.
 */
const RATIOS: { value: string; w: number; h: number; hint: string }[] = [
  { value: "1:1", w: 34, h: 34, hint: "Square" },
  { value: "4:5", w: 30, h: 38, hint: "Feed" },
  { value: "9:16", w: 22, h: 38, hint: "Story / Reel" },
  { value: "16:9", w: 42, h: 24, hint: "Landscape" },
];

export function AspectRatioField({ value, onChange }: AspectRatioFieldProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {RATIOS.map((r) => {
        const active = value === r.value;
        return (
          <button
            key={r.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(r.value)}
            className={cn(
              "relative flex flex-col items-center gap-2 rounded-xl border bg-background px-2 py-3 transition-all",
              active
                ? "border-primary/50 ring-2 ring-primary/30"
                : "border-border hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-sm",
            )}
          >
            {active && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              </span>
            )}
            <span className="flex h-11 items-center justify-center">
              <span
                aria-hidden
                className={cn(
                  "inline-block rounded-[3px] border-2",
                  active ? "border-primary" : "border-foreground/40",
                )}
                style={{ width: `${r.w}px`, height: `${r.h}px` }}
              />
            </span>
            <span className="font-mono text-[11px] font-semibold text-foreground">{r.value}</span>
            <span className="text-[10px] text-muted-foreground">{r.hint}</span>
          </button>
        );
      })}
    </div>
  );
}
