/**
 * CreativePicker — selectable grid of real CreativeAssets (from
 * creativesForType(adType)). Clicking a tile toggles the asset into
 * plan.creatives as a CreativeSpec { id, name, type, source, assetId }.
 * Each tile shows a thumbnail when present, else a lucide type-icon tile,
 * plus a type chip and (for video) a duration badge. Selected tiles get the
 * lime selection treatment and a check.
 *
 * Owned by the Step-4 agent (Creative* prefix to avoid clashes).
 */
import { Check, Film, Images, Image as ImageIcon, LayoutGrid } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdType, CreativeAsset } from "../../types";

const TYPE_ICON: Record<AdType, LucideIcon> = {
  "single-image": ImageIcon,
  carousel: Images,
  video: Film,
  dpa: LayoutGrid,
};

const TYPE_LABEL: Record<AdType, string> = {
  "single-image": "Image",
  carousel: "Carousel",
  video: "Video",
  dpa: "DPA",
};

function fmtDuration(sec?: number): string | null {
  if (!sec || sec <= 0) return null;
  return `${sec}s`;
}

export function CreativePicker({
  assets,
  selectedIds,
  onToggle,
}: {
  assets: CreativeAsset[];
  selectedIds: Set<string>;
  onToggle: (asset: CreativeAsset) => void;
}) {
  if (assets.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
        No matching creatives for this ad type. Switch the ad type or upload one.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {assets.map((asset) => {
        const Icon = TYPE_ICON[asset.type];
        const selected = selectedIds.has(asset.id);
        const duration = fmtDuration(asset.durationSec);
        return (
          <button
            key={asset.id}
            type="button"
            onClick={() => onToggle(asset)}
            aria-pressed={selected}
            className={cn(
              "group relative flex flex-col overflow-hidden rounded-xl border bg-card text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "hover:border-foreground/20",
              selected ? "border-primary ring-1 ring-primary" : "border-border",
            )}
          >
            {/* thumb / icon tile */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
              {asset.thumbnail ? (
                <img
                  src={asset.thumbnail}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Icon className="h-6 w-6 text-muted-foreground/70" />
                </div>
              )}
              {duration && (
                <span className="absolute bottom-1 right-1 rounded-md bg-foreground/80 px-1.5 py-0.5 font-mono text-[10px] tabular-nums leading-none text-background">
                  {duration}
                </span>
              )}
              {selected && (
                <span className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </div>
            {/* meta */}
            <div className="flex flex-col gap-1 p-2">
              <span className="truncate text-xs font-medium text-foreground" title={asset.name}>
                {asset.name}
              </span>
              <span className="inline-flex w-fit items-center gap-1 rounded-full border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold leading-none text-muted-foreground">
                <Icon className="h-3 w-3" />
                {TYPE_LABEL[asset.type]}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
