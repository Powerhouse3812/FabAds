/**
 * Launch Detail — shared presentational parts.
 *
 * Small, dumb building blocks so Launch2Detail stays readable. Everything here
 * leans on the FabFunnel status tokens + runViz so the reliability story
 * (failed ≠ launched) reads the same way it does on Home rows.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* Status fills (mirror runViz so Detail matches Home + Activity exactly). */
export const OK = "#52c41a";
export const WARN = "#faad14";
export const ERR = "#ff4d4f";

/** AA-safe text variants (see index.css Rule R2) for inline labels. */
export const OK_TEXT = "#237804";
export const ERR_TEXT = "#cf1322";
export const WARN_TEXT = "#874d00";

type Tone = "neutral" | "created" | "failed" | "pending";

/**
 * One reliability stat tile — requested / created / failed / pending.
 * The number is the hero (font-mono tabular-nums) so the four counts read as a
 * single reconciling row: created + failed + pending = requested.
 */
export function StatTile({
  label,
  value,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: number;
  tone?: Tone;
  hint?: string;
}) {
  const color =
    tone === "created"
      ? OK_TEXT
      : tone === "failed"
        ? ERR_TEXT
        : undefined; // neutral + pending use foreground/muted

  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-xl border bg-card px-3 py-2.5",
        tone === "failed" && value > 0 && "border-[color:rgba(255,77,79,0.35)]",
      )}
    >
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-xl font-semibold tabular-nums leading-none",
          tone === "pending" && "text-muted-foreground",
        )}
        style={color ? { color } : undefined}
      >
        {value}
      </span>
      {hint && <span className="text-[11px] leading-tight text-muted-foreground">{hint}</span>}
    </div>
  );
}

/** Inline status dot + label for a single ad unit (matches statusMeta palette). */
export function UnitStatusTag({ status }: { status: "pending" | "creating" | "created" | "failed" }) {
  const meta: Record<typeof status, { label: string; color: string; pulse?: boolean }> = {
    pending: { label: "Pending", color: "rgba(15,15,12,0.45)" },
    creating: { label: "Creating", color: "#5B7611", pulse: true },
    created: { label: "Created", color: OK },
    failed: { label: "Failed", color: ERR },
  };
  const m = meta[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: m.color }}>
      <span
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", m.pulse && "animate-pulse")}
        style={{ backgroundColor: m.color }}
      />
      {m.label}
    </span>
  );
}

/** "Retryable" / "Won't retry" pill shown on failed units. */
export function RetryableTag({ retryable }: { retryable: boolean }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={
        retryable
          ? { color: WARN_TEXT, backgroundColor: "rgba(250,173,20,0.16)" }
          : { color: ERR_TEXT, backgroundColor: "rgba(255,77,79,0.12)" }
      }
    >
      {retryable ? "Retryable" : "Won't retry"}
    </span>
  );
}

/**
 * Composed empty / not-found state — centered icon, title, copy, optional CTA.
 * Used for not-found runs and the empty activity feed.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="space-y-1">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
