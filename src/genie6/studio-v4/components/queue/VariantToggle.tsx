import { cn } from "@/lib/utils";

export type QueueVariant = "v1" | "v2";

interface VariantToggleProps {
  active: QueueVariant;
  onSwitch: () => void;
}

/**
 * VariantToggle — pill switch between V1 (dense) and V2 (centered) queue
 * layouts. Mirrors the design-pattern used in the Library's drawer A/B
 * toggle. Caller controls visibility — render this ONLY in development
 * (`import.meta.env.DEV`) so production users never see the indecision.
 */
export function VariantToggle({ active, onSwitch }: VariantToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Queue layout variant"
      className="inline-flex items-center gap-0.5 rounded-full border border-border bg-muted/40 p-0.5"
    >
      <button
        type="button"
        onClick={active === "v1" ? undefined : onSwitch}
        aria-pressed={active === "v1"}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
          active === "v1"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        V1 · Dense
      </button>
      <button
        type="button"
        onClick={active === "v2" ? undefined : onSwitch}
        aria-pressed={active === "v2"}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
          active === "v2"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        V2 · Centered
      </button>
    </div>
  );
}
