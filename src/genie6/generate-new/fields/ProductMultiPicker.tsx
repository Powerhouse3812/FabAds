import { useState, useMemo } from "react";
import { Package, ChevronDown, Search, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { products as allProducts, brands as allBrands } from "@/mocks/shared";
import type { Product } from "@/genie6/types/entities";

/**
 * ProductMultiPicker — top-sticky multi-select product picker.
 *
 * Per Form Specs §2: "Product picker (multi-select)". Carousel/Catalogue/
 * Collection formats need ≥2 products selected to enable.
 *
 * Filters products by the active brand if provided. Selected products
 * render as chips with × remove buttons.
 */

export interface ProductMultiPickerProps {
  /** Product IDs currently selected. */
  value: string[];
  onChange: (next: string[]) => void;
  /** When set, only products from this brand are listed. */
  brandIdFilter?: string | null;
}

export function ProductMultiPicker({ value, onChange, brandIdFilter }: ProductMultiPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(
    () => value.map((id) => allProducts.find((p) => p.id === id)).filter(Boolean) as Product[],
    [value],
  );

  const candidates = useMemo(() => {
    let list = allProducts;
    if (brandIdFilter) list = list.filter((p) => p.brandId === brandIdFilter);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
    return list.slice(0, 30);
  }, [brandIdFilter, query]);

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`Pick products — ${selected.length} selected`}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-md border bg-card px-2.5 text-xs transition-colors",
              "hover:border-primary/40",
              "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
              selected.length > 0 ? "border-border text-foreground" : "border-dashed border-border text-muted-foreground",
            )}
          >
            <Package className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium">
              {selected.length === 0
                ? "Pick product(s)"
                : `${selected.length} product${selected.length === 1 ? "" : "s"}`}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 p-0">
          <div className="border-b border-border p-2">
            <div className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={brandIdFilter ? "Search this brand's products…" : "Search products…"}
                aria-label="Search products"
                className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground/70 outline-none w-full"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-[280px] overflow-y-auto py-1">
            {candidates.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                {query ? `No product matches "${query}"` : "No products in this brand"}
              </p>
            ) : (
              candidates.map((p) => {
                const brand = allBrands.find((b) => b.id === p.brandId);
                const active = value.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggle(p.id)}
                    className={cn(
                      "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors",
                      active ? "bg-primary/10 text-foreground" : "text-foreground hover:bg-muted/40",
                    )}
                  >
                    {brand?.logo && (
                      <img src={brand.logo} alt="" className="h-4 w-4 rounded-sm shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {brand?.name} · {p.price}
                      </p>
                    </div>
                    {active && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
      {selected.map((p) => (
        <span
          key={p.id}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-foreground"
        >
          <Package className="h-2.5 w-2.5 text-muted-foreground" />
          <span className="max-w-[120px] truncate font-medium">{p.name}</span>
          <button
            type="button"
            onClick={() => toggle(p.id)}
            aria-label={`Remove ${p.name}`}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
    </div>
  );
}
