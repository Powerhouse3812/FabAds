import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Radar,
  Search,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCategory, products } from "@/genie6/mocks";
import type { AppField, PickerSource } from "../appTypes";
import {
  PICKER_IMAGES,
  PICKER_VIDEOS,
  insightsItemsFor,
  reportItemsFor,
  type PickerItem,
} from "../data/appPickerData";
import { useBatches } from "../../lib/genieRunStore";
import type { RunBatch } from "../../lib/genieRunTypes";
import { sampleOutputs } from "../../mocks/sample-outputs";
import type { OutputData } from "../../types/output";
import { PreviewVideo } from "../../studio-v4/components/PreviewVideo";
import { videoForSeed } from "../../studio-v4/data/studio-visuals";
import { approachLabel } from "../../studio-v4/components/queue/batchDisplay";
import {
  AdgroupCard,
  adCardFromOutput,
  type AdCardData,
} from "../../variations/components/AdgroupCard";
import { analyseAd } from "../../variations/data/analyseAd";
import type {
  AdAnalysis,
  AnalysedField,
  UploadedAdStub,
} from "../../variations/types";

/**
 * SourceAdField — the "source-ad-picker" field kind.
 *
 * Product Swap and Face Swap start from a whole existing AD, not a bare file:
 * the owner's handwritten spec asks for a preview "like the Genie Ad card",
 * the source's brand/product/category, play/pause, aspect ratio, where it
 * came from, and an analysed-status readout. Every one of those is an
 * EXISTING model reused here, never invented:
 *
 *  - the preview card is `variations/components/AdgroupCard.tsx` — the exact
 *    card Genie outputs / Creative Library / Industry Insights / Reports
 *    already share, via its own `adCardFromOutput` adapter (genie tab) plus
 *    one more local adapter for the three raw-`PickerItem` universes
 *    (library / report / industry-insights) that have no existing adapter
 *    because nothing has needed a full ad card from THAT shape before.
 *  - the "detected" brand/product/category readout reuses `analyseAd()` +
 *    `AnalysedField`'s stored/detected/not-found grammar (variations' own
 *    "what we detected" model) for genie + upload sources, where a real
 *    `PickedSource` exists to analyse. Library/report/insights sources carry
 *    no such source — a `PickerItem` is not a `FlowSourceRef` — so those
 *    read the same honest facts the picker's OWN `details` array already
 *    carries (Brand, in Industry Insights' case; nothing else claims one),
 *    wrapped in the identical `AnalysedField` shape rather than a parallel
 *    model.
 *  - play/pause is `PreviewVideo`'s `controls` prop (studio-v4), unedited.
 *  - the picker chrome (tabs, drop zone, search, clear) mirrors
 *    `MediaPickerField` structurally, so this reads as a sibling field, not a
 *    different species.
 *
 * Chrome outside the reused card uses STANDARD app tokens (bg-background,
 * text-foreground, border-border, bg-primary…) per this task's design-system
 * brief — Other Apps (`AppRunner.tsx`) is built entirely in the app's own
 * shadcn palette, not g6. The embedded `AdgroupCard` keeps ITS OWN g6 styling
 * untouched (reusing the component, not forking it): `/iq/genie6/*` sets
 * `data-theme` on `<html>` (`Genie6Bridge`, wired in `routes.tsx` around
 * every sub-route including Other Apps), so the `--g6-color-*` variables
 * `AdgroupCard` reads ARE defined here — this is not the same trap that bit
 * `NotificationBell` (a component mounted OUTSIDE any `/iq/genie6/*` route).
 * The `.g6-root` wrapper below is added anyway, scoped to just the card, to
 * match its Geist font + letter-spacing exactly as it renders inside
 * `SourcePickerModal`'s own `.g6-root` `DialogContent`.
 */

type SourceAdFieldSpec = Extract<AppField, { kind: "source-ad-picker" }>;

/* ------------------------------------------------------------------ value */

/**
 * `AppFieldValues` is `Record<string, unknown>` (appTypes.ts) — this is the
 * shape this field chooses, denormalised the same way `MediaPickerValue`
 * (fieldHelpers.ts) is: the full `card` and, where one exists, the real
 * `OutputData` travel WITH the value, so re-selecting the field doesn't need
 * to re-resolve anything, and so the app screen that owns this field's id can
 * read `.card` / `.output` directly without importing this file's internals.
 */
export interface SourceAdValue {
  source: PickerSource;
  /** Ready to hand straight to `<AdgroupCard data={value.card} />`. */
  card: AdCardData;
  mediaKind: "image" | "video";
  /** Present only for a "genie" pick with a resolvable output — what feeds
   *  `analyseAd()` for the real brand/product/category read below. */
  output?: OutputData;
  /** Upload tab only — mock: filename read, no real file storage. */
  fileName?: string;
  /** DISPLAYED metadata, never a picker here (`AspectRatioField` owns the
   *  picker case) — read off the batch that produced it where one exists,
   *  else a stable per-id derived guess, same "hash → chip Detected" rule
   *  `analyseAd.ts` uses throughout. */
  aspectRatio: string;
  /**
   * "Where it came from" (owner spec) — e.g. "Saved from a Product Ad
   * generation" / "Saved from Library" / "Uploaded". Computed once per row
   * (the genie tab reads the batch's own approach, so a Product Ad and a
   * Performance Ad generation say so by name) and carried here for the same
   * reason `entity` is: nothing on the redisplay path should re-derive a
   * fact a row already worked out.
   */
  originLabel: string;
  /**
   * Brand / product / category, computed ONCE at pick time and carried on
   * the value — never recomputed from the card on redisplay. A `PickerItem`-
   * backed card (library/report/insights) has no live pointer back to its
   * row's own `details`-derived facts (only `AdCardData`'s Meta-chrome
   * slots, most of which are null for those three sources by design — see
   * `cardFromPickerItem`), so re-deriving from the card alone would silently
   * drop real facts a row already knew, e.g. an Industry Insights row's own
   * competitor brand. Storing the computed rows is what `MediaPickerValue`
   * already does with its picked `item` — denormalise at selection time.
   */
  entity: EntityRows;
  /**
   * "Or that it's been modified" (owner spec). This field never sets it —
   * nothing downstream of picking mutates the source here — but the shape
   * exists so a future edit action on the app screen has somewhere honest to
   * write "yes, changed since it was picked" rather than that fact having no
   * home at all.
   */
  modifiedSincePick?: boolean;
  /**
   * A real playable clip for the preview, when the pick is a video.
   *
   * `card.media[0]` is a STILL — every adapter puts a thumbnail there
   * (`adCardFromOutput` → `o.thumbnail`). Handing that to `<video src>` gave
   * a player that could never fire `playing`, so the play/pause control the
   * owner asked for rendered but did nothing. This carries the clip itself;
   * the still becomes the poster.
   */
  clipUrl?: string;
  /**
   * Source duration in seconds, where the row knows it.
   *
   * REQUIRED for correct pricing, not decoration: `appCost.findDurationField`
   * only understood `media-picker`, so when Face Swap's target video became a
   * source-ad pick its per-minute multiplier silently floored to 1 and a
   * 4-minute ad quoted 13 credits instead of 52. That divergence is exactly
   * what the ONE-credit-formula invariant (§21.2) exists to prevent.
   */
  durationSec?: number;
}

interface SourceAdFieldProps {
  field: SourceAdFieldSpec;
  value: SourceAdValue | undefined;
  onChange: (value: SourceAdValue | undefined) => void;
}

/* --------------------------------------------------------------- helpers */

/** Same tiny `AnalysedField` constructors `analyseAd.ts` / `analyseAsset.ts`
 *  each keep privately — copied, not imported, by the same convention those
 *  two files already established (neither exports theirs). */
function stored<T>(value: T | null | undefined, detail?: string | null): AnalysedField<T> {
  if (value === null || value === undefined || value === "") return notFound<T>();
  return { value, provenance: "stored", detail: detail ?? null };
}
function detected<T>(value: T | null | undefined, detail?: string | null): AnalysedField<T> {
  if (value === null || value === undefined || value === "") return notFound<T>();
  return { value, provenance: "detected", detail: detail ?? null };
}
function notFound<T>(): AnalysedField<T> {
  return { value: null, provenance: "not-found", detail: null };
}

/** FNV-1a — the same deterministic-derivation shape `analyseAd.ts` uses, so
 *  an aspect ratio guessed here (no batch config to read) is stable across
 *  renders rather than reshuffling on every pick. */
function hash(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const GUESS_RATIOS = ["1:1", "4:5", "9:16", "16:9"] as const;

function guessAspectRatio(seed: string): string {
  return GUESS_RATIOS[hash(seed) % GUESS_RATIOS.length];
}

interface EntityRows {
  brand: AnalysedField;
  product: AnalysedField;
  category: AnalysedField;
}

const EMPTY_ROWS: EntityRows = { brand: notFound(), product: notFound(), category: notFound() };

/** Product name → its category, the same exact-name join `analyseAsset.ts`'s
 *  `categoryForProductName` uses (not imported — that helper is module-
 *  private there). Only ever reads real catalogue data; a name that matches
 *  nothing stays not-found rather than guessed. */
function categoryForProductName(name: string | undefined): string | undefined {
  if (!name) return undefined;
  const p = products.find((x) => x.name.toLowerCase() === name.trim().toLowerCase());
  return p?.categoryId ? getCategory(p.categoryId)?.name : undefined;
}

/** Genie / upload sources have a real `AdAnalysis` (via `analyseAd()`) — its
 *  `type` + `entityName` rows already ARE the brand-vs-product-vs-category
 *  fact the owner asked for, just filed under one row instead of three. This
 *  splits them back into three without inventing a new derivation: a
 *  product's brand rides in `entityName.detail` (`analyseAd.ts`'s own
 *  `entityRows` sets it that way), and category is the one genuine addition,
 *  derived by the identical join `analyseAsset.ts` already uses elsewhere. */
function entityRowsFromAdAnalysis(a: AdAnalysis): EntityRows {
  const kind = a.type.value;
  if (kind === "product") {
    const productName = a.entityName.value ?? undefined;
    const brandName = a.entityName.detail ?? undefined;
    const category = categoryForProductName(productName);
    return {
      product: { value: a.entityName.value, provenance: a.entityName.provenance, detail: null },
      brand: brandName ? stored(brandName) : notFound(),
      category: category ? detected(category, productName ? `from ${productName}` : null) : notFound(),
    };
  }
  if (kind === "brand") {
    return { brand: a.entityName, product: notFound(), category: notFound() };
  }
  if (kind === "category" || kind === "category-product") {
    return { category: a.entityName, brand: notFound(), product: notFound() };
  }
  return EMPTY_ROWS;
}

/** Library / Report / Industry Insights sources are a raw `PickerItem`, not a
 *  `FlowSourceRef` — there is no `PickedSource` to hand `analyseAd()`. So this
 *  reads the SAME `details` array `appPickerData.ts` already attached to the
 *  item (built only from fields each source genuinely carries — see that
 *  file's header) rather than re-deriving or inventing anything new. Today
 *  only Industry Insights' pool populates a "Brand" row (the competitor's, on
 *  purpose — see the §7.2 note on `buildCard` below); Library and Reports
 *  correctly come back empty across all three, which is the honest answer for
 *  brought-in media and an ad-account-scoped Reports row alike. */
function entityRowsFromDetails(details: { label: string; value: string }[] | undefined): EntityRows {
  const find = (label: string) => details?.find((d) => d.label.toLowerCase() === label.toLowerCase())?.value;
  const brand = find("Brand");
  const product = find("Product");
  const category = find("Category");
  return {
    brand: brand ? stored(brand) : notFound(),
    product: product ? stored(product) : notFound(),
    category: category ? stored(category) : notFound(),
  };
}

/* ------------------------------------------------------------------- rows */

/** One list row, whichever of the four ad-bearing universes it came from. */
interface SourceAdRow {
  key: string;
  source: PickerSource;
  title: string;
  thumbnail?: string;
  meta: string;
  mediaKind: "image" | "video";
  card: AdCardData;
  output?: OutputData;
  aspectRatio: string;
  originLabel: string;
  entity: EntityRows;
  /** Real playable clip for video picks — `card.media[0]` is only a still.
   *  See `SourceAdValue.clipUrl`. */
  clipUrl?: string;
  /** Feeds the per-minute cost multiplier. See `SourceAdValue.durationSec`. */
  durationSec?: number;
}

const outputById = new Map(sampleOutputs.map((o) => [o.id, o] as const));

/** "genie" tab — Genie's own past generations, resolved back to the real
 *  `OutputData` (unlike `appPickerData.ts`'s `genieItemsFor`, which drops the
 *  output id once it has built its display row — this field needs the id
 *  back to reuse `analyseAd()` and the batch's own `config`). Mirrors that
 *  function's own filter (done items with a real image/video output) against
 *  the SAME live store rather than inventing a parallel one. */
function genieRows(batches: RunBatch[]): SourceAdRow[] {
  const rows: SourceAdRow[] = [];
  for (const batch of batches) {
    for (const item of batch.items) {
      if (item.status !== "done" || !item.outputId) continue;
      const out = outputById.get(item.outputId);
      if (!out || out.mediaType === "text-only") continue;
      const mediaKind: "image" | "video" = out.mediaType === "video" ? "video" : "image";
      const approach = approachLabel(batch.config?.approach);
      const analysis = analyseAd({ kind: "genie-output", output: out });
      rows.push({
        key: `genie:${out.id}`,
        source: "genie",
        title: out.headline || out.product?.name || out.brand?.name || "Untitled generation",
        thumbnail: out.thumbnail,
        meta: approach ? `${approach} · Genie` : "Genie generation",
        mediaKind,
        card: adCardFromOutput(out),
        output: out,
        aspectRatio: batch.config?.aspectRatio ?? guessAspectRatio(out.id),
        clipUrl: mediaKind === "video" ? videoForSeed(`source-ad:${out.id}`) : undefined,
        // No `durationSec`: `OutputData` genuinely carries no length, so the
        // per-minute cost line floors to one minute for a Genie pick. That is
        // the honest answer — inventing a duration here would put a fabricated
        // number straight into a charged total. Library / Reports / Insights
        // rows DO know their length (`PickerItem.durationSec`) and price on it.
        /* "Saved from Genie · From scratch", NOT "Saved from a From scratch
           generation" — approach labels are themselves phrases ("From
           scratch", "Product Demo"), so the indefinite article collided with
           them and rendered "a From scratch". This shape also matches the
           sibling labels below ("Saved from Library" / "Saved from Reports"),
           so every row in the picker reads the same way. */
        originLabel: approach ? `Saved from Genie · ${approach}` : "Saved from Genie",
        entity: entityRowsFromAdAnalysis(analysis),
      });
      if (rows.length >= 40) return rows;
    }
  }
  return rows;
}

/** Builds a card from a raw `PickerItem` — the fourth `AdCardData` adapter
 *  this shape needs (Library / Reports / Industry Insights carry no ad copy
 *  of their own to fill the Meta-chrome slots the other three adapters read,
 *  only a title, a thumbnail and their own `details`), so every copy slot but
 *  `name` and `media` is an honest null — the card's own em-dash grammar,
 *  never a fabricated headline. */
function cardFromPickerItem(
  item: PickerItem,
  opts: { mediaKind: "image" | "video"; provenance: string; competitor?: boolean; typeLabel: string },
): AdCardData {
  return {
    id: item.id,
    pageName: null,
    avatarUrl: null,
    bodyText: null,
    headline: null,
    domain: null,
    cta: null,
    media: item.thumbnail ? [item.thumbnail] : [],
    mediaKinds: item.thumbnail ? [opts.mediaKind] : [],
    typeLabel: opts.typeLabel,
    name: item.title,
    provenance: opts.provenance,
    competitor: opts.competitor,
  };
}

function rowsFromPool(
  items: PickerItem[],
  source: PickerSource,
  mediaKind: "image" | "video",
  provenance: string,
  originLabel: string,
  competitor?: boolean,
): SourceAdRow[] {
  return items.map((item) => ({
    key: `${source}:${item.id}`,
    source,
    title: item.title,
    thumbnail: item.thumbnail,
    meta: item.meta,
    mediaKind,
    card: cardFromPickerItem(item, {
      mediaKind,
      provenance,
      competitor,
      typeLabel: mediaKind === "video" ? "Video" : "Image",
    }),
    aspectRatio: guessAspectRatio(item.id),
    originLabel,
    entity: entityRowsFromDetails(item.details),
    // Same bundled, same-origin clip pool the Studio home Trending tiles
    // play (`public/studio-previews/`, deterministic per seed) — these are
    // design-phase placeholders like every other preview in the demo, and
    // they make the play/pause control actually do something.
    clipUrl: mediaKind === "video" ? videoForSeed(`source-ad:${item.id}`) : undefined,
    durationSec: item.durationSec,
  }));
}

function libraryRows(): SourceAdRow[] {
  return [
    ...rowsFromPool(PICKER_VIDEOS, "library", "video", "Library", "Saved from Library"),
    ...rowsFromPool(PICKER_IMAGES, "library", "image", "Library", "Saved from Library"),
  ];
}

function reportRows(): SourceAdRow[] {
  return [
    ...rowsFromPool(reportItemsFor("video"), "report", "video", "Reports", "Saved from Reports"),
    ...rowsFromPool(reportItemsFor("image"), "report", "image", "Reports", "Saved from Reports"),
  ];
}

/** §7.2 — these are COMPETITOR ads. `competitor: true` rides straight onto
 *  the card, same as `adCardFromFlowRef` does for the real Industry Insights
 *  module, so the warning chip and footer copy appear without a caller
 *  asking. This is display only: nothing here writes a brand id anywhere. */
function insightsRows(): SourceAdRow[] {
  return [
    ...rowsFromPool(
      insightsItemsFor("video"),
      "industry-insights",
      "video",
      "Industry Insights",
      "Saved from Industry Insights",
      true,
    ),
    ...rowsFromPool(
      insightsItemsFor("image"),
      "industry-insights",
      "image",
      "Industry Insights",
      "Saved from Industry Insights",
      true,
    ),
  ];
}

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

const SOURCE_ICON: Record<string, React.ElementType> = {
  genie: Sparkles,
  library: ImageIcon,
  report: BarChart3,
  "industry-insights": Radar,
  upload: Upload,
};

/* ------------------------------------------------------------- sub-parts */

function SourceListRow({
  row,
  active,
  onClick,
}: {
  row: SourceAdRow;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "fab-focus flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors",
        active ? "bg-primary/10 ring-1 ring-primary/40" : "hover:bg-muted/60",
      )}
    >
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
        {row.thumbnail ? (
          <img src={row.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13px] font-medium text-foreground" title={row.title}>
          {row.title}
        </span>
        <span className="truncate font-mono text-[10.5px] text-muted-foreground" title={row.meta}>
          {row.meta}
        </span>
      </span>
      {row.source === "industry-insights" && (
        <span className="shrink-0 rounded-full border border-warning-text/30 bg-warning-text/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-warning-text">
          Competitor
        </span>
      )}
    </button>
  );
}

function EmptyPoolState({ source }: { source: PickerSource }) {
  const copy: Record<string, string> = {
    genie: "Once Studio, a Flow or an App finishes a run, it shows up here.",
    library: "Nothing matches in your Library yet.",
    report: "Reports has no matching creative right now.",
    "industry-insights": "Industry Insights has no matching creative right now.",
  };
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-border px-4 py-7 text-center">
      <ImageIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      <p className="text-[12.5px] font-medium text-foreground">
        {source === "genie" ? "No generations yet" : "Nothing here yet"}
      </p>
      <p className="max-w-[240px] font-mono text-[10.5px] leading-relaxed text-muted-foreground">
        {copy[source] ?? "Nothing here yet."}
      </p>
    </div>
  );
}

/** A row of small facts — brand / product / category — each carrying the
 *  same stored/detected/not-found chip the rest of the codebase already
 *  uses for "what we detected". */
function EntityRow({ label, field }: { label: string; field: AnalysedField }) {
  const isNf = field.provenance === "not-found";
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className={cn("truncate text-[12px]", isNf ? "text-muted-foreground" : "text-foreground")} title={field.value ?? undefined}>
        {isNf ? "N/F" : field.value}
        {!isNf && (
          <span
            className={cn(
              "ml-1.5 rounded-full px-1 py-px font-mono text-[8.5px] font-semibold uppercase tracking-wider",
              field.provenance === "stored" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary-text",
            )}
          >
            {field.provenance === "stored" ? "Stored" : "Detected"}
          </span>
        )}
      </dd>
    </div>
  );
}

type AnalysisPhase = "analysing" | "done";

/* ----------------------------------------------------------------- field */

export function SourceAdField({ field, value, onChange }: SourceAdFieldProps) {
  const [query, setQuery] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batches = useBatches();

  const genie = useMemo(() => genieRows(batches), [batches]);
  const library = useMemo(() => libraryRows(), []);
  const report = useMemo(() => reportRows(), []);
  const insights = useMemo(() => insightsRows(), []);

  const rowsFor = (source: PickerSource): SourceAdRow[] => {
    switch (source) {
      case "genie":
        return genie;
      case "library":
        return library;
      case "report":
        return report;
      case "industry-insights":
        return insights;
      default:
        return [];
    }
  };

  /** Selected-but-not-yet-analysed → analysed. A brief, honest beat rather
   *  than the facts appearing the instant a row is clicked — real state
   *  coverage, not just a static "Detected" label baked in from render one. */
  const [phase, setPhase] = useState<AnalysisPhase>("done");
  const valueKey = value ? `${value.source}:${value.card.id}` : null;
  const lastKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (valueKey === lastKeyRef.current) return;
    lastKeyRef.current = valueKey;
    if (!valueKey) return;
    setPhase("analysing");
    const t = window.setTimeout(() => setPhase("done"), 700);
    return () => window.clearTimeout(t);
  }, [valueKey]);

  const clear = () => onChange(undefined);

  const selectRow = (row: SourceAdRow) => {
    onChange({
      source: row.source,
      card: row.card,
      mediaKind: row.mediaKind,
      output: row.output,
      aspectRatio: row.aspectRatio,
      originLabel: row.originLabel,
      entity: row.entity,
      clipUrl: row.clipUrl,
      durationSec: row.durationSec,
    });
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const mediaKind: "image" | "video" = file.type.startsWith("video") ? "video" : "image";
    const previewUrl = URL.createObjectURL(file);
    const stub: UploadedAdStub = {
      id: `upl-${Date.now().toString(36)}`,
      name: file.name,
      previewUrl,
      mediaType: mediaKind,
    };
    // An uploaded ad carries no catalogue provenance whatsoever — reusing the
    // real `analyseAd()` for the upload case (rather than hand-writing the
    // empty answer) is what keeps this honestly in sync with the same rule
    // `SourcePicker.tsx` / `analyseAd.ts` already state for uploads.
    const entity = entityRowsFromAdAnalysis(analyseAd({ kind: "upload", file: stub }));
    onChange({
      source: "upload",
      mediaKind,
      fileName: file.name,
      aspectRatio: guessAspectRatio(stub.id),
      originLabel: "Uploaded",
      entity,
      // The object URL IS the real clip for an upload, so play/pause works on
      // the user's own file. Duration is genuinely unknown until it loads —
      // left undefined rather than guessed, so the cost line honestly floors
      // to one minute instead of quoting a fabricated length.
      clipUrl: mediaKind === "video" ? previewUrl : undefined,
      card: {
        id: stub.id,
        pageName: null,
        avatarUrl: null,
        bodyText: null,
        headline: null,
        domain: null,
        cta: null,
        media: mediaKind === "image" ? [previewUrl] : [],
        mediaKinds: mediaKind === "image" ? ["image"] : undefined,
        typeLabel: mediaKind === "video" ? "Video" : "Image",
        name: file.name,
        provenance: "Uploaded",
      },
    });
  };

  const acceptCopy = field.accept?.join(", ") ?? "";
  const isActive = (row: SourceAdRow) => value?.source === row.source && value.card.id === row.card.id;

  /* --------------------------------------------------------- selected UI */

  if (value) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3">
        <div className="flex items-start gap-3">
          {/* The reused Genie Ad card. Scoped `.g6-root` so its Geist font +
              letter-spacing render exactly as they do inside
              `SourcePickerModal`'s own `.g6-root` dialog — the underlying
              `--g6-color-*` variables already resolve here regardless (this
              route sets `data-theme`), this only fixes the font stack. */}
          <div className="g6-root w-[132px] shrink-0 overflow-hidden rounded-lg">
            <AdgroupCard data={value.card} />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-foreground" title={value.card.name ?? value.card.pageName ?? "This ad"}>
                  {value.card.name ?? value.card.pageName ?? "This ad"}
                </p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {value.originLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={clear}
                className="fab-focus inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 font-mono text-[10.5px] font-semibold text-foreground hover:border-primary/40"
              >
                <X className="h-3 w-3" />
                Change
              </button>
            </div>

            {/* Play/pause + aspect ratio — the two "chrome" facts from the
                spec that aren't entity data. Video gets `PreviewVideo`'s
                opt-in `controls` toggle; a static image has nothing to
                play, so only the ratio chip shows. */}
            <div className="flex items-center gap-2">
              {value.mediaKind === "video" && value.card.media[0] ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border">
                  {/* `src` is the CLIP, `poster` the still. Passing
                      `card.media[0]` as both gave a <video> pointed at a JPEG:
                      it could never fire `playing`, so the play button
                      rendered but was permanently inert — the owner's
                      play/pause item present in pixels and absent in fact. */}
                  <PreviewVideo
                    src={value.clipUrl ?? value.card.media[0]}
                    poster={value.card.media[0]}
                    controls
                  />
                </div>
              ) : null}
              <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 font-mono text-[10px] font-semibold text-foreground">
                {value.aspectRatio}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {value.mediaKind === "video" ? "Video" : "Image"}
              </span>
              {value.modifiedSincePick && (
                <span className="rounded-full border border-warning-text/30 bg-warning-text/10 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-warning-text">
                  Modified
                </span>
              )}
            </div>

            {/* Analysed status. */}
            <div className="flex items-center gap-1.5">
              {phase === "analysing" ? (
                <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Analysing…
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-primary-text">
                  <CheckCircle2 className="h-3 w-3" />
                  Analysed
                </span>
              )}
              {value.card.competitor && phase === "done" && (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-warning-text">
                  <AlertTriangle className="h-3 w-3" />
                  Competitor ad
                </span>
              )}
            </div>

            {phase === "done" && (
              <dl className="grid grid-cols-3 gap-x-3 gap-y-2 border-t border-border pt-2.5">
                <EntityRow label="Brand" field={value.entity.brand} />
                <EntityRow label="Product" field={value.entity.product} />
                <EntityRow label="Category" field={value.entity.category} />
              </dl>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------------- empty state */

  return (
    <div className="flex flex-col gap-2">
      <Tabs defaultValue={field.sources[0]}>
        <TabsList className="h-8 flex-wrap rounded-full bg-muted/60 p-0.5">
          {field.sources.map((s) => {
            const Icon = SOURCE_ICON[s];
            return (
              <TabsTrigger
                key={s}
                value={s}
                className="rounded-full px-3 py-1 text-[11px] font-medium data-[state=active]:bg-background"
              >
                <span className="inline-flex items-center gap-1">
                  {Icon && <Icon className="h-3 w-3" />}
                  {SOURCE_LABEL[s] ?? s}
                </span>
              </TabsTrigger>
            );
          })}
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
                  "fab-focus flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
                  dragOver ? "border-primary/60 bg-primary/5" : "border-border hover:border-foreground/25",
                )}
              >
                <Upload className="h-5 w-5 text-primary" />
                <p className="text-[13px] font-medium text-foreground">Drop an ad or browse</p>
                {acceptCopy && (
                  <p className="font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">{acceptCopy}</p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={field.accept?.map((a) => `.${a.toLowerCase()}`).join(",") ?? "image/*,video/*"}
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </div>
            )}

            {(source === "genie" || source === "library" || source === "report" || source === "industry-insights") &&
              (() => {
                const rows = rowsFor(source);
                if (rows.length === 0) return <EmptyPoolState source={source} />;
                const q = query.trim().toLowerCase();
                const filtered = q ? rows.filter((r) => r.title.toLowerCase().includes(q)) : rows;
                return (
                  <div className="flex flex-col gap-1.5">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={`Search ${SOURCE_LABEL[source].toLowerCase()}…`}
                        aria-label={`Search ${SOURCE_LABEL[source]}`}
                        className="h-8 rounded-full pl-7 text-[12.5px]"
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto rounded-lg">
                      {filtered.length === 0 ? (
                        <p className="px-2 py-4 text-center text-[12px] text-muted-foreground">
                          Nothing matches your search.
                        </p>
                      ) : (
                        filtered.map((row) => (
                          <SourceListRow key={row.key} row={row} active={isActive(row)} onClick={() => selectRow(row)} />
                        ))
                      )}
                    </div>
                  </div>
                );
              })()}

            {source !== "upload" &&
              source !== "genie" &&
              source !== "library" &&
              source !== "report" &&
              source !== "industry-insights" && (
                <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-border px-4 py-7 text-center">
                  <p className="text-[12.5px] font-medium text-foreground">Not an ad source</p>
                  <p className="max-w-[240px] font-mono text-[10.5px] leading-relaxed text-muted-foreground">
                    {SOURCE_LABEL[source] ?? source} doesn&apos;t hold a whole ad to start from.
                  </p>
                </div>
              )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
