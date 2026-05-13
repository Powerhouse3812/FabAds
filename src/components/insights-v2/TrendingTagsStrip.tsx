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

  const hiddenCount = TRENDING_TAGS.length - COLLAPSED_COUNT;

  const handleTagClick = (tag: string) => {
    const isActive = selectedTag === tag;
    onSelectTag?.(isActive ? undefined : tag);
    // Expand on any tag click so the user sees related options for switching.
    if (!expanded) setExpanded(true);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 overflow-x-auto px-4 py-1 border-b border-border/60",
        "[&::-webkit-scrollbar]:h-0",
        className,
      )}
    >
      <span className="flex shrink-0 items-center font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        Trending tags
      </span>
      {visibleTags.map((tag) => {
        const isActive = selectedTag === tag;
        return (
          <button
            key={tag}
            type="button"
            onClick={() => handleTagClick(tag)}
            className={cn(
              "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              isActive
                ? "bg-primary text-primary-foreground font-semibold"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
            aria-pressed={isActive}
          >
            {tag}
          </button>
        );
      })}

      {/* Trailing meta-action chip: "+N more" or "Show less" */}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? "Show fewer trending tags" : `Show ${hiddenCount} more trending tags`}
          className={cn(
            "inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] italic transition-colors",
            "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          )}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" strokeWidth={2} aria-hidden />
              Show less
            </>
          ) : (
            <>
              +{hiddenCount} more
              <ChevronDown className="h-3 w-3" strokeWidth={2} aria-hidden />
            </>
          )}
        </button>
      )}
    </div>
  );
}
