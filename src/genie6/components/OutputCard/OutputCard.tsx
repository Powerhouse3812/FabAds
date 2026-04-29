import { useState } from "react";
import { Check, Download, Play, Rocket, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  EllipsisAction,
  KanbanColumn,
  OutputCardVariant,
  OutputData,
} from "../../types/output";
import { BrandChip } from "./BrandChip";
import { QualityScoreChip } from "./QualityScoreChip";
import { ModeBadge } from "./ModeBadge";
import { TextOnlyMotif } from "./TextOnlyMotif";
import { EllipsisMenu } from "./EllipsisMenu";
import { LineageChip } from "./LineageChip";
import { DisclosureStamp } from "../DisclosureStamp";

export interface OutputCardProps extends OutputData {
  variant?: OutputCardVariant;
  selectable?: boolean;
  selected?: boolean;
  kanbanColumn?: KanbanColumn;

  onSave?: () => void;
  onLaunch?: () => void;
  onDownload?: () => void;
  onEllipsisAction?: (action: EllipsisAction) => void;
  onSelect?: () => void;
  onClick?: () => void;
  onKanbanMove?: (col: KanbanColumn) => void;
}

function formatTime(d: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function shortId(id: string) {
  return id.length > 8 ? id.slice(0, 4).toUpperCase() + id.slice(-4).toUpperCase() : id.toUpperCase();
}

export function OutputCard({
  id,
  thumbnail,
  mediaType,
  headline,
  body,
  cta,
  brand,
  product,
  mode,
  qualityScore,
  generatedAt,
  parentWinnerId,
  variant = "grid",
  selectable = true,
  selected = false,
  onSave,
  onLaunch,
  onDownload,
  onEllipsisAction,
  onSelect,
  onClick,
}: OutputCardProps) {
  const [hovered, setHovered] = useState(false);
  const isCompact = variant === "compact";
  const showThumbnail = !isCompact;

  const handleCardClick = () => {
    onClick?.();
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const hasHeadline = Boolean(headline);

  return (
    <article
      onClick={handleCardClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-state={selected ? "selected" : undefined}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-g6-xl border border-g6-border-secondary bg-g6-bg-container text-left shadow-g6-sm transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-g6-border hover:shadow-g6-lg",
        selected && "ring-2 ring-g6-primary ring-offset-2 ring-offset-g6-bg-base",
        onClick && "cursor-pointer",
        isCompact ? "max-w-xs" : ""
      )}
    >
      {/* Thumbnail area */}
      {showThumbnail && (
        <div className="relative aspect-[4/5] w-full bg-g6-bg-spotlight">
          {mediaType === "text-only" ? (
            <TextOnlyMotif />
          ) : thumbnail ? (
            <img
              src={thumbnail}
              alt={headline ?? product?.name ?? "Generated output"}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">no preview</span>
            </div>
          )}

          {mediaType === "video" && thumbnail && (
            <span
              aria-hidden
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="rounded-full bg-g6-bg-base/80 p-2 backdrop-blur-sm">
                <Play className="h-5 w-5 fill-g6-text text-g6-text" />
              </span>
            </span>
          )}

          {/* Bottom-corner chips */}
          {brand && (
            <span className="absolute bottom-2 left-2">
              <BrandChip name={brand.name} logo={brand.logo} />
            </span>
          )}
          {qualityScore !== undefined && (
            <span className="absolute bottom-2 right-2">
              <QualityScoreChip score={qualityScore} />
            </span>
          )}

          {/* Selection checkbox — visible on hover or when selected */}
          {selectable && (hovered || selected) && (
            <button
              type="button"
              aria-label={selected ? "Deselect" : "Select"}
              onClick={(e) => {
                stop(e);
                onSelect?.();
              }}
              className={cn(
                "absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-g6-sm border-2 transition-colors",
                selected
                  ? "border-g6-primary bg-g6-primary text-g6-text-on-accent"
                  : "border-g6-border bg-g6-bg-elevated/95 text-transparent backdrop-blur-sm hover:border-g6-primary"
              )}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </button>
          )}
        </div>
      )}

      {/* Body */}
      <div className={cn("flex flex-col gap-2", isCompact ? "p-3" : "p-4")}>
        {hasHeadline ? (
          <h3 className="font-g6-sans text-g6-lg font-semibold leading-tight text-g6-text">
            {headline}
          </h3>
        ) : (
          <h3 className="font-g6-sans text-g6-lg font-semibold italic text-g6-text-tertiary">
            Untitled
          </h3>
        )}
        {body && (
          <p className="font-g6-sans text-g6-base text-g6-text-secondary line-clamp-2">{body}</p>
        )}
        {cta && (
          <span className="inline-flex w-fit items-center rounded-g6-pill border border-g6-border bg-g6-bg-base px-2.5 py-0.5 text-g6-sm font-medium text-g6-text">
            {cta}
          </span>
        )}

        {/* Footer — meta + actions */}
        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 truncate">
            <ModeBadge mode={mode} />
            <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">·</span>
            <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">{formatTime(generatedAt)}</span>
            <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">·</span>
            <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">#{shortId(id)}</span>
          </div>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {parentWinnerId && <LineageChip parentWinnerId={parentWinnerId} />}
          <DisclosureStamp />
        </div>

        {!isCompact && (
          <div className="mt-2 flex items-center gap-1 border-t border-g6-border-secondary pt-2">
            <CardActionBtn label="Save" Icon={Save} onClick={onSave} stopPropagation={stop} />
            <CardActionBtn label="Launch" Icon={Rocket} onClick={onLaunch} stopPropagation={stop} />
            <CardActionBtn label="Download" Icon={Download} onClick={onDownload} stopPropagation={stop} />
            <span className="ml-auto" onClick={stop}>
              <EllipsisMenu onAction={onEllipsisAction} />
            </span>
          </div>
        )}
      </div>
    </article>
  );
}

function CardActionBtn({
  label,
  Icon,
  onClick,
  stopPropagation,
}: {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  stopPropagation: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        stopPropagation(e);
        onClick?.();
      }}
      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-g6-base px-2 py-1.5 text-g6-sm font-medium text-g6-text-secondary transition-colors hover:bg-g6-bg-spotlight hover:text-g6-text"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
