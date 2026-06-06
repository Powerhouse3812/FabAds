/**
 * reviewParts — small presentational atoms shared across Step 4's panes and the
 * Launch Detail screen. Status fills use the FabFunnel tokens so the readiness
 * chip, issue rows and tree counts all read in one palette.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ReadinessLevel } from "./reviewModel";

/* FabFunnel status tokens (fill) + AA-safe text variants. */
export const OK = "#52c41a";
export const WARN = "#faad14";
export const ERR = "#ff4d4f";
export const OK_TEXT = "#237804";
export const WARN_TEXT = "#874d00";
export const ERR_TEXT = "#cf1322";

/** Friendly CTA label map (canonical enum → human). */
export const CTA_LABELS: Record<string, string> = {
  SHOP_NOW: "Shop now",
  LEARN_MORE: "Learn more",
  SIGN_UP: "Sign up",
  SUBSCRIBE: "Subscribe",
  BOOK_TRAVEL: "Book now",
  DOWNLOAD: "Download",
  GET_OFFER: "Get offer",
  CONTACT_US: "Contact us",
  APPLY_NOW: "Apply now",
  GET_QUOTE: "Get quote",
  SEND_MESSAGE: "Send message",
  WHATSAPP_MESSAGE: "WhatsApp",
  CALL_NOW: "Call now",
  INSTALL_NOW: "Install now",
  NO_BUTTON: "No button",
};
export function ctaLabel(cta: string): string {
  return CTA_LABELS[cta] ?? cta.split("_").map((w) => w[0] + w.slice(1).toLowerCase()).join(" ");
}

/** A small readiness chip — Meta campaign-score style. */
export function ReadinessChip({
  level,
  score,
  label,
  className,
}: {
  level: ReadinessLevel;
  score: number;
  label: string;
  className?: string;
}) {
  const tone =
    level === "blocked"
      ? { color: ERR_TEXT, bg: "rgba(255,77,79,0.12)", dot: ERR }
      : level === "review"
        ? { color: WARN_TEXT, bg: "rgba(250,173,20,0.16)", dot: WARN }
        : { color: OK_TEXT, bg: "rgba(82,196,26,0.14)", dot: OK };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium leading-none",
        className,
      )}
      style={{ color: tone.color, backgroundColor: tone.bg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone.dot }} />
      {label}
      <span className="font-mono tabular-nums opacity-80">{score}</span>
    </span>
  );
}

/** Labeled stat for the summary strip — number is hero (mono tabular). */
export function MiniStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="font-mono text-base font-semibold tabular-nums leading-none">{value}</span>
      {sub && <span className="text-[11px] leading-tight text-muted-foreground">{sub}</span>}
    </div>
  );
}

/** Read-only labeled field row used inside the Edit pane summaries. */
export function FieldRow({
  label,
  children,
  mono,
}: {
  label: string;
  children: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className={cn("min-w-0 truncate text-right text-[13px] text-foreground", mono && "font-mono tabular-nums")}>
        {children}
      </span>
    </div>
  );
}

/** A small headroom meter (current / +new / cap) for a single Page. */
export function CapMeter({
  current,
  demand,
  cap = 250,
}: {
  current: number;
  demand: number;
  cap?: number;
}) {
  const over = current + demand > cap;
  const curPct = Math.min(100, (current / cap) * 100);
  const newPct = Math.min(100 - curPct, (demand / cap) * 100);
  const overflow = Math.max(0, current + demand - cap);
  return (
    <div className="space-y-1">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-foreground/[0.06]">
        <div style={{ width: `${curPct}%`, backgroundColor: "rgba(15,15,12,0.35)" }} />
        <div style={{ width: `${newPct}%`, backgroundColor: over ? ERR : OK }} />
      </div>
      <div className="flex items-center justify-between font-mono text-[10px] tabular-nums text-muted-foreground">
        <span>{current} live + {demand} new</span>
        <span style={over ? { color: ERR_TEXT } : undefined}>
          {over ? `${overflow} over` : `${cap - current - demand} left`}
        </span>
      </div>
    </div>
  );
}
