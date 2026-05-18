import { useSearchParams } from "react-router-dom";
import { X } from "lucide-react";
import { LIBRARY_BRANDS } from "@/mocks/shared/library-items";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// BrandFilterBar
// Horizontal scrollable row of brand-filter pills. Persists selection in the
// URL via ?brand=<id> so the filter survives tab switches, deep-links, and
// hard-refreshes. Three pill kinds:
//   • "All"     — no ?brand param
//   • "Library" — ?brand=orphan (items with no brand attribution)
//   • <brand>   — ?brand=<brand.id> for each LIBRARY_BRANDS entry
// ─────────────────────────────────────────────────────────────────────────────

interface BrandFilterBarProps {
  className?: string;
  /** Total item count visible — shown next to "All" pill. */
  totalCount?: number;
  /** Per-brand count for badge numbers. brandId -> count map. */
  countsByBrand?: Record<string, number>;
  /** Orphan count for "Library (no brand)" pill. */
  orphanCount?: number;
}

const PILL_BASE =
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium whitespace-nowrap transition-colors duration-150";
const PILL_ACTIVE =
  "bg-primary/15 text-primary font-semibold border-primary/30 hover:scale-[1.02]";
const PILL_INACTIVE =
  "bg-card hover:bg-muted/40 text-foreground/80 border-transparent";
const COUNT_BADGE =
  "font-mono text-[10px] text-muted-foreground tabular-nums ml-1";

export function BrandFilterBar({
  className,
  totalCount,
  countsByBrand,
  orphanCount,
}: BrandFilterBarProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeBrand = searchParams.get("brand");

  const setBrand = (value: string | null) => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (!value) sp.delete("brand");
        else sp.set("brand", value);
        return sp;
      },
      { replace: false },
    );
  };

  const isAllActive = !activeBrand;
  const isOrphanActive = activeBrand === "orphan";
  const hasFilter = !!activeBrand;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl border border-border bg-card p-1.5 overflow-x-auto",
        className,
      )}
    >
      <div className="flex items-center gap-1 min-w-0">
        {/* All pill */}
        <button
          type="button"
          onClick={() => setBrand(null)}
          className={cn(PILL_BASE, isAllActive ? PILL_ACTIVE : PILL_INACTIVE)}
        >
          <span>All</span>
          {typeof totalCount === "number" && (
            <span className={COUNT_BADGE}>{totalCount}</span>
          )}
        </button>

        {/* Library (orphan) pill */}
        <button
          type="button"
          onClick={() => setBrand("orphan")}
          className={cn(
            PILL_BASE,
            isOrphanActive ? PILL_ACTIVE : PILL_INACTIVE,
          )}
        >
          <span>Library</span>
          {typeof orphanCount === "number" && (
            <span className={COUNT_BADGE}>{orphanCount}</span>
          )}
        </button>

        {/* Brand pills */}
        {LIBRARY_BRANDS.map((brand) => {
          const isActive = activeBrand === brand.id;
          const count = countsByBrand?.[brand.id];
          return (
            <button
              key={brand.id}
              type="button"
              onClick={() => setBrand(brand.id)}
              className={cn(PILL_BASE, isActive ? PILL_ACTIVE : PILL_INACTIVE)}
            >
              <span>{brand.name}</span>
              {typeof count === "number" && (
                <span className={COUNT_BADGE}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Clear filter CTA — only when a filter is active */}
      {hasFilter && (
        <button
          type="button"
          onClick={() => setBrand(null)}
          className="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-foreground/60 hover:text-foreground hover:bg-muted/40 transition-colors duration-150 whitespace-nowrap"
        >
          <X className="w-3 h-3" strokeWidth={2} />
          <span className="font-mono text-[10px] uppercase tracking-wider tabular-nums">
            Clear
          </span>
        </button>
      )}
    </div>
  );
}
