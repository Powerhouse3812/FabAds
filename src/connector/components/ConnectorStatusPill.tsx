import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Ban,
  EyeOff,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConnectionHealth } from "../model";

/**
 * Status label strings — exported for use in other surfaces that need
 * the bare string without rendering the pill.
 */
export const HEALTH_LABEL: Record<ConnectionHealth, string> = {
  active: "Active",
  pending: "Waiting to connect",
  expired: "Token expired",
  over_limit: "Limit reached",
  needs_attention: "Needs attention",
  no_access: "No access",
  revoked: "Revoked",
};

/**
 * Health config — icon, label, styling. Used to build the lookup so
 * a single loop never needs a ternary or switch.
 */
const HEALTH_CONFIG: Record<
  ConnectionHealth,
  {
    Icon: typeof CheckCircle2;
    iconClass: string;
    pillClass: string;
  }
> = {
  active: {
    Icon: CheckCircle2,
    iconClass: "text-success-text",
    pillClass: "text-success-text bg-success-text/10 border-success-text/25",
  },
  pending: {
    Icon: Clock,
    iconClass: "text-warning-text",
    pillClass: "text-warning-text bg-warning-text/10 border-warning-text/25",
  },
  expired: {
    Icon: AlertTriangle,
    iconClass: "text-warning-text",
    pillClass: "text-warning-text bg-warning-text/10 border-warning-text/25",
  },
  over_limit: {
    Icon: Ban,
    iconClass: "text-error-text",
    pillClass: "text-error-text bg-error-text/10 border-error-text/25",
  },
  needs_attention: {
    Icon: AlertTriangle,
    iconClass: "text-warning-text",
    pillClass: "text-warning-text bg-warning-text/10 border-warning-text/25",
  },
  no_access: {
    Icon: EyeOff,
    iconClass: "text-muted-foreground",
    pillClass: "text-muted-foreground bg-muted border-border",
  },
  revoked: {
    Icon: XCircle,
    iconClass: "text-muted-foreground",
    pillClass: "text-muted-foreground bg-muted border-border",
  },
};

interface ConnectorStatusPillProps {
  health: ConnectionHealth;
  className?: string;
}

/**
 * ConnectorStatusPill — small status indicator for a connection.
 *
 * Visual states are co-encoded (icon + label + colour) to satisfy the
 * design-system rule against colour-only state encoding. Never renders
 * colour alone.
 */
export function ConnectorStatusPill({
  health,
  className,
}: ConnectorStatusPillProps) {
  const config = HEALTH_CONFIG[health];
  const Icon = config.Icon;
  const label = HEALTH_LABEL[health];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        config.pillClass,
        className,
      )}
    >
      <Icon className={cn("h-3 w-3", config.iconClass)} />
      <span>{label}</span>
    </span>
  );
}
