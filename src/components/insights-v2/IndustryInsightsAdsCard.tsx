import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Bookmark,
  LayoutGrid,
  Play,
  Clock,
  Link as LinkIcon,
  Sparkles,
  MoreHorizontal,
  UserPlus,
  Heart,
  ShieldCheck,
  FilePlus,
  ListPlus,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PlatformIcons } from "@/components/insights/PlatformIcons";
import type { InsightAd } from "@/lib/insights-dummy-data";

interface IndustryInsightsAdsCardProps {
  ad: InsightAd;
  savedCount?: number;
  isSavedToBoard?: boolean;
  isFollowedBrand?: boolean;
  isSelected?: boolean;
  selectable?: boolean;
  onSaveToBoard?: (ad: InsightAd) => void;
  onUnsaveFromBoard?: (ad: InsightAd) => void;
  onViewDetail?: (ad: InsightAd) => void;
  onAddBrandToCompetitors?: (ad: InsightAd) => void;
  onAddPageToCompetitors?: (ad: InsightAd) => void;
  onFollowBrand?: (ad: InsightAd) => void;
  onSaveAd?: (ad: InsightAd) => void;
  onCopyLink?: (ad: InsightAd) => void;
  onSelectToggle?: (ad: InsightAd) => void;
}

function AvatarFallbackInitials({ name }: { name: string }) {
  const initial = name?.[0]?.toUpperCase() ?? "?";
  return (
    <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground text-[12px] font-semibold">
      {initial}
    </div>
  );
}

export function IndustryInsightsAdsCard({
  ad,
  savedCount = 0,
  isSavedToBoard = false,
  isFollowedBrand = false,
  isSelected = false,
  selectable = false,
  onSaveToBoard,
  onUnsaveFromBoard,
  onViewDetail,
  onAddBrandToCompetitors,
  onAddPageToCompetitors,
  onFollowBrand,
  onSaveAd,
  onCopyLink,
  onSelectToggle,
}: IndustryInsightsAdsCardProps) {
  const [playing, setPlaying] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const statusDotClass =
    ad.status === "active"
      ? "bg-emerald-500"
      : ad.status === "inactive"
        ? "bg-red-500"
        : "bg-muted-foreground";

  const statusLabel = (() => {
    const duration = ad.activeDuration || "";
    if (ad.status === "active") return `Active since: ${duration}`;
    if (ad.status === "inactive") return `In-Active since: ${duration}`;
    return `Paused since: ${duration}`;
  })();

  const similarPadded = String(ad.similarAdsCount ?? 0).padStart(2, "0");

  const isProcessing = ad.mediaProcessing === true || (!ad.thumbUrl && !ad.mediaUrl);
  const isVideo = ad.mediaType === "video";

  const handleCopyLink = (e: Event | React.SyntheticEvent) => {
    if ("stopPropagation" in e) e.stopPropagation();
    if (onCopyLink) {
      onCopyLink(ad);
    } else {
      navigator.clipboard.writeText(`https://ads.example.com/${ad.adId}`);
      toast.success("Ad link copied to clipboard");
    }
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    (isSavedToBoard ? onUnsaveFromBoard : onSaveToBoard)?.(ad);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectToggle?.(ad);
  };

  return (
    <TooltipProvider delayDuration={250}>
      <Card
        onClick={() => onViewDetail?.(ad)}
        className={cn(
          "group relative block cursor-pointer overflow-hidden",
          "bg-card border-border/40 transition-shadow",
          "shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]",
          "rounded-lg",
          isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background border-primary/60",
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleBookmark}
              className={cn(
                "absolute top-2 right-2 z-10 h-6 w-6 rounded-md flex items-center justify-center",
                "bg-background/85 backdrop-blur-sm border border-border/60 transition-colors",
                "hover:bg-background hover:border-border",
              )}
              aria-pressed={isSavedToBoard}
              aria-label={isSavedToBoard ? "Unsave from board" : "Save to board"}
            >
              <Bookmark
                className={cn(
                  "h-3.5 w-3.5",
                  isSavedToBoard ? "fill-lime-400 stroke-lime-500 text-lime-500" : "text-muted-foreground",
                )}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent>{isSavedToBoard ? "Unsave" : "Save to Board"}</TooltipContent>
        </Tooltip>

        {selectable && (
          <div
            className={cn(
              "absolute top-2 left-2 z-10 transition-opacity",
              isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
            onClick={stop}
          >
            <div
              className={cn(
                "h-6 w-6 rounded-md flex items-center justify-center",
                "bg-background/85 backdrop-blur-sm border border-border/60",
              )}
            >
              <Checkbox
                checked={isSelected}
                onClick={handleSelect}
                aria-label={isSelected ? "Deselect ad" : "Select ad"}
              />
            </div>
          </div>
        )}

        <div className="p-3 space-y-2.5">
          {/* Row 1 — Status */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pr-9">
            <span className={cn("h-2 w-2 rounded-full shrink-0", statusDotClass)} />
            <span className={cn(ad.status === "paused" ? "text-muted-foreground" : "text-foreground", "font-medium")}>
              {statusLabel}
            </span>
          </div>

          {/* Row 2 — Similar Ads stacked + Platforms right */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-muted-foreground leading-tight">Similar Ads</span>
              <span className="text-[13px] font-semibold text-foreground leading-tight mt-0.5 tabular-nums">
                {similarPadded}
              </span>
            </div>
            <div className="flex items-center gap-1 self-end pb-0.5">
              <PlatformIcons platforms={ad.platforms} />
            </div>
          </div>

          {/* Row 3 — Brand (avatar + stacked name/adType) */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md overflow-hidden bg-muted shrink-0">
              {ad.pageAvatar ? (
                <img src={ad.pageAvatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <AvatarFallbackInitials name={ad.brand} />
              )}
            </div>
            <div className="min-w-0 flex-1 flex flex-col">
              <span className="text-[13px] font-semibold leading-tight text-foreground line-clamp-1">{ad.brand}</span>
              <span className="text-[11px] text-muted-foreground leading-tight line-clamp-1">
                {ad.adType || "Flexible"}
              </span>
            </div>
          </div>

          {/* Primary text */}
          {ad.primaryText ? (
            <p className="text-xs text-foreground line-clamp-2 leading-snug">{ad.primaryText}</p>
          ) : (
            <p className="text-xs italic text-muted-foreground/70 line-clamp-2 leading-snug">*Primary text missing*</p>
          )}

          {/* Media block — portrait 3/4 */}
          <div className="aspect-[3/4] rounded-md bg-muted overflow-hidden relative">
            {isProcessing ? (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/60">
                <div className="w-1/2 flex flex-col items-center justify-center gap-1.5">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-[11px] text-muted-foreground text-center">Media processing</span>
                </div>
              </div>
            ) : isVideo && playing ? (
              <video
                src={ad.mediaUrl}
                poster={ad.thumbUrl}
                controls
                autoPlay
                className="w-full h-full object-cover"
                onClick={stop}
              />
            ) : (
              <>
                <img
                  src={isVideo ? ad.thumbUrl : ad.mediaUrl || ad.thumbUrl}
                  alt={ad.headline || ad.brand}
                  loading="lazy"
                  onLoad={() => setImageLoaded(true)}
                  className={cn(
                    "w-full h-full object-cover transition-opacity duration-300",
                    imageLoaded ? "opacity-100" : "opacity-0",
                  )}
                />
                {isVideo && (
                  <button
                    type="button"
                    className="absolute inset-0 flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlaying(true);
                    }}
                    aria-label="Play video"
                  >
                    <Play className="h-8 w-8 text-white drop-shadow-lg" />
                  </button>
                )}
              </>
            )}

            {!isProcessing && (ad.transparencyMode || ad.analysed) && (
              <div className="absolute bottom-2 left-2 flex gap-1.5">
                {ad.transparencyMode && (
                  <span className="inline-flex items-center gap-1 bg-background/85 backdrop-blur-sm border border-border/60 text-foreground px-2 py-0.5 text-[10px] rounded-md">
                    <ShieldCheck className="h-3 w-3" />
                    Transparency mode
                  </span>
                )}
                {ad.analysed && (
                  <span className="inline-flex items-center gap-1 bg-background/85 backdrop-blur-sm border border-border/60 text-foreground px-2 py-0.5 text-[10px] rounded-md">
                    <BarChart3 className="h-3 w-3" />
                    Analysed
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Domain */}
          <p className="font-mono text-[11px] text-muted-foreground line-clamp-1">{ad.domain}</p>

          {/* Headline + Description */}
          <div className="space-y-0.5">
            {ad.headline ? (
              <p className="text-sm font-medium line-clamp-1">{ad.headline}</p>
            ) : (
              <p className="text-sm font-medium italic text-muted-foreground/70 line-clamp-1">*Headline missing*</p>
            )}
            {ad.description ? (
              <p className="text-xs text-muted-foreground line-clamp-1">{ad.description}</p>
            ) : (
              <p className="text-xs italic text-muted-foreground/70 line-clamp-1">*Description missing*</p>
            )}
          </div>

          {/* Action row */}
          <div
            className="border-t border-border pt-2 flex items-center justify-between gap-0.5"
            onClick={stop}
          >
            {/* 1. Add Brand to Competitors */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddBrandToCompetitors?.(ad);
                  }}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Brand to Competitors</TooltipContent>
            </Tooltip>

            {/* 2. Save to Board (with savedCount red badge) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 relative"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSaveToBoard?.(ad);
                  }}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  {savedCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-3.5 min-w-3.5 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {savedCount}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save to Board</TooltipContent>
            </Tooltip>

            {/* 3. Copy Link */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleCopyLink}
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy link</TooltipContent>
            </Tooltip>

            {/* 4. Add Page to Competitors */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddPageToCompetitors?.(ad);
                  }}
                >
                  <FilePlus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Page to Competitors</TooltipContent>
            </Tooltip>

            {/* 5. Save Ad (queue) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSaveAd?.(ad);
                  }}
                >
                  <ListPlus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save Ad</TooltipContent>
            </Tooltip>

            {/* 6. Kebab menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={stop}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52" onClick={stop}>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onFollowBrand?.(ad);
                  }}
                >
                  <Heart
                    className={cn(
                      "h-3.5 w-3.5 mr-2",
                      isFollowedBrand ? "fill-primary stroke-primary text-primary" : "",
                    )}
                  />
                  {isFollowedBrand ? "Unfollow Brand" : "Follow Brand"}
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="opacity-50">
                  <Sparkles className="h-3.5 w-3.5 mr-2" />
                  Generate Variations · Soon
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
}
