import { useMemo, useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AttachedRef } from "../state/useWizard";
import {
  LIBRARY_MEDIA,
  LIBRARY_BRANDS,
  type LibraryAsset,
} from "@/mocks/shared/library-items";
import { WINNER_ADS, type WinnerAd } from "@/mocks/shared/winnerAds";

/**
 * IndustryInsightsPicker — Step 4 right-rail body for "Industry Insights"
 * (Track C). Same chassis as LibraryColumnDrawer / BrandWinnerAdsDrawer:
 * sticky header → scrollable selectable MediaCard grid → "Save · n" footer,
 * with a composed empty state so the picker never blanks.
 *
 * What it shows: items that entered the workspace FROM Industry Insights —
 *   • LIBRARY_MEDIA where source === "pinned-insights" (competitor ads the
 *     user pinned from the Insights surface), AND
 *   • WINNER_ADS where source === "saved-from-insights".
 * Both are normalised into one card shape (thumbnail + label + an "Insights"
 * provenance chip + a CTR metric when present).
 *
 * Entity scope: when brandId / productId is set AND items carry that id, the
 * list scopes to it (with a soft fallback banner if scoping would empty the
 * list). Otherwise all insights items are shown.
 *
 * Refs use the EXISTING "library" AttachSource value — no new union member is
 * introduced (these are saved/pinned library-side artefacts).
 */

interface IndustryInsightsPickerProps {
  onSave: (refs: AttachedRef[]) => void;
  onClose: () => void;
  /** Resolved from wizard.state.brandId. Scopes the list when items match. */
  brandId?: string | null;
  /** Resolved from wizard.state.productId. Scopes the list when items match. */
  productId?: string | null;
}

/** Normalised card — both data sources collapse into this shape. */
interface InsightCard {
  id: string;
  thumbnail: string;
  label: string;
  /** Resolved brand id for entity-scoping + the brand chip (may be null). */
  brandId: string | null;
  /** "image" | "video" | "carousel" — drives the format chip. */
  format: WinnerAd["format"] | "image" | "video";
  /** Pre-formatted metric line, e.g. "3.8% CTR" (null when no metric). */
  metric: string | null;
}

const FORMAT_LABEL: Record<string, string> = {
  image: "Static",
  video: "Video",
  carousel: "Carousel",
};

/** Brand id → display name (library subset; covers winner-ad brand ids too). */
const BRAND_NAME = new Map(LIBRARY_BRANDS.map((b) => [b.id, b.name] as const));

/** 0.038 → "3.8% CTR". */
function ctrLabel(ctr?: number): string | null {
  if (ctr == null) return null;
  return `${(ctr * 100).toFixed(1)}% CTR`;
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

/** A library/winner brand id that is one of THIS product's parents? */
function productMatchesBrand(productId: string, brandId: string | null): boolean {
  // Mock product ids are slugged "<brand>-<product>" (e.g.
  // "mamaearth-onion-shampoo"). When an item is brand-scoped, treat it as a
  // match if the product id starts with that brand id.
  return brandId != null && productId.startsWith(`${brandId}-`);
}

export function IndustryInsightsPicker({
  onSave,
  onClose,
  brandId = null,
  productId = null,
}: IndustryInsightsPickerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Readable brand name for the eyebrow + empty-state copy.
  const brandName = useMemo(
    () => (brandId ? BRAND_NAME.get(brandId) ?? null : null),
    [brandId],
  );

  // 1) Pull every insights-provenance item from BOTH sources, normalise.
  const allInsights = useMemo<InsightCard[]>(() => {
    const fromLibrary: InsightCard[] = LIBRARY_MEDIA.filter(
      (m): m is LibraryAsset => m.source === "pinned-insights",
    ).map((m) => ({
      id: m.id,
      thumbnail: m.url ?? "",
      label: titleFromFileName(m.file_name, m.brand_id),
      brandId: m.brand_id,
      format: m.file_type === "video" ? "video" : "image",
      metric: null, // library media carries no CTR
    }));

    const fromWinners: InsightCard[] = WINNER_ADS.filter(
      (w) => w.source === "saved-from-insights",
    ).map((w) => ({
      id: w.id,
      thumbnail: w.thumbnail ?? "",
      label: w.headline,
      // Winner ads are keyed by entityType; only "brand" entityIds map to a
      // brand id. Product/category winners stay unscoped (brandId = null) so
      // they don't get filtered out by a brand pick.
      brandId: w.entityType === "brand" ? (w.entityId as string) : null,
      format: w.format,
      metric: ctrLabel(w.ctr),
    }));

    return [...fromWinners, ...fromLibrary];
  }, []);

  // 2) Entity-scope by brand/product WHEN items carry the id; else show all.
  const { items, isFallback } = useMemo(() => {
    // Items that explicitly belong to the active entity.
    const matchesEntity = (c: InsightCard): boolean => {
      if (productId) {
        // Product winners (id === productId) OR brand-scoped items whose brand
        // is this product's parent brand.
        return c.id === productId || productMatchesBrand(productId, c.brandId);
      }
      if (brandId) return c.brandId === brandId;
      return true;
    };

    if (!brandId && !productId) {
      return { items: allInsights, isFallback: false };
    }
    const scoped = allInsights.filter(matchesEntity);
    // If scoping would empty the picker but insights DO exist, fall back to the
    // full set with a soft banner rather than showing a dead empty state.
    if (scoped.length === 0 && allInsights.length > 0) {
      return { items: allInsights, isFallback: true };
    }
    return { items: scoped, isFallback: false };
  }, [allInsights, brandId, productId]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSave = () => {
    const refs: AttachedRef[] = items
      .filter((i) => selected.has(i.id))
      .map((i) => ({
        id: i.id,
        source: "library", // existing AttachSource union value — not invented
        label: i.label,
        thumbnail: i.thumbnail || undefined,
      }));
    onSave(refs);
  };

  const n = selected.size;
  const scopeLabel = productId
    ? "Product"
    : brandName
      ? `${brandName}`
      : "All brands";

  return (
    <div className="flex h-full flex-col">
      {/* Sticky header — eyebrow + title + count + close */}
      <header className="shrink-0 flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {scopeLabel} · pinned from Insights
          </p>
          <h3 className="text-sm font-semibold text-foreground">
            Industry Insights
            <span className="ml-1.5 font-mono text-[11px] font-normal text-muted-foreground">
              {items.length}
            </span>
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Industry Insights"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      {/* Fallback banner — scope had no insights, showing all. */}
      {isFallback && items.length > 0 && (
        <div className="shrink-0 border-b border-border/40 bg-muted/30 px-3 py-1.5">
          <p className="text-[11px] text-muted-foreground">
            No pinned insights for {brandName ?? "this selection"} yet — showing
            insights across all brands.
          </p>
        </div>
      )}

      {/* Scroll body — 3/4-col 4:5 grid */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        {items.length === 0 ? (
          <EmptyInsights brandName={brandName} />
        ) : (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {items.map((item) => {
              const isSelected = selected.has(item.id);
              const chipBrand = item.brandId
                ? BRAND_NAME.get(item.brandId)
                : undefined;
              return (
                <li key={item.id}>
                  <InsightMediaCard
                    thumbnail={item.thumbnail}
                    alt={item.label}
                    brand={chipBrand}
                    format={FORMAT_LABEL[item.format] ?? "Static"}
                    title={item.label}
                    metric={item.metric}
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
          onClick={onClose}
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
 * InsightMediaCard — glass tile with an "Insights" provenance chip.
 * Mirrors the MediaCard chassis used across the Step-4 pickers:
 * rounded-xl + bg-card/60 + 4:5 thumb, brand chip top-left, format chip
 * top-right, provenance chip bottom-left, selected ring + check.
 * ────────────────────────────────────────────────────────────────────── */
function InsightMediaCard({
  thumbnail,
  alt,
  brand,
  format,
  title,
  metric,
  selected,
  onClick,
}: {
  thumbnail: string;
  alt: string;
  brand?: string;
  format: string;
  title: string;
  metric: string | null;
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
        <span className="absolute right-1.5 top-1.5 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase text-foreground backdrop-blur">
          {format}
        </span>
        {/* Provenance chip — lime-tinted, lower-left. */}
        <span className="absolute left-1.5 bottom-1.5 inline-flex items-center gap-1 rounded bg-primary/90 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-primary-foreground backdrop-blur">
          <Sparkles className="h-2.5 w-2.5" strokeWidth={2.5} />
          Insights
        </span>
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
        {metric && (
          <p className="font-mono text-[10px] text-muted-foreground">{metric}</p>
        )}
      </div>
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────── *
 * EmptyInsights — composed empty state (icon + line + sub-line).
 * Never blank: explains how items land here.
 * ────────────────────────────────────────────────────────────────────── */
function EmptyInsights({ brandName }: { brandName: string | null }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Sparkles className="h-4 w-4" />
      </span>
      <p className="text-[13px] font-semibold text-foreground">
        No pinned insights yet{brandName ? ` for ${brandName}` : ""}
      </p>
      <p className="mt-1 max-w-[36ch] text-[11px] leading-snug text-muted-foreground">
        Pin competitor ads from the Industry Insights surface and they'll show
        up here, ready to attach as references.
      </p>
    </div>
  );
}
