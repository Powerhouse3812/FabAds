import { cn } from "@/lib/utils";
import type { HealthStatus } from "../types";

const META: Record<HealthStatus, { label: string; dot: string; text: string }> = {
  healthy: { label: "Healthy", dot: "bg-[#52c41a]", text: "text-[hsl(var(--success-text))]" },
  review: { label: "In review", dot: "bg-[#faad14]", text: "text-[hsl(var(--warning-text))]" },
  restricted: { label: "Restricted", dot: "bg-[#ff4d4f]", text: "text-[hsl(var(--error-text))]" },
};

export function HealthDot({
  status,
  showLabel = false,
  className,
}: {
  status: HealthStatus;
  showLabel?: boolean;
  className?: string;
}) {
  const m = META[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("h-2 w-2 rounded-full", m.dot)} />
      {showLabel && <span className={cn("text-xs font-medium", m.text)}>{m.label}</span>}
    </span>
  );
}
