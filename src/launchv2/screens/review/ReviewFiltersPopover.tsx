/**
 * ReviewFiltersPopover — search + filter controls for Step 4 Review (Decision 23).
 *
 * Renders a search input and a filter popover with 4 filter rows:
 *   Page (text, free-form), Ad Account (select), Status (radio), Type (radio).
 * Calls onFilter with the current query + ReviewFilters on every change.
 */
import { useCallback, useMemo, useState } from "react";
import { Filter, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanV2 } from "../../types";
import { flattenAllNodes, buildReviewTree } from "./reviewModel";

export interface ReviewFilters {
  page?: string;
  accountId?: string;
  status?: "all" | "active" | "paused" | "draft";
  nodeType?: "all" | "campaign" | "adset" | "ad";
}

const EMPTY_FILTERS: ReviewFilters = {
  page: "",
  accountId: "",
  status: "all",
  nodeType: "all",
};

function hasActiveFilters(f: ReviewFilters): boolean {
  return (
    (!!f.page?.trim()) ||
    (!!f.accountId?.trim()) ||
    (f.status !== "all" && !!f.status) ||
    (f.nodeType !== "all" && !!f.nodeType)
  );
}

export function ReviewFiltersPopover({
  plan,
  onFilter,
}: {
  plan: PlanV2;
  onFilter: (q: string, filters: ReviewFilters) => void;
}) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ReviewFilters>(EMPTY_FILTERS);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Collect unique account names from tree
  const accountOptions = useMemo(() => {
    const uniq = new Map<string, string>();
    for (const t of plan.targets) uniq.set(t.accountId, t.accountName);
    return Array.from(uniq.entries()).map(([id, name]) => ({ id, name }));
  }, [plan.targets]);

  const emit = useCallback(
    (q: string, f: ReviewFilters) => onFilter(q, f),
    [onFilter],
  );

  const handleQueryChange = (val: string) => {
    setQuery(val);
    emit(val, filters);
  };

  const handleFilterChange = (patch: Partial<ReviewFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    emit(query, next);
  };

  const clearAll = () => {
    setQuery("");
    setFilters(EMPTY_FILTERS);
    emit("", EMPTY_FILTERS);
  };

  const active = hasActiveFilters(filters) || query.trim();

  return (
    <div className="relative flex items-center gap-2">
      {/* Search input */}
      <div className="relative flex items-center">
        <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search nodes…"
          className="h-8 w-[200px] rounded-full border border-border bg-background pl-8 pr-3 text-[12px] outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
        />
        {query && (
          <button
            type="button"
            onClick={() => handleQueryChange("")}
            className="absolute right-2.5 text-muted-foreground/60 hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Filter button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setPopoverOpen((o) => !o)}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-full border px-3 font-mono text-[11px] font-medium transition-colors",
            active
              ? "border-primary/50 bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {active && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-[#121212]">
              {[filters.page?.trim(), filters.accountId?.trim(), filters.status !== "all" && filters.status, filters.nodeType !== "all" && filters.nodeType, query.trim()].filter(Boolean).length}
            </span>
          )}
        </button>

        {/* Popover */}
        {popoverOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setPopoverOpen(false)} />
            <div className="absolute left-0 top-[calc(100%+6px)] z-40 w-[300px] rounded-2xl border border-border bg-background shadow-md">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-foreground">Filters</span>
                <div className="flex items-center gap-2">
                  {active && (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="font-mono text-[10px] text-primary hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPopoverOpen(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 px-4 py-4">
                {/* Page filter */}
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">
                    Page
                  </label>
                  <input
                    type="text"
                    value={filters.page ?? ""}
                    onChange={(e) => handleFilterChange({ page: e.target.value })}
                    placeholder="Filter by page name…"
                    className="h-8 w-full rounded-full border border-border bg-background px-3 text-[12px] outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Ad account filter */}
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">
                    Ad Account
                  </label>
                  <select
                    value={filters.accountId ?? ""}
                    onChange={(e) => handleFilterChange({ accountId: e.target.value })}
                    className="h-8 w-full rounded-full border border-border bg-background px-3 text-[12px] outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">All accounts</option>
                    {accountOptions.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status filter */}
                <div className="space-y-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">
                    Status
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(["all", "active", "paused", "draft"] as const).map((s) => (
                      <label key={s} className="flex cursor-pointer items-center gap-1.5">
                        <input
                          type="radio"
                          name="status"
                          value={s}
                          checked={filters.status === s}
                          onChange={() => handleFilterChange({ status: s })}
                          className="h-3.5 w-3.5 accent-primary"
                        />
                        <span className="font-mono text-[11px] capitalize text-foreground">{s}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Type filter */}
                <div className="space-y-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">
                    Type
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(["all", "campaign", "adset", "ad"] as const).map((t) => (
                      <label key={t} className="flex cursor-pointer items-center gap-1.5">
                        <input
                          type="radio"
                          name="nodeType"
                          value={t}
                          checked={filters.nodeType === t}
                          onChange={() => handleFilterChange({ nodeType: t })}
                          className="h-3.5 w-3.5 accent-primary"
                        />
                        <span className="font-mono text-[11px] capitalize text-foreground">
                          {t === "adset" ? "Ad set" : t}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Helper: apply ReviewFilters to filter a list of flat node labels.
 * Returns a Set of node ids that pass the filter (for greying out in tree rail).
 */
export function applyReviewFilters(
  plan: PlanV2,
  query: string,
  filters: ReviewFilters,
): Set<string> | null {
  const isFiltering =
    query.trim() ||
    filters.page?.trim() ||
    filters.accountId?.trim() ||
    (filters.status && filters.status !== "all") ||
    (filters.nodeType && filters.nodeType !== "all");

  if (!isFiltering) return null; // null = no filter active

  const tree = buildReviewTree(plan);
  const allNodes = flattenAllNodes(tree);
  const q = query.toLowerCase();

  return new Set(
    allNodes
      .filter((node) => {
        // text query
        if (q && !node.label.toLowerCase().includes(q) && !node.sub?.toLowerCase().includes(q)) return false;
        // page filter (free-form, checks label + sub)
        if (filters.page?.trim()) {
          const pg = filters.page.toLowerCase();
          if (!node.label.toLowerCase().includes(pg) && !node.sub?.toLowerCase().includes(pg)) return false;
        }
        // nodeType filter
        if (filters.nodeType && filters.nodeType !== "all" && node.kind !== filters.nodeType) return false;
        // accountId filter — find accountId via target
        if (filters.accountId?.trim()) {
          const ti = node.targetIndex ?? 0;
          const target = plan.targets[ti];
          if (target?.accountId !== filters.accountId) return false;
        }
        return true;
      })
      .map((n) => n.id),
  );
}
