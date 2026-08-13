import type { ElementType, ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MobileOptionCardProps {
  icon: ElementType;
  title: string;
  /** One-line description under the title. */
  blurb?: string;
  /** Optional bullet list — used by the Product Chooser cards. */
  bullets?: string[];
  selected?: boolean;
  onSelect: () => void;
  /** Mono kicker over the title, e.g. "AI Creative Generation". */
  kicker?: string;
  children?: ReactNode;
}

/**
 * Tappable option card — the mobile equivalent of the selection cards in
 * `ChooseMode.tsx` / `ProductChooser.tsx`.
 *
 * Same visual language as web (border + `bg-primary/[0.06]` when selected,
 * lime-tinted icon tile, check affordance) but full-width and ≥56px tall so
 * the whole row is the hit target rather than a hover-dependent area.
 *
 * Selection is signalled three ways — border, background, and an explicit
 * check — so it never depends on colour alone.
 */
export function MobileOptionCard({
  icon: Icon,
  title,
  blurb,
  bullets,
  selected = false,
  onSelect,
  kicker,
  children,
}: MobileOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "w-full min-h-14 rounded-xl border bg-card p-3.5 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "border-primary bg-primary/[0.06]"
          : "border-border active:bg-muted/60",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
            selected
              ? "bg-primary text-primary-foreground"
              : "bg-primary/15 text-foreground",
          )}
          aria-hidden
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          {kicker && (
            <span className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">
              {kicker}
            </span>
          )}
          <span className="flex items-center gap-2">
            <span className="text-[15px] font-semibold leading-tight text-foreground">
              {title}
            </span>
            {selected && (
              <Check
                className="h-4 w-4 shrink-0 text-primary"
                strokeWidth={3}
                aria-hidden
              />
            )}
          </span>
          {blurb && (
            <span className="mt-1 block text-[12.5px] leading-snug text-muted-foreground">
              {blurb}
            </span>
          )}
          {bullets && bullets.length > 0 && (
            <span className="mt-2 flex flex-col gap-1">
              {bullets.map((b) => (
                <span
                  key={b}
                  className="flex items-start gap-1.5 text-[12px] leading-snug text-foreground"
                >
                  <Check
                    className="mt-[3px] h-3 w-3 shrink-0 text-primary"
                    strokeWidth={3}
                    aria-hidden
                  />
                  <span>{b}</span>
                </span>
              ))}
            </span>
          )}
          {children}
        </span>
      </div>
    </button>
  );
}
