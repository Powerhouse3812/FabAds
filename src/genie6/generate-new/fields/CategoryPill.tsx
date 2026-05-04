import { useState, useMemo } from "react";
import { Layers, ChevronDown, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { categories as allCategories } from "@/mocks/shared";
import type { Category } from "@/genie6/types/entities";

/**
 * CategoryPill — top-sticky category picker for Affiliate Ad form.
 *
 * Per Form Specs §3: "Category picker (REQUIRED) — knowledge base anchor
 * for Affiliate, parallel to Brand for Brand Ad."
 */

export interface CategoryPillProps {
  value: string | null;
  onChange: (categoryId: string | null) => void;
  required?: boolean;
}

export function CategoryPill({ value, onChange, required = true }: CategoryPillProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = value ? allCategories.find((c) => c.id === value) ?? null : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCategories;
    return allCategories.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={selected ? `Category: ${selected.name} — change` : "Pick a category (required)"}
          className={cn(
            "inline-flex h-9 min-w-[180px] items-center gap-2 rounded-md border bg-card px-2.5 text-sm transition-colors",
            "hover:border-primary/40",
            "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
            selected ? "border-border text-foreground" : "border-dashed border-border text-muted-foreground",
            required && !selected && "border-destructive/40",
          )}
        >
          <Layers className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 truncate text-left text-xs font-medium">
            {selected?.name ?? "Pick a category"}
            {required && !selected && <span className="text-destructive ml-1">·</span>}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <div className="border-b border-border p-2">
          <div className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories…"
              aria-label="Search category"
              className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground/70 outline-none w-full"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-[280px] overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No category matches "{query}"
            </p>
          ) : (
            filtered.map((c: Category) => {
              const active = selected?.id === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onChange(c.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors",
                    active ? "bg-primary/10 text-foreground" : "text-foreground hover:bg-muted/40",
                  )}
                >
                  <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate font-medium">{c.name}</span>
                  {active && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
