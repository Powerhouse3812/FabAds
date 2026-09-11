import {
  type ElementType,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clapperboard,
  Clock,
  FileText,
  LayoutGrid,
  Lightbulb,
  Lock,
  Search,
  Sparkles,
  Type,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getBrand } from "@/mocks/shared/brands";
import { concepts } from "@/mocks/shared/concepts";
import { scripts, type ScriptAsset } from "@/mocks/shared/scripts";
import { storyboards, type StoryboardAsset } from "@/mocks/shared/storyboards";
import {
  LIBRARY_ADGROUPS,
  LIBRARY_HEADLINES,
  LIBRARY_MEDIA,
  LIBRARY_PRIMARY_TEXTS,
  type LibraryAdgroup,
} from "@/mocks/shared/library-items";
import type { FlowModuleKey, FlowSourceRef } from "../../flows/flowTypes";
import { FLOW_MODULES } from "../../flows/data/flowRegistry";
import { getFlowSource, sourcesForModule } from "../../flows/data/flowSources";
import { resolveIcon } from "../../flows/icons";
import {
  GENERATED_CONCEPTS,
  GENERATED_SCRIPTS,
  GENERATED_STORYBOARDS,
  type GeneratedConceptItem,
  type GeneratedScriptItem,
  type GeneratedStoryboardItem,
} from "../../library/tabs/generatedAssetPool";
import { sampleOutputs } from "../../mocks/sample-outputs";
import type { Concept } from "../../types/entities";
import type { OutputData } from "../../types/output";
import {
  AdgroupCard,
  adCardFromAdgroup,
  adCardFromFlowRef,
  adCardFromOutput,
  type AdCardData,
} from "./AdgroupCard";
import type {
  AssetKind,
  PastedAssetStub,
  PickedAsset,
  PickedThing,
  UploadedAdStub,
  UploadedAssetStub,
} from "../types";

/**
 * SourcePickerModal — the list half of Step 1 of Generate Variations.
 *
 * ONE MODAL PER UNIVERSE. Owner, 2026-09-10: "always show that upload wala
 * card (previously created). uske click pe alag alag modal will open. But keep
 * the Same Ad card structure in: Genie/Library/Industry insights/report."
 *
 * So the entry is the always-visible dropzone in `SourcePicker.tsx`, and this
 * component opens DIRECTLY on the universe whose chip was clicked
 * (`universeKey`) — no left rail of universes to navigate, because the chips
 * behind the modal already are that rail and duplicating them here would make
 * the modal a browse-everything surface the user has to steer. What survived
 * the rail is one text link per family ("Browse every ad source"), which
 * widens the SAME modal rather than being where a pick starts.
 *
 * Footer keeps SwapPicker's stage-then-commit grammar: selecting stages,
 * "Use this ad" commits. Single-select throughout — a run varies exactly ONE
 * source.
 *
 * WHICH UNIVERSES WEAR THE META-AD CARD
 * Genie generations, Creative Library, Industry Insights and Reports — the
 * four the owner named. Each adapts through `AdgroupCard`'s own converters
 * (`adCardFromOutput` / `adCardFromAdgroup` / `adCardFromFlowRef`), so one
 * card component renders all four and none of them re-implements the chrome.
 * A thin source (a Reports ref has no CTA and no headline) yields a card with
 * honest gaps rather than invented copy. The remaining universes — Video Sage,
 * Trends, Campaign URLs, Dashboard, every asset kind — stay compact rows:
 * their data has no page, no copy and no media to fill a card with, so a card
 * there would be a frame around three dashes.
 *
 * The Creative Library universe covers all 88 adgroups, not only the 8 the
 * flow registry curates; a curated one keeps its registry identity via
 * `getFlowSource(id)` so its `analysed` gate and metrics stay authoritative,
 * and the rest are described by a local mirror of `flowSources.ts`'s
 * `creativeLibraryRef` derivation (that helper is module-private there). Every
 * field in the mirror is read off the adgroup row — nothing is fabricated, and
 * `analysed` is deliberately left unset outside the registry rather than
 * inventing an analysis gate the user cannot clear.
 *
 * Ported forward from the inline picker, because dropping any of it deletes
 * capability: search, the §7.2 competitor chip + warning, `analysed === false`
 * rows/cards being unpickable WITH the reason stated, ad upload
 * (`image/*,video/*`), asset paste + `.txt`/`.md` ≤50 KB upload, and every
 * count being derived from the same `groups` the pane renders — which is also
 * what `SOURCE_UNIVERSE_CHIPS` exports to the dropzone, so a chip's count and
 * the modal it opens can never disagree.
 *
 * Outside-click never dismisses: `ui/dialog.tsx` preventDefaults
 * `onPointerDownOutside` / `onInteractOutside` repo-wide, so Cancel and the X
 * are the only ways out. Dark mode and mobile are explicit non-goals (§21.2).
 */

export interface SourcePickerModalProps {
  /** The universe whose chip was clicked. `null` = closed. */
  universeKey: string | null;
  onClose: () => void;
  /** A file dropped on the dropzone. Routed to the composer if it is text. */
  pendingFile?: File | null;
  /** The flow's current source. Reopens staged and selected. */
  picked: PickedThing | null;
  onPick: (picked: PickedThing) => void;
}

/** Items shown per group before "Show all" — 88 cards in one pane is a scroll,
 *  not a list. A query lifts the cap, same as the inline picker did. 12, not
 *  9: the grid is four 240px columns wide now that the rail is gone, so 12 is
 *  three full rows and 9 would leave a ragged one. */
const CARD_CAP = 12;
const ROW_CAP = 8;

/** Same ceiling ScriptRail (and the inline picker) enforces on a text file. */
const MAX_ASSET_UPLOAD_BYTES = 50 * 1024;

const AD_FILE_ACCEPT = "image/*,video/*";
const ASSET_FILE_ACCEPT = ".txt,.md,text/plain,text/markdown";

type Family = "ad" | "asset";

type LocalAsset = Extract<
  PickedAsset,
  { kind: "uploaded-asset" } | { kind: "pasted-asset" }
>;

/** Storyboard is absent on purpose — a storyboard is a script plus visual
 *  directions, so pasting a script and adding visuals IS the route to one. */
const COMPOSABLE_KINDS: AssetKind[] = ["script", "concept"];

const ASSET_NOUN: Record<AssetKind, string> = {
  script: "script",
  concept: "concept",
  storyboard: "storyboard",
};

/* ─────────────────────────────────────────────── display model ─────────── */

interface PickRow {
  /** kind-scoped: an output id and a ref id for the same ad are equal. */
  key: string;
  title: string;
  subtitle: string;
  thumbnail?: string;
  initials: string;
  chips: string[];
  /** Extra haystack (brand, angle, framework, tags). Never rendered. */
  searchText?: string;
  competitor: boolean;
  staticOnly: boolean;
  note?: string;
  /** undefined = the source module has no analysis step at all. */
  analysed?: boolean;
  /** Set = unpickable, and this is the reason stated ON the item. */
  blocked?: string;
  blockedIcon?: ElementType;
  /** Set ⇒ this item wears the Meta-ad card. Built by `AdgroupCard`'s own
   *  converters, so a Genie output, a library adgroup and a flow ref all
   *  arrive in the one shape the card reads. */
  card?: AdCardData;
  picked: PickedThing;
}

interface PickGroup {
  key: string;
  family: Family;
  label: string;
  /** Rail label — a rail row has ~14 chars, a heading has the whole pane. */
  shortLabel: string;
  noun: string;
  searchHint: string;
  assetKind?: AssetKind;
  Icon: ElementType;
  /** Cards only where every item is a real adgroup. See the header comment. */
  layout: "cards" | "rows";
  items: PickRow[];
}

interface Universe {
  key: string;
  family: Family;
  label: string;
  Icon: ElementType;
  /** Group keys this rail entry reveals, in order. */
  groups: string[];
  noun: string;
  searchHint: string;
  /** Opens the file dialog on select. */
  uploadAction?: boolean;
  /** Shows the paste/upload composer above the list. */
  composeAction?: boolean;
}

function pickedKey(p: PickedThing): string {
  if (p.family === "ad") {
    const ad = p.ad;
    if (ad.kind === "genie-output") return `genie-output:${ad.output.id}`;
    if (ad.kind === "flow-ref") return `flow-ref:${ad.ref.id}`;
    return `upload:${ad.file.id}`;
  }
  const asset = p.asset;
  if (asset.kind === "uploaded-asset") return `uploaded-asset:${asset.file.id}`;
  if (asset.kind === "pasted-asset") return `pasted-asset:${asset.text.id}`;
  return `${asset.kind}:${asset.assetKind}:${asset.id}`;
}

function initialsOf(...candidates: (string | undefined)[]): string {
  const src = candidates.find((c) => c && c.trim().length > 0);
  return (src ?? "Ad").trim().slice(0, 2).toUpperCase();
}

function snippet(text: string, max = 96): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

function brandNameOf(brandId?: string): string | undefined {
  return brandId ? getBrand(brandId)?.name : undefined;
}

/** Every noun on this surface is stored plural; "1 ads" reads like a bug. */
function countLabel(n: number, plural: string): string {
  return `${n} ${n === 1 ? plural.replace(/s$/, "") : plural}`;
}

/* ─────────────────────────────────────────────── whole-ad items ────────── */

/** Unpickable only when the module HAS an analysis step and it came back
 *  unfinished. `undefined` means no such step — blocking those would invent a
 *  gate the user cannot clear. */
function blockedFor(ref: FlowSourceRef, moduleLabel: string): string | undefined {
  if (ref.analysed !== false) return undefined;
  return (
    ref.blockedReason ??
    `Needs analysis in ${moduleLabel} before Genie can read this ad`
  );
}

function refRow(
  ref: FlowSourceRef,
  moduleLabel: string,
  moduleCompetitor: boolean,
  card?: AdCardData,
): PickRow {
  return {
    key: `flow-ref:${ref.id}`,
    title: ref.title || "Untitled ad",
    subtitle: ref.subtitle,
    thumbnail: ref.thumbnail,
    initials: initialsOf(ref.sourceBrandName, ref.title),
    chips: [ref.sourceBrandName, ...(ref.metrics ?? []).map((m) => `${m.label} ${m.value}`)],
    searchText: [ref.sourceBrandName, ref.sourceFormat, ref.sourceNote]
      .filter(Boolean)
      .join(" "),
    // §7.2 — module-level OR ref-level. Dashboard aggregates Insights'
    // competitor rows next to the user's own, so the per-ref flag matters.
    competitor: moduleCompetitor || Boolean(ref.competitorOwned),
    staticOnly: ref.sourceFormat === "carousel" || ref.sourceFormat === "flexible",
    note: ref.sourceNote,
    analysed: ref.analysed,
    blocked: blockedFor(ref, moduleLabel),
    card,
    picked: { family: "ad", ad: { kind: "flow-ref", ref } },
  };
}

/** A flow ref, as a card. `competitor` is forced from the ROW's verdict, not
 *  the ref's own flag: Industry Insights is competitor-owned at MODULE level
 *  (§7.2) and its individual refs need not repeat it, so reading the ref alone
 *  would drop the chip from every card in that universe. */
function refCardRow(ref: FlowSourceRef, moduleLabel: string, moduleCompetitor: boolean): PickRow {
  const row = refRow(ref, moduleLabel, moduleCompetitor);
  return { ...row, card: { ...adCardFromFlowRef(ref), competitor: row.competitor } };
}

/**
 * A local mirror of `flowSources.ts`'s module-private `creativeLibraryRef`, so
 * an adgroup outside the 8 curated ids can still travel as the `flow-ref`
 * `PickedThing` the rest of the flow already understands. Every value is read
 * off the adgroup row; `analysed` and `detectedEntity` are left unset because
 * only the registry legitimately knows those.
 */
function refForAdgroup(adg: LibraryAdgroup): FlowSourceRef {
  const registered = getFlowSource(adg.id);
  if (registered) return registered;
  const media = adg.media_ids
    .map((id) => LIBRARY_MEDIA.find((m) => m.id === id))
    .find((m): m is NonNullable<typeof m> => !!m);
  return {
    id: adg.id,
    module: "creative-library" as FlowModuleKey,
    title: adg.name,
    subtitle: `${adg.page_name} · ${adg.ad_type}`,
    thumbnail: media?.url,
    sourceBrandName: adg.page_name,
    sourceNote:
      adg.source === "pinned-insights" ? "Pinned from Industry Insights" : undefined,
    sourceFormat:
      adg.ad_type === "Carousel"
        ? "carousel"
        : media?.file_type === "video"
          ? "video"
          : "image",
    metrics: [
      ...(adg.quality_score !== undefined
        ? [{ label: "Quality", value: String(adg.quality_score) }]
        : []),
      { label: "CTA", value: adg.cta },
    ],
  };
}

/** The card shows copy the ref does not carry — a card's headline and primary
 *  text are resolved by id INSIDE `AdgroupCard`. Search has to match what the
 *  user can read, so the same ids are resolved once here into the haystack. */
const LIBRARY_TEXT_BY_ID = new Map(
  [...LIBRARY_HEADLINES, ...LIBRARY_PRIMARY_TEXTS].map((t) => [t.id, t.text]),
);

function adgroupRow(adg: LibraryAdgroup, moduleLabel: string): PickRow {
  const row = refRow(refForAdgroup(adg), moduleLabel, false, adCardFromAdgroup(adg));
  return {
    ...row,
    searchText: [
      row.searchText,
      adg.page_name,
      adg.ad_type,
      adg.cta,
      adg.display_link,
      LIBRARY_TEXT_BY_ID.get(adg.headline_id ?? ""),
      LIBRARY_TEXT_BY_ID.get(adg.primary_text_id ?? ""),
    ]
      .filter(Boolean)
      .join(" "),
  };
}

function outputRow(out: OutputData): PickRow {
  // var_zerocase carries empty strings for brand/headline on purpose — every
  // field here has to survive that without rendering a blank item.
  const title =
    out.headline || out.product?.name || out.brand?.name || "Untitled generation";
  const subtitleParts = [out.brand?.name, out.product?.name, out.format ?? out.mediaType]
    .filter((p): p is string => Boolean(p));
  const chips: string[] = [];
  if (out.brand?.name) chips.push(out.brand.name);
  if (out.qualityScore !== undefined) chips.push(`Quality ${out.qualityScore}`);
  return {
    key: `genie-output:${out.id}`,
    title,
    subtitle: subtitleParts.length
      ? subtitleParts.join(" · ")
      : "No brand or product recorded",
    thumbnail: out.thumbnail,
    initials: initialsOf(out.brand?.name, out.product?.name, "Genie"),
    chips,
    competitor: false,
    staticOnly: false,
    // Genie's own past generations were produced here, config already on
    // record — nothing left to analyse.
    analysed: true,
    card: adCardFromOutput(out),
    picked: { family: "ad", ad: { kind: "genie-output", output: out } },
  };
}

function uploadRow(file: UploadedAdStub): PickRow {
  return {
    key: `upload:${file.id}`,
    title: file.name,
    subtitle: `Uploaded ${file.mediaType} · no catalogue provenance`,
    thumbnail: file.mediaType === "image" ? file.previewUrl : undefined,
    initials: initialsOf(file.name),
    chips: [file.mediaType],
    competitor: false,
    staticOnly: false,
    picked: { family: "ad", ad: { kind: "upload", file } },
  };
}

/* ─────────────────────────────────────────────── asset items ───────────── */

function assetPick(
  kind: "saved-asset" | "generated-asset",
  assetKind: AssetKind,
  id: string,
): PickedThing {
  return { family: "asset", asset: { kind, assetKind, id } };
}

function savedScriptRow(s: ScriptAsset): PickRow {
  const brand = brandNameOf(s.brandId);
  return {
    key: `saved-asset:script:${s.id}`,
    title: s.title,
    subtitle: snippet(s.body),
    initials: initialsOf(brand, s.title),
    chips: [...(brand ? [brand] : []), s.framework, `${s.durationSec}s`],
    searchText: [brand, s.framework, ...s.tags].filter(Boolean).join(" "),
    competitor: false,
    staticOnly: false,
    picked: assetPick("saved-asset", "script", s.id),
  };
}

function savedConceptRow(c: Concept): PickRow {
  const brand = brandNameOf(c.brandId);
  return {
    key: `saved-asset:concept:${c.id}`,
    title: c.name,
    subtitle: c.hook || snippet(c.visualDirection),
    initials: initialsOf(brand, c.name),
    chips: [...(brand ? [brand] : []), c.angle, c.tone, c.format],
    searchText: [brand, c.angle, c.tone, c.format, c.visualDirection]
      .filter(Boolean)
      .join(" "),
    competitor: false,
    staticOnly: false,
    picked: assetPick("saved-asset", "concept", c.id),
  };
}

function savedStoryboardRow(sb: StoryboardAsset): PickRow {
  const brand = brandNameOf(sb.brandId);
  const seconds = sb.scenes.reduce((n, sc) => n + sc.durationSec, 0);
  return {
    key: `saved-asset:storyboard:${sb.id}`,
    title: sb.title,
    subtitle: sb.scenes[0]
      ? `Opens on ${sb.scenes[0].shot} — ${snippet(sb.scenes[0].description, 64)}`
      : "No scenes recorded",
    thumbnail: sb.thumbnail,
    initials: initialsOf(brand, sb.title),
    chips: [
      ...(brand ? [brand] : []),
      `${sb.scenes.length} scenes`,
      sb.formatLabel,
      `${seconds}s`,
    ],
    searchText: [brand, sb.productName, sb.formatLabel, ...sb.tags]
      .filter(Boolean)
      .join(" "),
    competitor: false,
    staticOnly: false,
    picked: assetPick("saved-asset", "storyboard", sb.id),
  };
}

/** A generation that failed has no words to vary — unpickable, reason stated. */
function generatedBlock(status: string, kind: AssetKind): string | undefined {
  if (status !== "failed") return undefined;
  return `This ${ASSET_NOUN[kind]} generation failed — retry it in Library before varying it`;
}

function generatedScriptRow(g: GeneratedScriptItem): PickRow {
  return {
    key: `generated-asset:script:${g.id}`,
    title: g.title,
    subtitle: snippet(g.body),
    initials: initialsOf(g.brandName, g.title),
    chips: [g.brandName, g.framework, `${g.durationSec}s`],
    note: g.batchId,
    searchText: [g.brandName, g.productName, g.framework, g.module, ...g.tags]
      .filter(Boolean)
      .join(" "),
    competitor: false,
    staticOnly: false,
    blocked: generatedBlock(g.status, "script"),
    blockedIcon: AlertTriangle,
    picked: assetPick("generated-asset", "script", g.id),
  };
}

function generatedConceptRow(g: GeneratedConceptItem): PickRow {
  return {
    key: `generated-asset:concept:${g.id}`,
    title: g.name,
    subtitle: g.hook,
    thumbnail: g.thumbnail,
    initials: initialsOf(g.brandName, g.name),
    chips: [g.brandName, g.angle, g.tone, g.formatLabel],
    note: g.batchId,
    searchText: [g.brandName, g.productName, g.angle, g.tone, g.formatLabel, g.module]
      .filter(Boolean)
      .join(" "),
    competitor: false,
    staticOnly: false,
    blocked: generatedBlock(g.status, "concept"),
    blockedIcon: AlertTriangle,
    picked: assetPick("generated-asset", "concept", g.id),
  };
}

function generatedStoryboardRow(g: GeneratedStoryboardItem): PickRow {
  const seconds = g.scenes.reduce((n, sc) => n + sc.durationSec, 0);
  return {
    key: `generated-asset:storyboard:${g.id}`,
    title: g.title,
    subtitle: g.scenes[0]
      ? `Opens on ${g.scenes[0].shot} — ${snippet(g.scenes[0].description, 64)}`
      : "No scenes recorded",
    thumbnail: g.thumbnail,
    initials: initialsOf(g.brandName, g.title),
    chips: [g.brandName, `${g.scenes.length} scenes`, g.formatLabel, `${seconds}s`],
    note: g.batchId,
    searchText: [g.brandName, g.productName, g.formatLabel, g.module, ...g.tags]
      .filter(Boolean)
      .join(" "),
    competitor: false,
    staticOnly: false,
    blocked: generatedBlock(g.status, "storyboard"),
    blockedIcon: AlertTriangle,
    picked: assetPick("generated-asset", "storyboard", g.id),
  };
}

function localAssetRow(asset: LocalAsset): PickRow {
  const stub = asset.kind === "pasted-asset" ? asset.text : asset.file;
  const title = asset.kind === "pasted-asset" ? asset.text.title : asset.file.name;
  return {
    key: `${asset.kind}:${stub.id}`,
    title,
    subtitle: snippet(stub.body),
    initials: initialsOf(title),
    chips: [
      ASSET_NOUN[stub.assetKind],
      asset.kind === "pasted-asset" ? "Pasted" : "Uploaded file",
    ],
    competitor: false,
    staticOnly: false,
    picked: { family: "asset", asset },
  };
}

const ASSET_KIND_META: Record<
  AssetKind,
  { label: string; Icon: ElementType; noun: string; searchHint: string }
> = {
  script: {
    label: "Scripts",
    Icon: FileText,
    noun: "scripts",
    searchHint: "title, brand, framework or wording",
  },
  concept: {
    label: "Concepts",
    Icon: Lightbulb,
    noun: "concepts",
    searchHint: "name, brand, angle or tone",
  },
  storyboard: {
    label: "Storyboards",
    Icon: Clapperboard,
    noun: "storyboards",
    searchHint: "title, brand, format or shot",
  },
};

function assetGroup(
  key: string,
  assetKind: AssetKind,
  label: string,
  items: PickRow[],
): PickGroup {
  const meta = ASSET_KIND_META[assetKind];
  return {
    key,
    family: "asset",
    label,
    shortLabel: meta.label,
    noun: meta.noun,
    searchHint: meta.searchHint,
    assetKind,
    Icon: meta.Icon,
    layout: "rows",
    items,
  };
}

/** Built once at module load, and empty sets dropped here — so neither a
 *  heading nor a rail entry can exist for a kind with nothing in it. */
const ASSET_GROUPS: PickGroup[] = [
  assetGroup("saved-script", "script", "Saved scripts · Catalogue", scripts.map(savedScriptRow)),
  assetGroup(
    "generated-script",
    "script",
    "Genie-generated scripts",
    GENERATED_SCRIPTS.map(generatedScriptRow),
  ),
  assetGroup(
    "saved-concept",
    "concept",
    "Saved concepts · Catalogue",
    concepts.map(savedConceptRow),
  ),
  assetGroup(
    "generated-concept",
    "concept",
    "Genie-generated concepts",
    GENERATED_CONCEPTS.map(generatedConceptRow),
  ),
  assetGroup(
    "saved-storyboard",
    "storyboard",
    "Saved storyboards · Catalogue",
    storyboards.map(savedStoryboardRow),
  ),
  assetGroup(
    "generated-storyboard",
    "storyboard",
    "Genie-generated storyboards",
    GENERATED_STORYBOARDS.map(generatedStoryboardRow),
  ),
].filter((g) => g.items.length > 0);

const AD_NOUN = "ads";
const AD_HINT = "name, brand or module";

/** The Creative-Library universe. Also stands in for the `creative-library`
 *  flow module (its 8 curated refs are a subset of these 88 and keep their
 *  registry identity), so nothing lists Creative Library twice. */
const LIBRARY_MODULE_LABEL =
  FLOW_MODULES.find((m) => m.key === "creative-library")?.label ?? "Creative Library";

const ADGROUP_GROUP: PickGroup = {
  key: "creative-library",
  family: "ad",
  label: "Creative Library · adgroups",
  shortLabel: "Creative Library",
  noun: "adgroups",
  searchHint: "name, page, CTA or ad type",
  Icon: LayoutGrid,
  layout: "cards",
  items: LIBRARY_ADGROUPS.map((a) => adgroupRow(a, LIBRARY_MODULE_LABEL)),
};

const GENIE_GROUP: PickGroup = {
  key: "genie-output",
  family: "ad",
  label: "Your Genie generations",
  shortLabel: "Genie",
  noun: AD_NOUN,
  searchHint: AD_HINT,
  Icon: resolveIcon("Sparkles"),
  layout: "cards",
  items: sampleOutputs.map(outputRow),
};

/** The feeding modules whose refs carry enough to fill a Meta-ad card. Every
 *  other module's refs are a title, a line of evidence and a thumbnail — a
 *  card there would be a frame around three dashes. */
const CARD_MODULES = new Set<string>(["industry-insights", "reports"]);

/** §7 module order, straight off FLOW_MODULES — no second ordering here.
 *  creative-library is skipped: ADGROUP_GROUP is its universe. */
const MODULE_GROUPS: PickGroup[] = FLOW_MODULES.filter(
  (m) => m.state === "live" && m.key !== "creative-library",
)
  .map((m) => {
    const refs = sourcesForModule(m.key as FlowModuleKey);
    const competitor = Boolean(m.competitorOwned);
    const cards = CARD_MODULES.has(m.key);
    return {
      key: m.key,
      family: "ad" as Family,
      label: m.label,
      shortLabel: m.label,
      noun: AD_NOUN,
      searchHint: AD_HINT,
      Icon: resolveIcon(m.icon),
      layout: (cards ? "cards" : "rows") as PickGroup["layout"],
      items: refs.map((r) =>
        cards ? refCardRow(r, m.label, competitor) : refRow(r, m.label, competitor),
      ),
    };
  })
  .filter((g) => g.items.length > 0);

/** Everything that exists before the user adds anything, ad groups first.
 *  Built once at module load — 88 adgroups + 50 outputs + ~90 refs is not work
 *  to redo per render, and it is what lets the dropzone's chip counts be the
 *  SAME numbers this modal will show. */
const STATIC_GROUPS: PickGroup[] = [
  GENIE_GROUP,
  ADGROUP_GROUP,
  ...MODULE_GROUPS,
  ...ASSET_GROUPS,
];

const STATIC_AD_GROUPS = STATIC_GROUPS.filter((g) => g.family === "ad");
const STATIC_ASSET_GROUPS = STATIC_GROUPS.filter((g) => g.family === "asset");

/* ───────────────────────────────────── the dropzone's entry chips ──────── */

export interface SourceUniverseChip {
  key: string;
  family: Family;
  label: string;
  Icon: ElementType;
  /** How many things the modal will show. 0 only for the two local actions,
   *  where what is behind the chip does not exist until the user makes it. */
  count: number;
}

/**
 * One chip per universe that genuinely has something behind it, plus the two
 * local actions. DERIVED from `STATIC_GROUPS`, which is the same array this
 * modal renders — so a chip can never advertise a source or a count the modal
 * cannot show, and a module with no refs never gets an empty chip.
 */
export const SOURCE_UNIVERSE_CHIPS: SourceUniverseChip[] = [
  ...STATIC_AD_GROUPS.map((g) => ({
    key: g.key,
    family: "ad" as Family,
    label: g.shortLabel,
    Icon: g.Icon,
    count: g.items.length,
  })),
  { key: "upload", family: "ad", label: "Upload an ad", Icon: Upload, count: 0 },
  // One chip per asset KIND — it opens that kind's saved AND generated groups,
  // so "Scripts · 20" is the honest total of what the modal shows.
  ...(Object.keys(ASSET_KIND_META) as AssetKind[])
    .map((kind) => {
      const groups = STATIC_ASSET_GROUPS.filter((g) => g.assetKind === kind);
      return {
        key: `asset-${kind}`,
        family: "asset" as Family,
        label: ASSET_KIND_META[kind].label,
        Icon: ASSET_KIND_META[kind].Icon,
        count: groups.reduce((n, g) => n + g.items.length, 0),
      };
    })
    .filter((c) => c.count > 0),
  { key: "compose", family: "asset", label: "Paste or upload", Icon: Type, count: 0 },
];

/* ─────────────────────────────────────────────── the modal ─────────────── */

export function SourcePickerModal({
  universeKey,
  onClose,
  pendingFile,
  picked,
  onPick,
}: SourcePickerModalProps) {
  const open = universeKey !== null;
  const [query, setQuery] = useState("");
  /** The universe the modal is CURRENTLY showing. Starts at whatever chip
   *  opened it; the only thing that moves it afterwards is the per-family
   *  "browse every…" link and a file landing in the composer. */
  const [scopeKey, setScopeKey] = useState<string>("all-ads");
  /** Staged, not committed — the footer's Use button commits (SwapPicker). */
  const [pending, setPending] = useState<PickedThing | null>(picked);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [uploads, setUploads] = useState<UploadedAdStub[]>([]);
  const [drafts, setDrafts] = useState<LocalAsset[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  /** Which family the ONE hidden input is collecting for. A ref, because
   *  `.click()` fires in the same tick this is set. */
  const fileModeRef = useRef<Family>("ad");

  // Composer
  const [composeTab, setComposeTab] = useState<"enter" | "upload">("enter");
  /** No default — the user has to SAY script or concept; the stub is invalid
   *  without it, and guessing analyses a concept as a script. */
  const [composeKind, setComposeKind] = useState<AssetKind | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [assetFileName, setAssetFileName] = useState("");
  const [assetFileText, setAssetFileText] = useState("");
  const [assetFileError, setAssetFileError] = useState<string | null>(null);

  /** The static universes plus whatever the user has added in this session.
   *  Ad groups first, so a family's groups stay contiguous. */
  const groups = useMemo<PickGroup[]>(() => {
    const out: PickGroup[] = [];
    if (uploads.length) {
      out.push({
        key: "upload",
        family: "ad",
        label: "Uploaded ads",
        shortLabel: "Uploaded",
        noun: AD_NOUN,
        searchHint: AD_HINT,
        Icon: resolveIcon("Image"),
        layout: "rows",
        items: uploads.map(uploadRow),
      });
    }
    out.push(...STATIC_AD_GROUPS);
    if (drafts.length) {
      out.push({
        key: "asset-added",
        family: "asset",
        label: "Pasted & uploaded",
        shortLabel: "Pasted",
        noun: "assets",
        searchHint: "title or wording",
        Icon: Type,
        layout: "rows",
        items: drafts.map(localAssetRow),
      });
    }
    out.push(...STATIC_ASSET_GROUPS);
    return out;
  }, [uploads, drafts]);

  /** What a `universeKey` RESOLVES to: which groups it shows, and the copy for
   *  its heading and search box. One per group that has something in it, the
   *  two local actions, and the two family-wide scopes the "browse every…"
   *  link widens to. Derived from `groups`, so a universe can never claim a
   *  source the pane cannot show. */
  const universes = useMemo<Universe[]>(() => {
    const adGroupKeys = groups.filter((g) => g.family === "ad").map((g) => g.key);
    const assetGroupKeys = groups.filter((g) => g.family === "asset").map((g) => g.key);
    const list: Universe[] = [
      {
        key: "all-ads",
        family: "ad",
        label: "All ad sources",
        Icon: Sparkles,
        groups: adGroupKeys,
        noun: "ads",
        searchHint: "name, brand or module",
      },
      ...groups
        .filter((g) => g.family === "ad" && g.key !== "upload")
        .map((g) => ({
          key: g.key,
          family: "ad" as Family,
          label: g.shortLabel,
          Icon: g.Icon,
          groups: [g.key],
          noun: g.noun,
          searchHint: g.searchHint,
        })),
      {
        key: "upload",
        family: "ad",
        label: "Upload an ad",
        Icon: Upload,
        groups: ["upload"],
        noun: "ads",
        searchHint: "file name",
        uploadAction: true,
      },
      {
        key: "all-assets",
        family: "asset",
        label: "All assets",
        Icon: Sparkles,
        groups: assetGroupKeys,
        noun: "assets",
        searchHint: "title, brand, angle or framework",
      },
    ];
    // One entry per asset KIND — it opens that kind's saved AND generated
    // groups, so "Scripts · 20" is the honest total of what the pane shows.
    (Object.keys(ASSET_KIND_META) as AssetKind[]).forEach((kind) => {
      const keys = groups.filter((g) => g.assetKind === kind).map((g) => g.key);
      if (!keys.length) return;
      const meta = ASSET_KIND_META[kind];
      list.push({
        key: `asset-${kind}`,
        family: "asset",
        label: meta.label,
        Icon: meta.Icon,
        groups: keys,
        noun: meta.noun,
        searchHint: meta.searchHint,
      });
    });
    list.push({
      key: "compose",
      family: "asset",
      label: "Paste or upload",
      Icon: Type,
      groups: ["asset-added"],
      noun: "assets",
      searchHint: "title or wording",
      composeAction: true,
    });
    return list;
  }, [groups]);

  // Opening lands on the universe whose CHIP was clicked — never on a browse
  // index — and re-stages the flow's current source so a pick already made
  // shows as selected rather than as a blank slate.
  useEffect(() => {
    if (universeKey === null) return;
    setPending(picked);
    setQuery("");
    setExpanded({});
    setScopeKey(universeKey);
    if (!pendingFile) return;
    // A file dropped on the dropzone. A text file cannot say whether it is a
    // script or a concept, so it lands IN the composer (kind question first);
    // media is staged as an uploaded ad, which moves the scope itself.
    if (isTextFile(pendingFile)) {
      setScopeKey("compose");
      setComposeTab("upload");
      readAssetFile(pendingFile);
    } else {
      acceptAdFile(pendingFile);
    }
    // Keyed on `universeKey` alone: re-running on every `picked` change would
    // fight the user's staging inside an already-open modal, and `pendingFile`
    // is always set in the same commit that opens the modal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universeKey]);

  // Revoke every object URL this component minted EXCEPT one the caller may
  // still be holding — the pick outlives the modal, and revoking it would
  // blank the preview the flow is still showing. Assets are text: nothing to
  // revoke there.
  const uploadsRef = useRef<UploadedAdStub[]>([]);
  uploadsRef.current = uploads;
  const keepKeyRef = useRef<string | null>(null);
  keepKeyRef.current = picked ? pickedKey(picked) : null;
  useEffect(
    () => () => {
      uploadsRef.current.forEach((u) => {
        if (u.previewUrl && `upload:${u.id}` !== keepKeyRef.current) {
          URL.revokeObjectURL(u.previewUrl);
        }
      });
    },
    [],
  );

  const universe = universes.find((u) => u.key === scopeKey) ?? universes[0];
  const composeOpen = Boolean(universe?.composeAction);
  const scope = universe?.groups ?? null;
  const q = query.trim().toLowerCase();

  const visible = useMemo<PickGroup[]>(() => {
    return groups
      .filter((g) => !scope || scope.includes(g.key))
      .map((g) => ({
        ...g,
        items: q
          ? g.items.filter(
              (i) =>
                i.title.toLowerCase().includes(q) ||
                i.subtitle.toLowerCase().includes(q) ||
                (i.searchText ?? "").toLowerCase().includes(q) ||
                g.label.toLowerCase().includes(q),
            )
          : g.items,
      }))
      .filter((g) => g.items.length > 0);
    // `scope` is a fresh array each render; the keys it holds are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, scope?.join("|"), q]);

  const totalVisible = visible.reduce((n, g) => n + g.items.length, 0);
  const scopedTotal = groups
    .filter((g) => !scope || scope.includes(g.key))
    .reduce((n, g) => n + g.items.length, 0);
  const pendingKey = pending ? pickedKey(pending) : null;

  function localId(prefix: string): string {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  /** One upload path for the file dialog and the drop target alike. */
  function acceptAdFile(file: File) {
    const stub: UploadedAdStub = {
      id: localId("upl"),
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      mediaType: file.type.startsWith("video") ? "video" : "image",
    };
    setUploads((prev) => [stub, ...prev]);
    setScopeKey("upload");
    setQuery("");
    // Staged, not committed — the footer still confirms, same as every other
    // pick, so an accidental drop is one Cancel away.
    setPending({ family: "ad", ad: { kind: "upload", file: stub } });
  }

  /** `.txt`/`.md` ≤50 KB, read to text — ScriptRail's exact contract. */
  function readAssetFile(file: File) {
    setAssetFileError(null);
    if (file.size > MAX_ASSET_UPLOAD_BYTES) {
      setAssetFileName("");
      setAssetFileText("");
      setAssetFileError("File too large — max 50 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAssetFileText(String(reader.result ?? ""));
      setAssetFileName(file.name);
    };
    reader.onerror = () => setAssetFileError("Could not read that file.");
    reader.readAsText(file);
  }

  function isTextFile(file: File): boolean {
    return file.type.startsWith("text/") || /\.(txt|md|markdown)$/i.test(file.name);
  }

  /** The single hidden input serves both families. `accept` is set
   *  imperatively because `.click()` fires in this same tick. */
  function openFileDialog(mode: Family) {
    fileModeRef.current = mode;
    const input = fileInputRef.current;
    if (!input) return;
    input.accept = mode === "asset" ? ASSET_FILE_ACCEPT : AD_FILE_ACCEPT;
    input.click();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset so re-picking the same file still fires a change event.
    e.target.value = "";
    if (!file) return;
    if (fileModeRef.current === "asset") {
      setComposeTab("upload");
      readAssetFile(file);
      return;
    }
    acceptAdFile(file);
  }

  /** First non-empty line, so a pasted script names itself. */
  function deriveTitle(body: string, kind: AssetKind): string {
    const first = body
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.length > 0);
    if (!first) return `Pasted ${ASSET_NOUN[kind]}`;
    return first.length > 60 ? `${first.slice(0, 59)}…` : first;
  }

  function stageLocalAsset(asset: LocalAsset) {
    setDrafts((prev) => [asset, ...prev]);
    setPending({ family: "asset", asset });
  }

  function commitPaste() {
    const body = pasteText.trim();
    if (!composeKind || !body) return;
    const text: PastedAssetStub = {
      id: localId("pst"),
      assetKind: composeKind,
      title: deriveTitle(body, composeKind),
      body,
    };
    stageLocalAsset({ kind: "pasted-asset", text });
    setPasteText("");
  }

  function commitUpload() {
    const body = assetFileText.trim();
    if (!composeKind || !body) return;
    const file: UploadedAssetStub = {
      id: localId("uas"),
      assetKind: composeKind,
      name: assetFileName || `Uploaded ${ASSET_NOUN[composeKind]}`,
      body: assetFileText,
    };
    stageLocalAsset({ kind: "uploaded-asset", file });
    setAssetFileName("");
    setAssetFileText("");
  }

  function confirm() {
    if (!pending) return;
    onPick(pending);
  }

  const pendingRow = pending
    ? (groups.flatMap((g) => g.items).find((i) => i.key === pendingKey) ?? null)
    : null;
  const useLabel = pending
    ? pending.family === "ad"
      ? "Use this ad"
      : `Use this ${ASSET_NOUN[assetKindOf(pending.asset)]}`
    : "Use this source";

  const isAsset = universe?.family === "asset";
  /** The whole-family scope, reachable from the header link. Never where the
   *  modal STARTS — a chip always opens on its own universe. */
  const browseAllKey = isAsset ? "all-assets" : "all-ads";
  const browseAll = universes.find((u) => u.key === browseAllKey);
  const familyTotal = groups
    .filter((g) => g.family === (isAsset ? "asset" : "ad"))
    .reduce((n, g) => n + g.items.length, 0);
  const UniverseIcon = universe?.Icon ?? Sparkles;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      {/* 1120px: the card grid is 240px columns, so this fits four across with
          the rail gone, and still leaves the pane room at 1400px+.
          Desktop-only by §21.2, so no narrow fallback is attempted. */}
      <DialogContent className="g6-root flex h-[86vh] max-h-[860px] w-[95vw] max-w-[1120px] flex-col gap-0 overflow-hidden rounded-g6-card bg-g6-bg-base p-0">
        {/* The header IS the universe: the modal opened on one chip, so it
            names that one thing instead of offering a menu of them. */}
        <DialogHeader className="space-y-1 border-b border-g6-border px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 font-g6-sans text-[16px] font-semibold leading-6 text-g6-text">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-g6-base border border-g6-primary-border bg-g6-primary-bg">
              <UniverseIcon className="h-4 w-4 text-g6-primary-active" aria-hidden="true" />
            </span>
            {universe?.label ?? "Pick what to vary"}
            <span className="font-g6-mono text-[11px] font-semibold uppercase leading-4 tracking-wider text-g6-text-tertiary">
              {countLabel(scopedTotal, universe?.noun ?? "sources")}
            </span>
          </DialogTitle>
          <DialogDescription className="font-g6-sans text-[12px] leading-5 text-g6-text-secondary">
            {isAsset
              ? "Pick one script, concept or storyboard. Genie reads its words and builds whole ads from them."
              : "Pick one ad. Genie analyses it and builds the variations from it."}
            {browseAll && scopeKey !== browseAllKey && (
              <>
                {" "}
                <button
                  type="button"
                  onClick={() => {
                    setScopeKey(browseAllKey);
                    setQuery("");
                  }}
                  className="rounded-g6-pill font-g6-sans text-[12px] font-semibold leading-5 text-g6-primary-active hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border"
                >
                  Browse every {isAsset ? "asset" : "ad source"} ({familyTotal})
                </button>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-3 border-b border-g6-border px-4 py-3">
              <h3 className="min-w-0 font-g6-mono text-[11px] font-semibold uppercase leading-4 tracking-wider text-g6-text-secondary">
                {/* The family is restated on every heading — a list of scripts
                    must never read like a list of ads. */}
                <span className={isAsset ? "text-g6-primary-active" : "text-g6-text"}>
                  {isAsset ? "Vary one asset" : "Vary a whole ad"}
                </span>
              </h3>
              {!composeOpen && (
                <div className="relative ml-auto w-[340px]">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-g6-text-tertiary"
                    aria-hidden="true"
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label={`Search ${universe?.noun ?? "sources"} to vary`}
                    placeholder={`Search ${countLabel(scopedTotal, universe?.noun ?? "sources")} by ${universe?.searchHint}...`}
                    className="w-full rounded-g6-pill border border-g6-border bg-g6-bg-container py-2 pl-9 pr-8 font-g6-sans text-[12px] leading-5 text-g6-text outline-none placeholder:text-g6-text-tertiary focus-visible:border-g6-primary-border focus-visible:ring-2 focus-visible:ring-g6-primary-border"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      aria-label="Clear search"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-g6-pill p-0.5 text-g6-text-tertiary hover:text-g6-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (!file) return;
                  // A text file can't say whether it's a script or a concept,
                  // so it lands IN the composer (kind question first).
                  if (isTextFile(file)) {
                    setScopeKey("compose");
                    setComposeTab("upload");
                    readAssetFile(file);
                    return;
                  }
                  acceptAdFile(file);
                }}
                className={cn(
                  "flex min-h-full flex-col gap-4 p-4 transition-colors",
                  dragOver && "bg-g6-primary-bg",
                )}
              >
                {(universe?.uploadAction || dragOver) && (
                  <UploadDrop
                    dragOver={dragOver}
                    onBrowse={() => openFileDialog("ad")}
                  />
                )}

                {composeOpen && (
                  <AssetComposer
                    tab={composeTab}
                    onTab={setComposeTab}
                    kind={composeKind}
                    onKind={setComposeKind}
                    pasteText={pasteText}
                    onPasteText={setPasteText}
                    fileName={assetFileName}
                    fileText={assetFileText}
                    fileError={assetFileError}
                    onBrowse={() => openFileDialog("asset")}
                    onCommitPaste={commitPaste}
                    onCommitUpload={commitUpload}
                  />
                )}

                {totalVisible === 0
                  ? // With the composer or the dropzone open, an empty list is
                    // the expected state and that surface IS the way out — a
                    // zero-state card under it would be a second, redundant one.
                    !composeOpen &&
                    !universe?.uploadAction && (
                      <ZeroState
                        query={query}
                        noun={universe?.noun ?? "sources"}
                        family={universe?.family ?? "ad"}
                        emptyUniverseLabel={!q ? (universe?.label ?? null) : null}
                        onReset={() => {
                          setQuery("");
                          setScopeKey(
                            universe?.family === "asset" ? "all-assets" : "all-ads",
                          );
                        }}
                      />
                    )
                  : visible.map((g) => {
                      const cap = g.layout === "cards" ? CARD_CAP : ROW_CAP;
                      const capped = !q && !expanded[g.key];
                      const items = capped ? g.items.slice(0, cap) : g.items;
                      return (
                        <section key={g.key} className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <g.Icon
                              className="h-3.5 w-3.5 shrink-0 text-g6-primary"
                              aria-hidden="true"
                            />
                            <h4 className="font-g6-mono text-[11px] font-semibold uppercase leading-4 tracking-wider text-g6-text-secondary">
                              {g.label}
                            </h4>
                            <span className="font-g6-mono text-[11px] leading-4 tabular-nums text-g6-primary-active">
                              {g.items.length}
                            </span>
                          </div>

                          {g.layout === "cards" ? (
                            <div className="grid grid-cols-[repeat(auto-fill,240px)] justify-start gap-3">
                              {items.map((item) => (
                                <AdCardPick
                                  key={item.key}
                                  item={item}
                                  selected={pendingKey === item.key}
                                  onSelect={() => setPending(item.picked)}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {items.map((item) => (
                                <SourceRow
                                  key={item.key}
                                  item={item}
                                  selected={pendingKey === item.key}
                                  onSelect={() => setPending(item.picked)}
                                />
                              ))}
                            </div>
                          )}

                          {capped && g.items.length > cap && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpanded((prev) => ({ ...prev, [g.key]: true }))
                              }
                              className="self-start rounded-g6-pill px-1 font-g6-sans text-[11px] font-semibold leading-4 text-g6-primary-active hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border"
                            >
                              Show all {g.items.length} in {g.label}
                            </button>
                          )}
                        </section>
                      );
                    })}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer — what is staged, and the only two ways out. */}
        <div className="flex items-center gap-3 border-t border-g6-border bg-g6-bg-container px-4 py-3">
          <div className="min-w-0 flex-1">
            {pendingRow ? (
              <div className="flex min-w-0 items-center gap-2">
                <span className="inline-flex shrink-0 items-center gap-1 rounded-g6-pill bg-g6-primary-bg px-2 py-0.5 font-g6-mono text-[10px] font-bold uppercase leading-4 tracking-wider text-g6-primary-active">
                  <Check className="h-3 w-3" aria-hidden="true" />
                  Selected
                </span>
                <span className="min-w-0 truncate font-g6-sans text-[12px] leading-5 text-g6-text">
                  {pendingRow.title}
                </span>
                {pendingRow.competitor && (
                  // §7.2 — say plainly whose ad the variation is FOR, because
                  // the item's own brand chip names the competitor.
                  <span className="shrink-0 font-g6-sans text-[11px] leading-4 text-warning-text">
                    Competitor ad — variations are built for your own brand
                  </span>
                )}
              </div>
            ) : (
              <span className="font-g6-sans text-[12px] leading-5 text-g6-text-tertiary">
                Nothing selected yet — pick one ad, script, concept or storyboard.
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex shrink-0 items-center rounded-g6-pill border border-g6-border bg-g6-bg-container px-4 py-1.5 font-g6-sans text-[12px] font-semibold leading-5 text-g6-text hover:border-g6-primary-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!pending}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-g6-pill px-5 py-1.5 font-g6-sans text-[12px] font-bold leading-5 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border",
              pending
                ? "bg-g6-primary text-g6-text-on-accent shadow-g6-primary-btn hover:opacity-90"
                : "cursor-not-allowed bg-g6-bg-muted text-g6-text-disabled",
            )}
          >
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            {useLabel}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={AD_FILE_ACCEPT}
          onChange={handleFile}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
}

function assetKindOf(asset: PickedAsset): AssetKind {
  if (asset.kind === "pasted-asset") return asset.text.assetKind;
  if (asset.kind === "uploaded-asset") return asset.file.assetKind;
  return asset.assetKind;
}

/* ─────────────────────────────────────────────── pieces ────────────────── */

/**
 * One pickable ad in the Meta-ad card — a Genie generation, a library adgroup,
 * an Industry Insights ad or a Reports ad, all through the one `AdgroupCard`.
 * Plus this picker's own concerns: single-select (so no `onToggleSelect`
 * checkbox, which would read as multi-select), the §7.2 competitor chip, and
 * an unpickable source stating its reason instead of being a silently dead
 * tile (NN/g #1).
 */
function AdCardPick({
  item,
  selected,
  onSelect,
}: {
  item: PickRow;
  selected: boolean;
  onSelect: () => void;
}) {
  const blocked = Boolean(item.blocked);
  const BlockedIcon = item.blockedIcon ?? Lock;
  if (!item.card) return null;
  return (
    <div className="flex flex-col gap-1">
      <AdgroupCard
        data={item.card}
        selected={selected && !blocked}
        onClick={blocked ? undefined : onSelect}
        className={blocked ? "cursor-not-allowed opacity-60" : undefined}
      />
      {/* No competitor chip here: `AdCardData.competitor` puts §7.2's mark ON
          the card, over the media, and a second one under it would read as two
          different claims. What stays below are the two things the card has no
          slot for. */}
      {(item.staticOnly || item.note) && (
        <div className="flex flex-wrap items-center gap-1">
          {item.staticOnly && <Chip>Static output only</Chip>}
          {item.note && <Chip>{item.note}</Chip>}
        </div>
      )}
      {item.blocked && (
        <p className="flex items-start gap-1 font-g6-sans text-[10.5px] font-medium leading-4 text-warning-text">
          <BlockedIcon className="mt-0.5 h-2.5 w-2.5 shrink-0" aria-hidden="true" />
          <span className="line-clamp-2">{item.blocked}</span>
        </p>
      )}
    </div>
  );
}

/** One non-adgroup source. Row, not card, because the underlying data has no
 *  page, copy ids, mosaic or CTA — see the header comment. */
function SourceRow({
  item,
  selected,
  onSelect,
}: {
  item: PickRow;
  selected: boolean;
  onSelect: () => void;
}) {
  const blocked = Boolean(item.blocked);
  const BlockedIcon = item.blockedIcon ?? Lock;
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={blocked}
      aria-disabled={blocked}
      aria-pressed={selected}
      className={cn(
        "flex items-center gap-3 rounded-g6-card border bg-g6-bg-container p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border",
        blocked
          ? "cursor-not-allowed border-g6-border-secondary opacity-60"
          : "border-g6-border-secondary hover:border-g6-primary-border hover:shadow-g6-sm",
        selected &&
          !blocked &&
          "border-g6-primary-border bg-g6-primary-bg ring-2 ring-g6-primary-border",
      )}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-g6-base bg-g6-bg-muted">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="font-g6-mono text-[10px] font-bold uppercase leading-4 text-g6-text-tertiary">
            {item.initials}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        {/* `truncate` on both lines — mock titles run past 60 chars and a
            wrapping title pushes every chip below the fold. */}
        <p className="truncate font-g6-sans text-[12px] font-semibold leading-5 text-g6-text">
          {item.title}
        </p>
        <p className="truncate font-g6-sans text-[11px] leading-4 text-g6-text-secondary">
          {item.subtitle}
        </p>
        <div className="flex flex-wrap items-center gap-1 pt-0.5">
          {item.competitor && <Chip tone="warn">Competitor</Chip>}
          {item.staticOnly && <Chip>Static output only</Chip>}
          {item.note && <Chip>{item.note}</Chip>}
          {item.chips.map((c, i) => (
            <Chip key={`${c}-${i}`}>{c}</Chip>
          ))}
        </div>
        {item.blocked && (
          <p className="flex items-start gap-1 pt-0.5 font-g6-sans text-[10.5px] font-medium leading-4 text-warning-text">
            <BlockedIcon className="mt-0.5 h-2.5 w-2.5 shrink-0" aria-hidden="true" />
            <span className="line-clamp-2">{item.blocked}</span>
          </p>
        )}
      </div>

      {selected && !blocked ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-g6-pill bg-g6-primary px-2 py-0.5 font-g6-mono text-[9px] font-bold uppercase leading-4 tracking-wider text-g6-text-on-accent">
          <Check className="h-2.5 w-2.5" aria-hidden="true" />
          Selected
        </span>
      ) : (
        item.analysed !== undefined && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-g6-pill px-2 py-0.5 font-g6-mono text-[9px] font-bold uppercase leading-4 tracking-wider",
              item.analysed
                ? "bg-g6-primary-bg text-g6-primary-active"
                : "bg-g6-bg-muted text-g6-text-tertiary",
            )}
          >
            {item.analysed ? (
              <CheckCircle2 className="h-2.5 w-2.5" aria-hidden="true" />
            ) : (
              <Clock className="h-2.5 w-2.5" aria-hidden="true" />
            )}
            {item.analysed ? "Analysed" : "Not analysed"}
          </span>
        )
      )}
    </button>
  );
}

function Chip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "warn";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-g6-pill px-1.5 py-0.5 font-g6-mono text-[9px] font-semibold uppercase leading-4 tracking-wide",
        tone === "warn"
          ? "border border-warning-text/30 bg-warning-text/10 text-warning-text"
          : "bg-g6-bg-muted text-g6-text-secondary",
      )}
    >
      {children}
    </span>
  );
}

/** The ad drop target. Dashed but ACCENTED at rest — a fully neutral dashed
 *  box reads disabled; a drag deepens the same hue and fills the tint. */
function UploadDrop({ dragOver, onBrowse }: { dragOver: boolean; onBrowse: () => void }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-g6-card border-2 border-dashed px-4 py-8 text-center transition-colors",
        dragOver
          ? "border-g6-primary-border bg-g6-primary-bg"
          : "border-g6-primary bg-g6-bg-container",
      )}
    >
      <Upload className="h-6 w-6 text-g6-primary" aria-hidden="true" />
      <p className="font-g6-sans text-[13px] leading-5 text-g6-text">
        Drop an ad anywhere in this panel, or browse for one
      </p>
      <p className="font-g6-mono text-[10px] uppercase leading-4 tracking-wider text-g6-text-tertiary">
        Image or video · a .txt / .md file becomes a script or concept instead
      </p>
      <button
        type="button"
        onClick={onBrowse}
        className="mt-1 rounded-g6-pill border border-g6-border bg-g6-bg-container px-4 py-1.5 font-g6-sans text-[11px] font-semibold leading-4 text-g6-text hover:border-g6-primary-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border"
      >
        Browse files
      </button>
      <p className="max-w-md font-g6-sans text-[11px] leading-4 text-g6-text-secondary">
        An uploaded ad carries no catalogue provenance — Genie reads it from the file
        alone, so brand and product may come back as not found.
      </p>
    </div>
  );
}

/**
 * Paste / upload an asset. Modelled on ScriptRail's Enter + Upload tabs (same
 * accept, same 50 KB ceiling, same counter, same preview-then-confirm), so a
 * user who has written a script in Studio already knows this surface.
 *
 * The KIND question comes first and unanswered by default: the stub is invalid
 * without an `assetKind`, and guessing analyses a concept as a script.
 */
function AssetComposer({
  tab,
  onTab,
  kind,
  onKind,
  pasteText,
  onPasteText,
  fileName,
  fileText,
  fileError,
  onBrowse,
  onCommitPaste,
  onCommitUpload,
}: {
  tab: "enter" | "upload";
  onTab: (t: "enter" | "upload") => void;
  kind: AssetKind | null;
  onKind: (k: AssetKind) => void;
  pasteText: string;
  onPasteText: (v: string) => void;
  fileName: string;
  fileText: string;
  fileError: string | null;
  onBrowse: () => void;
  onCommitPaste: () => void;
  onCommitUpload: () => void;
}) {
  const body = tab === "enter" ? pasteText : fileText;
  const hasBody = body.trim().length > 0;
  const ready = Boolean(kind) && hasBody;
  const words = pasteText.trim() ? pasteText.trim().split(/\s+/).length : 0;
  const addLabel = kind ? `Add this ${ASSET_NOUN[kind]}` : "Add this asset";

  return (
    <div className="flex flex-col gap-4 rounded-g6-card border border-g6-border bg-g6-bg-container p-3">
      <div className="flex flex-col gap-1.5">
        <p className="font-g6-mono text-[10px] font-bold uppercase leading-4 tracking-wider text-g6-primary-active">
          1 · What are you adding?
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {COMPOSABLE_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => onKind(k)}
              className={cn(
                "inline-flex items-center gap-1 rounded-g6-pill border py-1 pl-[9px] pr-2.5 font-g6-sans text-[11px] leading-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border",
                kind === k
                  ? "border-g6-primary-border bg-g6-primary-bg text-g6-primary"
                  : "border-g6-border-secondary bg-g6-bg-base text-g6-text-secondary hover:border-g6-primary-border hover:text-g6-text",
              )}
            >
              {k === "script" ? (
                <FileText className="h-3.5 w-3.5 shrink-0 text-g6-primary" aria-hidden="true" />
              ) : (
                <Lightbulb className="h-3.5 w-3.5 shrink-0 text-g6-primary" aria-hidden="true" />
              )}
              {k === "script" ? "A script" : "A concept"}
            </button>
          ))}
        </div>
        <p className="font-g6-sans text-[11px] leading-5 text-g6-text-secondary">
          A storyboard is a script plus visual directions — so there is nothing separate
          to paste. Paste the script, then add the visuals as a variation in this flow.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-g6-mono text-[10px] font-bold uppercase leading-4 tracking-wider text-g6-primary-active">
          2 · Where are the words?
        </p>
        <div className="flex w-full max-w-[280px] items-center gap-1 rounded-g6-pill border border-g6-border bg-g6-bg-base p-0.5">
          <ComposerTab active={tab === "enter"} onClick={() => onTab("enter")} Icon={Type}>
            Paste
          </ComposerTab>
          <ComposerTab active={tab === "upload"} onClick={() => onTab("upload")} Icon={Upload}>
            Upload
          </ComposerTab>
        </div>

        {tab === "enter" ? (
          <div className="flex flex-col gap-2">
            <textarea
              rows={8}
              value={pasteText}
              onChange={(e) => onPasteText(e.target.value)}
              aria-label="Paste the asset text"
              placeholder={
                kind === "concept"
                  ? "Paste the concept — hook, tone, and the visual direction in your own words…"
                  : "Paste or type the script…"
              }
              className="w-full rounded-g6-base border border-g6-border bg-g6-bg-base p-3 font-g6-sans text-[12px] leading-6 text-g6-text outline-none placeholder:text-g6-text-tertiary focus-visible:border-g6-primary-border focus-visible:ring-2 focus-visible:ring-g6-primary-border"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-g6-mono text-[10px] leading-4 tabular-nums text-g6-text-tertiary">
                {pasteText.length} chars · {words} {words === 1 ? "word" : "words"}
              </span>
              <CommitButton
                ready={ready}
                kind={kind}
                hasBody={hasBody}
                label={addLabel}
                onClick={onCommitPaste}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col items-center gap-2 rounded-g6-base border-2 border-dashed border-g6-primary bg-g6-bg-base px-4 py-6 text-center">
              <Upload className="h-5 w-5 text-g6-primary" aria-hidden="true" />
              <p className="font-g6-sans text-[13px] leading-5 text-g6-text">
                Drop a text file in this panel, or browse for one
              </p>
              <p className="font-g6-mono text-[10px] uppercase leading-4 tracking-wider text-g6-text-tertiary">
                .txt or .md, up to 50 KB
              </p>
              <button
                type="button"
                onClick={onBrowse}
                className="rounded-g6-pill border border-g6-border bg-g6-bg-container px-4 py-1.5 font-g6-sans text-[11px] font-semibold leading-4 text-g6-text hover:border-g6-primary-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border"
              >
                Browse files
              </button>
              {fileError && (
                <p className="flex items-center gap-1 font-g6-sans text-[11px] font-medium leading-4 text-warning-text">
                  <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
                  {fileError}
                </p>
              )}
            </div>

            {fileText && (
              <div className="flex flex-col gap-2 rounded-g6-base border border-g6-border bg-g6-bg-base p-3">
                <p className="truncate font-g6-mono text-[10px] uppercase leading-4 tracking-wider text-g6-text-tertiary">
                  {fileName}
                </p>
                <pre className="max-h-[180px] overflow-y-auto whitespace-pre-wrap font-g6-sans text-[11px] leading-5 text-g6-text-secondary">
                  {fileText}
                </pre>
                <div className="flex justify-end">
                  <CommitButton
                    ready={ready}
                    kind={kind}
                    hasBody={hasBody}
                    label={addLabel}
                    onClick={onCommitUpload}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Commit + the reason it can't commit yet, stated rather than left to a
 *  greyed-out button the user has to guess about (NN/g #1 / #9). */
function CommitButton({
  ready,
  kind,
  hasBody,
  label,
  onClick,
}: {
  ready: boolean;
  kind: AssetKind | null;
  hasBody: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {!ready && (
        <span className="font-g6-sans text-[11px] leading-4 text-g6-text-tertiary">
          {!kind
            ? "Say whether it's a script or a concept"
            : !hasBody
              ? "Add the words first"
              : ""}
        </span>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={!ready}
        className={cn(
          "inline-flex items-center gap-1 rounded-g6-pill px-4 py-1.5 font-g6-sans text-[11px] font-bold leading-4 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border",
          ready
            ? "bg-g6-primary text-g6-text-on-accent hover:opacity-90"
            : "cursor-not-allowed bg-g6-bg-muted text-g6-text-disabled",
        )}
      >
        <Check className="h-3 w-3" aria-hidden="true" />
        {label}
      </button>
    </div>
  );
}

function ComposerTab({
  active,
  onClick,
  Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  Icon: ElementType;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-1.5 rounded-g6-pill px-3 py-1 font-g6-sans text-[11px] font-semibold leading-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border",
        active
          ? "bg-g6-primary-bg text-g6-primary"
          : "text-g6-text-secondary hover:text-g6-text",
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      {children}
    </button>
  );
}

/** Zero-data: a search matching nothing, or a universe with nothing in it.
 *  Both name the way out, in the family's own language. */
function ZeroState({
  query,
  noun,
  family,
  emptyUniverseLabel,
  onReset,
}: {
  query: string;
  noun: string;
  family: Family;
  emptyUniverseLabel: string | null;
  onReset: () => void;
}) {
  const singular = noun.replace(/s$/, "");
  return (
    <div className="flex flex-col items-center gap-2 rounded-g6-card border border-dashed border-g6-border bg-g6-bg-container px-4 py-10 text-center">
      <Sparkles className="h-4 w-4 text-g6-primary" aria-hidden="true" />
      <p className="font-g6-sans text-[13px] font-semibold leading-5 text-g6-text">
        {query ? (
          <>
            No {singular} matches &ldquo;{query}&rdquo;
          </>
        ) : emptyUniverseLabel ? (
          <>Nothing under {emptyUniverseLabel} yet</>
        ) : (
          "Nothing in this source yet"
        )}
      </p>
      <p className="max-w-sm font-g6-sans text-[11px] leading-4 text-g6-text-secondary">
        {family === "asset"
          ? "Try a brand, an angle or a framework — or paste the script you want to vary."
          : "Try a brand name, a page name, or drop the ad you want to vary into this panel."}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-1 rounded-g6-pill px-2 font-g6-sans text-[11px] font-semibold leading-4 text-g6-primary-active hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border"
      >
        {family === "asset" ? "Show every asset" : "Show every ad source"}
      </button>
    </div>
  );
}
