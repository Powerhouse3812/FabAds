import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  type Billing,
  type PlanDef,
  type View,
  priceFor,
  BASE_PLAN,
  getDeltaBuckets,
} from "./data";

interface PlanCardV2Props {
  plan: PlanDef;
  view: View;
  billing: Billing;
  onCtaClick: (plan: PlanDef) => void;
  /** Compact = 3-up grid (Growth tier). Wide = 2-up grid (AI tier). */
  density: "compact" | "wide";
}

/**
 * Plan card for the V2 modal. Shows a SUMMARISED view of each plan —
 * one line per bucket (items joined with `·` so the bucket heading
 * becomes implicit). Maalik's call: cards should be a quick scan, with
 * full detail / comparison sitting behind the "Compare all plans" CTA
 * at the modal footer.
 *
 * Layout per card:
 *   1. Optional badge ("Best for teams" / "Most popular")
 *   2. Plan name (small caps)
 *   3. tagTrial one-liner (muted, only when present)
 *   4. Price + cycle
 *   5. Trial / credits one-liner (NOT a boxed banner — saves vertical)
 *   6. CTA + trust microcopy
 *   7. Summary list — ONE bullet per bucket (items joined inline)
 *   8. mutedNote (italic, when present)
 *
 * Density:
 *   - wide   → AI tier, 2-up grid, ~520-560px wide
 *   - compact → Growth tier, 3-up grid, ~340px wide
 *   Both densities use single-column summary now (no nested grid).
 */
export function PlanCardV2({
  plan,
  view,
  billing,
  onCtaClick,
  density,
}: PlanCardV2Props) {
  const price = priceFor(plan, billing);
  const isTrial = view === "trial" && plan.tier === "ai";
  const showTrialLine =
    (isTrial && plan.trialDays) || (plan.tier === "growth" && plan.trialDays);

  // Cumulative pricing: if this plan inherits from a base (Growth Pro
  // from Starter, Enterprise from Pro), render only the delta + an
  // "Everything in {base.label}, plus:" intro line.
  const base = BASE_PLAN[plan.id];
  const displayBuckets = base ? getDeltaBuckets(plan) : plan.buckets;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card transition-colors",
        density === "compact" ? "p-4" : "p-5",
        plan.featured
          ? "border-primary/35"
          : "border-border hover:border-foreground/20",
      )}
    >
      {/* Featured gradient overlay */}
      {plan.featured && (
        <div
          aria-hidden
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(195,235,66,0.04) 0%, transparent 50%)",
          }}
        />
      )}

      {/* Badge */}
      {plan.badge && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap z-10">
          {plan.badge}
        </div>
      )}

      {/* ── Header: name + (trial view) tag ── */}
      <div className="relative z-10">
        <p className="text-[10.5px] font-semibold tracking-[0.14em] uppercase text-muted-foreground">
          {plan.name}
        </p>
        {isTrial && plan.tagTrial && (
          <p className="text-[11.5px] text-muted-foreground mt-1 leading-snug line-clamp-2">
            {plan.tagTrial}
          </p>
        )}
      </div>

      {/* ── Price ── */}
      <div className="relative z-10 flex items-baseline gap-2 mt-2.5">
        <span
          className={cn(
            "font-bold tracking-tight leading-none text-foreground",
            density === "compact" ? "text-[30px]" : "text-[34px]",
          )}
        >
          {price.display}
        </span>
        {price.strike && (
          <span className="text-[12px] text-muted-foreground/50 line-through font-medium">
            {price.strike}
          </span>
        )}
      </div>
      <p className="text-[11.5px] text-muted-foreground mt-1 relative z-10 leading-snug">
        {price.cycle}
      </p>

      {/* ── Trial / credits microline ── */}
      <div className="relative z-10 flex items-center gap-1.5 mt-2.5 mb-3 text-[11px] font-medium">
        {showTrialLine ? (
          <>
            <span
              className="shrink-0 h-[5px] w-[5px] rounded-full bg-primary"
              style={{ boxShadow: "0 0 0 2.5px rgba(195,235,66,0.18)" }}
            />
            <span className="text-foreground">
              {plan.trialDays}-day free trial
            </span>
            <span className="text-muted-foreground">· No card required</span>
          </>
        ) : plan.creditsPill ? (
          <>
            <span className="shrink-0 h-[5px] w-[5px] rounded-full bg-primary" />
            <span className="text-foreground">{plan.creditsPill}</span>
          </>
        ) : (
          <span className="text-muted-foreground italic">
            Tailored to your scale
          </span>
        )}
      </div>

      {/* ── CTA ── */}
      <Button
        className={cn(
          "relative z-10 w-full font-semibold text-[12.5px] mb-1.5",
          density === "compact" ? "h-9" : "h-10",
        )}
        onClick={() => onCtaClick(plan)}
      >
        {plan.ctaLabel}
      </Button>
      <p className="relative z-10 text-center text-[10.5px] text-muted-foreground leading-snug mb-3.5">
        {plan.trustText(plan.pricing === "custom" ? 0 : plan.pricing.monthly)}
      </p>

      {/* ── Divider ── */}
      <div className="relative z-10 h-px bg-border/60 mb-3" />

      {/* ── Summary list — ONE bullet per bucket (items joined inline) ──
          We drop the bucket heading and concat items with `·` so each
          bucket reads as a single descriptor. e.g. instead of:
              CREATIVE
              ✓ Creative Studio
              ✓ Creative Library
          we render:
              ✓ Creative Studio · Creative Library
          This collapses ~15 lines of nested list into ~6 flat lines.

          Upgrade plans (Growth Pro, Enterprise) get the cumulative
          treatment: a bold "Everything in {base}, plus:" anchor line,
          then only the delta items below — the previous tier's items
          are inherited and not re-listed.

          Full per-item detail lives behind "Compare all plans →" CTA. */}
      {base && (
        <p className="relative z-10 text-[11.5px] font-semibold text-foreground leading-snug mb-2">
          Everything in {base.label}, plus:
        </p>
      )}
      <ul className="relative z-10 flex-1 flex flex-col gap-1.5 list-none">
        {displayBuckets.map((bucket, i) => (
          <li
            key={i}
            className="flex items-start gap-1.5 text-[11.5px] text-foreground leading-snug"
          >
            <Check
              className="shrink-0 mt-[3px] h-2.5 w-2.5 text-primary"
              strokeWidth={3}
            />
            <span>{bucket.items.join(" · ")}</span>
          </li>
        ))}
      </ul>

      {/* ── mutedNote ── */}
      {plan.mutedNote && (
        <p className="relative z-10 text-[10.5px] text-muted-foreground italic mt-3 leading-snug">
          {plan.mutedNote}
        </p>
      )}
    </div>
  );
}
