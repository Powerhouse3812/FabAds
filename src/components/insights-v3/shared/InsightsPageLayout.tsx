import { useCallback, useEffect, useState, type ReactNode, type Ref } from "react";
import { cn } from "@/lib/utils";
import { fmtInt } from "./format";
import { useCompactOnScroll } from "./url";

export interface InsightsPageLayoutProps {
  title: string;
  /** Result count shown next to the title ("1,284 ads"). Omit while loading. */
  count?: number | null;
  countNoun?: string;
  /** Page-level actions at the right of the title row. */
  headerActions?: ReactNode;
  /** The ScopeBar. A function receives `compact` so the bar can shrink with the header. */
  scopeBar: ReactNode | ((compact: boolean) => ReactNode);
  /** Optional tabs row (PageTabs) — stays in the sticky header. */
  tabs?: ReactNode;
  /** Scrolling content, top to bottom: overview → chips → list. */
  overview?: ReactNode;
  chips?: ReactNode;
  list: ReactNode;
  /** Receives the scroll container element (for scroll restore / infinite scroll). */
  scrollRef?: Ref<HTMLDivElement>;
  /** Called when the bottom sentinel enters view — wire infinite scroll here. */
  onReachEnd?: () => void;
  /** IntersectionObserver margin for `onReachEnd`. Default "400px". */
  reachEndMargin?: string;
  /** px scrolled before the header goes compact. Default 80. */
  compactThreshold?: number;
  className?: string;
}

/**
 * Page frame. AppLayout gives pages a padding-free, non-scrolling `h-full` box
 * (`ownsLayout`), so this is `flex h-full min-h-0 flex-col`: the sticky header
 * (title, scope bar, tabs) lives OUTSIDE the single scroll container, which holds
 * overview + chips + list. Compact-on-scroll collapses the title row; the scope bar stays.
 */
export function InsightsPageLayout({
  title,
  count,
  countNoun,
  headerActions,
  scopeBar,
  tabs,
  overview,
  chips,
  list,
  scrollRef,
  onReachEnd,
  reachEndMargin = "400px",
  compactThreshold = 80,
  className,
}: InsightsPageLayoutProps) {
  const { ref: compactRef, compact } = useCompactOnScroll(compactThreshold);
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      compactRef(node);
      setScroller(node);
      if (typeof scrollRef === "function") scrollRef(node);
      else if (scrollRef) (scrollRef as { current: HTMLDivElement | null }).current = node;
    },
    [compactRef, scrollRef],
  );

  useEffect(() => {
    if (!onReachEnd || !scroller || !sentinel || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && onReachEnd(), {
      root: scroller,
      rootMargin: reachEndMargin,
    });
    io.observe(sentinel);
    return () => io.disconnect();
  }, [onReachEnd, scroller, sentinel, reachEndMargin]);

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-background", className)}>
      <header className="z-10 shrink-0 border-b border-border bg-background px-3 sm:px-5">
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
            compact ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
          )}
          aria-hidden={compact || undefined}
          // Inert when collapsed so hidden actions aren't tab stops.
          {...(compact ? ({ inert: "" } as Record<string, string>) : {})}
        >
          <div className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pb-2 pt-3">
              <h1 className="flex min-w-0 items-baseline gap-2 text-xl font-semibold leading-7 text-foreground">
                <span className="truncate">{title}</span>
                {typeof count === "number" && (
                  <span className="shrink-0 rounded-full bg-primary/15 px-2 font-mono text-xs font-medium leading-5 tabular-nums text-primary-text">
                    {fmtInt(count)}
                    {countNoun ? ` ${countNoun}` : ""}
                  </span>
                )}
              </h1>
              {headerActions && <div className="flex max-w-full flex-wrap items-center gap-2">{headerActions}</div>}
            </div>
          </div>
        </div>
        <div className={cn("pb-2", compact && "pt-2")}>{typeof scopeBar === "function" ? scopeBar(compact) : scopeBar}</div>
        {tabs && <div className="-mb-px">{tabs}</div>}
      </header>

      <div
        ref={setRefs}
        data-compact={compact || undefined}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-muted/30 px-3 py-3 sm:px-5"
      >
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3">
          {overview}
          {chips}
          {list}
          {onReachEnd && <div ref={setSentinel} aria-hidden="true" className="h-px w-full" />}
        </div>
      </div>
    </div>
  );
}
