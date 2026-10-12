/**
 * My Feeds ad card (old Industry Insights layout, V2 data). My Feeds ONLY: Discover, Saved, Boards, the drawer
 * and every overlay keep AdCard.
 *
 *   avatar · page (+follow) · days tag · save → two lines of copy → media (New/Winner, AI score, clones, kind)
 *   → domain + "View collection" → headline → Industry · Category → Download · Genie · Copy link · More
 *
 * Hook / angle / framework / concept chips and the CTA label are deliberately NOT here: they live in the ad
 * drawer, and every one of them is still filterable from the Quick filters rows.
 * Click on the body opens the drawer; every inner control stops propagation.
 */
import { memo, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Heart, Layers, Link2, MessageCircle, MoreHorizontal, Play, Share2, UserCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { getAdvertiser, getCategory, getIndustry } from "@/lib/insights-v3/data";
import { hasEngagement, isEngagementStandout, isNew, isWinner } from "@/lib/insights-v3/selectors";
import { buildDownloads } from "@/lib/insights-v3/selectors";
import { toggleFollowPage, useBoardCountForItem, useIsAdSaved, useIsPageFollowed, useLastVisitAt } from "@/lib/insights-v3/stores";
import { ACTIVE_WINDOW_DAYS, type Ad, type SavedItemRef } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";
import { AdCardMedia } from "@/components/insights-v3/ad-card/AdCardMedia";
import { copyAdLink } from "@/components/insights-v3/ad-card/copyAdLink";
import { UseInGenie } from "@/components/insights-v3/genie/UseInGenie";
import {
  AiScoreBadge,
  DownloadButton,
  Hint,
  NewBadge,
  SaveButton,
  WinnerBadge,
  useAdDrawer,
  useDetailStack,
} from "@/components/insights-v3/shared";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface FeedCardProps {
  ad: Ad;
  /** Ads in the current scope. Used only to decide the Winner badge's engagement mark. */
  scopedAds?: Ad[];
  className?: string;
}

const KIND_LABEL: Record<Ad["mediaKind"], string> = { image: "Image", video: "Video", carousel: "Carousel" };
const COPY_CUT = 64;

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "?") + (words.length > 1 ? words[1][0] : "")).toUpperCase();
}

function Avatar({ ad }: { ad: Ad }) {
  const [broken, setBroken] = useState(false);
  return ad.pageAvatarUrl && !broken ? (
    <img
      src={ad.pageAvatarUrl}
      alt=""
      loading="lazy"
      width={30}
      height={30}
      onError={() => setBroken(true)}
      className="h-[30px] w-[30px] shrink-0 rounded-full border border-border bg-muted object-cover"
    />
  ) : (
    <span
      aria-hidden="true"
      className="inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary-text"
    >
      {initials(ad.pageName)}
    </span>
  );
}

/** Follow / unfollow the page: same store and same feedback as the standard card's "Follow page". */
function FollowIcon({ ad }: { ad: Ad }) {
  const followed = useIsPageFollowed(ad.pageAdvertiserId);
  const Icon = followed ? UserCheck : UserPlus;
  return (
    <Hint content={followed ? "Following · click to unfollow" : "Follow page"}>
      <button
        type="button"
        aria-pressed={followed}
        aria-label={`${followed ? "Unfollow" : "Follow"} ${ad.pageName}`}
        onClick={(e) => {
          e.stopPropagation();
          const now = toggleFollowPage(ad.pageAdvertiserId);
          toast.success(now ? `Following ${ad.pageName} — their ads now land in My Feeds.` : `Unfollowed ${ad.pageName}.`);
        }}
        onKeyDown={(e) => e.stopPropagation()}
        className={cn(
          "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors max-sm:h-8 max-sm:w-8",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          followed ? "text-primary-text hover:bg-primary/15" : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </Hint>
  );
}

function DaysTag({ ad }: { ad: Ad }) {
  const live = ad.status === "active";
  const known = typeof ad.daysLive === "number";
  const text = known ? `${ad.daysLive} ${ad.daysLive === 1 ? "day" : "days"}` : "Start unknown";
  const tip = `${known ? "From the first date the ad ran to the last time we saw it. " : "We don't have a start date for this ad. "}${
    live ? `Seen live in the last ${ACTIVE_WINDOW_DAYS} days.` : `Not seen live in the last ${ACTIVE_WINDOW_DAYS} days.`
  }`;
  return (
    <Hint content={tip}>
      <span
        tabIndex={0}
        aria-label={`${known ? text + " live" : "Start date unknown"}, ${live ? "seen live" : "not seen recently"}`}
        className="inline-flex h-[18px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-muted px-2 text-[11px] font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span aria-hidden="true" className={cn("h-[7px] w-[7px] rounded-full", live ? "bg-success-text" : "bg-muted-foreground/50")} />
        <span className={known ? "tabular-nums" : "italic"}>{text}</span>
      </span>
    </Hint>
  );
}

function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-[21px] max-w-full items-center gap-1 rounded-full bg-muted px-2 text-[11px] font-medium text-muted-foreground",
        className,
      )}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}

/** "This ad reports engagement" — which metrics, never the numbers (those live in the ad drawer). */
function EngagementIndicator({ engagement }: { engagement: Ad["engagement"] }) {
  const parts = [
    { key: "likes", label: "likes", Icon: Heart, on: engagement.likes != null },
    { key: "comments", label: "comments", Icon: MessageCircle, on: engagement.comments != null },
    { key: "shares", label: "shares", Icon: Share2, on: engagement.shares != null },
  ].filter((p) => p.on);
  const names = parts.map((p) => p.label).join(", ");
  const tip = `Reports ${names}. Open the ad for the numbers.`;
  return (
    <Hint content={tip}>
      <span
        tabIndex={0}
        aria-label={`Engagement data: ${tip}`}
        className="inline-flex h-[21px] items-center gap-1 rounded-full bg-primary/10 px-2 text-[11px] font-medium text-primary-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {parts.map(({ key, Icon }) => (
          <Icon key={key} className="h-3 w-3" aria-hidden="true" />
        ))}
        Engagement
      </span>
    </Hint>
  );
}

function FooterButton({ label, onClick, children }: { label: string; onClick: (e: MouseEvent) => void; children: React.ReactNode }) {
  return (
    <Hint content={label}>
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        onKeyDown={(e) => e.stopPropagation()}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {children}
      </button>
    </Hint>
  );
}

function FeedCardImpl({ ad, scopedAds, className }: FeedCardProps) {
  const drawer = useAdDrawer();
  const detail = useDetailStack();
  const lastVisitAt = useLastVisitAt();
  const ref: SavedItemRef = { type: "ad", id: ad.id };
  const savedCount = useBoardCountForItem(ref);
  const inSavedAds = useIsAdSaved(ad.id);
  const followed = useIsPageFollowed(ad.pageAdvertiserId);
  // A thumbnail that fails to load (offline, blocked CDN) renders AdCardMedia's headline tile: the overlays must not
  // land on top of it, so the card falls back to the no-creative layout too.
  const [imgBroken, setImgBroken] = useState(false);

  const open = () => drawer.open(ad.id);
  const onClick = (e: MouseEvent) => {
    // Selecting text inside the card must not open it.
    if (window.getSelection?.()?.toString()) return;
    e.preventDefault();
    open();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return; // inner buttons handle their own keys
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  };

  const winner = isWinner(ad);
  const standout = winner && (scopedAds ? isEngagementStandout(ad, scopedAds) : false);
  const fresh = isNew(ad, lastVisitAt);
  const industry = getIndustry(ad.industryId)?.label ?? ad.industryId;
  const category = getCategory(ad.categoryId)?.label ?? ad.categoryId;
  const domain = ad.domainAdvertiserId ? getAdvertiser(ad.domainAdvertiserId)?.name ?? null : null;
  const hasCreative = !!ad.thumbnailUrl && !imgBroken;
  const similar = `${ad.clones} Similar ${ad.clones === 1 ? "ad" : "ads"}`;
  const copy = ad.primaryText.trim();
  const cut = copy.length > COPY_CUT ? copy.slice(0, COPY_CUT).replace(/\s+\S*$/, "") : copy;

  return (
    <article
      tabIndex={0}
      aria-label={`Ad from ${ad.pageName}: ${ad.headline}`}
      data-ad-id={ad.id}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={cn(
        "flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-colors",
        "hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {/* header */}
      <div className="flex items-center gap-2 px-3 pt-3">
        <Avatar ad={ad} />
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <button
            type="button"
            aria-label={`Open page ${ad.pageName}`}
            title={ad.pageName}
            onClick={(e) => {
              e.stopPropagation();
              detail.push({ kind: "advertiser", advertiserKind: "page", id: ad.pageAdvertiserId });
            }}
            onKeyDown={(e) => e.stopPropagation()}
            className="min-w-0 truncate rounded-sm text-left text-xs font-semibold text-foreground hover:text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {ad.pageName}
          </button>
          <FollowIcon ad={ad} />
        </div>
        <DaysTag ad={ad} />
        <SaveButton
          target={ref}
          savedCount={savedCount}
          saved={inSavedAds || savedCount > 0}
          variant="icon"
          className="h-7 min-w-7 shrink-0 border-transparent bg-transparent px-1 max-sm:h-8 max-sm:min-w-8"
        />
      </div>

      {/* ad copy: the first two lines; the rest is in the drawer */}
      {copy && (
        <p className="px-3 py-2 text-sm leading-[22px] text-foreground">
          {cut}
          {cut.length < copy.length && (
            <>
              … <span className="text-xs text-muted-foreground">Read more</span>
            </>
          )}
        </p>
      )}

      {/* media */}
      <div className="relative">
        <AdCardMedia ad={ad} hideKindChip onBroken={() => setImgBroken(true)} />
        {hasCreative && (
          <>
            <div className="pointer-events-none absolute left-3 top-2.5 flex gap-1.5">
              {fresh && <NewBadge className="pointer-events-auto" />}
              {winner && <WinnerBadge engagementStandout={standout} className="pointer-events-auto bg-card text-warning-text" />}
            </div>
            <AiScoreBadge score={ad.aiScore} solid className="absolute right-3 top-2.5 shadow-sm" />
            {ad.mediaKind === "video" && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <Play className="ml-0.5 h-4 w-4 fill-current" />
              </span>
            )}
            <div className="pointer-events-none absolute inset-x-3 bottom-2.5 flex flex-wrap gap-1.5">
              {ad.clones > 0 && (
                <span className="inline-flex h-[21px] items-center gap-1 rounded-full bg-white/90 px-2 text-[11px] font-medium text-black/70">
                  <Layers className="h-3 w-3" aria-hidden="true" />
                  {similar}
                </span>
              )}
              {ad.mediaKind !== "image" && (
                <span className="inline-flex h-[21px] items-center gap-1 rounded-full bg-white/90 px-2 text-[11px] font-medium text-black/70">
                  {ad.mediaKind === "video" ? <Play className="h-3 w-3 fill-current" aria-hidden="true" /> : <Layers className="h-3 w-3" aria-hidden="true" />}
                  {KIND_LABEL[ad.mediaKind]}
                </span>
              )}
            </div>
          </>
        )}
      </div>
      {/* no creative: the headline IS the tile, so the signals sit in a row under it instead of over it */}
      {!hasCreative && (
        <div className="flex flex-wrap items-center gap-1.5 px-3 pt-2">
          {fresh && <NewBadge />}
          {winner && <WinnerBadge engagementStandout={standout} />}
          {ad.clones > 0 && (
            <Tag>
              <span className="inline-flex items-center gap-1">
                <Layers className="h-3 w-3" aria-hidden="true" />
                {similar}
              </span>
            </Tag>
          )}
          <AiScoreBadge score={ad.aiScore} solid />
        </div>
      )}

      {/* domain + headline */}
      {domain && (
        <div className="flex items-center justify-between gap-2 px-3 pt-2">
          <code title={domain} className="min-w-0 truncate font-mono text-[11px] font-medium text-muted-foreground">
            {domain}
          </code>
          <button
            type="button"
            aria-label={`View collection: ads from ${domain}`}
            onClick={(e) => {
              e.stopPropagation();
              detail.push({ kind: "advertiser", advertiserKind: "domain", id: ad.domainAdvertiserId! });
            }}
            onKeyDown={(e) => e.stopPropagation()}
            className="inline-flex h-[18px] shrink-0 items-center rounded-full bg-muted px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-primary/15 hover:text-primary-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-sm:h-8"
          >
            View collection
          </button>
        </div>
      )}
      {hasCreative && <p className="line-clamp-2 px-3 pt-1 text-xs leading-5 text-foreground">{ad.headline}</p>}

      {/* industry · category */}
      <div className="flex flex-wrap gap-1.5 px-3 pb-2.5 pt-2">
        <Tag className="bg-primary/10 text-primary-text">{industry}</Tag>
        <Tag>{category}</Tag>
        {hasEngagement(ad) && <EngagementIndicator engagement={ad.engagement} />}
      </div>

      {/* footer */}
      <div className="mx-3 mt-auto flex items-center justify-between border-t border-border py-1">
        <DownloadButton
          build={() => buildDownloads(ref)}
          ariaLabel={`Download ad from ${ad.pageName}`}
          label="Download ad"
          variant="icon"
          className="border-transparent bg-transparent"
        />
        <UseInGenie target={ref} variant="icon" className="border-transparent bg-transparent hover:bg-primary/10" />
        <FooterButton label="Copy link" onClick={(e) => { e.stopPropagation(); void copyAdLink(ad.id); }}>
          <Link2 className="h-4 w-4" aria-hidden="true" />
        </FooterButton>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`More actions for the ad from ${ad.pageName}`}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          {/* Portal events bubble through the React tree: stop them so a menu click never opens the drawer. */}
          <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <DropdownMenuItem onSelect={open}>Open ad details</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => detail.push({ kind: "advertiser", advertiserKind: "page", id: ad.pageAdvertiserId })}>
              Open page
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                const now = toggleFollowPage(ad.pageAdvertiserId);
                toast.success(now ? `Following ${ad.pageName} — their ads now land in My Feeds.` : `Unfollowed ${ad.pageName}.`);
              }}
            >
              {followed ? "Unfollow page" : "Follow page"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  );
}

export const FeedCard = memo(FeedCardImpl);
