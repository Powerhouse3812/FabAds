import { useMemo, useRef, useState } from "react";
import { Search, Upload, X, FileText, Film, Music, Package, Sparkles, BarChart3, Radar, FolderClosed } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getBrand, products } from "@/genie6/mocks";
import { useBatches } from "@/genie6/lib/genieRunStore";
import type { AppField, PickerSource } from "../appTypes";
import type { PickerItem } from "../data/appPickerData";
import {
  PICKER_AUDIO,
  PICKER_DOCS,
  PICKER_FOLDERS,
  PICKER_IMAGES,
  PICKER_VIDEOS,
  genieItemsFor,
  insightsItemsFor,
  reportItemsFor,
} from "../data/appPickerData";
import { formatDurationShort, type MediaPickerValue } from "../lib/fieldHelpers";

type MediaPickerFieldSpec = Extract<AppField, { kind: "media-picker" }>;

interface MediaPickerFieldProps {
  field: MediaPickerFieldSpec;
  value: MediaPickerValue | undefined;
  onChange: (value: MediaPickerValue | undefined) => void;
}

/**
 * `MediaPickerValue.source` (fieldHelpers.ts — out of this task's scope,
 * owned by another agent right now) only declares 5 of the 9 real
 * `PickerSource` values: it predates the genie/report/industry-insights/
 * folder split. Rather than edit that file, every value this component
 * builds is typed through this WIDENED local view and cast back to
 * `MediaPickerValue` at the one `onChange` boundary below — the stored data
 * is identical either way, only the compile-time source union differs.
 * Flagged in this task's report: `MediaPickerValue["source"]` should widen
 * to `PickerSource` once fieldHelpers.ts is back in scope.
 */
type PickerValue = Omit<MediaPickerValue, "source"> & { source: PickerSource };

const SOURCE_LABEL: Record<PickerSource, string> = {
  upload: "Upload",
  library: "Library",
  genie: "Genie",
  report: "Report",
  "industry-insights": "Industry Insights",
  folder: "Folder",
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

/** Structural "nothing here at all" copy — a tab this media kind genuinely
 *  has no data for (e.g. Genie makes no audio, Reports tracks no documents),
 *  never a lie dressed up as an empty search. */
function structuralEmptyCopy(source: PickerSource, media: MediaPickerFieldSpec["media"]): { title: string; line: string } {
  if (source === "genie") {
    if (media === "video" || media === "image")
      return { title: "No generations yet", line: "Once Studio, a Flow or an App finishes a run, it shows up here." };
    return { title: "Nothing to pick from Genie", line: `Genie doesn't generate ${media} output.` };
  }
  if (source === "report") {
    if (media === "video" || media === "image")
      return { title: "Nothing from Reports yet", line: "Reports has no matching creative right now." };
    return { title: "Nothing to pick from Reports", line: `Reports only tracks image and video ad creative, not ${media}.` };
  }
  if (source === "industry-insights") {
    if (media === "video" || media === "image")
      return { title: "No competitor ads yet", line: "Industry Insights has no matching creative right now." };
    return { title: "Nothing to pick", line: `Industry Insights only tracks image and video ad creative, not ${media}.` };
  }
  return { title: "Nothing here yet", line: "Nothing matches in your Library yet." };
}

function noMatchCopy(source: PickerSource): string {
  switch (source) {
    case "genie":
      return "No generations match your search.";
    case "report":
      return "No matching creative in Reports.";
    case "industry-insights":
      return "No matching competitor ad.";
    default:
      return "Nothing matches in your Library yet.";
  }
}

function searchLabelFor(source: PickerSource): string {
  switch (source) {
    case "genie":
      return "Search your generations…";
    case "report":
      return "Search Reports…";
    case "industry-insights":
      return "Search Industry Insights…";
    default:
      return "Search your Library…";
  }
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
        "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
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
        <span className="truncate text-[13px] font-medium text-foreground" title={title}>
          {title}
        </span>
        <span className="truncate font-mono text-[10.5px] text-muted-foreground" title={meta}>
          {meta}
        </span>
      </span>
      {durationSec ? (
        <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-muted-foreground">
          {formatDurationShort(durationSec)}
        </span>
      ) : null}
    </button>
  );
}

/** Composed empty state — used for a tab with structurally nothing to show
 *  (Folder's permanent "coming soon", or a source/media combo with no real
 *  backing data). Never a bare "No data." per the design system's §7 ban. */
function TabEmptyState({ icon: Icon, title, line }: { icon: React.ElementType; title: string; line: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-border px-4 py-7 text-center">
      <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      <p className="text-[12.5px] font-medium text-foreground">{title}</p>
      <p className="max-w-[240px] font-mono text-[10.5px] leading-relaxed text-muted-foreground">{line}</p>
    </div>
  );
}

/** Shared search+list grammar for every PickerItem-backed tab (library /
 *  genie / report / industry-insights). Distinguishes a STRUCTURAL zero
 *  state (this tab genuinely has nothing for this media kind) from a
 *  SEARCH zero state (items exist, the query matched none) — two different
 *  facts, two different messages, per the state-coverage requirement. */
function PickerListBody({
  source,
  media,
  items,
  query,
  onQueryChange,
  Icon,
  active,
  onPick,
}: {
  source: PickerSource;
  media: MediaPickerFieldSpec["media"];
  items: PickerItem[];
  query: string;
  onQueryChange: (q: string) => void;
  Icon: React.ElementType;
  active: (item: PickerItem) => boolean;
  onPick: (item: PickerItem) => void;
}) {
  if (items.length === 0) {
    const { title, line } = structuralEmptyCopy(source, media);
    return <TabEmptyState icon={Icon} title={title} line={line} />;
  }

  const filtered = items.filter((i) => i.title.toLowerCase().includes(query.toLowerCase()));
  const label = searchLabelFor(source);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={label}
          aria-label={label}
          className="h-8 rounded-full pl-7 text-[12.5px]"
        />
      </div>
      <div className="max-h-56 overflow-y-auto rounded-lg">
        {filtered.length === 0 ? (
          <p className="px-2 py-4 text-center text-[12px] text-muted-foreground">{noMatchCopy(source)}</p>
        ) : (
          filtered.map((item) => (
            <SelectableRow
              key={item.id}
              id={item.id}
              title={item.title}
              meta={item.meta}
              thumbnail={item.thumbnail}
              durationSec={item.durationSec}
              active={active(item)}
              Icon={Icon}
              onClick={() => onPick(item)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Selected-media overview — owner ask: "when user added a video from any
 * source, we must show its data in overview kind of view. like size,
 * current language, name, format, other basic details, source etc." Only
 * ever renders facts the picked item's source genuinely carries
 * (`item.details`, `durationSec`, `pageCount`, or the Catalogue product's
 * own fields) — nothing here is a fabricated size or language.
 */
function SelectedMediaOverview({
  field,
  value,
  onClear,
}: {
  field: MediaPickerFieldSpec;
  value: PickerValue;
  onClear: () => void;
}) {
  const Icon = MEDIA_ICON[field.media];
  const thumbnail = value.item?.thumbnail ?? value.product?.thumbnail;
  const name = value.item?.title ?? value.product?.name ?? value.fileName ?? "Selected file";

  const rows: { label: string; value: string }[] = [];
  if (value.durationSec) rows.push({ label: "Duration", value: formatDurationShort(value.durationSec) });
  if (value.pageCount) rows.push({ label: "Pages", value: `${value.pageCount} slides` });
  if (value.item?.details) rows.push(...value.item.details);
  if (value.product) {
    const brand = getBrand(value.product.brandId);
    if (brand) rows.push({ label: "Brand", value: brand.name });
    rows.push({ label: "Price", value: value.product.price });
    if (value.product.benefits?.length) rows.push({ label: "Benefits", value: `${value.product.benefits.length} listed` });
  }
  // Mock upload carries no real file-metadata read (fieldHelpers.ts's own
  // MediaPickerValue doc comment) — an honest "no more facts" rather than a
  // guessed size/format.

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-2.5">
      <div className="flex items-center gap-2">
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
          {thumbnail ? (
            <img src={thumbnail} alt="" className="h-full w-full object-cover" />
          ) : (
            <Icon className="h-4 w-4 text-muted-foreground" />
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[12.5px] font-medium text-foreground" title={name}>
            {name}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            {SOURCE_LABEL[value.source] ?? value.source}
          </span>
        </span>
        <button
          type="button"
          aria-label="Clear selection"
          onClick={onClear}
          className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {rows.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-border pt-2">
          {rows.map((r, i) => (
            <div key={`${r.label}-${i}`} className="flex min-w-0 flex-col gap-0.5">
              <dt className="truncate font-mono text-[9.5px] uppercase tracking-wide text-muted-foreground">{r.label}</dt>
              <dd className="truncate text-[11px] text-foreground" title={r.value}>
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

/**
 * media-picker field renderer — §8 hard rule: a second input ALWAYS comes
 * from a picker (Library / Genie / Report / Industry Insights / Catalogue /
 * the avatar list), never a second upload box. `sources` orders the tabs —
 * rendered in exactly that order, whatever subset a given app declares.
 */
export function MediaPickerField({ field, value, onChange }: MediaPickerFieldProps) {
  const [query, setQuery] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const Icon = MEDIA_ICON[field.media];
  const batches = useBatches();

  // See PickerValue's doc comment above for why this cast exists.
  const selected = value as PickerValue | undefined;
  const select = (next: PickerValue | undefined) => onChange(next as MediaPickerValue | undefined);

  const libraryItems = useMemo(() => libraryPoolFor(field.media), [field.media]);
  const genieItems = useMemo(() => genieItemsFor(batches, field.media), [batches, field.media]);
  const reportItems = useMemo(() => reportItemsFor(field.media), [field.media]);
  const insightsItems = useMemo(() => insightsItemsFor(field.media), [field.media]);
  const catalogueList = useMemo(
    () => (field.media === "product" ? catalogueItems() : []),
    [field.media],
  );
  const filteredCatalogue = catalogueList.filter((i) => i.title.toLowerCase().includes(query.toLowerCase()));

  const clear = () => select(undefined);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    select({ source: "upload", fileName: file.name });
  };

  const acceptCopy = field.accept?.join(", ") ?? "";

  const pickItem = (source: PickerSource, item: PickerItem) =>
    select({ source, item, durationSec: item.durationSec, pageCount: item.pageCount });

  const isActive = (source: PickerSource) => (item: PickerItem) =>
    selected?.source === source && selected.item?.id === item.id;

  return (
    <div className="flex flex-col gap-2">
      {selected && <SelectedMediaOverview field={field} value={selected} onClear={clear} />}

      <Tabs defaultValue={field.sources[0]}>
        <TabsList className="h-8 flex-wrap rounded-full bg-muted/60 p-0.5">
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

        {field.sources.map((source) => (
          <TabsContent key={source} value={source} className="mt-2">
            {source === "upload" && (
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  dragOver ? "border-primary/60 bg-primary/5" : "border-border hover:border-foreground/25",
                )}
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <p className="text-[13px] font-medium text-foreground">Drop a file or browse</p>
                {acceptCopy && (
                  <p className="font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">{acceptCopy}</p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={field.accept?.map((a) => `.${a.toLowerCase()}`).join(",")}
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </div>
            )}

            {source === "library" && (
              <PickerListBody
                source="library"
                media={field.media}
                items={libraryItems}
                query={query}
                onQueryChange={setQuery}
                Icon={Icon}
                active={isActive("library")}
                onPick={(item) => pickItem("library", item)}
              />
            )}

            {source === "genie" && (
              <PickerListBody
                source="genie"
                media={field.media}
                items={genieItems}
                query={query}
                onQueryChange={setQuery}
                Icon={Sparkles}
                active={isActive("genie")}
                onPick={(item) => pickItem("genie", item)}
              />
            )}

            {source === "report" && (
              <PickerListBody
                source="report"
                media={field.media}
                items={reportItems}
                query={query}
                onQueryChange={setQuery}
                Icon={BarChart3}
                active={isActive("report")}
                onPick={(item) => pickItem("report", item)}
              />
            )}

            {source === "industry-insights" && (
              <PickerListBody
                source="industry-insights"
                media={field.media}
                items={insightsItems}
                query={query}
                onQueryChange={setQuery}
                Icon={Radar}
                active={isActive("industry-insights")}
                onPick={(item) => pickItem("industry-insights", item)}
              />
            )}

            {source === "folder" && (
              <TabEmptyState
                icon={FolderClosed}
                title="Folders — coming soon"
                line="Folder-level picking isn't built yet. Pull media from Library or Genie instead."
              />
            )}

            {source === "catalogue" && (
              <div className="flex flex-col gap-1.5">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search the Catalogue…"
                    aria-label="Search the Catalogue"
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
                          active={selected?.source === "catalogue" && selected.product?.id === item.id}
                          Icon={Icon}
                          onClick={() => product && select({ source: "catalogue", product })}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {(source === "avatars" || source === "voices") && (
              // Declared in PickerSource but referenced by no registry entry
              // today (appTypes.ts's own comment — avatar-picker owns that
              // job instead). Defensive fallback only, not a real surface.
              <TabEmptyState
                icon={Icon}
                title="Not available here"
                line="Avatar and voice selection happens in the Cast section above."
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
