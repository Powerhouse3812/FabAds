import { useState, type ElementType, type ReactNode } from "react";
import { AlertTriangle, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBrand } from "@/mocks/shared/brands";
import { concepts } from "@/mocks/shared/concepts";
import { scripts, type ScriptAsset } from "@/mocks/shared/scripts";
import { storyboards, type StoryboardAsset } from "@/mocks/shared/storyboards";
import type { FlowSourceRef } from "../../flows/flowTypes";
import { FLOW_MODULES } from "../../flows/data/flowRegistry";
import {
  GENERATED_CONCEPTS,
  GENERATED_SCRIPTS,
  GENERATED_STORYBOARDS,
  type GeneratedConceptItem,
  type GeneratedScriptItem,
  type GeneratedStoryboardItem,
} from "../../library/tabs/generatedAssetPool";
import type { Concept } from "../../types/entities";
import type { OutputData } from "../../types/output";
import {
  SOURCE_UNIVERSE_CHIPS,
  type SourceUniverseChip,
} from "./SourcePickerModal";
import type {
  AssetKind,
  PickedAsset,
  PickedThing,
  UploadedAdStub,
} from "../types";

/**
 * SourcePicker — Step 1 of Generate Variations: the ALWAYS-VISIBLE entry.
 *
 * Owner, 2026-09-10: "always show that upload wala card (previously created).
 * uske click pe alag alag modal will open." So this is the dropzone card and
 * nothing else: a dashed drop target carrying two labelled chip rows, one per
 * family, present on the screen whether or not anything is picked. It renders
 * INLINE — the screen owns its framing, and it makes no assumption about the
 * box it sits in beyond `className`.
 *
 * What used to live here and no longer does: the lists. Clicking a chip used
 * to expand that universe's rows BELOW the dropzone, pushing the rest of the
 * page down. A chip now reports up (`onOpenUniverse`) and the screen opens
 * `SourcePickerModal` directly on that universe — so search, the composer,
 * the upload target, the caps and the zero-states all live there, exactly
 * once, and this file cannot drift from them.
 *
 * TWO FAMILIES, one dropzone. A run varies EITHER a whole ad OR one asset, so
 * the chips are split into two labelled rows — "Vary a whole ad" and "Vary one
 * asset" — and the picked card names the family back. That distinction is the
 * thing this screen has to communicate, so it is structural (two rows, a rule
 * between them, an accented label on each), not a wording difference.
 *
 * Every chip and every count comes from `SOURCE_UNIVERSE_CHIPS`, which the
 * modal derives from the same groups it renders. A chip therefore can never
 * advertise a universe or a total the modal will not show, and no count is
 * written by hand anywhere in this flow.
 *
 * What this file still resolves on its own is the PICKED card: a `PickedThing`
 * carries ids, not display copy, so `itemForPicked` turns whichever of the
 * seven kinds it is back into a title, a thumbnail and its chips — degrading
 * to a stated dead end for a stale id rather than throwing.
 */

export interface SourcePickerProps {
  picked: PickedThing | null;
  /** A chip click, or a file dropped on the card. The screen opens the modal
   *  on `universeKey`; a dropped file rides along and the modal decides
   *  whether it is an ad or the composer's text. */
  onOpenUniverse: (universeKey: string, file?: File) => void;
  onClear?: () => void;
  className?: string;
}

/* ────────────────────────────────────────────────────────── *
 *  Display model — one shape the picked card renders from.
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
  /** Extra haystack (tags, angle, framework, brand) kept on the item so the
   *  builders stay identical to the modal's. Never rendered. */
  searchText?: string;
  competitor: boolean;
  staticOnly: boolean;
  note?: string;
  /** undefined = the source module has no analysis step at all. */
  analysed?: boolean;
  /** Set = unpickable, and this is the reason stated ON the row. */
  blocked?: string;
  /** Lock reads as "go clear a gate"; a failed generation never clears. */
  blockedIcon?: ElementType;
  picked: PickedThing;
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

/** Which chip's universe a pick came out of — so the row it came from reads as
 *  the one that is answered. Every key here is a `SOURCE_UNIVERSE_CHIPS` key. */
function chipKeyFor(p: PickedThing): string {
  if (p.family === "asset") {
    const a = p.asset;
    if (a.kind === "pasted-asset" || a.kind === "uploaded-asset") return "compose";
    return `asset-${a.assetKind}`;
  }
  const ad = p.ad;
  if (ad.kind === "genie-output") return "genie-output";
  if (ad.kind === "upload") return "upload";
  return ad.ref.module;
}

/** The two PickedAsset kinds the composer can mint locally. */
type LocalAsset = Extract<
  PickedAsset,
  { kind: "uploaded-asset" } | { kind: "pasted-asset" }
>;

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
 *  The dropzone card
 * ────────────────────────────────────────────────────────── */

export function SourcePicker({
  picked,
  onOpenUniverse,
  onClear,
  className,
}: SourcePickerProps) {
  const [dragOver, setDragOver] = useState(false);
  const adChips = SOURCE_UNIVERSE_CHIPS.filter((c) => c.family === "ad");
  const assetChips = SOURCE_UNIVERSE_CHIPS.filter((c) => c.family === "asset");
  const answeredKey = picked ? chipKeyFor(picked) : null;

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

      {/* Maalik, 2026-09-10: "Once an Ad or asset is selected, remove this
          section." So the dropzone is the ENTRY only — once something is
          picked the PickedCard above is the whole of this step, and its
          Clear brings the dropzone back. A full dashed panel offering
          "vary something else instead" was too much room for a
          secondary action. */}
      {/* Label + dashed drop area, 4px apart. The area itself is a real drop
          target — the support line promises a drop, so it must work, for a
          media file (an ad) and a text file (an asset) alike. */}
      {!picked && (
        <div className="flex w-full flex-col gap-1">
          <p className="font-g6-sans text-[13px] leading-5 text-g6-text">
            What to vary
          </p>
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
              // The modal owns every file: it holds the uploads and the drafts,
              // it enforces the 50 KB text ceiling, and it asks the script-or-
              // concept question a bare `.txt` cannot answer. Handing it the
              // file — rather than minting a pick here — is what keeps one
              // upload path instead of two that disagree.
              onOpenUniverse("upload", file);
            }}
            className={cn(
              "flex min-h-[139px] flex-col items-center justify-center gap-3 rounded-[12px] border-2 border-dashed px-4 py-4 transition-colors",
              // A fully neutral dashed box reads DISABLED. At rest the dash
              // carries the accent; a drag deepens the same hue and fills the
              // tint, so both states are one gesture rather than a colour
              // arriving from nowhere.
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
            <p className="max-w-md text-center font-g6-sans text-[11px] uppercase leading-[18px] tracking-[-0.08px] text-g6-text-tertiary">
              Open a source below, or drop a file here — an image or video becomes your own ad, a
              .txt or .md becomes a script or concept.
            </p>
            <div className="flex w-full max-w-[640px] flex-col gap-2.5">
              <ChipRow
                label="Vary a whole ad"
                hint="the finished creative, as it ran"
                chips={adChips}
                answeredKey={answeredKey}
                onOpen={onOpenUniverse}
              />
              <div className="h-px w-full bg-g6-border" aria-hidden="true" />
              <ChipRow
                label="Vary one asset"
                hint="a script, concept or storyboard — no finished ad needed"
                chips={assetChips}
                answeredKey={answeredKey}
                onOpen={onOpenUniverse}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  Pieces
 * ────────────────────────────────────────────────────────── */

/** One family's chip row inside the dropzone. The label is the whole point:
 *  it names which of the two things the chips beside it pick. */
function ChipRow({
  label,
  hint,
  chips,
  answeredKey,
  onOpen,
}: {
  label: string;
  hint: string;
  chips: SourceUniverseChip[];
  answeredKey: string | null;
  onOpen: (universeKey: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 text-left">
      {/* The two families ARE the screen's distinction, so the labels are
          accented at rest. The DARK accent, because plain `g6-primary` on
          white is ~2.3:1 and vanishes at 9px. */}
      <p className="font-g6-mono text-[9px] font-bold uppercase tracking-wider text-g6-primary-active">
        {label}
        <span className="font-g6-sans text-[10px] font-medium normal-case tracking-normal text-g6-text-tertiary">
          {" "}
          · {hint}
        </span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {chips.map((c) => (
          <SourceChip
            key={c.key}
            label={c.label}
            Icon={c.Icon}
            count={c.count}
            active={answeredKey === c.key}
            onClick={() => onOpen(c.key)}
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
  Icon: ElementType;
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
          {/* `primary-active`, not `primary`: this is 9px bold text on the
              pale lime card fill, where the bright accent is ~2.3:1. */}
          <p className="font-g6-mono text-[9px] font-bold uppercase tracking-wider text-g6-primary-active">
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
