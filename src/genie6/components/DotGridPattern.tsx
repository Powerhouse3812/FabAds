import { cn } from "@/lib/utils";

/**
 * Dot grid pattern at 6% opacity — only on hero / empty / new-user surfaces.
 * Renders as an absolute overlay; parent must be position: relative.
 */
export function DotGridPattern({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("g6-dot-grid pointer-events-none absolute inset-0", className)}
    />
  );
}
