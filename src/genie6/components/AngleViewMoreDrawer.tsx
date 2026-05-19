import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Loader2 } from "lucide-react";
import { angles } from "@/mocks/shared/angles";
import { sampleOutputs } from "../mocks/sample-outputs";
import { MasonryView } from "../library/tabs/MasonryView";
import type { OutputData } from "../types/output";

const PAGE_SIZE = 24;

/**
 * AngleViewMoreDrawer — URL-driven masonry-in-drawer.
 *
 * Opens when the URL contains `?angle=<id>` (set by AngleRow's "View more"
 * CTA). Shows ALL ads with that angleId in the same CSS-columns masonry
 * layout used by the main Library page, but inside a right-side Sheet.
 *
 * Infinite scroll:
 *   IntersectionObserver watches a sentinel <div /> at the bottom of the
 *   list. When it enters the viewport, `visibleCount` grows by PAGE_SIZE.
 *   For the 50-output mock dataset this fires at most twice — but the
 *   pattern is correct for when the backend lands and a single angle could
 *   hold hundreds of outputs.
 *
 * Drawer stacking:
 *   Clicking a card sets `?ad=<id>`; the AdDetailDrawer is mounted in
 *   parallel and reads its own URL param, so it slides in ON TOP of this
 *   drawer (Radix Portal handles z-index naturally). Closing the detail
 *   drawer strips `?ad=` and the view-more drawer stays visible. Closing
 *   the view-more drawer strips `?angle=` and the detail drawer stays
 *   visible if `?ad=` is still set — both states are independent.
 */
export function AngleViewMoreDrawer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const angleId = searchParams.get("angle");

  const angle = useMemo(
    () => (angleId ? angles.find((a) => a.id === angleId) : null),
    [angleId],
  );

  const matches = useMemo<OutputData[]>(() => {
    if (!angleId) return [];
    return sampleOutputs.filter((o) => o.angleId === angleId);
  }, [angleId]);

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // Reset paging whenever the drawer (re)opens or angle changes.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [angleId]);

  const visible = useMemo(
    () => matches.slice(0, visibleCount),
    [matches, visibleCount],
  );
  const hasMore = visibleCount < matches.length;

  // Local selection state — drawer scope only. Bulk actions inside the
  // drawer don't need to leak back to the page-level selection.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!angleId) setSelected(new Set());
  }, [angleId]);
  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    const root = scrollContainerRef.current;
    if (!node || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, matches.length));
        }
      },
      { root, rootMargin: "200px 0px", threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, matches.length]);

  const close = useCallback(() => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.delete("angle");
        return sp;
      },
      { replace: false },
    );
  }, [setSearchParams]);

  const openCard = useCallback(
    (output: OutputData) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          sp.set("ad", output.id);
          return sp;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  if (!angle) return null;

  return (
    <Sheet open={true} onOpenChange={(o) => !o && close()}>
      <SheetContent
        side="right"
        className="w-full p-0 sm:max-w-[960px] overflow-hidden flex flex-col"
      >
        <SheetHeader className="border-b border-border px-5 py-3 space-y-0">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Angle
              </p>
              <SheetTitle className="text-[18px] font-semibold leading-tight text-foreground truncate">
                {angle.label}
              </SheetTitle>
              {angle.description && (
                <p className="mt-0.5 text-[12px] text-muted-foreground line-clamp-1">
                  {angle.description}
                </p>
              )}
            </div>
            <span className="shrink-0 inline-flex items-baseline gap-1 rounded-full bg-muted/50 px-2.5 py-1 font-mono text-[11px] tabular-nums text-foreground">
              <span className="font-semibold">{matches.length}</span>
              <span className="text-muted-foreground">
                {matches.length === 1 ? "ad" : "ads"}
              </span>
            </span>
          </div>
        </SheetHeader>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-5 py-5"
        >
          {matches.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  No ads
                </p>
                <p className="text-[13px] text-foreground">
                  Nothing generated for this angle yet.
                </p>
              </div>
            </div>
          ) : (
            <>
              <MasonryView
                outputs={visible}
                selected={selected}
                onSelect={toggleSelect}
                onCardClick={openCard}
              />

              {/* Sentinel — IntersectionObserver fires when this scrolls
                  into view (rootMargin: 200px so it triggers before the
                  user actually hits the bottom). */}
              {hasMore && (
                <div
                  ref={sentinelRef}
                  className="mt-4 flex items-center justify-center py-6"
                >
                  <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading more
                  </span>
                </div>
              )}

              {!hasMore && matches.length > PAGE_SIZE && (
                <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  End of results · {matches.length} total
                </p>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
