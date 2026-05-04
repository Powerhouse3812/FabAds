import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, ChevronDown, Check, ArrowUpRight, PackagePlus, FilterX } from "lucide-react";
import { brands, products } from "@/mocks/shared";
import type { Product } from "@/genie6/types/entities";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SkeletonProductGrid } from "@/genie6/components/Skeletons";
import { cn } from "@/lib/utils";

/**
 * ProductPicker — A-10.1 single-picker entry to /studio (Generate).
 *
 * Replaces the old ModePicker-first flow. User picks a product directly.
 * Brand filter is a dropdown above the grid (optional narrowing). Search
 * matches both product name AND brand name as a fallback.
 *
 * Click product → /iq/genie6/generate/product/:productId (FormScaffold takes
 * over with smart-default mode).
 *
 * Pre-fill brand filter from URL: /iq/genie6/generate?brand=:brandId
 * (used when user came from a brand context, e.g. catalogue).
 *
 * Phase C state coverage (A-10.17):
 *   - `?loading=1` URL flag forces SkeletonProductGrid (matches the actual
 *     grid layout — no jarring shift when data lands). Mirrors the Library
 *     loading-flag pattern. Useful for stakeholder demos + previews while
 *     the real backend is wired.
 *   - Zero-data state now offers explicit recovery paths: Clear-search +
 *     Reset-filter + Browse-catalogue. Dead-end gone. Empty-state copy
 *     also distinguishes "no results for query" vs "no products at all"
 *     (the latter shouldn't happen in real data but ships safely).
 */
export function ProductPicker() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialBrand = searchParams.get("brand") ?? "all";
  const isLoading = searchParams.get("loading") === "1";

  const [query, setQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>(initialBrand);

  // Sync brand filter when URL changes
  useEffect(() => {
    const b = searchParams.get("brand");
    if (b) setBrandFilter(b);
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (brandFilter !== "all" && p.brandId !== brandFilter) return false;
      if (!q) return true;
      const brand = brands.find((b) => b.id === p.brandId);
      return (
        p.name.toLowerCase().includes(q) ||
        (brand?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [query, brandFilter]);

  const hasActiveFilter = brandFilter !== "all" || query.trim().length > 0;
  const selectedBrand = brandFilter === "all" ? null : brands.find((b) => b.id === brandFilter);

  const onPick = (product: Product) => {
    navigate(`/iq/genie6/generate/product/${product.id}`);
  };

  const resetAll = () => {
    setQuery("");
    setBrandFilter("all");
  };

  return (
    <div className="flex h-full flex-col p-4 g6-root">
      {/* Header */}
      <header className="mb-3 shrink-0">
        <p className="font-g6-mono text-g6-xs uppercase tracking-[0.18em] text-g6-text-tertiary">
          Studio · new generation
        </p>
        <h1 className="text-g6-h3 font-bold tracking-[-0.02em] text-g6-text mt-0.5">
          Pick a product
        </h1>
        <p className="text-g6-sm text-g6-text-secondary mt-0.5">
          Brand and ad mode are inferred from the product — you can override on the next step.
        </p>
      </header>

      {/* Filter row: brand dropdown + search */}
      <div className="mb-3 flex items-center gap-2 shrink-0">
        <BrandFilter value={brandFilter} onChange={setBrandFilter} />
        <div className="flex flex-1 items-center gap-2 rounded-g6-base border border-g6-border-secondary bg-g6-bg-base px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-g6-text-tertiary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product or brand…"
            className="bg-transparent text-g6-sm text-g6-text placeholder:text-g6-text-tertiary outline-none w-full"
          />
        </div>
        <span className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary tabular-nums whitespace-nowrap">
          {filteredProducts.length} products
        </span>
      </div>

      {/* Loading skeleton — `?loading=1` flag, mirrors Library's pattern */}
      {isLoading ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <SkeletonProductGrid count={8} />
        </div>
      ) : filteredProducts.length === 0 ? (
        /* Zero-data — recovery paths instead of dead-end (Phase C P1-G1).
           Distinguishes filter-narrowed vs no-products-anywhere. */
        <div className="flex flex-1 flex-col items-center justify-center rounded-g6-card border border-dashed border-g6-border-secondary bg-g6-bg-base/50 py-16 px-6 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-g6-bg-spotlight">
            <Search className="h-4 w-4 text-g6-text-tertiary" />
          </div>
          <p className="text-g6-base font-semibold text-g6-text">
            {hasActiveFilter
              ? `No products match ${query ? `"${query}"` : `${selectedBrand?.name ?? "this filter"}`}`
              : "No products yet"}
          </p>
          <p className="text-g6-sm text-g6-text-tertiary mt-1 max-w-sm">
            {hasActiveFilter
              ? "Try a different search term, switch brand, or clear filters."
              : "Add a product to your catalogue to start generating ads for it."}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {hasActiveFilter && (
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex items-center gap-1.5 rounded-g6-base border border-g6-border-secondary bg-g6-bg-container px-3 py-1.5 text-g6-sm text-g6-text hover:border-g6-border transition-colors"
              >
                <FilterX className="h-3.5 w-3.5" />
                Clear filters
              </button>
            )}
            <Link
              to="/catalogue/products"
              className="inline-flex items-center gap-1.5 rounded-g6-base bg-g6-primary px-3 py-1.5 text-g6-sm font-medium text-g6-text-on-accent hover:bg-g6-primary-hover transition-colors"
            >
              <PackagePlus className="h-3.5 w-3.5" />
              Browse catalogue
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((p) => (
              <ProductCard key={p.id} product={p} onClick={() => onPick(p)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 *  BrandFilter — dropdown with quick search
 * ───────────────────────────────────────────────────────── */
function BrandFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = value === "all" ? null : brands.find((b) => b.id === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-g6-base border border-g6-border-secondary bg-g6-bg-base px-2.5 py-1.5 text-g6-sm text-g6-text hover:border-g6-border transition-colors min-w-[160px]"
        >
          {selected?.logo && <img src={selected.logo} alt="" className="h-4 w-4 rounded-sm" />}
          <span className="flex-1 text-left truncate">
            {selected?.name ?? "All brands"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-g6-text-tertiary shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-1.5">
        <div className="flex items-center gap-2 rounded-g6-base bg-g6-bg-spotlight px-2 py-1 mb-1.5">
          <Search className="h-3 w-3 text-g6-text-tertiary shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find brand…"
            className="bg-transparent text-g6-xs text-g6-text placeholder:text-g6-text-tertiary outline-none w-full"
          />
        </div>
        <div className="max-h-[280px] overflow-y-auto">
          <BrandOption
            active={value === "all"}
            onClick={() => {
              onChange("all");
              setOpen(false);
            }}
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-g6-bg-spotlight">
              <span className="text-g6-xs text-g6-text-tertiary">★</span>
            </div>
            <span className="flex-1 truncate">All brands</span>
          </BrandOption>
          {filtered.map((b) => (
            <BrandOption
              key={b.id}
              active={value === b.id}
              onClick={() => {
                onChange(b.id);
                setOpen(false);
              }}
            >
              {b.logo ? (
                <img src={b.logo} alt="" className="h-5 w-5 rounded-sm" />
              ) : (
                <div className="h-5 w-5 rounded-sm bg-g6-bg-spotlight" />
              )}
              <span className="flex-1 truncate">{b.name}</span>
            </BrandOption>
          ))}
          {filtered.length === 0 && (
            <p className="px-2 py-3 text-g6-xs text-g6-text-tertiary text-center">
              No brands match.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function BrandOption({
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
      className={cn(
        "w-full flex items-center gap-2 rounded-g6-base px-2 py-1.5 text-left transition-colors text-g6-sm",
        active
          ? "bg-g6-primary/10 text-g6-primary-active"
          : "text-g6-text hover:bg-g6-bg-spotlight/50"
      )}
    >
      {children}
      {active && <Check className="h-3.5 w-3.5 shrink-0 text-g6-primary-active" />}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
 *  ProductCard — grid tile
 * ───────────────────────────────────────────────────────── */
function ProductCard({
  product,
  onClick,
}: {
  product: Product;
  onClick: () => void;
}) {
  const brand = brands.find((b) => b.id === product.brandId);
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col rounded-g6-card border border-g6-border-secondary bg-g6-bg-container text-left transition-all hover:border-g6-primary-border hover:shadow-md overflow-hidden"
    >
      {product.thumbnail ? (
        <div className="aspect-[4/3] overflow-hidden bg-g6-bg-base">
          <img
            src={product.thumbnail}
            alt=""
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        </div>
      ) : (
        <div className="aspect-[4/3] bg-gradient-to-br from-g6-bg-spotlight to-g6-bg-base flex items-center justify-center">
          <span className="font-g6-mono text-g6-xs text-g6-text-tertiary uppercase tracking-wider">
            no image
          </span>
        </div>
      )}
      <div className="flex flex-col gap-1.5 p-3">
        <div className="flex items-center gap-1.5 min-w-0">
          {brand?.logo && <img src={brand.logo} alt="" className="h-3.5 w-3.5 rounded-sm shrink-0" />}
          <span className="font-g6-mono text-g6-xs text-g6-text-tertiary truncate uppercase tracking-wider">
            {brand?.name}
          </span>
        </div>
        <p className="text-g6-sm font-semibold text-g6-text line-clamp-2 leading-snug">
          {product.name}
        </p>
        <div className="flex items-center justify-between mt-0.5">
          <span className="font-g6-mono text-g6-base font-bold tabular-nums text-g6-text">
            {product.price}
          </span>
          {product.promo && (
            <span className="text-[10px] font-medium uppercase tracking-wider rounded bg-g6-primary/15 text-g6-primary-active px-1.5 py-0.5 truncate max-w-[120px]">
              {product.promo}
            </span>
          )}
        </div>
        <div className="flex items-center justify-end mt-1">
          <span className="inline-flex items-center gap-1 text-g6-xs text-g6-text-tertiary group-hover:text-g6-primary-active transition-colors">
            Generate <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </button>
  );
}
