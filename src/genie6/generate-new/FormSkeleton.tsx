import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * FormSkeleton — chassis for every New Studio Type form (A-11.3).
 *
 * Per Form Specs §0.3 — universal layout:
 *
 *   ┌─ Top sticky zone ──────────────────────────────────┐
 *   │   Required pickers · Output chip · Format toggle   │
 *   │   · mode-specific top toggles                      │
 *   └────────────────────────────────────────────────────┘
 *   ┌─ Form body (scrollable) ──────────────────────────┐
 *   │   Saved Templates strip                           │
 *   │   Video Production section (when Output=Video)    │
 *   │   mode-specific strips                            │
 *   │   References section                              │
 *   │   Advanced drawer (collapsed by default)          │
 *   │   AI Suggestions drawer (collapsible)             │
 *   └────────────────────────────────────────────────────┘
 *   ┌─ Floating PromptBar (sticky bottom) ──────────────┐
 *   │   ghost suggestions · textarea · refs · model ·   │
 *   │   count · cost · Generate                         │
 *   └────────────────────────────────────────────────────┘
 *
 * Each Type form composes its own top sticky zone + body content + PromptBar
 * by passing them as slot children. Skeleton handles the layout, scroll
 * containers, and density consistently across all 4 routes.
 */

export interface FormSkeletonProps {
  /** Top sticky zone — required pickers, output chip, format toggle, etc. */
  top: ReactNode;
  /** Scrollable form body — strips, sections, drawers. */
  body: ReactNode;
  /** Floating bottom prompt bar (typically <PromptBar /> from src/components/PromptBar). */
  promptBar: ReactNode;
  /** Optional className for outer container customization. */
  className?: string;
}

export function FormSkeleton({ top, body, promptBar, className }: FormSkeletonProps) {
  return (
    <div className={cn("flex h-full flex-col bg-background", className)}>
      {/* Top sticky zone — never scrolls */}
      <header
        className={cn(
          "shrink-0 border-b border-border bg-card",
          "px-4 py-3 sm:px-5",
        )}
      >
        {top}
      </header>

      {/* Form body — scrolls between top + bottom bars */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-5 sm:py-5 space-y-5">
          {body}
        </div>
      </main>

      {/* Floating PromptBar — sticky bottom, full-width within shell */}
      <div className="shrink-0 border-t border-border bg-card">
        {promptBar}
      </div>
    </div>
  );
}
