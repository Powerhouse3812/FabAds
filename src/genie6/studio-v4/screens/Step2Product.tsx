import { useMemo, useState } from "react";
import {
  Search,
  Building2,
  ChevronDown,
  Check,
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
import { HeroHeader } from "../components/HeroHeader";
import type { UseWizardReturn } from "../state/useWizard";

interface Step2Props {
  wizard: UseWizardReturn;
}

type Tab = "product" | "category";

/* ────────────────────────────────────────────────────────── *
 *  Real-image fallback for product thumbnails. The shared
 *  mocks/shared/products.ts has a `thumbnail?` field but none
 *  of the 60+ entries pass one — so all product cards used to
 *  show the Sparkles fallback. To make Studio look like a real
 *  working app, we map categoryId keywords to representative
 *  Unsplash photos (same source as sample-outputs.ts).
 * ────────────────────────────────────────────────────────── */
const u = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=400&q=70`;

const CATEGORY_THUMB_BY_KEYWORD: { match: RegExp; url: string }[] = [
  { match: /hair/i,                url: u("1631730486572-226d1f595b68") },
  { match: /skin|face|serum/i,     url: u("1620916566398-39f1143ab7be") },
  { match: /makeup|lip/i,          url: u("1586495777744-4413f21062fa") },
  { match: /watch/i,               url: u("1617043786394-f977fa12eddf") },
  { match: /audio|earbud|headphone|speaker/i, url: u("1606220588913-b3aacb4d2f46") },
  { match: /mattress|bed|sleep/i,  url: u("1631049552057-403cdb8f0658") },
  { match: /furniture|sofa/i,      url: u("1555041469-a586c61ea9bc") },
  { match: /apparel|fashion|innerwear/i, url: u("1521572163474-6864f9cf17ab") },
  { match: /sneaker|shoe|footwear/i, url: u("1542291026-7eec264c27ff") },
  { match: /eyewear|glasses/i,     url: u("1574258495973-f010dfbb5371") },
  { match: /jewell|diamond/i,      url: u("1599643478518-a784e5dc4c8f") },
  { match: /beard|grooming/i,      url: u("1622286342621-4bd786c2447c") },
  { match: /protein|nutrition|wellness/i, url: u("1610450949065-1f2841536c88") },
  { match: /pet/i,                 url: u("1543466835-00a7907e9de1") },
  { match: /food|snack|coffee|tea/i, url: u("1560472354-b33ff0c44a43") },
  { match: /vitamin|supplement/i,  url: u("1556228720-195a672e8a03") },
  { match: /travel|luggage/i,      url: u("1565620731358-7b6c1b95dadd") },
  { match: /facewash/i,            url: u("1571781926291-c477ebfd024b") },
  { match: /body/i,                url: u("1556228453-efd6c1ff04f6") },
];

function resolveProductThumb(p: { thumbnail?: string; categoryId?: string; name: string }): string {
  if (p.thumbnail) return p.thumbnail;
  const cat = p.categoryId ?? "";
  const name = p.name.toLowerCase();
  for (const { match, url } of CATEGORY_THUMB_BY_KEYWORD) {
    if (match.test(cat) || match.test(name)) return url;
  }
  // Generic fallback — a clean studio shot
  return u("1556228720-195a672e8a03");
}

const CATEGORIES_PANEL: { id: string; emoji: string; name: string; desc: string }[] = [
  { id: "c-life",    emoji: "🛡",  name: "Life Insurance",   desc: "Family · term · ULIP" },
  { id: "c-home",    emoji: "🏠",  name: "Home Insurance",   desc: "Property · contents" },
  { id: "c-credit",  emoji: "💳",  name: "Credit Cards",     desc: "Rewards · travel · fuel" },
  { id: "c-mutual",  emoji: "📊",  name: "Mutual Funds",     desc: "SIP · ELSS · debt" },
  { id: "c-auto",    emoji: "🚗",  name: "Auto Insurance",   desc: "Car · two-wheeler" },
  { id: "c-health",  emoji: "🩺",  name: "Health Insurance", desc: "Family · senior · OPD" },
];

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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 pt-8 pb-10">
      <HeroHeader title="What are you creating for?" />

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

      {/* Grid — no outer card frame (cards are inside the grid items
          themselves; double-card pattern was visual noise). */}
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
      <div className="flex flex-col items-center justify-center gap-3 px-3 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Search className="h-5 w-5 text-muted-foreground/70" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            No products found
          </p>
          <p className="text-[11px] text-muted-foreground">
            {search
              ? `Nothing matches "${search}". Try a different search or pick another brand.`
              : "Adjust the brand filter or use Fetch URL to add a new product."}
          </p>
        </div>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
              {/* Image — real Unsplash fallback by category keyword */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                <img
                  src={resolveProductThumb(p)}
                  alt={p.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform group-hover:scale-[1.04]"
                />
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
      <div className="flex flex-col items-center justify-center gap-3 px-3 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <FolderOpen className="h-5 w-5 text-muted-foreground/70" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            No categories found
          </p>
          <p className="text-[11px] text-muted-foreground">
            {search
              ? `Nothing matches "${search}". Try a different search.`
              : "Add a custom category to continue."}
          </p>
        </div>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
