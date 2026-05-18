import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TileProps {
  className?: string;
}

interface Suggestion {
  id: string;
  gap: string;
  action: string;
  cta: string;
  href: string;
}

const SUGGESTIONS: Suggestion[] = [
  {
    id: "boat-stale",
    gap: "Brand Boat hasn't generated in 14 days",
    action: "Try a fresh angle from your saved competitor ads",
    cta: "Open Boat",
    href: "/catalogue/brands/boat",
  },
  {
    id: "forge-ready",
    gap: "5 saved ads ready for Forge",
    action: "Generate 10 variants of each to test angles",
    cta: "Forge now",
    href: "/iq/genie6/forge",
  },
  {
    id: "sleepyhead-no-comp",
    gap: "Sleepyhead has no competitors tracked",
    action: "Add 3-5 competitors to surface ad patterns",
    cta: "Add competitor",
    href: "/insights/competitors",
  },
];

export function AiSuggestionsCoach({ className }: TileProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const allDismissed = dismissed.length >= SUGGESTIONS.length;

  return (
    <Card
      className={cn(
        "rounded-2xl border border-border bg-card p-5 flex flex-col gap-4",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-muted-foreground">
            AI Suggestions
          </span>
        </div>
        <h3 className="text-[14px] font-semibold text-foreground leading-tight">
          Things worth doing next
        </h3>
        <p className="text-[10px] font-mono text-muted-foreground">
          Refreshes daily
        </p>
      </div>

      {allDismissed ? (
        <p className="text-[11px] font-mono text-muted-foreground py-6 text-center">
          All clear · we'll suggest more tomorrow
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {SUGGESTIONS.map((s) => {
            const isDismissed = dismissed.includes(s.id);
            return (
              <div
                key={s.id}
                className={cn(
                  "rounded-xl border border-border bg-background/40 p-3 flex flex-col gap-1.5 transition-all duration-200",
                  isDismissed &&
                    "opacity-0 -translate-x-2 pointer-events-none line-through",
                )}
              >
                <p className="text-[12.5px] text-foreground leading-snug">
                  {s.gap}
                </p>
                <p className="text-[11.5px] text-muted-foreground italic leading-snug">
                  &rarr; {s.action}
                </p>
                <div className="flex items-center justify-end gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setDismissed((d) => [...d, s.id])}
                    aria-label="Dismiss suggestion"
                    className="h-6 w-6 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <Link
                    to={s.href}
                    className="inline-flex items-center rounded-full bg-primary px-2.5 py-1 text-[10px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    {s.cta}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
