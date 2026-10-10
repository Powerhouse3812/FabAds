import type { Kpi } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import { Hint, InfoGlyph } from "./Hint";
import { TruncatedText } from "./TruncatedText";

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

/** "800", "97 days", "47% video", "—" are numeric; "Personal story" is a name and gets prose styling. */
function isNumericDisplay(display: string): boolean {
  return /^[\d—+−-]/.test(display.trim());
}

function KpiTile({ kpi, dense }: { kpi: Kpi; dense?: boolean }) {
  const disabled = !!kpi.disabledReason;
  const numeric = disabled || isNumericDisplay(kpi.display);
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
      <div className="flex items-start gap-1 text-xs text-muted-foreground">
        {/* Wraps to 2 lines before it clips; tooltip carries the full text when it still does. */}
        <TruncatedText text={kpi.label} lines={2} className="flex-1 leading-4" focusable={!disabled} />
        {!disabled && <InfoGlyph tip={kpi.tooltip} className="mt-0.5" />}
      </div>
      {numeric ? (
        <TruncatedText
          text={disabled ? "—" : kpi.display}
          focusable={!disabled}
          className={cn(
            "mt-0.5 font-mono font-semibold tabular-nums",
            dense ? "text-lg leading-6" : "text-2xl leading-8",
            disabled ? "text-muted-foreground" : "text-foreground",
          )}
        />
      ) : (
        // A name, not a number: smaller, wraps to two lines, never "Persona…".
        <TruncatedText
          text={kpi.display}
          lines={2}
          focusable
          className={cn("mt-1 font-semibold text-foreground", dense ? "text-sm leading-5" : "text-base leading-5")}
        />
      )}
      {!dense && (
        <div className="mt-0.5 min-h-[16px] text-xs">
          {disabled ? (
            <span className="text-muted-foreground">Unavailable</span>
          ) : kpi.sub ? (
            <TruncatedText text={kpi.sub} lines={2} className={cn("leading-4", subTone(kpi.sub))} />
          ) : null}
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
