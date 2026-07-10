import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { SignupStep } from "@/pages/Auth";

const STEP_LABELS = ["Plan selection", "Profile setup"] as const;

/**
 * SignupPlanStepper — 2-step progress indicator for the plan-first signup
 * redesign (Figma "*Steps*" instance, node 10990:45313 / 10506:50339).
 * Reproduces the antd `<Steps>` numbered-dot style referenced in the
 * component's Figma documentation link: a filled dark circle with the step
 * number, a checkmark once that step is passed, a solid connecting line up
 * to the current step, and grey for anything still upcoming.
 */
export function SignupPlanStepper({ current }: { current: SignupStep }) {
  return (
    <div className="flex w-full items-start" role="list" aria-label="Sign up progress">
      {STEP_LABELS.map((label, index) => {
        const step = (index + 1) as SignupStep;
        const done = step < current;
        const active = step === current;
        const isFirst = index === 0;
        const isLast = index === STEP_LABELS.length - 1;
        const lineReached = !isLast && current > step;

        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-2" role="listitem">
            <div className="flex w-full items-center">
              <div
                className={cn(
                  "h-0.5 flex-1",
                  isFirst ? "invisible" : done || active ? "bg-foreground" : "bg-border",
                )}
              />
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-medium",
                  done || active ? "bg-foreground text-background" : "bg-border text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3 w-3" /> : step}
              </span>
              <div className={cn("h-0.5 flex-1", isLast ? "invisible" : lineReached ? "bg-foreground" : "bg-border")} />
            </div>
            <span
              className={cn("text-sm text-foreground", active && "font-semibold")}
              aria-current={active ? "step" : undefined}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
