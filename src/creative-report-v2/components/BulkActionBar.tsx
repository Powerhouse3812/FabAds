/**
 * BulkActionBar — appears when creatives are selected in the grid. Bulk
 * Pause (friction: a quick confirm) or Launch (optimistic queue). Floats above
 * the grid so it's reachable without scrolling.
 *
 * v3 only (see useReportWorkflowsEnabled): also offers a manual "Sync to
 * library" action. This is the pre-flight Maalik asked for — a multi-select
 * sync can silently re-upload creatives a *different* automation already put
 * in an account, so before the user confirms, the picker shows the real
 * already-there count per account (AccountPicker) plus one honest summary
 * line for the accounts actually chosen. Real counts only, never a guess.
 */
import { useMemo, useState } from "react";
import { Pause, RefreshCw, Rocket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { pauseMany, queueManyInLaunch } from "@/creative-report-v2/actions/actionStore";
import { pluralize } from "@/creative-report-v2/lib/format";
import { useReportWorkflowsEnabled } from "@/creative-report-v2/state/ReportBasePathContext";
import { enqueueSyncMany, useSyncStore } from "@/creative-report-v2/automations/sync/syncStore";
import { summariseSelection } from "@/creative-report-v2/automations/sync/selectors";
import { AccountPicker } from "@/creative-report-v2/automations/components/AccountPicker";
import { ACCOUNT_BY_ID } from "@/data/accounts";

export function BulkActionBar({
  selectedIds,
  onClear,
}: {
  selectedIds: string[];
  onClear: () => void;
}) {
  // Hooks must run every render regardless of selection size, so all of them
  // (including the early-return check below) come before the `return null`.
  const workflowsEnabled = useReportWorkflowsEnabled();
  const syncState = useSyncStore();
  const [syncOpen, setSyncOpen] = useState(false);
  const [chosenAccountIds, setChosenAccountIds] = useState<string[]>([]);

  // `selectedIds` is a fresh array every render (the parent spreads a Set),
  // so the array identity can't be a useMemo dependency — it would never hit
  // and summariseSelection (which builds a new object per call, per its own
  // header) would re-run every render for nothing. Keying on the joined id
  // string gives a stable primitive that only changes when the actual
  // selection does.
  const selectedKey = selectedIds.join(",");
  const selectionSummary = useMemo(
    () => summariseSelection(syncState, selectedIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectedKey stands in for selectedIds' contents
    [syncState, selectedKey],
  );

  if (selectedIds.length === 0) return null;

  const doPause = () => {
    pauseMany(selectedIds);
    toast({ title: `Paused ${pluralize(selectedIds.length, "creative")}`, description: "Simulated bulk pause." });
    onClear();
  };
  const doLaunch = () => {
    queueManyInLaunch(selectedIds);
    toast({
      title: `Queued ${pluralize(selectedIds.length, "creative")} in Launch`,
      description: "Sent to Launch 2.0 (simulated).",
    });
    onClear();
  };

  const totalSelected = selectionSummary.totalSelected;
  const chosenTotalPairs = totalSelected * chosenAccountIds.length;
  const chosenAlreadyPairs = chosenAccountIds.reduce(
    (sum, accountId) => sum + (selectionSummary.alreadyByAccount[accountId]?.length ?? 0),
    0,
  );

  const preflightLine = (() => {
    if (chosenAccountIds.length === 0) return "Choose at least one account to see how many are already there.";
    if (chosenAccountIds.length === 1) {
      const name = ACCOUNT_BY_ID[chosenAccountIds[0]]?.name ?? "the selected account";
      if (chosenAlreadyPairs === 0) return `None of the ${totalSelected} selected are already in ${name} — all will sync.`;
      return `${chosenAlreadyPairs} of ${totalSelected} are already in ${name} — they'll be skipped.`;
    }
    if (chosenAlreadyPairs === 0) {
      return `None of the ${chosenTotalPairs} selected creative-account pairs are already synced — all will sync.`;
    }
    return `${chosenAlreadyPairs} of ${chosenTotalPairs} selected creative-account pairs are already synced — they'll be skipped.`;
  })();

  const doSync = () => {
    if (chosenAccountIds.length === 0) return;
    const { queued, skipped } = enqueueSyncMany(selectedIds, chosenAccountIds, {
      ruleId: null,
      ruleName: "Manual sync",
    });
    if (queued === 0) {
      toast({
        title: "Nothing to sync",
        description: `All ${pluralize(skipped, "pair")} were already synced — nothing queued (simulated).`,
      });
    } else if (skipped > 0) {
      toast({
        title: `Queued ${pluralize(queued, "pair")} for sync`,
        description: `${pluralize(skipped, "pair")} already synced were skipped (simulated).`,
      });
    } else {
      toast({
        title: `Queued ${pluralize(queued, "pair")} for sync`,
        description: "Sent to the sync queue (simulated).",
      });
    }
    setSyncOpen(false);
    setChosenAccountIds([]);
    onClear();
  };

  return (
    <div className="sticky bottom-4 z-20 mx-auto flex w-fit items-center gap-3 rounded-full border border-border bg-card px-3 py-2 shadow-lg">
      <span className="pl-1 text-sm font-medium text-foreground">
        {pluralize(selectedIds.length, "creative")} selected
      </span>
      <div className="h-4 w-px bg-border" />
      <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={doPause}>
        <Pause className="h-4 w-4" /> Pause
      </Button>
      <Button size="sm" className="h-8 gap-1.5" onClick={doLaunch}>
        <Rocket className="h-4 w-4" /> Launch
      </Button>
      {workflowsEnabled && (
        <Popover open={syncOpen} onOpenChange={setSyncOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5">
              <RefreshCw className="h-4 w-4" /> Sync to library
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="center" className="w-80 space-y-3 p-4">
            <p className="text-sm font-medium text-foreground">Sync to library</p>
            <AccountPicker
              selected={chosenAccountIds}
              onChange={setChosenAccountIds}
              alreadyByAccount={selectionSummary.alreadyByAccount}
              totalSelected={totalSelected}
            />
            <p className="text-xs text-muted-foreground">{preflightLine}</p>
            <Button size="sm" className="h-8 w-full" onClick={doSync} disabled={chosenAccountIds.length === 0}>
              Sync {pluralize(totalSelected, "creative")}
            </Button>
          </PopoverContent>
        </Popover>
      )}
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClear} aria-label="Clear selection">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
