import { useState, useMemo } from "react";
import { Search, Globe, Building2, ChevronDown, Check, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { brands as allBrands, products as allProducts } from "@/mocks/shared";
import type { Product } from "@/genie6/types/entities";

/**
 * ProductHorizontalPicker — Product Shoot top-zone product picker (A-11.19).
 *
 * Spec from Maalik:
 *   - Single-product select.
 *   - Layout: search input + brand filter + always-visible URL fetch field +
 *     horizontal-scroll strip of product thumbnails.
 *   - URL fetch: paste URL → spinner → on success a small toast appears
 *     ("Fetched: {product}") with an "Edit & save" button that opens the
 *     edit modal (handled by parent — fetch result bubbles up via callback).
 *   - Minimal so the user's flow doesn't break.
 */

export interface FetchedSnapshot {
  /** Mock placeholder for now. Real backend returns a richer snapshot. */
  brand: { id: string; name: string; logo?: string | null };
  product: { id: string; name: string; price?: string; thumbnail?: string };
  guidelines?: string[];
  otherProducts?: { id: string; name: string }[];
  sourceUrl: string;
}

export interface ProductHorizontalPickerProps {
  value: string | null;
  onChange: (productId: string | null) => void;
  /** Fired when URL fetch succeeds. Parent decides whether to open the
   *  Edit & save modal. */
  onFetched?: (snap: FetchedSnapshot) => void;
}

export function ProductHorizontalPicker({
  value,
  onChange,
  onFetched,
}: ProductHorizontalPickerProps) {
  const [query, setQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [fetching, setFetching] = useState(false);

  const filteredProducts = useMemo(() => {
    let list = allProducts;
    if (brandFilter) list = list.filter((p) => p.brandId === brandFilter);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
    return list.slice(0, 30);
  }, [brandFilter, query]);

  const handleFetch = async () => {
    const v = urlInput.trim();
    if (!v) return;
    setFetching(true);
    // Mock fetch — 1.5s delay, returns a fake snapshot. Real backend wires
    // in iter-8+ with the brand-fetch service.
    await new Promise((r) => setTimeout(r, 1500));
    setFetching(false);

    // Pull a random product as the mocked fetch result
    const sampleProduct = allProducts[Math.floor(Math.random() * Math.min(20, allProducts.length))];
    const sampleBrand = allBrands.find((b) => b.id === sampleProduct.brandId);
    if (!sampleBrand) return;

    const snap: FetchedSnapshot = {
      brand: {
        id: sampleBrand.id,
        name: sampleBrand.name,
        logo: sampleBrand.logo,
      },
      product: {
        id: sampleProduct.id,
        name: sampleProduct.name,
        price: sampleProduct.price,
        thumbnail: sampleProduct.thumbnail,
      },
      guidelines: [
        "Hero shot · clean background",
        "Brand color palette · soft warm tones",
        "Minimal text overlay",
      ],
      otherProducts: allProducts
        .filter((p) => p.brandId === sampleBrand.id && p.id !== sampleProduct.id)
        .slice(0, 4)
        .map((p) => ({ id: p.id, name: p.name })),
      sourceUrl: v,
    };

    setUrlInput("");
    onChange(sampleProduct.id);
    onFetched?.(snap);
  };

  return (
    <div className="space-y-2.5">
      {/* Filter row — search + brand filter + URL fetch */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="inline-flex h-9 min-w-[200px] flex-1 items-center gap-1.5 rounded-md border border-border bg-card px-2.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground/70 outline-none w-full"
          />
        </div>
        {/* Brand filter */}
        <BrandFilterPill value={brandFilter} onChange={setBrandFilter} />
        {/* URL fetch — always visible per spec */}
        <div className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 min-w-[200px]">
          <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleFetch();
              }
            }}
            placeholder="Paste product URL…"
            aria-label="Product URL to fetch"
            disabled={fetching}
            className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground/70 outline-none w-full disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleFetch}
            disabled={!urlInput.trim() || fetching}
            aria-label="Fetch from URL"
            className={cn(
              "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold transition-colors",
              !urlInput.trim() || fetching
                ? "bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {fetching ? <Loader2 className="h-3 w-3 animate-spin" /> : "Fetch"}
          </button>
        </div>
      </div>

      {/* Horizontal product strip */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/40 px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            No products match {query ? `"${query}"` : "this filter"}. Try a different search, switch brand, or paste a URL above to fetch a new product.
          </p>
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {filteredProducts.map((p) => (
            <ProductThumb
              key={p.id}
              product={p}
              active={value === p.id}
              onClick={() => onChange(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

function ProductThumb({
  product,
  active,
  onClick,
}: {
  product: Product;
  active: boolean;
  onClick: () => void;
}) {
  const brand = allBrands.find((b) => b.id === product.brandId);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={`${product.name} · ${brand?.name ?? ""}`}
      className={cn(
        "shrink-0 group relative flex flex-col items-stretch overflow-hidden rounded-lg border bg-card transition-all w-[110px]",
        active
          ? "border-primary shadow-md ring-2 ring-primary/30"
          : "border-border hover:border-primary/40 hover:-translate-y-0.5",
        "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
      )}
    >
      <div className="relative aspect-square w-full bg-muted overflow-hidden">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Sparkles className="h-4 w-4 text-muted-foreground/50" />
          </div>
        )}
        {active && (
          <div className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
            <Check className="h-3 w-3" />
          </div>
        )}
      </div>
      <div className="space-y-0.5 px-1.5 py-1">
        <p className="truncate text-[11px] font-medium text-foreground">
          {product.name}
        </p>
        <p className="truncate text-[9px] text-muted-foreground">
          {brand?.name}
        </p>
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────── */

function BrandFilterPill({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const selected = value ? allBrands.find((b) => b.id === value) : null;
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return allBrands.slice(0, 30);
    return allBrands.filter((b) => b.name.toLowerCase().includes(term)).slice(0, 30);
  }, [q]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={selected ? `Brand filter: ${selected.name}` : "Filter by brand"}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-md border bg-card px-2.5 text-xs transition-colors",
            selected
              ? "border-primary/40 bg-primary/5 text-foreground"
              : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
          )}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span className="font-medium max-w-[100px] truncate">
            {selected?.name ?? "All brands"}
          </span>
          <ChevronDown className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <div className="border-b border-border p-2">
          <div className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search brand…"
              className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground/70 outline-none w-full"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-[260px] overflow-y-auto py-1">
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors",
              !value ? "bg-primary/10 text-foreground" : "text-foreground hover:bg-muted/40",
            )}
          >
            <span className="flex-1 truncate font-medium">All brands</span>
            {!value && <Check className="h-3.5 w-3.5 text-primary" />}
          </button>
          {filtered.map((b) => {
            const active = value === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  onChange(b.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors",
                  active ? "bg-primary/10 text-foreground" : "text-foreground hover:bg-muted/40",
                )}
              >
                {b.logo ? (
                  <img src={b.logo} alt="" className="h-4 w-4 rounded-sm shrink-0" />
                ) : (
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className="flex-1 truncate font-medium">{b.name}</span>
                {active && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
