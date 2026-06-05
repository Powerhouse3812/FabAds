import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Horizontal scrolling shelf (Winners / Strategy quick-start / Drafts). */
export function Shelf({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]", className)}>
      {children}
    </div>
  );
}
