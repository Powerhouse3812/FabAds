import { useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  type Billing,
  type PlanDef,
  type View,
  priceFor,
} from "./data";

interface PlanCardProps {
  plan: PlanDef;
  view: View;
  billing: Billing;
  onCtaClick: (plan: PlanDef) => void;
  /** Compact mode for modal use — denser padding + drop bucket lists. */
  compact?: boolean;
}

/* ── Bucket list (feature group) ── */
function BucketList({
  bucket,
}: {
  bucket: { heading: string; items: string[] };
}) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="text-[11px] font-medium tracking-tight text-muted-foreground mb-1.5 uppercase">
        {bucket.heading}
      </p>
      <ul className="flex flex-col gap-1.5 list-none">
        {bucket.items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-[12.5px] text-foreground leading-snug"
          >
            <span className="shrink-0 mt-0.5 inline-flex h-3 w-3 items-center justify-center rounded-full bg-primary/15 border border-primary/30">
              <Check className="h-2 w-2 text-primary" strokeWidth={3} />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Key features list (top 4 bullets shown by default) ── */
function KeyFeatures({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2 list-none">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex items-start gap-2 text-[13px] text-foreground leading-snug"
        >
          <span className="shrink-0 mt-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary/15 border border-primary/30">
            <Check className="h-2.5 w-2.5 text-primary" strokeWidth={3} />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── Trial banner (compact) ── */
function TrialBanner({ days, compact }: { days: number; compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 rounded-lg bg-primary/[0.06] border border-primary/25 text-[12px] font-medium text-foreground",
        compact ? "py-1.5 mb-2.5" : "py-2.5 mb-4",
      )}
    >
      <span
        className="shrink-0 h-[6px] w-[6px] rounded-full bg-primary"
        style={{ boxShadow: "0 0 0 3px rgba(195,235,66,0.15)" }}
      />
      {days} day free trial
      <span className="ml-auto text-[11px] text-muted-foreground font-normal">
        No card needed
      </span>
    </div>
  );
}

/* ── Credits pill (compact) ── */
function CreditsPill({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 text-[12px] font-medium text-primary bg-primary/[0.08] border border-primary/25 rounded-full px-2.5 py-1 mb-3 w-fit">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
      {label}
    </div>
  );
}

/* ── Main plan card ── */
export function PlanCard({
  plan,
  view,
  billing,
  onCtaClick,
  compact = false,
}: PlanCardProps) {
  const [expandFeatures, setExpandFeatures] = useState(false);
  const price = priceFor(plan, billing);
  // Direct view only valid on AI tier; Growth always uses trial-style content.
  const isDirect = view === "direct" && plan.tier === "ai";

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card transition-colors",
        compact ? "p-5 pt-6" : "p-7 pt-8",
        plan.featured
          ? "border-primary/35"
          : "border-border hover:border-foreground/20",
      )}
    >
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

      {plan.badge && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap">
          {plan.badge}
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 mb-3">
        <p className="text-[10.5px] font-semibold tracking-[0.14em] uppercase text-muted-foreground mb-2">
          {plan.name}
        </p>
        {plan.tagTrial && (
          <p
            className={cn(
              "text-muted-foreground leading-snug",
              compact ? "text-[12px]" : "text-[13px]",
            )}
          >
            {plan.tagTrial}
          </p>
        )}
      </div>

      {/* Price */}
      <div className="relative z-10 flex items-baseline gap-2 mb-1">
        <span
          className={cn(
            "font-bold tracking-tight leading-none text-foreground",
            compact ? "text-[36px]" : "text-[46px]",
          )}
        >
          {price.display}
        </span>
        {price.strike && (
          <span className="text-[14px] text-muted-foreground/50 line-through font-medium">
            {price.strike}
          </span>
        )}
      </div>
      <p className="text-[12px] text-muted-foreground mb-4 relative z-10">
        {price.cycle}
      </p>

      {/* Body */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Trial banner (always shown in trial-style view) */}
        {plan.trialDays && !isDirect && (
          <TrialBanner days={plan.trialDays} compact={compact} />
        )}

        {/* CTA */}
        <Button
          size={compact ? "default" : "lg"}
          className={cn(
            "w-full text-[13.5px] font-semibold mb-1.5",
            compact ? "h-10" : "h-11",
          )}
          onClick={() => onCtaClick(plan)}
        >
          {plan.ctaLabel}
        </Button>
        <p className="text-center text-[11.5px] text-muted-foreground mb-4 leading-snug">
          {plan.trustText(
            plan.pricing === "custom" ? 0 : plan.pricing.monthly,
          )}
        </p>

        {/* Credits pill (trial-style only) */}
        {plan.creditsPill && !isDirect && (
          <CreditsPill label={plan.creditsPill} />
        )}

        {/* Key features (always shown) */}
        <KeyFeatures items={plan.keyFeatures} />

        {/* "See all features" expand */}
        {!isDirect && plan.buckets.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setExpandFeatures((v) => !v)}
              className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors self-start"
            >
              {expandFeatures ? (
                <>
                  Hide full features
                  <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  See all features
                  <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
            {expandFeatures && (
              <div className="mt-3 pt-3 border-t border-dashed border-border">
                {plan.buckets.map((b, i) => (
                  <BucketList key={i} bucket={b} />
                ))}
                {plan.mutedNote && (
                  <p className="text-[11.5px] text-muted-foreground mt-3 leading-snug italic">
                    {plan.mutedNote}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
