import { Sparkles, Tag } from "lucide-react";
import { TRENDING_TAGS } from "@/lib/insights-dummy-data";
import { cn } from "@/lib/utils";

interface TrendingTagsStripProps {
  selectedTag?: string;
  onSelectTag?: (tag: string | undefined) => void;
  className?: string;
}

export function TrendingTagsStrip({
  selectedTag,
  onSelectTag,
  className,
}: TrendingTagsStripProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 overflow-x-auto px-4 py-1.5 border-b border-border/60",
        "[&::-webkit-scrollbar]:h-0",
        className,
      )}
    >
      <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        Trending tags (AI)
      </span>
      {TRENDING_TAGS.map((tag) => {
        const isActive = selectedTag === tag;
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onSelectTag?.(isActive ? undefined : tag)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors",
              isActive
                ? "bg-primary text-primary-foreground font-semibold"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
            aria-pressed={isActive}
          >
            <Tag className="h-3 w-3" />
            {tag}
          </button>
        );
      })}
    </div>
  );
}
