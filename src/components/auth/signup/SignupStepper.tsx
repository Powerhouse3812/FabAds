import { cn } from "@/lib/utils";
import type { SignupStep } from "@/pages/Auth";

const STEP_LABELS = ["Set Profile", "Assemble Agency", "Invite Members"] as const;

/**
 * SignupStepper — the 3-dot progress indicator at the top of every wizard
 * step (Figma "*Steps*" instance, e.g. node 9431:54696). Reproduces the
 * antd `<Steps progressDot>` pattern referenced in the component's Figma
 * documentation link, but hand-rolled since this project doesn't use antd.
 *
 * Pixel-checked against the three Figma screenshots: the dot AND its
 * outgoing tail are dark for every step up to and including the current
 * one; only strictly-upcoming steps stay grey. Labels stay the same dark
 * color regardless of state — only dot/tail color encodes progress.
 */
export function SignupStepper({ current }: { current: SignupStep }) {
  const currentIndex = current - 1;
  const reached = (i: number) => i <= currentIndex;

  return (
    <div className="flex w-full items-start" role="list" aria-label="Sign up progress">
      {STEP_LABELS.map((label, index) => {
        const isFirst = index === 0;
        const isLast = index === STEP_LABELS.length - 1;
        // Both halves of a given connecting segment must resolve to the same
        // color, so the left half of step i mirrors the right half of step
        // i-1 (both keyed off reached(i - 1)) — see component doc above.
        const leftReached = isFirst ? false : reached(index - 1);
        const rightReached = isLast ? false : reached(index);

        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-2" role="listitem">
            <div className="flex w-full items-center">
              <div className={cn("h-0.5 flex-1", isFirst ? "invisible" : leftReached ? "bg-foreground" : "bg-border")} />
              <span
                aria-hidden="true"
                className={cn("size-2 shrink-0 rounded-full", reached(index) ? "bg-foreground" : "bg-border")}
              />
              <div className={cn("h-0.5 flex-1", isLast ? "invisible" : rightReached ? "bg-foreground" : "bg-border")} />
            </div>
            <span
              className={cn("text-sm text-foreground", index === currentIndex && "font-medium")}
              aria-current={index === currentIndex ? "step" : undefined}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
