import { Copy, Bookmark, LayoutGrid, Link as LinkIcon, MoreHorizontal, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformIcons } from "./PlatformIcons";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import type { InsightAd } from "@/lib/insights-dummy-data";

interface SimilarAdCardProps {
  ad: InsightAd;
  onSelect?: (ad: InsightAd) => void;
  className?: string;
}

/**
 * Hybrid card used inside the Ad Detail Drawer's "Similar Ads" full-width
 * grid. Top half = compact metadata stub (frame 3 reference — Ad ID, Created
 * on, Total active, Similar Ads count + platforms). Bottom half = feed-card
 * style mini ad (frame 1 reference — brand row, primary text, media thumb,
 * domain, headline, action row).
 *
 * Click anywhere outside the action buttons → opens that ad in the same
 * drawer via `onSelect`.
 */
export function SimilarAdCard({ ad, onSelect, className }: SimilarAdCardProps) {
  const createdLabel = new Date(ad.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const isActive = ad.status === "active";
  const sinceLabel = formatDistanceToNow(new Date(ad.createdAt), { addSuffix: false });

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(ad)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(ad);
        }
      }}
      className={cn(
        "group flex flex-col rounded-xl border border-border bg-card overflow-hidden",
        "transition-colors hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        "cursor-pointer",
        className,
      )}
    >
      {/* ── Top: metadata stub (frame 3 style) ── */}
      <div className="px-3 pt-3 pb-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
            <span>Ad ID:</span>
            <span className="text-foreground truncate max-w-[140px]">{ad.adId}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(ad.adId);
              toast.success("Ad ID copied");
            }}
            className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
            aria-label="Copy Ad ID"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          <div className="text-muted-foreground">
            Created on: <span className="text-foreground">{createdLabel}</span>
          </div>
          <div className="text-muted-foreground">
            Total active: <span className="text-foreground">{ad.activeDuration}</span>
          </div>
          <div className="text-muted-foreground">
            Similar Ads: <span className="text-foreground">{String(ad.similarAdsCount).padStart(2, "0")}</span>
          </div>
          <div className="flex justify-end">
            <PlatformIcons platforms={ad.platforms} />
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-border/60" />

      {/* ── Bottom: feed-card visuals (frame 1 style) ── */}
      <div className="p-3 space-y-2">
        {/* Active since row + bookmark */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isActive ? "bg-emerald-500" : "bg-muted-foreground/40",
              )}
              aria-hidden
            />
            Active since: <span className="text-foreground">{sinceLabel}</span>
          </span>
          <button
            onClick={(e) => e.stopPropagation()}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Save to Library"
          >
            <Bookmark className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Brand row */}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[11px] font-semibold shrink-0">
            {ad.brand[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-foreground truncate">{ad.brand}</p>
            <p className="text-[10px] text-muted-foreground">{ad.adType}</p>
          </div>
          <Badge
            variant={isActive ? "default" : "secondary"}
            className={cn(
              "text-[9px] px-1.5 py-0 h-4 shrink-0",
              isActive
                ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30"
                : "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30",
            )}
          >
            {isActive ? "Active now" : "Inactive now"}
          </Badge>
        </div>

        {/* Primary text — clamped */}
        <p className="text-[11px] text-foreground/85 leading-relaxed line-clamp-2">
          {ad.primaryText}
        </p>

        {/* Media block */}
        {ad.mediaUrl && (
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            <img
              src={ad.thumbUrl || ad.mediaUrl}
              alt={ad.headline}
              className="w-full h-full object-cover"
            />
            {(ad.transparencyMode || ad.analysed) && (
              <div className="absolute bottom-1.5 left-1.5 flex gap-1">
                {ad.transparencyMode && (
                  <Badge className="text-[8px] h-3.5 px-1 bg-background/80 text-foreground border-none">
                    Transparency
                  </Badge>
                )}
                {ad.analysed && (
                  <Badge className="text-[8px] h-3.5 px-1 bg-background/80 text-foreground border-none">
                    Analysed
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {/* Domain + headline + description */}
        <div className="space-y-0.5">
          <p className="text-[10px] font-mono text-muted-foreground truncate">{ad.domain}</p>
          <p className="text-[11px] font-medium text-foreground truncate">{ad.headline}</p>
          <p className="text-[10px] text-muted-foreground line-clamp-1">{ad.description}</p>
        </div>

        {/* Action icons row */}
        <div className="flex items-center gap-1 pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
            aria-label="Add to competitor"
          >
            <UserPlus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
            aria-label="Save to Board"
          >
            <LayoutGrid className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(ad.adId);
              toast.success("Link copied");
            }}
            aria-label="Copy link"
          >
            <LinkIcon className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground ml-auto"
            onClick={(e) => e.stopPropagation()}
            aria-label="More"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </article>
  );
}
