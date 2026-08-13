import { useCallback, useEffect, useMemo, useState } from "react";
import { Inbox, SearchX, SlidersHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import type { EntityLevel, ReportEntity } from "@/lib/reports-dummy-data";
import { MobileReportRow, type MobileThirdMetric } from "./MobileReportRow";

/**
 * MobileReportsList — the card list that replaces the desktop 12-column table
 * on narrow viewports. Prop-driven end to end: the parent owns fetching,
 * filtering, sorting and scope. This component owns the WINDOW (how much of
 * what it was handed is currently in the DOM) and nothing else.
 *
 * ── Pagination: windowed infinite scroll, not a numeric pager ───────────────
 * The desktop pager (ReportsTable.tsx) uses `h-7 w-7` page-number buttons —
 * 28px, a straight WCAG 2.5.5 (Target Size) failure and miserable with a
 * thumb. It is deliberately NOT ported. Instead: a 25-row window that grows.
 *
 * The IntersectionObserver auto-trigger (via `use-infinite-scroll.ts`) is an
 * ENHANCEMENT layered over a real `<button>`, never a replacement for it.
 * A pure-observer list is unreachable by keyboard, invisible to a screen
 * reader, and silently broken whenever the observer does not fire (reduced
 * motion, background tab, some in-app webviews). Both paths call the same
 * `loadMore`.
 *
 * The footer is simultaneously STATUS and CONTROL — "Showing 50 of 312" plus
 * the button — because on mobile there is no room for a separate status strip,
 * and the count is exactly the context needed to decide whether to keep
 * scrolling or go filter instead (NN/g #1, visibility of system status).
 *
 * ── The 250-row cap ────────────────────────────────────────────────────────
 * Ten pages in, the DOM is ~250 rows and scroll performance on a mid-range
 * Android starts to suffer. Rather than dragging in a virtualiser (and its
 * broken ⌘F, broken screen-reader row counts, and scroll-anchor jitter), the
 * list stops and redirects: "Refine your filters to see the remaining N".
 * At 250 rows the user is not reading any more — they are hunting, and
 * filtering is the faster tool. The cap is a nudge toward the right tool, and
 * it keeps the DOM bounded for free.
 *
 * ── Two empty states, not one ──────────────────────────────────────────────
 * The desktop table renders a single flat "No data found", which tells the
 * user nothing about WHY and offers no way out. Emptiness has two distinct
 * causes here and each gets its own message + its own exact undo (NN/g #9,
 * help users recover from errors):
 *   filters → "No ad sets match these filters"        + clear all filters
 *   search  → 'No ad sets matching "brand x"'         + clear search
 * The search variant echoes the query back verbatim so a typo is diagnosable
 * without reopening the search field.
 *
 * (A third `scope` reason — "No campaigns in Acme Corp US" + clear account
 * scope — existed here when mobile Reports had a persistent account/page
 * scope bar. That bar was cut as a product decision — see
 * `MobileReportsShell.tsx` — and with no scope concept left to produce it,
 * the `scope` reason was removed rather than kept dead.)
 */

export type MobileEmptyReason = "filters" | "search";

export interface MobileReportsEmptyState {
  reason: MobileEmptyReason;
  /** The active query, echoed verbatim by the `search` variant. */
  query?: string;
  /** How many filters are active — lets the copy say "these 3 filters". */
  activeFilterCount?: number;
  onClearFilters?: () => void;
  onClearSearch?: () => void;
}

export interface MobileReportsListProps {
  /** Everything the parent has loaded that matches the current query. */
  entities: ReportEntity[];
  /** Total matching rows server-side. Drives "Showing 50 of 312". */
  totalCount: number;
  level: EntityLevel;
  onOpen: (entity: ReportEntity) => void;
  /** Forwarded to every row; overrides the level-aware third slot. */
  thirdMetric?: MobileThirdMetric;
  emptyState: MobileReportsEmptyState;
  /** Opens the parent's filter sheet — used by the 250-row cap message. */
  onOpenFilters?: () => void;
  /**
   * Called when the local window has consumed every entity the parent handed
   * over but `totalCount` says more exist. The parent fetches and appends;
   * the window does not reset (see `resetKey`).
   */
  onRequestMore?: () => void;
  /** First-load spinner state. */
  isLoading?: boolean;
  /** True while `onRequestMore` is in flight. */
  isLoadingMore?: boolean;
  /**
   * Change this whenever the QUERY changes (filters / search / scope / sort)
   * to collapse the window back to page 1. Deliberately NOT keyed off
   * `entities.length`: appending a fetched page also changes the length, and
   * that must not throw the user back to the top of the list.
   */
  resetKey?: string | number;
  className?: string;
}

const PAGE_SIZE = 25;
/** 10 × 25 = 250 rows, then the list redirects to filtering. */
const MAX_PAGES = 10;

/** Level → entity noun. Note "ad set" is two words, and "adsets" is not a word. */
const NOUN: Record<EntityLevel, { one: string; many: string }> = {
  account: { one: "account", many: "accounts" },
  campaign: { one: "campaign", many: "campaigns" },
  adset: { one: "ad set", many: "ad sets" },
  ad: { one: "ad", many: "ads" },
};

function noun(level: EntityLevel, count: number): string {
  const n = NOUN[level] ?? NOUN.campaign;
  return count === 1 ? n.one : n.many;
}

function EmptyState({
  level,
  state,
}: {
  level: EntityLevel;
  state: MobileReportsEmptyState;
}) {
  const plural = noun(level, 0);

  let Icon = Inbox;
  let title = `No ${plural} found`;
  let body = "";
  let actionLabel: string | null = null;
  let action: (() => void) | undefined;

  if (state.reason === "search") {
    Icon = SearchX;
    // Echo the query verbatim — a trailing space or a typo is only visible
    // when the user can see exactly what was searched for.
    title = `No ${plural} matching "${state.query ?? ""}"`;
    body = "Check the spelling, or search a shorter fragment of the name.";
    actionLabel = "Clear search";
    action = state.onClearSearch;
  } else {
    Icon = SlidersHorizontal;
    const n = state.activeFilterCount ?? 0;
    title = `No ${plural} match ${n > 0 ? (n === 1 ? "this filter" : `these ${n} filters`) : "these filters"}`;
    body = `The ${plural} exist — the current filters exclude all of them.`;
    actionLabel = "Clear all filters";
    action = state.onClearFilters;
  }

  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-muted">
        <Icon aria-hidden="true" className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="max-w-[280px] break-words text-[15px] font-medium text-foreground">
        {title}
      </p>
      {body && (
        <p className="mt-1.5 max-w-[280px] text-[13px] leading-relaxed text-muted-foreground">
          {body}
        </p>
      )}
      {actionLabel && action && (
        <Button
          variant="outline"
          onClick={action}
          className="mt-5 h-11 min-w-[160px] text-[13px]"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

function SkeletonRow({ isLast }: { isLast: boolean }) {
  return (
    <div
      className={cn(
        "flex min-h-[76px] items-center gap-3 px-4 py-3",
        !isLast && "border-b border-border",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-muted" />
          <span className="h-3 w-[55%] rounded bg-muted" />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <div className="h-2 w-8 rounded bg-muted/70" />
              <div className="mt-1.5 h-3 w-12 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MobileReportsList({
  entities,
  totalCount,
  level,
  onOpen,
  thirdMetric,
  emptyState,
  onOpenFilters,
  onRequestMore,
  isLoading = false,
  isLoadingMore = false,
  resetKey,
  className,
}: MobileReportsListProps) {
  const [pages, setPages] = useState(1);

  // Collapse the window on a query change only. See `resetKey` doc above.
  useEffect(() => {
    setPages(1);
  }, [resetKey, level]);

  const windowSize = pages * PAGE_SIZE;
  const visible = useMemo(
    () => entities.slice(0, windowSize),
    [entities, windowSize],
  );

  const shown = visible.length;
  const atCap = pages >= MAX_PAGES;
  // `totalCount` is authoritative; `entities` is only what has arrived so far.
  const remaining = Math.max(totalCount - shown, 0);
  const hasMore = remaining > 0 && !atCap;

  const loadMore = useCallback(() => {
    if (isLoadingMore) return;
    if (pages >= MAX_PAGES) return;
    // The window has eaten everything the parent handed over, but the server
    // says there is more — ask the parent to fetch before growing the window.
    if (entities.length <= pages * PAGE_SIZE && entities.length < totalCount) {
      onRequestMore?.();
      return;
    }
    setPages((p) => Math.min(p + 1, MAX_PAGES));
  }, [entities.length, isLoadingMore, onRequestMore, pages, totalCount]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: isLoading || isLoadingMore,
    onLoadMore: loadMore,
  });

  // ── First load ────────────────────────────────────────────────────────────
  if (isLoading && entities.length === 0) {
    return (
      <div
        className={cn("overflow-hidden rounded-lg border bg-card", className)}
        aria-busy="true"
        aria-live="polite"
      >
        <span className="sr-only">Loading {noun(level, 0)}…</span>
        <div className="animate-pulse">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonRow key={i} isLast={i === 5} />
          ))}
        </div>
      </div>
    );
  }

  // ── Zero data — one of three distinct causes ──────────────────────────────
  if (entities.length === 0) {
    return (
      <div className={cn("overflow-hidden rounded-lg border bg-card", className)}>
        <EmptyState level={level} state={emptyState} />
      </div>
    );
  }

  // ── Populated / partial ───────────────────────────────────────────────────
  return (
    <div className={cn("space-y-2", className)}>
      <ul className="overflow-hidden rounded-lg border bg-card" role="list">
        {visible.map((entity, i) => (
          <li key={entity.id}>
            <MobileReportRow
              entity={entity}
              onOpen={onOpen}
              thirdMetric={thirdMetric}
              isLast={i === visible.length - 1}
            />
          </li>
        ))}
      </ul>

      {/* Sentinel for the auto-trigger. The button below is the real control —
          this only saves a tap for people who are already scrolling. */}
      {hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-px" />}

      {/* Footer: status AND control in one line. The count is never hidden,
          not even at 1 of 1 — "Showing 1 of 1" confirms the list is complete
          rather than truncated, which is exactly the doubt a single result
          creates. */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-1">
        <p
          className="font-mono text-[11px] tabular-nums text-muted-foreground"
          aria-live="polite"
        >
          Showing {shown.toLocaleString("en-US")} of {totalCount.toLocaleString("en-US")}
          {" "}
          <span className="font-sans">{noun(level, totalCount)}</span>
        </p>

        {hasMore && (
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isLoadingMore}
            className="h-11 min-w-[124px] text-[13px]"
          >
            {isLoadingMore ? (
              <>
                <Loader2 aria-hidden="true" className="mr-2 h-3.5 w-3.5 animate-spin" />
                Loading…
              </>
            ) : (
              `Load ${Math.min(PAGE_SIZE, remaining)} more`
            )}
          </Button>
        )}
      </div>

      {/* ── The cap: stop scrolling, start filtering ───────────────────────── */}
      {atCap && remaining > 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-4 text-center">
          <p className="text-[13px] text-foreground">
            Refine your filters to see the remaining{" "}
            {remaining.toLocaleString("en-US")} {noun(level, remaining)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {shown.toLocaleString("en-US")} rows is as far as this list loads —
            filtering gets you there faster than scrolling.
          </p>
          {onOpenFilters && (
            <Button
              variant="outline"
              onClick={onOpenFilters}
              className="mt-4 h-11 min-w-[150px] text-[13px]"
            >
              <SlidersHorizontal aria-hidden="true" className="mr-2 h-3.5 w-3.5" />
              Open filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
