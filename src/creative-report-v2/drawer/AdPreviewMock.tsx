/**
 * AdPreviewMock — native-style ad preview (handoff §5.2).
 *
 * Renders the creative as a Facebook-feed-style post rather than a bare
 * thumbnail, so the creative detail drawer carries the same credibility as
 * SuperAds-style reporting tools. The placement switcher only relabels the
 * frame's chrome ("Sponsored" context + media aspect) — the underlying
 * creative image is the same across placements.
 */
import { useState } from "react";
import {
  MoreHorizontal,
  ThumbsUp,
  MessageCircle,
  Share2,
  Video,
  Image as ImageIcon,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fmtCompact } from "@/creative-report-v2/lib/format";
import { PLACEMENT_OPTIONS } from "@/creative-report-v2/lib/paramSchema";
import type { CreativeRollup } from "@/creative-report-v2/lib/selectors";
import type { Creative } from "@/data/model";

const PLACEMENT_LABELS: Record<(typeof PLACEMENT_OPTIONS)[number], string> = {
  feed: "Feed",
  stories: "Stories",
  reels: "Reels",
  "audience-network": "Audience Network",
  search: "Search",
};

const FORMAT_ICON: Record<Creative["format"], LucideIcon> = {
  video: Video,
  static: ImageIcon,
  carousel: LayoutGrid,
};

export function AdPreviewMock({ rollup }: { rollup: CreativeRollup }) {
  const [placement, setPlacement] = useState<(typeof PLACEMENT_OPTIONS)[number]>("feed");
  const [imgErrored, setImgErrored] = useState(false);
  const { creative, metrics } = rollup;
  const isStory = placement === "stories" || placement === "reels";
  const FormatIcon = FORMAT_ICON[creative.format];
  const likeCount = fmtCompact(metrics.clicks / 20);
  const commentCount = fmtCompact(metrics.clicks / 90);
  const shareCount = fmtCompact(metrics.clicks / 140);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Ad preview
        </span>
        <Select value={placement} onValueChange={(v) => setPlacement(v as typeof placement)}>
          <SelectTrigger className="h-8 w-[168px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLACEMENT_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt} className="text-xs">
                {PLACEMENT_LABELS[opt]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Header */}
        <div className="flex items-start gap-2 px-3 pt-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
            {creative.product.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{creative.product}</p>
            <p className="text-xs text-muted-foreground">Sponsored · 🌐</p>
          </div>
          <MoreHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </div>

        {/* Primary text */}
        <p className="px-3 py-2 text-sm text-foreground">{creative.components.primaryText}</p>

        {/* Media */}
        <div
          className={cn(
            "w-full bg-muted",
            isStory ? "mx-auto aspect-[9/16] max-h-80" : "aspect-[3/2]",
          )}
        >
          {!imgErrored ? (
            <img
              src={`https://picsum.photos/seed/${creative.thumbKey}/600/400`}
              alt=""
              loading="lazy"
              onError={() => setImgErrored(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <FormatIcon className="h-6 w-6 text-muted-foreground" aria-hidden />
            </div>
          )}
        </div>

        {/* Headline + CTA */}
        <div className="flex items-center justify-between gap-2 bg-muted/50 px-3 py-2">
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            {creative.components.headline}
          </p>
          <span className="shrink-0 rounded bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
            {creative.components.cta}
          </span>
        </div>

        {/* Engagement row */}
        <div className="flex items-center gap-4 border-t border-border px-3 py-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
            {likeCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
            {commentCount}
          </span>
          <span className="flex items-center gap-1">
            <Share2 className="h-3.5 w-3.5" aria-hidden />
            {shareCount}
          </span>
        </div>
      </div>
    </div>
  );
}
