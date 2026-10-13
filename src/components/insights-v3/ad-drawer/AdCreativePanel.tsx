/** Left column: the ad's creative (video or image) with its copy. Ported from the old drawer's AdCreativeColumn. */
import { ImageOff, Play } from "lucide-react";
import type { Ad } from "@/lib/insights-v3/types";
import { TruncatedText } from "@/components/insights-v3/shared";

const MEDIA_LABEL = { image: "Image ad", video: "Video ad", carousel: "Carousel ad" } as const;

export function AdCreativePanel({ ad, domain }: { ad: Ad; domain: string | null }) {
  return (
    <section aria-label="Creative" className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        {ad.pageAvatarUrl ? (
          <img src={ad.pageAvatarUrl} alt="" loading="lazy" className="h-9 w-9 shrink-0 rounded-full border border-border bg-muted object-cover" />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-semibold text-primary-text"
          >
            {ad.pageName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <TruncatedText text={ad.pageName} className="text-sm font-semibold text-foreground" />
          <p className="text-[11px] text-muted-foreground">{MEDIA_LABEL[ad.mediaKind]}</p>
        </div>
      </div>

      {ad.primaryText && <p className="whitespace-pre-line break-words text-[13px] leading-relaxed text-foreground">{ad.primaryText}</p>}

      <div
        className="relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-muted"
        style={{ aspectRatio: ad.aspectRatio || "1/1", maxHeight: "68vh" }}
      >
        {ad.videoUrl ? (
          <video
            key={ad.id}
            src={ad.videoUrl}
            poster={ad.thumbnailUrl ?? undefined}
            controls
            preload="none"
            className="h-full w-full object-contain"
            aria-label={`Video: ${ad.headline}`}
          />
        ) : ad.thumbnailUrl ? (
          <>
            <img src={ad.thumbnailUrl} alt={ad.headline} className="h-full w-full object-contain" />
            {ad.mediaKind === "video" && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background/70 backdrop-blur">
                  <Play className="h-5 w-5 text-foreground" aria-hidden="true" />
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ImageOff className="h-6 w-6" aria-hidden="true" />
            <span className="text-xs">No creative preview was captured</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        {domain && <TruncatedText text={domain} className="font-mono text-[11px] text-muted-foreground" />}
        <p className="line-clamp-3 break-words text-[13px] font-semibold text-foreground">{ad.headline}</p>
        {ad.ctaLabel && (
          <span className="inline-flex h-6 items-center rounded-md border border-border bg-background px-2 text-[11px] text-foreground">{ad.ctaLabel}</span>
        )}
      </div>
    </section>
  );
}
