import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * RightRail — Studio v4 persistent right-side column on Step 4 (A-12.4 refactor).
 *
 * History:
 *   - A-12.1 → A-12.3: viewport overlay drawer (`fixed right-0 z-50 shadow-2xl`)
 *     with backdrop click + Esc close. Mounted by PromptReferenceBar for heavy
 *     attach sources (Library / Pinterest / Brand-WA / Product-WA).
 *   - A-12.4: refactored to a permanent sibling column inside Step 4's layout.
 *     Always visible (≥lg breakpoints). Content swaps via the `railMode` state
 *     held by Step4Configure. Pure slot host — no open/onClose props.
 *
 * Phot.ai pattern: rail is part of the form chrome, not a popped-out drawer.
 * Reads as one continuous surface with the form column.
 */

interface RightRailProps {
  children: ReactNode;
  className?: string;
}

export function RightRail({ children, className }: RightRailProps) {
  return (
    <aside
      className={cn(
        "hidden shrink-0 w-[400px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:flex",
        className,
      )}
    >
      {children}
    </aside>
  );
}
