/**
 * ManageSubscriptionModal — A-12.183 URL-state pass.
 *
 * Every interactive state in this modal is now URL-backed so deep-link /
 * refresh / back-forward all reconstruct the exact view. Matches the
 * maximalist URL-state pattern Maalik shipped across Industry Insights
 * (A-12.179).
 *
 * URL contract:
 *   ?manage=open                  — modal open at step 1 (edit subscriptions)
 *   ?manage=confirm               — modal open at step 2 (confirm AlertDialog
 *                                   stacked over the editor; back button
 *                                   returns to step 1)
 *   ?cancel=id1,id2,id3           — staged cancellations (Set serialised as
 *                                   comma-separated IDs; omit when empty)
 *   ?autorenew=off                — IQ Credits auto-renew explicit off
 *                                   (omit when "on" = the default)
 *
 * Writes use { replace: false } so the back button:
 *   - from confirm → editor (Save → Go back)
 *   - from editor → modal closed (X / Esc / backdrop / Cancel)
 *   - from a staged Cancel → restored state
 * all step naturally through history.
 *
 * Visual layer (sections + hero total + hover-revealed cancel buttons)
 * unchanged from A-12.182 — that hierarchy redesign stays.
 */
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, Info, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

const KIND_LABEL: Record<SubscriptionLine["kind"], string> = {
  plan: "Plan",
  addon: "Add-on",
  trial: "Trial",
};

function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatLinePrice(line: SubscriptionLine): string {
  if (line.kind === "trial") return "Free";
  if (line.billingLabel === "one-time") return "one-time";
  return `${formatUsd(line.monthlyContributionUsd)}/mo`;
}

/* ── Components ──────────────────────────────────────────────────── */

function SectionEyebrow({
  label,
  count,
}: {
  label: string;
  count?: number;
}) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/55">
        {label}
      </span>
      {typeof count === "number" && (
        <span className="font-mono text-[10px] tabular-nums text-foreground/40">
          {count}
        </span>
      )}
    </div>
  );
}

const INITIAL_AUTORENEW =
  SUBSCRIPTION_LINES.find((l) => l.id === "addon-iq-credits")?.autoRenew ??
  true;

export function ManageSubscriptionModal() {
  const [searchParams, setSearchParams] = useSearchParams();

  /* ── Derive every piece of state from the URL ────────────────────── */

  const manageState = searchParams.get("manage"); // "open" | "confirm" | null
  const isOpen = manageState === "open" || manageState === "confirm";
  const isConfirmStep = manageState === "confirm";

  // `?cancel=id1,id2,id3` → Set<string>. Filter to known IDs so a typo
  // in the URL can't accidentally "cancel" something that doesn't exist.
  const stagedCancels = useMemo<Set<string>>(() => {
    const raw = searchParams.get("cancel");
    if (!raw) return new Set();
    const known = new Set(SUBSCRIPTION_LINES.map((l) => l.id));
    return new Set(raw.split(",").filter((id) => known.has(id)));
  }, [searchParams]);

  // Auto-renew is "off" only when the URL explicitly says so. Default = on.
  const autoRenewParam = searchParams.get("autorenew");
  const autoRenewCredits = autoRenewParam === "off" ? false : true;
  const autoRenewChanged = autoRenewCredits !== INITIAL_AUTORENEW;

  /* ── Writers ─────────────────────────────────────────────────────── */

  /** Strip every modal-related param at once — used on close + commit. */
  const close = useCallback(() => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.delete("manage");
        sp.delete("cancel");
        sp.delete("autorenew");
        return sp;
      },
      { replace: false },
    );
  }, [setSearchParams]);

  /** Toggle a line's staged-cancel state. Writes the new Set to ?cancel=. */
  const toggleCancel = useCallback(
    (id: string) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          const raw = sp.get("cancel");
          const set = new Set(raw ? raw.split(",").filter(Boolean) : []);
          if (set.has(id)) set.delete(id);
          else set.add(id);
          if (set.size === 0) sp.delete("cancel");
          else sp.set("cancel", Array.from(set).join(","));
          return sp;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  /** Flip auto-renew. "off" goes into URL; "on" (default) clears the param. */
  const setAutoRenew = useCallback(
    (next: boolean) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (next === INITIAL_AUTORENEW) sp.delete("autorenew");
          else sp.set("autorenew", next ? "on" : "off");
          return sp;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  /** Transition to confirm step — keeps cancel + autorenew params, swaps manage value. */
  const openConfirm = useCallback(() => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.set("manage", "confirm");
        return sp;
      },
      { replace: false },
    );
  }, [setSearchParams]);

  /** Confirm dialog → back to editor. Reverses the openConfirm transition. */
  const closeConfirm = useCallback(() => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.set("manage", "open");
        return sp;
      },
      { replace: false },
    );
  }, [setSearchParams]);

  /* ── Derived totals ─────────────────────────────────────────────── */

  const planLine = useMemo(
    () => SUBSCRIPTION_LINES.find((l) => l.kind === "plan"),
    [],
  );
  const nonPlanLines = useMemo(
    () => SUBSCRIPTION_LINES.filter((l) => l.kind !== "plan"),
    [],
  );

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
  const hasDelta = delta > 0.0001;
  const hasStagedChanges = stagedCancels.size > 0 || autoRenewChanged;

  /* ── Confirmation copy ─────────────────────────────────────────── */

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

  /* ── Render ────────────────────────────────────────────────────── */

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="max-w-2xl gap-0 p-0 font-sans">
        <DialogHeader className="space-y-1.5 border-b border-border/60 px-6 py-5">
          <DialogTitle className="text-[17px] font-semibold tracking-tight">
            Manage subscription
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-muted-foreground">
            Toggle off any add-on or trial. Changes apply on your next
            billing cycle — your current paid period continues uninterrupted.
          </DialogDescription>
        </DialogHeader>

        {/* BODY */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {/* Your plan */}
          {planLine && (
            <section>
              <SectionEyebrow label="Your plan" />
              <div className="flex items-center gap-3 py-2">
                <span
                  aria-hidden
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary"
                >
                  <Sparkles
                    className="h-4 w-4 text-foreground"
                    strokeWidth={2.25}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-foreground">
                    {planLine.name}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {planLine.description}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-[15px] font-semibold tabular-nums text-foreground">
                    {formatUsd(planLine.monthlyContributionUsd)}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    per month
                  </p>
                </div>
                <div className="shrink-0 self-center pl-1">
                  {planLine.lockedReason ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href="/planning"
                          className="inline-flex items-center gap-1 rounded text-[12px] font-medium text-foreground/70 hover:text-foreground"
                        >
                          Manage
                          <ArrowRight className="h-3 w-3" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent
                        side="left"
                        className="max-w-[220px] text-xs"
                      >
                        {planLine.lockedReason}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <a
                      href="/planning"
                      className="inline-flex items-center gap-1 rounded text-[12px] font-medium text-foreground/70 hover:text-foreground"
                    >
                      Manage
                      <ArrowRight className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </section>
          )}

          <div className="my-5 h-px bg-border/60" />

          {/* Add-ons & trials */}
          <section>
            <SectionEyebrow
              label="Add-ons & trials"
              count={nonPlanLines.length}
            />

            <ul className="divide-y divide-border/60">
              {nonPlanLines.map((line) => {
                const isStaged = stagedCancels.has(line.id);
                const showAutoRenewRow = line.id === "addon-iq-credits";

                return (
                  <li
                    key={line.id}
                    className={cn(
                      "group/row flex items-start gap-3 py-3 transition-opacity",
                      isStaged && "opacity-50",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
                          {KIND_LABEL[line.kind]}
                        </span>
                        {line.kind === "trial" && (
                          <span className="font-mono text-[10px] uppercase tracking-wider text-foreground/40">
                            · 23 days left
                          </span>
                        )}
                      </div>
                      <p
                        className={cn(
                          "mt-0.5 text-[14px] font-semibold text-foreground",
                          isStaged && "line-through",
                        )}
                      >
                        {line.name}
                      </p>
                      <p
                        className={cn(
                          "text-[12px] text-muted-foreground",
                          isStaged && "line-through",
                        )}
                      >
                        {line.description}
                      </p>

                      {showAutoRenewRow && (
                        <div
                          className={cn(
                            "mt-2.5 inline-flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 py-1 pl-2 pr-2.5",
                            isStaged && "opacity-50",
                          )}
                        >
                          <Switch
                            id="autorenew-iq-credits"
                            checked={autoRenewCredits}
                            onCheckedChange={setAutoRenew}
                            disabled={isStaged}
                            className="h-4 w-7 [&>span]:h-3 [&>span]:w-3 [&>span]:data-[state=checked]:translate-x-3"
                          />
                          <label
                            htmlFor="autorenew-iq-credits"
                            className="cursor-pointer text-[11px] text-foreground/75"
                          >
                            Auto-renew at 20 credits
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 self-start pt-4 text-right">
                      <p
                        className={cn(
                          "font-mono text-[14px] font-semibold tabular-nums",
                          isStaged ? "text-muted-foreground line-through" : "text-foreground",
                        )}
                      >
                        {formatLinePrice(line)}
                      </p>
                    </div>

                    <div className="shrink-0 self-center pt-2">
                      <button
                        type="button"
                        onClick={() => toggleCancel(line.id)}
                        className={cn(
                          "inline-flex h-7 items-center justify-center rounded-md px-2.5 text-[12px] font-medium transition-colors",
                          isStaged
                            ? "bg-foreground/[0.06] text-foreground hover:bg-foreground/[0.1]"
                            : "text-muted-foreground opacity-0 hover:bg-destructive/10 hover:text-destructive group-hover/row:opacity-100 focus-visible:opacity-100",
                        )}
                      >
                        {isStaged ? "Undo" : "Cancel"}
                      </button>
                    </div>
                  </li>
                );
              })}

              {planLine?.lockedReason && (
                <li className="flex items-center gap-2 pt-3 text-[11px] text-muted-foreground">
                  <Lock className="h-3 w-3 shrink-0" aria-hidden />
                  <span>{planLine.lockedReason}</span>
                  <a
                    href="/planning"
                    className="ml-auto inline-flex items-center gap-0.5 text-foreground/70 hover:text-foreground"
                  >
                    Open Plans
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </li>
              )}
            </ul>
          </section>

          <div className="mt-5 flex items-start gap-2 rounded-md bg-primary/[0.07] px-3 py-2 text-[12px] text-foreground/75">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground/55" />
            <span>
              Changes apply from{" "}
              <span className="font-medium text-foreground">
                {NEXT_CYCLE_DATE}
              </span>
              . Your current paid period continues uninterrupted.
            </span>
          </div>
        </div>

        {/* HERO TOTAL + ACTION FOOTER */}
        <div className="border-t border-border/60 bg-gradient-to-r from-primary/[0.06] to-transparent">
          <div className="flex items-end justify-between gap-3 px-6 pt-5">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/55">
                New monthly total
              </p>
              {autoRenewChanged && (
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Auto-renew{" "}
                  <span className="font-mono tabular-nums">
                    {autoRenewCredits ? "on" : "off"}
                  </span>
                </p>
              )}
            </div>
            <div className="flex items-baseline gap-2.5">
              {hasDelta && (
                <span className="inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-foreground">
                  − {formatUsd(delta)}/mo
                </span>
              )}
              <span className="font-mono text-[30px] font-semibold leading-none tabular-nums tracking-tight text-foreground">
                {formatUsd(newMonthlyTotal)}
              </span>
              <span className="font-mono text-[12px] text-muted-foreground">
                /mo
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/60 px-6 py-3.5">
            <span className="text-[12px] text-muted-foreground">
              {stagedCancels.size > 0
                ? `${stagedCancels.size} ${
                    stagedCancels.size === 1 ? "item" : "items"
                  } to cancel`
                : autoRenewChanged
                  ? "Auto-renew changed"
                  : "No changes yet"}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={close}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!hasStagedChanges}
                onClick={openConfirm}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Save changes
              </Button>
            </div>
          </div>
        </div>

        {/*
         * Confirmation step — also URL-backed. `?manage=confirm` shows
         * this AlertDialog stacked on the editor; the back button (or
         * the "Go back" button) returns to `?manage=open` so the editor
         * is preserved with all staged params intact.
         */}
        <AlertDialog
          open={isConfirmStep}
          onOpenChange={(open) => {
            if (!open) closeConfirm();
          }}
        >
          <AlertDialogContent className="font-sans">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm subscription changes?</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmDescription}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={closeConfirm}>
                Go back
              </AlertDialogCancel>
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
