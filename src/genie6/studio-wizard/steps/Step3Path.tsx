import { Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Path } from "@/genie6/v4-shared/types";
import { StepShell } from "../components/StepShell";

/**
 * Step 3 — From Scratch vs Iterate.
 *
 * Two big illustrated cards. Selected card gets a lime ring. If the
 * sub-mode profile locks `path` (e.g. Variations → "iterate") the
 * wizard auto-skips this step entirely.
 */

export interface Step3PathProps {
  value: Path;
  onChange: (next: Path) => void;
}

interface PathCard {
  id: Path;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CARDS: PathCard[] = [
  {
    id: "scratch",
    title: "From Scratch",
    description: "Generate brand-new creative from inputs only.",
    icon: Sparkles,
  },
  {
    id: "iterate",
    title: "Iterate",
    description: "Start from a reference and tweak it.",
    icon: Wand2,
  },
];

export function Step3Path({ value, onChange }: Step3PathProps) {
  return (
    <StepShell>
      <div className="space-y-5">
        <header className="space-y-1.5">
          <h1 className="text-xl font-semibold text-foreground">
            How do you want to start?
          </h1>
          <p className="text-sm text-muted-foreground">
            Build something new from scratch, or iterate on an existing
            reference.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-4">
          {CARDS.map((card) => {
            const Icon = card.icon;
            const active = value === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => onChange(card.id)}
                aria-pressed={active}
                className={cn(
                  "group flex flex-col gap-3 rounded-xl border bg-card p-5 text-left transition-all",
                  "hover:-translate-y-0.5 hover:shadow-md",
                  "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  active
                    ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                    : "border-border hover:border-primary/40",
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-base font-semibold text-foreground">
                    {card.title}
                  </p>
                  <p className="text-[12px] text-muted-foreground leading-snug">
                    {card.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </StepShell>
  );
}
