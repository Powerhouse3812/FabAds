import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { useBatches } from "../lib/genieRunStore";
import { originKey, originLabel } from "./originLabels";
import { isCurrentUserAdmin } from "./currentUser";

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
 * Design-crit fix (P1, six-selects-in-a-row / Hick's Law): Angle, Category,
 * Brand, Source and Created-by used to render as five identical 150px
 * "All …" selects, indistinguishable until read one by one. They now live
 * stacked inside a single **Filter** popover, and applied values surface as
 * inline **active-filter chips** next to the trigger — state stays visible
 * without opening anything, and removing one filter is a single click on
 * its chip. Search and Sort are NOT filters (always-on controls) and stay
 * as visible top-level controls per the brief:
 *
 *   - Angle      → ?angleFilter=<id>   (separate from ?angle=, which opens
 *                                       the AngleViewMoreDrawer)
 *   - Category   → ?category=<modeId>
 *   - Brand      → ?brand=<brandId>
 *   - Source     → ?module=<originKey>   (§10 — every asset shows which
 *                                          module it came from)
 *   - Created by → ?createdBy=<name>     (§17 — admin-only; the name also
 *                                          appears inside the record itself,
 *                                          on the batch header + Ad Detail)
 *   - Sort       → ?sort=newest|oldest|score (default newest, omitted from URL)
 *   - Search     → ?q=<text>
 *
 * Each control writes via `setSearchParams({ replace: true })` so back-button
 * history isn't polluted with every keystroke / dropdown click. `updateParam`
 * deletes the URL param entirely when the value equals its default — chips
 * must remove a filter the same way (reset to default), never by writing
 * "all" into the URL.
 *
 * The Filter trigger carries a count badge (derived from the same "is this
 * filter non-default" checks that build the chip list — search and sort are
 * intentionally excluded, they aren't inside the popover). The chip row is
 * `aria-live="polite"` so applying/removing a filter is announced.
 *
 * NOTE (history): the popover used to snap shut after the first pick, and was
 * worked around by mirroring its open flag into a module-scope variable so it
 * survived a remount. That workaround is gone, because the remount was the
 * actual bug: `Library.tsx` defined its variant body as a component INSIDE
 * its render function, so every re-render produced a new component type and
 * React remounted this whole subtree. Once the run store started ticking a
 * live batch every ~700ms, that fired about once a second. Fixed at the root
 * in Library.tsx; plain `useState` is correct here again. Module-scope state
 * would also have leaked the open flag between instances.
 */

export function LibraryToolbar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const batches = useBatches();
  const admin = isCurrentUserAdmin();

  const angleFilter = searchParams.get("angleFilter") ?? "all";
  const category = searchParams.get("category") ?? "all";
  const brand = searchParams.get("brand") ?? "all";
  const moduleFilter = searchParams.get("module") ?? "all";
  const createdByFilter = searchParams.get("createdBy") ?? "all";
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

  // Popover-scoped reset — clears only the 5 true filters. Search and Sort
  // live outside the popover and are intentionally untouched by it.
  const clearFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.delete("angleFilter");
        sp.delete("category");
        sp.delete("brand");
        sp.delete("module");
        sp.delete("createdBy");
        return sp;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const brandOptions = useMemo(
    () => brands.map((b) => ({ value: b.id, label: b.name })),
    [],
  );

  // Options are derived from what's actually in the run store — no dead
  // filter values pointing at zero results.
  const moduleOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const b of batches) {
      const key = originKey(b.origin);
      if (!seen.has(key)) seen.set(key, originLabel(b.origin));
    }
    return Array.from(seen, ([value, label]) => ({ value, label }));
  }, [batches]);

  const createdByOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const b of batches) seen.add(b.createdBy);
    return Array.from(seen).sort();
  }, [batches]);

  // Active-filter chips — one per applied filter (excludes search + sort,
  // which aren't inside the popover). Doubles as the Filter badge count.
  const chips = useMemo(() => {
    const list: { key: string; label: string; value: string; onRemove: () => void }[] = [];

    if (angleFilter !== "all") {
      const label = angles.find((a) => a.id === angleFilter)?.label ?? angleFilter;
      list.push({
        key: "angleFilter",
        label: "Angle",
        value: label,
        onRemove: () => updateParam("angleFilter", null, "all"),
      });
    }
    if (category !== "all") {
      const label = MODE_LABELS[category as ModeId] ?? category;
      list.push({
        key: "category",
        label: "Category",
        value: label,
        onRemove: () => updateParam("category", null, "all"),
      });
    }
    if (brand !== "all") {
      const label = brandOptions.find((b) => b.value === brand)?.label ?? brand;
      list.push({
        key: "brand",
        label: "Brand",
        value: label,
        onRemove: () => updateParam("brand", null, "all"),
      });
    }
    if (moduleFilter !== "all") {
      const label = moduleOptions.find((m) => m.value === moduleFilter)?.label ?? moduleFilter;
      list.push({
        key: "module",
        label: "Source",
        value: label,
        onRemove: () => updateParam("module", null, "all"),
      });
    }
    // §17 — admin-only user filter, gated the same way the select is.
    if (admin && createdByFilter !== "all") {
      list.push({
        key: "createdBy",
        label: "Created by",
        value: createdByFilter,
        onRemove: () => updateParam("createdBy", null, "all"),
      });
    }

    return list;
  }, [angleFilter, category, brand, moduleFilter, createdByFilter, admin, brandOptions, moduleOptions, updateParam]);

  const filterCount = chips.length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-[180px]">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-g6-text-tertiary" />
        <input
          type="search"
          value={search}
          onChange={(e) => updateParam("q", e.target.value, "")}
          placeholder="Search by name..."
          aria-label="Search outputs by name"
          className="h-8 w-full rounded-g6-base border border-g6-border-secondary bg-g6-bg-container pl-8 pr-3 font-g6-sans text-g6-sm text-g6-text placeholder:text-g6-text-tertiary focus:border-g6-primary-border focus:outline-none focus:shadow-g6-input-active"
        />
      </div>

      <Popover open={filterOpen} onOpenChange={setFilterOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-expanded={filterOpen}
            aria-label={filterCount > 0 ? `Filter — ${filterCount} active` : "Filter"}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-g6-base border px-3 font-g6-sans text-g6-sm transition-colors",
              "border-g6-border-secondary bg-g6-bg-container text-g6-text-secondary hover:border-g6-border hover:text-g6-text",
              filterCount > 0 && "border-g6-primary-border text-g6-text",
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
            {filterCount > 0 && (
              <span
                aria-hidden
                className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-g6-primary px-1 font-g6-mono text-[10px] font-bold leading-none text-g6-text-on-accent"
              >
                {filterCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="g6-root w-[288px] border-g6-border bg-g6-bg-elevated p-3 font-g6-sans text-g6-sm"
          onPointerDownOutside={(e) => {
            // Each Select below portals its own dropdown via Radix's popper
            // wrapper — the same mechanism this Popover's content uses. A
            // click choosing an option therefore lands outside THIS
            // component's DOM subtree and would otherwise read as an
            // outside-dismiss, snapping the popover shut after every single
            // filter instead of letting Maalik set Brand + Source in one
            // pass. Only swallow clicks that are actually inside one of
            // those nested popper portals; a real outside click (the page
            // behind the popover) still dismisses normally.
            const target = e.target as HTMLElement | null;
            if (target?.closest("[data-radix-popper-content-wrapper]")) {
              e.preventDefault();
            }
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="font-g6-mono text-[10px] font-bold uppercase tracking-[0.06em] text-g6-text-tertiary">
              Filters
            </span>
            <div className="flex items-center gap-3">
              {filterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="font-g6-sans text-g6-xs font-medium text-g6-text-secondary transition-colors hover:text-g6-text"
                >
                  Clear all
                </button>
              )}
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                aria-label="Close filters"
                className="inline-flex h-6 w-6 items-center justify-center rounded-g6-base text-g6-text-tertiary transition-colors hover:bg-g6-bg-container hover:text-g6-text"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <FilterField label="Angle">
              <Select
                value={angleFilter}
                onValueChange={(v) => updateParam("angleFilter", v, "all")}
              >
                <SelectTrigger className="h-8 w-full border-g6-border-secondary bg-g6-bg-container font-g6-sans text-g6-sm">
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
            </FilterField>

            <FilterField label="Category">
              <Select
                value={category}
                onValueChange={(v) => updateParam("category", v, "all")}
              >
                <SelectTrigger className="h-8 w-full border-g6-border-secondary bg-g6-bg-container font-g6-sans text-g6-sm">
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
            </FilterField>

            <FilterField label="Brand">
              <Select value={brand} onValueChange={(v) => updateParam("brand", v, "all")}>
                <SelectTrigger className="h-8 w-full border-g6-border-secondary bg-g6-bg-container font-g6-sans text-g6-sm">
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
            </FilterField>

            <FilterField label="Source">
              <Select value={moduleFilter} onValueChange={(v) => updateParam("module", v, "all")}>
                <SelectTrigger className="h-8 w-full border-g6-border-secondary bg-g6-bg-container font-g6-sans text-g6-sm">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent className="g6-root border-g6-border bg-g6-bg-elevated font-g6-sans text-g6-sm">
                  <SelectItem value="all">All sources</SelectItem>
                  {moduleOptions.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>

            {/* §17 — admin-only user filter. The user's name also appears
                inside the record (batch header + Ad Detail's "Created By"). */}
            {admin && (
              <FilterField label="Created by">
                <Select value={createdByFilter} onValueChange={(v) => updateParam("createdBy", v, "all")}>
                  <SelectTrigger className="h-8 w-full border-g6-border-secondary bg-g6-bg-container font-g6-sans text-g6-sm">
                    <SelectValue placeholder="Created by" />
                  </SelectTrigger>
                  <SelectContent className="g6-root border-g6-border bg-g6-bg-elevated font-g6-sans text-g6-sm">
                    <SelectItem value="all">Everyone</SelectItem>
                    {createdByOptions.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterField>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Active-filter chips — `display: contents` keeps them as direct
          flex items of the row (so gap-2 spaces them normally) without an
          extra wrapper box that would leave a stray gap when the list is
          empty. The row stays `aria-live` so applying/removing is announced
          even though the wrapper itself never becomes visible content. */}
      <div aria-live="polite" className="contents">
        {chips.map((chip) => (
          <span
            key={chip.key}
            className="inline-flex max-w-[280px] items-center gap-1 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-spotlight py-1.5 pl-2.5 pr-1.5 font-g6-mono text-[10px] font-bold uppercase tracking-[0.06em] text-g6-text"
          >
            <span className="truncate" title={`${chip.label}: ${chip.value}`}>
              {chip.label}: {chip.value}
            </span>
            <button
              type="button"
              onClick={chip.onRemove}
              aria-label={`Remove ${chip.label.toLowerCase()} filter: ${chip.value}`}
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-g6-text-tertiary transition-colors hover:bg-g6-bg-container hover:text-error-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-g6-primary-border"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
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

/** Stacked label + control row used inside the Filter popover. */
function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-g6-mono text-[10px] font-bold uppercase tracking-[0.05em] text-g6-text-tertiary">
        {label}
      </span>
      {children}
    </div>
  );
}
