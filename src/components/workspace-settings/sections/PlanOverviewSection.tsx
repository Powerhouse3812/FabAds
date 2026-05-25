/**
 * PlanOverviewSection — Owned by Agent A.
 *
 * Renders the Plan Overview card (Growth Plan header strip + stats grid +
 * usage metrics with progress bars) followed by two lime add-on upsell
 * cards. Demo-only — all data ships from `mock-data.ts`.
 *
 * Figma reference: node-id=2984-18221.
 */
import { Eye, Infinity as InfinityIcon, UserPlus, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  PLAN_OVERVIEW_STATS,
  PLAN_OVERVIEW_UPSELLS,
  USAGE_METRICS,
  type PlanOverviewUpsell,
  type UsageMetric,
} from "../mock-data";

/* ── Helpers ──────────────────────────────────────────────────────── */

const UPSELL_ICONS: Record<PlanOverviewUpsell["iconKey"], typeof Zap> = {
  Zap,
  Eye,
};

/** Compute progress percent. Unlimited (total === null) is treated as 100%. */
function usagePct(metric: UsageMetric): number {
  if (metric.total === null || metric.total === 0) return 100;
  return Math.min(100, Math.round((metric.used / metric.total) * 100));
}

/** Format usage as "used/total" with zero-padded "00" for the add-on balance. */
function formatUsage(metric: UsageMetric): React.ReactNode {
  if (metric.total === null) {
    return (
      <InfinityIcon
        aria-label="Unlimited"
        className="h-5 w-5 text-primary"
        strokeWidth={2.5}
      />
    );
  }
  const used = String(metric.used).padStart(2, "0");
  const total = String(metric.total).padStart(2, "0");
  return `${used}/${total}`;
}

/* ── Stat cell (Row 1) ────────────────────────────────────────────── */

interface StatCellProps {
  label: string;
  value: React.ReactNode;
  /** True for every cell except the first — draws the left divider. */
  divided?: boolean;
}

function StatCell({ label, value, divided }: StatCellProps) {
  return (
    <div
      className={
        "flex flex-col items-end justify-between gap-2 px-4 " +
        (divided ? "border-l border-border/60" : "")
      }
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}

/* ── Usage cell (Row 2) ───────────────────────────────────────────── */

interface UsageCellProps {
  metric: UsageMetric;
  divided?: boolean;
}

function UsageCell({ metric, divided }: UsageCellProps) {
  const pct = usagePct(metric);
  const isDanger = metric.status === "danger";
  const isUnlimited = metric.total === null;

  return (
    <div
      className={
        "flex flex-col items-end gap-2 px-4 " +
        (divided ? "border-l border-border/60" : "")
      }
    >
      <span className="text-xs text-muted-foreground">{metric.label}</span>
      <span
        className={
          "font-mono text-sm font-semibold tabular-nums " +
          (isDanger ? "text-destructive" : "text-foreground")
        }
      >
        {formatUsage(metric)}
      </span>
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={`${metric.label} usage`}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {isUnlimited ? null : (
          <div
            className={
              "h-full rounded-full " +
              (isDanger ? "bg-destructive" : "bg-foreground")
            }
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
    </div>
  );
}

/* ── Upsell card ──────────────────────────────────────────────────── */

function UpsellCard({ upsell }: { upsell: PlanOverviewUpsell }) {
  const Icon = UPSELL_ICONS[upsell.iconKey];
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-[#FEFFF0] p-4">
      <div className="flex h-[30px] w-[30px] items-center justify-center rounded-md bg-primary">
        <Icon className="h-4 w-4 text-foreground" strokeWidth={2.25} />
      </div>
      <div className="space-y-1">
        <h4 className="text-base font-semibold text-foreground">
          {upsell.title}
        </h4>
        <p className="text-[13px] leading-[17px] text-muted-foreground">
          {upsell.description}
        </p>
      </div>
      <a
        href={upsell.href}
        className="mt-auto inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {upsell.cta}
      </a>
    </article>
  );
}

/* ── Main section ─────────────────────────────────────────────────── */

export function PlanOverviewSection() {
  const stats = PLAN_OVERVIEW_STATS;

  // Row 1 — top stats. Order matches Figma.
  const statCells: { label: string; value: React.ReactNode }[] = [
    { label: "Spend", value: stats.spendUsd },
    {
      label: "IQ Credit",
      value: `${stats.iqCreditWithPlan.used}/${stats.iqCreditWithPlan.total}`,
    },
    {
      label: "IQ Credit",
      value: String(stats.iqCreditAddonBalance).padStart(2, "0"),
    },
    { label: "Next Bill", value: stats.nextBillDate },
    { label: "Amount", value: `$${stats.amountUsd}` },
  ];

  return (
    <section aria-label="Plan overview" className="space-y-4">
      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="text-base font-semibold text-foreground">
          Plan Overview
        </h2>
        <p className="text-sm text-muted-foreground">
          View your current subscription plan, next billing date, and monthly
          spend usage across products and add-ons.
        </p>
      </header>

      {/* Plan card */}
      <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
        {/* Header strip */}
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-4 w-4 rounded-sm bg-primary"
            />
            <span className="text-sm font-semibold text-foreground">
              Growth Plan
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <UserPlus className="h-3.5 w-3.5" />
              Invite member
            </Button>
            <Button size="sm" className="h-8 text-xs">
              Manage plan
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-5 px-4 py-5">
          {/* Row 1 — stats grid */}
          <div className="grid grid-cols-5">
            {statCells.map((cell, i) => (
              <StatCell
                key={`${cell.label}-${i}`}
                label={cell.label}
                value={cell.value}
                divided={i > 0}
              />
            ))}
          </div>

          {/* Row 2 — usage metrics grid */}
          <div className="grid grid-cols-5">
            {USAGE_METRICS.map((metric, i) => (
              <UsageCell
                key={metric.label}
                metric={metric}
                divided={i > 0}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Upsell cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {PLAN_OVERVIEW_UPSELLS.map((upsell) => (
          <UpsellCard key={upsell.id} upsell={upsell} />
        ))}
      </div>
    </section>
  );
}
