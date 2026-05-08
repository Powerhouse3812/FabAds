import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Tag, Building2, Package, Search, ArrowUpRight, Users } from "lucide-react";
import { brands, categories, products, audiences } from "@/mocks/shared";
import type { Brand, Category, Product, Audience } from "@/genie6/types/entities";

type CatalogueType = "categories" | "brands" | "products" | "audiences";

const CONFIG: Record<
  CatalogueType,
  { label: string; singular: string; icon: React.ElementType; description: string }
> = {
  categories: {
    label: "Categories",
    singular: "Category",
    icon: Tag,
    description: "Organise your ad catalogue by product category. Each category has its own KB, linked brands, and generation history.",
  },
  brands: {
    label: "Brands",
    singular: "Brand",
    icon: Building2,
    description: "Manage the brands you create ads for — brand voice, product catalogue, KB, and performance history in one place.",
  },
  products: {
    label: "Products",
    singular: "Product",
    icon: Package,
    description: "Every product SKU across all brands — with landing pages, targeting templates, and generation history.",
  },
  audiences: {
    label: "Audiences",
    singular: "Audience",
    icon: Users,
    description: "Targeting segments your campaigns reach. Each audience has a brand link, demographic profile, and generation history.",
  },
};

/**
 * Catalogue list page — wired to real data in iter-6 A-9.
 *
 * Reads from `src/mocks/shared/{brands,categories,products}.ts` (the canonical
 * data source shared with Genie). Renders cards in a responsive grid; live
 * search filters by name. Click → navigates to /catalogue/{type}/:id (stub
 * detail page; real entity-level sub-nav ships next sprint).
 */
export function CatalogueListPage({ type }: { type: CatalogueType }) {
  const cfg = CONFIG[type];
  const Icon = cfg.icon;
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  // Map type → list. Pre-compute once.
  const items = useMemo(() => {
    if (type === "brands") return brands;
    if (type === "products") return products;
    if (type === "audiences") return audiences;
    return categories;
  }, [type]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item: Brand | Category | Product | Audience) => {
      // Audiences have label + segment instead of name; brands/categories/products
      // use name. Match on whichever shape this entity has.
      if ("label" in item) {
        return (
          item.label.toLowerCase().includes(q) ||
          item.segment.toLowerCase().includes(q)
        );
      }
      return item.name.toLowerCase().includes(q);
    });
  }, [items, query]);

  const onCardClick = (id: string) => navigate(`/catalogue/${type}/${id}`);

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{cfg.label}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{cfg.description}</p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.99]"
          >
            <Plus className="h-3.5 w-3.5" />
            New {cfg.singular}
          </button>
        </div>
      </header>

      {/* Filter row + count */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${cfg.label.toLowerCase()}…`}
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-64"
          />
        </div>
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          {filtered.length} {cfg.label.toLowerCase()}
        </p>
      </div>

      {/* Grid OR empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold text-foreground">
            {query ? `No ${cfg.label.toLowerCase()} match "${query}"` : `No ${cfg.label.toLowerCase()} yet`}
          </h2>
          <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
            {query ? "Try a different search term." : `Add your first ${cfg.singular.toLowerCase()} to start managing your catalogue.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {type === "brands" && (filtered as Brand[]).map((b) => (
            <BrandCard key={b.id} brand={b} onClick={() => onCardClick(b.id)} />
          ))}
          {type === "categories" && (filtered as Category[]).map((c) => (
            <CategoryCard key={c.id} category={c} onClick={() => onCardClick(c.id)} />
          ))}
          {type === "products" && (filtered as Product[]).map((p) => (
            <ProductCard key={p.id} product={p} onClick={() => onCardClick(p.id)} />
          ))}
          {type === "audiences" && (filtered as Audience[]).map((a) => (
            <AudienceCard key={a.id} audience={a} onClick={() => onCardClick(a.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 *  Card components — one per type. Differ in surfaced metadata.
 * ───────────────────────────────────────────────────────── */
function BrandCard({ brand, onClick }: { brand: Brand; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-background p-4 text-left transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-center gap-2.5">
        {brand.logo && (
          <img src={brand.logo} alt="" className="h-8 w-8 rounded-md bg-muted" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{brand.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{brand.domain}</p>
        </div>
        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
      </div>
      <div className="flex flex-wrap gap-1">
        {brand.usps.slice(0, 2).map((usp) => (
          <span key={usp} className="text-[10px] font-medium uppercase tracking-wider rounded bg-muted-foreground/10 text-muted-foreground px-1.5 py-0.5">
            {usp}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono tabular-nums">
        <span>{brand.categoryIds?.length ?? 0} categories</span>
        <span>{brand.productIds.length} SKUs</span>
      </div>
    </button>
  );
}

function CategoryCard({ category, onClick }: { category: Category; onClick: () => void }) {
  // Count products + brands linked to this category
  const productCount = products.filter((p) => p.categoryId === category.id).length;
  const brandCount = brands.filter((b) => b.categoryIds?.includes(category.id)).length;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-background p-4 text-left transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Tag className="h-4 w-4 text-primary" />
        </div>
        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{category.name}</p>
        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{category.instruction}</p>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono tabular-nums">
        <span>{brandCount} brands</span>
        <span>·</span>
        <span>{productCount} products</span>
        <span>·</span>
        <span>{category.winnerCount} winners</span>
      </div>
    </button>
  );
}

function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const brand = brands.find((b) => b.id === product.brandId);
  const category = categories.find((c) => c.id === product.categoryId);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-background p-4 text-left transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground line-clamp-2">{product.name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {brand?.name}{category && ` · ${category.name}`}
          </p>
        </div>
        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground transition-colors shrink-0" />
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-base font-bold text-foreground font-mono tabular-nums">{product.price}</span>
        {product.promo && (
          <span className="text-[10px] font-medium uppercase tracking-wider rounded bg-primary/15 text-primary px-1.5 py-0.5">
            {product.promo}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono tabular-nums">
        <span>{product.landingPages?.length ?? 0} LPs</span>
        <span>·</span>
        <span>{product.campaignUrls?.length ?? 0} URLs</span>
        <span>·</span>
        <span>{product.generatedCount} gens</span>
      </div>
    </button>
  );
}

function AudienceCard({ audience, onClick }: { audience: Audience; onClick: () => void }) {
  const brand = audience.brandId ? brands.find((b) => b.id === audience.brandId) : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-background p-4 text-left transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
          <Users className="h-4 w-4 text-primary" />
        </div>
        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground transition-colors shrink-0" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground line-clamp-1">{audience.label}</p>
        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{audience.segment}</p>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        {brand ? (
          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5">
            {brand.logo && <img src={brand.logo} alt="" className="h-3 w-3 rounded" />}
            <span className="truncate">{brand.name}</span>
          </span>
        ) : (
          <span className="text-[10px] font-medium uppercase tracking-wider rounded bg-muted-foreground/10 px-1.5 py-0.5">
            Brand-agnostic
          </span>
        )}
      </div>
    </button>
  );
}
