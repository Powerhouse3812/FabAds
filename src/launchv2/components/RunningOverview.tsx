/**
 * RunningOverview — collapsible campaign overview strip.
 *
 * Lives below the stepper on every step. Shows progressively filled plan
 * data as the user moves through the wizard. Collapsed by default; expands
 * to show all filled groups with vertical dividers between them.
 *
 * Returns null when no groups are filled (Step 1 with nothing set).
 */

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanV2 } from "../types";
import type { StepV2 } from "../state/useFlowV2";

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

interface RunningOverviewProps {
  plan: PlanV2;
  currentStep: StepV2;
}

/* ------------------------------------------------------------------ */
/*  Formatters                                                          */
/* ------------------------------------------------------------------ */

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
};

function currSym(code?: string): string {
  if (!code) return "";
  return CURRENCY_SYMBOLS[code] ?? `${code} `;
}

function formatMoney(amount: number, currency?: string): string {
  return `${currSym(currency)}${Math.round(amount).toLocaleString("en-IN")}`;
}

function formatObjective(objective: string | null): string | null {
  if (!objective) return null;
  const raw = objective.replace(/^OUTCOME_/, "");
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function formatIntent(intent: string | null | undefined): string | null {
  if (!intent) return null;
  return intent.charAt(0).toUpperCase() + intent.slice(1);
}

const SPREAD_LABELS: Record<string, string> = {
  round_robin: "Round-robin",
  one_per_adset: "One per ad set",
  stacked: "Stacked",
  multiply: "Multiply",
  manual: "Manual",
};

const FORMAT_LABELS: Record<string, string> = {
  single_image: "Image",
  single_video: "Video",
  carousel: "Carousel",
  collection: "Collection",
  flexible: "Flexible",
  dpa: "DPA",
};

/* ------------------------------------------------------------------ */
/*  Pill                                                                */
/* ------------------------------------------------------------------ */

function Pill({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted/60 px-2.5 py-0.5 font-mono text-[11px] text-foreground/80 tabular-nums">
      {value}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Vertical divider between groups                                     */
/* ------------------------------------------------------------------ */

function Divider() {
  return <span className="border-r border-border/50 mx-2 h-4 inline-block self-center" />;
}

/* ------------------------------------------------------------------ */
/*  Group type                                                           */
/* ------------------------------------------------------------------ */

interface PillGroup {
  key: string;
  pills: string[];
}

/* ------------------------------------------------------------------ */
/*  Component                                                            */
/* ------------------------------------------------------------------ */

export default function RunningOverview({ plan, currentStep }: RunningOverviewProps) {
  const [collapsed, setCollapsed] = useState(true);

  const groups: PillGroup[] = [];

  // Group 1 — Objective + Intent (always, if set)
  const objLabel = formatObjective(plan.objective);
  const intentLabel = formatIntent(plan.intent !== "custom" ? plan.intent : null);
  if (objLabel || intentLabel) {
    const pills: string[] = [];
    if (objLabel) pills.push(objLabel);
    if (intentLabel) pills.push(intentLabel);
    groups.push({ key: "objective", pills });
  }

  // Group 2 — Setup (step >= 2 AND has targets)
  if (currentStep >= 2 && plan.targets.length > 0) {
    const pills: string[] = [];
    pills.push(`${plan.targets.length} account${plan.targets.length > 1 ? "s" : ""}`);
    if (plan.budgetAmount) {
      const currency = plan.targets[0]?.currency;
      const sym = currSym(currency);
      pills.push(
        `${sym}${Math.round(plan.budgetAmount).toLocaleString("en-IN")}/day · ${plan.budgetMode}`,
      );
    }
    groups.push({ key: "setup", pills });
  }

  // Group 3 — Audience (step >= 2 AND has locations via targeting template or targets)
  if (currentStep >= 2 && plan.targets.length > 0) {
    const pills: string[] = [];
    // Use the first target as a proxy for location — real geo comes from targeting template
    const firstTarget = plan.targets[0];
    if (firstTarget) {
      // Infer location label from account name heuristic or use account name
      const location = firstTarget.accountName;
      pills.push(location);
    }
    if (pills.length > 0) {
      groups.push({ key: "audience", pills });
    }
  }

  // Group 4 — Creative (step >= 3 AND has format + creatives)
  if (currentStep >= 3 && (plan.format || plan.creatives.length > 0)) {
    const pills: string[] = [];
    if (plan.format) {
      pills.push(FORMAT_LABELS[plan.format] ?? plan.format);
    }
    if (plan.creatives.length > 0) {
      pills.push(`${plan.creatives.length} creative${plan.creatives.length > 1 ? "s" : ""}`);
    }
    if (pills.length > 0) {
      groups.push({ key: "creative", pills });
    }
  }

  // Group 5 — Distribution (step >= 4 AND has spread)
  if (currentStep >= 4 && plan.spread) {
    const pills: string[] = [];
    const spreadLabel = SPREAD_LABELS[plan.spread] ?? plan.spread;
    pills.push(spreadLabel);

    if (plan.pageDistribution) {
      const PAGE_DIST_LABELS: Record<string, string> = {
        one_page: "One page",
        fill_first: "Fill first",
        equal: "Equal split",
        duplicate: "Duplicate",
      };
      pills.push(PAGE_DIST_LABELS[plan.pageDistribution] ?? plan.pageDistribution);
    }

    groups.push({ key: "distribution", pills });
  }

  // Don't render at all when there's nothing to show
  if (groups.length === 0) return null;

  // All pills flattened for collapsed inline view
  const allPills = groups.flatMap((g) => g.pills);

  return (
    <div
      className={cn(
        "border-b border-border bg-muted/20 transition-all",
        collapsed ? "py-1.5" : "py-2.5",
      )}
    >
      <div className="mx-auto max-w-4xl px-5">
        {/* Header row */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex w-full items-center gap-2 text-left"
          type="button"
          aria-expanded={!collapsed}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground/70 shrink-0">
            Campaign overview
          </span>
          <ChevronDown
            className={cn(
              "h-3 w-3 text-muted-foreground/60 transition-transform shrink-0",
              !collapsed && "rotate-180",
            )}
          />
          {collapsed && allPills.length > 0 && (
            <div className="flex flex-1 flex-wrap items-center gap-1.5 overflow-hidden">
              {allPills.map((pill, i) => (
                <Pill key={`${pill}-${i}`} value={pill} />
              ))}
            </div>
          )}
        </button>

        {/* Expanded content */}
        {!collapsed && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {groups.map((group, gi) => (
              <span key={group.key} className="inline-flex items-center gap-1">
                {gi > 0 && <Divider />}
                {group.pills.map((pill, pi) => (
                  <Pill key={`${pill}-${pi}`} value={pill} />
                ))}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
