import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clapperboard,
  Clock,
  FileText,
  Lightbulb,
  Lock,
  Search,
  Sparkles,
  Type,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getBrand } from "@/mocks/shared/brands";
import { concepts } from "@/mocks/shared/concepts";
import { scripts, type ScriptAsset } from "@/mocks/shared/scripts";
import { storyboards, type StoryboardAsset } from "@/mocks/shared/storyboards";
import type { FlowModuleKey, FlowSourceRef } from "../../flows/flowTypes";
import { FLOW_MODULES } from "../../flows/data/flowRegistry";
import { sourcesForModule } from "../../flows/data/flowSources";
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
import type {
  AssetKind,
  PastedAssetStub,
  PickedAsset,
  PickedThing,
  UploadedAdStub,
  UploadedAssetStub,
} from "../types";

/**
 * SourcePicker — Step 1 of Generate Variations: pick ONE thing to vary.
 *
 * Renders INLINE, never as its own modal — the screen owns its framing,
 * so this component
 * makes no assumptions about the box it sits in beyond `className`.
 *
 * TWO FAMILIES, one dropzone (Part 2). A run varies EITHER a whole ad OR one
 * asset, so the chips are split into two labelled rows — "Vary a whole ad"
 * and "Vary one asset" — and every heading, count noun and picked-card kicker
 * names the family back. That distinction is the thing this screen has to
 * communicate, so it is structural (two rows, a rule between them, the active
 * row's label turning primary), not just a wording difference.
 *
 * WHOLE AD pool — three universes under one grammar:
 *   · Genie's own outputs   (`sampleOutputs`, read-only — 15+ importers hold
 *                            that exact array reference; never fork or mutate)
 *   · Other Flows' refs     (`FLOW_SOURCES` via `sourcesForModule`, in the
 *                            §7 module order `FLOW_MODULES` already defines)
 *   · A local upload        (object-URL preview, nothing leaves the browser)
 *
 * ASSET pool — three kinds (Script / Concept / Storyboard), each of which has
 * a saved half and a generated half:
 *   · Saved in Catalogue    (`mocks/shared/{scripts,concepts,storyboards}`)
 *   · Genie-generated       (`library/tabs/generatedAssetPool`)
 *   · Pasted or uploaded    (text only — `.txt`/`.md` ≤50 KB, matching
 *                            `studio-v4/components/ScriptRail.tsx`'s
 *                            Enter/Upload affordances and limit, which is the
 *                            precedent for hand-authoring a script here)
 *
 * Tile grammar, module labels and the module icon map are all REUSED from
 * `flows/` (FlowModuleDetail's SourceRow, FLOW_MODULES[].label,
 * `resolveIcon`) rather than re-invented, so a variation source reads exactly
 * like the same ad does in Other Flows.
 */

export interface SourcePickerProps {
  picked: PickedThing | null;
  onPick: (picked: PickedThing) => void;
  onClear?: () => void;
  className?: string;
}

/** Rows shown per group before "Show all" — 94 refs (or 47 concepts) in one
 *  flat list is not a list, it's a scroll. Lifted whenever a query narrows. */
const GROUP_CAP = 6;

/** Same ceiling ScriptRail enforces for a pasted/dropped script file. */
const MAX_ASSET_UPLOAD_BYTES = 50 * 1024;

const AD_FILE_ACCEPT = "image/*,video/*";
const ASSET_FILE_ACCEPT = ".txt,.md,text/plain,text/markdown";

type Family = "ad" | "asset";

/** The two PickedAsset kinds this component can mint locally. */
type LocalAsset = Extract<
  PickedAsset,
  { kind: "uploaded-asset" } | { kind: "pasted-asset" }
>;

/**
 * Kinds the composer offers. Storyboard is deliberately absent: Maalik,
 * 2026-09-09 — "a storyboard is nothing but a script with visual directions",
 * and the app has no hand-authoring path for one. Pasting a SCRIPT and adding
 * visuals later in this flow IS the storyboard-authoring route, so offering
 * "paste a storyboard" would invent a second, dead one.
 */
const COMPOSABLE_KINDS: AssetKind[] = ["script", "concept"];

/* ────────────────────────────────────────────────────────── *
 *  The entry chips inside the dropzone. One chip per universe
 *  that genuinely has something behind it — DERIVED from the
 *  same `groups` the list renders, plus the two local actions
 *  (upload an ad / paste-or-upload an asset). No chip carries
 *  a data universe of its own, so a chip can never advertise
 *  a source the list can't show.
 * ────────────────────────────────────────────────────────── */

interface UniverseDef {
  key: string;
  family: Family;
  /** Short chip label. `PickGroup.chipLabel`, so there is one source of copy. */
  label: string;
  Icon: ReturnType<typeof resolveIcon>;
  /** Group keys this chip reveals, in order. */
  groups: string[];
  /** Plural noun for headings, counts and the search placeholder. */
  noun: string;
  /** Tail of the search placeholder: "by name, brand or module". */
  searchHint: string;
  /** Opens the file dialog instead of (only) revealing a list. */
  uploadAction?: boolean;
  /** Reveals the paste/upload composer above the list. */
  composeAction?: boolean;
}

/* ────────────────────────────────────────────────────────── *
 *  Display model — one shape every tile renders from, so the
 *  source universes cannot drift into six tile styles.
 * ────────────────────────────────────────────────────────── */

interface PickItem {
  /** `${kind}:${id}` — kind-scoped because an output id and a ref id for the
   *  same underlying ad are the same string (see flowSources' sampleOutputRef),
   *  and a saved script id and its generated twin could collide too. */
  key: string;
  title: string;
  subtitle: string;
  thumbnail?: string;
  /** Thumbnail fallback for the partial case (no image on the source). */
  initials: string;
  chips: { label: string; value: string }[];
  /** Extra haystack (tags, angle, framework, brand) — chips are identity, so
   *  a user searching what the row SHOWS has to match. Never rendered. */
  searchText?: string;
  competitor: boolean;
  staticOnly: boolean;
  note?: string;
  /** undefined = the source module has no analysis step at all. */
  analysed?: boolean;
  /** Set = unpickable, and this is the reason stated ON the row. */
  blocked?: string;
  /** Lock reads as "go clear a gate"; a failed generation never clears. */
  blockedIcon?: ReturnType<typeof resolveIcon>;
  picked: PickedThing;
}

interface PickGroup {
  key: string;
  family: Family;
  /** Section heading, e.g. "Your Genie generations". */
  label: string;
  /** Chip form of the same thing — a chip has ~10 chars of room, a heading
   *  doesn't. Same field, one place, so the two can't describe different sets. */
  chipLabel: string;
  noun: string;
  searchHint: string;
  /** Asset groups only — which kind chip reveals this group. */
  assetKind?: AssetKind;
  Icon: ReturnType<typeof resolveIcon>;
  items: PickItem[];
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

/** Long asset bodies are the identity of a script — but on one line. */
function snippet(text: string, max = 96): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

function brandNameOf(brandId?: string): string | undefined {
  return brandId ? getBrand(brandId)?.name : undefined;
}

const ASSET_NOUN: Record<AssetKind, string> = {
  script: "script",
  concept: "concept",
  storyboard: "storyboard",
};

/* ────────────────────────────────────────────────────────── *
 *  Whole-ad items
 * ────────────────────────────────────────────────────────── */

/**
 * A ref is unpickable only when its module ran an analysis step and it came
 * back unfinished (`analysed === false`). `undefined` means the module has no
 * such step (Campaign URLs, most Dashboard rows) — blocking those would invent
 * a gate the user cannot clear. `blockedReason` wins over the generic sentence
 * because Trends' rows fail for a reason the user can't "go analyse" away.
 */
function blockedFor(ref: FlowSourceRef, moduleLabel: string): string | undefined {
  if (ref.analysed !== false) return undefined;
  return ref.blockedReason ?? `Needs analysis in ${moduleLabel} before Genie can read this ad`;
}

function refItem(ref: FlowSourceRef, moduleLabel: string, moduleCompetitor: boolean): PickItem {
  return {
    key: `flow-ref:${ref.id}`,
    title: ref.title || "Untitled ad",
    subtitle: ref.subtitle,
    thumbnail: ref.thumbnail,
    initials: initialsOf(ref.sourceBrandName, ref.title),
    chips: [{ label: "", value: ref.sourceBrandName }, ...(ref.metrics ?? [])],
    searchText: [ref.sourceBrandName, ref.sourceFormat, ref.sourceNote].filter(Boolean).join(" "),
    // §7.2 — module-level OR ref-level. Dashboard aggregates Insights'
    // competitor rows next to the user's own, so the per-ref flag matters.
    competitor: moduleCompetitor || Boolean(ref.competitorOwned),
    staticOnly: ref.sourceFormat === "carousel" || ref.sourceFormat === "flexible",
    note: ref.sourceNote,
    analysed: ref.analysed,
    blocked: blockedFor(ref, moduleLabel),
    picked: { family: "ad", ad: { kind: "flow-ref", ref } },
  };
}

function outputItem(out: OutputData): PickItem {
  // var_zerocase carries empty strings for brand/headline on purpose — every
  // field here has to survive that without rendering a blank tile.
  const title = out.headline || out.product?.name || out.brand?.name || "Untitled generation";
  const subtitleParts = [out.brand?.name, out.product?.name, out.format ?? out.mediaType].filter(
    (p): p is string => Boolean(p),
  );
  const chips: { label: string; value: string }[] = [];
  if (out.brand?.name) chips.push({ label: "", value: out.brand.name });
  if (out.qualityScore !== undefined) chips.push({ label: "Quality", value: String(out.qualityScore) });
  return {
    key: `genie-output:${out.id}`,
    title,
    subtitle: subtitleParts.length ? subtitleParts.join(" · ") : "No brand or product recorded",
    thumbnail: out.thumbnail,
    initials: initialsOf(out.brand?.name, out.product?.name, "Genie"),
    chips,
    competitor: false,
    staticOnly: false,
    // Genie's own past generations have nothing left to analyse — they were
    // produced here, with their config already on record.
    analysed: true,
    picked: { family: "ad", ad: { kind: "genie-output", output: out } },
  };
}

function uploadItem(file: UploadedAdStub): PickItem {
  return {
    key: `upload:${file.id}`,
    title: file.name,
    subtitle: `Uploaded ${file.mediaType} · no catalogue provenance`,
    thumbnail: file.mediaType === "image" ? file.previewUrl : undefined,
    initials: initialsOf(file.name),
    chips: [{ label: "", value: file.mediaType }],
    competitor: false,
    staticOnly: false,
    picked: { family: "ad", ad: { kind: "upload", file } },
  };
}

/* ────────────────────────────────────────────────────────── *
 *  Asset items. Each kind is identified by the fields that
 *  actually tell two of them apart: a script by framework +
 *  duration, a concept by angle + tone, a storyboard by scene
 *  count + format. Assets have no analysis gate, so `analysed`
 *  stays undefined and no badge is claimed — except a FAILED
 *  generation, which is genuinely unpickable and says so.
 * ────────────────────────────────────────────────────────── */

function assetPick(
  kind: "saved-asset" | "generated-asset",
  assetKind: AssetKind,
  id: string,
): PickedThing {
  return { family: "asset", asset: { kind, assetKind, id } };
}

function savedScriptItem(s: ScriptAsset): PickItem {
  const brand = brandNameOf(s.brandId);
  return {
    key: `saved-asset:script:${s.id}`,
    title: s.title,
    subtitle: snippet(s.body),
    initials: initialsOf(brand, s.title),
    chips: [
      ...(brand ? [{ label: "", value: brand }] : []),
      { label: "", value: s.framework },
      { label: "", value: `${s.durationSec}s` },
    ],
    searchText: [brand, s.framework, ...s.tags].filter(Boolean).join(" "),
    competitor: false,
    staticOnly: false,
    picked: assetPick("saved-asset", "script", s.id),
  };
}

function savedConceptItem(c: Concept): PickItem {
  const brand = brandNameOf(c.brandId);
  return {
    key: `saved-asset:concept:${c.id}`,
    title: c.name,
    subtitle: c.hook || snippet(c.visualDirection),
    initials: initialsOf(brand, c.name),
    chips: [
      ...(brand ? [{ label: "", value: brand }] : []),
      { label: "", value: c.angle },
      { label: "", value: c.tone },
      { label: "", value: c.format },
    ],
    searchText: [brand, c.angle, c.tone, c.format, c.visualDirection].filter(Boolean).join(" "),
    competitor: false,
    staticOnly: false,
    picked: assetPick("saved-asset", "concept", c.id),
  };
}

function savedStoryboardItem(sb: StoryboardAsset): PickItem {
  const brand = brandNameOf(sb.brandId);
  const seconds = sb.scenes.reduce((n, sc) => n + sc.durationSec, 0);
  return {
    key: `saved-asset:storyboard:${sb.id}`,
    title: sb.title,
    subtitle: sb.scenes[0] ? `Opens on ${sb.scenes[0].shot} — ${snippet(sb.scenes[0].description, 64)}` : "No scenes recorded",
    thumbnail: sb.thumbnail,
    initials: initialsOf(brand, sb.title),
    chips: [
      ...(brand ? [{ label: "", value: brand }] : []),
      { label: "", value: `${sb.scenes.length} scenes` },
      { label: "", value: sb.formatLabel },
      { label: "", value: `${seconds}s` },
    ],
    searchText: [brand, sb.productName, sb.formatLabel, ...sb.tags, ...sb.scenes.map((sc) => sc.shot)]
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

function generatedScriptItem(g: GeneratedScriptItem): PickItem {
  return {
    key: `generated-asset:script:${g.id}`,
    title: g.title,
    subtitle: snippet(g.body),
    initials: initialsOf(g.brandName, g.title),
    chips: [
      { label: "", value: g.brandName },
      { label: "", value: g.framework },
      { label: "", value: `${g.durationSec}s` },
    ],
    note: g.batchId,
    searchText: [g.brandName, g.productName, g.framework, g.module, ...g.tags].filter(Boolean).join(" "),
    competitor: false,
    staticOnly: false,
    blocked: generatedBlock(g.status, "script"),
    blockedIcon: AlertTriangle,
    picked: assetPick("generated-asset", "script", g.id),
  };
}

function generatedConceptItem(g: GeneratedConceptItem): PickItem {
  return {
    key: `generated-asset:concept:${g.id}`,
    title: g.name,
    subtitle: g.hook,
    thumbnail: g.thumbnail,
    initials: initialsOf(g.brandName, g.name),
    chips: [
      { label: "", value: g.brandName },
      { label: "", value: g.angle },
      { label: "", value: g.tone },
      { label: "", value: g.formatLabel },
    ],
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

function generatedStoryboardItem(g: GeneratedStoryboardItem): PickItem {
  const seconds = g.scenes.reduce((n, sc) => n + sc.durationSec, 0);
  return {
    key: `generated-asset:storyboard:${g.id}`,
    title: g.title,
    subtitle: g.scenes[0]
      ? `Opens on ${g.scenes[0].shot} — ${snippet(g.scenes[0].description, 64)}`
      : "No scenes recorded",
    thumbnail: g.thumbnail,
    initials: initialsOf(g.brandName, g.title),
    chips: [
      { label: "", value: g.brandName },
      { label: "", value: `${g.scenes.length} scenes` },
      { label: "", value: g.formatLabel },
      { label: "", value: `${seconds}s` },
    ],
    note: g.batchId,
    searchText: [g.brandName, g.productName, g.formatLabel, g.module, ...g.tags].filter(Boolean).join(" "),
    competitor: false,
    staticOnly: false,
    blocked: generatedBlock(g.status, "storyboard"),
    blockedIcon: AlertTriangle,
    picked: assetPick("generated-asset", "storyboard", g.id),
  };
}

function localAssetItem(asset: LocalAsset): PickItem {
  const stub = asset.kind === "pasted-asset" ? asset.text : asset.file;
  const title = asset.kind === "pasted-asset" ? asset.text.title : asset.file.name;
  return {
    key: `${asset.kind}:${stub.id}`,
    title,
    subtitle: snippet(stub.body),
    initials: initialsOf(title),
    chips: [
      { label: "", value: ASSET_NOUN[stub.assetKind] },
      { label: "", value: asset.kind === "pasted-asset" ? "Pasted" : "Uploaded file" },
    ],
    competitor: false,
    staticOnly: false,
    picked: { family: "asset", asset },
  };
}

/** Saved/generated assets travel as (kind, id) — resolved here for the picked
 *  card. A stale id degrades to a stated dead end, never a throw. */
function savedAssetItem(assetKind: AssetKind, id: string): PickItem | null {
  if (assetKind === "script") {
    const s = scripts.find((x) => x.id === id);
    return s ? savedScriptItem(s) : null;
  }
  if (assetKind === "concept") {
    const c = concepts.find((x) => x.id === id);
    return c ? savedConceptItem(c) : null;
  }
  const sb = storyboards.find((x) => x.id === id);
  return sb ? savedStoryboardItem(sb) : null;
}

function generatedAssetItem(assetKind: AssetKind, id: string): PickItem | null {
  if (assetKind === "script") {
    const s = GENERATED_SCRIPTS.find((x) => x.id === id);
    return s ? generatedScriptItem(s) : null;
  }
  if (assetKind === "concept") {
    const c = GENERATED_CONCEPTS.find((x) => x.id === id);
    return c ? generatedConceptItem(c) : null;
  }
  const sb = GENERATED_STORYBOARDS.find((x) => x.id === id);
  return sb ? generatedStoryboardItem(sb) : null;
}

function assetKindOf(asset: PickedAsset): AssetKind {
  if (asset.kind === "pasted-asset") return asset.text.assetKind;
  if (asset.kind === "uploaded-asset") return asset.file.assetKind;
  return asset.assetKind;
}

function missingAssetItem(asset: PickedAsset): PickItem {
  const kind = ASSET_NOUN[assetKindOf(asset)];
  return {
    key: pickedKey({ family: "asset", asset }),
    title: `This ${kind} is no longer available`,
    subtitle: "It may have been renamed or removed since it was picked — choose another one.",
    initials: initialsOf(kind),
    chips: [{ label: "", value: kind }],
    competitor: false,
    staticOnly: false,
    picked: { family: "asset", asset },
  };
}

function assetItem(asset: PickedAsset): PickItem {
  if (asset.kind === "pasted-asset" || asset.kind === "uploaded-asset") return localAssetItem(asset);
  const resolved =
    asset.kind === "saved-asset"
      ? savedAssetItem(asset.assetKind, asset.id)
      : generatedAssetItem(asset.assetKind, asset.id);
  return resolved ?? missingAssetItem(asset);
}

function itemForPicked(p: PickedThing): PickItem {
  if (p.family === "asset") return assetItem(p.asset);
  const ad = p.ad;
  if (ad.kind === "genie-output") return outputItem(ad.output);
  if (ad.kind === "upload") return uploadItem(ad.file);
  const mod = FLOW_MODULES.find((m) => m.key === ad.ref.module);
  return refItem(ad.ref, mod?.label ?? "the source module", Boolean(mod?.competitorOwned));
}

/** "ad" / "script" — the noun the picked card says it is varying. */
function thingLabelFor(p: PickedThing): string {
  return p.family === "ad" ? "ad" : ASSET_NOUN[assetKindOf(p.asset)];
}

function originLabelFor(p: PickedThing): string {
  if (p.family === "asset") {
    switch (p.asset.kind) {
      case "saved-asset":
        return "Saved in Catalogue";
      case "generated-asset":
        return "Genie-generated";
      case "uploaded-asset":
        return "Uploaded file";
      default:
        return "Pasted text";
    }
  }
  const ad = p.ad;
  if (ad.kind === "genie-output") return "Your Genie generations";
  if (ad.kind === "upload") return "Uploaded";
  return FLOW_MODULES.find((m) => m.key === ad.ref.module)?.label ?? "Other Flows";
}

/* ────────────────────────────────────────────────────────── *
 *  Asset groups — module-level, because every array behind
 *  them is a module constant. Empty sets are dropped here, so
 *  neither a heading nor a chip can exist for a kind with
 *  nothing in it.
 * ────────────────────────────────────────────────────────── */

const ASSET_KIND_META: Record<
  AssetKind,
  { label: string; Icon: ReturnType<typeof resolveIcon>; noun: string; searchHint: string }
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
  items: PickItem[],
): PickGroup {
  const meta = ASSET_KIND_META[assetKind];
  return {
    key,
    family: "asset",
    label,
    chipLabel: meta.label,
    noun: meta.noun,
    searchHint: meta.searchHint,
    assetKind,
    Icon: meta.Icon,
    items,
  };
}

const ASSET_GROUPS: PickGroup[] = [
  assetGroup("saved-script", "script", "Saved scripts · Catalogue", scripts.map(savedScriptItem)),
  assetGroup(
    "generated-script",
    "script",
    "Genie-generated scripts",
    GENERATED_SCRIPTS.map(generatedScriptItem),
  ),
  assetGroup("saved-concept", "concept", "Saved concepts · Catalogue", concepts.map(savedConceptItem)),
  assetGroup(
    "generated-concept",
    "concept",
    "Genie-generated concepts",
    GENERATED_CONCEPTS.map(generatedConceptItem),
  ),
  assetGroup(
    "saved-storyboard",
    "storyboard",
    "Saved storyboards · Catalogue",
    storyboards.map(savedStoryboardItem),
  ),
  assetGroup(
    "generated-storyboard",
    "storyboard",
    "Genie-generated storyboards",
    GENERATED_STORYBOARDS.map(generatedStoryboardItem),
  ),
].filter((g) => g.items.length > 0);

/* ────────────────────────────────────────────────────────── *
 *  The picker
 * ────────────────────────────────────────────────────────── */

export function SourcePicker({ picked, onPick, onClear, className }: SourcePickerProps) {
  const [query, setQuery] = useState("");
  /** null = nothing open, the dropzone is the whole entry. */
  const [universeKey, setUniverseKey] = useState<string | null>(null);
  /** Widens past one chip to a whole family — never across both, because
   *  mixing 94 ads and 90 assets into one list is the exact distinction this
   *  screen exists to keep. */
  const [browseFamily, setBrowseFamily] = useState<Family | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [uploads, setUploads] = useState<UploadedAdStub[]>([]);
  const [drafts, setDrafts] = useState<LocalAsset[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  /** Which family the ONE hidden input is currently collecting for. A ref, not
   *  state, because the dialog is opened in the same tick it is set. */
  const fileModeRef = useRef<Family>("ad");

  // Composer (paste / upload an asset)
  const [composeTab, setComposeTab] = useState<"enter" | "upload">("enter");
  /** No default — the user has to SAY whether this is a script or a concept,
   *  because the stub is invalid without it. */
  const [composeKind, setComposeKind] = useState<AssetKind | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [assetFileName, setAssetFileName] = useState("");
  const [assetFileText, setAssetFileText] = useState("");
  const [assetFileError, setAssetFileError] = useState<string | null>(null);

  // Cleanup reads through refs so the unmount effect can have empty deps and
  // still see the latest values.
  const uploadsRef = useRef<UploadedAdStub[]>([]);
  uploadsRef.current = uploads;
  const pickedKeyRef = useRef<string | null>(null);
  pickedKeyRef.current = picked ? pickedKey(picked) : null;

  useEffect(
    () => () => {
      // Revoke every object URL this component minted EXCEPT the one the
      // caller is still holding — the pick outlives this component, and
      // revoking it would blank the preview the flow is still showing.
      // (Assets are text: nothing to revoke there.)
      uploadsRef.current.forEach((u) => {
        if (u.previewUrl && `upload:${u.id}` !== pickedKeyRef.current) URL.revokeObjectURL(u.previewUrl);
      });
    },
    [],
  );

  const groups = useMemo<PickGroup[]>(() => {
    const out: PickGroup[] = [];
    const adNoun = "ads";
    const adHint = "name, brand or module";
    if (uploads.length) {
      out.push({
        key: "upload",
        family: "ad",
        label: "Uploaded ads",
        chipLabel: "Uploaded",
        noun: adNoun,
        searchHint: adHint,
        Icon: resolveIcon("Image"),
        items: uploads.map(uploadItem),
      });
    }
    out.push({
      key: "genie-output",
      family: "ad",
      label: "Your Genie generations",
      chipLabel: "Genie",
      noun: adNoun,
      searchHint: adHint,
      Icon: resolveIcon("Sparkles"),
      items: sampleOutputs.map(outputItem),
    });
    // §7 module order, straight off FLOW_MODULES — no second ordering here.
    FLOW_MODULES.filter((m) => m.state === "live").forEach((m) => {
      const refs = sourcesForModule(m.key as FlowModuleKey);
      if (!refs.length) return;
      out.push({
        key: m.key,
        family: "ad",
        label: m.label,
        // The module's own registry label and icon — a chip for Industry
        // Insights must read exactly as it does everywhere else in Other Flows.
        chipLabel: m.label,
        noun: adNoun,
        searchHint: adHint,
        Icon: resolveIcon(m.icon),
        items: refs.map((r) => refItem(r, m.label, Boolean(m.competitorOwned))),
      });
    });
    if (drafts.length) {
      out.push({
        key: "asset-added",
        family: "asset",
        label: "Pasted & uploaded",
        chipLabel: "Pasted",
        noun: "assets",
        searchHint: "title or wording",
        Icon: Type,
        items: drafts.map(localAssetItem),
      });
    }
    out.push(...ASSET_GROUPS);
    return out;
  }, [uploads, drafts]);

  /** One chip per group that has something in it, plus the two local actions.
   *  Because it is built off `groups`, a module with no refs never gets an
   *  advertised-but-empty chip, an asset kind with no items never gets a chip,
   *  and "Uploaded" only becomes a chip once a file exists. */
  const universes = useMemo<UniverseDef[]>(() => {
    const list: UniverseDef[] = groups
      .filter((g) => g.family === "ad" && g.key !== "upload")
      .map((g) => ({
        key: g.key,
        family: "ad" as Family,
        label: g.chipLabel,
        Icon: g.Icon,
        groups: [g.key],
        noun: g.noun,
        searchHint: g.searchHint,
      }));
    list.push({
      key: "upload",
      family: "ad",
      label: "Upload an ad",
      Icon: Upload,
      groups: ["upload"],
      noun: "ads",
      searchHint: "name, brand or module",
      uploadAction: true,
    });
    // One chip per asset KIND — it opens that kind's saved AND generated
    // groups, so "Scripts · 20" is the honest total of what the list shows.
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

  const adUniverses = universes.filter((u) => u.family === "ad");
  const assetUniverses = universes.filter((u) => u.family === "asset");

  const universe = universes.find((u) => u.key === universeKey) ?? null;
  const activeFamily: Family | null = browseFamily ?? universe?.family ?? null;
  const composeOpen = !browseFamily && Boolean(universe?.composeAction);
  const scope = browseFamily
    ? groups.filter((g) => g.family === browseFamily).map((g) => g.key)
    : (universe?.groups ?? null);
  const open = Boolean(browseFamily || universe);

  const view = browseFamily
    ? browseFamily === "ad"
      ? { label: "Every ad source", noun: "ads", searchHint: "name, brand or module" }
      : { label: "Every asset", noun: "assets", searchHint: "title, brand, angle or framework" }
    : universe
      ? {
          label: universe.composeAction ? "Paste or upload an asset" : universe.label,
          noun: universe.noun,
          searchHint: universe.searchHint,
        }
      : null;

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
  const familyTotal = groups
    .filter((g) => !activeFamily || g.family === activeFamily)
    .reduce((n, g) => n + g.items.length, 0);
  const scopedPickable = groups
    .filter((g) => !scope || scope.includes(g.key))
    .reduce((n, g) => n + g.items.length, 0);
  const currentKey = picked ? pickedKey(picked) : null;

  /** How many things sit behind a chip. 0 only ever happens for the two local
   *  actions before anything is added — the chip then shows no count rather
   *  than a bare "0". */
  function countFor(u: UniverseDef): number {
    return groups.filter((g) => u.groups.includes(g.key)).reduce((n, g) => n + g.items.length, 0);
  }

  function localId(prefix: string): string {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  /** One upload path for the file dialog and the dropzone alike. */
  function acceptAdFile(file: File) {
    const stub: UploadedAdStub = {
      id: localId("upl"),
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      mediaType: file.type.startsWith("video") ? "video" : "image",
    };
    setUploads((prev) => [stub, ...prev]);
    setUniverseKey("upload");
    setBrowseFamily(null);
    onPick({ family: "ad", ad: { kind: "upload", file: stub } });
  }

  /** `.txt`/`.md` ≤50 KB, read to text — ScriptRail's exact contract. The file
   *  never becomes a pick on its own: the kind question comes first. */
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
   *  imperatively because `.click()` fires in this same tick — a state update
   *  would not have reached the DOM in time. */
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

  function openCompose(tab: "enter" | "upload") {
    setBrowseFamily(null);
    setQuery("");
    setUniverseKey("compose");
    setComposeTab(tab);
  }

  function openUniverse(u: UniverseDef) {
    setBrowseFamily(null);
    setQuery("");
    setUniverseKey(u.key);
    if (u.uploadAction) openFileDialog("ad");
    if (u.composeAction) setComposeTab("enter");
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

  function commitLocalAsset(asset: LocalAsset) {
    setDrafts((prev) => [asset, ...prev]);
    setUniverseKey("compose");
    setBrowseFamily(null);
    onPick({ family: "asset", asset });
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
    commitLocalAsset({ kind: "pasted-asset", text });
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
    commitLocalAsset({ kind: "uploaded-asset", file });
    setAssetFileName("");
    setAssetFileText("");
  }

  /** The list stays reachable when the caller gave us no way to clear a pick
   *  — otherwise a first pick would be final. */
  const showBrowse = !picked || !onClear;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {picked && (
        <PickedCard
          item={itemForPicked(picked)}
          thingLabel={thingLabelFor(picked)}
          originLabel={originLabelFor(picked)}
          onClear={onClear}
        />
      )}

      {showBrowse && (
        <>
          {/* Label + dashed drop area, 4px apart. The area itself is a real
              drop target — the support line promises a drop, so it must work,
              for a media file (an ad) and a text file (an asset) alike. */}
          <div className="flex w-full flex-col gap-1">
            <p className="font-g6-sans text-[13px] leading-5 text-g6-text">What to vary</p>
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
                // A text file can't say whether it's a script or a concept, so
                // it lands IN the composer (kind question first), not as a pick.
                if (isTextFile(file)) {
                  openCompose("upload");
                  readAssetFile(file);
                  return;
                }
                acceptAdFile(file);
              }}
              className={cn(
                "flex min-h-[139px] flex-col items-center justify-center gap-3 rounded-[12px] border-2 border-dashed px-4 py-4 transition-colors",
                // A fully neutral dashed box reads DISABLED. At rest the dash
                // carries the accent; a drag deepens the same hue and fills
                // the tint, so both states are one gesture rather than a
                // colour arriving from nowhere.
                // NOT `border-g6-primary-border/40`: every g6 colour is a bare
                // `var(--g6-color-*)` holding a hex, so Tailwind's opacity
                // modifier compiles to `rgb(var(--…) / .4)` — invalid, dropped,
                // and the border silently falls back to the neutral default.
                dragOver ? "border-g6-primary-border bg-g6-primary-bg" : "border-g6-primary",
              )}
            >
              <Upload className="h-6 w-6 shrink-0 text-g6-primary" aria-hidden="true" />
              <p className="text-center font-g6-sans text-[13px] leading-5 text-g6-text">
                Vary one whole ad — or one script, concept or storyboard
              </p>
              <p className="max-w-md text-center font-g6-sans text-g6-xs uppercase leading-[18px] tracking-[-0.08px] text-g6-text-tertiary">
                Open a source below, or drop a file here — an image or video becomes your own ad, a
                .txt or .md becomes a script or concept.
              </p>
              <div className="flex w-full max-w-[640px] flex-col gap-2.5">
                <ChipRow
                  label="Vary a whole ad"
                  hint="the finished creative, as it ran"
                  active={activeFamily === "ad"}
                  universes={adUniverses}
                  activeKey={browseFamily ? null : universeKey}
                  countFor={countFor}
                  onOpen={openUniverse}
                />
                <div className="h-px w-full bg-g6-border" aria-hidden="true" />
                <ChipRow
                  label="Vary one asset"
                  hint="a script, concept or storyboard — no finished ad needed"
                  active={activeFamily === "asset"}
                  universes={assetUniverses}
                  activeKey={browseFamily ? null : universeKey}
                  countFor={countFor}
                  onOpen={openUniverse}
                />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={AD_FILE_ACCEPT}
              onChange={handleFile}
              className="hidden"
            />
          </div>

          {open && view && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-g6-mono text-g6-xs font-semibold uppercase tracking-wider text-g6-text-secondary">
                  {/* The family is restated on every heading — a list of
                      scripts must never read like a list of ads. */}
                  <span className={activeFamily === "asset" ? "text-g6-primary" : "text-g6-text"}>
                    {activeFamily === "asset" ? "Asset" : "Whole ad"}
                  </span>{" "}
                  · {view.label} ·{" "}
                  <span className="tabular-nums text-g6-text-tertiary">
                    {scopedPickable} {view.noun}
                  </span>
                </h3>
                <div className="flex items-center gap-1.5">
                  {!browseFamily && !composeOpen && activeFamily && (
                    <button
                      type="button"
                      onClick={() => {
                        setBrowseFamily(activeFamily);
                        setQuery("");
                      }}
                      className="rounded-g6-pill px-1 font-g6-sans text-g6-xs font-semibold text-g6-primary hover:underline focus-visible:ring-2 focus-visible:ring-g6-primary-border"
                    >
                      Browse all {familyTotal} {activeFamily === "asset" ? "assets" : "ad sources"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setUniverseKey(null);
                      setBrowseFamily(null);
                      setQuery("");
                    }}
                    className="inline-flex items-center gap-1 rounded-g6-pill border border-g6-border bg-g6-bg-container px-2.5 py-1 font-g6-sans text-g6-xs font-semibold text-g6-text hover:border-g6-primary-border focus-visible:ring-2 focus-visible:ring-g6-primary-border"
                  >
                    <X className="h-3 w-3" />
                    Close
                  </button>
                </div>
              </div>

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

              {!composeOpen && (
                <div className="relative w-full">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-g6-text-tertiary" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label={`Search ${view.noun} to vary`}
                    placeholder={`Search ${scopedPickable} ${view.noun} by ${view.searchHint}...`}
                    className="w-full rounded-g6-pill border border-g6-border bg-g6-bg-base py-2 pl-9 pr-8 text-g6-sm text-g6-text outline-none placeholder:text-g6-text-tertiary focus-visible:border-g6-primary-border focus-visible:ring-2 focus-visible:ring-g6-primary-border"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      aria-label="Clear search"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-g6-pill p-0.5 text-g6-text-tertiary hover:text-g6-text focus-visible:ring-2 focus-visible:ring-g6-primary-border"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}

              {totalVisible === 0 ? (
                // With the composer open, an empty draft list is the expected
                // state — the composer IS the way out, so a zero-state card
                // beneath it would just be a second, redundant one.
                !composeOpen && (
                  <ZeroState
                    query={query}
                    noun={view.noun}
                    family={activeFamily ?? "ad"}
                    emptyUniverseLabel={!browseFamily && !q ? (universe?.label ?? null) : null}
                    onReset={() => {
                      setQuery("");
                      setBrowseFamily(activeFamily ?? "ad");
                    }}
                  />
                )
              ) : (
                <div className="flex flex-col gap-5">
                  {visible.map((g) => {
                    // A chip can open two groups (an asset kind's saved +
                    // generated halves), so the cap is per group — 47 concepts
                    // is still a scroll, not a list. A query lifts it.
                    const capped = !q && !expanded[g.key];
                    const items = capped ? g.items.slice(0, GROUP_CAP) : g.items;
                    return (
                      <section key={g.key} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <g.Icon className="h-3.5 w-3.5 shrink-0 text-g6-text-tertiary" />
                          <h3 className="font-g6-mono text-g6-xs font-semibold uppercase tracking-wider text-g6-text-secondary">
                            {g.label}
                          </h3>
                          <span className="font-g6-mono text-g6-xs tabular-nums text-g6-text-tertiary">
                            {g.items.length}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2">
                          {items.map((item) => (
                            <SourceTile
                              key={item.key}
                              item={item}
                              selected={currentKey === item.key}
                              onPick={() => onPick(item.picked)}
                            />
                          ))}
                        </div>
                        {capped && g.items.length > GROUP_CAP && (
                          <button
                            type="button"
                            onClick={() => setExpanded((prev) => ({ ...prev, [g.key]: true }))}
                            className="self-start rounded-g6-pill px-1 font-g6-sans text-g6-xs font-semibold text-g6-primary hover:underline focus-visible:ring-2 focus-visible:ring-g6-primary-border"
                          >
                            Show all {g.items.length} in {g.label}
                          </button>
                        )}
                      </section>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  Pieces
 * ────────────────────────────────────────────────────────── */

function Chip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "warn" | "accent";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-g6-pill px-1.5 py-0.5 font-g6-mono text-[9px] font-semibold uppercase tracking-wide",
        tone === "warn" && "border border-warning-text/30 bg-warning-text/10 text-warning-text",
        tone === "accent" && "bg-g6-primary-bg text-g6-primary",
        tone === "neutral" && "bg-g6-bg-muted text-g6-text-secondary",
      )}
    >
      {children}
    </span>
  );
}

/** One family's chip row inside the dropzone. The label is the whole point:
 *  it names which of the two things the chips beside it pick, and turns
 *  primary while that family is the one open. */
function ChipRow({
  label,
  hint,
  active,
  universes,
  activeKey,
  countFor,
  onOpen,
}: {
  label: string;
  hint: string;
  active: boolean;
  universes: UniverseDef[];
  activeKey: string | null;
  countFor: (u: UniverseDef) => number;
  onOpen: (u: UniverseDef) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 text-left">
      <p
        className={cn(
          "font-g6-mono text-[9px] font-bold uppercase tracking-wider",
          // The two families ARE the screen's distinction, so the labels are
          // accented at rest too — the dark accent (legible at 9px on light)
          // when idle, the bright one when that family is the open row, so
          // "which row am I in" survives without the labels going grey.
          active ? "text-g6-primary" : "text-g6-primary-active",
        )}
      >
        {label}
        <span className="font-g6-sans text-[10px] font-medium normal-case tracking-normal text-g6-text-tertiary">
          {" "}
          · {hint}
        </span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {universes.map((u) => (
          <SourceChip
            key={u.key}
            label={u.label}
            Icon={u.Icon}
            count={countFor(u)}
            active={activeKey === u.key}
            onClick={() => onOpen(u)}
          />
        ))}
      </div>
    </div>
  );
}

/** One dropzone entry chip. Spec geometry: 1px border, pill radius,
 *  4/10/4/9 padding, 14px icon, 11px label. The count rides along so the user
 *  knows what a chip opens before opening it (Recognition over Recall). */
function SourceChip({
  label,
  Icon,
  count,
  active,
  onClick,
}: {
  label: string;
  Icon: ReturnType<typeof resolveIcon>;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        // `text-[11px] leading-4` and not the `text-g6-xs` token (same 11/16
        // values) ON PURPOSE: tailwind-merge can't tell a custom `text-g6-*`
        // key is a size, files it under text-COLOR, and the conditional
        // `text-g6-text-secondary` below then wins and deletes it — the label
        // silently renders at 16px. An arbitrary length is classified
        // correctly, which is why the badges here already use `text-[9px]`.
        "inline-flex items-center gap-1 rounded-g6-pill border py-1 pl-[9px] pr-2.5 font-g6-sans text-[11px] leading-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border",
        active
          ? "border-g6-primary-border bg-g6-primary-bg text-g6-primary"
          : // Hover tints toward the SAME accent the chip already carries at
            // rest, so opening one doesn't feel like a colour arriving.
            "border-g6-border-secondary bg-g6-bg-container text-g6-text-secondary hover:border-g6-primary-border hover:bg-g6-primary-bg hover:text-g6-text",
      )}
    >
      {/* Icon + count carry the accent, the LABEL stays neutral — 13 chips of
          identical lime text would be a wall, but a lime glyph plus a lime
          number per chip is scannable and keeps the row one set. The count
          takes the darker accent: it is text at 11px, the icon is not. */}
      <Icon className="h-3.5 w-3.5 shrink-0 text-g6-primary" aria-hidden="true" />
      {label}
      {count > 0 && (
        <span className="font-g6-mono tabular-nums text-g6-primary-active">{count}</span>
      )}
    </button>
  );
}

function Thumb({ item, size }: { item: PickItem; size: "sm" | "lg" }) {
  const box = size === "lg" ? "h-14 w-14" : "h-12 w-12";
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-g6-base bg-g6-bg-muted",
        box,
      )}
    >
      {item.thumbnail ? (
        <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="font-g6-mono text-[10px] font-bold uppercase text-g6-text-tertiary">
          {item.initials}
        </span>
      )}
    </div>
  );
}

/** One row. An unpickable source states its reason ON the row — never a
 *  silently dead tile (NN/g #1, visibility of system status). */
function SourceTile({
  item,
  selected,
  onPick,
}: {
  item: PickItem;
  selected: boolean;
  onPick: () => void;
}) {
  const blocked = Boolean(item.blocked);
  const BlockedIcon = item.blockedIcon ?? Lock;
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={blocked}
      aria-disabled={blocked}
      aria-pressed={selected}
      className={cn(
        "flex items-center gap-3 rounded-g6-card border bg-g6-bg-container p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border",
        blocked
          ? "cursor-not-allowed border-g6-border-secondary opacity-60"
          : "border-g6-border-secondary hover:border-g6-primary-border hover:shadow-g6-sm",
        selected && !blocked && "border-g6-primary-border bg-g6-primary-bg ring-2 ring-g6-primary-border",
      )}
    >
      <Thumb item={item} size="sm" />

      <div className="min-w-0 flex-1 space-y-0.5">
        {/* `truncate` on both lines — mock titles run past 60 chars and a
            wrapping title pushes every chip below the fold. */}
        <p className="truncate font-g6-sans text-g6-sm font-semibold text-g6-text">{item.title}</p>
        <p className="truncate text-g6-xs text-g6-text-secondary">{item.subtitle}</p>
        <div className="flex flex-wrap items-center gap-1 pt-0.5">
          {item.competitor && <Chip tone="warn">Competitor</Chip>}
          {item.staticOnly && <Chip>Static output only</Chip>}
          {item.note && <Chip>{item.note}</Chip>}
          {item.chips.map((c, i) => (
            <Chip key={`${c.label}-${c.value}-${i}`}>{c.label ? `${c.label} ${c.value}` : c.value}</Chip>
          ))}
        </div>
        {item.blocked && (
          <p className="flex items-start gap-1 pt-0.5 text-[10.5px] font-medium text-warning-text">
            <BlockedIcon className="mt-0.5 h-2.5 w-2.5 shrink-0" />
            <span className="line-clamp-2">{item.blocked}</span>
          </p>
        )}
      </div>

      {selected && !blocked ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-g6-pill bg-g6-primary px-2 py-0.5 font-g6-mono text-[9px] font-bold uppercase tracking-wider text-g6-text-on-accent">
          <Check className="h-2.5 w-2.5" />
          Picked
        </span>
      ) : (
        item.analysed !== undefined && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-g6-pill px-2 py-0.5 font-g6-mono text-[9px] font-bold uppercase tracking-wider",
              item.analysed ? "bg-g6-primary-bg text-g6-primary" : "bg-g6-bg-muted text-g6-text-tertiary",
            )}
          >
            {item.analysed ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
            {item.analysed ? "Analysed" : "Not analysed"}
          </span>
        )
      )}
    </button>
  );
}

/**
 * Paste / upload an asset. Deliberately modelled on ScriptRail's Enter +
 * Upload tabs (same `.txt`/`.md` accept, same 50 KB ceiling, same
 * chars/words counter, same preview-then-confirm) — a user who has written a
 * script in Studio already knows this surface.
 *
 * The one addition is the KIND question, first and unanswered by default: the
 * stub is invalid without an `assetKind`, and guessing it would silently
 * analyse a concept as a script.
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
  const useLabel = kind ? `Use this ${ASSET_NOUN[kind]}` : "Use this asset";

  return (
    <div className="flex flex-col gap-4 rounded-g6-card border border-g6-border bg-g6-bg-container p-3">
      <div className="flex flex-col gap-1.5">
        <p className="font-g6-mono text-[9px] font-bold uppercase tracking-wider text-g6-text-secondary">
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
                <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <Lightbulb className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              )}
              {k === "script" ? "A script" : "A concept"}
            </button>
          ))}
        </div>
        <p className="text-g6-xs leading-5 text-g6-text-secondary">
          A storyboard is a script plus visual directions — so there is nothing separate to paste.
          Paste the script, then add the visuals as a variation in this flow.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-g6-mono text-[9px] font-bold uppercase tracking-wider text-g6-text-secondary">
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
              className="w-full rounded-g6-base border border-g6-border bg-g6-bg-base p-3 text-g6-sm leading-6 text-g6-text outline-none placeholder:text-g6-text-tertiary focus-visible:border-g6-primary-border focus-visible:ring-2 focus-visible:ring-g6-primary-border"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-g6-mono text-[10px] tabular-nums text-g6-text-tertiary">
                {pasteText.length} chars · {words} {words === 1 ? "word" : "words"}
              </span>
              <CommitButton ready={ready} kind={kind} hasBody={hasBody} label={useLabel} onClick={onCommitPaste} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col items-center gap-2 rounded-g6-base border-2 border-dashed border-g6-border bg-g6-bg-base px-4 py-6 text-center">
              <Upload className="h-5 w-5 text-g6-text-tertiary" aria-hidden="true" />
              <p className="font-g6-sans text-[13px] leading-5 text-g6-text">
                Drop a text file on the box above, or browse for one
              </p>
              <p className="font-g6-mono text-[10px] uppercase tracking-wider text-g6-text-tertiary">
                .txt or .md, up to 50 KB
              </p>
              <button
                type="button"
                onClick={onBrowse}
                className="rounded-g6-pill border border-g6-border bg-g6-bg-container px-4 py-1.5 font-g6-sans text-[11px] leading-4 font-semibold text-g6-text hover:border-g6-primary-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border"
              >
                Browse files
              </button>
              {fileError && (
                <p className="flex items-center gap-1 text-g6-xs font-medium text-warning-text">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {fileError}
                </p>
              )}
            </div>

            {fileText && (
              <div className="flex flex-col gap-2 rounded-g6-base border border-g6-border bg-g6-bg-base p-3">
                <p className="truncate font-g6-mono text-[10px] uppercase tracking-wider text-g6-text-tertiary">
                  {fileName}
                </p>
                <pre className="max-h-[180px] overflow-y-auto whitespace-pre-wrap font-g6-sans text-g6-xs leading-5 text-g6-text-secondary">
                  {fileText}
                </pre>
                <div className="flex justify-end">
                  <CommitButton ready={ready} kind={kind} hasBody={hasBody} label={useLabel} onClick={onCommitUpload} />
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
          {!kind ? "Say whether it's a script or a concept" : !hasBody ? "Add the words first" : ""}
        </span>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={!ready}
        className={cn(
          "inline-flex items-center gap-1 rounded-g6-pill px-4 py-1.5 font-g6-sans text-[11px] leading-4 font-bold transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border",
          ready
            ? "bg-g6-primary text-g6-text-on-accent hover:opacity-90"
            : "cursor-not-allowed bg-g6-bg-muted text-g6-text-disabled",
        )}
      >
        <Check className="h-3 w-3" />
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
  Icon: ReturnType<typeof resolveIcon>;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-1.5 rounded-g6-pill px-3 py-1 font-g6-sans text-[11px] leading-4 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g6-primary-border",
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

/** The pick, restated. Reads as a decision made, with one way to undo it —
 *  and it names WHICH family, because "Varying this ad" and "Varying this
 *  script" send the rest of the flow down different paths. */
function PickedCard({
  item,
  thingLabel,
  originLabel,
  onClear,
}: {
  item: PickItem;
  thingLabel: string;
  originLabel: string;
  onClear?: () => void;
}) {
  const p = item.picked;
  const localAsset =
    p.family === "asset" && (p.asset.kind === "pasted-asset" || p.asset.kind === "uploaded-asset");
  const isScript = p.family === "asset" && assetKindOf(p.asset) === "script";
  return (
    <div className="flex flex-col gap-2 rounded-g6-card border border-g6-primary-border bg-g6-primary-bg p-3">
      <div className="flex items-start gap-3">
        <Thumb item={item} size="lg" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-g6-mono text-[9px] font-bold uppercase tracking-wider text-g6-primary">
            Varying this {thingLabel} · {originLabel}
          </p>
          <p className="truncate font-g6-sans text-g6-base font-semibold text-g6-text">{item.title}</p>
          <p className="truncate text-g6-xs text-g6-text-secondary">{item.subtitle}</p>
          <div className="flex flex-wrap items-center gap-1 pt-0.5">
            {item.competitor && <Chip tone="warn">Competitor</Chip>}
            {item.staticOnly && <Chip>Static output only</Chip>}
            {item.chips.map((c, i) => (
              <Chip key={`${c.label}-${c.value}-${i}`}>{c.label ? `${c.label} ${c.value}` : c.value}</Chip>
            ))}
          </div>
        </div>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex shrink-0 items-center gap-1 rounded-g6-pill border border-g6-border bg-g6-bg-container px-2.5 py-1 font-g6-sans text-g6-xs font-semibold text-g6-text hover:border-g6-primary-border focus-visible:ring-2 focus-visible:ring-g6-primary-border"
          >
            <X className="h-3 w-3" />
            Change
          </button>
        )}
      </div>
      {item.competitor && (
        // §7.2 — a rival's ad. Say plainly whose ad the variation is FOR,
        // because the tile's own brand chip names the competitor.
        <p className="rounded-g6-sm border border-warning-text/30 bg-warning-text/10 px-2.5 py-1.5 text-g6-xs text-warning-text">
          This is a competitor&apos;s ad. Genie will build the variations for your own brand — never
          for the rival named here.
        </p>
      )}
      {p.family === "ad" && p.ad.kind === "upload" && (
        <p className="rounded-g6-sm border border-g6-border bg-g6-bg-muted px-2.5 py-1.5 text-g6-xs text-g6-text-secondary">
          An uploaded ad carries no catalogue provenance — Genie reads it from the file alone, so
          brand and product may come back as not found.
        </p>
      )}
      {localAsset && (
        <p className="rounded-g6-sm border border-g6-border bg-g6-bg-muted px-2.5 py-1.5 text-g6-xs text-g6-text-secondary">
          This {thingLabel} came from your own text, not the Catalogue — Genie reads the words
          alone, so brand and product may come back as not found.
        </p>
      )}
      {isScript && (
        <p className="rounded-g6-sm border border-g6-border bg-g6-bg-muted px-2.5 py-1.5 text-g6-xs text-g6-text-secondary">
          Adding visual directions to a script variation is what makes the output a storyboard.
        </p>
      )}
    </div>
  );
}

/** Zero-data: a search that matches nothing, or a chip with nothing behind it
 *  yet. Both name the way out, in the family's own language. */
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
    <div className="flex flex-col items-center gap-2 rounded-g6-card border border-dashed border-g6-border bg-g6-bg-muted/40 px-4 py-8 text-center">
      <Sparkles className="h-4 w-4 text-g6-text-tertiary" />
      <p className="font-g6-sans text-g6-sm font-semibold text-g6-text">
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
      <p className="max-w-sm text-g6-xs text-g6-text-secondary">
        {family === "asset"
          ? "Try a brand, an angle or a framework — or paste the script you want to vary."
          : "Try a brand name, a module name, or drop the ad you want to vary onto the box above."}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-1 rounded-g6-pill px-2 font-g6-sans text-g6-xs font-semibold text-g6-primary hover:underline focus-visible:ring-2 focus-visible:ring-g6-primary-border"
      >
        {family === "asset" ? "Show every asset" : "Show every ad source"}
      </button>
    </div>
  );
}
