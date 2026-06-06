import { useMemo, useState } from "react";
import { Check, FolderOpen, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AttachedRef } from "../state/useWizard";
import {
  LIBRARY_MEDIA,
  LIBRARY_BRANDS,
  type LibraryAsset,
  type LibrarySource,
} from "@/mocks/shared/library-items";

/**
 * LibraryColumnDrawer — Step 4 right-rail body for "From Library" (Track C).
 *
 * A-12.8x (Maalik): sourced from the REAL Creative Library pool
 * (LIBRARY_MEDIA, ~150 items) instead of an inline mock. Adds lightweight
 * filter chips (brand · source · format) + a search input. When a brand is
 * selected in the wizard, the picker default-scopes to it with an easy
 * "All brands" toggle.
 *
 * Sticky header (title + close + search), filter chip row, scroll body
 * (3-col 4:5 grid with brand chip + format chip), sticky footer
 * (Cancel + Save · n).
 *
 * Card baseline matches AvatarVoiceRail's voice-card pattern:
 * rounded-xl + glass + hover-lift + selected ring.
 */

interface LibraryColumnDrawerProps {
  /** Resolved from wizard.state.brandId. Default-scopes the brand filter. */
  brandId?: string | null;
  onSave: (refs: AttachedRef[]) => void;
  onCancel: () => void;
}

type FormatFilter = "all" | "image" | "video";
type SourceFilter = "all" | LibrarySource;

const FORMAT_CHIP_LABEL: Record<Exclude<FormatFilter, "all">, string> = {
  image: "Static",
  video: "Video",
};

const SOURCE_LABEL: Record<LibrarySource, string> = {
  uploaded: "Uploaded",
  generated: "Genie",
  "pinned-insights": "Insights",
  reference: "Reference",
  imported: "Imported",
};

/** Brand id → display name (library subset). */
const BRAND_NAME = new Map(LIBRARY_BRANDS.map((b) => [b.id, b.name] as const));

/** ISO date → "2h ago" / "Yesterday" / "3 days" / "2 weeks". */
function relativeAge(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days} days`;
  const weeks = Math.floor(days / 7);
  return `${weeks} weeks`;
}

/** "mamaearth-onion-oil-hero-03.jpg" → "Onion oil hero 03". */
function titleFromFileName(fileName: string, brandId: string | null): string {
  let stem = fileName.replace(/\.[a-z0-9]+$/i, "");
  if (brandId && stem.startsWith(`${brandId}-`)) {
    stem = stem.slice(brandId.length + 1);
  } else if (stem.startsWith("library-")) {
    stem = stem.slice("library-".length);
  }
  const words = stem.replace(/-/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function LibraryColumnDrawer({
  brandId = null,
  onSave,
  onCancel,
}: LibraryColumnDrawerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  // Default-scope to the wizard brand IF it exists in the library pool;
  // otherwise start on "all" so the picker never opens empty.
  const brandInPool = brandId != null && BRAND_NAME.has(brandId);
  const [brandFilter, setBrandFilter] = useState<string | "all">(
    brandInPool ? (brandId as string) : "all",
  );
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [formatFilter, setFormatFilter] = useState<FormatFilter>("all");

  // Sources actually present in the pool (so we don't render dead chips).
  const sourcesPresent = useMemo(() => {
    const set = new Set<LibrarySource>();
    LIBRARY_MEDIA.forEach((m) => set.add(m.source));
    return (Object.keys(SOURCE_LABEL) as LibrarySource[]).filter((s) =>
      set.has(s),
    );
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return LIBRARY_MEDIA.filter((m) => {
      if (brandFilter !== "all" && m.brand_id !== brandFilter) return false;
      if (sourceFilter !== "all" && m.source !== sourceFilter) return false;
      if (formatFilter !== "all" && m.file_type !== formatFilter) return false;
      if (q) {
        const brandName = m.brand_id ? BRAND_NAME.get(m.brand_id) ?? "" : "";
        const hay = `${m.file_name} ${brandName} ${m.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [search, brandFilter, sourceFilter, formatFilter]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSave = () => {
    const byId = new Map(LIBRARY_MEDIA.map((m) => [m.id, m] as const));
    const refs: AttachedRef[] = Array.from(selected)
      .map((id) => byId.get(id))
      .filter((m): m is LibraryAsset => Boolean(m))
      .map((m) => ({
        id: m.id,
        source: "library",
        label: titleFromFileName(m.file_name, m.brand_id),
        thumbnail: m.url ?? undefined,
      }));
    onSave(refs);
  };

  const n = selected.size;
  const resetFilters = () => {
    setBrandFilter("all");
    setSourceFilter("all");
    setFormatFilter("all");
    setSearch("");
  };
  const filtersActive =
    brandFilter !== "all" ||
    sourceFilter !== "all" ||
    formatFilter !== "all" ||
    search.trim().length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Sticky header — title + count + search + close */}
      <header className="shrink-0 border-b border-border px-3 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Saved assets
            </p>
            <h3 className="text-sm font-semibold text-foreground">
              Library
              <span className="ml-1.5 font-mono text-[11px] font-normal text-muted-foreground">
                {filtered.length}
              </span>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-40">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search assets…"
                className="h-7 w-full rounded-full border border-border/60 bg-background/50 pl-7 pr-2 text-[11px] outline-none transition-colors focus:border-foreground/30"
              />
            </div>
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close library"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Filter chips — brand · source · format. Horizontal scroll, no wrap. */}
        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <FilterGroup label="Brand">
            <Chip
              active={brandFilter === "all"}
              onClick={() => setBrandFilter("all")}
            >
              All
            </Chip>
            {LIBRARY_BRANDS.map((b) => (
              <Chip
                key={b.id}
                active={brandFilter === b.id}
                onClick={() => setBrandFilter(b.id)}
              >
                {b.name}
              </Chip>
            ))}
          </FilterGroup>

          <Divider />

          <FilterGroup label="Source">
            <Chip
              active={sourceFilter === "all"}
              onClick={() => setSourceFilter("all")}
            >
              All
            </Chip>
            {sourcesPresent.map((s) => (
              <Chip
                key={s}
                active={sourceFilter === s}
                onClick={() => setSourceFilter(s)}
              >
                {SOURCE_LABEL[s]}
              </Chip>
            ))}
          </FilterGroup>

          <Divider />

          <FilterGroup label="Format">
            <Chip
              active={formatFilter === "all"}
              onClick={() => setFormatFilter("all")}
            >
              All
            </Chip>
            {(["image", "video"] as const).map((f) => (
              <Chip
                key={f}
                active={formatFilter === f}
                onClick={() => setFormatFilter(f)}
              >
                {FORMAT_CHIP_LABEL[f]}
              </Chip>
            ))}
          </FilterGroup>
        </div>
      </header>

      {/* Scroll body — 3-col 4:5 grid */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <EmptyLibrary onReset={filtersActive ? resetFilters : undefined} />
        ) : (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {filtered.map((item) => {
              const isSelected = selected.has(item.id);
              const brandName = item.brand_id
                ? BRAND_NAME.get(item.brand_id)
                : undefined;
              return (
                <li key={item.id}>
                  <MediaCard
                    thumbnail={item.url ?? ""}
                    alt={item.file_name}
                    brand={brandName}
                    format={
                      item.file_type === "video"
                        ? "Video"
                        : "Static"
                    }
                    title={titleFromFileName(item.file_name, item.brand_id)}
                    stats={`${SOURCE_LABEL[item.source]} · ${relativeAge(item.created_at)}`}
                    selected={isSelected}
                    onClick={() => toggle(item.id)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Sticky footer */}
      <footer className="shrink-0 flex items-center justify-end gap-2 border-t border-border px-3 py-2.5">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={n === 0}
          className={cn(
            "inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition-opacity",
            "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          Save{n > 0 && <span className="font-mono opacity-90">· {n}</span>}
        </button>
      </footer>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── *
 * FilterGroup — labelled inline chip cluster (mono uppercase eyebrow).
 * ────────────────────────────────────────────────────────────────────── */
function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </span>
      {children}
    </div>
  );
}

function Divider() {
  return <span aria-hidden className="h-4 w-px shrink-0 bg-border/60" />;
}

/* ────────────────────────────────────────────────────────────────────── *
 * Chip — pill toggle. Active = lime-tinted, idle = ghost-outline.
 * ────────────────────────────────────────────────────────────────────── */
function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-full border px-2.5 text-[11px] font-medium transition-colors",
        active
          ? "border-primary/40 bg-primary/[0.10] text-primary"
          : "border-border/60 bg-background/50 text-foreground/70 hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────── *
 * EmptyLibrary — composed empty state for "no matches".
 * ────────────────────────────────────────────────────────────────────── */
function EmptyLibrary({ onReset }: { onReset?: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FolderOpen className="h-4 w-4" />
      </span>
      <p className="text-[13px] font-semibold text-foreground">
        No assets match these filters
      </p>
      <p className="mt-1 max-w-[36ch] text-[11px] leading-snug text-muted-foreground">
        Try a different brand, source, or format — or clear the filters to see
        the full library.
      </p>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-3 inline-flex items-center rounded-full border border-border/60 bg-background/50 px-3 py-1 text-[11px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── *
 * MediaCard — shared baseline for all picker media tiles.
 * Glass card (rounded-xl, bg-card/60, backdrop-blur), 4:5 thumb,
 * brand chip top-left, format chip top-right, selected ring + check.
 * Title (line-2) + stats (mono).
 * ────────────────────────────────────────────────────────────────────── */
function MediaCard({
  thumbnail,
  alt,
  brand,
  format,
  title,
  stats,
  selected,
  onClick,
}: {
  thumbnail: string;
  alt: string;
  brand?: string;
  format?: string;
  title: string;
  stats?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group flex h-full w-full flex-col overflow-hidden rounded-xl border bg-card/60 text-left backdrop-blur-sm transition-all",
        selected
          ? "border-primary/50 bg-primary/5 ring-2 ring-primary/30"
          : "border-border/40 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md",
      )}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
        <img
          src={thumbnail}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform group-hover:scale-[1.04]"
        />
        {brand && (
          <span className="absolute left-1.5 top-1.5 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
            {brand}
          </span>
        )}
        {format && (
          <span className="absolute right-1.5 top-1.5 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase text-foreground backdrop-blur">
            {format}
          </span>
        )}
        {selected && (
          <span className="absolute right-1.5 bottom-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0.5 px-2.5 py-2">
        <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-foreground">
          {title}
        </p>
        {stats && (
          <p className="font-mono text-[10px] text-muted-foreground">{stats}</p>
        )}
      </div>
    </button>
  );
}
