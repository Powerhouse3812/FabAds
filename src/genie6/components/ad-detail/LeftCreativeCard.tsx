import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OutputData } from "../../types/output";

interface LeftCreativeCardProps {
  output: OutputData;
  className?: string;
}

/**
 * LeftCreativeCard — 350px column in the canonical Ad Detail drawer.
 *
 * Renders the actual creative content the user is inspecting:
 *  - Brand row (32px avatar circle + brand name)
 *  - Body text block (above the media)
 *  - Image / video thumbnail (350×500 area, bleeds to card edges)
 *  - Below-image footer stack (headline + muted body echo)
 *
 * Intentionally presentational — no internal state, no fetching. The wrapper
 * (AdDetailDrawer) owns layout + variants and passes a single OutputData.
 */
export function LeftCreativeCard({ output, className }: LeftCreativeCardProps) {
  const isVideo = output.mediaType === "video";
  const brandInitial = output.brand?.name?.slice(0, 1).toUpperCase() ?? "—";

  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shrink-0",
        "w-full lg:w-[350px]",
        className,
      )}
    >
      {/* Brand row */}
      <header className="flex items-center gap-2 px-3 pt-3 pb-1">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/30 to-primary flex items-center justify-center text-[13px] font-semibold text-foreground border border-border/40">
          {brandInitial}
        </div>
        <span className="text-[12px] font-semibold text-foreground truncate">
          {output.brand?.name ?? "Brand"}
        </span>
      </header>

      {/* Body text block */}
      <div className="px-3 pt-2 pb-3">
        <p className="text-[13px] leading-relaxed text-foreground/85 line-clamp-4">
          {output.body ?? "—"}
        </p>
      </div>

      {/* Image / Video */}
      <div className="relative w-full aspect-[7/10] bg-muted overflow-hidden">
        {output.thumbnail ? (
          <img
            src={output.thumbnail}
            alt={output.headline ?? "Ad creative"}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Preview unavailable
            </span>
          </div>
        )}
        {isVideo && output.thumbnail && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm">
              <Play className="h-6 w-6 fill-white text-white" />
            </span>
          </span>
        )}
      </div>

      {/* Below-image text block */}
      <div className="px-3 py-3 flex flex-col gap-1.5">
        {output.headline && (
          <p className="text-[13px] leading-snug text-foreground line-clamp-3">
            {output.headline}
          </p>
        )}
        {output.body && (
          <p className="text-[13px] leading-snug text-foreground/45 line-clamp-3">
            {output.body}
          </p>
        )}
      </div>
    </section>
  );
}
