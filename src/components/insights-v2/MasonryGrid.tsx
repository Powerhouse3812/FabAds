import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MasonryGridProps {
  children: ReactNode;
  gridSize?: 2 | 3 | 4 | 5;
  className?: string;
}

export function MasonryGrid({ children, gridSize = 5, className }: MasonryGridProps) {
  return (
    <div
      role="list"
      className={cn(
        "gap-4 [&>*]:break-inside-avoid [&>*]:mb-4",
        gridSize === 2 && "columns-1 sm:columns-1 md:columns-2",
        gridSize === 3 && "columns-1 sm:columns-2 md:columns-2 lg:columns-3",
        gridSize === 4 && "columns-1 sm:columns-2 md:columns-3 lg:columns-3 xl:columns-4",
        gridSize === 5 && "columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-4 2xl:columns-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
