import { Play, Bookmark, Plus, Link2, Frame, MoreHorizontal, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OutputData } from "../../types/output";

interface BatchOutputCardProps {
  output: OutputData;
  /** When true, renders a video play overlay on the thumbnail. Auto-detected from output.mediaType === "video". */
  showPlayOverlay?: boolean;
  /** When set, shows an active/days status pill in the header. */
  statusPill?: { label: string; color: "active" | "neutral" };
  /** Called when the whole card is clicked. */
  onClick?: () => void;
  /** Footer action handlers */
  onSaveToBoard?: () => void;
  onSaveAd?: () => void;
  onCopyLink?: () => void;
  onAddToFrame?: () => void;
  onMore?: () => void;
  className?: string;
}

/**
 * BatchOutputCard — sibling-card variant for the canonical Ad Detail drawer's
 * "Generated in same batch" 3-col grid. Visually adjacent to OutputCard but
 * carries a distinct footer (5 quick-action icons), brand-row treatment
 * (avatar + follow + status pill), and a Figma-spec body block (brand URL +
 * View collection pill + headline + sub).
 *
 * Pixel targets follow Fabfunnel v1.2 tokens — rounded-xl outer, shadcn
 * surface tokens, Geist Sans body + Geist Mono on the brand URL eyebrow.
 */
export function BatchOutputCard({
  output,
  showPlayOverlay,
  statusPill = { label: "Active", color: "active" },
  onClick,
  onSaveToBoard,
  onSaveAd,
  onCopyLink,
  onAddToFrame,
  onMore,
  className,
}: BatchOutputCardProps) {
  const isVideo = output.mediaType === "video";
  const playOverlay = showPlayOverlay ?? isVideo;

  return (
    <article
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-all duration-150 hover:-translate-y-px hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {/* Header — avatar + brand + status pill + ellipsis */}
      <header className="flex items-center gap-2 px-3 pt-3 pb-1">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-[12px] font-semibold text-foreground truncate">
            {output.brand?.name ?? "Brand"}
          </span>
          <UserPlus className="h-3 w-3 text-muted-foreground/70 shrink-0" />
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-1.5 py-0 text-[10px] font-medium",
            statusPill.color === "active"
              ? "bg-muted/40 text-foreground/65"
              : "bg-muted/40 text-foreground/65",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              statusPill.color === "active" ? "bg-[hsl(var(--success-text))]" : "bg-muted-foreground",
            )}
          />
          {statusPill.label}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMore?.();
          }}
          className="h-5 w-5 inline-flex items-center justify-center rounded hover:bg-muted/40"
        >
          <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
        </button>
      </header>

      {/* Headline + "Read more" */}
      <div className="px-3 py-1">
        <p className="text-[12px] leading-snug text-foreground line-clamp-2">
          {output.headline ?? "Untitled generation"}
          {output.headline && output.headline.length > 80 && (
            <span className="text-muted-foreground italic"> Read more</span>
          )}
        </p>
      </div>

      {/* Thumbnail with optional play overlay */}
      <div className="relative aspect-[4/5] w-full bg-muted overflow-hidden">
        {output.thumbnail ? (
          <img
            src={output.thumbnail}
            alt={output.headline ?? "Generation preview"}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              Preview unavailable
            </span>
          </div>
        )}
        {playOverlay && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm">
              <Play className="h-5 w-5 fill-white text-white" />
            </span>
          </span>
        )}
      </div>

      {/* Body block — brand URL + view collection */}
      <div className="px-3 py-2 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10.5px] text-muted-foreground/70 truncate">
            {(output.brand?.name?.toLowerCase().replace(/\s+/g, "") ?? "brand") + ".com"}
          </span>
          <button
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center rounded-full bg-muted/40 px-2 py-0.5 text-[10.5px] text-foreground/65 hover:bg-muted/60 transition-colors"
          >
            View collection
          </button>
        </div>
        <p className="text-[11.5px] text-foreground leading-tight line-clamp-1">
          {output.body?.split(".")[0] ?? "—"}
        </p>
        <p className="text-[11px] text-muted-foreground leading-tight line-clamp-1">
          {output.body ? `${output.body.slice(0, 40)}…` : "—"}
        </p>
      </div>

      {/* Footer — 5 action icons */}
      <footer className="mt-auto border-t border-border/60 flex items-center justify-between px-3 py-2">
        <IconBtn
          onClick={(e) => {
            e.stopPropagation();
            onSaveToBoard?.();
          }}
          icon={Bookmark}
          label="Save to board"
        />
        <IconBtn
          onClick={(e) => {
            e.stopPropagation();
            onSaveAd?.();
          }}
          icon={Plus}
          label="Save ad"
        />
        <IconBtn
          onClick={(e) => {
            e.stopPropagation();
            onCopyLink?.();
          }}
          icon={Link2}
          label="Copy link"
        />
        <IconBtn
          onClick={(e) => {
            e.stopPropagation();
            onAddToFrame?.();
          }}
          icon={Frame}
          label="Add to frame"
        />
        <IconBtn
          onClick={(e) => {
            e.stopPropagation();
            onMore?.();
          }}
          icon={MoreHorizontal}
          label="More"
        />
      </footer>
    </article>
  );
}

function IconBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Bookmark;
  label: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-muted/40 transition-colors"
    >
      <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
    </button>
  );
}
