import { Clock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QueueStatus } from "../../types/queue";

interface QueueStatusPillProps {
  status: QueueStatus;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<
  QueueStatus,
  {
    label: string;
    Icon: typeof Clock;
    iconClass: string;
    pillClass: string;
    animate?: boolean;
  }
> = {
  queued: {
    label: "Queued",
    Icon: Clock,
    iconClass: "text-muted-foreground",
    pillClass: "bg-muted/60 text-muted-foreground border-border/60",
  },
  generating: {
    label: "Generating",
    Icon: Loader2,
    iconClass: "text-primary",
    pillClass: "bg-primary/10 text-foreground border-primary/30",
    animate: true,
  },
  ready: {
    label: "Ready",
    Icon: CheckCircle2,
    iconClass: "text-primary",
    pillClass: "bg-primary/10 text-foreground border-primary/30",
  },
  failed: {
    label: "Failed",
    Icon: AlertCircle,
    iconClass: "text-destructive",
    pillClass: "bg-destructive/10 text-destructive border-destructive/30",
  },
};

/**
 * QueueStatusPill — small status chip used on each queue card.
 *
 * Visual states are co-encoded (icon + label + color) to satisfy the
 * design-system rule against color-only state encoding. The `generating`
 * variant spins the Loader2 icon so live batches read as "alive" without
 * resorting to a global toast.
 */
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
