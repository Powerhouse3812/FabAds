import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDemoData } from "../hooks/useDemoData";

/**
 * Demo-data toggle. Appears in Assets headers (and possibly elsewhere) so the
 * user can switch between curated demo data and the empty / first-time state
 * during demos. Persisted to localStorage via the useDemoData store.
 */
export function DemoDataToggle({ size = "md" }: { size?: "sm" | "md" }) {
  const { on, toggle } = useDemoData();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={toggle}
      title={on ? "Demo data ON — click to clear" : "Demo data OFF — click to fill"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-g6-pill border transition-colors",
        size === "sm" ? "px-2 py-0.5 text-g6-xs" : "px-2.5 py-1 text-g6-xs",
        on
          ? "border-g6-primary-border bg-g6-primary-bg text-g6-text"
          : "border-g6-border-secondary bg-g6-bg-container text-g6-text-tertiary hover:text-g6-text"
      )}
    >
      <Sparkles className={cn(size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3", on ? "text-g6-primary" : "text-g6-text-tertiary")} />
      <span className="font-g6-mono uppercase tracking-wider font-medium">demo data</span>
      <span className={cn(
        "inline-flex h-3.5 w-7 items-center rounded-full transition-colors p-0.5",
        on ? "bg-g6-primary" : "bg-g6-bg-spotlight"
      )}>
        <span className={cn(
          "h-2.5 w-2.5 rounded-full bg-white shadow-sm transition-transform",
          on && "translate-x-3.5"
        )} />
      </span>
    </button>
  );
}
