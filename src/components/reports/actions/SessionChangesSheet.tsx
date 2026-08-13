/**
 * SessionChangesSheet — the durable undo path for Reports writes.
 *
 * WHY THIS EXISTS AT ALL
 * A toast is not an undo *system*. It is an 8-second window that dies if the user
 * scrolls, taps elsewhere, gets a phone call, or navigates to another row — and on
 * mobile it is the most-dismissed element on screen. Everything the write store
 * journals is recoverable here, with no time limit, which is what turns "we showed
 * you an Undo" into an actual reversible-action guarantee (NN/g #3, user control
 * and freedom).
 *
 * It does a second job: this prototype's writes are in-memory and vanish on
 * reload. That is DISCLOSED here in plain words rather than left for a buyer to
 * discover after a refresh eats their afternoon of edits.
 *
 * Self-contained: props are open/onOpenChange only. It reads the store directly
 * (`useSessionChanges`) and writes through `undo` / `resetWriteStore`, so any
 * surface can mount it without owning any state.
 */
import * as React from "react";
import { History, RotateCcw, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  resetWriteStore,
  undo,
  useSessionChanges,
} from "@/lib/ad-entity-write-store";
import { cn } from "@/lib/utils";

export interface SessionChangesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Kept local so this component has no dependency on a shared date util. */
function relativeTime(at: number, now: number): string {
  const secs = Math.max(0, Math.round((now - at) / 1000));
  if (secs < 10) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} d ago`;
}

const KIND_LABEL: Record<string, string> = {
  status: "Status",
  budget: "Budget",
  duplicate: "Duplicate",
};

export function SessionChangesSheet({ open, onOpenChange }: SessionChangesSheetProps) {
  const isMobile = useIsMobile();
  const changes = useSessionChanges(); // already newest-first; undone entries drop out

  // Relative timestamps go stale silently. Tick only while the sheet is open so a
  // closed sheet costs nothing.
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!open) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(id);
  }, [open]);

  // Two-tap inline confirm for reset. Not a nested dialog: a dialog on top of a
  // sheet on mobile is a stacking and focus-trap problem, and the destructive
  // scope here ("everything in this session") fits in one line of copy.
  const [confirmingReset, setConfirmingReset] = React.useState(false);
  React.useEffect(() => {
    if (!open) setConfirmingReset(false);
  }, [open]);

  const side = isMobile ? "bottom" : "right";
  const sideClass = isMobile
    ? "inset-x-0 bottom-0 max-h-[88vh] rounded-t-2xl p-5"
    : "w-full sm:max-w-md p-6";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* Built-in X suppressed — the footer Close (min-h-11) is the single
          close control. */}
      <SheetContent side={side} className={cn("flex flex-col gap-4 [&>button]:hidden", sideClass)}>
        <SheetHeader className="pr-8 text-left sm:text-left">
          <SheetTitle className="text-base">Session changes</SheetTitle>
          <SheetDescription>
            {changes.length === 0
              ? "Nothing changed yet."
              : `${changes.length} change${changes.length === 1 ? "" : "s"} you can still undo.`}
          </SheetDescription>
        </SheetHeader>

        {/* Disclosure, not fine print. Sits above the list so it is read before
            the user starts trusting this as a change log. */}
        <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          These changes are local to this session and reset when you reload the page.
          Nothing here has been sent to the ad platform.
        </p>

        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
          {changes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <History className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                No changes this session.
              </p>
              <p className="max-w-[24rem] text-xs text-muted-foreground">
                Pause, budget and duplicate actions show up here so you can reverse
                them after the toast is gone.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {changes.map((entry, i) => (
                // Tokens carry no id; `at` + label is stable across re-renders and
                // survives entries being filtered out after an undo.
                <li
                  key={`${entry.at}-${entry.token.label}-${i}`}
                  className="flex items-start justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="break-words text-sm text-foreground">
                      {entry.token.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <span className="uppercase tracking-wide">
                        {KIND_LABEL[entry.token.kind] ?? entry.token.kind}
                      </span>
                      {" · "}
                      <time dateTime={new Date(entry.at).toISOString()}>
                        {relativeTime(entry.at, now)}
                      </time>
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-11 shrink-0 px-3"
                    onClick={() => undo(entry.token)}
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                    Undo
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2 border-t border-border pt-3">
          {confirmingReset ? (
            <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
              <p className="text-xs text-foreground">
                Discard all {changes.length} simulated change
                {changes.length === 1 ? "" : "s"}? This can&apos;t be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  className="min-h-11 flex-1"
                  onClick={() => {
                    resetWriteStore();
                    setConfirmingReset(false);
                  }}
                >
                  Reset everything
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 flex-1"
                  onClick={() => setConfirmingReset(false)}
                >
                  Keep changes
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full text-destructive hover:text-destructive"
              disabled={changes.length === 0}
              onClick={() => setConfirmingReset(true)}
            >
              <RotateCcw className="h-4 w-4" />
              Reset all demo changes
            </Button>
          )}

          {/* Explicit close — the shared Sheet blocks outside-click dismissal by
              design, so a visible control is mandatory, not optional. */}
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 w-full"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default SessionChangesSheet;
