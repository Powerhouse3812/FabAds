import { Plus, Tag, Building2, Package, Search } from "lucide-react";

type CatalogueType = "categories" | "brands" | "products";

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
};

/**
 * Catalogue list page — stub for Category / Brands / Products.
 * Entity-level sub-nav (sidebar drill-down) ships in the next sprint.
 */
export function CatalogueListPage({ type }: { type: CatalogueType }) {
  const cfg = CONFIG[type];
  const Icon = cfg.icon;

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
              <Icon className="h-4.5 w-4.5 text-muted-foreground" />
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

      {/* Filter row */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder={`Search ${cfg.label.toLowerCase()}…`}
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-48"
          />
        </div>
      </div>

      {/* Empty state */}
      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="text-base font-semibold text-foreground">No {cfg.label.toLowerCase()} yet</h2>
        <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
          Add your first {cfg.singular.toLowerCase()} to start managing your catalogue.
        </p>
        <button
          type="button"
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
        >
          <Plus className="h-3.5 w-3.5" />
          New {cfg.singular}
        </button>
      </div>
    </div>
  );
}
