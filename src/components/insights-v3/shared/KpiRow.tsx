import type { Kpi } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import { Hint, InfoGlyph } from "./Hint";

export interface KpiRowProps {
  kpis: Kpi[];
  /** Collapsed-overview look: shorter tiles, no sub line. */
  dense?: boolean;
  className?: string;
  "aria-label"?: string;
}

function subTone(sub: string): string {
  const s = sub.trim();
  if (/^\+/.test(s)) return "text-success-text";
  if (/^[-−]/.test(s)) return "text-error-text";
  return "text-muted-foreground";
}

function KpiTile({ kpi, dense }: { kpi: Kpi; dense?: boolean }) {
  const disabled = !!kpi.disabledReason;
  const tile = (
    <div
      role="group"
      aria-label={`${kpi.label}: ${disabled ? "unavailable" : kpi.display}`}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? 0 : undefined}
      className={cn(
        "min-w-0 rounded-lg border bg-card px-3 shadow-sm",
        dense ? "py-2" : "py-3",
        disabled
          ? "border-dashed border-border bg-muted/40 opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          : "border-border border-t-2 border-t-primary/70",
      )}
    >
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span className="min-w-0 truncate">{kpi.label}</span>
        {!disabled && <InfoGlyph tip={kpi.tooltip} />}
      </div>
      <div
        className={cn(
          "mt-0.5 truncate font-mono font-semibold tabular-nums",
          dense ? "text-lg leading-6" : "text-2xl leading-8",
          disabled ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {disabled ? "—" : kpi.display}
      </div>
      {!dense && (
        <div className={cn("mt-0.5 min-h-[16px] truncate text-xs", kpi.sub && !disabled ? subTone(kpi.sub) : "")}>
          {disabled ? <span className="text-muted-foreground">Unavailable</span> : kpi.sub}
        </div>
      )}
    </div>
  );
  return disabled ? <Hint content={kpi.disabledReason}>{tile}</Hint> : tile;
}

/** Responsive KPI strip. Tiles wrap; no horizontal scroll down to 360px. */
export function KpiRow({ kpis, dense, className, ...rest }: KpiRowProps) {
  return (
    <div
      role="list"
      aria-label={rest["aria-label"] ?? "Key metrics"}
      className={cn(
        "grid gap-2",
        dense
          ? "grid-cols-[repeat(auto-fit,minmax(120px,1fr))]"
          : "grid-cols-[repeat(auto-fit,minmax(148px,1fr))]",
        className,
      )}
    >
      {kpis.map((k) => (
        <div role="listitem" key={k.key} className="min-w-0">
          <KpiTile kpi={k} dense={dense} />
        </div>
      ))}
    </div>
  );
}
