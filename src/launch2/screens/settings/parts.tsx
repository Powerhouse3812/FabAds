/**
 * Shared presentational bits for the Account-Health + Settings surfaces.
 *
 * Pure presentation, no service/state logic. Status fills reuse the FabFunnel
 * status tokens exactly as runViz.tsx / flow/parts.tsx do (success / warning /
 * error). Account-status (active / restricted / disabled) is distinct from
 * run-status, so it gets its own small badge here instead of reusing StatusPill.
 */
import type { ReactNode } from "react";
import { CheckCircle2, AlertTriangle, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AccountStatus } from "../../types";
import { MAX_ADS_PER_PAGE } from "../../types";

/* FabFunnel status tokens (match runViz.tsx). */
export const OK = "#52c41a";
export const WARN = "#faad14";
export const ERR = "#ff4d4f";
/* Text-safe status variants (match flow/parts.tsx — base fills fail AA as text). */
export const OK_TEXT = "#237804";
export const WARN_TEXT = "#874d00";
export const ERR_TEXT = "#cf1322";

/** Near-cap warn threshold (≥200) and the hard cap (=250). */
export const NEAR_CAP = 200;
export const AT_CAP = MAX_ADS_PER_PAGE;

/** Capacity tier for a page given its active-ad count. */
export type CapTier = "healthy" | "near" | "full";
export function capTier(activeAds: number, capacity: number = AT_CAP): CapTier {
  if (activeAds >= capacity) return "full";
  if (activeAds >= NEAR_CAP) return "near";
  return "healthy";
}

/**
 * Account-status badge. active = success, restricted = warning, disabled =
 * error. Mono uppercase pill per the design system, tinted fill + text-safe
 * colour.
 */
export function AccountStatusBadge({
  status,
  className,
}: {
  status: AccountStatus;
  className?: string;
}) {
  const meta: Record<AccountStatus, { label: string; text: string; bg: string; Icon: typeof CheckCircle2 }> = {
    active: { label: "Active", text: OK_TEXT, bg: "rgba(82,196,26,0.12)", Icon: CheckCircle2 },
    restricted: { label: "Restricted", text: WARN_TEXT, bg: "rgba(250,173,20,0.14)", Icon: AlertTriangle },
    disabled: { label: "Disabled", text: ERR_TEXT, bg: "rgba(255,77,79,0.12)", Icon: Ban },
  };
  const m = meta[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.06em]",
        className,
      )}
      style={{ color: m.text, backgroundColor: m.bg }}
    >
      <m.Icon className="h-3 w-3" />
      {m.label}
    </span>
  );
}

/**
 * Cap meter — the core Account-Health signal. Shows activeAds / capacity as a
 * filled bar with the headroom number. Colours near-cap (warn ≥200) and at-cap
 * (error =250); healthy stays lime. NO performance metrics — capacity only.
 */
export function CapMeter({
  activeAds,
  capacity = AT_CAP,
  className,
}: {
  activeAds: number;
  capacity?: number;
  className?: string;
}) {
  const tier = capTier(activeAds, capacity);
  const pct = Math.min(100, Math.round((activeAds / Math.max(capacity, 1)) * 100));
  const headroom = Math.max(0, capacity - activeAds);

  const fill = tier === "full" ? ERR : tier === "near" ? WARN : "#8FB821";
  const headroomColor = tier === "full" ? ERR_TEXT : tier === "near" ? WARN_TEXT : undefined;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-xs tabular-nums text-foreground">
          {activeAds.toLocaleString("en-IN")}
          <span className="text-foreground/40"> / {capacity.toLocaleString("en-IN")}</span>
        </span>
        <span
          className="font-mono text-[11px] tabular-nums"
          style={{ color: headroomColor }}
          title="Free ad slots before the 250 active-ad cap"
        >
          {tier === "full" ? "at cap" : `${headroom.toLocaleString("en-IN")} free`}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-foreground/[0.06]"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={activeAds}
        aria-label={`${activeAds} of ${capacity} active ads`}
      >
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: fill }} />
      </div>
    </div>
  );
}

/** Lime bar + uppercase tracking label heading a card section (matches flow). */
export function SectionLabel({
  children,
  trailing,
  className,
}: {
  children: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center gap-2", className)}>
      <span className="h-3 w-[3px] shrink-0 rounded-full bg-primary" aria-hidden />
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{children}</span>
      {trailing}
    </div>
  );
}

/** Summary stat tile — big mono number + label, for the Health summary row. */
export function StatTile({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: number;
  tone?: "warn" | "error";
  hint?: string;
}) {
  const valueColor = tone === "error" ? ERR_TEXT : tone === "warn" ? WARN_TEXT : undefined;
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="font-mono text-2xl font-semibold tabular-nums" style={{ color: valueColor }}>
        {value.toLocaleString("en-IN")}
      </div>
      <div className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
      {hint ? <div className="mt-0.5 text-[11px] text-muted-foreground/80">{hint}</div> : null}
    </div>
  );
}

/** Compact key/value row for read-only asset lists. */
export function MetaRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 py-1.5", className)}>{children}</div>
  );
}
