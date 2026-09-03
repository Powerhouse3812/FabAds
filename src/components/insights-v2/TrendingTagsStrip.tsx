import { useMemo, useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TRENDING_TAGS } from "@/lib/insights-dummy-data";
import { cn } from "@/lib/utils";

interface TrendingTagsStripProps {
  selectedTag?: string;
  onSelectTag?: (tag: string | undefined) => void;
  className?: string;
}

const COLLAPSED_COUNT = 3;

export function TrendingTagsStrip({
  selectedTag,
  onSelectTag,
  className,
}: TrendingTagsStripProps) {
  const [expanded, setExpanded] = useState(false);

  // If the selected tag falls OUTSIDE the first N collapsed-view tags, auto-
  // expand so the user can see what they picked. (Doesn't auto-collapse on
  // clear — UX continuity.)
  useEffect(() => {
    if (!selectedTag) return;
    const idx = TRENDING_TAGS.indexOf(selectedTag as (typeof TRENDING_TAGS)[number]);
    if (idx >= COLLAPSED_COUNT) setExpanded(true);
  }, [selectedTag]);

  const visibleTags = useMemo(
    () => (expanded ? TRENDING_TAGS : TRENDING_TAGS.slice(0, COLLAPSED_COUNT)),
    [expanded],
  );

  // Overflow count for the trailing "+N" chip (F5). Count-based, not a real
  // scroll/viewport measurement — a reasonable proxy given the fixed,
  // small dataset. Covers the edge cases directly: 1 tag or a total ≤
  // COLLAPSED_COUNT both go negative/zero here, so the `hiddenCount > 0`
  // guard below correctly renders no chip at all ("all tags fit"); a large
  // ("many") tag list just makes N bigger, no separate code path needed.
  const hiddenCount = TRENDING_TAGS.length - COLLAPSED_COUNT;
  const hiddenPreviewTags = useMemo(
    () => TRENDING_TAGS.slice(COLLAPSED_COUNT, COLLAPSED_COUNT + 3),
    [],
  );

  const handleTagClick = (tag: string) => {
    const isActive = selectedTag === tag;
    onSelectTag?.(isActive ? undefined : tag);
    // Expand on any tag click so the user sees related options for switching.
    if (!expanded) setExpanded(true);
  };

  // Zero-data state (F5): TRENDING_TAGS is a static `as const` tuple today
  // (TS infers its `.length` as the literal 6, so `=== 0` would be a
  // compile error — hence the truthiness check), so this never actually
  // fires yet. Still written defensively for when a future pass wires this
  // to a fetched list — a lone "Trending tags" label with nothing after it
  // is a worse empty state than rendering nothing.
  if (!TRENDING_TAGS.length) return null;

  return (
    <div
      className={cn(
        // py-0 md:py-1: the row's own padding is dropped on mobile — the
        // buttons below now carry a real 44px min-height of their own
        // (mobile spec B 1.3), so keeping this padding too would stack on
        // top of that and turn the strip into a tall band. md:py-1 restores
        // the untouched desktop value (INV-4).
        "flex items-center gap-1.5 overflow-x-auto px-4 py-0 md:py-1 border-b border-border/60",
        // Fade the trailing edge so a scrollable-but-not-fully-visible strip
        // reads as scrollable rather than as a hard, arbitrary crop (F5).
        // Same idiom as the horizontal chip rail in
        // genie6/concepts/AnglePlaybookPreview.tsx's VariantD.
        "[&::-webkit-scrollbar]:h-0 [mask-image:linear-gradient(to_right,black_94%,transparent)]",
        className,
      )}
    >
      <span className="flex shrink-0 items-center font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        Trending tags
      </span>
      {visibleTags.map((tag) => {
        const isActive = selectedTag === tag;
        return (
          // Mobile spec B 1.3: chips measured 21px tall, well under the 44px
          // floor. Fix is a split hit-box, not a bigger chip — the parent
          // strip sits directly under the toolbar and can't become a tall
          // band (the feed's first card has to stay above the fold), and the
          // strip's own overflow-hidden ancestor wrapper (InsightsV2Feed.tsx,
          // used for the collapse-on-scroll animation) rules out the usual
          // negative-margin bleed trick — anything outside this box gets
          // clipped. So: THIS <button> is the real 44px-tall touch target
          // (min-h-11, md:min-h-0 restores the untouched desktop size), and
          // the visual pill lives on a nested, unenlarged <span> so the chip
          // itself never gets visually heavier — just vertically centred in
          // more hit area. "group" forwards the hover state from the full
          // box onto the small pill so mouse users see the same highlight.
          <button
            key={tag}
            type="button"
            onClick={() => handleTagClick(tag)}
            aria-pressed={isActive}
            className={cn(
              "group inline-flex min-h-11 shrink-0 items-center md:min-h-0",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
            )}
          >
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted text-muted-foreground group-hover:bg-muted/80",
              )}
            >
              {tag}
            </span>
          </button>
        );
      })}

      {/* Trailing meta-action chip:
           - Collapsed: stacked-avatar style preview of hidden tags + "+N"
           - Expanded: "Show less" with chevron
           Same split hit-box/visual-pill treatment as the tag chips above. */}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? "Show fewer trending tags" : `Show ${hiddenCount} more trending tags`}
          className={cn(
            "group inline-flex min-h-11 shrink-0 items-center md:min-h-0",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          )}
        >
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full pl-1 pr-2 py-0.5 text-[11px] transition-colors",
              "text-muted-foreground group-hover:text-foreground group-hover:bg-muted/60",
            )}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3" strokeWidth={2} aria-hidden />
                <span className="italic">Show less</span>
              </>
            ) : (
              <>
                {/* Stacked-avatar style preview of hidden tags. Single-letter
                    circles (initial of the tag, sans #), overlapping the
                    previous by ~40% so the layering reads as intentional. Solid
                    contrast against the strip + ring-2 ring-background gives
                    the "cut out from parent" separator effect. */}
                <span className="flex items-center" aria-hidden>
                  {hiddenPreviewTags.map((tag, idx) => (
                    <span
                      key={tag}
                      className={cn(
                        "inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-muted-foreground/25 font-mono text-[10px] font-bold uppercase text-foreground ring-2 ring-background",
                        idx > 0 && "-ml-2",
                      )}
                      style={{ zIndex: hiddenPreviewTags.length - idx }}
                    >
                      {tag.replace(/^#/, "").charAt(0)}
                    </span>
                  ))}
                </span>
                <span className="font-mono text-[11px] ml-0.5">+{hiddenCount}</span>
              </>
            )}
          </span>
        </button>
      )}
    </div>
  );
}
