/**
 * Bulk Launch Distribution — Preview modal (Step 3).
 *
 * Header: strategy, selected ads, final created, active/paused split, and the
 * Duplicate multiplier when applicable. Body: a per-pair allocation table grouped
 * by Ad Account with columns:
 *   Ad Account | Page | Current Active | Available Slots | Active to Launch | Paused to Add | Status
 * built from validation.perPair + the page capacities.
 *
 * Invalid state keeps the table VISIBLE, shows a reason banner, disables the
 * primary, and offers fix actions. It NEVER silently re-allocates — what the core
 * returned is exactly what is shown. The "Create overflow as paused" Switch is
 * rendered ONLY when backendSupportsOverflow is true (default off).
 *
 * Footer: "Back to Table" + a strategy-specific primary that opens the Confirm dialog.
 */
import { Fragment } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";
import {
  validateStrategy,
  computeOutputCount,
  targetPairsCount,
  aggregateCapacityByPage,
  MAX_ADS_PER_PAGE,
  type LaunchStrategy,
  type TargetPair,
  type PageCapacity,
  type PerPairAllocation,
} from "@/lib/launch-distribution";
import type { SelectionRollup } from "@/lib/launch-selection-rollup";
import { strategyLabel, primaryCtaLabel } from "./distribution/distribution-view-helpers";

interface LaunchDistributionPreviewProps {
  open: boolean;
  onClose: () => void;
  rollup: SelectionRollup;
  strategy: LaunchStrategy;
  targetPairs: TargetPair[];
  capacities: PageCapacity[];
  backendSupportsOverflow: boolean;
  overflowAsPaused: boolean;
  onOverflowAsPausedChange: (next: boolean) => void;
  /** Opens the Confirm dialog (parent owns confirm state). */
  onConfirm: () => void;
  onChangeStrategy: () => void;
  onChangePages: () => void;
}

interface PreviewRow {
  pairKey: string;
  accountName: string;
  pageName: string;
  currentActive: number;
  availableSlots: number;
  activeToLaunch: number;
  pausedToAdd: number;
  status: PerPairAllocation["status"];
}

export function LaunchDistributionPreview({
  open,
  onClose,
  rollup,
  strategy,
  targetPairs,
  capacities,
  backendSupportsOverflow,
  overflowAsPaused,
  onOverflowAsPausedChange,
  onConfirm,
  onChangeStrategy,
  onChangePages,
}: LaunchDistributionPreviewProps) {
  const selectedAdCount = rollup.adIds.length;
  const pairCount = targetPairsCount(targetPairs);
  const validation = validateStrategy(strategy, rollup.statusSplit, targetPairs, capacities);
  const outputCount = computeOutputCount(strategy, selectedAdCount, pairCount);
  const isInvalid = !validation.available;

  const capByPage = aggregateCapacityByPage(targetPairs, capacities);

  // Build rows from the core's perPair (which preserves target order, hence
  // account groupings stay contiguous when pairs are ordered by account).
  const rows: PreviewRow[] = validation.perPair.map((alloc, i) => {
    const cap = capByPage.get(alloc.pair.fb_page_id);
    const currentActive = cap ? cap.currentActive : 0;
    const availableSlots = Math.max(0, MAX_ADS_PER_PAGE - currentActive);
    return {
      pairKey: `${alloc.pair.ad_account_id}__${alloc.pair.page_id}__${i}`,
      accountName: alloc.pair.account_name,
      pageName: alloc.pair.page_name,
      currentActive,
      availableSlots,
      activeToLaunch: alloc.activeToLaunch,
      pausedToAdd: alloc.pausedToAdd,
      status: alloc.status,
    };
  });

  // Group rows by account for the "rows grouped by account" requirement: emit an
  // account sub-header row, then its pairs. Order follows first appearance.
  const accountOrder: string[] = [];
  const rowsByAccount = new Map<string, PreviewRow[]>();
  for (const r of rows) {
    if (!rowsByAccount.has(r.accountName)) {
      rowsByAccount.set(r.accountName, []);
      accountOrder.push(r.accountName);
    }
    rowsByAccount.get(r.accountName)!.push(r);
  }

  const activeCount = rollup.statusSplit.active.length;
  const pausedCount = rollup.statusSplit.paused.length;

  const statusBadge = (status: PerPairAllocation["status"]) => {
    if (status === "full") return <Badge variant="destructive" className="text-xs">Full</Badge>;
    if (status === "partial") return <Badge variant="secondary" className="text-xs">Partial</Badge>;
    return <Badge variant="outline" className="text-xs">OK</Badge>;
  };

  const COL_COUNT = 7;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Distribution Preview</DialogTitle>
          <DialogDescription>
            Review how selected ads will be distributed across account-page pairs before launching.
          </DialogDescription>
        </DialogHeader>

        {/* Header stat cards */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-md border border-border p-3">
            <div className="text-xs text-muted-foreground">Strategy</div>
            <div className="text-sm font-semibold text-foreground">{strategyLabel(strategy)}</div>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="text-xs text-muted-foreground">Selected</div>
            <div className="text-lg font-bold text-foreground">{selectedAdCount.toLocaleString()}</div>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="text-xs text-muted-foreground">Final created</div>
            <div className="text-lg font-bold text-foreground">
              {outputCount.toLocaleString()}
              {strategy === "duplicate" && pairCount > 0 && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">x{pairCount}</span>
              )}
            </div>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="text-xs text-muted-foreground">Active / Paused</div>
            <div className="text-sm font-semibold text-foreground">
              {activeCount} / {pausedCount}
            </div>
          </div>
        </div>

        {/* Invalid reason banner — table stays visible below. */}
        {isInvalid && (
          <div className="flex flex-col gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{validation.reason ?? "This distribution can't fit."}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onChangeStrategy}>
                Change Strategy
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onChangePages}>
                Change Pages
              </Button>
            </div>
          </div>
        )}

        {/* Per-pair table, grouped by Ad Account. */}
        <div className="rounded-md border border-border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px]">Ad Account</TableHead>
                <TableHead className="min-w-[140px]">Page</TableHead>
                <TableHead className="w-28 text-right">Current Active</TableHead>
                <TableHead className="w-28 text-right">Available Slots</TableHead>
                <TableHead className="w-28 text-right">Active to Launch</TableHead>
                <TableHead className="w-28 text-right">Paused to Add</TableHead>
                <TableHead className="w-20">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={COL_COUNT} className="py-8 text-center text-sm text-muted-foreground">
                    No target pairs configured. Set pages in Step 1.
                  </TableCell>
                </TableRow>
              )}
              {accountOrder.map((accountName) => {
                const accountRows = rowsByAccount.get(accountName)!;
                return (
                  <Fragment key={`acc-${accountName}`}>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableCell colSpan={COL_COUNT} className="py-1.5 text-xs font-semibold text-muted-foreground">
                        {accountName}
                      </TableCell>
                    </TableRow>
                    {accountRows.map((r) => (
                      <TableRow key={r.pairKey}>
                        <TableCell className="text-sm text-muted-foreground">{r.accountName}</TableCell>
                        <TableCell className="text-sm">{r.pageName}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums">{r.currentActive}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums">{r.availableSlots}</TableCell>
                        <TableCell className="text-right text-sm font-medium tabular-nums">
                          {r.activeToLaunch}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">{r.pausedToAdd}</TableCell>
                        <TableCell>{statusBadge(r.status)}</TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Overflow toggle — only when the backend supports it. */}
        {backendSupportsOverflow && (
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Create overflow as paused</Label>
              <p className="text-xs text-muted-foreground">
                Ads that exceed a page's active limit are created paused instead of being dropped.
              </p>
            </div>
            <Switch checked={overflowAsPaused} onCheckedChange={onOverflowAsPausedChange} />
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between border-t border-border pt-2">
          <Button variant="outline" onClick={onClose}>
            Back to Table
          </Button>
          <Button onClick={onConfirm} disabled={isInvalid || selectedAdCount === 0}>
            {primaryCtaLabel(strategy)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
