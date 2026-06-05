import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Launch-ops KPI tile. Deliberately NOT a performance metric — this surface
 * tracks reliability/throughput (launched today, N=N integrity, headroom),
 * never ROAS.
 */
export function KpiTile({
  label,
  value,
  sub,
  icon,
  tone = "default",
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning" | "error";
  className?: string;
}) {
  const toneText =
    tone === "success"
      ? "text-[hsl(var(--success-text))]"
      : tone === "warning"
      ? "text-[hsl(var(--warning-text))]"
      : tone === "error"
      ? "text-[hsl(var(--error-text))]"
      : "text-foreground";

  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className={cn("mt-2 font-g6-sans text-2xl font-bold tabular-nums", toneText)}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
