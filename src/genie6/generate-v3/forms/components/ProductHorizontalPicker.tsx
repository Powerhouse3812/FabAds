import { useMemo, useRef, useState } from "react";
import {
  Search,
  Building2,
  ChevronDown,
  Check,
  Loader2,
  Sparkles,
  X,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { brands as allBrands, products as allProducts } from "@/mocks/shared";
import type { Product } from "@/genie6/types/entities";

/**
 * ProductHorizontalPicker — Studio v3 product picker.
 *
 * A-11.22 wireframe revision per Maalik (calmer, more conventional):
 *   [ 🔍 Search products… (~280px) ]  [ 🏢 Brand ▾ (140px) ]
 *   [ + Fetch URL ]                                  ··· {n} / {total}
 *
 * - Search is always expanded (no collapse), with a clear (X) button
 *   when there's text and an active border state.
 * - Brand filter pill widens to 140px (was a tight max).
 * - URL fetch is now a labeled secondary button that opens a popover
 *   containing the URL input + Fetch CTA + Cancel.
 * - Below: horizontal-scroll strip of horizontal product cards
 *   (60×60 image on left, name + brand stacked on right, ~200px wide).
 *
 * Real backend wires in iter-8+; URL fetch is a 1.5s mock for now.
 */

export interface FetchedSnapshot {
  brand: { id: string; name: string; logo?: string | null };
  product: { id: string; name: string; price?: string; thumbnail?: string };
  guidelines?: string[];
  otherProducts?: { id: string; name: string }[];
  sourceUrl: string;
}

export interface ProductHorizontalPickerProps {
  value: string | null;
  onChange: (productId: string | null) => void;
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
  const [urlOpen, setUrlOpen] = useState(false);

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
    await new Promise((r) => setTimeout(r, 1500));
    setFetching(false);

    const sampleProduct = allProducts[Math.floor(Math.random() * Math.min(20, allProducts.length))];
    const sampleBrand = allBrands.find((b) => b.id === sampleProduct.brandId);
    if (!sampleBrand) return;

    const snap: FetchedSnapshot = {
      brand: { id: sampleBrand.id, name: sampleBrand.name, logo: sampleBrand.logo },
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
    setUrlOpen(false);
    onChange(sampleProduct.id);
    onFetched?.(snap);
  };

  const totalAvailable = brandFilter
    ? allProducts.filter((p) => p.brandId === brandFilter).length
    : allProducts.length;

  return (
    <div className="space-y-2.5">
      {/* Single calm control row — search grows to fill, brand / fetch /
          counter are shrink-0. No wrap — A-11.25 per Maalik. */}
      <div className="flex items-center gap-2">
        <SearchInput query={query} onQuery={setQuery} />
        <BrandFilterPill value={brandFilter} onChange={setBrandFilter} />
        <UrlFetchButton
          open={urlOpen}
          onOpenChange={(next) => {
            setUrlOpen(next);
            if (!next && !fetching) setUrlInput("");
          }}
          urlInput={urlInput}
          onUrlInput={setUrlInput}
          fetching={fetching}
          onFetch={handleFetch}
        />
        <p className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {filteredProducts.length}
          <span className="text-muted-foreground/60"> / {totalAvailable}</span>
        </p>
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

/* ─────────────────────────────────────────────────────── *
 *  SearchInput — always-expanded (~280px), clear button when filled
 * ───────────────────────────────────────────────────────── */
function SearchInput({
  query,
  onQuery,
}: {
  query: string;
  onQuery: (next: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isActive = query.length > 0;

  return (
    <div
      className={cn(
        // A-11.25: flex-1 so the search bar fills available row width
        // (Brand pill + Fetch URL + counter are shrink-0).
        "flex items-center h-9 flex-1 min-w-[160px] rounded-md border bg-card overflow-hidden transition-colors",
        isActive ? "border-primary/40 bg-primary/5" : "border-border",
      )}
    >
      <div className="shrink-0 flex h-9 w-9 items-center justify-center text-muted-foreground">
        <Search className="h-3.5 w-3.5" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && query) {
            onQuery("");
          }
        }}
        placeholder="Search products…"
        aria-label="Search products"
        className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground/70 outline-none w-full pr-2"
      />
      {isActive && (
        <button
          type="button"
          onClick={() => {
            onQuery("");
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="shrink-0 flex h-9 w-7 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────── *
 *  UrlFetchButton — labeled secondary button opens popover with input + CTA
 * ───────────────────────────────────────────────────────── */
function UrlFetchButton({
  open,
  onOpenChange,
  urlInput,
  onUrlInput,
  fetching,
  onFetch,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  urlInput: string;
  onUrlInput: (next: string) => void;
  fetching: boolean;
  onFetch: () => void;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Fetch product from URL"
          className="shrink-0 inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground transition-colors hover:border-foreground/30 hover:bg-card/80"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Fetch URL</span>
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-[340px] p-3">
        <div className="space-y-2">
          <label
            htmlFor="product-url-fetch-input"
            className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground"
          >
            Product URL
          </label>
          <input
            id="product-url-fetch-input"
            type="url"
            value={urlInput}
            onChange={(e) => onUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onFetch();
              }
            }}
            placeholder="https://example.com/product/…"
            disabled={fetching}
            autoFocus
            className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-primary/40 disabled:opacity-50"
          />
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onUrlInput("");
                onOpenChange(false);
              }}
              disabled={fetching}
              className="inline-flex h-8 items-center rounded-md px-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onFetch}
              disabled={!urlInput.trim() || fetching}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-bold transition-colors",
                !urlInput.trim() || fetching
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              {fetching ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Fetching…</span>
                </>
              ) : (
                "Fetch"
              )}
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
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
        "shrink-0 group relative flex items-center gap-2 overflow-hidden rounded-lg border bg-card p-1.5 transition-all w-[200px]",
        active
          ? "border-primary shadow-md ring-2 ring-primary/30"
          : "border-border hover:border-primary/40 hover:-translate-y-0.5",
        "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
      )}
    >
      <div className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-md bg-muted">
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
          <div className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
            <Check className="h-2.5 w-2.5" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5 pr-1">
        <p className="w-full truncate text-left text-[11px] font-medium text-foreground">
          {product.name}
        </p>
        <p className="w-full truncate text-left text-[10px] text-muted-foreground">
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
            "shrink-0 inline-flex h-9 min-w-[120px] items-center gap-1.5 rounded-md border bg-card px-2.5 text-xs transition-colors",
            selected
              ? "border-primary/40 bg-primary/5 text-foreground"
              : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
          )}
        >
          <Building2 className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium max-w-[140px] truncate flex-1 text-left">
            {selected?.name ?? "All brands"}
          </span>
          <ChevronDown className="h-3 w-3 shrink-0" />
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
