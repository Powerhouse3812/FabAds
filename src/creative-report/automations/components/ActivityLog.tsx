/**
 * ActivityLog — the Automations screen's "Activity" tab (iter-8).
 *
 * Every rule row in RuleList already gets its own "Recent runs" disclosure
 * scoped to that one rule; this is the flat, all-rules, newest-first view —
 * "a separate section inside automations only for activities" (Maalik).
 * Reads `activityStore.ts` directly, once, via its single exported hook.
 *
 * SIMULATED ONLY, same honesty layer as the rest of Automations: every row
 * carries "(simulated)" and a skipped action says why, never silently
 * disappears. Rendered rows are capped (`MAX_SHOWN`) with an honest
 * "showing the most recent N of TOTAL" line rather than a silent truncation
 * — dropping rows without saying so reads as "that's everything."
 *
 * "Clear log" is a local-only demo reset (clears this browser's
 * localStorage key), never a real audit-trail deletion — labelled and
 * confirmed as such so it can't be mistaken for one.
 */
import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { clearActivity, useActivityLog } from "@/creative-report/automations/activityStore";

/** Rendered rows only — the store itself caps at ~300 entries; this caps
 *  what's actually painted on this tab. */
const MAX_SHOWN = 100;

function formatActivityAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "unknown time";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ActivityLog() {
  const { entries } = useActivityLog();
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  // Store already keeps entries newest-first (each write prepends its
  // batch) — no re-sort needed, just slice for display.
  const shown = useMemo(() => entries.slice(0, MAX_SHOWN), [entries]);
  const hiddenCount = entries.length - shown.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {entries.length === 0
            ? "No activity yet"
            : `${entries.length} entr${entries.length === 1 ? "y" : "ies"} · every row is simulated`}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
          onClick={() => setConfirmClearOpen(true)}
          disabled={entries.length === 0}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear local log
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No automation activity yet — run a rule (or let an auto-run rule fire) and every
            creative it touches will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="rounded-lg border border-border">
            {shown.map((entry, i) => (
              <div
                key={entry.id}
                className={
                  i === 0
                    ? "flex items-center justify-between gap-4 p-3"
                    : "flex items-center justify-between gap-4 border-t border-border p-3"
                }
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="truncate text-[13px] font-medium text-foreground">
                    {entry.creativeName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.ruleName}
                    {" — "}
                    {entry.outcome === "skipped" ? <>skipped: {entry.detail}</> : entry.detail}
                    {" (simulated)"}
                  </p>
                </div>
                <div className="shrink-0 text-right text-xs text-muted-foreground">
                  <p>{formatActivityAt(entry.at)}</p>
                  <p>{entry.source === "auto" ? "auto" : "manual"}</p>
                </div>
              </div>
            ))}
          </div>
          {hiddenCount > 0 && (
            <p className="text-xs text-muted-foreground">
              Showing the most recent {shown.length} of {entries.length}.
            </p>
          )}
        </div>
      )}

      <AlertDialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear the local activity log?</AlertDialogTitle>
            <AlertDialogDescription>
              This is a local reset for re-demoing this prototype — it clears every entry stored
              in this browser. It isn&apos;t a real audit-log deletion; nothing here ever reached
              a real system in the first place.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmClearOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearActivity();
                setConfirmClearOpen(false);
              }}
            >
              Clear log
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
