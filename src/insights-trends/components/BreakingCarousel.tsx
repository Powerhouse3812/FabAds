/**
 * Industry Insights → Trends: Breaking Stories carousel (doc §7.4).
 *
 * Contract: exactly one story visible at a time; manual-only prev/next
 * (never autoplay, never loop); a visible "n of N" position indicator
 * announced via aria-live; individually-labelled dot buttons; arrows
 * explicitly disabled at the first/last story; ArrowLeft/ArrowRight
 * keyboard support; visible focus states; instant transition under
 * prefers-reduced-motion.
 *
 * CRITICAL a11y fix over the reference prototype: the prototype renders
 * every slide in the DOM but leaves the off-screen ones focusable, so
 * Tab walks straight through invisible content. Here, every non-active
 * slide's wrapper is set `inert` (imperatively — see useInert below),
 * which removes its entire subtree from the tab order, from click
 * targeting, and from the accessibility tree in one native primitive,
 * rather than hand-chasing tabIndex on every focusable descendant
 * (including everything TrendActionBar renders).
 *
 * The carousel index lives in React state (useState), not a ref/DOM
 * closure, so re-renders and the position indicator stay in lockstep
 * with it.
 *
 * Stress test (10x scale): only the active slide ± 1 neighbour render
 * real content (image, copy, action bar); every other index renders a
 * cheap inert placeholder that preserves the track's layout math. A
 * "Breaking Stories" feed realistically holds single digits of items,
 * but this keeps a 1,000-item feed from mounting 1,000 images at once.
 *
 * Token vocabulary matches src/insights-trends/lib/trendsDisplay.ts and
 * src/components/insights-v2/IndustryInsightsAdsCard.tsx — bg-card /
 * bg-muted / text-muted-foreground / border-border / bg-primary /
 * text-primary. No new colour tokens, no type scale, no platform brand
 * tinting — platform identity comes from SOURCE_META's icon + label only.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TrendActionBar } from "@/insights-trends/components/TrendActions";
import { SOURCE_META, STAGE_META, relativeTime } from "@/insights-trends/lib/trendsDisplay";
import type { TrendItem } from "@/insights-trends/types";

/* ------------------------------------------------------------------ */
/*  prefers-reduced-motion — live, so an OS-level toggle mid-session   */
/*  takes effect without a reload.                                    */
/* ------------------------------------------------------------------ */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Sets the DOM `inert` IDL property imperatively rather than passing an
 * `inert` JSX prop. This app targets React 18.3, which does not treat
 * `inert` as a recognised boolean attribute the way React 19 does — going
 * through the ref avoids depending on how a given React 18 patch
 * serialises an unrecognised boolean prop and instead sets the exact DOM
 * property browsers act on.
 */
function useInert(isInert: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.inert = isInert;
  }, [isInert]);
  return ref;
}

/** Cheap stand-in for a slide that is more than one step from the active
 *  index — keeps the flex track's width math correct at any item count
 *  without mounting that slide's image / copy / action bar. Always inert:
 *  by construction it is never the active slide. */
function InertSlot(): JSX.Element {
  const ref = useInert(true);
  return <div ref={ref} className="w-full shrink-0 basis-full" aria-hidden="true" />;
}

function Slide(props: { item: TrendItem; isActive: boolean; onOpen: (id: string) => void }): JSX.Element {
  const { item, isActive, onOpen } = props;
  const ref = useInert(!isActive);
  const source = SOURCE_META[item.type];
  const SourceIcon = source.icon;
  const stage = STAGE_META[item.intelligence.trendStage];
  const StageIcon = stage.icon;
  const byline = item.source ?? item.advertiser ?? item.creator ?? source.label;

  return (
    <div ref={ref} className="w-full shrink-0 basis-full" aria-hidden={!isActive}>
      <div className="grid overflow-hidden rounded-lg border border-border bg-card sm:grid-cols-2">
        {/* Media — dominant, large. Platform identity via icon + label
            chip only, never a brand-colour tint. */}
        {/* The image is absolutely positioned so it can never drive this
            column's height. Left in flow with `h-full`, a portrait thumbnail
            (the Meta ads in this feed are 500x700) resolves `h-full` against
            an auto grid row, falls back to its own intrinsic aspect, and
            stretches the whole slide to ~780px — which, because every slide
            shares one flex track, then padded the *active* slide with ~400px
            of dead space whenever a portrait story sat next to it. */}
        <div className="relative h-56 overflow-hidden bg-muted sm:h-auto sm:min-h-[22rem]">
          <img
            src={item.thumbnail}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading={isActive ? "eager" : "lazy"}
          />
          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/85 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
            <SourceIcon className="h-3.5 w-3.5" />
            {source.label}
          </div>
        </div>

        {/* Editorial lead */}
        <div className="flex flex-col gap-3 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="truncate">{byline}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={item.publishedAt}>{relativeTime(item.publishedAt)}</time>
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium", stage.className)}>
              <StageIcon className="h-3 w-3" />
              {stage.label}
            </span>
          </div>

          <h3 className="text-lg font-semibold leading-snug text-foreground sm:text-xl">{item.title}</h3>
          <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">{item.excerpt}</p>

          <div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
              onClick={() => onOpen(item.id)}
            >
              Read full story
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="mt-auto border-t border-border pt-2">
            <TrendActionBar item={item} variant="story" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function BreakingCarousel(props: { items: TrendItem[]; onOpen: (id: string) => void }): JSX.Element {
  const { items, onOpen } = props;
  const count = items.length;
  const [index, setIndex] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  // Defensive clamp — if `items` shrinks (e.g. upstream filtering removes a
  // dismissed story) after the user has paged forward, don't strand the
  // index past the new end.
  const clampedIndex = count > 0 ? Math.min(index, count - 1) : 0;
  useEffect(() => {
    if (clampedIndex !== index) setIndex(clampedIndex);
  }, [clampedIndex, index]);

  const canPrev = clampedIndex > 0;
  const canNext = clampedIndex < count - 1;

  const goPrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const goNext = useCallback(() => setIndex((i) => Math.min(count - 1, i + 1)), [count]);

  // ArrowLeft/ArrowRight anywhere inside the region (arrows, dots, "Read
  // full story") pages the carousel — manual navigation only, still no
  // autoplay or looping introduced by this.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    },
    [goPrev, goNext],
  );

  if (count === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
        No breaking stories right now.
      </div>
    );
  }

  return (
    <div
      className="space-y-3"
      role="region"
      aria-roledescription="carousel"
      aria-label="Breaking stories"
      onKeyDown={onKeyDown}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-medium tabular-nums text-muted-foreground" aria-live="polite">
          <span className="sr-only">Showing story </span>
          {clampedIndex + 1} of {count}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
            aria-label="Previous story"
            disabled={!canPrev}
            onClick={goPrev}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
            aria-label="Next story"
            disabled={!canNext}
            onClick={goNext}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden">
        <div
          className={cn("flex", !reducedMotion && "transition-transform duration-300 ease-out")}
          style={{ transform: `translateX(-${clampedIndex * 100}%)` }}
        >
          {items.map((item, i) => {
            const isNearActive = Math.abs(i - clampedIndex) <= 1;
            return isNearActive ? (
              <Slide key={item.id} item={item} isActive={i === clampedIndex} onOpen={onOpen} />
            ) : (
              <InertSlot key={item.id} />
            );
          })}
        </div>
      </div>

      {count > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Go to story ${i + 1} of ${count}: ${item.title}`}
              aria-current={i === clampedIndex ? "true" : undefined}
              onClick={() => setIndex(i)}
              className={cn(
                "h-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                i === clampedIndex ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
