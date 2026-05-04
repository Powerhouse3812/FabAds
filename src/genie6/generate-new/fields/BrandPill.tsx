import { useState, useMemo } from "react";
import { Building2, ChevronDown, Search, Globe, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { brands as allBrands } from "@/mocks/shared";
import type { Brand } from "@/genie6/types/entities";

/**
 * BrandPill — top-sticky brand picker for Brand/Product/Affiliate Ad forms.
 *
 * Per Form Specs §1: "Brand pill (with search + URL fetch popup; per BR1 lock)"
 *
 * Behaviors:
 *   - Click → popover with search field + brand list
 *   - Empty state (no saved brands) → "Enter URL to fetch brand" affordance
 *   - Selected brand renders compactly with logo + name
 *   - URL fetch is stubbed (toast TODO) until backend lands
 */

export interface BrandPillProps {
  value: string | null;
  onChange: (brandId: string | null) => void;
  /** Whether to show a Required visual hint when value is null. */
  required?: boolean;
}

export function BrandPill({ value, onChange, required = true }: BrandPillProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = value ? allBrands.find((b) => b.id === value) ?? null : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allBrands;
    return allBrands.filter((b) =>
      b.name.toLowerCase().includes(q) ||
      b.domain?.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={selected ? `Brand: ${selected.name} — change` : "Pick a brand"}
          className={cn(
            "inline-flex h-9 min-w-[180px] items-center gap-2 rounded-md border bg-card px-2.5 text-sm transition-colors",
            "hover:border-primary/40",
            "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
            selected ? "border-border text-foreground" : "border-dashed border-border text-muted-foreground",
            required && !selected && "border-destructive/40",
          )}
        >
          {selected?.logo ? (
            <img src={selected.logo} alt="" className="h-4 w-4 rounded-sm shrink-0" />
          ) : (
            <Building2 className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="flex-1 truncate text-left text-xs font-medium">
            {selected?.name ?? "Pick a brand"}
            {required && !selected && <span className="text-destructive ml-1">·</span>}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
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
              placeholder="Search brand or domain…"
              aria-label="Search brand"
              className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground/70 outline-none w-full"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-[280px] overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <EmptyBrandState query={query} />
          ) : (
            filtered.slice(0, 30).map((b) => (
              <BrandRow
                key={b.id}
                brand={b}
                active={selected?.id === b.id}
                onClick={() => {
                  onChange(b.id);
                  setOpen(false);
                  setQuery("");
                }}
              />
            ))
          )}
        </div>
        <div className="border-t border-border p-2">
          <button
            type="button"
            onClick={() => {
              alert("URL fetch wiring lands with the brand-fetch backend (TODO).");
            }}
            className="flex w-full items-center gap-2 rounded-md border border-dashed border-border bg-card px-2 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            <Globe className="h-3.5 w-3.5" />
            Enter URL to fetch a new brand
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function BrandRow({
  brand,
  active,
  onClick,
}: {
  brand: Brand;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors",
        active ? "bg-primary/10 text-foreground" : "text-foreground hover:bg-muted/40",
      )}
    >
      {brand.logo ? (
        <img src={brand.logo} alt="" className="h-5 w-5 rounded-sm bg-muted shrink-0" />
      ) : (
        <div className="h-5 w-5 rounded-sm bg-muted flex items-center justify-center shrink-0">
          <Building2 className="h-2.5 w-2.5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium">{brand.name}</p>
        {brand.domain && (
          <p className="truncate text-[10px] text-muted-foreground">{brand.domain}</p>
        )}
      </div>
      {active && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
    </button>
  );
}

function EmptyBrandState({ query }: { query: string }) {
  return (
    <div className="px-3 py-6 text-center">
      <p className="text-xs text-muted-foreground">
        {query ? `No brand matches "${query}"` : "No saved brands yet"}
      </p>
      <p className="mt-1.5 text-[10px] text-muted-foreground/80">
        {query ? "Try a different name, or paste a URL below" : "Add one via the URL fetch below"}
      </p>
    </div>
  );
}
