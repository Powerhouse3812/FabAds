import { Check, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * StatusReadout — small mono-cased pill row showing form readiness.
 *
 * Used in the FormSkeleton header `status` slot. Each item shows a state
 * dot/icon + label. States:
 *   - "ok"      → green check, value present
 *   - "missing" → muted alert, value not yet picked
 *   - "info"    → neutral, just informational (count, format choice)
 */

export type StatusState = "ok" | "missing" | "info";

export interface StatusItem {
  label: string;
  state: StatusState;
}

export function StatusReadout({ items }: { items: StatusItem[] }) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 shrink-0">
        Ready when
      </span>
      {items.map((it, i) => (
        <Pill key={i} item={it} />
      ))}
    </div>
  );
}

function Pill({ item }: { item: StatusItem }) {
  const Icon =
    item.state === "ok" ? Check :
    item.state === "missing" ? AlertCircle :
    Info;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-mono",
        item.state === "ok" && "bg-primary/10 text-foreground border border-primary/20",
        item.state === "missing" && "bg-muted text-muted-foreground border border-border",
        item.state === "info" && "bg-muted/40 text-muted-foreground border border-border/40",
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {item.label}
    </span>
  );
}
