import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Suno-style horizontal scroll strip — snap-to-card, no scrollbar.
 * Used by Home Recent generations + Library Recent row.
 */
export function HorizontalScrollStrip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "scrollbar-none flex w-full snap-x snap-mandatory gap-3 overflow-x-auto pb-1",
        className
      )}
    >
      {/* Each child should add `snap-start` and a fixed width */}
      {children}
    </div>
  );
}
