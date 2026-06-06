/**
 * LibraryModal — body-only component for the Library creative source sheet.
 *
 * Three tabs: Media | Text | Adgroups.
 * Multi-select via selectedIds Set + onToggle callback.
 * Header/footer live in the Sheet wrapper — this is content only.
 */

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
import type { AdFormat, CreativeRef } from "../../../../types";
import { cn } from "@/lib/utils";
import { Check, Image, Video, FileText } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Conversion helpers (exported for parent to use when building CreativeRef[])
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
  onToggle: (id: string) => void;
  search: string;
  format?: AdFormat | null;
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
// Media tab
// ─────────────────────────────────────────────────────────────────────────────

function MediaTab({
  selectedIds,
  onToggle,
  search,
}: {
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  search: string;
}) {
  const filtered = LIBRARY_MEDIA.filter((a) =>
    search ? a.file_name.toLowerCase().includes(search.toLowerCase()) : true,
  );

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm font-mono">
        No Media found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {filtered.map((asset) => {
        const checked = selectedIds.has(asset.id);
        const isVideo = asset.file_type === "video";
        return (
          <div
            key={asset.id}
            role="button"
            tabIndex={0}
            onClick={() => onToggle(asset.id)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onToggle(asset.id)}
            className={cn(
              "relative rounded-2xl border bg-card overflow-hidden cursor-pointer group transition-all duration-150 hover:-translate-y-px",
              checked
                ? "border-primary bg-primary/5 ring-1 ring-primary"
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
              <p className="text-xs font-mono text-foreground truncate" title={asset.file_name}>
                {asset.file_name}
              </p>
              <div className="flex items-center gap-1">
                {isVideo ? (
                  <Video className="size-3 text-muted-foreground" />
                ) : (
                  <Image className="size-3 text-muted-foreground" />
                )}
                <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
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
  onToggle: (id: string) => void;
  search: string;
}) {
  const entries: TextEntry[] = [
    ...LIBRARY_HEADLINES.map((item) => ({ item, textType: "headline", typeLabel: "Headline" })),
    ...LIBRARY_PRIMARY_TEXTS.map((item) => ({ item, textType: "primary_text", typeLabel: "Body" })),
    ...LIBRARY_DESCRIPTIONS.map((item) => ({ item, textType: "description", typeLabel: "Desc" })),
  ];

  const filtered = entries.filter((e) =>
    search ? e.item.text.toLowerCase().includes(search.toLowerCase()) : true,
  );

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm font-mono">
        No Text found.
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {filtered.map(({ item, textType, typeLabel }) => {
        const checked = selectedIds.has(item.id);
        return (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            onClick={() => onToggle(item.id)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onToggle(item.id)}
            className={cn(
              "flex items-start gap-2 rounded-xl border bg-card px-3 py-2 cursor-pointer group transition-all duration-150",
              checked
                ? "border-primary bg-primary/5"
                : "border-border hover:border-border/80 hover:bg-muted/30",
            )}
          >
            {/* Type chip */}
            <span className="mt-0.5 flex-shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wide text-muted-foreground">
              {typeLabel}
            </span>

            {/* Text content */}
            <p className="text-xs text-foreground line-clamp-2 flex-1 leading-relaxed">
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
// Adgroups tab
// ─────────────────────────────────────────────────────────────────────────────

function AdgroupsTab({
  selectedIds,
  onToggle,
  search,
}: {
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  search: string;
}) {
  const filtered = LIBRARY_ADGROUPS.filter((ag) =>
    search
      ? ag.name.toLowerCase().includes(search.toLowerCase()) ||
        ag.page_name.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm font-mono">
        No Adgroups found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {filtered.map((ag) => {
        const checked = selectedIds.has(ag.id);
        return (
          <div
            key={ag.id}
            role="button"
            tabIndex={0}
            onClick={() => onToggle(ag.id)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onToggle(ag.id)}
            className={cn(
              "relative rounded-2xl border bg-card p-3 cursor-pointer group transition-all duration-150 hover:-translate-y-px",
              checked
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:border-border/80 hover:shadow-sm",
            )}
          >
            <div className="flex items-start gap-2.5 pr-7">
              {/* Page avatar */}
              {ag.page_avatar_url ? (
                <img
                  src={ag.page_avatar_url}
                  alt={ag.page_name}
                  className="size-8 rounded-full object-cover flex-shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="size-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <FileText className="size-4 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 min-w-0 space-y-1">
                {/* Adgroup name */}
                <p className="text-xs font-semibold text-foreground leading-snug truncate" title={ag.name}>
                  {ag.name}
                </p>
                {/* Brand / page chip */}
                <span className="inline-block rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wide text-muted-foreground">
                  {ag.page_name}
                </span>
                {/* Ad type + CTA */}
                <p className="text-[11px] font-mono text-muted-foreground truncate">
                  {ag.ad_type} · {ag.cta}
                </p>
              </div>
            </div>

            {/* Checkbox top-right */}
            <div className="absolute top-3 right-3">
              <SelectCheckbox checked={checked} />
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

export function LibraryModal({ selectedIds, onToggle, search, format }: LibraryModalProps) {
  return (
    <Tabs defaultValue="media" className="flex flex-col h-full overflow-hidden">
      {/* Tab list — sticky at top, never scrolls */}
      <div className="flex-shrink-0 px-4 pt-3 pb-0 border-b border-border/60">
        <TabsList className="h-auto bg-transparent p-0 gap-0 w-full justify-start">
          {(
            [
              { value: "media", label: "Media" },
              { value: "text", label: "Text" },
              { value: "adgroups", label: "Adgroups" },
            ] as const
          ).map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold px-4 py-2 text-xs text-muted-foreground data-[state=active]:text-foreground transition-colors"
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

      <TabsContent value="adgroups" className="flex-1 overflow-y-auto p-4 mt-0">
        <AdgroupsTab selectedIds={selectedIds} onToggle={onToggle} search={search} />
      </TabsContent>
    </Tabs>
  );
}
