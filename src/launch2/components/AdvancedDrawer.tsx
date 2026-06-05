import { useState, type ReactNode } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Progressive disclosure: every guided field has an Advanced override one tap
 * away. Guided = this drawer collapsed. Custom-for-all, no entry gate.
 */
export function AdvancedDrawer({
  label = "Advanced",
  hint,
  children,
  defaultOpen = false,
  className,
}: {
  label?: string;
  hint?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("rounded-lg border border-border bg-card/40", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">· {hint}</span>}
        <ChevronDown className={cn("ml-auto h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="space-y-4 border-t border-border px-3 py-3">{children}</div>}
    </div>
  );
}
