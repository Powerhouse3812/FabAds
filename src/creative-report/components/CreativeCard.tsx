/**
 * CreativeCard — thumbnail-hero grid card (handoff §5.2).
 * Flat surface: hero image + overlays (bucket, status, format, dedup),
 * name, one metric row (4 stats, NOT boxed tiles), and an action row that
 * exposes the loop. Optimistic chips reflect actions already taken.
 */
import { useState } from "react";
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
import { getBrand } from "@/mocks/shared/brands";
import { useCreativeActions } from "@/creative-report/actions/useCreativeActions";
import { useCreativeAction } from "@/creative-report/actions/actionStore";
import {
  fmtCompactCurrency,
  fmtMultiple,
  fmtPct,
  fmtCurrency,
  truncate,
  NAME_MAX,
} from "@/creative-report/lib/format";
import { FORMAT_LABELS } from "@/creative-report/lib/paramSchema";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

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

        {/* Select checkbox */}
        <div className="absolute left-2 top-2">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelect(creative.id)}
            aria-label="Select creative"
            className="border-white/70 bg-black/30 backdrop-blur data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
        </div>

        {/* Bucket chip */}
        {bucket && (
          <div className="absolute right-2 top-2">
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
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {Math.round(creative.dedupMatch * 100)}% dup
                </span>
              </TooltipTrigger>
              <TooltipContent>Possibly the same creative — open to merge or split.</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Optimistic status chips, bottom-right */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          {actionState.paused && <StatusPill label="Paused" tone="muted" />}
          {actionState.queuedInLaunch && <StatusPill label="Queued in Launch" tone="lime" />}
          {actionState.markedWinner && <StatusPill label="Winner" tone="lime" />}
          {actionState.savedToLibrary && <StatusPill label="Saved" tone="muted" />}
        </div>
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

        {/* 4 key metrics — one flat row, not boxed tiles */}
        <div className="flex items-end justify-between gap-2">
          <Metric label="Spend" value={fmtCompactCurrency(metrics.spend)} />
          <Metric label="ROAS" value={fmtMultiple(metrics.roas)} />
          <Metric label="CPA" value={metrics.cpa === null ? "—" : fmtCurrency(metrics.cpa, { decimals: 0 })} />
          <Metric label="CTR" value={fmtPct(metrics.ctr)} />
        </div>

        {/* Action row */}
        <div className="mt-auto flex items-center gap-1 border-t border-border pt-2">
          <IconAction label="Generate variation" onClick={() => a.generateVariation(rollup)}>
            <Wand2 className="h-4 w-4" />
          </IconAction>
          <IconAction label="Relaunch" onClick={() => a.launch(rollup)}>
            <Rocket className="h-4 w-4" />
          </IconAction>
          <IconAction label="Save to Library" onClick={() => a.saveToLibrary(rollup)}>
            <Bookmark className="h-4 w-4" />
          </IconAction>
          <IconAction label="Mark as Winner" onClick={() => a.markWinner(rollup)}>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function IconAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClick} aria-label={label}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
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
