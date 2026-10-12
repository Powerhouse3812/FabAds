/** Ad card media: thumbnail with a placeholder when missing or broken, plus a video / carousel indicator. */
import { useState } from "react";
import { Image as ImageIcon, Layers, Play, Video } from "lucide-react";
import type { Ad } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<Ad["mediaKind"], string> = { image: "Image", video: "Video", carousel: "Carousel" };

export function AdCardMedia({
  ad,
  className,
  compact,
  hideKindChip,
  onBroken,
}: {
  ad: Ad;
  className?: string;
  compact?: boolean;
  /** My Feeds card draws its own kind chip alongside "N Similar ads". */
  hideKindChip?: boolean;
  /** Called once when the thumbnail fails to load, so a caller drawing overlays can switch to the no-creative layout. */
  onBroken?: () => void;
}) {
  const [broken, setBroken] = useState(false);
  const showImg = !!ad.thumbnailUrl && !broken;
  const Placeholder = ad.mediaKind === "video" ? Video : ad.mediaKind === "carousel" ? Layers : ImageIcon;

  return (
    <div
      data-testid="ad-media"
      className={cn("relative w-full overflow-hidden bg-muted", !compact && "max-h-[460px]", className)}
      // No creative → a fixed, shorter copy-first tile instead of a tall empty box in the ad's aspect ratio.
      style={compact ? undefined : { aspectRatio: showImg ? ad.aspectRatio || "1/1" : "4/3" }}
    >
      {showImg ? (
        <img
          src={ad.thumbnailUrl ?? undefined}
          alt=""
          loading="lazy"
          onError={() => {
            setBroken(true);
            onBroken?.();
          }}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          role="img"
          aria-label={`No creative preview for this ${KIND_LABEL[ad.mediaKind].toLowerCase()} ad: ${ad.headline}`}
          className={cn(
            "flex h-full min-h-[64px] w-full flex-col bg-primary/10 text-foreground",
            compact ? "items-center justify-center" : "justify-between p-4",
          )}
        >
          {compact ? (
            <Placeholder className="h-5 w-5 text-primary-text" aria-hidden="true" />
          ) : (
            <>
              {/* Copy-first: the headline is the creative when there is no image. */}
              <p className="line-clamp-4 px-px -mx-px text-lg font-semibold leading-6 tracking-tight">{ad.headline}</p>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Placeholder className="h-3.5 w-3.5 text-primary-text" aria-hidden="true" />
                {KIND_LABEL[ad.mediaKind]} · no preview
              </span>
            </>
          )}
        </div>
      )}
      {ad.mediaKind !== "image" && !compact && !hideKindChip && (
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-medium text-foreground shadow-sm">
          {ad.mediaKind === "video" ? (
            <Play className="h-3 w-3 fill-current text-primary-text" aria-hidden="true" />
          ) : (
            <Layers className="h-3 w-3 text-primary-text" aria-hidden="true" />
          )}
          {KIND_LABEL[ad.mediaKind]}
        </span>
      )}
    </div>
  );
}
