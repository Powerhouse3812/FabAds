/**
 * MetricStat — a label + value with an optional delta and confidence chip.
 * Centralises the "never a bare dash" rule: a missing value is either
 * "N/A — no video" (image ads) or "Not enough data yet (n=…)" (low volume),
 * chosen by the caller — never an ambiguous "–".
 */
import { cn } from "@/lib/utils";
import { fmtDelta } from "@/creative-report/lib/format";

export interface MetricStatProps {
  label: string;
  /** The formatted value, or null when unavailable (then `naReason` shows). */
  value: string | null;
  /** Why the value is missing — required when value is null. */
  naReason?: string;
  /** Signed % delta vs compare period; null hides it. */
  deltaPct?: number | null;
  /** Whether an increase is good (drives delta colour). Default true. */
  higherIsBetter?: boolean;
  align?: "left" | "right";
  className?: string;
  size?: "sm" | "md";
}

export function MetricStat({
  label,
  value,
  naReason,
  deltaPct = null,
  higherIsBetter = true,
  align = "left",
  className,
  size = "md",
}: MetricStatProps) {
  const delta = fmtDelta(deltaPct);
  const deltaGood =
    delta.tone === "flat"
      ? "muted"
      : (delta.tone === "up") === higherIsBetter
        ? "good"
        : "bad";

  return (
    <div className={cn("flex flex-col gap-0.5", align === "right" && "items-end", className)}>
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {value !== null ? (
        <div className={cn("flex items-baseline gap-1.5", align === "right" && "flex-row-reverse")}>
          <span className={cn("font-semibold tabular-nums text-foreground", size === "md" ? "text-lg" : "text-sm")}>
            {value}
          </span>
          {deltaPct !== null && (
            <span
              className={cn(
                "text-xs font-medium tabular-nums",
                deltaGood === "good" && "text-primary-text",
                deltaGood === "bad" && "text-destructive",
                deltaGood === "muted" && "text-muted-foreground",
              )}
            >
              {delta.label}
            </span>
          )}
        </div>
      ) : (
        <span className="text-xs italic text-muted-foreground">{naReason ?? "No data"}</span>
      )}
    </div>
  );
}
