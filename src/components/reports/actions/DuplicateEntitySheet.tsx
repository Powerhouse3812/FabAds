/**
 * DuplicateEntitySheet — the single duplicate surface for Reports (mobile + desktop).
 *
 * Bottom sheet on mobile, side sheet on desktop, same two-chrome pattern as
 * BudgetEditSheet. Mounted exactly once by AdEntityActionsProvider; it holds no
 * write of its own, it hands the caller `(count, status)` and lets the provider
 * do the write + the single undo toast.
 *
 * WHY DUPLICATE NEEDS A SHEET AT ALL
 * It used to fire instantly and always produce ONE Paused copy. Both halves of
 * that were wrong for the job: scaling a winner means five or ten copies, and a
 * buyer duplicating to scale wants them delivering. Making the user create one
 * copy at a time and then hunt down each one to activate it is the actual task
 * being done badly. So the sheet asks the two questions that were previously
 * answered for them — how many, and published how.
 *
 * WHY THE LIMITS ARE ON SCREEN BEFORE THE MISTAKE
 * Meta caps active ads at 5,000 per ad account and 250 per Page. An entity lives
 * on exactly one of each, so both are shown with their remaining room — visible
 * BEFORE the number is typed, not as an error afterwards (NN/g #1, visibility of
 * system status; #5, error prevention over error messages).
 *
 * WHY VALIDATION ONLY BITES ON ACTIVE
 * Paused ads consume no quota. So the ceiling is not a property of "duplicating",
 * it is a property of "duplicating as Active" — and when the request doesn't fit,
 * the honest response is not a disabled button or a silently clamped field
 * (never: the number the user typed is their intent, and quietly rewriting it is
 * the worst option available). It is to say what won't fit, by how much, and
 * offer the version that does — Paused — in one tap. Never a dead end (NN/g #9).
 */
import * as React from "react";
import { AlertTriangle, Info } from "lucide-react";

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
import { useOverlaidEntity, useWriteStore } from "@/lib/ad-entity-write-store";
import {
  formatCount,
  getDuplicateCapacity,
  type CapacityLine,
  type DuplicateCapacity,
} from "@/lib/reports-capacity";
import type { EntityStatus, ReportEntity } from "@/lib/reports-dummy-data";
import { cn } from "@/lib/utils";
import { levelLabel } from "@/components/reports/actions/StatusConfirmDialog";

export interface DuplicateEntitySheetProps {
  entity: ReportEntity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The provider writes + toasts. This sheet only reports the user's answer. */
  onConfirm: (entity: ReportEntity, count: number, status: EntityStatus) => void;
}

/* ───────────────────────────── constants ───────────────────────────── */

/** Common batch sizes. Taps instead of typing on mobile; the field stays free. */
const COUNT_PRESETS = [1, 3, 5, 10] as const;

/**
 * NOT A CAP — a disclosure threshold. The spec is explicit that the count is
 * free entry with no arbitrary hard limit, and that is honoured: this only adds
 * a non-blocking note, because these copies are fabricated as real rows in an
 * in-memory store and a four-figure batch will make the list sluggish. Telling
 * the user that beats pretending, and beats inventing a ceiling Meta doesn't have.
 */
const BULK_NOTICE_THRESHOLD = 200;

const PUBLISH_OPTIONS: EntityStatus[] = ["Active", "Paused"];

/* ───────────────────────────── helpers ───────────────────────────── */

/** Digits only — a copy count is a whole number, so nothing else can be typed. */
function sanitizeCount(raw: string): string {
  return raw.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
}

const plural = (n: number): string => (n === 1 ? "copy" : "copies");

/** "Acme Brand Page — 18 / 250 active · 232 left" */
function CapacityRow({
  label,
  line,
  note,
  binding,
}: {
  label: string;
  line: CapacityLine;
  note?: string;
  binding: boolean;
}) {
  const pct = Math.min(100, Math.round((line.active / line.limit) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate text-xs text-muted-foreground">
          <span className="text-foreground">{line.name}</span>
          <span className="text-muted-foreground"> · {label}</span>
        </p>
        <p className="shrink-0 font-mono text-xs tabular-nums text-foreground">
          {formatCount(line.active)}
          <span className="text-muted-foreground"> / {formatCount(line.limit)}</span>
        </p>
      </div>
      {/* A bar, not just a number: "18 / 250" needs a beat of arithmetic,
          "nearly empty" does not. The number stays for the exact answer. */}
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`${line.name}: ${formatCount(line.active)} of ${formatCount(line.limit)} active ads used, ${formatCount(line.remaining)} remaining`}
      >
        <div
          className={cn("h-full rounded-full", binding ? "bg-primary" : "bg-muted-foreground/50")}
          style={{ width: `${Math.max(pct, line.active > 0 ? 2 : 0)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {formatCount(line.remaining)} active {line.remaining === 1 ? "slot" : "slots"} left
        {note ? ` · ${note}` : ""}
      </p>
    </div>
  );
}

function CapacityBlock({ capacity }: { capacity: DuplicateCapacity }) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Active ad limits
      </p>

      {capacity.account ? (
        <CapacityRow
          label="ad account"
          line={capacity.account}
          binding={capacity.tighter === "account"}
        />
      ) : null}

      {capacity.page ? (
        <CapacityRow
          label="Facebook Page"
          line={capacity.page}
          binding={capacity.tighter === "page"}
          // Disclosed, not hidden: most seeded rows carry no real page, so the
          // page shown is inferred. Saying so is the difference between a demo
          // that is honest and one that quietly invents data.
          note={capacity.pageDerived ? "page inferred for this demo row" : undefined}
        />
      ) : (
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            {capacity.noPageLinkedFor ?? "This ad account"} has no Facebook Page
            linked, so only the ad account&apos;s{" "}
            {formatCount(capacity.account?.limit ?? 0)} active-ad limit applies.
          </p>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── component ───────────────────────────── */

export function DuplicateEntitySheet({
  entity,
  open,
  onOpenChange,
  onConfirm,
}: DuplicateEntitySheetProps) {
  const isMobile = useIsMobile();

  // The caller holds `entity` in page state, which goes stale the moment any
  // write lands — read through the overlay so the name/status shown here match
  // the row behind the sheet.
  const live = useOverlaidEntity(entity);
  const snap = useWriteStore();

  const [countDraft, setCountDraft] = React.useState("1");
  const [status, setStatus] = React.useState<EntityStatus>("Paused");

  // Re-seed on every (re)open and on entity swap. A sheet that reopens holding
  // "10 · Active" from the last row is a trap, not a convenience.
  React.useEffect(() => {
    if (!open) return;
    setCountDraft("1");
    setStatus("Paused");
  }, [open, live?.id]);

  // Recomputed against the live store, so copies created a moment ago (and any
  // status flip since) are already counted. Skipped entirely while closed.
  //
  // KNOWN LIMITATION, stated rather than hidden: this counts against the
  // dateSeed-0 dataset. `dateSeed` is page state (the demo's "refresh" bumps it,
  // which re-rolls the seeded rows including their statuses) and this sheet is
  // mounted by the provider ABOVE the pages, so it cannot see it. After a demo
  // refresh the totals can therefore be a few ads out from the list behind the
  // sheet. Fixing it properly means threading dateSeed through the provider.
  const capacity = React.useMemo<DuplicateCapacity | null>(
    () => (open && live ? getDuplicateCapacity(live, snap) : null),
    [open, live, snap],
  );

  const parsed = countDraft === "" ? 0 : Number(countDraft);
  const count = Number.isSafeInteger(parsed) ? parsed : 0;
  const countValid = count >= 1;

  const remaining = capacity?.tighterRemaining ?? Number.POSITIVE_INFINITY;
  const bindingLine =
    capacity === null
      ? null
      : capacity.tighter === "page"
        ? capacity.page
        : capacity.account;

  // Only Active consumes quota — this is the whole reason the check is here and
  // not on the field itself.
  const blocked = status === "Active" && countValid && count > remaining;
  const showBulkNotice = count >= BULK_NOTICE_THRESHOLD;

  const canSubmit = countValid && !blocked;
  const errorId = "duplicate-count-error";
  const helpId = "duplicate-count-help";

  const submit = () => {
    if (!live || !canSubmit) return;
    onOpenChange(false);
    onConfirm(live, count, status);
  };

  const side = isMobile ? "bottom" : "right";
  const sideClass = isMobile
    ? "inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
    : "w-full sm:max-w-md overflow-y-auto p-6";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className={cn("flex flex-col gap-5 [&>button]:hidden", sideClass)}>
        {!live || !capacity ? null : (
          <>
            {/* SheetContent's built-in X is suppressed above ([&>button]:hidden)
                — the footer Cancel (min-h-11) is the single close control, so
                there's exactly one exit instead of two doing the same thing. */}
            <SheetHeader className="text-left sm:text-left">
              {/* Whose account and which page — the two things the limits below
                  belong to. Without them the numbers are unattributed trivia. */}
              <p className="truncate text-xs text-muted-foreground">
                {[capacity.account?.name, capacity.page?.name]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <SheetTitle className="break-words text-base leading-snug">
                Duplicate {live.name}
              </SheetTitle>
              <SheetDescription>
                {levelLabel(live.level)} · copies start with zero metrics
              </SheetDescription>
            </SheetHeader>

            {/* ── How many ─────────────────────────────────────────────── */}
            <div className="space-y-2">
              <Label htmlFor="duplicate-count-input" className="text-sm">
                How many copies
              </Label>
              <Input
                id="duplicate-count-input"
                // type="text" + inputMode="decimal", NEVER type="number": a
                // number input accepts "e"/"+"/"-" as valid characters and — the
                // real bug — a mouse wheel over the focused field silently
                // changes the value. Scrolling the page must not change how many
                // ads get created.
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={countDraft}
                onChange={(e) => setCountDraft(sanitizeCount(e.target.value))}
                aria-invalid={blocked || (countDraft !== "" && !countValid) || undefined}
                aria-describedby={blocked ? errorId : helpId}
                className="min-h-11 font-mono text-base tabular-nums"
                placeholder="1"
              />
              <div className="grid grid-cols-4 gap-2">
                {COUNT_PRESETS.map((n) => (
                  <Button
                    key={n}
                    type="button"
                    variant={count === n ? "secondary" : "outline"}
                    aria-pressed={count === n}
                    onClick={() => setCountDraft(String(n))}
                    className="min-h-11 font-mono tabular-nums"
                  >
                    {n}
                  </Button>
                ))}
              </div>
              {!countValid ? (
                <p id={helpId} className="text-xs text-muted-foreground">
                  Enter at least 1 copy.
                </p>
              ) : (
                <p id={helpId} className="text-xs text-muted-foreground">
                  {formatCount(count)} {plural(count)} of this{" "}
                  {levelLabel(live.level).toLowerCase()}, named{" "}
                  <span className="text-foreground">— Copy</span> onwards.
                </p>
              )}
            </div>

            {/* ── Publish as ───────────────────────────────────────────── */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground" id="duplicate-publish-label">
                Publish as
              </p>
              <div
                role="group"
                aria-labelledby="duplicate-publish-label"
                className="grid grid-cols-2 gap-1 rounded-md border border-input bg-muted/40 p-1"
              >
                {PUBLISH_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={status === option}
                    onClick={() => setStatus(option)}
                    className={cn(
                      "min-h-11 rounded-sm px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      status === option
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {/* States the consequence, because "Active" vs "Paused" does not
                  say out loud that one of them starts spending money. */}
              <p className="text-xs text-muted-foreground">
                {status === "Active"
                  ? "Copies start delivering immediately and count against the limits below."
                  : "Copies are created but don’t deliver or spend, and don’t use any active-ad room."}
              </p>
            </div>

            {/* ── Limits ───────────────────────────────────────────────── */}
            <CapacityBlock capacity={capacity} />

            {/* ── The block, plus the way out of it ────────────────────── */}
            {blocked && bindingLine ? (
              <div
                id={errorId}
                role="alert"
                className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {formatCount(count)} {plural(count)} as Active would exceed this{" "}
                    {capacity.tighter === "page" ? "Page" : "ad account"}&apos;s{" "}
                    {formatCount(bindingLine.limit)} active-ad limit —{" "}
                    {bindingLine.remaining === 0
                      ? "there is no room left"
                      : `${formatCount(bindingLine.remaining)} left`}
                    . Create them Paused instead?
                  </p>
                </div>
                {/* One tap to the version that fits. The typed count is kept
                    exactly as entered — only the status changes. */}
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 w-full border-amber-500/50"
                  onClick={() => setStatus("Paused")}
                >
                  Create {formatCount(count)} {plural(count)} Paused
                </Button>
                {bindingLine.remaining > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-11 w-full"
                    onClick={() => setCountDraft(String(bindingLine.remaining))}
                  >
                    Or make {formatCount(bindingLine.remaining)} Active instead
                  </Button>
                ) : null}
              </div>
            ) : null}

            {showBulkNotice ? (
              <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {formatCount(count)} rows is a large batch — this demo creates
                  them locally, so the list may take a moment to redraw.
                </p>
              </div>
            ) : null}

            {/* Targets ≥44px. Explicit controls only — outside click cannot
                dismiss this sheet (app-wide rule, see components/ui/sheet.tsx). */}
            <div className="mt-auto flex flex-col gap-2 pt-1">
              <Button
                type="button"
                className="min-h-11 w-full"
                disabled={!canSubmit}
                onClick={submit}
              >
                {/* The primary states the OUTCOME, count and status included, so
                    the user reads their own intent back before committing. */}
                {countValid
                  ? `Create ${formatCount(count)} ${plural(count)} · ${status}`
                  : "Create copies"}
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
      </SheetContent>
    </Sheet>
  );
}

export default DuplicateEntitySheet;
