import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { RadioDot } from "@/components/auth/signup/RadioDot";
import {
  annualSavings,
  priceForBilling,
  type BillingCycle,
  type PaidPlan,
} from "@/components/auth/signup/plans";

interface PlanCardProps {
  plan: PaidPlan;
  billing: BillingCycle;
  selected: boolean;
  expanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
}

/**
 * PlanCard — the radio-accordion plan row from Figma 10990:44968 (node
 * 11207:44566 selected/expanded, 11207:44604 / 44613 collapsed). Selecting
 * the radio both picks the plan AND expands it (one expanded at a time —
 * driven by the parent, see Step1PlanSelection); the chevron alone can
 * expand/collapse a card without changing the selection, matching the
 * up/down caret shown on the collapsed Growth/Pro rows in the mock.
 */
export function PlanCard({ plan, billing, selected, expanded, onSelect, onToggleExpand }: PlanCardProps) {
  const price = priceForBilling(plan, billing);
  const isDiscounted = billing === "annual" && plan.annualMonthlyPrice !== plan.monthlyPrice;
  const savings = annualSavings(plan);

  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "fab-focus w-full cursor-pointer rounded-lg border px-4 py-3 transition-colors",
        selected ? "border-primary bg-primary/5" : "border-border",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <RadioDot selected={selected} />
        <span className="whitespace-nowrap text-sm font-semibold text-foreground">
          {plan.name} -{" "}
          {isDiscounted && <span className="text-muted-foreground line-through">${plan.monthlyPrice}</span>}{" "}
          ${price}
          {billing === "annual" && <span className="font-normal text-muted-foreground"> / month</span>}
        </span>

        <div className="ml-auto flex items-center gap-2">
          {billing === "annual" && (
            <span className="whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              Save ${savings} / billed yearly
            </span>
          )}
          {plan.mostPopular && (
            <span className="whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
              Most Popular
            </span>
          )}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleExpand();
            }}
            aria-label={expanded ? "Collapse plan details" : "Expand plan details"}
            className="fab-focus rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
          </button>
        </div>
      </div>

      <p className="mt-1 pl-6 text-xs text-muted-foreground">{plan.subtitle}</p>

      {expanded && plan.features && (
        <div className="mt-3 grid grid-cols-1 gap-y-1 pl-6 sm:grid-cols-2">
          {plan.features.map((feature) => (
            <div key={feature} className="flex items-center gap-1.5 text-xs text-foreground">
              <Check className="h-3 w-3 shrink-0 text-foreground/70" aria-hidden="true" />
              {feature}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
