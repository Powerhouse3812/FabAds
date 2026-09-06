import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bookmark, LayoutGrid, Eye, Play, Link, Sparkles, Radar, MonitorSmartphone, MoreVertical, UserPlus, UserCheck } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PlatformIcons } from "./PlatformIcons";

import { toast } from "sonner";
import type { InsightAd } from "@/lib/insights-dummy-data";
import { SendToGenieMenu } from "@/genie6/flows/SendToGenieMenu";

interface Props {
  ad: InsightAd;
  savedCount?: number;
  isFollowedBrand?: boolean;
  onSaveToBoard?: (ad: InsightAd) => void;
  onViewDetail?: (ad: InsightAd) => void;
  onAddBrandToCompetitors?: (ad: InsightAd) => void;
  onAddPageToCompetitors?: (ad: InsightAd) => void;
  onFollowBrand?: (ad: InsightAd) => void;
}

export function InsightAdCard({ ad, savedCount = 0, isFollowedBrand = false, onSaveToBoard, onViewDetail, onAddBrandToCompetitors, onAddPageToCompetitors, onFollowBrand }: Props) {
  const [playing, setPlaying] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const relativeTime = (() => {
    const diffMs = Date.now() - new Date(ad.createdAt).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d`;
    return `${Math.floor(days / 30)}mo`;
  })();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://ads.example.com/${ad.adId}`);
    toast.success("Ad link copied to clipboard");
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Card
        className="group cursor-pointer border border-border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-out rounded-xl"
        onClick={() => onViewDetail?.(ad)}
      >
        <CardContent className="p-3.5 space-y-2.5">
          {/* Row 1: Status dot + Duration + Relative Time + Platforms */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full shrink-0 ${
                ad.status === "active" ? "bg-green-500" : ad.status === "paused" ? "bg-gray-400" : "bg-red-500"
              }`} />
              <span className={`font-medium capitalize ${ad.status === "paused" ? "text-muted-foreground" : "text-foreground"}`}>{ad.status}</span>
              <span>·</span>
              <span>{ad.activeDuration.replace(/\s*days?/, "d").replace(/\s*months?/, "mo")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{relativeTime}</span>
              <PlatformIcons platforms={ad.platforms} />
            </div>
          </div>

          {/* Row 2: Created on + Similar Ads */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Created: <span className="font-medium text-foreground">{new Date(ad.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span></span>
            <span>Similar <span className="font-semibold text-foreground">{ad.similarAdsCount}</span></span>
          </div>

          {/* Row 3: Brand Name + Ad Type + Status */}
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={ad.pageAvatar} alt={ad.brand} />
              <AvatarFallback className="text-xs font-semibold">{ad.brand[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-foreground block">{ad.brand}</span>
              <span className="text-xs text-muted-foreground">{ad.adType}</span>
            </div>
          </div>

          {/* Row 4: Views & Spend badges */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-muted text-muted-foreground border-0 rounded-md px-2 py-0.5 text-xs font-medium h-auto">
              <Eye className="h-3 w-3 mr-1" />{ad.impressions}
            </Badge>
            <Badge variant="outline" className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-0 rounded-md px-2 py-0.5 text-xs font-medium h-auto">
              {ad.spend}
            </Badge>
          </div>

          {/* Row 5: Primary Text */}
          <p className="text-xs text-foreground line-clamp-2 leading-snug">{ad.primaryText}</p>

          {/* Row 6: Media */}
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            {ad.mediaType === "video" && playing ? (
              <video
                src={ad.mediaUrl}
                controls
                autoPlay
                className="w-full h-full object-cover"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                {!imageLoaded && <Skeleton className="absolute inset-0 rounded-lg" />}
                <img
                  src={ad.mediaType === "video" ? ad.thumbUrl : ad.mediaUrl}
                  alt={ad.headline}
                  loading="lazy"
                  onLoad={() => setImageLoaded(true)}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                />
                {ad.mediaType === "video" && (
                  <button
                    className="absolute inset-0 flex items-center justify-center"
                    onClick={(e) => { e.stopPropagation(); setPlaying(true); }}
                  >
                    <div className="h-10 w-10 rounded-full bg-background/80 flex items-center justify-center opacity-80">
                      <Play className="h-4 w-4" />
                    </div>
                  </button>
                )}
                <div className="absolute bottom-2 left-2 flex gap-1">
                  {ad.transparencyMode && (
                    <Badge variant="outline" className="bg-secondary text-secondary-foreground text-xs rounded-md px-2 py-0.5 font-medium h-auto border-0">
                      Transparency mode
                    </Badge>
                  )}
                  {ad.analysed && (
                    <Badge variant="outline" className="bg-secondary text-secondary-foreground text-xs rounded-md px-2 py-0.5 font-medium h-auto border-0">
                      ✨ Analysed
                    </Badge>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Row 7: Domain */}
          <p className="text-[11px] text-muted-foreground">{ad.domain}</p>

          {/* Row 8: Headline + Description */}
          <div className="space-y-0.5">
            <p className="text-xs font-medium leading-snug line-clamp-1">{ad.headline}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{ad.description}</p>
          </div>

          {/* Row 9: Action icons — equal spacing */}
          <div className="flex items-center justify-between pt-1 border-t border-border/40 opacity-60 group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Save to Board */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 relative" onClick={() => onSaveToBoard?.(ad)}>
                  {savedCount > 0 ? <LayoutGrid className="h-3.5 w-3.5 fill-current" /> : <LayoutGrid className="h-3.5 w-3.5" />}
                  {savedCount > 0 && <span className="absolute -top-0.5 -right-0.5 h-3.5 min-w-3.5 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center">{savedCount}</span>}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save to Board</TooltipContent>
            </Tooltip>

            {/* Add Domain to Competitors */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddBrandToCompetitors?.(ad)}>
                  <Radar className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Domain to Competitors</TooltipContent>
            </Tooltip>

            {/* Add Page to Competitors */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddPageToCompetitors?.(ad)}>
                  <MonitorSmartphone className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Page to Competitors</TooltipContent>
            </Tooltip>

            {/* Follow Brand */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onFollowBrand?.(ad)}>
                  {isFollowedBrand ? <UserCheck className="h-3.5 w-3.5 fill-current text-primary" /> : <UserPlus className="h-3.5 w-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isFollowedBrand ? "Unfollow Brand" : "Follow Brand"}</TooltipContent>
            </Tooltip>

            {/* Save Ad */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Bookmark className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save Ad</TooltipContent>
            </Tooltip>

            {/* Kebab Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Link className="h-3.5 w-3.5 mr-2" />
                  Copy Ad Link
                </DropdownMenuItem>
                {/* §7.2 — whole ad travels to Genie as a reference; the picker
                    highlights the user's own default brand, never this
                    competitor's — resolved inside SendToGenieMenu from the
                    ad's own id, not the brand name. */}
                <SendToGenieMenu
                  module="industry-insights"
                  refId={ad.id}
                  align="end"
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Sparkles className="h-3.5 w-3.5 mr-2" />
                      Send to Genie
                    </DropdownMenuItem>
                  }
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
