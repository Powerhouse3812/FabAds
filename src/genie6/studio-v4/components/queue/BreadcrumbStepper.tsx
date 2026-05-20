import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbStepperProps {
  /** Step the user is currently on (1-5). Renders the lime dot at this position. */
  activeStep: 1 | 2 | 3 | 4 | 5;
  /** Optional click handler — back button at the start. */
  onBack?: () => void;
  /** Whether to show the explicit Back link before "Home". V2 layout uses it. */
  showBack?: boolean;
}

const STEPS = [
  { num: 1 as const, label: "Home" },
  { num: 2 as const, label: "Format" },
  { num: 3 as const, label: "Product" },
  { num: 4 as const, label: "Approach" },
  { num: 5 as const, label: "Configure" },
];

/**
 * BreadcrumbStepper — text breadcrumb with a lime dot on the active step.
 *
 * Replaces the numbered-circle `ProgressIndicator` on the Results Queue
 * screen per Maalik's Figma. The dot marks where the user "is" in the
 * wizard's flow; clicking an earlier step jumps back (forward jumps are
 * still blocked by `useWizard.goTo`).
 *
 * Labels per Figma: Home / Format / Product / Approach / Configure. The
 * green dot sits left of the active label.
 */
export function BreadcrumbStepper({
  activeStep,
  onBack,
  showBack = false,
}: BreadcrumbStepperProps) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-1 border-b border-border bg-background/80 px-6 py-2.5 backdrop-blur">
      {showBack && onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back
        </button>
      )}
      <nav aria-label="Wizard breadcrumb" className="flex items-center gap-1">
        {STEPS.map((s, i) => {
          const isActive = s.num === activeStep;
          const isPast = s.num < activeStep;
          return (
            <div key={s.num} className="flex items-center gap-1">
              {i > 0 && (
                <span
                  aria-hidden
                  className="text-muted-foreground/50 select-none"
                >
                  ›
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                {isActive && (
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                  />
                )}
                <span
                  className={cn(
                    "text-[12px] transition-colors",
                    isActive && "font-semibold text-foreground",
                    !isActive && isPast && "text-muted-foreground hover:text-foreground cursor-pointer",
                    !isActive && !isPast && "text-muted-foreground/60",
                  )}
                >
                  {s.label}
                </span>
              </span>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
