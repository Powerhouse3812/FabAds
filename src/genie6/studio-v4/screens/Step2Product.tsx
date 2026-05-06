import { useMemo, useState } from "react";
import {
  Search,
  Building2,
  ChevronDown,
  Check,
  Sparkles,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { brands as ALL_BRANDS, products as ALL_PRODUCTS } from "@/mocks/shared";
import type { UseWizardReturn } from "../state/useWizard";

interface Step2Props {
  wizard: UseWizardReturn;
}

const CATEGORIES_PANEL: { id: string; emoji: string; name: string }[] = [
  { id: "c-life", emoji: "🛡", name: "Life Insurance" },
  { id: "c-home", emoji: "🏠", name: "Home Insurance" },
  { id: "c-credit", emoji: "💳", name: "Credit Cards" },
  { id: "c-mutual", emoji: "📊", name: "Mutual Funds" },
  { id: "c-auto", emoji: "🚗", name: "Auto Insurance" },
];

const CATEGORY_LABEL: Record<string, string> = {
  asset: "Asset",
  ad: "Ad",
  social: "Social",
};

const FORMAT_LABEL: Record<string, string> = {
  image: "Image",
  video: "Video",
};

export function Step2Product({ wizard }: Step2Props) {
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [brandSearch, setBrandSearch] = useState("");
  const [brandOpen, setBrandOpen] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [fetching, setFetching] = useState(false);

  const handleFetchUrl = async () => {
    const v = urlInput.trim();
    if (!v) return;
    setFetching(true);
    await new Promise((r) => setTimeout(r, 1200));
    setFetching(false);
    // Mock — pick a random product as the fetched result
    const sample = ALL_PRODUCTS[Math.floor(Math.random() * Math.min(20, ALL_PRODUCTS.length))];
    if (!sample) return;
    wizard.patch({ productId: sample.id, categoryId: null });
    setUrlInput("");
    setUrlOpen(false);
    toast.success(`Fetched: ${sample.name}`, { duration: 3000 });
  };

  const filteredProducts = useMemo(() => {
    let list = ALL_PRODUCTS;
    if (brandFilter) list = list.filter((p) => p.brandId === brandFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const brand = ALL_BRANDS.find((b) => b.id === p.brandId);
        return (
          p.name.toLowerCase().includes(q) ||
          (brand?.name.toLowerCase().includes(q) ?? false)
        );
      });
    }
    return list.slice(0, 50);
  }, [brandFilter, search]);

  const filteredBrandList = useMemo(() => {
    const term = brandSearch.trim().toLowerCase();
    if (!term) return ALL_BRANDS.slice(0, 30);
    return ALL_BRANDS.filter((b) =>
      b.name.toLowerCase().includes(term),
    ).slice(0, 30);
  }, [brandSearch]);

  const selectedBrand = brandFilter
    ? ALL_BRANDS.find((b) => b.id === brandFilter)
    : null;

  const categoryLabel = wizard.state.category
    ? CATEGORY_LABEL[wizard.state.category]
    : "—";
  const formatLabel = wizard.state.format
    ? FORMAT_LABEL[wizard.state.format]
    : "—";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="text-center">
        <h1 className="text-3xl font-bold">What are you creating for?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{categoryLabel}</span>
          {" · "}
          <span className="font-semibold text-foreground">{formatLabel}</span>
        </p>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* Products panel */}
        <section className="col-span-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground flex-1">
              Products
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {filteredProducts.length}
              <span className="text-muted-foreground/60"> / {ALL_PRODUCTS.length}</span>
            </span>
          </div>

          {/* Search + brand filter row */}
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products or brands…"
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
            {/* + Fetch URL */}
            <Popover open={urlOpen} onOpenChange={setUrlOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="shrink-0 inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:border-foreground/30"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Fetch URL
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-3 space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Paste a product URL
                </p>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleFetchUrl();
                    }
                  }}
                  placeholder="https://store.example.com/product/…"
                  autoFocus
                  disabled={fetching}
                  className="block h-9 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary/40 focus:outline-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUrlInput("");
                      setUrlOpen(false);
                    }}
                    disabled={fetching}
                    className="inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleFetchUrl}
                    disabled={!urlInput.trim() || fetching}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors",
                      !urlInput.trim() || fetching
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary text-primary-foreground hover:opacity-90",
                    )}
                  >
                    {fetching ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    {fetching ? "Fetching…" : "Fetch"}
                  </button>
                </div>
              </PopoverContent>
            </Popover>
            <Popover open={brandOpen} onOpenChange={setBrandOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "shrink-0 inline-flex h-9 items-center gap-1.5 rounded-lg border bg-card px-3 text-xs transition-colors",
                    selectedBrand
                      ? "border-primary/40 bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                  )}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span className="font-medium max-w-[120px] truncate">
                    {selectedBrand?.name ?? "All brands"}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-0">
                <div className="border-b border-border p-2">
                  <div className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5">
                    <Search className="h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      placeholder="Search brand…"
                      className="w-full bg-transparent text-xs outline-none"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-[260px] overflow-y-auto py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setBrandFilter(null);
                      setBrandOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors",
                      !brandFilter
                        ? "bg-primary/10 text-foreground"
                        : "text-foreground hover:bg-muted/40",
                    )}
                  >
                    <span className="flex-1 truncate font-medium">All brands</span>
                    {!brandFilter && (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    )}
                  </button>
                  {filteredBrandList.map((b) => {
                    const active = brandFilter === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setBrandFilter(b.id);
                          setBrandOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors",
                          active
                            ? "bg-primary/10 text-foreground"
                            : "text-foreground hover:bg-muted/40",
                        )}
                      >
                        {b.logo ? (
                          <img
                            src={b.logo}
                            alt=""
                            className="h-4 w-4 rounded-sm shrink-0"
                          />
                        ) : (
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className="flex-1 truncate font-medium">
                          {b.name}
                        </span>
                        {active && <Check className="h-3.5 w-3.5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <ul className="grid max-h-[480px] grid-cols-2 gap-2 overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const isSelected = wizard.state.productId === p.id;
              const brand = ALL_BRANDS.find((b) => b.id === p.brandId);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() =>
                      wizard.patch({
                        productId: p.id,
                        categoryId: null, // XOR — clear category
                      })
                    }
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border p-2 text-left text-sm transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                        : "border-border hover:border-primary/40 hover:bg-muted/40",
                    )}
                  >
                    {/* Real product image */}
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                      {p.thumbnail ? (
                        <img
                          src={p.thumbnail}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Sparkles className="h-4 w-4 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-foreground">
                        {p.name}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        {brand && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                            {brand.logo && (
                              <img
                                src={brand.logo}
                                alt=""
                                className="h-2.5 w-2.5 rounded-sm"
                              />
                            )}
                            {brand.name}
                          </span>
                        )}
                        {p.price && (
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {p.price}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
            {filteredProducts.length === 0 && (
              <li className="col-span-2 px-3 py-8 text-center text-xs text-muted-foreground">
                No products match{" "}
                {search ? `"${search}"` : "this filter"}. Try a different search
                or pick another brand.
              </li>
            )}
          </ul>

          <button
            type="button"
            className="mt-3 text-xs font-semibold text-primary hover:underline"
          >
            + Add new product
          </button>
        </section>

        {/* Categories panel */}
        <section className="col-span-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Categories
          </h2>

          <ul className="flex flex-col gap-1">
            {CATEGORIES_PANEL.map((c) => {
              const isSelected = wizard.state.categoryId === c.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() =>
                      wizard.patch({
                        categoryId: c.id,
                        productId: null, // XOR — clear product
                      })
                    }
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                        : "border-transparent hover:border-border hover:bg-muted/50",
                    )}
                  >
                    <span className="text-xl">{c.emoji}</span>
                    <span className="font-medium text-foreground">{c.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            className="mt-3 text-xs font-semibold text-primary hover:underline"
          >
            + Add new category
          </button>
        </section>
      </div>
    </div>
  );
}
