import { Check, Sparkles } from "lucide-react";
import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { sampleOutputs } from "@/genie6/mocks/sample-outputs";
import type { OutputData } from "@/genie6/types/output";
import type { AdCopy, AdFormat, CreativeRef } from "../../../../types";

/* ─────────────────────────────────────────────────────────────────
   Conversion helpers (exported for SourceSheet use)
───────────────────────────────────────────────────────────────────*/

/**
 * Map an OutputData mediaType/format string to the closest AdFormat enum value.
 * "video"     → single_video
 * "text-only" → flexible   (copy-only; no media format maps cleanly — flexible is safest)
 * "image"     → single_image (default)
 * Also handles the human-readable `output.format` string from the generation context backfill.
 */
function deriveAdFormat(output: OutputData): AdFormat {
  // Prefer the human-readable format string if it was backfilled
  const fmt = output.format?.toLowerCase() ?? "";
  if (fmt === "video" || output.mediaType === "video") return "single_video";
  if (fmt === "carousel") return "carousel";
  if (fmt === "adcopy" || output.mediaType === "text-only") return "flexible";
  // Default: image
  return "single_image";
}

export function outputToCreativeRef(output: OutputData): CreativeRef {
  return {
    id: output.id,
    name: output.headline?.trim() || `Genie output`,
    format: deriveAdFormat(output),
    source: "genie",
    thumbnail: output.thumbnail ?? undefined,
    savedAd: true,
    itemType: "ad",
  };
}

export function outputToAdCopy(output: OutputData): Partial<AdCopy> {
  return {
    headline: output.headline ?? "",
    primaryText: output.body ?? "",
    cta: output.cta ?? "LEARN_MORE",
  };
}

/* ─────────────────────────────────────────────────────────────────
   Format chip label helper
───────────────────────────────────────────────────────────────────*/

const FORMAT_CHIP_LABEL: Record<string, string> = {
  single_video: "Video",
  single_image: "Image",
  carousel: "Carousel",
  flexible: "Adcopy",
  collection: "Collection",
  dpa: "DPA",
};

/* ─────────────────────────────────────────────────────────────────
   Props
───────────────────────────────────────────────────────────────────*/

interface GenieModalProps {
  /** Currently selected output IDs */
  selectedIds: Set<string>;
  /** Toggle one item on/off */
  onToggle: (id: string) => void;
  /** Optional: only show outputs matching this format */
  filterFormat?: AdFormat | null;
  /** Search string from Sheet header — case-insensitive match on headline or id */
  search: string;
}

/* ─────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────────*/

export function GenieModal({
  selectedIds,
  onToggle,
  filterFormat,
  search,
}: GenieModalProps) {
  const outputs = useMemo<OutputData[]>(() => {
    const trimmed = search.trim().toLowerCase();

    return sampleOutputs.filter((out) => {
      // Skip the zero-data edge-case row (empty headline + empty brand)
      if (!out.headline && !out.brand?.name) return false;

      // Format filter
      if (filterFormat) {
        const derived = deriveAdFormat(out);
        if (derived !== filterFormat) return false;
      }

      // Search filter — headline or id
      if (trimmed) {
        const inHeadline = (out.headline ?? "").toLowerCase().includes(trimmed);
        const inId = out.id.toLowerCase().includes(trimmed);
        if (!inHeadline && !inId) return false;
      }

      return true;
    });
  }, [search, filterFormat]);

  /* ── Empty state ─────────────────────────────────────────────── */
  if (outputs.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <p className="text-sm text-muted-foreground font-mono">
          No Genie outputs match your filters.
        </p>
      </div>
    );
  }

  /* ── Grid ────────────────────────────────────────────────────── */
  return (
    <div className="h-full overflow-y-auto">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
        {outputs.map((out) => {
          const selected = selectedIds.has(out.id);
          const adFormat = deriveAdFormat(out);
          const chipLabel = FORMAT_CHIP_LABEL[adFormat] ?? adFormat;
          const displayName = out.headline?.trim() || `Genie output`;

          return (
            <button
              key={out.id}
              type="button"
              onClick={() => onToggle(out.id)}
              className={cn(
                "relative rounded-2xl border bg-card overflow-hidden cursor-pointer group transition-colors text-left w-full",
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-foreground/30"
              )}
            >
              {/* Thumbnail area */}
              <div className="relative aspect-video bg-muted">
                {out.thumbnail ? (
                  <img
                    src={out.thumbnail}
                    alt={displayName}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}

                {/* Checkbox — top-right corner */}
                <div
                  className={cn(
                    "absolute top-2 right-2 h-4 w-4 rounded border-2 flex items-center justify-center transition-opacity",
                    selected
                      ? "bg-primary border-primary text-black opacity-100"
                      : "bg-background/80 border-border opacity-0 group-hover:opacity-100"
                  )}
                >
                  {selected && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                </div>
              </div>

              {/* Info area */}
              <div className="p-2">
                {/* Format chip */}
                <span className="inline-block rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground uppercase tracking-wide leading-none">
                  {chipLabel}
                </span>
                {/* Name / headline */}
                <p className="text-xs font-medium text-foreground truncate mt-1 leading-tight">
                  {displayName}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
