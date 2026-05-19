import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BulkToolbar } from "../../components/BulkToolbar";
import { CSVExportButton } from "../../components/CSVExportButton";
import { EmptyState } from "../../components/EmptyState";
import { MasonryGroupToggle, type LibraryView } from "../../components/MasonryGroupToggle";
import { brands } from "../../mocks/brands";
import { sampleOutputs } from "../../mocks/sample-outputs";
import type { ModeId, OutputData } from "../../types/output";
import { LibraryToolbar, type SortKey } from "../LibraryToolbar";
import { MasonryView } from "./MasonryView";
import { GroupByAngleView } from "./GroupByAngleView";

type Props = {
  /** Legacy prop — brand NAME (Canvas/Command/Modular pass this). */
  brandFilter?: string;
  /** Legacy prop — `top` | `recent` | `all`. */
  perfFilter?: string;
  /** Legacy prop — free-text search. */
  search?: string;
  /**
   * Studio variant default: render the internal URL-backed LibraryToolbar
   * and ignore the legacy props. Other variants (Canvas/Command/Modular)
   * pass `showToolbar={false}` and continue feeding filters via props
   * from their own external FilterBar chrome.
   */
  showToolbar?: boolean;
};

/**
 * GeneratedOutputsTab — the body of the Library page.
 *
 * Iter 7 (A-12.x — Library redesign):
 *  - Replaced GridKanbanToggle with MasonryGroupToggle (Masonry / Grouped).
 *    Kanban view is dropped from the toggle (KanbanBoard.tsx preserved on
 *    disk; reachable only by code, not by the user).
 *  - View mode is URL-backed via `?view=masonry|grouped` so refresh,
 *    deep-link, and browser back/forward all preserve the user's choice.
 *  - Card click opens the AdDetailDrawer via `?ad=<id>` instead of
 *    `navigate('/library/outputs/:id')` — the old route segment was
 *    redirected back to /library by Library.tsx and broke clicks.
 *  - LibraryToolbar (Studio mode) writes filters to URL params
 *    (`angleFilter`, `category`, `brand`, `sort`, `q`). Legacy callers
 *    still get the prop-driven path.
 */
export function GeneratedOutputsTab({
  brandFilter,
  perfFilter,
  search,
  showToolbar = true,
}: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const view: LibraryView =
    searchParams.get("view") === "grouped" ? "grouped" : "masonry";

  const setView = useCallback(
    (next: LibraryView) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (next === "masonry") sp.delete("view");
          else sp.set("view", next);
          return sp;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const openDrawer = useCallback(
    (output: OutputData) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          sp.set("ad", output.id);
          return sp;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  // ── Resolve effective filters ───────────────────────────────────────
  // In Studio mode (showToolbar=true), filters come from URL params.
  // In legacy mode (Canvas/Command/Modular), filters come from props.
  const useUrlFilters = showToolbar;

  const urlBrandId = searchParams.get("brand") ?? "all";
  const urlBrandName = useMemo(() => {
    if (!useUrlFilters) return null;
    if (urlBrandId === "all") return "all";
    return brands.find((b) => b.id === urlBrandId)?.name ?? "all";
  }, [useUrlFilters, urlBrandId]);

  const effectiveBrandName = useUrlFilters ? urlBrandName ?? "all" : brandFilter ?? "all";
  const effectiveAngle = useUrlFilters ? searchParams.get("angleFilter") ?? "all" : "all";
  const effectiveCategory: ModeId | "all" = useUrlFilters
    ? ((searchParams.get("category") as ModeId | null) ?? "all")
    : "all";
  const effectivePerf = useUrlFilters ? "all" : perfFilter ?? "all";
  const effectiveSort: SortKey = useUrlFilters
    ? ((searchParams.get("sort") as SortKey | null) ?? "newest")
    : "newest";
  const effectiveSearch = useUrlFilters ? searchParams.get("q") ?? "" : search ?? "";

  const filtered = useMemo(() => {
    let arr = sampleOutputs.filter((o) => {
      if (
        effectiveBrandName !== "all" &&
        o.brand?.name.toLowerCase() !== effectiveBrandName.toLowerCase()
      ) {
        return false;
      }
      if (effectiveAngle !== "all" && o.angleId !== effectiveAngle) return false;
      if (effectiveCategory !== "all" && o.mode !== effectiveCategory) return false;
      if (effectivePerf === "top" && (o.qualityScore ?? 0) < 80) return false;
      if (effectiveSearch) {
        const q = effectiveSearch.toLowerCase();
        const haystack = [o.headline, o.body, o.cta, o.brand?.name, o.product?.name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    // Sort
    arr = [...arr].sort((a, b) => {
      if (effectiveSort === "oldest") {
        return a.generatedAt.getTime() - b.generatedAt.getTime();
      }
      if (effectiveSort === "score") {
        return (b.qualityScore ?? 0) - (a.qualityScore ?? 0);
      }
      // newest default
      return b.generatedAt.getTime() - a.generatedAt.getTime();
    });
    return arr;
  }, [
    effectiveBrandName,
    effectiveAngle,
    effectiveCategory,
    effectivePerf,
    effectiveSort,
    effectiveSearch,
  ]);

  const selectedOutputs = useMemo(
    () => filtered.filter((o) => selected.has(o.id)),
    [filtered, selected],
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Internal toolbar (Studio mode only). Other variants render their
          own filter chrome outside this component. */}
      {showToolbar && <LibraryToolbar />}

      {filtered.length === 0 ? (
        <EmptyState
          title="No outputs match your filters"
          description={
            effectiveSearch
              ? `Nothing matches "${effectiveSearch}". Clear search to see everything.`
              : "Try a different brand, angle, or category."
          }
        />
      ) : (
        <>
          {/* Toolbar row — counts + view toggle + CSV */}
          <div className="flex items-center justify-between gap-2">
            <div className="font-g6-sans text-g6-sm text-g6-text-secondary">
              <span className="font-g6-mono text-g6-text">{filtered.length}</span> outputs
            </div>
            <div className="flex items-center gap-2">
              <MasonryGroupToggle value={view} onChange={setView} />
              <CSVExportButton outputs={filtered} filename="genie6-library.csv" />
            </div>
          </div>

          <BulkToolbar
            selectedOutputs={selectedOutputs}
            onClear={() => setSelected(new Set())}
          />

          {/* View */}
          {view === "masonry" ? (
            <MasonryView
              outputs={filtered}
              selected={selected}
              onSelect={toggleSelect}
              onCardClick={openDrawer}
            />
          ) : (
            <GroupByAngleView
              outputs={filtered}
              selected={selected}
              onSelect={toggleSelect}
              onCardClick={openDrawer}
            />
          )}
        </>
      )}
    </div>
  );
}
