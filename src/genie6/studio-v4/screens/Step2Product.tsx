import { useMemo, useState } from "react";
import {
  Search,
  Building2,
  ChevronDown,
  Check,
  Sparkles,
  Plus,
  Loader2,
  Package,
  FolderOpen,
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

type Tab = "product" | "category";

const CATEGORIES_PANEL: { id: string; emoji: string; name: string; desc: string }[] = [
  { id: "c-life",    emoji: "🛡",  name: "Life Insurance",   desc: "Family · term · ULIP" },
  { id: "c-home",    emoji: "🏠",  name: "Home Insurance",   desc: "Property · contents" },
  { id: "c-credit",  emoji: "💳",  name: "Credit Cards",     desc: "Rewards · travel · fuel" },
  { id: "c-mutual",  emoji: "📊",  name: "Mutual Funds",     desc: "SIP · ELSS · debt" },
  { id: "c-auto",    emoji: "🚗",  name: "Auto Insurance",   desc: "Car · two-wheeler" },
  { id: "c-health",  emoji: "🩺",  name: "Health Insurance", desc: "Family · senior · OPD" },
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
  const [tab, setTab] = useState<Tab>(
    wizard.state.categoryId ? "category" : "product",
  );
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
    return list.slice(0, 60);
  }, [brandFilter, search]);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CATEGORIES_PANEL;
    return CATEGORIES_PANEL.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.desc.toLowerCase().includes(q),
    );
  }, [search]);

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

  // Switch tab — clear opposite side's selection to enforce XOR
  const switchTab = (t: Tab) => {
    if (t === tab) return;
    setTab(t);
    setSearch("");
    if (t === "product" && wizard.state.categoryId) {
      wizard.set("categoryId", null);
    }
    if (t === "category" && wizard.state.productId) {
      wizard.set("productId", null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      {/* Header */}
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          What are you creating for?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick a product, or stay broad with a category.{" "}
          <span className="font-mono text-[11px] text-muted-foreground/80">
            {categoryLabel} · {formatLabel}
          </span>
        </p>
      </header>

      {/* Tab toggle — Product vs Category */}
      <div className="flex justify-center">
        <div
          role="tablist"
          className="inline-flex rounded-xl border border-border bg-muted/40 p-1 shadow-sm"
        >
          <TabBtn
            active={tab === "product"}
            onClick={() => switchTab("product")}
            icon={Package}
            label="Product"
            count={ALL_PRODUCTS.length}
          />
          <TabBtn
            active={tab === "category"}
            onClick={() => switchTab("category")}
            icon={FolderOpen}
            label="Category"
            count={CATEGORIES_PANEL.length}
          />
        </div>
      </div>

      {/* Toolbar — search + (Product-only) brand filter + fetch URL */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              tab === "product"
                ? "Search products or brands…"
                : "Search categories…"
            }
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>

        {tab === "product" && (
          <>
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
          </>
        )}

        <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {tab === "product" ? (
            <>
              {filteredProducts.length}
              <span className="text-muted-foreground/60">
                {" / "}
                {ALL_PRODUCTS.length}
              </span>
            </>
          ) : (
            <>
              {filteredCategories.length}
              <span className="text-muted-foreground/60">
                {" / "}
                {CATEGORIES_PANEL.length}
              </span>
            </>
          )}
        </span>
      </div>

      {/* Single grid — switches by tab */}
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        {tab === "product" ? (
          <ProductGrid
            products={filteredProducts}
            selectedId={wizard.state.productId}
            onPick={(id) =>
              wizard.patch({ productId: id, categoryId: null })
            }
            search={search}
          />
        ) : (
          <CategoryGrid
            categories={filteredCategories}
            selectedId={wizard.state.categoryId}
            onPick={(id) =>
              wizard.patch({ categoryId: id, productId: null })
            }
            search={search}
          />
        )}

        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
          <span className="text-[11px] text-muted-foreground">
            {tab === "product"
              ? "Don't see your product? Paste a URL or add it manually."
              : "Need a different category? Add a custom one."}
          </span>
          <button
            type="button"
            className="text-xs font-semibold text-primary hover:underline"
          >
            + Add new {tab === "product" ? "product" : "category"}
          </button>
        </div>
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── *
 *  Tab button
 * ─────────────────────────────────────────────────────────── */
function TabBtn({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
        active
          ? "bg-foreground text-background shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 font-mono text-[10px]",
          active
            ? "bg-background/20 text-background"
            : "bg-muted text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────── *
 *  Product grid — image + brand chip + check on select
 * ─────────────────────────────────────────────────────────── */
interface ProductGridProps {
  products: typeof ALL_PRODUCTS;
  selectedId: string | null;
  onPick: (id: string) => void;
  search: string;
}

function ProductGrid({ products, selectedId, onPick, search }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="px-3 py-12 text-center text-xs text-muted-foreground">
        No products match {search ? `"${search}"` : "this filter"}. Try a
        different search or pick another brand.
      </div>
    );
  }
  return (
    <ul className="grid max-h-[460px] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => {
        const isSelected = selectedId === p.id;
        const brand = ALL_BRANDS.find((b) => b.id === p.brandId);
        return (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onPick(p.id)}
              className={cn(
                "group relative flex h-full w-full flex-col overflow-hidden rounded-xl border bg-background text-left transition-all",
                isSelected
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
              )}
            >
              {/* Image */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                {p.thumbnail ? (
                  <img
                    src={p.thumbnail}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Sparkles className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                )}
                {/* Brand chip top-left */}
                {brand && (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-card/90 px-1.5 py-0.5 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur-sm">
                    {brand.logo && (
                      <img
                        src={brand.logo}
                        alt=""
                        className="h-2.5 w-2.5 rounded-sm"
                      />
                    )}
                    <span className="max-w-[80px] truncate">{brand.name}</span>
                  </span>
                )}
                {/* Check badge top-right when selected */}
                {isSelected && (
                  <span className="absolute top-2 right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </div>
              {/* Meta */}
              <div className="flex flex-1 flex-col gap-0.5 px-2.5 py-2">
                <p className="truncate text-xs font-semibold text-foreground">
                  {p.name}
                </p>
                {p.price && (
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {p.price}
                  </p>
                )}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ─────────────────────────────────────────────────────────── *
 *  Category grid — large emoji, name, description
 * ─────────────────────────────────────────────────────────── */
interface CategoryGridProps {
  categories: typeof CATEGORIES_PANEL;
  selectedId: string | null;
  onPick: (id: string) => void;
  search: string;
}

function CategoryGrid({ categories, selectedId, onPick, search }: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <div className="px-3 py-12 text-center text-xs text-muted-foreground">
        No categories match {search ? `"${search}"` : "this filter"}.
      </div>
    );
  }
  return (
    <ul className="grid max-h-[460px] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((c) => {
        const isSelected = selectedId === c.id;
        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onPick(c.id)}
              className={cn(
                "relative flex h-full w-full flex-col items-start gap-2 rounded-xl border bg-background p-4 text-left transition-all",
                isSelected
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
              )}
            >
              {isSelected && (
                <span className="absolute top-2 right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
              <span className="text-3xl leading-none">{c.emoji}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {c.name}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {c.desc}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
