/**
 * CreativeCard — thumbnail-hero grid card (handoff §5.2).
 * Flat surface: hero image + overlays (bucket, status, format, dedup),
 * name, one metric row (4 stats, NOT boxed tiles), and an action row that
 * exposes the loop. Optimistic chips reflect actions already taken.
 */
import { memo, useMemo, useState } from "react";
import {
  Bookmark,
  Image as ImageIcon,
  LayoutGrid,
  Rocket,
  Trophy,
  UploadCloud,
  Video,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { BucketChip } from "@/creative-report/components/BucketChip";
import { ActionMenu } from "@/creative-report/components/ActionMenu";
import { WhyDot } from "@/creative-report/components/WhyDot";
import { getBrand } from "@/mocks/shared/brands";
import { useCreativeActions } from "@/creative-report/actions/useCreativeActions";
import { useCreativeAction } from "@/creative-report/actions/actionStore";
import { useReportWorkflowsEnabled } from "@/creative-report/state/ReportBasePathContext";
import { useSyncStore } from "@/creative-report/automations/sync/syncStore";
import { summariseCreative } from "@/creative-report/automations/sync/selectors";
import type { CreativeSyncSummary, SyncRecord } from "@/creative-report/automations/sync/syncModel";
import { truncate, NAME_MAX } from "@/creative-report/lib/format";
import { FORMAT_LABELS } from "@/creative-report/lib/paramSchema";
import type { CreativeRollup } from "@/creative-report/lib/selectors";
import { COLUMN_BY_KEY, COLUMN_DEFS } from "@/creative-report/lib/columns";
import { useCardMetrics } from "@/creative-report/lib/cardMetrics";

/** Hover quick-peek shows up to this many metrics not already on the card. */
const PEEK_COUNT = 3;

const FORMAT_ICON = { video: Video, static: ImageIcon, carousel: LayoutGrid } as const;

function heroSeed(thumbKey: string) {
  return `https://picsum.photos/seed/${thumbKey}/600/338`;
}

export function CreativeCard({
  rollup,
  selected,
  onToggleSelect,
}: {
  rollup: CreativeRollup;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}) {
  const { creative, metrics, bucket } = rollup;
  const a = useCreativeActions();
  const actionState = useCreativeAction(creative.id);
  const [imgError, setImgError] = useState(false);
  const FmtIcon = FORMAT_ICON[creative.format];
  const name = truncate(creative.name, NAME_MAX);
  const brand = creative.brandId ? getBrand(creative.brandId) : undefined;
  const { active: activeMetrics } = useCardMetrics();
  // Quick-peek on hover: metrics NOT already on the card, capped at PEEK_COUNT.
  // Max active is 6 of 13 keys, so there is always at least one leftover —
  // the empty-list guard below is defensive only.
  const peekDefs = COLUMN_DEFS.filter((c) => !activeMetrics.includes(c.key)).slice(0, PEEK_COUNT);

  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border bg-card transition-colors",
        selected ? "border-primary/60 ring-1 ring-primary" : "border-border hover:border-foreground/20",
      )}
    >
      {/* Hero */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {!imgError ? (
          <img
            src={heroSeed(creative.thumbKey)}
            alt=""
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full cursor-pointer object-cover"
            onClick={() => a.view(creative.id)}
          />
        ) : (
          <button
            type="button"
            onClick={() => a.view(creative.id)}
            className="flex h-full w-full items-center justify-center"
            aria-label="View details"
          >
            <FmtIcon className="h-8 w-8 text-muted-foreground" />
          </button>
        )}

        {/* Select checkbox — z-10 keeps it visible above the hover quick-peek
            overlay, so bulk-select stays targetable while hovering. */}
        <div className="absolute left-2 top-2 z-10">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelect(creative.id)}
            aria-label="Select creative"
            className="border-white/70 bg-black/30 backdrop-blur data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
        </div>

        {/* Bucket chip */}
        {bucket && (
          <div className="absolute right-2 top-2 flex items-center gap-1">
            <WhyDot id="grid.bucket" className="rounded-full bg-black/30 text-white/80 backdrop-blur hover:text-white" />
            <BucketChip bucket={bucket} size="xs" />
          </div>
        )}

        {/* Format + dedup, bottom-left */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-foreground backdrop-blur">
            <FmtIcon className="h-3 w-3" />
            {FORMAT_LABELS[creative.format]}
          </span>
          {creative.dedupMatch && (
            <span className="flex items-center gap-1">
              <WhyDot id="grid.dedup" className="rounded-full bg-black/30 text-white/80 backdrop-blur hover:text-white" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {Math.round(creative.dedupMatch * 100)}% dup
                  </span>
                </TooltipTrigger>
                <TooltipContent>Possibly the same creative — open to merge or split.</TooltipContent>
              </Tooltip>
            </span>
          )}
          <SyncedIndicator creativeId={creative.id} />
        </div>

        {/* Optimistic status chips, bottom-right */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          {actionState.paused && <StatusPill label="Paused" tone="muted" />}
          {actionState.queuedInLaunch && <StatusPill label="Queued in Launch" tone="lime" />}
          {actionState.markedWinner && <StatusPill label="Winner" tone="lime" />}
          {actionState.savedToLibrary && <StatusPill label="Saved" tone="muted" />}
        </div>

        {/* Hover quick-peek — metrics not already on the card, no drawer open */}
        {peekDefs.length > 0 && (
          <div
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/90 opacity-0 backdrop-blur transition-opacity duration-150 group-hover:opacity-100"
            aria-hidden="true"
          >
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              More metrics
            </span>
            <div className="flex items-center gap-4">
              {peekDefs.map((c) => (
                <div key={c.key} className="flex flex-col items-center">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {c.label}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {c.format(metrics)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-3">
        <button
          type="button"
          onClick={() => a.view(creative.id)}
          className="text-left"
          title={name.truncated ? creative.name : undefined}
        >
          <span className="line-clamp-1 text-sm font-medium text-foreground">{name.text}</span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {brand ? `${brand.name} · ${creative.product}` : creative.product}
          </span>
        </button>

        {/* Tag chips — 2 of 5 tag facets, flat row (no nested card) */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {creative.tags.messagingAngle}
          </span>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {creative.tags.emotion}
          </span>
        </div>

        {/* User-picked metrics (up to 6) — one flat row, not boxed tiles */}
        <div className="flex items-end justify-between gap-2">
          {activeMetrics.map((key) => {
            const col = COLUMN_BY_KEY[key];
            return (
              <Metric
                key={key}
                label={col.label}
                value={col.format(metrics)}
                annotationId={`grid.metric.${key}`}
              />
            );
          })}
        </div>

        {/* Action row */}
        <div className="mt-auto flex items-center gap-1 border-t border-border pt-2">
          <IconAction
            label="Generate variation"
            onClick={() => a.generateVariation(rollup)}
            annotationId="grid.action.generateVariation"
          >
            <Wand2 className="h-4 w-4" />
          </IconAction>
          <IconAction label="Relaunch" onClick={() => a.launch(rollup)} annotationId="grid.action.relaunch">
            <Rocket className="h-4 w-4" />
          </IconAction>
          <IconAction
            label="Save to Library"
            onClick={() => a.saveToLibrary(rollup)}
            annotationId="grid.action.save"
          >
            <Bookmark className="h-4 w-4" />
          </IconAction>
          <IconAction
            label="Mark as Winner"
            onClick={() => a.markWinner(rollup)}
            annotationId="grid.action.markWinner"
          >
            <Trophy className="h-4 w-4" />
          </IconAction>
          <div className="ml-auto">
            <ActionMenu rollup={rollup} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  annotationId,
}: {
  label: string;
  value: string;
  annotationId?: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="flex items-center gap-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        {annotationId && <WhyDot id={annotationId} />}
      </span>
      <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function IconAction({
  label,
  onClick,
  children,
  annotationId,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  annotationId?: string;
}) {
  return (
    <div className="relative">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClick} aria-label={label}>
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      {annotationId && (
        <span className="pointer-events-auto absolute -right-0.5 -top-0.5">
          <WhyDot id={annotationId} />
        </span>
      )}
    </div>
  );
}

/**
 * Folder attribution is a PER-RECORD fact, not a per-creative one — the sync
 * idempotency key is `creativeId::accountId` with deliberately NO folder
 * segment (see syncModel.ts's pair-key decision header), so provenance is
 * first-writer-wins per account. `summary.records` spans every account this
 * creative touched, so picking any single record's `folderName` and stating
 * it as "via folder X" would claim that folder for accounts that arrived a
 * completely different way (e.g. a manual push, or a different folder).
 * Only state a folder name when it is true of EVERY record — i.e. every
 * account this creative went to arrived via the same folder. Anything less
 * unanimous says nothing here rather than picking a winner and reporting it
 * as if it applied everywhere. Matches `SyncStatusPanel.tsx`'s `folderLine`,
 * which does the equivalent check per-record instead of aggregating.
 */
function commonFolderName(records: SyncRecord[]): string | undefined {
  const first = records[0]?.folderName;
  if (!first) return undefined;
  return records.every((r) => r.folderName === first) ? first : undefined;
}

/** Honest, additive tooltip copy — every clause is read straight off the
 *  summary, nothing inferred or guessed. Order (synced → in-flight → failed
 *  → folder) matches the priority a user scanning before a bulk re-sync would
 *  care about: "is it already there" first, "is something still happening"
 *  second, "did anything break" third, "did it arrive as part of a folder
 *  push" last since that's context, not a status. Trailing "(simulated)"
 *  matches every sibling surface (`SyncStatusPanel.tsx`'s `provenanceLine`,
 *  `ActionNode`'s permanent chip) — this grid is the most screenshot-prone
 *  surface in the app, so it's the worst place for that admission to be
 *  missing. */
function syncTooltip(summary: CreativeSyncSummary): string {
  const parts: string[] = [];
  const { syncedAccountIds, inFlightAccountIds, failedAccountIds, records } = summary;

  if (syncedAccountIds.length > 0) {
    parts.push(`Synced to ${syncedAccountIds.length} ad account${syncedAccountIds.length === 1 ? "" : "s"}`);
  }
  if (inFlightAccountIds.length > 0) {
    parts.push(`syncing to ${inFlightAccountIds.length} more`);
  }
  if (failedAccountIds.length > 0) {
    parts.push(`failed for ${failedAccountIds.length}`);
  }
  const folderName = commonFolderName(records);
  if (folderName) {
    parts.push(`via folder "${folderName}"`);
  }

  return `${parts.join(" · ")} (simulated)`;
}

/**
 * The badge's aria-label — and by extension what it visually implies —
 * must be a clause that's actually TRUE of this creative's dominant state,
 * not a blanket "already synced" regardless of what's inside `records`.
 * A creative whose records are only queued or only failed has NEVER
 * actually synced anywhere, so labelling it "Already synced" would be a
 * flat fabrication. Priority mirrors `syncTooltip`: synced beats in-flight
 * beats failed, because a creative that's synced to even ONE account has
 * genuinely synced, regardless of what's still happening or broke
 * elsewhere. Only called once `summary.records.length > 0` (see the render
 * guard below), so one of these three arrays is always non-empty. */
function syncedIndicatorLabel(summary: CreativeSyncSummary): string {
  if (summary.syncedAccountIds.length > 0) return "Already synced to an ad account (simulated)";
  if (summary.inFlightAccountIds.length > 0) return "Syncing to an ad account (simulated)";
  return "Sync failed for an ad account (simulated)";
}

/**
 * Grid-level "already synced somewhere" indicator (Maalik, 31 Jul): before a
 * bulk-select + sync, the user needs to see at a glance that a creative has
 * already gone out via SOME automation — possibly a different one than the
 * one they're about to run — so they don't blindly re-push it. Reads the
 * exact same sync-history store `SyncStatusPanel` reads in the drawer (one
 * store, no separate truth to keep in sync).
 *
 * ISOLATED INTO ITS OWN LEAF COMPONENT — this split IS the performance
 * answer for this file, not an incidental refactor. `useSyncStore()` is the
 * store's only hook and always returns the WHOLE snapshot (there is no
 * per-creative selector — see syncStore.ts's file header, which explicitly
 * rules one out). The queue runner calls `advanceQueue` on a 500ms tick
 * while any sync is active, and that emits a new state reference whenever
 * ANY record ANYWHERE crosses a progress boundary — not just records for
 * creatives currently on screen. Calling `useSyncStore()` at the top of
 * `CreativeCard` would subscribe the WHOLE card (hero image, two tooltips,
 * four icon actions, ActionMenu, hover quick-peek) to that tick, so a
 * 60-card grid would re-render 60 full card trees several times a second
 * during any active sync — the exact jank `advanceQueue`'s own doc comment
 * warns about. Pushing the subscription down into this small leaf instead
 * means a tick still touches up to 60 components, but each is one icon +
 * tooltip, not a full card.
 *
 * `React.memo` here does NOT gate that per-tick re-render — memo compares
 * PROPS, and a re-render triggered by this component's OWN `useSyncStore()`
 * call happens regardless of props, so every mounted `SyncedIndicator` still
 * re-renders on every tick with or without memo. What memo actually buys:
 * `creativeId` is its ONLY prop, and it's a stable primitive, so when
 * `CreativeCard` re-renders for a reason that has NOTHING to do with sync
 * (selection toggle, hover quick-peek, an unrelated action firing) memo
 * skips re-rendering this leaf instead of doing it needlessly. Conclusion:
 * still whole-store subscription (unavoidable without editing the store,
 * which this task doesn't own), but the re-render blast radius for an actual
 * sync tick is a cheap leaf, not the expensive card body — and memo
 * additionally spares that leaf from re-renders that were never sync-related
 * in the first place.
 */
const SyncedIndicator = memo(function SyncedIndicator({ creativeId }: { creativeId: string }) {
  const enabled = useReportWorkflowsEnabled();
  const state = useSyncStore();
  const summary = useMemo(() => summariseCreative(state, creativeId), [state, creativeId]);

  // Never-synced (~1 in 4 seeded creatives, see syncStore.ts's seed comment)
  // is a real, expected state — render nothing rather than an empty badge.
  if (!enabled || summary.records.length === 0) return null;

  // Worst-state tint only — synced-but-also-failed-elsewhere still reads as
  // "already synced" (muted, quiet) rather than alarming, because some of it
  // genuinely did land; only an ALL-failed creative earns the warning color.
  const failedOnly =
    summary.failedAccountIds.length > 0 &&
    summary.syncedAccountIds.length === 0 &&
    summary.inFlightAccountIds.length === 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-full bg-background/80 backdrop-blur",
            failedOnly ? "text-destructive" : "text-muted-foreground",
          )}
          aria-label={syncedIndicatorLabel(summary)}
        >
          <UploadCloud className="h-2.5 w-2.5" />
        </span>
      </TooltipTrigger>
      <TooltipContent>{syncTooltip(summary)}</TooltipContent>
    </Tooltip>
  );
});

function StatusPill({ label, tone }: { label: string; tone: "lime" | "muted" }) {
  return (
    <span
      className={cn(
        "rounded-full px-1.5 py-0.5 text-[10px] font-medium backdrop-blur",
        tone === "lime"
          ? "bg-primary/90 text-primary-foreground"
          : "bg-background/80 text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}
