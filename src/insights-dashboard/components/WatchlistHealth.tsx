/**
 * WatchlistHealth — a maintenance surface, not a stat.
 *
 * The research finding behind this block: an unbounded follow list is the
 * single most reliable predictor that a user abandons an ad-intelligence
 * tool. A competitor set of forty and a signal list of twenty guarantees the
 * loop gets abandoned within a month. So this card does not celebrate how
 * many advertisers are followed — it prunes them.
 *
 *  1. The cap renders as a constraint (a slots-used bar), not a growth
 *     number. `nearCap` says so in words, not by tinting a bar red.
 *  2. `statusGroups` comes quiet → ramping → active on purpose — the
 *     actionable band leads. Quiet advertisers (21+ days without new
 *     creative) get a full row and an obvious next step: Unfollow or Open.
 *     Ramping/active get a single collapsed line each — they don't need a
 *     decision, so they don't get equal weight.
 *  3. Unfollow is local-optimistic only (`useState` + an undo toast) — no
 *     store writes, per the module-wide rule against mutating shared state
 *     from a dashboard block.
 *  4. Empty (thin or zero — both ship an empty watchlist in the fixtures)
 *     carries the cold-start answer for this whole category: the field
 *     workaround is "go dig through the Meta Ad Library by hand." The empty
 *     state points at `/insights/competitors` as the next step instead of
 *     apologising for having nothing to show.
 *  5. Doorway: the advertiser identity block (avatar + name + domain) in a
 *     quiet row is a real `Link` to `/insights/discover?domain=<domain>` —
 *     everything that advertiser has running. "Open" keeps routing to the
 *     full Competitors view, unchanged.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Radar,
  TrendingUp,
  VolumeX,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Provenance } from "@/insights-dashboard/components/Provenance";
import {
  useWatchlistHealth,
  type WatchItem,
  type WatchStatus,
} from "@/insights-dashboard/lib/selectors";

const STATUS_ICON: Record<WatchStatus, LucideIcon> = {
  quiet: VolumeX,
  ramping: TrendingUp,
  active: Activity,
};

/** `/insights/discover?domain=<domain>` — everything that advertiser runs. */
function domainHref(domain: string): string {
  return `/insights/discover?domain=${encodeURIComponent(domain)}`;
}

function initials(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

function daysAgoLabel(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function WatchAvatar({
  item,
  className,
  title,
}: {
  item: WatchItem;
  className?: string;
  title?: string;
}) {
  return (
    <Avatar title={title} className={cn("h-8 w-8 border border-border/60", className)}>
      <AvatarImage src={item.avatarUrl} alt="" />
      <AvatarFallback className="text-[11px] font-semibold">
        {initials(item.advertiser)}
      </AvatarFallback>
    </Avatar>
  );
}

/** Full-detail row for a quiet advertiser — this is the actionable list. */
function QuietRow({
  item,
  onUnfollow,
}: {
  item: WatchItem;
  onUnfollow: (item: WatchItem) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Link
        to={domainHref(item.domain)}
        title={`${item.advertiser} — open in Discover`}
        className="group flex min-w-0 flex-1 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <WatchAvatar item={item} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <p
              title={item.advertiser}
              className="truncate text-sm font-medium text-foreground group-hover:underline"
            >
              {item.advertiser}
            </p>
            <span title={item.domain} className="shrink-0 truncate text-xs text-muted-foreground">
              {item.domain}
            </span>
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {item.industry} · Last new creative {daysAgoLabel(item.lastNewCreativeDaysAgo)}
          </p>
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-4 text-right">
        <div>
          <p className="text-sm font-medium tabular-nums text-foreground">
            {item.liveAds.toLocaleString()}
          </p>
          <p className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Live
          </p>
        </div>
        <div>
          <p className="text-sm font-medium tabular-nums text-foreground">
            {item.newCreatives30d.toLocaleString()}
          </p>
          <p className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            New · 30d
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button asChild variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
          <Link to="/insights/competitors">
            Open
            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onUnfollow(item)}
        >
          <X className="h-3 w-3" aria-hidden="true" />
          Unfollow
        </Button>
      </div>
    </div>
  );
}

/** Collapsed one-liner for a ramping/active band — quieter treatment on purpose. */
function CompactStatusGroup({
  status,
  label,
  note,
  items,
  count,
}: {
  status: WatchStatus;
  label: string;
  note: string;
  items: WatchItem[];
  count: number;
}) {
  const Icon = STATUS_ICON[status];
  const shown = items.slice(0, 5);
  const overflow = count - shown.length;

  return (
    <div className="flex items-center gap-3 rounded-md border border-border/50 px-3 py-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="flex shrink-0 -space-x-2">
        {shown.map((item) => (
          <WatchAvatar
            key={item.id}
            item={item}
            title={item.advertiser}
            className="h-6 w-6 ring-2 ring-card"
          />
        ))}
        {overflow > 0 && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-card">
            +{overflow}
          </span>
        )}
      </div>
      <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          {count} {label.toLowerCase()}
        </span>{" "}
        · {note}
      </p>
    </div>
  );
}

function EmptyWatchlist() {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <Radar className="h-8 w-8 text-muted-foreground/40" aria-hidden="true" />
      <div className="max-w-sm">
        <p className="text-sm font-medium text-foreground">Nothing tracked yet</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Follow a competitor and we'll flag the moment they ship new creative — no more checking
          the Meta Ad Library by hand.
        </p>
      </div>
      <Button asChild size="sm" variant="outline" className="gap-1.5">
        <Link to="/insights/competitors">
          Track your first advertiser
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}

export function WatchlistHealth({ className }: { className?: string }): JSX.Element {
  const {
    statusGroups, actionable, isEmpty, isLoading, capNote, capPct, nearCap, quietNote,
    counts, followCount, followCap, quietThresholdDays,
  } = useWatchlistHealth();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // CHECK isLoading BEFORE `isEmpty`. `items` is `[]` in both `loading` and a
  // genuinely empty watchlist — a skeleton keeps first paint from claiming
  // "nothing tracked yet" while we're still fetching who's on it.
  if (isLoading) {
    return (
      <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <header className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Watchlist health</h2>
        </header>
        <div className="space-y-4">
          <div className="rounded-md border border-border/60 bg-muted/30 p-2.5">
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="mt-2 h-1.5 w-full rounded-full" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-8 w-16 shrink-0" />
              </div>
            ))}
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </div>
      </section>
    );
  }

  function handleUnfollow(item: WatchItem) {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(item.id);
      return next;
    });
    toast(`Unfollowed ${item.advertiser}`, {
      description: "Removed from your watchlist for this session.",
      action: {
        label: "Undo",
        onClick: () =>
          setDismissedIds((prev) => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          }),
      },
    });
  }

  const visibleActionable = actionable.filter((item) => !dismissedIds.has(item.id));

  // An unfollow that removes the row but moves NO number is the same fake
  // button this page exists to stop shipping: the toast says "removed from
  // your watchlist", so the cap must free a slot and the quiet count must
  // drop. All three are recomputed locally against `dismissedIds` — session
  // state only, nothing written anywhere.
  const unfollowedCount = dismissedIds.size;
  const liveFollowCount = Math.max(0, followCount - unfollowedCount);
  const liveCapPct = followCap ? Math.round((liveFollowCount / followCap) * 100) : 0;
  const liveNearCap = followCap ? liveFollowCount / followCap >= 0.8 : false;
  const liveCapNote =
    unfollowedCount === 0
      ? capNote
      : `${liveFollowCount} of ${followCap} advertiser slots used${
          liveNearCap ? " — you're close to the cap" : ""
        }.`;
  const liveTotal = Math.max(0, counts.total - unfollowedCount);
  const liveQuietNote =
    unfollowedCount === 0
      ? quietNote
      : visibleActionable.length > 0
        ? `${visibleActionable.length} of the ${liveTotal} advertisers here ${
            visibleActionable.length === 1 ? "hasn't" : "haven't"
          } shipped anything new in ${quietThresholdDays}+ days.`
        : null;

  return (
    <section className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Watchlist health</h2>
        {!isEmpty && (
          <div className="flex shrink-0 items-center gap-2">
            <Provenance tier="observed" compact />
            <Link
              to="/insights/competitors"
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium text-muted-foreground",
                "hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              )}
            >
              Manage
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
        )}
      </header>

      {isEmpty ? (
        <EmptyWatchlist />
      ) : (
        <div className="space-y-4">
          {/* The cap, rendered as a constraint — not a growth stat. */}
          <div className="rounded-md border border-border/60 bg-muted/30 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-foreground">{liveCapNote}</span>
              {liveNearCap && (
                <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-destructive">
                  <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                  Near cap
                </span>
              )}
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", liveNearCap ? "bg-destructive" : "bg-primary")}
                style={{ width: `${Math.min(100, Math.max(0, liveCapPct))}%` }}
              />
            </div>
          </div>

          {liveQuietNote && (
            <p className="text-xs leading-relaxed text-muted-foreground">{liveQuietNote}</p>
          )}

          <div className="space-y-3">
            {statusGroups.map((group) => {
              if (group.count === 0) return null;

              if (group.status === "quiet") {
                return (
                  <div key={group.status}>
                    <div className="mb-1 flex items-center gap-1.5">
                      <VolumeX className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                      <span className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        {group.label} · {visibleActionable.length}
                      </span>
                    </div>
                    {visibleActionable.length > 0 ? (
                      <div className="divide-y divide-border/60">
                        {visibleActionable.map((item) => (
                          <QuietRow key={item.id} item={item} onUnfollow={handleUnfollow} />
                        ))}
                      </div>
                    ) : (
                      <p className="py-2 text-xs text-muted-foreground">
                        All reviewed for this session.
                      </p>
                    )}
                  </div>
                );
              }

              return (
                <CompactStatusGroup
                  key={group.status}
                  status={group.status}
                  label={group.label}
                  note={group.note}
                  items={group.items}
                  count={group.count}
                />
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
