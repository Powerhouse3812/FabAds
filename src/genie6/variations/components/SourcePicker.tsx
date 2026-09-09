import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Check, CheckCircle2, Clock, Lock, Search, Sparkles, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FlowModuleKey, FlowSourceRef } from "../../flows/flowTypes";
import { FLOW_MODULES } from "../../flows/data/flowRegistry";
import { sourcesForModule } from "../../flows/data/flowSources";
import { resolveIcon } from "../../flows/icons";
import { sampleOutputs } from "../../mocks/sample-outputs";
import type { OutputData } from "../../types/output";
import type { PickedSource, UploadedAdStub } from "../types";

/**
 * SourcePicker — Step 1 of Generate Variations: pick ONE whole ad.
 *
 * Renders INLINE, never as its own modal — the screen owns its framing,
 * so this component
 * makes no assumptions about the box it sits in beyond `className`.
 *
 * The pool is three universes under one grammar:
 *   · Genie's own outputs   (`sampleOutputs`, read-only — 15+ importers hold
 *                            that exact array reference; never fork or mutate)
 *   · Other Flows' refs     (`FLOW_SOURCES` via `sourcesForModule`, in the
 *                            §7 module order `FLOW_MODULES` already defines)
 *   · A local upload        (object-URL preview, nothing leaves the browser)
 *
 * Tile grammar, module labels and the module icon map are all REUSED from
 * `flows/` (FlowModuleDetail's SourceRow, FLOW_MODULES[].label,
 * `resolveIcon`) rather than re-invented, so a variation source reads exactly
 * like the same ad does in Other Flows.
 */

export interface SourcePickerProps {
  picked: PickedSource | null;
  onPick: (picked: PickedSource) => void;
  onClear?: () => void;
  className?: string;
}

/** Rows shown per group before "Show all" — 94 refs in one flat list is not
 *  a list, it's a scroll. Lifted whenever a filter or a query narrows things. */
const GROUP_CAP = 6;

/* ────────────────────────────────────────────────────────── *
 *  The entry chips inside the dropzone. One chip per universe
 *  that genuinely has ads behind it — DERIVED from the same
 *  `groups` the list renders, plus the Upload action. No chip
 *  carries a data universe, a label or an icon of its own, so
 *  a chip can never advertise a source the list can't show.
 * ────────────────────────────────────────────────────────── */

interface UniverseDef {
  key: string;
  /** Short chip label. `PickGroup.chipLabel`, so there is one source of copy. */
  label: string;
  Icon: typeof Upload;
  /** Group keys this chip reveals, in order. */
  groups: string[];
  /** Opens the file dialog instead of (only) revealing a list. */
  uploadAction?: boolean;
}

/* ────────────────────────────────────────────────────────── *
 *  Display model — one shape every tile renders from, so the
 *  three source universes cannot drift into three tile styles.
 * ────────────────────────────────────────────────────────── */

interface PickItem {
  /** `${kind}:${id}` — kind-scoped because an output id and a ref id for the
   *  same underlying ad are the same string (see flowSources' sampleOutputRef). */
  key: string;
  title: string;
  subtitle: string;
  thumbnail?: string;
  /** Thumbnail fallback for the partial case (no image on the source). */
  initials: string;
  chips: { label: string; value: string }[];
  competitor: boolean;
  staticOnly: boolean;
  note?: string;
  /** undefined = the source module has no analysis step at all. */
  analysed?: boolean;
  /** Set = unpickable, and this is the reason stated ON the row. */
  blocked?: string;
  picked: PickedSource;
}

interface PickGroup {
  key: string;
  /** Section heading, e.g. "Your Genie generations". */
  label: string;
  /** Chip form of the same thing — a chip has ~10 chars of room, a heading
   *  doesn't. Same field, one place, so the two can't describe different sets. */
  chipLabel: string;
  Icon: ReturnType<typeof resolveIcon>;
  items: PickItem[];
}

function pickedKey(p: PickedSource): string {
  if (p.kind === "genie-output") return `genie-output:${p.output.id}`;
  if (p.kind === "flow-ref") return `flow-ref:${p.ref.id}`;
  return `upload:${p.file.id}`;
}

function initialsOf(...candidates: (string | undefined)[]): string {
  const src = candidates.find((c) => c && c.trim().length > 0);
  return (src ?? "Ad").trim().slice(0, 2).toUpperCase();
}

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
    // §7.2 — module-level OR ref-level. Dashboard aggregates Insights'
    // competitor rows next to the user's own, so the per-ref flag matters.
    competitor: moduleCompetitor || Boolean(ref.competitorOwned),
    staticOnly: ref.sourceFormat === "carousel" || ref.sourceFormat === "flexible",
    note: ref.sourceNote,
    analysed: ref.analysed,
    blocked: blockedFor(ref, moduleLabel),
    picked: { kind: "flow-ref", ref },
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
    picked: { kind: "genie-output", output: out },
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
    picked: { kind: "upload", file },
  };
}

/* ────────────────────────────────────────────────────────── *
 *  The picker
 * ────────────────────────────────────────────────────────── */

export function SourcePicker({ picked, onPick, onClear, className }: SourcePickerProps) {
  const [query, setQuery] = useState("");
  /** null = nothing open, the dropzone is the whole entry. */
  const [universeKey, setUniverseKey] = useState<string | null>(null);
  /** Widens past one chip's universe — the 3 modules no chip maps to (Video
   *  Sage, Trends, Campaign URLs) stay reachable through this. */
  const [browseAll, setBrowseAll] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [uploads, setUploads] = useState<UploadedAdStub[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      uploadsRef.current.forEach((u) => {
        if (u.previewUrl && `upload:${u.id}` !== pickedKeyRef.current) URL.revokeObjectURL(u.previewUrl);
      });
    },
    [],
  );

  const groups = useMemo<PickGroup[]>(() => {
    const out: PickGroup[] = [];
    if (uploads.length) {
      out.push({
        key: "upload",
        label: "Uploaded",
        chipLabel: "Uploaded",
        Icon: resolveIcon("Image"),
        items: uploads.map(uploadItem),
      });
    }
    out.push({
      key: "genie-output",
      label: "Your Genie generations",
      chipLabel: "Genie",
      Icon: resolveIcon("Sparkles"),
      items: sampleOutputs.map(outputItem),
    });
    // §7 module order, straight off FLOW_MODULES — no second ordering here.
    FLOW_MODULES.filter((m) => m.state === "live").forEach((m) => {
      const refs = sourcesForModule(m.key as FlowModuleKey);
      if (!refs.length) return;
      out.push({
        key: m.key,
        label: m.label,
        // The module's own registry label and icon — a chip for Industry
        // Insights must read exactly as it does everywhere else in Other Flows.
        chipLabel: m.label,
        Icon: resolveIcon(m.icon),
        items: refs.map((r) => refItem(r, m.label, Boolean(m.competitorOwned))),
      });
    });
    return out;
  }, [uploads]);

  /** One chip per group that has ads in it, plus Upload. Because it is built
   *  off `groups`, a module with no refs never gets an advertised-but-empty
   *  chip, and the "Uploaded" group only becomes a chip once a file exists. */
  const universes = useMemo<UniverseDef[]>(() => {
    const chips: UniverseDef[] = groups
      .filter((g) => g.key !== "upload")
      .map((g) => ({ key: g.key, label: g.chipLabel, Icon: g.Icon, groups: [g.key] }));
    chips.push({ key: "upload", label: "Upload", Icon: Upload, groups: ["upload"], uploadAction: true });
    return chips;
  }, [groups]);

  const universe = universes.find((u) => u.key === universeKey) ?? null;
  const scope = browseAll || !universe ? null : universe.groups;
  const open = browseAll || Boolean(universe);

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
                g.label.toLowerCase().includes(q),
            )
          : g.items,
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, scope, q]);

  const totalVisible = visible.reduce((n, g) => n + g.items.length, 0);
  const totalPickable = groups.reduce((n, g) => n + g.items.length, 0);
  const scopedPickable = groups
    .filter((g) => !scope || scope.includes(g.key))
    .reduce((n, g) => n + g.items.length, 0);
  const currentKey = picked ? pickedKey(picked) : null;

  /** How many ads sit behind a chip. 0 only ever happens for Upload before a
   *  file is chosen — the chip then shows no count rather than a bare "0". */
  function countFor(u: UniverseDef): number {
    return groups.filter((g) => u.groups.includes(g.key)).reduce((n, g) => n + g.items.length, 0);
  }

  /** One upload path for the file dialog and the dropzone alike. */
  function acceptFile(file: File) {
    const stub: UploadedAdStub = {
      id: `upl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      mediaType: file.type.startsWith("video") ? "video" : "image",
    };
    setUploads((prev) => [stub, ...prev]);
    setUniverseKey("upload");
    setBrowseAll(false);
    onPick({ kind: "upload", file: stub });
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset so re-picking the same file still fires a change event.
    e.target.value = "";
    if (file) acceptFile(file);
  }

  function openUniverse(u: UniverseDef) {
    setBrowseAll(false);
    setQuery("");
    setUniverseKey(u.key);
    if (u.uploadAction) fileInputRef.current?.click();
  }

  /** The list stays reachable when the caller gave us no way to clear a pick
   *  — otherwise a first pick would be final. */
  const showBrowse = !picked || !onClear;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {picked && (
        <PickedCard
          item={
            picked.kind === "genie-output"
              ? outputItem(picked.output)
              : picked.kind === "upload"
                ? uploadItem(picked.file)
                : refItem(
                    picked.ref,
                    FLOW_MODULES.find((m) => m.key === picked.ref.module)?.label ?? "the source module",
                    Boolean(FLOW_MODULES.find((m) => m.key === picked.ref.module)?.competitorOwned),
                  )
          }
          originLabel={
            picked.kind === "genie-output"
              ? "Your Genie generations"
              : picked.kind === "upload"
                ? "Uploaded"
                : (FLOW_MODULES.find((m) => m.key === picked.ref.module)?.label ?? "Other Flows")
          }
          onClear={onClear}
        />
      )}

      {showBrowse && (
        <>
          {/* Label + dashed drop area, 4px apart. The area itself is a real
              drop target — the support line promises a drop, so it must work. */}
          <div className="flex w-full flex-col gap-1">
            <p className="font-g6-sans text-[13px] leading-5 text-g6-text">Ad to vary</p>
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
                if (file) acceptFile(file);
              }}
              className={cn(
                "flex min-h-[139px] flex-col items-center justify-center gap-3 rounded-[12px] border-2 border-dashed px-4 py-3 transition-colors",
                dragOver ? "border-g6-primary-border bg-g6-primary-bg" : "border-g6-border",
              )}
            >
              <Upload className="h-6 w-6 shrink-0 text-g6-text-tertiary" aria-hidden="true" />
              <p className="text-center font-g6-sans text-[13px] leading-5 text-g6-text">
                Pick one whole ad to make variations of
              </p>
              <p className="max-w-md text-center font-g6-sans text-g6-xs uppercase leading-[18px] tracking-[-0.08px] text-g6-text-tertiary">
                Open a source below, or drop an image or video file here to upload your own ad.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {universes.map((u) => (
                  <SourceChip
                    key={u.key}
                    label={u.label}
                    Icon={u.Icon}
                    count={countFor(u)}
                    active={!browseAll && universeKey === u.key}
                    onClick={() => openUniverse(u)}
                  />
                ))}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFile}
              className="hidden"
            />
          </div>

          {open && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-g6-mono text-g6-xs font-semibold uppercase tracking-wider text-g6-text-secondary">
                  {browseAll ? "Every source" : universe?.label} ·{" "}
                  <span className="tabular-nums text-g6-text-tertiary">{scopedPickable} ads</span>
                </h3>
                <div className="flex items-center gap-1.5">
                  {!browseAll && (
                    <button
                      type="button"
                      onClick={() => {
                        setBrowseAll(true);
                        setQuery("");
                      }}
                      className="rounded-g6-pill px-1 font-g6-sans text-g6-xs font-semibold text-g6-primary hover:underline focus-visible:ring-2 focus-visible:ring-g6-primary-border"
                    >
                      Browse all {totalPickable} sources
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setUniverseKey(null);
                      setBrowseAll(false);
                      setQuery("");
                    }}
                    className="inline-flex items-center gap-1 rounded-g6-pill border border-g6-border bg-g6-bg-container px-2.5 py-1 font-g6-sans text-g6-xs font-semibold text-g6-text hover:border-g6-primary-border focus-visible:ring-2 focus-visible:ring-g6-primary-border"
                  >
                    <X className="h-3 w-3" />
                    Close
                  </button>
                </div>
              </div>

              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-g6-text-tertiary" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search ads to vary"
                  placeholder={`Search ${scopedPickable} ads by name, brand or module...`}
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

              {totalVisible === 0 ? (
            <ZeroState
              query={query}
              emptyUniverseLabel={!browseAll && !q ? (universe?.label ?? null) : null}
              onReset={() => {
                setQuery("");
                setBrowseAll(true);
              }}
            />
          ) : (
            <div className="flex flex-col gap-5">
              {visible.map((g) => {
                // Every chip now opens exactly one group, so the cap can't be
                // conditioned on the group count any more — 50 Genie rows is
                // still a scroll, not a list. A query lifts it.
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
  Icon: typeof Upload;
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
          : "border-g6-border-secondary bg-g6-bg-container text-g6-text-secondary hover:border-g6-primary-border hover:text-g6-text",
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {label}
      {count > 0 && (
        <span className="font-g6-mono tabular-nums text-g6-text-tertiary">{count}</span>
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
            <Lock className="mt-0.5 h-2.5 w-2.5 shrink-0" />
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

/** The pick, restated. Reads as a decision made, with one way to undo it. */
function PickedCard({
  item,
  originLabel,
  onClear,
}: {
  item: PickItem;
  originLabel: string;
  onClear?: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-g6-card border border-g6-primary-border bg-g6-primary-bg p-3">
      <div className="flex items-start gap-3">
        <Thumb item={item} size="lg" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-g6-mono text-[9px] font-bold uppercase tracking-wider text-g6-primary">
            Varying this ad · {originLabel}
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
      {item.picked.kind === "upload" && (
        <p className="rounded-g6-sm border border-g6-border bg-g6-bg-muted px-2.5 py-1.5 text-g6-xs text-g6-text-secondary">
          An uploaded ad carries no catalogue provenance — Genie reads it from the file alone, so
          brand and product may come back as not found.
        </p>
      )}
    </div>
  );
}

/** Zero-data: a search that matches nothing, or a chip with nothing behind it
 *  yet (Upload before a file is chosen). Both name the way out. */
function ZeroState({
  query,
  emptyUniverseLabel,
  onReset,
}: {
  query: string;
  emptyUniverseLabel: string | null;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-g6-card border border-dashed border-g6-border bg-g6-bg-muted/40 px-4 py-8 text-center">
      <Sparkles className="h-4 w-4 text-g6-text-tertiary" />
      <p className="font-g6-sans text-g6-sm font-semibold text-g6-text">
        {query ? (
          <>No ad matches &ldquo;{query}&rdquo;</>
        ) : emptyUniverseLabel ? (
          <>Nothing under {emptyUniverseLabel} yet</>
        ) : (
          "Nothing in this source yet"
        )}
      </p>
      <p className="max-w-sm text-g6-xs text-g6-text-secondary">
        Try a brand name, a module name, or drop the ad you want to vary onto the box above.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-1 rounded-g6-pill px-2 font-g6-sans text-g6-xs font-semibold text-g6-primary hover:underline focus-visible:ring-2 focus-visible:ring-g6-primary-border"
      >
        Show every source
      </button>
    </div>
  );
}
