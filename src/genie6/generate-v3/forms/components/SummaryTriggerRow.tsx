import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SummaryTriggerRow — A-11.24.
 *
 * Compact summary row for picker fields whose full UI lives in the side
 * drawer (Audience / Angle / Concepts). Shows up to 3 selected pills + a
 * `+N more` overflow + an `Edit →` button on the right.
 *
 * Active state when this row's drawer is open — `Edit →` becomes `Editing`
 * with a lime fill, and the row border tints lime.
 */

export interface SummaryTriggerRowProps {
  /** Selected pill labels — first 3 are rendered, rest collapse to +N. */
  pills: string[];
  /** Click handler — opens the drawer for this picker. */
  onClick: () => void;
  /** True when this picker's drawer is currently open. */
  active: boolean;
  /** Italic placeholder when `pills` is empty. e.g. "Pick audiences →". */
  emptyHint: string;
}

export function SummaryTriggerRow({
  pills,
  onClick,
  active,
  emptyHint,
}: SummaryTriggerRowProps) {
  const visible = pills.slice(0, 3);
  const overflow = pills.length - visible.length;
  const empty = pills.length === 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "w-full flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors",
        "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
        active
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/40",
      )}
    >
      <div className="min-w-0 flex-1 flex items-center gap-1.5 flex-wrap">
        {empty ? (
          <span className="text-[11px] text-muted-foreground italic">
            {emptyHint}
          </span>
        ) : (
          <>
            {visible.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-foreground"
              >
                <span className="h-1 w-1 rounded-full bg-primary" />
                <span className="max-w-[120px] truncate">{p}</span>
              </span>
            ))}
            {overflow > 0 && (
              <span className="font-mono text-[10px] text-muted-foreground">
                +{overflow} more
              </span>
            )}
          </>
        )}
      </div>
      <span
        className={cn(
          "shrink-0 inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground",
        )}
      >
        {active ? "Editing" : "Edit"}
        <ChevronRight className="h-3 w-3" />
      </span>
    </button>
  );
}
