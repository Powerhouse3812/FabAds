/**
 * LibraryModal — body-only component for the Library creative source sheet.
 *
 * Three tabs: Media | Text | Ads.
 * Multi-select via selectedIds Set + onToggle(CreativeRef) callback.
 * Header/footer live in the Sheet wrapper — this is content only.
 * No format filtering — all items visible; only search text filters.
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LIBRARY_MEDIA,
  LIBRARY_HEADLINES,
  LIBRARY_PRIMARY_TEXTS,
  LIBRARY_DESCRIPTIONS,
  LIBRARY_ADGROUPS,
  type LibraryAsset,
  type LibraryTextItem,
  type LibraryAdgroup,
} from "@/mocks/shared/library-items";
import type { CreativeRef } from "../../../../types";
import { cn } from "@/lib/utils";
import { Check, Image, Video, User } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Conversion helpers (exported for parent use when building CreativeRef[])
// ─────────────────────────────────────────────────────────────────────────────

export function assetToCreativeRef(asset: LibraryAsset): CreativeRef {
  return {
    id: asset.id,
    name: asset.file_name,
    format: asset.file_type === "video" ? "single_video" : "single_image",
    source: "library",
    thumbnail: asset.thumbnail_url ?? asset.url,
    itemType: "media",
  };
}

export function textItemToCreativeRef(item: LibraryTextItem, textType: string): CreativeRef {
  return {
    id: item.id,
    name: item.text.slice(0, 40),
    format: "single_image",
    source: "library",
    itemType: "text",
    text: item.text,
  };
}

export function adgroupToCreativeRef(adgroup: LibraryAdgroup): CreativeRef {
  return {
    id: adgroup.id,
    name: adgroup.name ?? adgroup.id,
    format: "single_image",
    source: "library",
    thumbnail: adgroup.page_avatar_url ?? undefined,
    savedAd: true,
    itemType: "ad",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface LibraryModalProps {
  selectedIds: Set<string>;
  onToggle: (ref: CreativeRef) => void;
  search: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared checkbox indicator
// ─────────────────────────────────────────────────────────────────────────────

function SelectCheckbox({ checked }: { checked: boolean }) {
  return (
    <div
      className={cn(
        "size-5 rounded-full border-2 flex items-center justify-center transition-all duration-150",
        checked
          ? "bg-primary border-primary"
          : "border-border/60 bg-background opacity-0 group-hover:opacity-100",
      )}
    >
      {checked && <Check className="size-3 text-[#121212]" strokeWidth={3} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Zero-data empty state
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2">
      <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-wide">
        No {label} matched
      </p>
      <p className="font-mono text-[11px] text-muted-foreground/60">
        Try a different search term
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Media format filter type
// ─────────────────────────────────────────────────────────────────────────────

type MediaFormatFilter = "all" | "image" | "video";

// ─────────────────────────────────────────────────────────────────────────────
// Media tab
// ─────────────────────────────────────────────────────────────────────────────

function MediaTab({
  selectedIds,
  onToggle,
  search,
}: {
  selectedIds: Set<string>;
  onToggle: (ref: CreativeRef) => void;
  search: string;
}) {
  const [formatFilter, setFormatFilter] = useState<MediaFormatFilter>("all");

  const filtered = LIBRARY_MEDIA.filter((a) => {
    if (search && !a.file_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (formatFilter === "image" && a.file_type !== "image") return false;
    if (formatFilter === "video" && a.file_type !== "video") return false;
    return true;
  });

  const formatChips = (
    <div className="flex flex-wrap items-center gap-2 pb-3 mb-1">
      {(["all", "image", "video"] as const).map((fmt) => (
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
          {fmt === "all" ? "All" : fmt === "image" ? "Image" : "Video"}
        </button>
      ))}
    </div>
  );

  if (filtered.length === 0) {
    return (
      <div>
        {formatChips}
        <EmptyState label="media" />
      </div>
    );
  }

  return (
    <div>
      {formatChips}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {filtered.map((asset) => {
        const checked = selectedIds.has(asset.id);
        const isVideo = asset.file_type === "video";
        return (
          <div
            key={asset.id}
            role="button"
            tabIndex={0}
            onClick={() => onToggle(assetToCreativeRef(asset))}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && onToggle(assetToCreativeRef(asset))
            }
            className={cn(
              "relative rounded-2xl border bg-card overflow-hidden cursor-pointer group transition-all duration-[220ms]",
              "hover:-translate-y-[2px] hover:shadow-md",
              checked
                ? "border-primary ring-2 ring-primary bg-primary/5"
                : "border-border hover:border-border/80 hover:shadow-sm",
            )}
          >
            {/* Thumbnail */}
            <div className="aspect-video bg-muted overflow-hidden">
              <img
                src={asset.thumbnail_url ?? asset.url}
                alt={asset.file_name}
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>

            {/* Info */}
            <div className="p-2 space-y-1">
              <p
                className="text-[11px] font-mono text-foreground truncate"
                title={asset.file_name}
              >
                {asset.file_name}
              </p>
              <div className="flex items-center gap-1">
                {isVideo ? (
                  <Video className="size-3 text-muted-foreground" />
                ) : (
                  <Image className="size-3 text-muted-foreground" />
                )}
                <span className="text-[10px] font-mono uppercase tracking-[0.06em] font-semibold text-muted-foreground">
                  {isVideo ? "Video" : "Image"}
                </span>
              </div>
            </div>

            {/* Checkbox top-right */}
            <div className="absolute top-2 right-2">
              <SelectCheckbox checked={checked} />
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Text tab — combines headlines, primary texts, descriptions
// ─────────────────────────────────────────────────────────────────────────────

type TextEntry = { item: LibraryTextItem; textType: string; typeLabel: string };

function TextTab({
  selectedIds,
  onToggle,
  search,
}: {
  selectedIds: Set<string>;
  onToggle: (ref: CreativeRef) => void;
  search: string;
}) {
  const entries: TextEntry[] = [
    ...LIBRARY_HEADLINES.map((item) => ({ item, textType: "headline", typeLabel: "Headline" })),
    ...LIBRARY_PRIMARY_TEXTS.map((item) => ({
      item,
      textType: "primary_text",
      typeLabel: "Body",
    })),
    ...LIBRARY_DESCRIPTIONS.map((item) => ({
      item,
      textType: "description",
      typeLabel: "Desc",
    })),
  ];

  const filtered = entries.filter((e) =>
    search ? e.item.text.toLowerCase().includes(search.toLowerCase()) : true,
  );

  if (filtered.length === 0) {
    return <EmptyState label="text" />;
  }

  return (
    <div className="space-y-1.5">
      {filtered.map(({ item, textType, typeLabel }) => {
        const checked = selectedIds.has(item.id);
        const ref = textItemToCreativeRef(item, textType);
        return (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            onClick={() => onToggle(ref)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onToggle(ref)}
            className={cn(
              "flex items-start gap-2.5 rounded-xl border bg-card px-3 py-2.5 cursor-pointer group transition-all duration-150",
              checked
                ? "border-primary bg-primary/5"
                : "border-border hover:border-border/80 hover:bg-muted/30",
            )}
          >
            {/* Type chip */}
            <span className="mt-0.5 flex-shrink-0 rounded-full bg-[#F0F0EC] dark:bg-[#1B1B1F] px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              {typeLabel}
            </span>

            {/* Text content */}
            <p className="text-sm text-foreground line-clamp-2 flex-1 leading-relaxed">
              {item.text}
            </p>

            {/* Checkbox right */}
            <div className="flex-shrink-0 mt-0.5">
              <SelectCheckbox checked={checked} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ads tab — IndustryInsights card design, renamed from "Adgroups"
// ─────────────────────────────────────────────────────────────────────────────

function AdsTab({
  selectedIds,
  onToggle,
  search,
}: {
  selectedIds: Set<string>;
  onToggle: (ref: CreativeRef) => void;
  search: string;
}) {
  const filtered = LIBRARY_ADGROUPS.filter((ag) =>
    search
      ? ag.name.toLowerCase().includes(search.toLowerCase()) ||
        ag.page_name.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  if (filtered.length === 0) {
    return <EmptyState label="ads" />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {filtered.map((ag) => {
        const checked = selectedIds.has(ag.id);
        const ref = adgroupToCreativeRef(ag);
        return (
          <div
            key={ag.id}
            role="button"
            tabIndex={0}
            onClick={() => onToggle(ref)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onToggle(ref)}
            className={cn(
              "relative rounded-2xl border bg-card p-4 cursor-pointer group transition-all duration-[220ms]",
              "hover:-translate-y-[2px] hover:shadow-md",
              checked
                ? "border-primary ring-2 ring-primary bg-primary/5"
                : "border-border hover:border-border/80 hover:shadow-sm",
            )}
          >
            {/* Checkbox top-right */}
            <div className="absolute top-3 right-3">
              <SelectCheckbox checked={checked} />
            </div>

            {/* Card body — IndustryInsights style */}
            <div className="flex items-start gap-3 pr-7">
              {/* Page avatar — 48px round */}
              {ag.page_avatar_url ? (
                <img
                  src={ag.page_avatar_url}
                  alt={ag.page_name}
                  className="size-12 rounded-full object-cover flex-shrink-0 ring-1 ring-border/40"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="size-12 rounded-full bg-[#F0F0EC] dark:bg-[#1B1B1F] flex items-center justify-center flex-shrink-0 ring-1 ring-border/40">
                  <User className="size-5 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 min-w-0 space-y-1.5">
                {/* Ad name */}
                <p
                  className="text-[13px] font-medium text-foreground leading-snug truncate"
                  title={ag.name}
                >
                  {ag.name}
                </p>

                {/* Page name chip */}
                <span className="inline-block rounded-full bg-[#F0F0EC] dark:bg-[#1B1B1F] px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  {ag.page_name}
                </span>

                {/* Ad type · CTA */}
                <p className="text-[11px] font-mono text-muted-foreground truncate">
                  {ag.ad_type} · {ag.cta}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LibraryModal — root
// ─────────────────────────────────────────────────────────────────────────────

export function LibraryModal({ selectedIds, onToggle, search }: LibraryModalProps) {
  return (
    <Tabs defaultValue="media" className="flex flex-col h-full overflow-hidden">
      {/* Tab list — sticky at top, never scrolls */}
      <div className="flex-shrink-0 px-4 pt-3 pb-0 border-b border-border/60">
        <TabsList className="h-auto bg-transparent p-0 gap-0 w-full justify-start">
          {(
            [
              { value: "media", label: "Media" },
              { value: "text", label: "Text" },
              { value: "ads", label: "Ads" },
            ] as const
          ).map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className={cn(
                "rounded-none border-b-2 border-transparent px-4 py-2 text-xs font-mono",
                "text-muted-foreground transition-colors",
                "data-[state=active]:border-primary data-[state=active]:bg-transparent",
                "data-[state=active]:shadow-none data-[state=active]:font-semibold",
                "data-[state=active]:text-foreground",
              )}
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* Tab contents — each scrolls independently */}
      <TabsContent value="media" className="flex-1 overflow-y-auto p-4 mt-0">
        <MediaTab selectedIds={selectedIds} onToggle={onToggle} search={search} />
      </TabsContent>

      <TabsContent value="text" className="flex-1 overflow-y-auto p-4 mt-0">
        <TextTab selectedIds={selectedIds} onToggle={onToggle} search={search} />
      </TabsContent>

      <TabsContent value="ads" className="flex-1 overflow-y-auto p-4 mt-0">
        <AdsTab selectedIds={selectedIds} onToggle={onToggle} search={search} />
      </TabsContent>
    </Tabs>
  );
}
