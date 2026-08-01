/**
 * SyncBadge — small status pill for the "sync to Meta ad account library"
 * automation action. Mirrors the sizing/tone approach of the local
 * `StatusPill` in `CreativeCard.tsx` (~lines 290-303) so it sits naturally
 * in the same chip cluster, and the muted/lime split from `BucketChip`.
 *
 * CRITICAL — this component must NEVER read the sync store itself, and must
 * not call React's external-store subscription hook at all. Wiring that
 * hook's snapshot function directly to `summariseCreative(state, id)` looks
 * intuitive but computes a brand-new object on every call, which breaks the
 * hook's reference-identity check and sends React into an infinite
 * re-render (the page goes white) — see `boards.ts:11-16` for the original
 * occurrence of this exact bug in this repo. So: this component takes a
 * plain `summary` prop. Each of the four consuming surfaces must subscribe
 * to the sync store once at the top of its own tree, then
 * `useMemo(() => summariseCreative(state, id), [...])` before handing the
 * result down here.
 */
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ACCOUNT_BY_ID } from "@/data/accounts";
import {
  SYNC_STATUS_LABELS,
  type CreativeSyncSummary,
} from "@/creative-report-v2/automations/sync/syncModel";

interface SyncBadgeProps {
  summary: CreativeSyncSummary;
  size: "xs" | "sm";
}

type Tone = "lime" | "muted" | "destructive";

const TONE_STYLES: Record<Tone, string> = {
  lime: "bg-primary/15 text-primary-text",
  muted: "bg-muted text-muted-foreground",
  destructive: "bg-destructive/10 text-destructive",
};

/** Honesty layer: a raw account id is never a name. An id that no longer
 *  resolves (account removed after the record was written) says so plainly
 *  rather than leaking `act_…` into a slot the user reads as a name. */
function accountName(accountId: string): string {
  return ACCOUNT_BY_ID[accountId]?.name ?? "Unknown account";
}

export function SyncBadge({ summary, size }: SyncBadgeProps) {
  const { syncedAccountIds, inFlightAccountIds, failedAccountIds, records } = summary;

  // Priority: in-flight (something is actively happening) > failed (needs
  // attention) > synced (steady state) > zero. A pair that's both synced
  // elsewhere and failed here still needs the failure surfaced.
  let label: string;
  let tone: Tone;

  if (inFlightAccountIds.length > 0) {
    label = SYNC_STATUS_LABELS.running; // "Uploading"
    tone = "muted";
  } else if (failedAccountIds.length > 0) {
    label = `${SYNC_STATUS_LABELS.failed} · ${failedAccountIds.length}`;
    tone = "destructive";
  } else if (syncedAccountIds.length > 0) {
    label = `${SYNC_STATUS_LABELS.done} · ${syncedAccountIds.length}`;
    tone = "lime";
  } else {
    // Zero state — hard rule: never a bare dash. xs is too tight to carry
    // "Not synced" without crowding the chip cluster, so it renders nothing
    // there; sm surfaces (drawer/detail rows) always say it plainly.
    if (size === "xs") return null;
    label = "Not synced";
    tone = "muted";
  }

  const pill = (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium leading-none",
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
        TONE_STYLES[tone],
      )}
    >
      {label}
    </span>
  );

  if (records.length === 0) {
    return pill;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          {pill}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        <ul className="space-y-0.5 text-xs">
          {records.map((record) => (
            <li key={record.id} className="flex items-center justify-between gap-3">
              <span className="truncate">{accountName(record.accountId)}</span>
              <span className="shrink-0 text-muted-foreground">{SYNC_STATUS_LABELS[record.status]}</span>
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-xs text-muted-foreground">(simulated)</p>
      </TooltipContent>
    </Tooltip>
  );
}
