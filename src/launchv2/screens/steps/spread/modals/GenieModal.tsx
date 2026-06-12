import { Check, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

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
  const fmt = output.format?.toLowerCase() ?? "";
  if (fmt === "video" || output.mediaType === "video") return "single_video";
  if (fmt === "carousel") return "carousel";
  if (fmt === "adcopy" || output.mediaType === "text-only") return "flexible";
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
   Format filter type
───────────────────────────────────────────────────────────────────*/

type GenieFormatFilter = "all" | "single_image" | "single_video" | "carousel";

const FORMAT_FILTER_LABELS: Record<GenieFormatFilter, string> = {
  all: "All",
  single_image: "Image",
  single_video: "Video",
  carousel: "Carousel",
};

/* ─────────────────────────────────────────────────────────────────
   Props
───────────────────────────────────────────────────────────────────*/

interface GenieModalProps {
  /** Currently selected output IDs */
  selectedIds: Set<string>;
  /** Toggle one item on/off — receives the full CreativeRef */
  onToggle: (ref: CreativeRef) => void;
  /** Search string from Sheet header — case-insensitive match on headline, brand name, or id */
  search: string;
}

/* ─────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────────*/

export function GenieModal({ selectedIds, onToggle, search }: GenieModalProps) {
  const [formatFilter, setFormatFilter] = useState<GenieFormatFilter>("all");

  const outputs = useMemo<OutputData[]>(() => {
    const trimmed = search.trim().toLowerCase();

    return sampleOutputs.filter((out) => {
      // Text search
      if (trimmed) {
        const inHeadline = (out.headline ?? "").toLowerCase().includes(trimmed);
        const inBrand = (out.brand?.name ?? "").toLowerCase().includes(trimmed);
        const inId = out.id.toLowerCase().includes(trimmed);
        if (!inHeadline && !inBrand && !inId) return false;
      }

      // Format filter
      if (formatFilter !== "all") {
        const adFormat = deriveAdFormat(out);
        if (adFormat !== formatFilter) return false;
      }

      return true;
    });
  }, [search, formatFilter]);

  /* ── Format filter toolbar ──────────────────────────────────── */
  const toolbar = (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 pb-3 pt-3 flex-shrink-0">
      {(["all", "single_image", "single_video", "carousel"] as const).map((fmt) => (
        <button
          key={fmt}
          type="button"
          onClick={() => setFormatFilter(fmt)}
          className={cn(
            "h-7 rounded-full border px-2.5 text-xs font-medium transition-colors",
            formatFilter === fmt
              ? "border-primary/30 bg-primary/10 text-foreground"
              : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
          )}
        >
          {FORMAT_FILTER_LABELS[fmt]}
        </button>
      ))}
    </div>
  );

  /* ── Empty state ─────────────────────────────────────────────── */
  if (outputs.length === 0) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {toolbar}
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-sm text-muted-foreground font-mono">
            No Genie outputs match your search.
          </p>
        </div>
      </div>
    );
  }

  /* ── Grid ────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {toolbar}
      <div className="flex-1 overflow-y-auto">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
        {outputs.map((out) => {
          const selected = selectedIds.has(out.id);
          const adFormat = deriveAdFormat(out);
          const chipLabel = FORMAT_CHIP_LABEL[adFormat] ?? adFormat;
          const brandName = out.brand?.name?.trim() ?? "";
          const headline = out.headline?.trim() ?? "";
          const hasThumbnail = Boolean(out.thumbnail);

          function handleClick() {
            if (selected) {
              // Re-build the ref so caller can deselect by id
              onToggle(outputToCreativeRef(out));
            } else {
              onToggle(outputToCreativeRef(out));
            }
          }

          return (
            <button
              key={out.id}
              type="button"
              onClick={handleClick}
              className={cn(
                "relative rounded-2xl border bg-card overflow-hidden cursor-pointer group transition-all text-left w-full",
                selected
                  ? "border-primary ring-2 ring-primary bg-primary/5"
                  : "border-border hover:border-foreground/30"
              )}
            >
              {/* Thumbnail — aspect-[4/5] like a portrait ad preview */}
              <div className="relative aspect-[4/5] overflow-hidden">
                {hasThumbnail ? (
                  <img
                    src={out.thumbnail}
                    alt={headline || brandName || "Genie output"}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className={cn(
                      "h-full w-full flex flex-col items-center justify-center gap-2",
                      "bg-gradient-to-br from-primary/20 to-primary/5"
                    )}
                  >
                    {brandName ? (
                      <span className="text-xs font-semibold text-primary/70 text-center px-2 leading-snug">
                        {brandName}
                      </span>
                    ) : (
                      <Sparkles className="h-6 w-6 text-primary/50" />
                    )}
                  </div>
                )}

                {/* Format chip — top-right overlay */}
                <span className="absolute top-2 right-2 rounded-full bg-black/50 backdrop-blur-sm px-2 py-0.5 text-[10px] font-mono text-white uppercase tracking-wide leading-none">
                  {chipLabel}
                </span>

                {/* Selected checkmark badge — top-left */}
                {selected && (
                  <div className="absolute top-2 left-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* Info area */}
              <div className="p-2.5 space-y-0.5">
                {brandName && (
                  <p className="text-xs font-medium text-foreground truncate leading-tight">
                    {brandName}
                  </p>
                )}
                {headline && (
                  <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                    {headline}
                  </p>
                )}
                {!brandName && !headline && (
                  <p className="text-[11px] text-muted-foreground italic">
                    Genie output
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
      </div>
    </div>
  );
}
