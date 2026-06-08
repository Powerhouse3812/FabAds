/**
 * CapMeterWithFixes — extracted from LivePreview.tsx.
 * Renders the cap status + (when over) per-page offender list + 1-click fix buttons.
 *
 * Wave 2 hardening:
 *  - Probe each candidate page distribution BEFORE rendering its fix button —
 *    never suggest a switch that wouldn't actually clear the cap.
 *  - Show an explicit escalation message when no distribution mode can fix the
 *    cap with the current structure (so the user knows to reduce structure
 *    instead of clicking buttons that won't help).
 *  - Soften the green tick when the plan has zero targets — ok=true on an
 *    empty plan is vacuously true and was misleading.
 */
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { capCheck } from "../../../deriveV2";
import type { UseFlowV2 } from "../../../state/useFlowV2";
import type { PageDistribution } from "../../../types";

export default function CapMeterWithFixes({ flow }: { flow: UseFlowV2 }) {
  const { plan, patch } = flow;
  const cap = capCheck(plan);

  // Probe each candidate distribution mode — only suggest a switch when the
  // probe shows the cap would actually clear. This stops the misleading
  // "Switch to Fill First / Equal Split" buttons that appeared whenever
  // cap.ok was false, even if neither switch would help.
  const candidateModes: PageDistribution[] = ["fill_first", "equal"];
  const viableFixes = candidateModes.filter((mode) => {
    if (mode === plan.pageDistribution) return false; // skip current mode
    return capCheck({ ...plan, pageDistribution: mode }).ok;
  });

  // Vacuous green tick guard — capCheck returns ok=true on an empty plan,
  // which lies to the user. Show a softer "not meaningful" status instead.
  const isVacuousOk = cap.ok && plan.targets.length === 0;

  return (
    <div className="space-y-2">
      {isVacuousOk ? (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200/70 bg-amber-50/40 dark:border-amber-800/40 dark:bg-amber-950/20 px-3 py-2">
          <Info className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-xs text-amber-700 dark:text-amber-400">
            No destinations picked yet — cap check not meaningful.
          </span>
        </div>
      ) : (
        <div className={cn(
          "flex items-center gap-2 rounded-xl border px-3 py-2",
          cap.ok
            ? "border-border bg-muted/20"
            : "border-amber-300/60 bg-amber-50/40 dark:border-amber-800/40 dark:bg-amber-950/20"
        )}>
          {cap.ok ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          )}
          <span className={cn(
            "text-xs",
            cap.ok ? "text-muted-foreground" : "text-amber-700 dark:text-amber-400"
          )}>
            {cap.ok ? "All pages under the 250-ad cap" : `${cap.offenders.length} page${cap.offenders.length !== 1 ? "s" : ""} over limit`}
          </span>
        </div>
      )}

      {!cap.ok && (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 dark:border-amber-800/50 dark:bg-amber-950/30 p-3 space-y-3">
          <div className="space-y-2">
            {cap.offenders.map((off) => {
              const overBy = (off.current + off.demand) - 250;
              return (
                <div key={off.fbPageId} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{off.pageName}</p>
                    <p className="font-mono text-[11px] text-amber-700 dark:text-amber-400 tabular-nums">
                      {off.current} live + {off.demand} new = {off.current + off.demand}
                      <span className="ml-1 font-sans text-[10px]">(over by {overBy})</span>
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-200/80 dark:bg-amber-900/60 px-2 py-0.5 font-mono text-[10px] text-amber-800 dark:text-amber-300 tabular-nums">
                    {off.available} left
                  </span>
                </div>
              );
            })}
          </div>

          {viableFixes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <p className="w-full text-[11px] text-amber-700 dark:text-amber-400">
                Fix options — one click applies immediately:
              </p>
              {viableFixes.includes("fill_first") && (
                <button
                  type="button"
                  onClick={() => patch({ pageDistribution: "fill_first" })}
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white dark:bg-amber-950/50 px-3 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/40 transition-colors"
                >
                  Switch to Fill First
                </button>
              )}
              {viableFixes.includes("equal") && (
                <button
                  type="button"
                  onClick={() => patch({ pageDistribution: "equal" })}
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white dark:bg-amber-950/50 px-3 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/40 transition-colors"
                >
                  Switch to Equal Split
                </button>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              No distribution mode clears the cap with current structure. Try reducing structure (fewer ads/set) or dropping a near-full page.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
