import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { angles } from "@/mocks/shared/angles";
import { brands } from "../mocks/brands";
import { MODE_LABELS, type ModeId } from "../types/output";
import { cn } from "@/lib/utils";

const MODE_IDS: ModeId[] = [
  "brand-ad",
  "product-ad",
  "affiliate-ad",
  "ugc-video",
  "forge",
  "image-to-ad",
];

export type SortKey = "newest" | "oldest" | "score";

const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  score: "Highest quality",
};

/**
 * LibraryToolbar — URL-backed filter row for the Library redesign.
 *
 * 4 selects + search + clear-all chip:
 *   - Angle      → ?angleFilter=<id>   (separate from ?angle=, which opens
 *                                       the AngleViewMoreDrawer)
 *   - Category   → ?category=<modeId>
 *   - Brand      → ?brand=<brandId>
 *   - Sort       → ?sort=newest|oldest|score (default newest, omitted from URL)
 *   - Search     → ?q=<text>
 *
 * Each control writes via `setSearchParams({ replace: true })` so back-button
 * history isn't polluted with every keystroke / dropdown click.
 *
 * The clear-all chip is only rendered when at least one filter is active —
 * gives the user one-click recovery without scanning four dropdowns.
 */
export function LibraryToolbar() {
  const [searchParams, setSearchParams] = useSearchParams();

  const angleFilter = searchParams.get("angleFilter") ?? "all";
  const category = searchParams.get("category") ?? "all";
  const brand = searchParams.get("brand") ?? "all";
  const sort = (searchParams.get("sort") as SortKey | null) ?? "newest";
  const search = searchParams.get("q") ?? "";

  const updateParam = useCallback(
    (key: string, value: string | null, defaultValue?: string) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (value === null || value === "" || value === defaultValue) {
            sp.delete(key);
          } else {
            sp.set(key, value);
          }
          return sp;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clearAll = useCallback(() => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.delete("angleFilter");
        sp.delete("category");
        sp.delete("brand");
        sp.delete("sort");
        sp.delete("q");
        return sp;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const brandOptions = useMemo(
    () => brands.map((b) => ({ value: b.id, label: b.name })),
    [],
  );

  const activeCount =
    (angleFilter !== "all" ? 1 : 0) +
    (category !== "all" ? 1 : 0) +
    (brand !== "all" ? 1 : 0) +
    (sort !== "newest" ? 1 : 0) +
    (search ? 1 : 0);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <div className="relative w-[180px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-g6-text-tertiary" />
          <input
            type="search"
            value={search}
            onChange={(e) => updateParam("q", e.target.value, "")}
            placeholder="Search by name..."
            className="h-8 w-full rounded-g6-base border border-g6-border-secondary bg-g6-bg-container pl-8 pr-3 font-g6-sans text-g6-sm text-g6-text placeholder:text-g6-text-tertiary focus:border-g6-primary-border focus:outline-none focus:shadow-g6-input-active"
          />
        </div>
        <button
          type="button"
          onClick={clearAll}
          aria-label={activeCount > 0 ? "Clear filters" : "Filters"}
          className={cn(
            "relative inline-flex h-8 w-8 items-center justify-center rounded-g6-base border border-g6-border-secondary bg-g6-bg-container",
            "text-g6-text-secondary transition-colors",
            "hover:border-g6-border hover:text-g6-text",
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {activeCount > 0 && (
            <span
              aria-hidden
              className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-g6-error"
            />
          )}
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Select
          value={angleFilter}
          onValueChange={(v) => updateParam("angleFilter", v, "all")}
        >
          <SelectTrigger className="h-8 w-[150px] border-g6-border-secondary bg-g6-bg-container font-g6-sans text-g6-sm">
            <SelectValue placeholder="Angle" />
          </SelectTrigger>
          <SelectContent className="g6-root max-h-[360px] border-g6-border bg-g6-bg-elevated font-g6-sans text-g6-sm">
            <SelectItem value="all">All angles</SelectItem>
            {angles.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={category}
          onValueChange={(v) => updateParam("category", v, "all")}
        >
          <SelectTrigger className="h-8 w-[150px] border-g6-border-secondary bg-g6-bg-container font-g6-sans text-g6-sm">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="g6-root border-g6-border bg-g6-bg-elevated font-g6-sans text-g6-sm">
            <SelectItem value="all">All categories</SelectItem>
            {MODE_IDS.map((m) => (
              <SelectItem key={m} value={m}>
                {MODE_LABELS[m]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={brand} onValueChange={(v) => updateParam("brand", v, "all")}>
          <SelectTrigger className="h-8 w-[150px] border-g6-border-secondary bg-g6-bg-container font-g6-sans text-g6-sm">
            <SelectValue placeholder="Brand" />
          </SelectTrigger>
          <SelectContent className="g6-root border-g6-border bg-g6-bg-elevated font-g6-sans text-g6-sm">
            <SelectItem value="all">All brands</SelectItem>
            {brandOptions.map((b) => (
              <SelectItem key={b.value} value={b.value}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span
          aria-hidden
          className="mx-1 inline-block h-[14px] w-px bg-g6-border-secondary"
        />

        <Select
          value={sort}
          onValueChange={(v) => updateParam("sort", v as SortKey, "newest")}
        >
          <SelectTrigger className="h-8 w-[150px] border-g6-border-secondary bg-g6-bg-container font-g6-sans text-g6-sm">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent className="g6-root border-g6-border bg-g6-bg-elevated font-g6-sans text-g6-sm">
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <SelectItem key={k} value={k}>
                {SORT_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
