import { useMemo, useState } from "react";
import { formatDistanceToNowStrict, format } from "date-fns";
import { Activity, Infinity as InfinityIcon, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AgentAvatar } from "@/connector/components/AgentAvatar";
import { ConnectorStatusPill } from "@/connector/components/ConnectorStatusPill";
import { getAgentPreset, METER_IDS } from "@/connector/catalogue";
import { connectionHealth, hasAnyWriteAccess, limitStatus } from "@/connector/selectors";
import type { ConnectorConnection } from "@/connector/model";

/**
 * ConnectionRail — the left rail for the Connector module's master-detail
 * shell (Catalogue pattern: `src/catalogue/CatalogueFinder.tsx` L263-300).
 *
 * THREE DECISIONS WORTH KNOWING BEFORE YOU EDIT THIS FILE
 *
 * 1. "ALL ACTIVITY" IS PINNED AND VISUALLY SEPARATED, NOT JUST FIRST IN LIST.
 *    It is a different KIND of thing from a connection row — it opens a
 *    cross-app feed, not a single app's detail — so it gets its own icon
 *    vocabulary (Activity, not an agent avatar), always renders even at zero
 *    connections (the feed still exists with nothing in it), and sits above
 *    a hairline separator (`border-border/60`) so scanning the list never
 *    confuses it for "just the most recent app." This mirrors the pinned
 *    "All items" pseudo-row in `FolderListPanel.tsx` L88-98, adapted with a
 *    second muted line and an unread badge because a global activity feed
 *    carries more state than a folder filter does.
 *
 * 2. SEARCH ONLY APPEARS AT 8+ CONNECTIONS.
 *    The threshold came from the full-width table this rail replaced (that
 *    file is gone; the number outlived it) — a search field sitting over one,
 *    two, or three rows is
 *    pure chrome with nothing to search. Below the threshold, scanning three
 *    labels is cheaper than reading a placeholder and deciding not to use it.
 *
 * 3. THE RESPONSIVE SPLIT IS `flex-col lg:flex-row` ON THE PAIR, NOT A FIXED
 *    WIDTH THAT SILENTLY BREAKS BELOW LG.
 *    Every other master-detail split in this repo (including Catalogue's)
 *    assumes desktop width and quietly crushes the detail pane on tablet.
 *    `FeedbackPanel.tsx` L488-497 is the one surface that got this right:
 *    the container is `flex-col lg:flex-row` and the rail carries
 *    `border-b lg:border-b-0 lg:border-r` so it stacks above the detail on
 *    narrow screens instead of squeezing beside it. This component copies
 *    that exact technique — root classes below apply the rail's half of it
 *    (`border-b ... lg:border-b-0 lg:border-r` + `lg:w-[260px] lg:shrink-0`);
 *    the parent composing this with a detail pane must add the matching
 *    `flex-col lg:flex-row` on its own wrapper. The app shell only renders
 *    at `md:flex` and up, so 768-1024px is the range that actually matters
 *    here — this rail stacks full-width above the detail in that band
 *    instead of squeezing it.
 *
 * 4. THE "UNLIMITED" MARKER EARNS SPACE THAT "CAN ACCESS" NEVER DID.
 *    This rail replaced a full-width table (`ConnectionsList.tsx`, now gone)
 *    that also had a module-access summary, and that summary did NOT survive
 *    the move to 260px — it was a comparison aid, useful for scanning many
 *    rows against each other but not load-bearing on any single one, and
 *    `ConnectionDetail`'s hero says the same thing at a glance the moment you
 *    open the row. "Unlimited" is not that. It is the marker for the exact
 *    state `ConnectionDetail`'s own header calls "the single most dangerous
 *    state this feature can produce" — write access plus every cap switched
 *    off, no ceiling on budget, launches, live changes or credits. A
 *    comparison aid can wait for the click into detail; a warning that a
 *    connection can do unlimited damage cannot — dropping it to save 90px of
 *    row width is the wrong trade, so it gets a compact icon+text badge on
 *    the row's second line instead of living only behind a click. Same
 *    predicate as `ConnectionDetail`'s `showUnlimited` (via `limitStatus`,
 *    never a raw `rules[id].enabled` read — see `selectors.ts`), so the rail
 *    and the detail screen can never disagree about which connections are
 *    unlimited.
 */

export interface ConnectionRailProps {
  connections: ConnectorConnection[];
  /** Currently open connection id, or null when the All-activity view is open. */
  selectedId: string | null;
  /** True when the "All activity" pseudo-row is the active selection. */
  activityActive: boolean;
  onSelect: (id: string) => void;
  onSelectActivity: () => void;
  onConnect: () => void;
  /** Unread blocked-event count for the All-activity row's badge. 0 = no badge. */
  unreadCount?: number;
  className?: string;
}

const SEARCH_FILTER_THRESHOLD = 8;

function matchesSearch(c: ConnectorConnection, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const preset = getAgentPreset(c.agentKind);
  return c.name.toLowerCase().includes(q) || preset.label.toLowerCase().includes(q);
}

/** null `lastActiveAt` always sinks to the bottom — a connection that has
 *  never done anything is the least useful row to see first. Copied from
 *  `ConnectionsList.tsx`'s `compareByLastActiveDesc`. */
function compareByLastActiveDesc(a: ConnectorConnection, b: ConnectorConnection): number {
  if (a.lastActiveAt === null && b.lastActiveAt === null) return 0;
  if (a.lastActiveAt === null) return 1;
  if (b.lastActiveAt === null) return -1;
  return Date.parse(b.lastActiveAt) - Date.parse(a.lastActiveAt);
}

function formatUnreadCount(count: number): string {
  return count > 99 ? "99+" : String(count);
}

/**
 * The SAME predicate as `ConnectionDetail`'s `showUnlimited` — write access,
 * plus every meter reporting `state === "off"`. Routed through `limitStatus`,
 * never a raw `c.limits.rules[id].enabled` read: `selectors.ts` warns that the
 * two agree only by coincidence today, and "Unlimited" is exactly the state
 * that must not depend on a coincidence holding forever. If this ever reads
 * differently from `ConnectionDetail`, the rail and the detail screen would
 * disagree about the most dangerous state the feature can produce.
 */
function isUnlimited(c: ConnectorConnection, now: number): boolean {
  return hasAnyWriteAccess(c) && METER_IDS.every((id) => limitStatus(c, id, now).state === "off");
}

/* ------------------------------------------------------------------ */
/*  Rows                                                               */
/* ------------------------------------------------------------------ */

function AllActivityRow({
  active,
  unreadCount,
  onSelect,
}: {
  active: boolean;
  unreadCount: number;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={cn(
        "w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors",
        active ? "bg-primary/10 text-primary" : "hover:bg-muted/40",
      )}
    >
      <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center shrink-0">
        <Activity className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-[13px] font-medium truncate", active ? "text-primary" : "text-foreground")}>
          All activity
        </p>
        <p className="text-[11px] text-muted-foreground truncate">Every app, one feed</p>
      </div>
      {unreadCount > 0 && (
        <span className="rounded-full bg-error-text/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-error-text shrink-0">
          {formatUnreadCount(unreadCount)}
        </span>
      )}
    </button>
  );
}

function ConnectionRow({
  connection,
  active,
  now,
  onSelect,
}: {
  connection: ConnectorConnection;
  active: boolean;
  now: number;
  onSelect: () => void;
}) {
  const preset = getAgentPreset(connection.agentKind);
  const lastUsedLabel =
    connection.lastActiveAt === null ? "Never" : formatDistanceToNowStrict(new Date(connection.lastActiveAt), { addSuffix: true });
  const unlimited = isUnlimited(connection, now);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={cn(
        "w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors",
        active ? "bg-primary/10 text-primary" : "hover:bg-muted/40",
      )}
    >
      <AgentAvatar monogram={preset.monogram} brandHex={preset.brandHex} size="sm" />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium truncate", active ? "text-primary" : "text-foreground")}>
          {connection.name}
        </p>
        {/*
         * Second line: timestamp + the "Unlimited" marker, sharing one row
         * instead of stacking a third line the 260px rail has no height
         * budget for. The timestamp gets `flex-1 min-w-0 truncate` and the
         * marker gets `shrink-0` — deliberately in that order of priority.
         * A warning that a connection can do unlimited damage must never be
         * the thing that silently disappears under a long name or a verbose
         * timestamp ("about 2 months ago"); the exact recency figure can
         * afford to lose a few characters to an ellipsis (its full value is
         * still one hover away, in `title`) but the marker cannot lose any.
         * A `· Unlimited` suffix baked into the same truncating text node
         * was rejected for exactly this reason — appended text is the first
         * thing an ellipsis eats, which would make the marker disappear in
         * precisely the width-constrained cases it exists for.
         */}
        <div className="flex items-center gap-1 min-w-0">
          {connection.lastActiveAt === null ? (
            <p className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">Never</p>
          ) : (
            <time
              dateTime={connection.lastActiveAt}
              title={format(new Date(connection.lastActiveAt), "PPpp")}
              className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground"
            >
              {lastUsedLabel}
            </time>
          )}
          {unlimited && (
            <span
              title="Can change anything, with no limits set."
              className="inline-flex shrink-0 items-center gap-0.5 rounded bg-warning-text/10 px-1 py-px text-[10px] font-medium text-warning-text"
            >
              <InfinityIcon className="h-3 w-3" aria-hidden="true" />
              <span aria-hidden="true">Unlimited</span>
              {/* The visible icon+word above is aria-hidden and replaced with
                  this fuller sentence so a screen-reader user gets the same
                  "why this matters" context a sighted user gets from the
                  `title` tooltip, not just the one-word label. It sits inside
                  the row's own <button>, so it is picked up as part of the
                  row's accessible name for free — no separate aria-label
                  rewrite needed. */}
              <span className="sr-only">Unlimited — can change anything, with no limits set.</span>
            </span>
          )}
        </div>
      </div>
      <ConnectorStatusPill health={connectionHealth(connection, now)} className="shrink-0" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty states                                                       */
/* ------------------------------------------------------------------ */

function NoConnectionsState() {
  return (
    <p className="px-3 py-6 text-xs text-muted-foreground text-center">
      No apps connected yet.
    </p>
  );
}

function NoSearchMatchState({ onClear }: { onClear: () => void }) {
  return (
    <div className="px-3 py-6 flex flex-col items-center gap-2 text-center">
      <p className="text-xs text-muted-foreground">No apps match that.</p>
      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ConnectionRail({
  connections,
  selectedId,
  activityActive,
  onSelect,
  onSelectActivity,
  onConnect,
  unreadCount = 0,
  className,
}: ConnectionRailProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Computed once per render, not once per row — every health check below
  // shares this exact instant instead of drifting mid-render.
  const now = Date.now();

  const showSearch = connections.length >= SEARCH_FILTER_THRESHOLD;

  /**
   * The filter is gated on `showSearch` for a reason. `searchQuery` survives
   * the field being hidden, so without this gate a list that drops from 8
   * connections to 7 while a non-matching query is typed keeps filtering by a
   * query the user can no longer see or clear — and renders an empty `.map()`
   * with no rows, no empty state and no way out.
   *
   * `.sort()` mutates, so the copy is load-bearing: sorting `connections`
   * directly would reorder the caller's array in place.
   */
  const visibleConnections = useMemo(() => {
    const filtered = showSearch
      ? connections.filter((c) => matchesSearch(c, searchQuery))
      : [...connections];
    return filtered.sort(compareByLastActiveDesc);
  }, [connections, searchQuery, showSearch]);

  const hasNoConnections = connections.length === 0;
  const searchMatchedNothing = !hasNoConnections && showSearch && searchQuery.trim() !== "" && visibleConnections.length === 0;

  return (
    <aside
      className={cn(
        "flex flex-col border-b border-border min-h-0 lg:h-full lg:w-[260px] lg:shrink-0 lg:border-b-0 lg:border-r",
        className,
      )}
    >
      <div className="shrink-0 px-3 py-2 border-b border-border space-y-2">
        <Button size="sm" className="w-full" onClick={onConnect}>
          Connect an app
        </Button>
        {showSearch && (
          <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps"
              aria-label="Search apps"
              className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-full"
            />
          </div>
        )}
      </div>

      <nav aria-label="Connections" className="flex-1 overflow-y-auto min-h-0 py-1">
        <AllActivityRow active={activityActive} unreadCount={unreadCount} onSelect={onSelectActivity} />
        <div className="border-b border-border/60 my-1" />

        {hasNoConnections ? (
          <NoConnectionsState />
        ) : searchMatchedNothing ? (
          <NoSearchMatchState onClear={() => setSearchQuery("")} />
        ) : (
          visibleConnections.map((c) => (
            <ConnectionRow key={c.id} connection={c} active={!activityActive && selectedId === c.id} now={now} onSelect={() => onSelect(c.id)} />
          ))
        )}
      </nav>
    </aside>
  );
}
