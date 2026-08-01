/**
 * CreativeThumb — deterministic thumbnail for a Creative.
 *
 * Uses picsum.photos seeded by `creative.thumbKey` so the same creative
 * always renders the same image across reloads. Falls back to a calm
 * `bg-muted` box with a format icon if the image fails to load (offline,
 * blocked, slow network). A small format-badge chip always overlays the
 * bottom-right corner so format is recognisable even before/without the
 * image (Recognition over recall).
 */
import { useState } from "react";
import { Video, Image as ImageIcon, LayoutGrid, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Creative } from "@/data/model";

const FORMAT_ICON: Record<Creative["format"], LucideIcon> = {
  video: Video,
  static: ImageIcon,
  carousel: LayoutGrid,
};

export function CreativeThumb({ creative, size = 40 }: { creative: Creative; size?: number }) {
  const [errored, setErrored] = useState(false);
  const Icon = FORMAT_ICON[creative.format];
  const dim = Math.max(size * 2, 80); // request 2x for retina, floor at 80

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-md bg-muted"
      style={{ width: size, height: size }}
    >
      {!errored && (
        <img
          src={`https://picsum.photos/seed/${creative.thumbKey}/${dim}/${dim}`}
          alt=""
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            setErrored(true);
          }}
          className="h-full w-full rounded-md object-cover"
          width={size}
          height={size}
        />
      )}
      {errored && (
        <div className="flex h-full w-full items-center justify-center rounded-md bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
        </div>
      )}
      <span
        className="absolute bottom-0 right-0 flex items-center justify-center rounded-tl-md rounded-br-md bg-background/80 p-[3px] backdrop-blur"
        aria-hidden
      >
        <Icon className="h-2.5 w-2.5 text-foreground" />
      </span>
    </div>
  );
}
