import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  Check,
  Filter,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  brands,
  products,
  categories,
  concepts as catalogueConcepts,
  KB_CONCEPTS,
} from "@/mocks/shared";
import { sampleOutputs } from "@/genie6/mocks/sample-outputs";
import { HeroHeader } from "@/genie6/studio-v4/components/HeroHeader";
import { SectionHeader } from "@/genie6/studio-v4/components/SectionHeader";

/**
 * ConceptsLibrary — full-page library at /iq/genie6/concepts.
 *
 * Aggregates 3 sources of concepts:
 *   1. Catalogue concepts (50+) from @/mocks/shared/concepts.ts.
 *   2. KB-attached concepts (~9) from @/mocks/shared/kbConcepts.ts.
 *   3. User-saved (empty stub for now — future: lift global state).
 *
 * Filters: search · angle · format · brand · product · category · source · tone
 *          · date range. Sort: recent / name / generations.
 *
 * URL-backed state via useSearchParams so any filter+sort combo is shareable.
 */

type SourceKey =
  | "catalogue"
  | "kb"
  | "saved-from-genie"
  | "saved-from-insights";

interface ConceptItem {
  id: string;
  name: string;
  thumbnail?: string;
  angle?: string;
  format?: string;
  tone?: string;
  brandId?: string;
  productId?: string;
  categoryId?: string;
  source: SourceKey;
  capturedAt: Date;
  generationCount: number;
}

const SOURCE_LABEL: Record<SourceKey, string> = {
  catalogue: "Catalogue",
  kb: "Knowledge Base",
  "saved-from-genie": "Genie",
  "saved-from-insights": "Insights",
};

type SortKey = "recent" | "name" | "generations";

const SORT_LABEL: Record<SortKey, string> = {
  recent: "Recent",
  name: "Name (A-Z)",
  generations: "Most generated",
};

/** Stable pseudo-date so catalogue concepts sort consistently. */
function deriveCapturedAt(id: string): Date {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  const daysAgo = h % 90; // within last 90 days
  return new Date(Date.now() - daysAgo * 86400_000);
}

/** Pool of real ad thumbnails sourced from sampleOutputs (Unsplash URLs).
 *  Used for catalogue concepts that lack their own thumbnail. */
const REAL_THUMB_POOL: string[] = sampleOutputs
  .map((o) => o.thumbnail)
  .filter((t): t is string => typeof t === "string");

/** Deterministic mapping: concept id → real thumbnail from sampleOutputs. */
function deriveThumbnail(id: string): string | undefined {
  if (REAL_THUMB_POOL.length === 0) return undefined;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return REAL_THUMB_POOL[h % REAL_THUMB_POOL.length];
}

function formatAge(d: Date): string {
  const ms = Date.now() - d.getTime();
  const days = Math.floor(ms / 86400_000);
  if (days < 1) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function ConceptsLibrary() {
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
  const angleFilter = searchParams.get("angle");
  const formatFilter = searchParams.get("format");
  const brandFilter = searchParams.get("brand");
  const productFilter = searchParams.get("product");
  const categoryFilter = searchParams.get("category");
  const sourceFilter = searchParams.get("source");
  const toneFilter = searchParams.get("tone");
  const sort = (searchParams.get("sort") as SortKey | null) ?? "recent";

  // Build unified feed.
  const items: ConceptItem[] = useMemo(() => {
    const fromCatalogue: ConceptItem[] = catalogueConcepts.map((c) => ({
      id: `cat-${c.id}`,
      name: c.name,
      thumbnail: deriveThumbnail(c.id),
      angle: c.angle,
      tone: c.tone,
      format: c.format,
      brandId: c.brandId,
      source: "catalogue" as const,
      capturedAt: deriveCapturedAt(c.id),
      generationCount: c.generationCount,
    }));
    const fromKb: ConceptItem[] = KB_CONCEPTS.map((c) => ({
      id: `kb-${c.id}`,
      name: c.name,
      thumbnail: c.thumbnail ?? deriveThumbnail(c.id),
      tone: c.tone,
      brandId: c.entityType === "brand" ? (c.entityId as string) : undefined,
      productId: c.entityType === "product" ? (c.entityId as string) : undefined,
      categoryId: c.entityType === "category" ? (c.entityId as string) : undefined,
      source:
        c.source === "from-winner-ad"
          ? ("kb" as const)
          : c.source === "saved-from-genie"
            ? ("saved-from-genie" as const)
            : ("saved-from-insights" as const),
      capturedAt: c.capturedAt,
      generationCount: 0,
    }));
    return [...fromCatalogue, ...fromKb];
  }, []);

  // Distinct option lists.
  const angleOptions = useMemo(
    () => Array.from(new Set(items.map((i) => i.angle).filter(Boolean))) as string[],
    [items],
  );
  const formatOptions = useMemo(
    () => Array.from(new Set(items.map((i) => i.format).filter(Boolean))) as string[],
    [items],
  );
  const toneOptions = useMemo(
    () => Array.from(new Set(items.map((i) => i.tone).filter(Boolean))) as string[],
    [items],
  );

  // Apply filters + sort.
  const filtered = useMemo(() => {
    let list = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }
    if (angleFilter) list = list.filter((c) => c.angle === angleFilter);
    if (formatFilter) list = list.filter((c) => c.format === formatFilter);
    if (brandFilter) list = list.filter((c) => c.brandId === brandFilter);
    if (productFilter) list = list.filter((c) => c.productId === productFilter);
    if (categoryFilter) list = list.filter((c) => c.categoryId === categoryFilter);
    if (sourceFilter) list = list.filter((c) => c.source === sourceFilter);
    if (toneFilter) list = list.filter((c) => c.tone === toneFilter);

    const sorted = [...list];
    if (sort === "recent") sorted.sort((a, b) => +b.capturedAt - +a.capturedAt);
    else if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "generations") sorted.sort((a, b) => b.generationCount - a.generationCount);
    return sorted;
  }, [
    items,
    search,
    angleFilter,
    formatFilter,
    brandFilter,
    productFilter,
    categoryFilter,
    sourceFilter,
    toneFilter,
    sort,
  ]);

  // Active-filter chips (X to clear).
  const activeChips: { key: string; label: string }[] = [];
  if (angleFilter) activeChips.push({ key: "angle", label: `Angle · ${angleFilter}` });
  if (formatFilter) activeChips.push({ key: "format", label: `Format · ${formatFilter}` });
  if (brandFilter) {
    const b = brands.find((x) => x.id === brandFilter);
    activeChips.push({ key: "brand", label: `Brand · ${b?.name ?? brandFilter}` });
  }
  if (productFilter) {
    const p = products.find((x) => x.id === productFilter);
    activeChips.push({ key: "product", label: `Product · ${p?.name ?? productFilter}` });
  }
  if (categoryFilter) {
    const c = categories.find((x) => x.id === categoryFilter);
    activeChips.push({ key: "category", label: `Category · ${c?.name ?? categoryFilter}` });
  }
  if (sourceFilter) activeChips.push({ key: "source", label: `Source · ${SOURCE_LABEL[sourceFilter as SourceKey] ?? sourceFilter}` });
  if (toneFilter) activeChips.push({ key: "tone", label: `Tone · ${toneFilter}` });

  const clearAll = () => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        ["q", "angle", "format", "brand", "product", "category", "source", "tone"].forEach((k) => sp.delete(k));
        return sp;
      },
      { replace: true },
    );
  };

  return (
    <div className="v3-page-mesh mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pt-8 pb-10">
      <div className="flex items-baseline gap-3">
        <HeroHeader title="Concepts" />
        <span className="font-mono text-[11px] text-muted-foreground">
          {filtered.length} of {items.length}
        </span>
      </div>

      {/* Toolbar */}
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

        <FilterPopover
          label="Angle"
          options={angleOptions}
          value={angleFilter}
          onChange={(v) => setParam("angle", v)}
        />
        <FilterPopover
          label="Format"
          options={formatOptions}
          value={formatFilter}
          onChange={(v) => setParam("format", v)}
        />
        <FilterPopover
          label="Brand"
          options={brands.map((b) => ({ value: b.id, label: b.name }))}
          value={brandFilter}
          onChange={(v) => setParam("brand", v)}
          searchable
        />
        <FilterPopover
          label="Product"
          options={products.slice(0, 60).map((p) => ({ value: p.id, label: p.name }))}
          value={productFilter}
          onChange={(v) => setParam("product", v)}
          searchable
        />
        <FilterPopover
          label="Category"
          options={categories.slice(0, 60).map((c) => ({ value: c.id, label: c.name }))}
          value={categoryFilter}
          onChange={(v) => setParam("category", v)}
          searchable
        />
        <FilterPopover
          label="Source"
          options={(["catalogue", "kb", "saved-from-genie", "saved-from-insights"] as SourceKey[]).map((s) => ({ value: s, label: SOURCE_LABEL[s] }))}
          value={sourceFilter}
          onChange={(v) => setParam("source", v)}
        />
        <FilterPopover
          label="Tone"
          options={toneOptions}
          value={toneFilter}
          onChange={(v) => setParam("tone", v)}
        />

        <DatePresetPopover
          value={searchParams.get("preset")}
          onChange={(v) => setParam("preset", v)}
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

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-background/30 px-6 py-16 text-center">
          <Sparkles className="h-7 w-7 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-foreground">No concepts match your filters</p>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((item) => (
            <li key={item.id}>
              <ConceptCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  ConceptCard — single concept tile with thumbnail/monogram + chips.
 * ────────────────────────────────────────────────────────── */
function ConceptCard({ item }: { item: ConceptItem }) {
  const brand = item.brandId ? brands.find((b) => b.id === item.brandId) : null;

  return (
    <button
      type="button"
      className="group flex w-full flex-col overflow-hidden rounded-xl border border-border/40 bg-card/60 text-left backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md"
    >
      {/* Aspect 4:3 — synced with Step 4 trending strip cards. */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-muted-foreground/40">
            ✨
          </div>
        )}
        {brand && (
          <span className="absolute left-1.5 bottom-1.5 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
            {brand.name}
          </span>
        )}
        <span className="absolute right-1.5 top-1.5 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-foreground backdrop-blur">
          {SOURCE_LABEL[item.source]}
        </span>
      </div>
      <div className="flex flex-col gap-1 px-2 py-1.5">
        <p className="line-clamp-2 text-[11px] font-bold leading-tight text-foreground">
          {item.name}
        </p>
        <div className="flex flex-wrap items-center gap-1">
          {item.angle && (
            <span className="rounded-full bg-muted/50 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wide text-foreground">
              {item.angle}
            </span>
          )}
          {item.tone && (
            <span className="rounded-full bg-muted/50 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wide text-foreground">
              {item.tone}
            </span>
          )}
        </div>
        <p className="font-mono text-[10px] text-muted-foreground">
          {item.generationCount} runs · {formatAge(item.capturedAt)}
        </p>
      </div>
    </button>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  FilterPopover — single-select with optional search.
 * ────────────────────────────────────────────────────────── */
type FilterOption = string | { value: string; label: string };

function FilterPopover({
  label,
  options,
  value,
  onChange,
  searchable = false,
}: {
  label: string;
  options: FilterOption[];
  value: string | null;
  onChange: (next: string | null) => void;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const norm = (o: FilterOption) =>
    typeof o === "string" ? { value: o, label: o } : o;
  const filtered = options
    .map(norm)
    .filter((o) => !q || o.label.toLowerCase().includes(q.toLowerCase()));
  const active = !!value;

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
          {active && (
            <span className="font-mono text-[10px] text-muted-foreground">·</span>
          )}
          {active && <span>{norm(options.find((o) => norm(o).value === value) ?? value!).label}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-1">
        {searchable && (
          <div className="mb-1 px-1">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-md border border-border/60 bg-background/40 px-2.5 py-1.5 text-xs outline-none focus:border-foreground/30"
            />
          </div>
        )}
        <div className="max-h-[260px] overflow-y-auto">
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
          {filtered.map((o) => {
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
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  DatePresetPopover — Today / This week / This month / Custom (stub).
 * ────────────────────────────────────────────────────────── */
function DatePresetPopover({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const presets: { key: string; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "week", label: "This week" },
    { key: "month", label: "This month" },
    { key: "all", label: "All time" },
  ];
  const active = value && value !== "all";
  const label = value
    ? presets.find((p) => p.key === value)?.label ?? value
    : "Date";

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
          <CalendarIcon className="h-3 w-3" />
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-44 p-1">
        {presets.map((p) => {
          const isActive = (value ?? "all") === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                onChange(p.key === "all" ? null : p.key);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                isActive ? "bg-foreground/[0.06]" : "hover:bg-foreground/[0.04]",
              )}
            >
              <span className="flex-1">{p.label}</span>
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

// Suppress unused import warning if SectionHeader isn't used yet
void SectionHeader;
