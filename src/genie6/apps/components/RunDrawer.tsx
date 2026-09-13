import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PulsingRingLoader } from "../../components/PulsingRingLoader";
import type { RunBatch } from "../../lib/genieRunTypes";
import type { GenieApp } from "../appTypes";
import { BatchGroup } from "./BatchGroup";

/**
 * RunDrawer — where an Other App's results are SEEN (Maalik, 2026-09-09).
 *
 * The problem it fixes, in his words: results rendered below the fold and
 * "pata hi nahi chal rha ki generate ho rha hai kuchh, merko lga bug hai" —
 * the owner himself read a working generation as a broken button. So the
 * drawer opens the INSTANT `startBatch()` returns, before a single tick has
 * run: the confirmation is the panel appearing, not the first thumbnail.
 *
 * It is a VIEW, not a second results system:
 *  - the batch comes from the ONE run store (`useBatch` in the caller), so
 *    closing this panel cannot cancel, pause or lose a run — there is no run
 *    state here to throw away. Cancel remains an explicit control inside
 *    `BatchProgressHeader`.
 *  - the rendering is `BatchGroup`, the same composition the page used to
 *    show below the fold (§18 — one progress + failure pattern).
 *  - every output still lands in the Library / Recent Generations under its
 *    Batch ID exactly as before. The footer says so and links there.
 *
 * Outside-click dismiss is off app-wide (standing rule, 2026-08-01) — that's
 * enforced inside `SheetContent` itself, so Escape and the explicit close
 * controls are the only ways out. Worth having here beyond the house rule: a
 * stray click while watching a render must not wipe the only surface telling
 * you the render exists.
 */
export function RunDrawer({
  app,
  batch,
  earlier,
  open,
  onOpenChange,
}: {
  app: GenieApp;
  /** The run this drawer is focused on — undefined only in the split second
   *  before the store commits, or if a batch id ever goes stale. */
  batch: RunBatch | undefined;
  /** Every other run this app has produced, newest first. */
  earlier: RunBatch[];
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-[720px]"
      >
        <SheetHeader className="shrink-0 space-y-1 border-b border-border px-6 pb-4 pr-14 pt-6 text-left sm:text-left">
          <SheetTitle className="text-[16px] font-bold text-foreground">Results</SheetTitle>
          <SheetDescription className="text-[12.5px]">
            {app.name} — this run keeps going if you close this panel, and every output lands in
            your Library under its Batch ID.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {batch ? <BatchGroup batch={batch} /> : <StartingState />}

          {earlier.length > 0 && (
            <section className="mt-7 flex flex-col gap-4 border-t border-border pt-6">
              <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Earlier runs on this app
              </h3>
              {earlier.map((b) => (
                <BatchGroup key={b.batchId} batch={b} />
              ))}
            </section>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-6 py-4">
          <Link
            to="/iq/genie6/library"
            className="inline-flex items-center gap-1 rounded text-[12.5px] font-medium text-primary-text underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Open your Library
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <SheetClose asChild>
            <Button type="button" variant="outline" size="sm" className="rounded-full">
              Close
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * First paint. `startBatch()` commits synchronously, so in practice the batch
 * is already there by the time this renders — but the drawer must never be
 * able to open onto nothing, because a blank panel is the same "is it broken?"
 * failure the drawer exists to remove.
 */
function StartingState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-12 text-center">
      <PulsingRingLoader size={40} />
      <p className="text-[13px] font-semibold text-foreground">Starting your run</p>
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
        Queued
      </p>
    </div>
  );
}
