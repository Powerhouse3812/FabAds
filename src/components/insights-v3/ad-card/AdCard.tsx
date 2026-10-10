/**
 * Industry Insights V2 · ad card (spec: "Ad grid — card").
 * Contract: AdCard({ ad, onOpen? }) — B/C/D reuse it inside overlays, boards and the drawer.
 * Optional props: `variant` ("grid" default | "compact"), `scopedAds` (engagement-standout pool).
 *
 * Order: media → page row (+ Follow page) → industry + category → New / Winner /
 * days / status / clones → AI score + analysis chips → headline + CTA → actions.
 * Click on the body opens the drawer; chips and buttons stop propagation.
 */
import { memo, useState, type KeyboardEvent, type MouseEvent } from "react";
import { getCategory, getElement, getIndustry } from "@/lib/insights-v3/data";
import { isEngagementStandout, isNew, isWinner } from "@/lib/insights-v3/selectors";
import { toggleFollowPage, useIsPageFollowed, useLastVisitAt } from "@/lib/insights-v3/stores";
import type { Ad, ElementType } from "@/lib/insights-v3/types";
import {
  AiScoreBadge,
  ClonesPill,
  DaysLive,
  ElementChip,
  NewBadge,
  StatusPill,
  TruncatedText,
  WinnerBadge,
  useAdDrawer,
  useDetailStack,
} from "@/components/insights-v3/shared";
import { cn } from "@/lib/utils";
import { AdCardActions } from "./AdCardActions";
import { AdCardMedia } from "./AdCardMedia";

export interface AdCardProps {
  ad: Ad;
  /** Override the default (opens the ad drawer through the URL). */
  onOpen?: (adId: string) => void;
  /** "grid" (default) is the full card; "compact" is a horizontal row for overlays and boards. */
  variant?: "grid" | "compact";
  /** Ads in the current scope. Used only to decide the Winner badge's engagement mark. */
  scopedAds?: Ad[];
  /** Precomputed alternative to `scopedAds`. */
  engagementStandout?: boolean;
  className?: string;
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "?") + (words.length > 1 ? words[1][0] : "")).toUpperCase();
}

function PageAvatar({ ad, size }: { ad: Ad; size: number }) {
  const [broken, setBroken] = useState(false);
  return ad.pageAvatarUrl && !broken ? (
    <img
      src={ad.pageAvatarUrl}
      alt=""
      loading="lazy"
      onError={() => setBroken(true)}
      width={size}
      height={size}
      className="shrink-0 rounded-full border border-border bg-muted object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary-text"
      style={{ width: size, height: size }}
    >
      {initials(ad.pageName)}
    </span>
  );
}

function FollowPageButton({ ad }: { ad: Ad }) {
  const followed = useIsPageFollowed(ad.pageAdvertiserId);
  return (
    <button
      type="button"
      aria-pressed={followed}
      aria-label={`${followed ? "Unfollow" : "Follow"} ${ad.pageName}`}
      onClick={(e) => {
        e.stopPropagation();
        toggleFollowPage(ad.pageAdvertiserId);
      }}
      onKeyDown={(e) => e.stopPropagation()}
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-full border px-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        followed
          ? "border-primary/40 bg-primary/15 text-primary-text hover:bg-primary/25"
          : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5",
      )}
    >
      {followed ? "Following" : "Follow page"}
    </button>
  );
}

function PageName({ ad, className }: { ad: Ad; className?: string }) {
  const detail = useDetailStack();
  return (
    <button
      type="button"
      aria-label={`Open page ${ad.pageName}`}
      onClick={(e) => {
        e.stopPropagation();
        detail.push({ kind: "advertiser", advertiserKind: "page", id: ad.pageAdvertiserId });
      }}
      onKeyDown={(e) => e.stopPropagation()}
      className={cn(
        "min-w-0 flex-1 rounded-sm text-left text-sm font-medium text-foreground hover:text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <TruncatedText text={ad.pageName} focusable={false} />
    </button>
  );
}

/** Analysis chips in a fixed order. A null field is simply absent (the drawer shows the disabled section). */
function analysisChips(ad: Ad): { type: ElementType; id: string; label: string }[] {
  const a = ad.analysis;
  const pairs: [ElementType, string | null][] = [
    ["hook", a.hookStyle],
    ["angle", a.angle],
    ["framework", a.framework],
    ["concept", a.concept],
  ];
  return pairs
    .filter((p): p is [ElementType, string] => !!p[1])
    .map(([type, id]) => ({ type, id, label: getElement(type, id)?.label ?? id }));
}

function Chip({ children, tone }: { children: string; tone: "industry" | "category" }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4",
        tone === "industry" ? "border-primary/30 bg-primary/10 text-primary-text" : "border-border bg-muted text-foreground",
      )}
    >
      <TruncatedText text={children} className="max-w-[150px]" />
    </span>
  );
}

function AdCardImpl({ ad, onOpen, variant = "grid", scopedAds, engagementStandout, className }: AdCardProps) {
  const drawer = useAdDrawer();
  const lastVisitAt = useLastVisitAt();
  const open = () => (onOpen ? onOpen(ad.id) : drawer.open(ad.id));
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
  const standout = winner && (engagementStandout ?? (scopedAds ? isEngagementStandout(ad, scopedAds) : false));
  const fresh = isNew(ad, lastVisitAt);
  const industry = getIndustry(ad.industryId)?.label ?? ad.industryId;
  const category = getCategory(ad.categoryId)?.label ?? ad.categoryId;
  const chips = analysisChips(ad);
  const compact = variant === "compact";
  const label = `Ad from ${ad.pageName}: ${ad.headline}`;

  const signalRow = (
    <div className="flex flex-wrap items-center gap-1.5">
      {fresh && <NewBadge />}
      {winner && <WinnerBadge engagementStandout={standout} />}
      <DaysLive days={ad.daysLive} />
      <StatusPill status={ad.status} />
      <ClonesPill clones={ad.clones} />
    </div>
  );

  if (compact) {
    return (
      <article
        tabIndex={0}
        aria-label={label}
        data-ad-id={ad.id}
        onClick={onClick}
        onKeyDown={onKeyDown}
        className={cn(
          "flex cursor-pointer gap-3 rounded-lg border border-border bg-card p-2.5 shadow-sm transition-colors",
          "hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        <div className="w-20 shrink-0 self-start overflow-hidden rounded-md">
          <AdCardMedia ad={ad} compact className="aspect-square" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <PageAvatar ad={ad} size={20} />
            <PageName ad={ad} className="text-xs" />
            <AiScoreBadge score={ad.aiScore} />
          </div>
          <TruncatedText text={ad.headline} lines={2} className="text-sm text-foreground" />
          {signalRow}
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap gap-1.5">
              <Chip tone="industry">{industry}</Chip>
              <Chip tone="category">{category}</Chip>
            </div>
            <AdCardActions adId={ad.id} pageName={ad.pageName} />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      tabIndex={0}
      aria-label={label}
      data-ad-id={ad.id}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={cn(
        "flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-colors",
        "hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <AdCardMedia ad={ad} />
      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <div className="flex items-center gap-2">
          <PageAvatar ad={ad} size={24} />
          <PageName ad={ad} />
          <FollowPageButton ad={ad} />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Chip tone="industry">{industry}</Chip>
          <Chip tone="category">{category}</Chip>
        </div>

        {signalRow}

        <div className="flex flex-wrap items-center gap-1.5">
          <AiScoreBadge score={ad.aiScore} />
          {chips.map((c) => (
            <ElementChip key={c.type} type={c.type} id={c.id} label={c.label} />
          ))}
        </div>

        <div className="min-w-0 space-y-1">
          <TruncatedText text={ad.headline} lines={2} className="text-sm font-medium leading-5 text-foreground" />
          {ad.ctaLabel && (
            <p className="text-xs text-muted-foreground">
              CTA <span className="font-medium text-foreground">{ad.ctaLabel}</span>
            </p>
          )}
        </div>

        <div className="mt-auto flex justify-end pt-0.5">
          <AdCardActions adId={ad.id} pageName={ad.pageName} />
        </div>
      </div>
    </article>
  );
}

export const AdCard = memo(AdCardImpl);
