import { useState, type ReactNode } from "react";
import { ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * OptionalFieldCollapse — wraps a conditionally-optional field.
 *
 * Per Maalik: "hide na karke collapse karna hai unko, aisa na ho ki kahi gayab hi ho
 * jaye ya user ko dhundhni pde, ya naye user ko mile na."
 *
 * Used when a field is technically not needed for the current mode/sub-method but
 * the user should still see it exists (so new users can discover it, and power users
 * can override the default if they want to fill it anyway).
 *
 * Renders:
 *  - Always-visible header row with label + reason chip + chevron
 *  - Body that's collapsed by default; click header to expand
 *  - When collapsed: body is hidden (display: none) but DOM-present; expand reveals it
 */
type Props = {
  /** Field label (e.g. "Source image") */
  label: string;
  /** Why this field is optional in the current context (e.g. "Not required for Brief-to-Ad sub-method") */
  reason: string;
  /** When true, render expanded by default. Defaults to false (collapsed). */
  defaultExpanded?: boolean;
  children: ReactNode;
};

export function OptionalFieldCollapse({
  label,
  reason,
  defaultExpanded = false,
  children,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="rounded-g6-base border border-dashed border-g6-border-secondary bg-g6-bg-container/40">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-g6-bg-spotlight"
      >
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-g6-text-tertiary transition-transform",
            expanded && "rotate-180"
          )}
        />
        <span className="text-g6-sm font-medium text-g6-text-secondary">{label}</span>
        <span className="inline-flex items-center gap-1 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-base px-2 py-0.5 font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
          <Info className="h-3 w-3" />
          optional
        </span>
        <span className="ml-auto truncate text-g6-xs text-g6-text-tertiary">
          {reason}
        </span>
      </button>
      {expanded && (
        <div className="border-t border-g6-border-secondary px-3 py-3">
          {children}
        </div>
      )}
    </div>
  );
}
