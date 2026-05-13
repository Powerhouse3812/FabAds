import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bookmark,
  LayoutGrid,
  Play,
  Clock,
  Link as LinkIcon,
  Sparkles,
  MoreHorizontal,
  UserPlus,
  Users,
  HeartOff,
  ShieldCheck,
  ListPlus,
  Plus,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { InsightAd } from "@/lib/insights-dummy-data";
import {
  DEFAULT_INSIGHTS_V2_DISPLAY_PREFS,
  type InsightsV2DisplayPrefs,
} from "@/components/insights-v2/InsightsV2Toolbar";

interface IndustryInsightsAdsCardProps {
  ad: InsightAd;
  savedCount?: number;
  isSavedToBoard?: boolean;
  isFollowedBrand?: boolean;
  isSelected?: boolean;
  selectable?: boolean;
  display?: InsightsV2DisplayPrefs;
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
  display = DEFAULT_INSIGHTS_V2_DISPLAY_PREFS,
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

  const statusDuration = ad.activeDuration || "";

  const hasAnyMedia = !!ad.mediaUrl || !!ad.thumbUrl;
  const isProcessing = ad.mediaProcessing === true;
  const showMediaBlock = hasAnyMedia || isProcessing;
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
                "bg-background/85 backdrop-blur-sm transition-colors",
                "hover:bg-background",
              )}
              aria-pressed={isSavedToBoard}
              aria-label={isSavedToBoard ? "Unsave from board" : "Save to board"}
            >
              <Bookmark
                className={cn(
                  "h-3.5 w-3.5",
                  isSavedToBoard
                    ? "fill-foreground stroke-foreground text-foreground"
                    : "text-muted-foreground",
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
          {/* Brand row — SINGLE horizontal line, everything fits.
              Avatar + brand + Follow (icon-only) on the left;
              status meta + similar count pushed right via ml-auto;
              bookmark sits absolute top-right (pr-9 reserves room). */}
          {display.brandDetails && (
            <div className="flex items-center gap-2 pr-9 min-w-0">
              <div className="h-8 w-8 rounded-md overflow-hidden bg-muted shrink-0">
                {ad.pageAvatar ? (
                  <img src={ad.pageAvatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <AvatarFallbackInitials name={ad.brand} />
                )}
              </div>
              <span className="text-[13px] font-semibold leading-tight text-foreground truncate min-w-0">
                {ad.brand}
              </span>
              {isFollowedBrand ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="shrink-0 inline-flex">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary/70" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Following</TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFollowBrand?.(ad);
                      }}
                      aria-label="Follow brand"
                      className="shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-muted"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Follow brand</TooltipContent>
                </Tooltip>
              )}
              {display.statusMeta && (
                <span className="ml-auto flex items-center gap-1.5 shrink-0 text-[11px] text-muted-foreground">
                  <span className={cn("h-1.5 w-1.5 rounded-full", statusDotClass)} />
                  <span className={cn(ad.status === "paused" ? "" : "text-foreground/80")}>
                    {statusDuration}
                  </span>
                </span>
              )}
            </div>
          )}

          {/* Primary text — max 2 rows in default card view, with a floating
              "Read More" CTA at the bottom-right of the truncated text that
              redirects to the full detail drawer. The bg-card hides text
              behind the chip so it looks like a clean inline truncation. */}
          {display.adCopy && (
            ad.primaryText ? (
              <div className="relative">
                <p className="text-xs text-foreground line-clamp-2 leading-snug">
                  {ad.primaryText}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetail?.(ad);
                  }}
                  className="absolute bottom-0 right-0 bg-card pl-2 text-[11px] font-medium text-muted-foreground hover:text-foreground rounded-full px-2 py-px border border-border/40 hover:border-border transition-colors"
                  aria-label="Read more in detail view"
                >
                  Read More
                </button>
              </div>
            ) : (
              <p className="text-xs italic text-muted-foreground/70 line-clamp-2 leading-snug">*Primary text missing*</p>
            )
          )}

          {/* Media block — portrait 3/4, edge-to-edge (negative margin to bleed past p-3),
              no border-radius. Skipped entirely when no media URL and not processing —
              gives true Pinterest masonry: cards without media are SHORT. */}
          {showMediaBlock && (
            <div
              className="-mx-3 bg-muted overflow-hidden relative"
              style={{ aspectRatio: ad.mediaAspectRatio || "3/4" }}
            >
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
                      <span className="h-12 w-12 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center shadow-lg">
                        <Play
                          className="h-5 w-5 text-white"
                          fill="currentColor"
                          stroke="currentColor"
                          strokeWidth={1}
                        />
                      </span>
                    </button>
                  )}
                </>
              )}

              {!isProcessing &&
                ((display.transparency && ad.transparencyMode) ||
                  (display.similarAds && (ad.similarAdsCount ?? 0) >= 5)) && (
                <div className="absolute bottom-2 left-2 flex flex-wrap gap-1.5 max-w-[calc(100%-1rem)]">
                  {/* Similar Ads chip — only on ads with 5+ similar (≈ "this ad
                      has notable spread"). Promoted from brand row to media
                      chip per Maalik's spec. */}
                  {display.similarAds && (ad.similarAdsCount ?? 0) >= 5 && (
                    <span className="inline-flex items-center gap-1 bg-background/85 backdrop-blur-sm border border-border/60 text-foreground px-2 py-0.5 text-[10px] rounded-md">
                      <Layers className="h-3 w-3" />
                      <span className="tabular-nums">{ad.similarAdsCount}</span> similar Ads
                    </span>
                  )}
                  {display.transparency && ad.transparencyMode && (
                    <span className="inline-flex items-center gap-1 bg-background/85 backdrop-blur-sm border border-border/60 text-foreground px-2 py-0.5 text-[10px] rounded-md">
                      <ShieldCheck className="h-3 w-3" />
                      Transparency mode
                    </span>
                  )}
                  {/* TODO (Maalik): restore Analysed indicator — removed in
                      A-12.86. Was a lime-filled circle with checkmark + tooltip
                      that linked to AI analysis. Add back when the analysis
                      detail view is ready. */}
                </div>
              )}
            </div>
          )}

          {/* Domain */}
          {display.domain && (
            <p className="font-mono text-[11px] text-muted-foreground line-clamp-1">{ad.domain}</p>
          )}

          {/* Headline + Description + Meta-style CTA row */}
          {(display.headlineDesc || display.cta) && (
            <div className="flex items-center gap-2">
              {display.headlineDesc && (
                <div className="flex-1 min-w-0 space-y-0.5">
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
              )}
              {display.cta && ad.cta && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetail?.(ad);
                  }}
                  className="shrink-0 inline-flex items-center rounded-md bg-muted hover:bg-muted/80 text-foreground px-2.5 py-1 text-[11px] font-semibold transition-colors"
                  aria-label={`CTA: ${ad.cta}`}
                >
                  {ad.cta}
                </button>
              )}
            </div>
          )}

          {/* Action row — all 4 buttons horizontally evenly spaced (no
              left/right grouping). justify-around gives equal margin between
              and around each icon. */}
          <div
            className="border-t border-border pt-2 flex items-center justify-around"
            onClick={stop}
          >
            {/* 1. Save to Board (with savedCount red badge) */}
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

              {/* 2. Save Ad (queue) */}
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

            {/* 4. Kebab menu */}
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
                    onAddBrandToCompetitors?.(ad);
                  }}
                >
                  <UserPlus className="h-3.5 w-3.5 mr-2" />
                  Add Brand to Competitors
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddPageToCompetitors?.(ad);
                  }}
                >
                  <Users className="h-3.5 w-3.5 mr-2" />
                  Add Page to Competitors
                </DropdownMenuItem>
                {isFollowedBrand && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onFollowBrand?.(ad);
                      }}
                    >
                      <HeartOff className="h-3.5 w-3.5 mr-2" />
                      Unfollow Brand
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
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
