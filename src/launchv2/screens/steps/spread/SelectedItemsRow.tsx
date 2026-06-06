/**
 * SelectedItemsRow — compact collapsed display of selected creatives in Step 3.
 *
 * Splits the flat creatives[] array into three buckets (media / text / ads)
 * and renders each as a dense inline row with thumbnail previews, text chips,
 * and mini ad cards. Overflow beyond the visible cap is shown as "+N more".
 *
 * Parent is responsible for deciding when to mount this — if creatives is
 * empty, this component returns null so the parent doesn't need to guard.
 */

import { Image as ImageIcon, Video, AlignLeft, Layers, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CreativeRef, AdFormat } from "../../../types";

/* ─────────────────────────── helpers ─────────────────────────────────────── */

function CountBadge({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-mono tabular-nums text-muted-foreground">
      {count}
    </span>
  );
}

function MoreChip({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-mono tabular-nums text-muted-foreground whitespace-nowrap select-none">
      +{count} more
    </span>
  );
}

/** Resolves which icon to show for a media creative with no thumbnail. */
function MediaPlaceholderIcon({ format }: { format: AdFormat }) {
  const isVideo =
    format === "single_video" ||
    format === "carousel" ||
    format === "collection";
  return isVideo ? (
    <Video className="h-4 w-4 text-muted-foreground" />
  ) : (
    <ImageIcon className="h-4 w-4 text-muted-foreground" />
  );
}

/* ─────────────────────────── bucket renderers ─────────────────────────────── */

const MEDIA_CAP = 4;
const TEXT_CAP = 3;
const ADS_CAP = 3;

interface MediaBucketProps {
  items: CreativeRef[];
  onRemove: (id: string) => void;
}

function MediaBucket({ items, onRemove }: MediaBucketProps) {
  const visible = items.slice(0, MEDIA_CAP);
  const remaining = items.length - visible.length;

  return (
    <div className="flex flex-col gap-1.5">
      {/* bucket header */}
      <div className="flex items-center gap-1.5">
        <ImageIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <span className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
          Media
        </span>
        <CountBadge count={items.length} />
      </div>

      {/* thumbnails row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {visible.map((c) => (
          <div
            key={c.id}
            className="h-12 w-12 rounded-lg overflow-hidden bg-muted relative group flex-shrink-0"
          >
            {c.thumbnail ? (
              <img
                src={c.thumbnail}
                alt={c.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <MediaPlaceholderIcon format={c.format} />
              </div>
            )}
            {/* remove button — appears on hover */}
            <button
              type="button"
              onClick={() => onRemove(c.id)}
              aria-label={`Remove ${c.name}`}
              className={cn(
                "absolute top-0 right-0 h-4 w-4 rounded-full",
                "bg-background/80 flex items-center justify-center",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
                "hover:bg-background focus-visible:opacity-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8FB821]"
              )}
            >
              <X className="h-2.5 w-2.5 text-foreground" />
            </button>
          </div>
        ))}

        {remaining > 0 && <MoreChip count={remaining} />}
      </div>
    </div>
  );
}

interface TextBucketProps {
  items: CreativeRef[];
  onRemove: (id: string) => void;
}

function TextBucket({ items, onRemove }: TextBucketProps) {
  const visible = items.slice(0, TEXT_CAP);
  const remaining = items.length - visible.length;

  return (
    <div className="flex flex-col gap-1.5">
      {/* bucket header */}
      <div className="flex items-center gap-1.5">
        <AlignLeft className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <span className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
          Text
        </span>
        <CountBadge count={items.length} />
      </div>

      {/* chips row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {visible.map((c) => {
          const label =
            c.text != null && c.text.length > 0
              ? c.text.slice(0, 28)
              : c.name.slice(0, 28);
          const truncated =
            (c.text ?? c.name).length > 28;

          return (
            <span
              key={c.id}
              className={cn(
                "inline-flex items-center gap-1",
                "rounded-full border bg-muted/60",
                "pl-2.5 pr-1 py-1",
                "text-[11px] font-mono text-foreground",
                "max-w-[200px]"
              )}
            >
              <span className="truncate">
                {label}
                {truncated && "…"}
              </span>
              <button
                type="button"
                onClick={() => onRemove(c.id)}
                aria-label={`Remove ${c.name}`}
                className={cn(
                  "h-3.5 w-3.5 rounded-full flex-shrink-0",
                  "flex items-center justify-center",
                  "hover:bg-foreground/10 transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#8FB821]"
                )}
              >
                <X className="h-2 w-2 text-muted-foreground" />
              </button>
            </span>
          );
        })}

        {remaining > 0 && <MoreChip count={remaining} />}
      </div>
    </div>
  );
}

interface AdsBucketProps {
  items: CreativeRef[];
  onRemove: (id: string) => void;
}

function AdsBucket({ items, onRemove }: AdsBucketProps) {
  const visible = items.slice(0, ADS_CAP);
  const remaining = items.length - visible.length;

  return (
    <div className="flex flex-col gap-1.5">
      {/* bucket header */}
      <div className="flex items-center gap-1.5">
        <Layers className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <span className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground">
          Whole ads
        </span>
        <CountBadge count={items.length} />
      </div>

      {/* mini ad cards row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {visible.map((c) => (
          <div
            key={c.id}
            className={cn(
              "flex items-center gap-2",
              "rounded-xl border bg-muted/40",
              "px-2 py-1.5",
              "group relative",
              "max-w-[160px]"
            )}
          >
            {/* thumbnail */}
            <div className="h-8 w-8 rounded-md overflow-hidden bg-muted flex-shrink-0">
              {c.thumbnail ? (
                <img
                  src={c.thumbnail}
                  alt={c.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <MediaPlaceholderIcon format={c.format} />
                </div>
              )}
            </div>

            {/* name */}
            <span className="text-[11px] font-medium text-foreground truncate max-w-[80px]">
              {c.name}
            </span>

            {/* remove button — absolute, fades in on hover */}
            <button
              type="button"
              onClick={() => onRemove(c.id)}
              aria-label={`Remove ${c.name}`}
              className={cn(
                "absolute -top-1 -right-1",
                "h-4 w-4 rounded-full",
                "bg-background border border-border",
                "flex items-center justify-center",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
                "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8FB821]"
              )}
            >
              <X className="h-2.5 w-2.5 text-muted-foreground" />
            </button>
          </div>
        ))}

        {remaining > 0 && <MoreChip count={remaining} />}
      </div>
    </div>
  );
}

/* ─────────────────────────── main component ───────────────────────────────── */

export interface SelectedItemsRowProps {
  creatives: CreativeRef[];
  onRemove: (id: string) => void;
  /** Re-opens the source sheet so the user can change their selection. */
  onChangeSource: () => void;
}

export default function SelectedItemsRow({
  creatives,
  onRemove,
  onChangeSource,
}: SelectedItemsRowProps) {
  /* bucket split ----------------------------------------------------------- */
  const adItems = creatives.filter(
    (c) => c.itemType === "ad" || c.savedAd
  );
  const mediaItems = creatives.filter(
    (c) =>
      c.itemType === "media" ||
      (!c.itemType && !c.savedAd && c.itemType !== "text")
  );
  const textItems = creatives.filter((c) => c.itemType === "text");

  /* nothing selected — parent controls visibility but guard here too */
  if (adItems.length === 0 && mediaItems.length === 0 && textItems.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-3 space-y-3">
      {/* ── header ── */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-foreground leading-none">
          Creative selection
        </span>
        <button
          type="button"
          onClick={onChangeSource}
          className={cn(
            "text-[11px] font-mono text-[#5B7611] dark:text-[#C3E165]",
            "hover:underline underline-offset-2",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8FB821] rounded-sm"
          )}
        >
          Change →
        </button>
      </div>

      {/* ── buckets (only non-empty) ── */}
      {mediaItems.length > 0 && (
        <MediaBucket items={mediaItems} onRemove={onRemove} />
      )}
      {textItems.length > 0 && (
        <TextBucket items={textItems} onRemove={onRemove} />
      )}
      {adItems.length > 0 && (
        <AdsBucket items={adItems} onRemove={onRemove} />
      )}
    </div>
  );
}
