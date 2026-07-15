import {
  PAID_PLANS,
  TRIAL_PLAN,
  priceForBilling,
  type BillingCycle,
  type SelectablePlanId,
} from "@/components/auth/signup/plans";
import { AUTH_V2_PLAN_OVERVIEW_COPY } from "@/auth-v2/shared/copy";

/**
 * PlanOverviewCard — read-only summary of a plan the user ALREADY selected
 * on an earlier pricing page (outside this app, for now). There is no
 * plan-selection step anywhere in the auth-v2 flow — this is a summary
 * card, not a picker.
 *
 * Uses only semantic Tailwind tokens (bg-card, border-border,
 * text-foreground, text-muted-foreground, text-primary, + dark: variants)
 * so it composes cleanly inside both a dark-themed parent (Dark Stage) and
 * a light-themed parent (Living Split). `className` lets each parent pass
 * extra skin (glass/blur/border overrides) without fighting this component.
 */
export interface PlanOverviewCardProps {
  planId: SelectablePlanId;
  billing: BillingCycle;
  className?: string;
}

export function PlanOverviewCard({ planId, billing, className }: PlanOverviewCardProps) {
  const isTrial = planId === "trial";
  const paidPlan = isTrial ? undefined : PAID_PLANS.find((p) => p.id === planId);

  const name = isTrial ? TRIAL_PLAN.name : paidPlan?.name ?? "—";
  const priceLine = isTrial
    ? TRIAL_PLAN.chip
    : paidPlan
      ? `$${priceForBilling(paidPlan, billing)}/mo`
      : "";
  const bullets = isTrial
    ? [TRIAL_PLAN.chip]
    : paidPlan?.features?.slice(0, 2) ?? (paidPlan?.subtitle ? [paidPlan.subtitle] : []);

  return (
    <div
      className={
        "rounded-2xl border border-border bg-card p-3.5 text-foreground " +
        (className ?? "")
      }
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {AUTH_V2_PLAN_OVERVIEW_COPY.eyebrowLabel}
      </p>

      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span className="text-base font-semibold text-foreground">{name}</span>
        {priceLine && (
          <span className="text-sm font-medium text-primary">{priceLine}</span>
        )}
      </div>

      {bullets.length > 0 && (
        <ul className="mt-2 space-y-1">
          {bullets.map((bullet) => (
            <li
              key={bullet}
              className="flex items-start gap-1.5 text-xs text-muted-foreground"
            >
              <span className="mt-0.5 text-primary">✓</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={(e) => e.preventDefault()}
        className="mt-2.5 w-full rounded-lg border border-border bg-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {AUTH_V2_PLAN_OVERVIEW_COPY.viewMoreLabel}
      </button>
    </div>
  );
}
