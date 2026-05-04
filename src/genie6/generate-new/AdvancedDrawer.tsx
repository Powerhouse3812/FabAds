import { useState, type ReactNode } from "react";
import { ChevronDown, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AdvancedDrawer — collapsible block for Advanced fields (A-11.3).
 *
 * Per Form Specs §0.4: "Same form. Advanced drawer collapsed by default =
 * Quick. Expanded = Advanced. No persona-split surface."
 *
 * Renders a header row (label + chevron) and reveals children when open.
 * Default = collapsed.
 */

export interface AdvancedDrawerProps {
  /** Optional override label. Default: "Advanced settings" */
  label?: string;
  /** Optional initial-open state. Default: false (Quick mode) */
  defaultOpen?: boolean;
  /** Optional small badge (e.g. count of changed fields) */
  badge?: ReactNode;
  /** Body content (the actual Advanced fields) */
  children: ReactNode;
}

export function AdvancedDrawer({
  label = "Advanced settings",
  defaultOpen = false,
  badge,
  children,
}: AdvancedDrawerProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-md border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="advanced-drawer-body"
        className={cn(
          "flex w-full items-center gap-2 px-3.5 py-2.5",
          "text-left transition-colors",
          "hover:bg-muted/40",
          "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-md",
        )}
      >
        <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-foreground">{label}</span>
        {badge}
        <ChevronDown
          className={cn(
            "ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div
          id="advanced-drawer-body"
          className="border-t border-border px-3.5 py-3 space-y-3"
        >
          {children}
        </div>
      )}
    </section>
  );
}
