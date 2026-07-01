/**
 * CapMeterWithFixes — the central mirror of ALL Step-3 distribution errors
 * (STEP3_ERROR_MODEL.md §5.1 / §6.3).
 *
 * `distributionErrors(plan)` is the single source of truth (page-split +
 * creative-dist + structure + cap-meter + page-scoped anchors, all of it).
 * This component mirrors every item here — not just the cap-family ones —
 * so the meter always reflects the full picture even if a per-control inline
 * slot elsewhere on the page hasn't rendered its own copy yet.
 *
 * Severity styling: hard cap-breach (tier "error") = ERROR/red
 * (#ff4d4f fill / #cf1322 text), never amber. Warnings stay amber, info blue.
 * Icon is distinct per tier (not color-only): AlertCircle / AlertTriangle / Info.
 *
 * Canonical slots-left: ONE number everywhere — `250 − activeAds` (pre-demand),
 * summed only for display; per-page numbers come straight off `placement()`.
 */
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { placement, type PageDemand } from "../../../deriveV2";
import { distributionErrors, type DistError, type DistTier } from "../../../distributionErrors";
import { MAX_ADS_PER_PAGE, type PlanV2 } from "../../../types";
import type { UseFlowV2 } from "../../../state/useFlowV2";
import { DistFixControls } from "./DistFixControls";

/* ------------------------------------------------------------------ *
 * Tier → visual language (design-system §8: distinct icon per tier,
 * error/red never amber for hard breaches, dark/light parity).
 * ------------------------------------------------------------------ */

const TIER_ICON: Record<DistTier, typeof AlertCircle> = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const TIER_STYLES: Record<
  DistTier,
  { border: string; bg: string; icon: string; text: string; chip: string; chipText: string }
> = {
  error: {
    border: "border-[#ffccc7] dark:border-[#5c2223]",
    bg: "bg-[#fff1f0] dark:bg-[#2a1215]",
    icon: "text-[#cf1322] dark:text-[#ff7875]",
    text: "text-[#cf1322] dark:text-[#ff7875]",
    chip: "bg-[#ff4d4f] dark:bg-[#a61d24]",
    chipText: "text-white",
  },
  warning: {
    border: "border-amber-300/60 dark:border-amber-800/40",
    bg: "bg-amber-50/60 dark:bg-amber-950/30",
    icon: "text-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    chip: "bg-amber-200/80 dark:bg-amber-900/60",
    chipText: "text-amber-800 dark:text-amber-300",
  },
  info: {
    border: "border-sky-300/60 dark:border-sky-800/40",
    bg: "bg-sky-50/60 dark:bg-sky-950/30",
    icon: "text-sky-500",
    text: "text-sky-700 dark:text-sky-400",
    chip: "bg-sky-200/80 dark:bg-sky-900/60",
    chipText: "text-sky-800 dark:text-sky-300",
  },
};

const TIER_RANK: Record<DistTier, number> = { error: 0, warning: 1, info: 2 };

export default function CapMeterWithFixes({ flow }: { flow: UseFlowV2 }) {
  const { plan, patch } = flow;
  const pl = placement(plan);
  const errors = distributionErrors(plan);

  // Vacuous green tick guard — an empty plan has nothing to breach, which is
  // not the same as "verified under cap." Show a softer "not meaningful" state.
  const isVacuousOk = plan.targets.length === 0;
  const hasErrors = errors.some((e) => e.tier === "error");
  const hasWarnings = errors.some((e) => e.tier === "warning");
  const allClear = !isVacuousOk && errors.length === 0;

  // ONE canonical slots-left number: 250 − activeAds, summed pre-demand across
  // the unique selected pages (matches the always-on slots chip elsewhere).
  const slotsLeft = pl.perPage.reduce(
    (sum, p) => sum + Math.max(0, MAX_ADS_PER_PAGE - p.current),
    0
  );

  const sorted = [...errors].sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier]);

  const runApply = (patchObj: Partial<PlanV2>) => {
    if (Object.keys(patchObj).length > 0) patch(patchObj);
    // Structural fixes (add_page / split_launch / change_page / goto / retry /
    // acknowledge) return {} by contract — the surrounding Step-3 screen owns
    // navigation for those; this meter never dead-ends the tap (Nielsen #9),
    // it just has nothing further to mutate locally.
  };

  return (
    <div className="space-y-2">
      {/* Status line */}
      {isVacuousOk ? (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200/70 bg-amber-50/40 dark:border-amber-800/40 dark:bg-amber-950/20 px-3 py-2">
          <Info className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span className="text-xs text-amber-700 dark:text-amber-400">
            No destinations picked yet — cap check not meaningful.
          </span>
        </div>
      ) : (
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl border px-3 py-2",
            hasErrors
              ? cn(TIER_STYLES.error.border, TIER_STYLES.error.bg)
              : hasWarnings
                ? cn(TIER_STYLES.warning.border, TIER_STYLES.warning.bg)
                : "border-border bg-muted/20"
          )}
        >
          {hasErrors ? (
            <AlertCircle className={cn("h-3.5 w-3.5 shrink-0", TIER_STYLES.error.icon)} />
          ) : hasWarnings ? (
            <AlertTriangle className={cn("h-3.5 w-3.5 shrink-0", TIER_STYLES.warning.icon)} />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
          )}
          <span
            className={cn(
              "text-xs",
              hasErrors
                ? TIER_STYLES.error.text
                : hasWarnings
                  ? TIER_STYLES.warning.text
                  : "text-muted-foreground"
            )}
          >
            {allClear
              ? "All Pages under cap (250 ads each)."
              : `${errors.length} issue${errors.length !== 1 ? "s" : ""} — ${errors.filter((e) => e.tier === "error").length} blocking`}
          </span>
          <span className="ml-auto shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
            {slotsLeft} slot{slotsLeft !== 1 ? "s" : ""} left
          </span>
        </div>
      )}

      {/* Per-page offender readout — canonical current/demand/available from placement(). */}
      {!isVacuousOk && pl.perPage.some((p) => p.demand > p.available) && (
        <div className="space-y-1.5">
          {pl.perPage
            .filter((p: PageDemand) => p.demand > p.available)
            .map((off) => {
              const overBy = off.current + off.demand - MAX_ADS_PER_PAGE;
              return (
                <div
                  key={off.fbPageId}
                  className={cn(
                    "flex items-start justify-between gap-2 rounded-lg border px-2.5 py-1.5",
                    TIER_STYLES.error.border,
                    TIER_STYLES.error.bg
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{off.pageName}</p>
                    <p className={cn("font-mono text-[11px] tabular-nums", TIER_STYLES.error.text)}>
                      {off.current} live + {off.demand} new = {off.current + off.demand}
                      <span className="ml-1 font-sans text-[10px]">(over by {overBy})</span>
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] tabular-nums",
                      TIER_STYLES.error.chip,
                      TIER_STYLES.error.chipText
                    )}
                  >
                    {off.available} left
                  </span>
                </div>
              );
            })}
        </div>
      )}

      {/* Full DistError mirror — every code from distributionErrors(plan), with
          expanded one-tap fix buttons. Sorted error → warning → info. */}
      {sorted.length > 0 && (
        <div className="space-y-2">
          {sorted.map((err) => (
            <DistErrorCard key={err.id} error={err} plan={plan} onApply={runApply} />
          ))}
        </div>
      )}
    </div>
  );
}

function DistErrorCard({
  error,
  plan,
  onApply,
}: {
  error: DistError;
  plan: PlanV2;
  onApply: (patch: Partial<PlanV2>) => void;
}) {
  const styles = TIER_STYLES[error.tier];
  const Icon = TIER_ICON[error.tier];

  return (
    <div className={cn("rounded-xl border p-3 space-y-2", styles.border, styles.bg)}>
      <div className="flex items-start gap-2">
        <Icon className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", styles.icon)} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className={cn("text-xs font-medium", styles.text)}>{error.title}</p>
            <span className="rounded border border-current/20 px-1 py-px font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
              {error.code}
            </span>
            {error.provisional && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-px font-mono text-[9px] uppercase tracking-wide",
                  styles.chip,
                  styles.chipText
                )}
                title="Cross-account aggregation — re-checked at Review"
              >
                [I]
              </span>
            )}
          </div>
          <p className={cn("text-[11px] mt-0.5", styles.text)}>{error.message}</p>
        </div>
      </div>

      {error.fixes.length > 0 && (
        <div className="pl-5">
          <DistFixControls error={error} plan={plan} onApply={onApply} />
        </div>
      )}
    </div>
  );
}
