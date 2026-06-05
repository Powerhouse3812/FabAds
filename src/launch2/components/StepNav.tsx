import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepDef {
  step: number;
  label: string;
  sub?: string;
}

export const FLOW_STEPS: StepDef[] = [
  { step: 2, label: "Account + Distribution", sub: "Where + how to spread" },
  { step: 3, label: "Objective + Targeting", sub: "What for + audience" },
  { step: 4, label: "Creative + Structure", sub: "Assets + structure" },
  { step: 5, label: "Preview + Review", sub: "Verify + launch" },
];

/** Horizontal stepper for the guided flow (steps 2–5). */
export function StepNav({
  current,
  maxReached,
  onStep,
  className,
}: {
  current: number;
  maxReached: number;
  onStep?: (step: number) => void;
  className?: string;
}) {
  return (
    <nav className={cn("flex items-center gap-1", className)}>
      {FLOW_STEPS.map((s, i) => {
        const done = s.step < current;
        const active = s.step === current;
        const reachable = s.step <= maxReached;
        return (
          <div key={s.step} className="flex items-center gap-1">
            <button
              type="button"
              disabled={!reachable}
              onClick={() => reachable && onStep?.(s.step)}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors",
                active && "bg-muted",
                reachable ? "cursor-pointer hover:bg-muted/60" : "cursor-not-allowed opacity-50"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                  done && "bg-[#52c41a] text-white",
                  active && "bg-primary text-primary-foreground",
                  !done && !active && "border border-border bg-card text-muted-foreground"
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="hidden sm:block">
                <span className={cn("block text-xs font-medium", active ? "text-foreground" : "text-muted-foreground")}>
                  {s.label}
                </span>
              </span>
            </button>
            {i < FLOW_STEPS.length - 1 && <span className="h-px w-4 bg-border" />}
          </div>
        );
      })}
    </nav>
  );
}
