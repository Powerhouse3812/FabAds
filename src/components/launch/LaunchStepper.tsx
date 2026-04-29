import { cn } from "@/lib/utils";
import { Check, Lock } from "lucide-react";

const steps = [
  { label: "Ad Account & Setup", step: 1 },
  { label: "Targeting", step: 2 },
  { label: "Creatives & Config", step: 3 },
];

interface LaunchStepperProps {
  currentStep: number;
  completedStep: number;
  onStepChange: (step: number) => void;
}

export function LaunchStepper({ currentStep, completedStep, onStepChange }: LaunchStepperProps) {
  return (
    <nav aria-label="Launch wizard" className="flex border-b border-border mb-6">
      {steps.map(({ label, step }) => {
        const isActive = step === currentStep;
        const isCompleted = step <= completedStep;
        // Can click: step 1 always, or any completed step, or the next step after completed
        const isClickable = step === 1 || step <= completedStep + 1;
        const isLocked = !isClickable;

        return (
          <button
            key={step}
            type="button"
            disabled={isLocked}
            onClick={() => isClickable && onStepChange(step)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
              isActive && "border-primary text-foreground",
              !isActive && isCompleted && "border-transparent text-foreground/70 hover:text-foreground hover:border-muted-foreground/40",
              !isActive && !isCompleted && isClickable && "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40",
              isLocked && "border-transparent text-muted-foreground/40 cursor-not-allowed"
            )}
          >
            {isCompleted && !isActive ? (
              <Check className="h-4 w-4 text-primary" />
            ) : isLocked ? (
              <Lock className="h-3.5 w-3.5" />
            ) : (
              <span className={cn(
                "flex items-center justify-center h-5 w-5 rounded-full text-xs border",
                isActive ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
              )}>
                {step}
              </span>
            )}
            {label}
          </button>
        );
      })}
    </nav>
  );
}
