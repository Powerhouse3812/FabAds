import { AlertTriangle, Coins, Sparkles, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Provenance } from "@/genie6/lib/genieRunTypes";
import { CREDITS_REMAINING, CREDITS_LIMIT, formatCredits } from "@/genie6/lib/credits";

/**
 * Small shared presentational pieces used across all three catalogue
 * surfaces (Finder / ListPage / DetailPage) — kept in one file since none
 * of them is large enough to earn its own, per §21.2's "build it once"
 * instruction for anything that recurs across every asset type.
 */

/** §21.2 "every asset carries provenance — shown in the client UI so
 *  nobody confuses 'FabFunnel gave me this' with 'I made this'." */
export function ProvenanceBadge({ provenance, className }: { provenance: Provenance; className?: string }) {
  const isSeeded = provenance === "fabfunnel-seeded";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-[0.06em]",
        isSeeded
          // Was text-muted-foreground on bg-muted = 3.48:1, under the 4.5:1
          // floor. Same visual weight, readable.
          ? "border-muted-foreground/20 bg-muted text-foreground/80"
          : "border-primary/30 bg-primary/10 text-primary-text",
        className,
      )}
    >
      {isSeeded ? <Sparkles className="h-2.5 w-2.5" /> : <Building2 className="h-2.5 w-2.5" />}
      {isSeeded ? "FabFunnel-seeded" : "Client-created"}
    </span>
  );
}

/** §15 — "Balance shows in the Genie sub-nav (built), and now also in
 *  Catalogue and Studio." Reads the same `CREDIT_BALANCE` source of truth
 *  as the sub-nav meter so no surface ever disagrees with another. */
export function CreditsPill({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-mono font-medium text-foreground",
        className,
      )}
      title={`${formatCredits(CREDITS_REMAINING)} of ${formatCredits(CREDITS_LIMIT)} credits remaining`}
    >
      <Coins className="h-3.5 w-3.5 text-primary-text" />
      <span className="tabular-nums">{formatCredits(CREDITS_REMAINING)}</span>
      <span className="text-muted-foreground">/ {formatCredits(CREDITS_LIMIT)} credits</span>
    </div>
  );
}

/** Replaces the RECON-documented silent fallthrough-to-`products` bug —
 *  a type the registry doesn't recognise gets a real, honest empty state
 *  instead of quietly rendering the wrong data. */
export function UnknownAssetType({ type }: { type: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
        <AlertTriangle className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Unknown asset type</p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          "{type}" isn't registered in the Catalogue's asset-type list. Check{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono">src/catalogue/assetTypes.ts</code>.
        </p>
      </div>
    </div>
  );
}

/** §9 "Manually add or upload — the user is never dependent on fetched
 *  data alone" is honest only if the user also knows it won't survive a
 *  reload. Same disclosure pattern as `ad-entity-write-store.ts`'s Reports
 *  session-changes note. */
export function SessionScopeNote({ className }: { className?: string }) {
  return (
    <p className={cn("text-[11px] text-muted-foreground", className)}>
      Changes here are local to this session and reset on reload.
    </p>
  );
}
