import { useMemo, useRef, useState } from "react";
import { Search, Upload, X, FileText, Film, Music, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getBrand, products } from "@/genie6/mocks";
import type { AppField } from "../appTypes";
import type { PickerItem } from "../data/appPickerData";
import { PICKER_AUDIO, PICKER_DOCS, PICKER_IMAGES, PICKER_VIDEOS } from "../data/appPickerData";
import { formatDurationShort, type MediaPickerValue } from "../lib/fieldHelpers";

type MediaPickerFieldSpec = Extract<AppField, { kind: "media-picker" }>;

interface MediaPickerFieldProps {
  field: MediaPickerFieldSpec;
  value: MediaPickerValue | undefined;
  onChange: (value: MediaPickerValue | undefined) => void;
}

const SOURCE_LABEL: Record<string, string> = {
  upload: "Upload",
  library: "Library",
  catalogue: "Catalogue",
  avatars: "Avatars",
  voices: "Voices",
};

const MEDIA_ICON: Record<MediaPickerFieldSpec["media"], React.ElementType> = {
  video: Film,
  audio: Music,
  image: Film,
  document: FileText,
  product: Package,
};

function libraryPoolFor(media: MediaPickerFieldSpec["media"]): PickerItem[] {
  switch (media) {
    case "video":
      return PICKER_VIDEOS;
    case "audio":
      return PICKER_AUDIO;
    case "document":
      return PICKER_DOCS;
    case "image":
      return PICKER_IMAGES;
    default:
      // "product" draws from Catalogue, not the Library — see catalogueItems().
      return [];
  }
}

/** Catalogue tab — products, adapted to the same row grammar as a
 *  `PickerItem` (thumbnail · title · meta). Only used by `media: "product"`
 *  fields (Product Placement). Never a second upload box (§8 rule). */
function catalogueItems(): { id: string; title: string; meta: string; thumbnail?: string }[] {
  return products.map((p) => ({
    id: p.id,
    title: p.name,
    meta: `${p.price} · ${getBrand(p.brandId)?.name ?? p.brandId}`,
    thumbnail: p.thumbnail,
  }));
}

function SelectableRow({
  id,
  title,
  meta,
  thumbnail,
  durationSec,
  active,
  Icon,
  onClick,
}: {
  id: string;
  title: string;
  meta: string;
  thumbnail?: string;
  durationSec?: number;
  active: boolean;
  Icon: React.ElementType;
  onClick: () => void;
}) {
  return (
    <button
      key={id}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors",
        active ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-foreground/[0.05]",
      )}
    >
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
        {thumbnail ? (
          <img src={thumbnail} alt="" className="h-full w-full object-cover" />
        ) : (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13px] font-medium text-foreground">{title}</span>
        <span className="truncate font-mono text-[10.5px] text-muted-foreground">{meta}</span>
      </span>
      {durationSec ? (
        <span className="font-mono text-[10.5px] tabular-nums text-muted-foreground">
          {formatDurationShort(durationSec)}
        </span>
      ) : null}
    </button>
  );
}

/**
 * media-picker field renderer — §8 hard rule: a second input ALWAYS comes
 * from a picker (Library / Catalogue / avatar list), never a second upload
 * box. `sources` orders the tabs; "upload" is the only tab with a drop zone.
 */
export function MediaPickerField({ field, value, onChange }: MediaPickerFieldProps) {
  const [query, setQuery] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const Icon = MEDIA_ICON[field.media];

  const libraryItems = useMemo(() => libraryPoolFor(field.media), [field.media]);
  const catalogueList = useMemo(
    () => (field.media === "product" ? catalogueItems() : []),
    [field.media],
  );

  const filteredLibrary = libraryItems.filter((i) =>
    i.title.toLowerCase().includes(query.toLowerCase()),
  );
  const filteredCatalogue = catalogueList.filter((i) =>
    i.title.toLowerCase().includes(query.toLowerCase()),
  );

  const clear = () => onChange(undefined);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    onChange({ source: "upload", fileName: file.name });
  };

  const acceptCopy = field.accept?.join(", ") ?? "";

  return (
    <div className="flex flex-col gap-2">
      {value && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5">
          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-[12.5px] text-foreground">
            {value.item?.title ?? value.product?.name ?? value.fileName}
          </span>
          <span className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            {SOURCE_LABEL[value.source]}
          </span>
          <button
            type="button"
            aria-label="Clear selection"
            onClick={clear}
            className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <Tabs defaultValue={field.sources[0]}>
        <TabsList className="h-8 rounded-full bg-muted/60 p-0.5">
          {field.sources.map((s) => (
            <TabsTrigger
              key={s}
              value={s}
              className="rounded-full px-3 py-1 text-[11px] font-medium data-[state=active]:bg-background"
            >
              {SOURCE_LABEL[s] ?? s}
            </TabsTrigger>
          ))}
        </TabsList>

        {field.sources.includes("upload") && (
          <TabsContent value="upload" className="mt-2">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFile(e.dataTransfer.files?.[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
                dragOver ? "border-primary/60 bg-primary/5" : "border-border hover:border-foreground/25",
              )}
            >
              <Upload className="h-5 w-5 text-muted-foreground" />
              <p className="text-[13px] font-medium text-foreground">Drop a file or browse</p>
              {acceptCopy && (
                <p className="font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
                  {acceptCopy}
                </p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept={field.accept?.map((a) => `.${a.toLowerCase()}`).join(",")}
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          </TabsContent>
        )}

        {field.sources.includes("library") && (
          <TabsContent value="library" className="mt-2 flex flex-col gap-1.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your Library…"
                className="h-8 rounded-full pl-7 text-[12.5px]"
              />
            </div>
            <div className="max-h-56 overflow-y-auto rounded-lg">
              {filteredLibrary.length === 0 ? (
                <p className="px-2 py-4 text-center text-[12px] text-muted-foreground">
                  Nothing matches in your Library yet.
                </p>
              ) : (
                filteredLibrary.map((item) => (
                  <SelectableRow
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    meta={item.meta}
                    thumbnail={item.thumbnail}
                    durationSec={item.durationSec}
                    active={value?.source === "library" && value.item?.id === item.id}
                    Icon={Icon}
                    onClick={() =>
                      onChange({
                        source: "library",
                        item,
                        durationSec: item.durationSec,
                        pageCount: item.pageCount,
                      })
                    }
                  />
                ))
              )}
            </div>
          </TabsContent>
        )}

        {field.sources.includes("catalogue") && (
          <TabsContent value="catalogue" className="mt-2 flex flex-col gap-1.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the Catalogue…"
                className="h-8 rounded-full pl-7 text-[12.5px]"
              />
            </div>
            <div className="max-h-56 overflow-y-auto rounded-lg">
              {filteredCatalogue.length === 0 ? (
                <p className="px-2 py-4 text-center text-[12px] text-muted-foreground">
                  No matching product in the Catalogue.
                </p>
              ) : (
                filteredCatalogue.map((item) => {
                  const product = products.find((p) => p.id === item.id);
                  return (
                    <SelectableRow
                      key={item.id}
                      id={item.id}
                      title={item.title}
                      meta={item.meta}
                      thumbnail={item.thumbnail}
                      active={value?.source === "catalogue" && value.product?.id === item.id}
                      Icon={Icon}
                      onClick={() => product && onChange({ source: "catalogue", product })}
                    />
                  );
                })
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
