import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Hint } from "./Hint";

export interface DisabledSectionProps {
  title: string;
  /** Why there is no data. Shown inline AND as a tooltip (tooltips alone are invisible to touch users). */
  reason: string;
  /** Optional ghost content (e.g. a placeholder chart). Rendered dimmed and inert. */
  children?: ReactNode;
  /** Keeps the frame height stable so layouts don't jump (px). */
  minHeight?: number;
  className?: string;
}

/** Same frame as a normal section, dimmed, with the reason. Missing data never collapses a layout. */
export function DisabledSection({ title, reason, children, minHeight = 120, className }: DisabledSectionProps) {
  return (
    <Hint content={reason}>
      <section
        aria-disabled="true"
        aria-label={`${title} (unavailable): ${reason}`}
        tabIndex={0}
        style={{ minHeight }}
        className={cn(
          "flex flex-col rounded-xl border border-dashed border-border bg-muted/40 p-4",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        <header className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <h3 className="min-w-0 truncate text-sm font-semibold text-muted-foreground">{title}</h3>
        </header>
        {children ? (
          <div aria-hidden="true" className="pointer-events-none mt-3 select-none opacity-40">
            {children}
          </div>
        ) : null}
        <p className="mt-auto pt-3 text-xs text-muted-foreground">{reason}</p>
      </section>
    </Hint>
  );
}
