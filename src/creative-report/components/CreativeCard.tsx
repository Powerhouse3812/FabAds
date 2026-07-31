/**
 * CreativeCard — thumbnail-hero grid card (handoff §5.2).
 * Flat surface: hero image + overlays (bucket, status, format, dedup),
 * name, one metric row (4 stats, NOT boxed tiles), and an action row that
 * exposes the loop. Optimistic chips reflect actions already taken.
 */
import { useMemo, useState } from "react";
import {
  Bookmark,
  Image as ImageIcon,
  LayoutGrid,
  Rocket,
  Trophy,
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
import { truncate, NAME_MAX } from "@/creative-report/lib/format";
import { FORMAT_LABELS } from "@/creative-report/lib/paramSchema";
import type { CreativeRollup } from "@/creative-report/lib/selectors";
import { COLUMN_BY_KEY, COLUMN_DEFS } from "@/creative-report/lib/columns";
import { useCardMetrics } from "@/creative-report/lib/cardMetrics";
import { useReportWorkflowsEnabled } from "@/creative-report/state/ReportBasePathContext";
import { useSyncStore } from "@/creative-report/automations/sync/syncStore";
import { summariseCreative } from "@/creative-report/automations/sync/selectors";
import { SyncBadge } from "@/creative-report/automations/components/SyncBadge";

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
  const workflowsEnabled = useReportWorkflowsEnabled();
  const syncState = useSyncStore();
  const syncSummary = useMemo(
    () => summariseCreative(syncState, creative.id),
    [syncState, creative.id],
  );
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
        </div>

        {/* Optimistic status chips, bottom-right */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          {actionState.paused && <StatusPill label="Paused" tone="muted" />}
          {actionState.queuedInLaunch && <StatusPill label="Queued in Launch" tone="lime" />}
          {actionState.markedWinner && <StatusPill label="Winner" tone="lime" />}
          {actionState.savedToLibrary && <StatusPill label="Saved" tone="muted" />}
          {workflowsEnabled && <SyncBadge size="xs" summary={syncSummary} />}
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
