/**
 * ManageSubscriptionModal — Owned by Agent D.
 *
 * URL-driven via `?manage=open`. Renders a Dialog listing every active
 * subscription line (base plan + add-ons + trials). User toggles
 * cancellations per line; a running total recalculates live; banner
 * explains "changes apply next cycle, current paid period continues".
 * Footer: Cancel (discards staged changes) / Save changes (opens a
 * confirmation AlertDialog before committing). On confirm → toast +
 * close modal. Base plan row is non-cancellable (use Plans page).
 *
 * Data from `mock-data.ts` — SUBSCRIPTION_LINES.
 *
 * Props are minimal: the modal manages its own open state from the URL.
 */
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Info, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  SUBSCRIPTION_LINES,
  type SubscriptionLine,
} from "./mock-data";

const NEXT_CYCLE_DATE = "26 July 2025";
const NEXT_CYCLE_SHORT = "26 Jul 2025";

/** Format the right-column price label for a line. */
function formatLinePrice(line: SubscriptionLine): string {
  if (line.kind === "trial") return "Free trial";
  if (line.billingLabel === "one-time") return "one-time";
  return `$${line.monthlyContributionUsd.toFixed(2)}/mo`;
}

function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

const KIND_LABEL: Record<SubscriptionLine["kind"], string> = {
  plan: "PLAN",
  addon: "ADD-ON",
  trial: "TRIAL",
};

export function ManageSubscriptionModal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isOpen = searchParams.get("manage") === "open";

  // Local editing state — transient, not URL-backed.
  const [stagedCancels, setStagedCancels] = useState<Set<string>>(new Set());
  const [autoRenewCredits, setAutoRenewCredits] = useState<boolean>(
    SUBSCRIPTION_LINES.find((l) => l.id === "addon-iq-credits")?.autoRenew ??
      true,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Reset all staged edits — used when discarding or after commit.
  const resetStaged = useCallback(() => {
    setStagedCancels(new Set());
    setAutoRenewCredits(
      SUBSCRIPTION_LINES.find((l) => l.id === "addon-iq-credits")?.autoRenew ??
        true,
    );
  }, []);

  const close = useCallback(() => {
    resetStaged();
    setConfirmOpen(false);
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.delete("manage");
        return sp;
      },
      { replace: false },
    );
  }, [resetStaged, setSearchParams]);

  const toggleCancel = useCallback((id: string) => {
    setStagedCancels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ── Derived totals ──────────────────────────────────────────────
  const previousMonthlyTotal = useMemo(
    () =>
      SUBSCRIPTION_LINES.reduce(
        (sum, l) => (l.kind === "trial" ? sum : sum + l.monthlyContributionUsd),
        0,
      ),
    [],
  );

  const newMonthlyTotal = useMemo(
    () =>
      SUBSCRIPTION_LINES.reduce((sum, l) => {
        if (l.kind === "trial") return sum;
        if (stagedCancels.has(l.id)) return sum;
        return sum + l.monthlyContributionUsd;
      }, 0),
    [stagedCancels],
  );

  const delta = previousMonthlyTotal - newMonthlyTotal;

  const initialAutoRenew =
    SUBSCRIPTION_LINES.find((l) => l.id === "addon-iq-credits")?.autoRenew ??
    true;
  const autoRenewChanged = autoRenewCredits !== initialAutoRenew;

  const hasStagedChanges = stagedCancels.size > 0 || autoRenewChanged;

  // ── Confirmation summary copy ───────────────────────────────────
  const cancelNames = SUBSCRIPTION_LINES.filter((l) =>
    stagedCancels.has(l.id),
  ).map((l) => l.name);

  const confirmDescription = (() => {
    const parts: string[] = [];
    if (cancelNames.length > 0) {
      parts.push(`You'll cancel: ${cancelNames.join(" · ")}.`);
    }
    if (autoRenewChanged) {
      parts.push(
        `Auto-renew on IQ Credits will be turned ${
          autoRenewCredits ? "on" : "off"
        }.`,
      );
    }
    parts.push(`New monthly total: ${formatUsd(newMonthlyTotal)}.`);
    parts.push(`Changes take effect ${NEXT_CYCLE_DATE}.`);
    return parts.join(" ");
  })();

  const handleConfirm = useCallback(() => {
    toast.success(
      `Subscription updated — changes apply ${NEXT_CYCLE_SHORT}.`,
    );
    close();
  }, [close]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="max-w-xl gap-0 p-0 font-sans">
        <DialogHeader className="space-y-1.5 border-b border-border/60 px-6 py-5">
          <DialogTitle className="text-base font-semibold tracking-tight">
            Manage subscription
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Toggle off any add-on or trial below. Changes apply on your next
            billing cycle — your current paid period continues uninterrupted.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-5">
          {/* Subscription lines */}
          <ul className="space-y-2">
            {SUBSCRIPTION_LINES.map((line) => {
              const isStaged = stagedCancels.has(line.id);
              const isLocked = !line.cancellable;
              const showAutoRenewRow = line.id === "addon-iq-credits";

              return (
                <li
                  key={line.id}
                  className={cn(
                    "flex items-start gap-3 rounded-md border border-border/60 p-3 transition-colors",
                    isStaged && "bg-muted/50",
                  )}
                >
                  {/* LEFT */}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-semibold text-foreground",
                          isStaged && "text-muted-foreground line-through",
                        )}
                      >
                        {line.name}
                      </span>
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {KIND_LABEL[line.kind]}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "text-xs text-muted-foreground",
                        isStaged && "line-through",
                      )}
                    >
                      {line.description}
                    </p>

                    {showAutoRenewRow && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <Switch
                          id="autorenew-iq-credits"
                          checked={autoRenewCredits}
                          onCheckedChange={setAutoRenewCredits}
                          className="h-4 w-7 [&>span]:h-3 [&>span]:w-3 [&>span]:data-[state=checked]:translate-x-3"
                          disabled={isStaged}
                        />
                        <label
                          htmlFor="autorenew-iq-credits"
                          className="cursor-pointer text-xs text-muted-foreground"
                        >
                          Auto-renew when balance drops below 20 credits
                        </label>
                      </div>
                    )}
                  </div>

                  {/* MIDDLE — price */}
                  <div
                    className={cn(
                      "shrink-0 self-center text-right font-mono text-xs tabular-nums",
                      isStaged ? "text-muted-foreground line-through" : "text-foreground",
                    )}
                  >
                    {formatLinePrice(line)}
                  </div>

                  {/* RIGHT — cancel control */}
                  <div className="shrink-0 self-center">
                    {isLocked ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="h-7 gap-1 px-2 text-xs"
                        >
                          <Lock className="h-3 w-3" />
                          Cancel
                        </Button>
                        {line.lockedReason && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                aria-label="Why is this locked?"
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="left"
                              className="max-w-[220px] text-xs"
                            >
                              {line.lockedReason}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleCancel(line.id)}
                        className="h-7 px-2 text-xs"
                      >
                        {isStaged ? "Undo" : "Cancel"}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Banner */}
          <div className="rounded-md border border-primary/30 bg-primary/10 p-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-foreground/60">
              Heads up
            </div>
            <p className="mt-1 text-xs text-foreground">
              Changes apply from next billing cycle ({NEXT_CYCLE_DATE}). Your
              current paid period continues uninterrupted.
            </p>
          </div>

          {/* Running total */}
          <div className="border-t border-border/60 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                New monthly total
              </span>
              <div className="flex items-center gap-2">
                {delta > 0.0001 && (
                  <span className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] font-medium text-foreground">
                    − {formatUsd(delta)}/mo
                  </span>
                )}
                <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                  {formatUsd(newMonthlyTotal)}/mo
                </span>
              </div>
            </div>
            {autoRenewChanged && (
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Auto-renew</span>
                <span className="font-mono tabular-nums">
                  {autoRenewCredits ? "on" : "off"}
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-2 border-t border-border/60 px-6 py-4 sm:flex-row sm:justify-between sm:space-x-0">
          <span className="text-xs text-muted-foreground">
            {stagedCancels.size > 0
              ? `${stagedCancels.size} selected to cancel`
              : ""}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={close}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!hasStagedChanges}
              onClick={() => setConfirmOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Save changes
            </Button>
          </div>
        </DialogFooter>

        {/*
         * Nested confirmation — Radix handles portal stacking so the
         * AlertDialog renders above the parent Dialog without z-index war.
         */}
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent className="font-sans">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm subscription changes?</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmDescription}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Go back</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Confirm changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
