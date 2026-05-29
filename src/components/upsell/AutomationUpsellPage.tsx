import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── CalcChip ────────────────────────────────────────────────────────────────

function CalcChip({
  label,
  sub,
  highlight = false,
}: {
  label: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl px-3 py-2 border",
        highlight
          ? "border-primary/30 bg-primary/[0.06]"
          : "border-border/60 bg-muted/30",
      )}
    >
      <span
        className={cn(
          "font-mono text-[15px] font-bold tabular-nums leading-none",
          highlight ? "text-primary" : "text-foreground",
        )}
      >
        {label}
      </span>
      <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground mt-1">
        {sub}
      </span>
    </div>
  );
}

// ─── Locked rules ────────────────────────────────────────────────────────────

const LOCKED_RULES = [
  "Pause any ad below ₹1.2 ROAS after 48 hrs",
  "Scale budget on ads above 3.5% CTR",
  "Rotate creatives on fatigue signals",
];

// ─── Main export ──────────────────────────────────────────────────────────────

export interface AutomationUpsellPageProps {
  className?: string;
}

export function AutomationUpsellPage({ className }: AutomationUpsellPageProps) {
  return (
    <div className={cn("max-w-xl mx-auto py-12 px-6", className)}>
      {/* Eyebrow */}
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50 mb-3">
        Upgrade · Automation
      </p>

      {/* Headline */}
      <h1 className="text-[22px] font-semibold leading-snug text-foreground">
        This is what manual ad ops
        <br />
        costs you.
      </h1>

      {/* Hairline */}
      <div className="border-t border-border/40 mt-6" />

      {/* Calculation card */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 mt-6">
        {/* Card eyebrow */}
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60 mb-3">
          Without automation
        </p>

        {/* Math row */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <CalcChip label="192 generations" sub="this month" />
          <span className="font-mono text-[16px] text-foreground/30">×</span>
          <CalcChip label="4 min avg" sub="per ad check" />
          <span className="font-mono text-[16px] text-foreground/30">=</span>
          <CalcChip label="12.8 hrs / month" sub="in Ads Manager" highlight />
        </div>

        {/* Progress bar */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/40 mb-4">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary"
            style={{ width: "64%" }}
          />
        </div>

        {/* Prose */}
        <p className="text-[12.5px] text-foreground/60 leading-relaxed">
          192 pauses, 192 budget checks, 192 "did this one win?" decisions. Done
          manually. Every month.
        </p>
      </div>

      {/* Hairline */}
      <div className="border-t border-border/40 mt-6 mb-6" />

      {/* Rules preview */}
      <div className="mt-6">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60 mb-3">
          What automation handles
        </p>

        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          {LOCKED_RULES.map((rule, i) => (
            <div
              key={rule}
              className={cn(
                "flex items-center gap-2.5 px-4 py-2.5",
                i < LOCKED_RULES.length - 1 && "border-b border-border/30",
              )}
            >
              <ChevronRight
                className="h-3.5 w-3.5 shrink-0 text-foreground/30"
                strokeWidth={2}
              />
              <span className="text-[12.5px] text-foreground/50 leading-snug flex-1">
                {rule}
              </span>
              <span className="bg-muted text-muted-foreground font-mono text-[9px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded">
                Locked
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center gap-3 mt-8">
        <Link
          to="/plans-v2?tier=growth&view=trial"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-[13px] font-bold text-foreground hover:bg-primary/90 transition-colors"
        >
          Start 14-day Growth trial
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60">
          Automation + Launch + Reports · Cancel any time
        </span>
      </div>
    </div>
  );
}
