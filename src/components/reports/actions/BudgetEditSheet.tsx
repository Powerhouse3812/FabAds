/**
 * BudgetEditSheet — the single budget-edit surface for Reports (mobile + desktop).
 *
 * Bottom sheet on mobile, side sheet on desktop. Self-contained and driven purely
 * by props: it takes an entity + open state, writes through `setBudget` in
 * `@/lib/ad-entity-write-store`, and hands the caller nothing back. No action-hook
 * dependency, so it can be mounted from the desktop table, the mobile list, or a
 * detail drawer without any of them agreeing on a controller.
 *
 * WHY THIS SHEET LOOKS THE WAY IT DOES
 * Budget is the only edit on this screen that spends money, so every affordance
 * here exists to stop a mis-typed number from shipping: percent chips instead of
 * steppers, a text input instead of a number input, the currency as chrome rather
 * than content, a stated outcome on the primary button, and an undo toast that
 * outlives the sheet. Each of those is annotated below — they are not stylistic.
 */
import * as React from "react";
import { AlertTriangle, Archive } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  EXEMPT_MS,
  setBudget,
  undo,
  useOverlaidEntity,
} from "@/lib/ad-entity-write-store";
import { currencyForCountry, getReportAccount } from "@/lib/reports-accounts";
import { getById, type BudgetType, type ReportEntity } from "@/lib/reports-dummy-data";
import { cn } from "@/lib/utils";

export interface BudgetEditSheetProps {
  entity: ReportEntity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ───────────────────────────── constants ───────────────────────────── */

/**
 * DETAIL 1 — percent chips, NOT ± steppers.
 *
 * Budgets in this dataset span 50–550, and real ones span ₹80–₹5,00,000. A fixed
 * step is therefore either useless (+₹10 on a ₹5,00,000 budget) or catastrophic
 * (+₹1,000 on a ₹80 budget) — there is no single step that is right at both ends.
 * Percentages are scale-invariant and they are also how media buyers actually
 * talk ("push it 20%"), so the control matches the mental model instead of
 * fighting it. Chips apply to the PENDING value, not the original, so two taps of
 * +10% compounds the way the user expects from a repeated gesture.
 */
const PERCENT_STEPS = [-20, -10, 10, 20] as const;

/**
 * DETAIL 4 — per-currency minimum.
 *
 * ILLUSTRATIVE ONLY. Real Meta minimums are objective- AND currency-dependent
 * (a ~$1/day floor for impression objectives, roughly 2× that for click/
 * conversion objectives, with a separate lifetime rule), and Meta publishes them
 * per ad account. This table is a demo stand-in that is directionally correct per
 * currency; do not treat it as the real schedule.
 */
const MIN_BUDGET: Record<string, number> = {
  USD: 1,
  EUR: 1,
  GBP: 1,
  INR: 80,
  BRL: 5,
};
const DEFAULT_MIN_BUDGET = 1;

/** Above this multiple of the current budget we warn — but never block. */
const SOFT_WARN_MULTIPLE = 3;

const LEVEL_LABEL: Record<ReportEntity["level"], string> = {
  account: "Ad account",
  campaign: "Campaign",
  adset: "Ad set",
  ad: "Ad",
};

/* ───────────────────────────── helpers ───────────────────────────── */

const round2 = (n: number): number => Math.round(n * 100) / 100;

function formatAmount(n: number): string {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

const money = (symbol: string, n: number): string => `${symbol}${formatAmount(n)}`;

/** "day" for Daily, "total" for Lifetime — used in every outcome string. */
const unitFor = (t: BudgetType): string => (t === "Daily" ? "day" : "total");

/**
 * Keeps only what can be part of a decimal amount, and only ONE separator.
 * Runs on every keystroke so the value in state is always parseable; the raw
 * text is preserved otherwise (a trailing "." survives, so "12." can be typed).
 */
function sanitizeAmount(raw: string): string {
  const stripped = raw.replace(/[^0-9.,]/g, "").replace(/,/g, "");
  const firstDot = stripped.indexOf(".");
  if (firstDot === -1) return stripped;
  return (
    stripped.slice(0, firstDot + 1) + stripped.slice(firstDot + 1).replace(/\./g, "")
  );
}

/** Walks the parent chain to the owning ad account. Children inherit its currency. */
function findAccount(entity: ReportEntity): { name: string; id: string } | null {
  let cursor: ReportEntity | undefined = entity;
  // Bounded: the tree is account → campaign → adset → ad, so 4 hops is the max.
  for (let hops = 0; cursor && hops < 6; hops += 1) {
    if (cursor.level === "account") {
      return { name: getReportAccount(cursor.id)?.name ?? cursor.name, id: cursor.id };
    }
    cursor = cursor.parentId ? getById(cursor.parentId) : undefined;
  }
  return null;
}

/* ───────────────────────────── component ───────────────────────────── */

export function BudgetEditSheet({ entity, open, onOpenChange }: BudgetEditSheetProps) {
  const isMobile = useIsMobile();

  // The caller usually holds `entity` in page state, which goes stale the moment
  // any write lands. Reading through the overlay means reopening this sheet after
  // an edit shows the NEW current budget instead of the seeded one.
  const live = useOverlaidEntity(entity);

  const currency = React.useMemo(
    () => currencyForCountry(live?.country ?? "US"),
    [live?.country],
  );
  const account = React.useMemo(() => (live ? findAccount(live) : null), [live]);

  const currentValue = live?.budgetValue;
  const currentType: BudgetType = live?.budgetType ?? "Daily";
  const hasCurrent = typeof currentValue === "number";

  const [draft, setDraft] = React.useState("");
  const [type, setType] = React.useState<BudgetType>(currentType);
  const [touched, setTouched] = React.useState(false);

  // Re-seed on every (re)open and on entity swap — a sheet that reopens holding
  // the previous row's number is a money bug of its own.
  React.useEffect(() => {
    if (!open) return;
    setDraft(hasCurrent ? String(currentValue) : "");
    setType(currentType);
    setTouched(false);
  }, [open, live?.id, hasCurrent, currentValue, currentType]);

  const isArchived = live?.status === "Archived";

  const parsed = draft.trim() === "" ? Number.NaN : Number(draft);
  const pending = Number.isFinite(parsed) ? round2(parsed) : null;

  const min = MIN_BUDGET[currency.code] ?? DEFAULT_MIN_BUDGET;
  const belowFloor = pending === null || pending < min;
  const unchanged =
    pending !== null && hasCurrent && pending === currentValue && type === currentType;

  // DETAIL 4b — soft warning. Non-blocking on purpose: a 10× increase is a
  // legitimate scale-up as often as it is a typo, so this informs and never
  // gates. Only the currency floor can disable Save.
  const jumpMultiple =
    pending !== null && hasCurrent && currentValue > 0 ? pending / currentValue : null;
  const showJumpWarning = jumpMultiple !== null && jumpMultiple > SOFT_WARN_MULTIPLE;

  const errorId = "budget-edit-error";
  const helpId = "budget-edit-help";
  const showError = touched && belowFloor;

  const applyPercent = (pct: number) => {
    // Compounds off the PENDING value (falls back to current before first edit).
    const base = pending ?? currentValue ?? 0;
    if (base <= 0) return;
    const next = round2(base * (1 + pct / 100));
    setDraft(String(Math.max(next, 0)));
    setTouched(true);
  };

  const handleSave = () => {
    if (!live || pending === null || belowFloor) return;

    // DETAIL 5 — the explicit Save IS the confirmation. No second confirm dialog:
    // the user typed a number and pressed a button that names the outcome, so a
    // "are you sure?" step would add a click without adding information. Reversal
    // is provided AFTER the fact (undo toast + Session changes sheet), which is
    // the pattern that respects a reversible, low-stakes-per-edit action.
    const token = setBudget(live, { value: pending, type });
    const before = hasCurrent
      ? `${money(currency.symbol, currentValue)}/${unitFor(currentType)}`
      : "No budget";
    const after = `${money(currency.symbol, pending)}/${unitFor(type)}`;

    onOpenChange(false);
    toast.success(`${before} → ${after}`, {
      description: live.name,
      duration: EXEMPT_MS, // must match the store's filter-exemption window
      action: { label: "Undo", onClick: () => undo(token) },
    });
  };

  const side = isMobile ? "bottom" : "right";
  const sideClass = isMobile
    ? "inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-2xl p-5"
    : "w-full sm:max-w-md overflow-y-auto p-6";

  const projectionDays = 30;
  const perDay = (v: number, t: BudgetType) => (t === "Daily" ? v : v / projectionDays);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* Built-in X suppressed — the footer Cancel (min-h-11) is the single
          close control. */}
      <SheetContent side={side} className={cn("flex flex-col gap-5 [&>button]:hidden", sideClass)}>
        {!live ? null : (
          <>
            <SheetHeader className="pr-8 text-left sm:text-left">
              {/* Account / page context — a budget number is meaningless without
                  knowing whose money and which currency it is. */}
              <p className="truncate text-xs text-muted-foreground">
                {[
                  account?.name,
                  live.destinationPageName,
                  `${currency.code} · ${live.country}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <SheetTitle className="break-words text-base leading-snug">
                {live.name}
              </SheetTitle>
              <SheetDescription>
                {LEVEL_LABEL[live.level]} · Edit budget
              </SheetDescription>
            </SheetHeader>

            {isArchived ? (
              /* DETAIL 6 — archived is not editable. Meta will not spend on an
                 archived object, so an enabled field here would collect a number
                 that can never take effect. Name the unblock instead of greying
                 out a form with no explanation. */
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
                  <Archive className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Unarchive to edit budget
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Archived {LEVEL_LABEL[live.level].toLowerCase()}s don&apos;t
                      spend, so their budget can&apos;t be changed.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="min-h-11"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              </div>
            ) : (
              <>
                {/* Current — mono + tabular-nums so digits don't jitter as the
                    projection below re-renders on every keystroke. */}
                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Current
                  </p>
                  <p className="font-mono text-lg tabular-nums text-foreground">
                    {hasCurrent
                      ? `${money(currency.symbol, currentValue)} / ${unitFor(currentType)}`
                      : "No budget set"}
                  </p>
                  {!hasCurrent && live.level !== "adset" ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Budget is set at the ad set level for this campaign.
                    </p>
                  ) : null}
                </div>

                {/* DETAIL 1 — percent chips (see PERCENT_STEPS above). */}
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Adjust by
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {PERCENT_STEPS.map((pct) => (
                      <Button
                        key={pct}
                        type="button"
                        variant="outline"
                        // Nothing to scale from without a base value.
                        disabled={(pending ?? currentValue ?? 0) <= 0}
                        onClick={() => applyPercent(pct)}
                        className="min-h-11 font-mono tabular-nums"
                      >
                        {pct > 0 ? `+${pct}%` : `${pct}%`}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* New budget */}
                <div className="space-y-2">
                  <Label htmlFor="budget-edit-input" className="text-sm">
                    New budget
                  </Label>
                  <div
                    className={cn(
                      "flex items-center rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
                      showError ? "border-destructive" : "border-input",
                    )}
                  >
                    {/* DETAIL 3 — the currency symbol is a SIBLING prefix, never
                        part of the input value. Baking "€" into the value means
                        every parse has to strip it, select-all-and-retype can
                        delete it, and the field stops being a number the moment
                        the symbol table changes. */}
                    <span
                      aria-hidden="true"
                      className="select-none pl-3 pr-1 font-mono text-base text-muted-foreground"
                    >
                      {currency.symbol.trim()}
                    </span>
                    <Input
                      id="budget-edit-input"
                      // DETAIL 2 — type="text" + inputMode="decimal", NEVER
                      // type="number". A number input accepts "e", "+" and "-"
                      // as valid characters, hands iOS an inconsistent keypad,
                      // and — the real bug — a mouse wheel over a focused
                      // number field silently changes the value. On a budget
                      // field that is money moved by scrolling past it.
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={draft}
                      onChange={(e) => {
                        setDraft(sanitizeAmount(e.target.value));
                        setTouched(true);
                      }}
                      onBlur={() => setTouched(true)}
                      aria-invalid={showError || undefined}
                      aria-describedby={showError ? errorId : helpId}
                      className="min-h-11 border-0 pl-0 font-mono text-base tabular-nums focus-visible:ring-0 focus-visible:ring-offset-0"
                      placeholder={hasCurrent ? String(currentValue) : String(min)}
                    />
                  </div>

                  {showError ? (
                    <p id={errorId} role="alert" className="text-xs text-destructive">
                      {draft.trim() === ""
                        ? "Enter a budget amount."
                        : `Minimum ${type.toLowerCase()} budget is ${money(currency.symbol, min)}.`}
                    </p>
                  ) : (
                    <p id={helpId} className="text-xs text-muted-foreground">
                      Minimum {money(currency.symbol, min)} · {currency.code}
                    </p>
                  )}

                  {/* DETAIL 4b — non-blocking soft warning. */}
                  {showJumpWarning && jumpMultiple !== null ? (
                    <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        That&apos;s {jumpMultiple.toFixed(1)}× the current budget.
                        Double-check before saving.
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* Live delta + 30-day projection — states the consequence in the
                    unit the user is judged on (spend), not just the input. */}
                <div className="rounded-lg border border-dashed border-border px-4 py-3 text-sm">
                  {pending === null ? (
                    <p className="text-muted-foreground">
                      Enter an amount to see the change.
                    </p>
                  ) : (
                    <>
                      <p className="font-mono tabular-nums text-foreground">
                        {hasCurrent ? (
                          <>
                            {pending === currentValue ? (
                              <span className="text-muted-foreground">No change</span>
                            ) : (
                              <>
                                {pending > currentValue ? "+" : "−"}
                                {money(currency.symbol, Math.abs(pending - currentValue))}
                                {currentValue > 0 ? (
                                  <span className="text-muted-foreground">
                                    {"  "}(
                                    {pending > currentValue ? "+" : "−"}
                                    {Math.abs(
                                      Math.round(
                                        ((pending - currentValue) / currentValue) * 100,
                                      ),
                                    )}
                                    %)
                                  </span>
                                ) : null}
                              </>
                            )}
                          </>
                        ) : (
                          <>New budget {money(currency.symbol, pending)}</>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {type === "Daily" ? (
                          <>
                            ≈{" "}
                            <span className="font-mono tabular-nums">
                              {money(currency.symbol, pending * projectionDays)}
                            </span>{" "}
                            over {projectionDays} days
                          </>
                        ) : (
                          <>
                            ≈{" "}
                            <span className="font-mono tabular-nums">
                              {money(currency.symbol, round2(perDay(pending, type)))}
                            </span>{" "}
                            / day if spent evenly over {projectionDays} days
                          </>
                        )}
                      </p>
                    </>
                  )}
                </div>

                {/* Daily / Lifetime segmented control */}
                <div className="space-y-2">
                  <p
                    className="text-sm font-medium text-foreground"
                    id="budget-type-label"
                  >
                    Budget type
                  </p>
                  <div
                    role="group"
                    aria-labelledby="budget-type-label"
                    className="grid grid-cols-2 gap-1 rounded-md border border-input bg-muted/40 p-1"
                  >
                    {(["Daily", "Lifetime"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        aria-pressed={type === t}
                        onClick={() => setType(t)}
                        className={cn(
                          "min-h-11 rounded-sm px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          type === t
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {/* DETAIL 7 — copy only, no logic. Switching type changes how
                      the same number is spent, and that is invisible in the
                      field, so it gets said out loud. */}
                  {type !== currentType ? (
                    <p className="text-xs text-muted-foreground">
                      Switching to {type} changes pacing — the same amount is spent{" "}
                      {type === "Lifetime"
                        ? "across the whole schedule instead of each day."
                        : "each day instead of across the whole schedule."}
                    </p>
                  ) : null}
                </div>

                {/* DETAIL 8 — all targets ≥44px (min-h-11). */}
                <div className="mt-auto flex flex-col gap-2 pt-1">
                  <Button
                    type="button"
                    className="min-h-11 w-full"
                    disabled={belowFloor || unchanged}
                    onClick={handleSave}
                  >
                    {/* The primary button states the OUTCOME, not the verb. The
                        user reads back their own intent before committing — which
                        is what removes the need for a confirm dialog. */}
                    {pending === null || belowFloor
                      ? "Save budget"
                      : `Save ${money(currency.symbol, pending)} / ${unitFor(type)}`}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-11 w-full"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default BudgetEditSheet;
