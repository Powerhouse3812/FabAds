import { Check } from "lucide-react";
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
}

/* ── Bucket list (feature group) ── */
function BucketList({
  bucket,
}: {
  bucket: { heading: string; items: string[] };
}) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="text-[12px] font-medium tracking-tight text-muted-foreground mb-2.5">
        {bucket.heading}
      </p>
      <ul className="flex flex-col gap-2 list-none">
        {bucket.items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2.5 text-[14px] text-foreground leading-relaxed"
          >
            <span className="shrink-0 mt-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary/15 border border-primary/30">
              <Check className="h-2.5 w-2.5 text-primary" strokeWidth={3} />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Value point (direct-view feature card) ── */
function ValuePoint({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Check;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-3 items-start">
      <div className="shrink-0 h-9 w-9 rounded-lg bg-primary/10 border border-primary/25 inline-flex items-center justify-center text-primary">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14.5px] font-semibold text-foreground leading-tight tracking-tight">
          {title}
        </p>
        <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}

/* ── Trial banner ── */
function TrialBanner({ days }: { days: number }) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-primary/[0.06] border border-primary/25 mb-4 text-[12.5px] font-medium text-foreground">
      <span
        className="shrink-0 h-[7px] w-[7px] rounded-full bg-primary"
        style={{ boxShadow: "0 0 0 4px rgba(195,235,66,0.15)" }}
      />
      {days} day free trial
      <span className="ml-auto text-[12px] text-muted-foreground font-normal">
        No credit card required
      </span>
    </div>
  );
}

/* ── Credits pill ── */
function CreditsPill({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary bg-primary/[0.08] border border-primary/25 rounded-full px-3 py-1.5 mb-4 w-fit">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
      {label}
    </div>
  );
}

/* ── Main plan card ── */
export function PlanCard({ plan, view, billing, onCtaClick }: PlanCardProps) {
  const price = priceFor(plan, billing);
  const isDirect = view === "direct" && plan.tier === "ai"; // direct only on AI
  const showTagAtTop = !isDirect && plan.tagTrial;

  return (
    <div
      className={cn(
        "relative flex flex-col p-7 pt-8 rounded-2xl border bg-card transition-colors",
        plan.featured
          ? "border-primary/35"
          : "border-border hover:border-foreground/20",
      )}
    >
      {/* Subtle lime gradient overlay for featured cards */}
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
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10.5px] font-semibold uppercase tracking-wider">
          {plan.badge}
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 mb-5">
        <p className="text-[11.5px] font-semibold tracking-[0.14em] uppercase text-muted-foreground mb-3">
          {plan.name}
        </p>
        {showTagAtTop && (
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            {plan.tagTrial}
          </p>
        )}
        {!showTagAtTop && plan.tagTrial && view === "direct" && (
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            {plan.tagTrial}
          </p>
        )}
        {!plan.tagTrial && plan.tier === "growth" && (
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            {/* Growth plans show their tagline always (no separate trial-only tag) */}
          </p>
        )}
      </div>

      {/* Price */}
      <div className="relative z-10 flex items-baseline gap-2 mb-1.5">
        <span className="text-[46px] font-bold tracking-tight leading-none text-foreground">
          {price.display}
        </span>
        {price.strike && (
          <span className="text-[16px] text-muted-foreground/50 line-through font-medium">
            {price.strike}
          </span>
        )}
      </div>
      <p className="text-[13px] text-muted-foreground mb-5 relative z-10">
        {price.cycle}
      </p>

      {/* Body — view-specific content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {isDirect && plan.valuePoints ? (
          /* DIRECT VIEW (AI tier only) */
          <>
            <Button
              size="lg"
              className="w-full h-11 mb-2 text-[14px] font-semibold"
              onClick={() => onCtaClick(plan)}
            >
              {plan.ctaLabel}
            </Button>
            <p className="text-center text-[12px] text-muted-foreground mb-6 leading-relaxed">
              {plan.trustText(
                plan.pricing === "custom" ? 0 : plan.pricing.monthly,
              )}
            </p>
            <div className="flex flex-col gap-4">
              {plan.valuePoints.map((vp, i) => (
                <ValuePoint key={i} icon={vp.icon} title={vp.title} desc={vp.desc} />
              ))}
            </div>
          </>
        ) : (
          /* TRIAL VIEW (or growth) */
          <>
            {plan.trialDays && <TrialBanner days={plan.trialDays} />}
            <Button
              size="lg"
              className="w-full h-11 mb-2 text-[14px] font-semibold"
              onClick={() => onCtaClick(plan)}
            >
              {plan.ctaLabel}
            </Button>
            <p className="text-center text-[12px] text-muted-foreground mb-5 leading-relaxed">
              {plan.trustText(
                plan.pricing === "custom" ? 0 : plan.pricing.monthly,
              )}
            </p>
            {plan.creditsPill && <CreditsPill label={plan.creditsPill} />}
            {plan.buckets.map((b, i) => (
              <BucketList key={i} bucket={b} />
            ))}
            {plan.mutedNote && (
              <p className="text-[12.5px] text-muted-foreground mt-4 pt-3.5 border-t border-dashed border-border leading-relaxed">
                {plan.mutedNote}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
