/** Ad card media: thumbnail with a placeholder when missing or broken, plus a video / carousel indicator. */
import { useState } from "react";
import { Image as ImageIcon, Layers, Play, Video } from "lucide-react";
import type { Ad } from "@/lib/insights-v3/types";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<Ad["mediaKind"], string> = { image: "Image", video: "Video", carousel: "Carousel" };

export function AdCardMedia({ ad, className, compact }: { ad: Ad; className?: string; compact?: boolean }) {
  const [broken, setBroken] = useState(false);
  const showImg = !!ad.thumbnailUrl && !broken;
  const Placeholder = ad.mediaKind === "video" ? Video : ad.mediaKind === "carousel" ? Layers : ImageIcon;

  return (
    <div
      data-testid="ad-media"
      className={cn("relative w-full overflow-hidden bg-muted", !compact && "max-h-[460px]", className)}
      style={compact ? undefined : { aspectRatio: ad.aspectRatio || "1/1" }}
    >
      {showImg ? (
        <img
          src={ad.thumbnailUrl ?? undefined}
          alt=""
          loading="lazy"
          onError={() => setBroken(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          role="img"
          aria-label={`No preview available for this ${KIND_LABEL[ad.mediaKind].toLowerCase()} ad`}
          className="flex h-full min-h-[64px] w-full flex-col items-center justify-center gap-1 bg-primary/5 text-muted-foreground"
        >
          <Placeholder className="h-6 w-6 text-primary-text" aria-hidden="true" />
          {!compact && <span className="text-[11px]">No preview</span>}
        </div>
      )}
      {ad.mediaKind !== "image" && !compact && (
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
