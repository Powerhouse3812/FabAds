import { Clock, Loader2, CheckCircle2, AlertTriangle, XCircle, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BatchStatus } from "@/genie6/lib/genieRunTypes";

interface QueueStatusPillProps {
  status: BatchStatus;
  size?: "sm" | "md";
}

/**
 * QueueStatusPill — small status chip used on each queue card / list row.
 *
 * Retyped onto the real run store's `BatchStatus` (genieRunTypes.ts) —
 * "running" / "done" / "partial" / "failed" / "cancelled" — so the same five
 * states genieRunStore computes via `batchStatus()` are the only ones this
 * pill can ever be asked to render. "Partial" (§21.3's `19/20`) and
 * "cancelled" (§21.3's missing in-flight states) didn't exist on the old
 * QueueStatus enum this component used before.
 *
 * Visual states are co-encoded (icon + label + color) to satisfy the
 * design-system rule against color-only state encoding.
 */
const STATUS_CONFIG: Record<
  BatchStatus,
  {
    label: string;
    Icon: typeof Clock;
    iconClass: string;
    pillClass: string;
    animate?: boolean;
  }
> = {
  running: {
    label: "Generating",
    Icon: Loader2,
    iconClass: "text-primary",
    pillClass: "bg-primary/10 text-foreground border-primary/30",
    animate: true,
  },
  done: {
    label: "Done",
    Icon: CheckCircle2,
    iconClass: "text-primary",
    pillClass: "bg-primary/10 text-foreground border-primary/30",
  },
  partial: {
    label: "Partial",
    Icon: AlertTriangle,
    iconClass: "text-warning-text",
    pillClass: "bg-warning-text/10 text-warning-text border-warning-text/30",
  },
  failed: {
    label: "Failed",
    Icon: XCircle,
    iconClass: "text-destructive",
    pillClass: "bg-destructive/10 text-destructive border-destructive/30",
  },
  cancelled: {
    label: "Cancelled",
    Icon: Ban,
    iconClass: "text-muted-foreground",
    pillClass: "bg-muted/60 text-muted-foreground border-border/60",
  },
};

export function QueueStatusPill({ status, size = "sm" }: QueueStatusPillProps) {
  const c = STATUS_CONFIG[status];
  const Icon = c.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-mono uppercase tracking-wider",
        size === "sm"
          ? "px-1.5 py-0.5 text-[9px]"
          : "px-2 py-0.5 text-[10px]",
        c.pillClass,
      )}
    >
      <Icon
        className={cn(
          size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3",
          c.iconClass,
          c.animate && "animate-spin",
        )}
      />
      <span>{c.label}</span>
    </span>
  );
}
