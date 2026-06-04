/**
 * Bulk Launch Distribution — final Confirm dialog (Step 3).
 *
 * Small, decisive. Two variants:
 *   - Fill First / Equal: "Launch N Ads" + a compact per-pair list.
 *   - Duplicate:          "Duplicate N Ads to P pairs" + per-currency budget
 *     before -> after + an are-you-sure line (it multiplies spend).
 *
 * It shows target_pairs_count and unique_pages_count SEPARATELY (a single page
 * shared across two accounts is two pairs but one page — never conflated).
 *
 * SAFETY: validateStrategy is re-run BOTH on open AND again immediately before
 * invoking execute. If capacity flipped invalid since Preview (e.g. another
 * launch consumed slots), the confirm ABORTS — it never launches a stale,
 * now-invalid distribution.
 *
 * Execute path: reuses the exact launch-execute invocation from LaunchPreviewModal
 * (supabase.functions.invoke("launch-execute", { body: { launch_id } })).
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  validateStrategy,
  computeOutputCount,
  budgetByCurrency,
  targetPairsCount,
  uniquePagesCount,
  type LaunchStrategy,
  type TargetPair,
  type PageCapacity,
  type DistAdset,
} from "@/lib/launch-distribution";
import type { LaunchFull } from "@/hooks/use-launch-data";
import type { SelectionRollup } from "@/lib/launch-selection-rollup";
import { budgetDelta } from "./distribution/distribution-view-helpers";

interface LaunchConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  launch: LaunchFull;
  rollup: SelectionRollup;
  strategy: LaunchStrategy;
  targetPairs: TargetPair[];
  capacities: PageCapacity[];
  distAdsets: DistAdset[];
  overflowAsPaused: boolean;
}

export function LaunchConfirmDialog({
  open,
  onClose,
  launch,
  rollup,
  strategy,
  targetPairs,
  capacities,
  distAdsets,
  overflowAsPaused,
}: LaunchConfirmDialogProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [staleInvalid, setStaleInvalid] = useState(false);

  const selectedAdCount = rollup.adIds.length;
  const pairCount = targetPairsCount(targetPairs);
  const pageCount = uniquePagesCount(targetPairs);
  const outputCount = computeOutputCount(strategy, selectedAdCount, pairCount);
  const isDuplicate = strategy === "duplicate";

  // Validate on OPEN (and whenever inputs change while open).
  const validation = validateStrategy(strategy, rollup.statusSplit, targetPairs, capacities);
  useEffect(() => {
    if (open) setStaleInvalid(!validation.available);
  }, [open, validation.available]);

  const budgets = budgetByCurrency(
    rollup.statusSplit.active
      .concat(rollup.statusSplit.scheduled)
      .concat(rollup.statusSplit.paused),
    distAdsets,
    strategy,
    pairCount
  );

  const handleConfirm = async () => {
    // Re-run validation IMMEDIATELY before execute — abort if it flipped invalid.
    const recheck = validateStrategy(strategy, rollup.statusSplit, targetPairs, capacities);
    if (!recheck.available) {
      setStaleInvalid(true);
      toast({
        title: "Capacity changed",
        description: recheck.reason ?? "This distribution is no longer valid. Adjust and try again.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Persist the distribution decision alongside the existing launch_config,
      // then reuse the SAME launch-execute invocation LaunchPreviewModal uses.
      const existingConfig = (launch.launch_config as Record<string, unknown> | null) ?? {};
      await (supabase as any)
        .from("launches")
        .update({
          launch_config: {
            ...existingConfig,
            distribution_run: {
              strategy,
              target_pairs_count: pairCount,
              unique_pages_count: pageCount,
              selected_ad_count: selectedAdCount,
              output_count: outputCount,
              overflow_as_paused: overflowAsPaused,
            },
          },
        })
        .eq("id", launch.id);

      const { data, error } = await supabase.functions.invoke("launch-execute", {
        body: { launch_id: launch.id },
      });

      if (error) throw error;
      if (data?.status === "failed") {
        toast({ title: "Launch failed", description: "Simulation returned failure.", variant: "destructive" });
        qc.invalidateQueries({ queryKey: ["launch-full", launch.id] });
      } else {
        toast({
          title: isDuplicate ? "Duplication successful!" : "Launch successful!",
        });
        navigate("/launch");
      }
    } catch (err: any) {
      toast({ title: "Launch error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const title = isDuplicate
    ? `Duplicate ${outputCount.toLocaleString()} Ads to ${pairCount} pair${pairCount === 1 ? "" : "s"}`
    : `Launch ${outputCount.toLocaleString()} Ad${outputCount === 1 ? "" : "s"}`;

  const ctaLabel = isDuplicate ? "Duplicate to Pages" : "Launch Ads";

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {isDuplicate
              ? "The same ads will be created once per account-page pair. This multiplies spend."
              : "Selected ads will be distributed across your target pairs and launched."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* pairs vs unique pages — always shown separately. */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-border p-2.5 text-center">
            <div className="text-lg font-bold text-foreground">{pairCount}</div>
            <div className="text-xs text-muted-foreground">Account-page pairs</div>
          </div>
          <div className="rounded-md border border-border p-2.5 text-center">
            <div className="text-lg font-bold text-foreground">{pageCount}</div>
            <div className="text-xs text-muted-foreground">Unique Facebook Pages</div>
          </div>
        </div>

        {/* Variant body */}
        {isDuplicate ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Budget impact per currency</p>
            <div className="space-y-1">
              {budgets.length === 0 && <p className="text-xs text-muted-foreground">No adset budgets to total.</p>}
              {budgets.map((b) => (
                <div key={b.currency} className="flex items-center justify-between rounded-md bg-muted/50 px-2.5 py-1.5">
                  <span className="text-sm font-medium text-foreground">{b.currency}</span>
                  <span className="text-sm text-foreground">{budgetDelta(b)}</span>
                </div>
              ))}
            </div>
            {budgets.some((b) => b.unavailableAdsets > 0) && (
              <p className="text-[11px] text-muted-foreground">
                Some adsets have no budget set and are excluded from the totals above.
              </p>
            )}
            <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2.5">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
              <p className="text-xs text-foreground">
                Are you sure? This creates {outputCount.toLocaleString()} ads ({selectedAdCount} x {pairCount}) and
                multiplies your spend accordingly.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Per-pair allocation</p>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {validation.perPair.map((alloc, i) => (
                <div
                  key={`${alloc.pair.ad_account_id}-${alloc.pair.page_id}-${i}`}
                  className="flex items-center justify-between rounded-md bg-muted/50 px-2.5 py-1.5 text-xs"
                >
                  <span className="truncate text-foreground">
                    <span className="text-muted-foreground">{alloc.pair.account_name}</span> · {alloc.pair.page_name}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {alloc.activeToLaunch} active/scheduled
                    {alloc.scheduledToLaunch > 0 ? ` · ${alloc.scheduledToLaunch} scheduled` : ""}
                    {alloc.pausedToAdd > 0 ? ` · ${alloc.pausedToAdd} paused` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stale-invalid banner (validation flipped since Preview). */}
        {staleInvalid && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-xs text-destructive">
              {validation.reason ?? "This distribution is no longer valid."} Close and adjust your strategy,
              pages, or selection.
            </p>
          </div>
        )}

        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={submitting || staleInvalid || selectedAdCount === 0}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting ? "Working..." : ctaLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
