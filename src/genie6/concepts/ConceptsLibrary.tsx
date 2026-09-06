import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Check, Filter, Search, Sparkles, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSavedStore } from "./saved-store";
import { ConceptCard } from "./ConceptCard";
import { BulkGenerateBar } from "./BulkGenerateBar";
import {
  AD_TYPE_LABEL,
  buildConceptItems,
  FORMAT_LABEL,
  type AdType,
  type ConceptItem,
  type FormatKind,
} from "./conceptItems";
import { HeroHeader } from "@/genie6/studio-v4/components/HeroHeader";
// RUN STORE agent's file (module manifest, BRIEF.md §8).
import { useBatches } from "@/genie6/lib/genieRunStore";

/**
 * ConceptsLibrary — full-page library at /iq/genie6/concepts.
 *
 * Aggregates 3 sources of concepts (see conceptItems.ts):
 *   1. Catalogue concepts (50+) from @/mocks/shared/concepts.ts.
 *   2. KB-attached concepts (~9) from @/mocks/shared/kbConcepts.ts.
 *   3. User-saved (session-only, via saved-store.ts).
 *
 * §12 locks this screen's filters to exactly 2 dimensions — Format
 * (Image / Video) and Ad type (Brand / Product / Category). The older
 * "E-commerce / Affiliate / Both" idea is dropped (and was never present
 * in this file — verified while doing this pass). Angle / Brand-entity /
 * Product-entity / Category-entity / Source / Tone / Date-range filters
 * that existed here before this pass are intentionally REMOVED as filter
 * facets (angle + tone still show as descriptive tags on the card) — see
 * this module's final report for why.
 *
 * Search + Sort (Recent / Name / Most generated) stay, since §12 only
 * fixes the *filters*, not search or sort.
 *
 * URL-backed state via useSearchParams (A-12.38 convention, extended not
 * replaced): ?q ?format ?adtype ?sort, plus ?loading=1 / ?empty=1 demo
 * flags (Library.tsx's convention — this page had no such flags before;
 * added here for state-coverage completeness).
 *
 * Selection (multi-select bulk generate, §12) is the one non-URL state,
 * matching Library's own precedent (RECON.md: "Selection is the ONE
 * non-URL state").
 */

export function ConceptsLibrary() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const setParam = (key: string, value: string | null) =>
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (!value) sp.delete(key);
        else sp.set(key, value);
        return sp;
      },
      { replace: true },
    );

  const search = searchParams.get("q") ?? "";
  const formatFilter = searchParams.get("format") as FormatKind | null;
  const adTypeFilter = searchParams.get("adtype") as AdType | null;
  const sort = (searchParams.get("sort") as SortKey | null) ?? "recent";
  const forceLoading = searchParams.get("loading") === "1";
  const forceEmpty = searchParams.get("empty") === "1";

  // Saved-store gives us the user-saved-during-this-session concepts.
  const { concepts: savedConcepts } = useSavedStore();

  const allItems: ConceptItem[] = useMemo(
    () => (forceEmpty ? [] : buildConceptItems(savedConcepts)),
    [savedConcepts, forceEmpty],
  );

  // Apply filters + sort.
  const filtered = useMemo(() => {
    let list = allItems;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }
    if (formatFilter) list = list.filter((c) => c.formatKind === formatFilter);
    if (adTypeFilter) list = list.filter((c) => c.adType === adTypeFilter);

    const sorted = [...list];
    if (sort === "recent") sorted.sort((a, b) => +b.capturedAt - +a.capturedAt);
    else if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "generations") sorted.sort((a, b) => b.generationCount - a.generationCount);
    return sorted;
  }, [allItems, search, formatFilter, adTypeFilter, sort]);

  // Best-effort real usage — RunBatch carries no concept-id linkage field
  // (genieRunTypes.ts's `config` is format/approach/model/angle/language/
  // aspectRatio/promptSnippet/brandName/productName only), so this is a
  // heuristic text match against each batch's label/promptSnippet, not a
  // real foreign key. See this module's final report for the honest
  // limitation. Falls back to the static generationCount when nothing
  // matches, exactly as before this pass.
  const batches = useBatches();
  const usageBoost = useMemo(() => {
    const map = new Map<string, { runs: number; lastUsedAt: Date | null }>();
    for (const item of filtered) {
      let extra = 0;
      let lastUsedAt: Date | null = null;
      for (const b of batches) {
        const haystack = `${b.label} ${b.config?.promptSnippet ?? ""}`.toLowerCase();
        if (!haystack.includes(item.name.toLowerCase())) continue;
        extra += 1;
        const createdAt = new Date(b.createdAt);
        if (!lastUsedAt || createdAt > lastUsedAt) lastUsedAt = createdAt;
      }
      if (extra > 0) {
        map.set(item.id, { runs: item.generationCount + extra, lastUsedAt });
      }
    }
    return map;
  }, [filtered, batches]);

  // Active-filter chips (X to clear).
  const activeChips: { key: string; label: string }[] = [];
  if (formatFilter) activeChips.push({ key: "format", label: `Format · ${FORMAT_LABEL[formatFilter]}` });
  if (adTypeFilter) activeChips.push({ key: "adtype", label: `Ad type · ${AD_TYPE_LABEL[adTypeFilter]}` });

  const clearAll = () => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        ["q", "format", "adtype"].forEach((k) => sp.delete(k));
        return sp;
      },
      { replace: true },
    );
  };

  // ── Selection (multi-select → bulk generate, §12) ──────────────────────
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectedItems = filtered.filter((i) => selectedIds.has(i.id));

  const toggleSelect = (item: ConceptItem) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  };
  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const imageCount = selectedItems.filter((i) => i.formatKind === "image").length;
  const videoCount = selectedItems.filter((i) => i.formatKind === "video").length;
  const mixedFormat = imageCount > 0 && videoCount > 0;

  const keepOnlyFormat = (format: FormatKind) => {
    setSelectedIds((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        const item = filtered.find((i) => i.id === id);
        if (item && item.formatKind === format) next.add(id);
      }
      return next;
    });
  };

  // ── Hand-off to Studio ──────────────────────────────────────────────────
  // §6 Rule 2: "Use X always asks for the entity explicitly — even when the
  // source already contains it." So this deliberately does NOT pre-select a
  // brand/product/category (Studio's ?brand=/?product=/?category= params
  // hard-select today, not merely highlight — there's no "highlight only"
  // param yet). It DOES pre-fill ?format=, since Format is not an entity and
  // Studio needs exactly one format for the whole batch anyway.
  //
  // ?concepts=<comma of raw concept ids> is passed for forward-compat, but
  // is NOT read by useUrlSync.ts / StudioAlpha.tsx's readUrlIntoState as of
  // this pass (verified by reading both) — see final report. Landing on the
  // "product" step slug forces category="ad" (readUrlIntoState sets this
  // for ANY step slug), which structurally excludes Product Shoot (only
  // reachable via StudioHome's category="asset" path) — this is the actual
  // mechanism behind "Product Shoot is excluded from this path", not just
  // the on-screen note in BulkGenerateBar.
  function buildStudioHandoffUrl(items: ConceptItem[]): string {
    const formats = new Set(items.map((i) => i.formatKind));
    const format = formats.size === 1 ? [...formats][0] : undefined;
    const params = new URLSearchParams();
    if (format) params.set("format", format);
    params.set("concepts", items.map((i) => i.rawId).join(","));
    return `/iq/genie6/studio-alpha/product?${params.toString()}`;
  }

  const handleUseToGenerate = (item: ConceptItem) => {
    navigate(buildStudioHandoffUrl([item]));
  };

  const handleBulkGenerate = () => {
    if (mixedFormat || selectedItems.length === 0) return;
    navigate(buildStudioHandoffUrl(selectedItems));
  };

  // ── Download (§12: 2 actions only — Download, Use concept to generate) ──
  const handleDownload = (item: ConceptItem) => {
    const lines = [
      `Concept: ${item.name}`,
      `Ad type: ${AD_TYPE_LABEL[item.adType]}`,
      `Format: ${item.formatRaw ?? FORMAT_LABEL[item.formatKind]}`,
      item.angle ? `Angle: ${item.angle}` : null,
      item.tone ? `Tone: ${item.tone}` : null,
      item.hook ? `Hook: ${item.hook}` : null,
      item.visualDirection ? `Visual direction: ${item.visualDirection}` : null,
    ]
      .filter(Boolean)
      .join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded "${item.name}"`);
  };

  const isTrueZeroData = allItems.length === 0;
  const isFilteredEmpty = !isTrueZeroData && filtered.length === 0;

  return (
    <div className="v3-page-mesh mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pt-8 pb-28">
      <div className="flex items-baseline gap-3">
        <HeroHeader title="Concepts" />
        <span className="font-mono text-[11px] text-muted-foreground">
          {filtered.length} of {allItems.length}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
            aria-pressed={selectMode}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors",
              selectMode
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border/60 bg-background/50 text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            {selectMode ? <XCircle className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
            {selectMode ? "Done selecting" : "Select"}
          </button>
          {/* A-12.60 (Maalik): structured AI generation entry point. */}
          <Link
            to="/iq/genie6/concepts/generate"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[12px] font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Generate with AI
          </Link>
        </div>
      </div>

      {/* Toolbar — §12: exactly 2 filters (Format, Ad type) + search + sort. */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setParam("q", e.target.value || null)}
            placeholder="Search concepts…"
            className="w-full rounded-full border border-border/60 bg-background/50 py-1.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-foreground/30"
          />
        </div>

        <SingleSelectFilter
          label="Format"
          value={formatFilter}
          options={(["image", "video"] as FormatKind[]).map((f) => ({ value: f, label: FORMAT_LABEL[f] }))}
          onChange={(v) => setParam("format", v)}
        />
        <SingleSelectFilter
          label="Ad type"
          value={adTypeFilter}
          options={(["brand", "product", "category"] as AdType[]).map((t) => ({ value: t, label: AD_TYPE_LABEL[t] }))}
          onChange={(v) => setParam("adtype", v)}
        />

        <SortDropdown value={sort} onChange={(v) => setParam("sort", v === "recent" ? null : v)} />
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeChips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setParam(c.key, null)}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/50 px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-foreground/30"
            >
              {c.label}
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Grid / states. */}
      {forceLoading ? (
        <LoadingGrid />
      ) : isTrueZeroData ? (
        <ZeroDataState />
      ) : isFilteredEmpty ? (
        <FilteredEmptyState onClear={clearAll} />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((item) => (
            <li key={item.id}>
              <ConceptCard
                item={item}
                usage={usageBoost.get(item.id)}
                selectMode={selectMode}
                selected={selectedIds.has(item.id)}
                onToggleSelect={() => toggleSelect(item)}
                onDownload={handleDownload}
                onUseToGenerate={handleUseToGenerate}
              />
            </li>
          ))}
        </ul>
      )}

      {selectMode && (
        <BulkGenerateBar
          count={selectedItems.length}
          mixedFormat={mixedFormat}
          imageCount={imageCount}
          videoCount={videoCount}
          onKeepFormat={keepOnlyFormat}
          onClear={() => setSelectedIds(new Set())}
          onGenerate={handleBulkGenerate}
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  Empty / loading states — populated / partial / zero-data
 *  per the design-system state-coverage mandate. "0 concepts
 *  matching a filter" and "0 concepts at all" are deliberately
 *  two different screens with two different exits (§ constraints).
 * ────────────────────────────────────────────────────────── */
function ZeroDataState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-background/30 px-6 py-16 text-center">
      <Sparkles className="h-7 w-7 text-muted-foreground/40" aria-hidden />
      <p className="text-sm font-semibold text-foreground">No concepts yet</p>
      <p className="max-w-xs text-[12px] text-muted-foreground">
        Concepts pulled from your Catalogue and Knowledge Base — or generated with AI — show up here.
      </p>
      <Link
        to="/iq/genie6/concepts/generate"
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Generate with AI
      </Link>
    </div>
  );
}

function FilteredEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-background/30 px-6 py-16 text-center">
      <Filter className="h-7 w-7 text-muted-foreground/40" aria-hidden />
      <p className="text-sm font-semibold text-foreground">No concepts match your filters</p>
      <button
        type="button"
        onClick={onClear}
        className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90"
      >
        Clear all filters
      </button>
    </div>
  );
}

function LoadingGrid() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <li key={i} className="flex flex-col overflow-hidden rounded-xl border border-border/40">
          <div className="aspect-[4/3] w-full animate-pulse bg-muted" />
          <div className="flex flex-col gap-1.5 px-2 py-1.5">
            <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  SingleSelectFilter — one of the two §12 filters (Format / Ad type).
 *  Same popover idiom as the file's previous FilterPopover, narrowed to a
 *  fixed, small option set (no search box needed at 2-3 options).
 * ────────────────────────────────────────────────────────── */
function SingleSelectFilter<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (next: T | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = !!value;
  const activeLabel = options.find((o) => o.value === value)?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium transition-colors",
            active
              ? "border-foreground/20 bg-foreground/[0.06] text-foreground"
              : "border-border/60 bg-background/50 text-muted-foreground hover:border-foreground/20 hover:text-foreground",
          )}
        >
          <Filter className="h-3 w-3" />
          {label}
          {active && <span className="font-mono text-[10px] text-muted-foreground">·</span>}
          {active && <span>{activeLabel}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-48 p-1">
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setOpen(false);
          }}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
            !value ? "bg-foreground/[0.06]" : "hover:bg-foreground/[0.04]",
          )}
        >
          <span className="flex-1 font-medium">All {label.toLowerCase()}</span>
          {!value && <Check className="h-3.5 w-3.5 text-foreground" />}
        </button>
        {options.map((o) => {
          const isActive = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                isActive ? "bg-foreground/[0.06]" : "hover:bg-foreground/[0.04]",
              )}
            >
              <span className="flex-1 truncate">{o.label}</span>
              {isActive && <Check className="h-3.5 w-3.5 text-foreground" />}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  SortDropdown — Recent / Name / Generations.
 * ────────────────────────────────────────────────────────── */
type SortKey = "recent" | "name" | "generations";

const SORT_LABEL: Record<SortKey, string> = {
  recent: "Recent",
  name: "Name (A-Z)",
  generations: "Most generated",
};

function SortDropdown({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (next: SortKey) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border/60 bg-background/50 px-3 text-[11px] font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
        >
          Sort · <span className="text-foreground">{SORT_LABEL[value]}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-1">
        {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => {
          const isActive = value === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => {
                onChange(k);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                isActive ? "bg-foreground/[0.06]" : "hover:bg-foreground/[0.04]",
              )}
            >
              <span className="flex-1">{SORT_LABEL[k]}</span>
              {isActive && <Check className="h-3.5 w-3.5 text-foreground" />}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
