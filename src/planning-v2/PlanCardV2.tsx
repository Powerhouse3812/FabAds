import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  type Billing,
  type PlanDef,
  type View,
  priceFor,
  HIGHLIGHTS_V2,
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
 * Compact plan card for the V2 modal. Hard-capped vertical height so the
 * modal never scrolls. Only renders:
 *   - badge (optional)
 *   - plan name + (trial view) one-line tag
 *   - price + cycle
 *   - credits pill
 *   - 4-item highlight list (from HIGHLIGHTS_V2)
 *   - CTA + trust microcopy
 *
 * Featured plan gets a lime ring + soft gradient overlay — same visual
 * weight as V1 but tightened.
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
  const showTrialBanner =
    (isTrial && plan.trialDays) || (plan.tier === "growth" && plan.trialDays);
  const highlights = HIGHLIGHTS_V2[plan.id] ?? [];

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card transition-colors",
        density === "compact" ? "p-5" : "p-6",
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

      {/* Badge ("Best for teams" / "Most popular") */}
      {plan.badge && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap">
          {plan.badge}
        </div>
      )}

      {/* Plan name */}
      <div className="relative z-10">
        <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted-foreground">
          {plan.name}
        </p>
      </div>

      {/* Price */}
      <div className="relative z-10 flex items-baseline gap-2 mt-3">
        <span
          className={cn(
            "font-bold tracking-tight leading-none text-foreground",
            density === "compact" ? "text-[34px]" : "text-[38px]",
          )}
        >
          {price.display}
        </span>
        {price.strike && (
          <span className="text-[13px] text-muted-foreground/50 line-through font-medium">
            {price.strike}
          </span>
        )}
      </div>
      <p className="text-[12px] text-muted-foreground mt-1 mb-3 relative z-10 leading-snug">
        {price.cycle}
      </p>

      {/* Trial / credits microline (one line, no boxed banner — saves vertical) */}
      <div className="relative z-10 flex items-center gap-2 mb-4 text-[11.5px] font-medium">
        {showTrialBanner ? (
          <>
            <span
              className="shrink-0 h-[6px] w-[6px] rounded-full bg-primary"
              style={{ boxShadow: "0 0 0 3px rgba(195,235,66,0.18)" }}
            />
            <span className="text-foreground">
              {plan.trialDays}-day free trial
            </span>
            <span className="text-muted-foreground">· No card required</span>
          </>
        ) : plan.creditsPill ? (
          <>
            <span className="shrink-0 h-[6px] w-[6px] rounded-full bg-primary" />
            <span className="text-foreground">{plan.creditsPill}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Tailored to your scale</span>
        )}
      </div>

      {/* CTA */}
      <Button
        className={cn(
          "relative z-10 w-full font-semibold text-[13px] mb-2",
          density === "compact" ? "h-10" : "h-11",
        )}
        onClick={() => onCtaClick(plan)}
      >
        {plan.ctaLabel}
      </Button>
      <p className="relative z-10 text-center text-[11px] text-muted-foreground leading-snug mb-4">
        {plan.trustText(plan.pricing === "custom" ? 0 : plan.pricing.monthly)}
      </p>

      {/* Highlights — 4 items, flat list, no headings */}
      <ul className="relative z-10 flex flex-col gap-2 list-none">
        {highlights.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-[12.5px] text-foreground leading-snug"
          >
            <span className="shrink-0 mt-[3px] inline-flex h-3 w-3 items-center justify-center rounded-full bg-primary/15 border border-primary/30">
              <Check className="h-2 w-2 text-primary" strokeWidth={3} />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
