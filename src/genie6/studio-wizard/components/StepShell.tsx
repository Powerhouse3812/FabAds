import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * StepShell — wrapper for each wizard step body.
 *
 * Centers content with a max width and consistent padding so each step
 * feels like a focused single-question screen. Optional `footer` slot
 * replaces the wizard's default Back / Next chrome — used by Step 4
 * which switches to the PromptBar-style Generate footer.
 */

export interface StepShellProps {
  children: ReactNode;
  className?: string;
}

export function StepShell({ children, className }: StepShellProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div
        className={cn(
          "mx-auto w-full max-w-2xl px-6 py-6 sm:px-8",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
