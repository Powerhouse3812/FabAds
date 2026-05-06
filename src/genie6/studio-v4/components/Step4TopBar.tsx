import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UseWizardReturn } from "../state/useWizard";

interface Step4TopBarProps {
  wizard: UseWizardReturn;
}

const STEPS = [
  { label: "Setup", index: 1 },
  { label: "Product", index: 2 },
  { label: "Approach", index: 3 },
  { label: "Configure", index: 4 },
] as const;

export function Step4TopBar({ wizard }: Step4TopBarProps) {
  const currentStep = wizard.state.step;

  return (
    <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-6 py-3 backdrop-blur">
      <button
        type="button"
        onClick={() => wizard.back()}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      <span className="text-muted-foreground/40">|</span>

      <div className="flex items-center gap-2 text-sm">
        {STEPS.map((s, i) => {
          const isActive = currentStep === s.index;
          const isDone = currentStep > s.index;
          return (
            <span key={s.label} className="inline-flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isDone
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {isDone ? "✓" : isActive ? "●" : s.index}
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  isActive
                    ? "text-foreground"
                    : isDone
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <span className="text-muted-foreground/50">|</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
