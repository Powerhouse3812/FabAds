import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReportEntity } from "@/lib/reports-dummy-data";
import { currencyForCountry } from "@/lib/reports-accounts";
import { useEntityOverride } from "@/lib/ad-entity-write-store";

/**
 * MobileReportRow — one entity as a two-line, ~76px, fully-tappable card row.
 *
 * This is NOT a squeezed version of the 12-column desktop table
 * (`src/components/reports/ReportsTable.tsx`). At 360px there is room for a
 * name plus roughly three numbers before values start colliding, so the row
 * is a deliberate triage surface: identify the entity, read what is at stake,
 * read the verdict, tap through for the other nine metrics.
 *
 * ── Decision 1: status is a DOT, not a Badge ────────────────────────────────
 * The desktop row renders `<Badge>{entity.status}</Badge>`, which costs ~62px
 * of horizontal space — on a 360px screen that is ~20% of the row, taken
 * directly out of the name, the one field users actually scan by. An 8px dot
 * plus its gap costs ~14px. Same information, a quarter of the budget.
 *
 * Because a dot alone would make colour the only carrier of status (WCAG 1.4.1
 * "Use of Color"), status is carried on THREE channels:
 *   1. the dot's hue,
 *   2. the row's `aria-label` (always spells the status out in words),
 *   3. a second visual treatment — Paused dims the NAME to
 *      `text-muted-foreground`, Archived drops the whole row to 60% opacity
 *      AND prints the literal word "Archived".
 * A colour-blind or greyscale user still reads status without the hue.
 *
 * Dot hues reuse the exact token families from ReportsTable's `statusColor`
 * map (lines 42-46) so mobile and desktop never disagree about what "Active"
 * looks like. Desktop uses the /20 wash behind text; an 8px dot needs the
 * solid token to stay visible at that size.
 *
 * ── Decision 2: three metric slots out of twelve ────────────────────────────
 * Spend (what is at stake) + ROAS (the verdict) + one level-aware third:
 *   account  → Margin  (an account owner is answering "did we make money")
 *   campaign → CPA     (the campaign-level efficiency number)
 *   adset    → Budget  (the adset IS the budget lever — putting the lever
 *                       beside the outcome is what makes the row actionable
 *                       rather than merely informative)
 *   ad       → CTR     (creative performance lives here)
 * `thirdMetric` overrides this so the parent's sort / metrics sheet can keep
 * the visible column in sync with the column being sorted — a user who sorts
 * by CPM must be able to see CPM, or the ordering looks arbitrary.
 *
 * ── Decision 3: Revenue is deliberately excluded ────────────────────────────
 * Revenue = Spend × ROAS. Both factors are already on the row, so a Revenue
 * slot spends a third of the row's numeric budget on a value the reader can
 * derive. Burning scarce mobile density on a derivable number is the classic
 * mobile-table mistake; the slot goes to something non-derivable instead.
 *
 * ── Decision 4: no trend arrows, sparklines or deltas. Do not add them. ─────
 * `generateMetrics` in `src/lib/reports-dummy-data.ts` produces a single
 * seeded snapshot, and changing the date seed RESHUFFLES the numbers rather
 * than advancing time — there is no prior period to diff against. A "+12% ▲"
 * here would be invented data, on the one surface whose entire job is telling
 * the truth about money. If a real time series ever lands, deltas become
 * legitimate; until then anything trend-shaped is a lie. Leave them out.
 *
 * ── Decision 5: currency is per-row ─────────────────────────────────────────
 * Entities carry `country`, and a report can mix accounts across countries in
 * a single list. Money is formatted with `currencyForCountry(entity.country)`,
 * never a hardcoded "$" — an £-denominated adset labelled "$" is a factual
 * error, not a cosmetic one.
 */

/** Metric keys the third slot can display. Superset of the level defaults. */
export type MobileThirdMetric =
  | "margin"
  | "marginPercent"
  | "cpa"
  | "cpc"
  | "cpm"
  | "ctr"
  | "conversions"
  | "clicks"
  | "impressions"
  | "budget";

export interface MobileReportRowProps {
  entity: ReportEntity;
  onOpen: (entity: ReportEntity) => void;
  /** Override the level-aware default third slot (see Decision 2). */
  thirdMetric?: MobileThirdMetric;
  /** Hide the divider under the last row of a group. */
  isLast?: boolean;
  className?: string;
}

/**
 * Same token families as `statusColor` in ReportsTable.tsx (lines 42-46):
 * Active → chart-1, Paused → muted, Archived → destructive. Solid rather than
 * /20 because 8px of a 20%-opacity fill reads as nothing.
 */
const STATUS_DOT: Record<string, string> = {
  Active: "bg-chart-1",
  Paused: "bg-muted-foreground",
  Archived: "bg-destructive",
};

/** Level → third-slot metric. Overridable via the `thirdMetric` prop. */
export const THIRD_METRIC_BY_LEVEL: Record<string, MobileThirdMetric> = {
  account: "margin",
  campaign: "cpa",
  adset: "budget",
  ad: "ctr",
};

function compactMoney(v: number, symbol: string): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${symbol}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${sign}${symbol}${(abs / 1_000).toFixed(1)}K`;
  if (abs >= 1_000) return `${sign}${symbol}${Math.round(abs).toLocaleString("en-US")}`;
  // Small money keeps cents — a CPA of "$8" instead of "$8.42" loses the
  // precision the number exists to convey.
  return `${sign}${symbol}${abs.toFixed(2)}`;
}

function compactCount(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${(v / 1_000).toFixed(1)}K`;
  return Math.round(v).toLocaleString("en-US");
}

interface Slot {
  /** Short, all-caps, mono. Kept ≤ 9 chars so it never wraps at 360px. */
  label: string;
  value: string;
  /** Spoken form for the row's aria-label — expands abbreviations. */
  spoken: string;
}

function buildThirdSlot(
  entity: ReportEntity,
  metric: MobileThirdMetric,
  symbol: string,
): Slot {
  const m = entity.metrics;
  switch (metric) {
    case "budget": {
      // Budget lives on the entity, not on metrics, and is genuinely absent on
      // ad-level rows — "—" is the honest answer, not a zero.
      if (entity.budgetValue == null) {
        return { label: "BUDGET", value: "—", spoken: "budget not set" };
      }
      const isDaily = entity.budgetType !== "Lifetime";
      return {
        label: isDaily ? "BUDGET/D" : "BUDGET/L",
        value: compactMoney(entity.budgetValue, symbol),
        spoken: `${isDaily ? "daily" : "lifetime"} budget ${symbol}${entity.budgetValue.toLocaleString("en-US")}`,
      };
    }
    case "margin":
      return {
        label: "MARGIN",
        value: compactMoney(m.margin, symbol),
        spoken: `margin ${compactMoney(m.margin, symbol)}`,
      };
    case "marginPercent":
      return {
        label: "MARGIN %",
        value: `${m.marginPercent.toFixed(1)}%`,
        spoken: `margin ${m.marginPercent.toFixed(1)} percent`,
      };
    case "cpa":
      return {
        label: "CPA",
        value: m.cpa > 0 ? compactMoney(m.cpa, symbol) : "—",
        spoken: m.cpa > 0 ? `cost per acquisition ${compactMoney(m.cpa, symbol)}` : "no cost per acquisition",
      };
    case "cpc":
      return {
        label: "CPC",
        value: m.cpc > 0 ? compactMoney(m.cpc, symbol) : "—",
        spoken: m.cpc > 0 ? `cost per click ${compactMoney(m.cpc, symbol)}` : "no cost per click",
      };
    case "cpm":
      return {
        label: "CPM",
        value: m.cpm > 0 ? compactMoney(m.cpm, symbol) : "—",
        spoken: m.cpm > 0 ? `cost per mille ${compactMoney(m.cpm, symbol)}` : "no cost per mille",
      };
    case "ctr":
      return {
        label: "CTR",
        value: `${m.ctr.toFixed(2)}%`,
        spoken: `click-through rate ${m.ctr.toFixed(2)} percent`,
      };
    case "conversions":
      return {
        label: "CONV",
        value: compactCount(m.conversions),
        spoken: `${compactCount(m.conversions)} conversions`,
      };
    case "clicks":
      return {
        label: "CLICKS",
        value: compactCount(m.clicks),
        spoken: `${compactCount(m.clicks)} clicks`,
      };
    case "impressions":
      return {
        label: "IMPR",
        value: compactCount(m.impressions),
        spoken: `${compactCount(m.impressions)} impressions`,
      };
    default:
      return { label: "—", value: "—", spoken: "" };
  }
}

export function MobileReportRow({
  entity,
  onOpen,
  thirdMetric,
  isLast = false,
  className,
}: MobileReportRowProps) {
  // A row can be edited in-session (status flipped, budget changed). Reading
  // the override here means the row never contradicts the write store behind
  // it — the same reason `useOverlaidEntity` exists for drawers.
  const override = useEntityOverride(entity.id);
  const status = override?.status ?? entity.status;
  const budgetValue = override?.budgetValue ?? entity.budgetValue;
  const budgetType = override?.budgetType ?? entity.budgetType;
  const wasEdited = override?.updatedAt != null;

  const { symbol } = currencyForCountry(entity.country);
  const metric = thirdMetric ?? THIRD_METRIC_BY_LEVEL[entity.level] ?? "cpa";

  const isPaused = status === "Paused";
  const isArchived = status === "Archived";

  const spend: Slot = {
    label: "SPEND",
    value: compactMoney(entity.metrics.spend, symbol),
    spoken: `spend ${compactMoney(entity.metrics.spend, symbol)}`,
  };
  const roas: Slot = {
    label: "ROAS",
    value: entity.metrics.roas > 0 ? `${entity.metrics.roas.toFixed(2)}x` : "—",
    spoken:
      entity.metrics.roas > 0
        ? `return on ad spend ${entity.metrics.roas.toFixed(2)} times`
        : "no return on ad spend",
  };
  const third = buildThirdSlot(
    { ...entity, status, budgetValue, budgetType },
    metric,
    symbol,
  );

  const slots: Slot[] = [spend, roas, third];

  // Status is spelled out in words here — channel 2 of 3. Screen-reader users
  // never depend on the dot's hue.
  const ariaLabel = [
    entity.name,
    status,
    wasEdited ? "edited this session" : null,
    spend.spoken,
    roas.spoken,
    third.spoken,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <button
      type="button"
      onClick={() => onOpen(entity)}
      aria-label={ariaLabel}
      className={cn(
        // The WHOLE row is the target: ~76px tall × full width. Far beyond the
        // 44px WCAG 2.5.5 floor, and it removes the "which bit do I tap?"
        // question entirely (Fitts's law — the largest possible target).
        "flex min-h-[76px] w-full items-center gap-3 px-4 py-3 text-left",
        "transition-colors active:bg-muted/60 hover:bg-muted/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        !isLast && "border-b border-border",
        // Channel 2 for Archived: the row itself recedes.
        isArchived && "opacity-60",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {/* Line 1 — status dot + name (+ archived word / edited marker) */}
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              STATUS_DOT[status] ?? "bg-muted-foreground",
            )}
          />
          <span
            className={cn(
              "truncate text-[14px] font-medium leading-tight",
              // Channel 2 for Paused: the name dims. Reads as "not running"
              // even in greyscale.
              isPaused || isArchived ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {entity.name}
          </span>
          {isArchived && (
            <span className="shrink-0 font-mono text-[9px] uppercase tracking-wide text-destructive">
              Archived
            </span>
          )}
          {wasEdited && !isArchived && (
            <span className="shrink-0 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
              Edited
            </span>
          )}
        </div>

        {/* Line 2 — three metric slots, label over value */}
        <div className="mt-2 grid grid-cols-3 gap-2">
          {slots.map((s, i) => (
            <div key={`${s.label}-${i}`} className="min-w-0">
              <div className="truncate font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
                {s.label}
              </div>
              <div className="truncate font-mono text-[13px] tabular-nums leading-tight text-foreground">
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ChevronRight
        aria-hidden="true"
        className="h-4 w-4 shrink-0 text-muted-foreground"
      />
    </button>
  );
}
