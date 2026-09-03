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
import { useMobileSelection } from "@/components/shell/MobileSelectionContext";

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

  // Spec B 1.1 item 6 (RESTORE): the mobile bulk-select checkbox reads/writes
  // MobileSelectionContext directly rather than the selectable/isSelected/
  // onSelectToggle props above (those remain the desktop-only bulk-select
  // path, untouched — INV-4). The bar that shows the selection (MobileTabBar)
  // is a shell-level sibling of the routed feed, not an ancestor/descendant
  // of this card, so the context is the only thing both sides can reach —
  // see MobileSelectionContext.tsx's header comment. Outside the provider
  // this hook returns the inert default (count 0, toggle is a no-op), so the
  // card degrades safely rather than throwing.
  const { selectedIds: mobileSelectedIds, toggleSelected: toggleMobileSelected } =
    useMobileSelection();
  const isSelectedOnMobile = mobileSelectedIds.includes(ad.id);

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

  const handleMobileSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMobileSelected(ad.id);
  };

  return (
    <TooltipProvider delayDuration={250}>
      <Card
        onClick={() => onViewDetail?.(ad)}
        role="listitem"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onViewDetail?.(ad);
          }
        }}
        className={cn(
          "group relative block cursor-pointer overflow-hidden",
          "bg-card border-border transition-shadow",
          "shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)]",
          "rounded-lg",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background border-primary/60",
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleBookmark}
              className={cn(
                // 44x44 mobile touch floor (INV-10 / WCAG 2.5.5); reverts to the
                // desktop density target (32x32) at md+ — desktop unchanged (INV-4).
                "absolute top-2 right-2 z-10 h-11 w-11 md:h-8 md:w-8 rounded-md flex items-center justify-center",
                "bg-background/85 backdrop-blur-sm transition-colors",
                "hover:bg-background",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
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
              // F11 / spec 2.4: bulk-select is a desktop-only affordance —
              // removed on mobile regardless of what the parent grid passes.
              "hidden md:block absolute top-2 left-2 z-10 transition-opacity",
              isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
            onClick={stop}
          >
            <div
              className={cn(
                // h-8 w-8 (32x32) — desktop density target; mobile detail view exposes larger hit targets per WCAG 2.5.5
                "h-8 w-8 rounded-md flex items-center justify-center",
                "bg-background/85 backdrop-blur-sm border border-border/60",
                "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 focus-within:ring-offset-background",
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

        {/* Spec B 1.1 item 6 (RESTORE): mobile bulk-select checkbox. Batch A
            removed this outright on mobile; it's back, but as its own
            md:hidden element wired to MobileSelectionContext — independent
            of the selectable/isSelected/onSelectToggle desktop block above,
            which stays exactly as it was (INV-4). Always visible (not the
            hover-reveal opacity treatment above) because there is no hover
            state on touch. */}
        <div className="md:hidden absolute top-2 left-2 z-10" onClick={stop}>
          <div
            className={cn(
              // Decorative box stays the same 32x32 visual weight as the
              // desktop chip above — the real touch target is grown via the
              // Checkbox's own after:-inset hit area below, not by inflating
              // this box (spec 1.3: "grow the touch area without growing the
              // visual weight").
              "h-8 w-8 rounded-md flex items-center justify-center",
              "bg-background/85 backdrop-blur-sm border border-border/60",
              "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 focus-within:ring-offset-background",
            )}
          >
            <Checkbox
              checked={isSelectedOnMobile}
              onClick={handleMobileSelect}
              aria-label={isSelectedOnMobile ? "Deselect ad" : "Select ad"}
              className={cn(
                // 44x44 real hit area (INV-10 / WCAG 2.5.5) on a visually
                // unchanged 16x16 box — same after:-inset technique already
                // shipped in ui/sidebar.tsx's SidebarGroupAction and in
                // DesktopOnlyPrompt's iconButton shape: relative + an
                // absolutely-positioned, content-less ::after inset by 14px
                // (0.875rem) on every side (16 + 14 + 14 = 44).
                "relative after:absolute after:-inset-3.5",
              )}
            />
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Brand row — SINGLE horizontal line, everything fits.
              Avatar + brand + Follow (icon-only) on the left;
              status meta + similar count pushed right via ml-auto;
              bookmark sits absolute top-right (pr-9 reserves room); the
              restored mobile bulk-select checkbox sits absolute top-left, so
              pl-9 reserves the matching room on mobile only (md:pl-0 — same
              trick as pr-9, just mirrored) so the checkbox doesn't sit on
              top of the avatar. */}
          {display.brandDetails && (
            <div className="flex items-center gap-2 pr-9 pl-9 md:pl-0 min-w-0">
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
                      // 44x44 mobile touch floor (INV-10); md+ reverts to the
                      // 32x32 density target shared by other card-level hit targets.
                      className="shrink-0 inline-flex h-11 w-11 md:h-8 md:w-8 items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Follow brand</TooltipContent>
                </Tooltip>
              )}
              {display.statusMeta && (
                <span
                  className={cn(
                    "ml-auto flex items-center gap-1.5 shrink-0 text-[11px] text-muted-foreground",
                    // F6: status becomes a pill on mobile (border + fill around the
                    // existing dot+duration); md+ reverts to today's bare dot+text (INV-4).
                    "rounded-full border border-border bg-muted/60 px-2 py-0.5",
                    "md:rounded-none md:border-0 md:bg-transparent md:px-0 md:py-0",
                  )}
                  aria-label={`${ad.status} ad, running ${statusDuration}`}
                >
                  <span
                    aria-hidden="true"
                    className={cn("h-1.5 w-1.5 rounded-full", statusDotClass)}
                  />
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
                  className={cn(
                    "absolute bottom-0 right-0 bg-card pl-2 text-[11px] font-medium transition-colors",
                    // F7: plain inline text link on mobile, immediately after the
                    // truncated copy — no chip chrome.
                    "text-primary hover:text-primary/80",
                    // md+ reverts to today's bordered chip look, unchanged (INV-4).
                    "md:rounded-full md:border md:border-border/60 md:px-2 md:py-px md:text-muted-foreground md:hover:text-foreground md:hover:border-border",
                  )}
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
              // F8 — the single biggest mobile fix in this batch: uncapped media
              // (per-ad ratio, e.g. 9/16) rendered ~655px tall at 375px, so one
              // card ate the whole viewport. Capped at 4:5 below md. The per-ad
              // ratio is carried as a CSS var so md+ can restore it exactly
              // (INV-4) — an inline `style` aspectRatio would out-specificity any
              // Tailwind class, so the var is the only way to make it responsive.
              className="-mx-4 bg-muted overflow-hidden relative aspect-[4/5] md:aspect-[var(--media-ar)]"
              style={{ "--media-ar": ad.mediaAspectRatio || "3/4" } as React.CSSProperties}
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
                // F9: on mobile the Transparency chip always shows when the ad has
                // the data, bypassing the display.transparency opt-in — the span
                // below carries the actual desktop gating via md:hidden so the
                // outer wrapper just needs to know a chip *might* render.
                (ad.transparencyMode ||
                  (display.similarAds && (ad.similarAdsCount ?? 0) >= 5)) && (
                <div className="absolute bottom-2 left-2 flex flex-wrap gap-1.5 max-w-[calc(100%-1rem)]">
                  {/* Similar Ads chip — only on ads with 5+ similar (≈ "this ad
                      has notable spread"). Promoted from brand row to media
                      chip per Maalik's spec. */}
                  {display.similarAds && (ad.similarAdsCount ?? 0) >= 5 && (
                    <span className="inline-flex items-center gap-1 bg-background/85 backdrop-blur-sm border border-border/60 text-foreground px-2 py-0.5 text-[10px] rounded-full">
                      <Layers className="h-3 w-3" />
                      <span className="tabular-nums">{ad.similarAdsCount}</span> similar Ads
                    </span>
                  )}
                  {ad.transparencyMode && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 bg-background/85 backdrop-blur-sm border border-border/60 text-foreground px-2 py-0.5 text-[10px] rounded-full",
                        // F9: always on for mobile. At md+, only when the
                        // display.transparency opt-in is on — same as before (INV-4).
                        !display.transparency && "md:hidden",
                      )}
                    >
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

          {/* Domain — desktop only (opt-in via display.domain, unchanged, INV-4).
              Wrapped in a plain div (not classed directly on the <p>) so the
              hidden/md:block toggle never competes with line-clamp-1's own
              `display: -webkit-box`, which a direct md:block would fight. */}
          {display.domain && (
            <div className="hidden md:block">
              <p className="font-mono text-[11px] text-muted-foreground line-clamp-1">{ad.domain}</p>
            </div>
          )}

          {/* Headline + Description + Meta-style CTA row — desktop only
              (opt-in via display.headlineDesc/cta, unchanged, INV-4). Superseded
              on mobile by the always-on link-preview block below (F10). */}
          {(display.headlineDesc || display.cta) && (
            <div className="hidden items-center gap-2 md:flex">
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

          {/* F10 — mobile link-preview block. Figma's fixed mobile layout shows
              this unconditionally (domain + CTA share a row, then headline, then
              a one-line description) regardless of the display.* opt-ins above,
              which only gate the desktop layout. md:hidden keeps this off desktop
              entirely so the two layouts never render at once. */}
          <div className="md:hidden space-y-1">
            <div className="flex items-center gap-2">
              {ad.domain ? (
                <p className="flex-1 min-w-0 font-mono text-[11px] text-muted-foreground line-clamp-1">{ad.domain}</p>
              ) : (
                <p className="flex-1 min-w-0 font-mono text-[11px] italic text-muted-foreground/70 line-clamp-1">*Domain missing*</p>
              )}
              {ad.cta && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetail?.(ad);
                  }}
                  className="shrink-0 inline-flex h-11 items-center justify-center rounded-md bg-muted hover:bg-muted/80 text-foreground px-3 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                  // Spec B 1.4: this button opens the ad's DETAIL DRAWER
                  // (onViewDetail above), not an external collection page —
                  // that's InsightAdDetailDrawer's own "View collection"
                  // button, which stays as-is. Relabelled so the two don't
                  // claim to do the same thing.
                  aria-label={`View details: ${ad.cta}`}
                >
                  {ad.cta}
                </button>
              )}
            </div>
            {ad.headline ? (
              <p className="text-sm font-semibold line-clamp-1">{ad.headline}</p>
            ) : (
              <p className="text-sm font-semibold italic text-muted-foreground/70 line-clamp-1">*Headline missing*</p>
            )}
            {ad.description ? (
              <p className="text-xs text-muted-foreground line-clamp-1">{ad.description}</p>
            ) : (
              <p className="text-xs italic text-muted-foreground/70 line-clamp-1">*Description missing*</p>
            )}
          </div>

          {/* Action row — all 4 buttons horizontally evenly spaced (no
              left/right grouping). justify-around gives equal margin between
              and around each icon. When the headline/description (+ CTA)
              block is hidden via Settings, suppress the inherited
              space-y-3 margin so the action row sits tight to the media. */}
          <div
            className={cn(
              "border-t border-border pt-2 flex items-center justify-around",
              !display.headlineDesc && !display.cta && "!mt-1",
            )}
            onClick={stop}
          >
            {/* 1. Save to Board (with savedCount red badge) — one of the four
                actions that survive on mobile (spec 2.4).
                h-11/w-11 mobile touch floor (INV-10), reverting to the 32x32
                desktop density target at md+ (INV-4).
                aria-label set explicitly on each Button: Tooltip text isn't announced by screen readers on click. */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Save to Board"
                    className="h-11 w-11 md:h-8 md:w-8 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSaveToBoard?.(ad);
                    }}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    {savedCount > 0 && (
                      <span
                        className={cn(
                          "absolute -top-0.5 -right-0.5 h-3.5 min-w-3.5 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold items-center justify-center",
                          // F11: drop the badge on mobile; desktop keeps it (INV-4).
                          "hidden md:flex",
                        )}
                      >
                        {savedCount}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save to Board</TooltipContent>
              </Tooltip>

              {/* 2. Save Ad (queue) — one of the four actions that survive on
                  mobile (spec 2.4). Same touch-floor treatment as above. */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Save Ad"
                    className="h-11 w-11 md:h-8 md:w-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
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

              {/* 3. Copy Link — spec B 1.1 item 5 (RESTORE). Batch A
                  `md:hidden`-ed this; Maalik put it back on the mobile
                  keep-list. Same h-11/w-11 mobile touch floor (INV-10) as
                  the other three surviving actions, reverting to the 32x32
                  desktop density target at md+ (INV-4). handleCopyLink
                  already stops propagation (so it doesn't also open the
                  detail drawer) and copies an absolute URL via the app's
                  existing toast mechanism — unchanged, just un-hidden. */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Copy link"
                    className="h-11 w-11 md:h-8 md:w-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                    onClick={handleCopyLink}
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy link</TooltipContent>
              </Tooltip>

            {/* 4. Kebab menu — hosts "Add to competitor" (spec 2.4's 4th surviving
                action) plus the Unfollow toggle. Never ends up empty on mobile
                (INV per spec 2.4), so the trigger itself always stays. */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="More actions"
                  className="h-11 w-11 md:h-8 md:w-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                  onClick={stop}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52" onClick={stop}>
                {/* Add to competitor (brand/page) — survives on mobile (spec 2.4).
                    py-3 mobile touch floor, reverting to the desktop density
                    default (py-1.5) at md+ (INV-4). */}
                <DropdownMenuItem
                  className="py-3 md:py-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddBrandToCompetitors?.(ad);
                  }}
                >
                  <UserPlus className="h-3.5 w-3.5 mr-2" />
                  Add Brand to Competitors
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="py-3 md:py-1.5"
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
                    {/* Unfollow — the reverse of "Follow brand" (a surviving
                        action per spec 2.4); kept so a mobile user who follows
                        a brand from this card isn't stuck following forever. */}
                    <DropdownMenuItem
                      className="py-3 md:py-1.5"
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
                {/* Generate Variations is a hand-off into the new-generation
                    flow, which is blocked on mobile (spec 2.2/2.4) — hidden
                    below md along with the separator that introduces it, so
                    mobile never sees a dangling divider. Desktop unchanged. */}
                <DropdownMenuSeparator className="hidden md:block" />
                <DropdownMenuItem disabled className="hidden opacity-50 md:flex">
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
