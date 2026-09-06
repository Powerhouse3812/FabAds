import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { BulkToolbar } from "../../components/BulkToolbar";
import { CSVExportButton } from "../../components/CSVExportButton";
import { EmptyState } from "../../components/EmptyState";
import type { LibraryView } from "../../components/MasonryGroupToggle";
import { brands } from "../../mocks/brands";
import { sampleOutputs } from "../../mocks/sample-outputs";
import type { ModeId, OutputData } from "../../types/output";
import { LibraryToolbar, type SortKey } from "../LibraryToolbar";
import { MasonryView } from "./MasonryView";
import { GroupByAngleView } from "./GroupByAngleView";
import { BatchGroupedView } from "../BatchGroupedView";
import { useOutputCardActions } from "../useOutputCardActions";
import { useLocalOutputs } from "../libraryActionsStore";
import { useOutputBatchIndex } from "../useOutputBatchIndex";
import { originKey } from "../originLabels";

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
 * A-12.197 (Library Figma final):
 *  - The view toggle (Masonry / Grouped) lives ONLY in `<LibraryTopBar />`
 *    one level up. This component just READS `?view=` to pick which body
 *    to render. Writing happens up top — no duplication.
 *  - The counts + CSV export row remains (left: outputs count, right: CSV).
 *  - LibraryToolbar (Studio mode) writes filters to URL params
 *    (`angleFilter`, `category`, `brand`, `module`, `createdBy`, `sort`,
 *    `q`). Legacy callers (Canvas/Command/Modular) still get the prop-driven
 *    path (module/createdBy filters aren't available there — see FilterBar).
 *  - Card click opens the AdDetailDrawer via `?ad=<id>`.
 *  - Kanban view is dropped from the toggle (KanbanBoard.tsx preserved on
 *    disk; reachable only by code, not by the user).
 *
 * Genie 2.0 §10 — default view is now `?view=batch` (latest batch first,
 * grouped); Masonry and Group-by-angle survive as the two alternative
 * groupings. All three share ONE action-wiring seam (`useOutputCardActions`)
 * so "same wording, same behaviour, same result" (§21.2) is structural.
 */
export function GeneratedOutputsTab({
  brandFilter,
  perfFilter,
  search,
  showToolbar = true,
}: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  // View mode is owned by <LibraryTopBar /> (A-12.197). This component just
  // reads `?view=` to decide which body to render. Writing the param happens
  // up in the top bar — keeps the toggle out of two places. "batch" is the
  // default (§10) and so is omitted from the URL, same convention every
  // other default-valued param here already follows.
  const rawView = searchParams.get("view");
  const view: LibraryView = rawView === "masonry" || rawView === "grouped" ? rawView : "batch";

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
  const clearSelection = () => setSelected(new Set());

  // ── Action wiring (§21.2 — wire the previously-dead ellipsis/bulk/footer
  //    actions) ─────────────────────────────────────────────────────────
  const { getActions, confirmDialog, requestLaunch, regenerateSelection, downloadSelection } =
    useOutputCardActions();
  const outputBatchIndex = useOutputBatchIndex();
  const localOutputs = useLocalOutputs();

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
  // §10 / §17 — new dimensions. Studio mode only (legacy FilterBar callers
  // don't wire these — see FilterBar.tsx).
  const effectiveModule = useUrlFilters ? searchParams.get("module") ?? "all" : "all";
  const effectiveCreatedBy = useUrlFilters ? searchParams.get("createdBy") ?? "all" : "all";

  const filtersActive =
    effectiveBrandName !== "all" ||
    effectiveAngle !== "all" ||
    effectiveCategory !== "all" ||
    effectivePerf !== "all" ||
    effectiveModule !== "all" ||
    effectiveCreatedBy !== "all" ||
    Boolean(effectiveSearch);

  const clearFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.delete("angleFilter");
        sp.delete("category");
        sp.delete("brand");
        sp.delete("module");
        sp.delete("createdBy");
        sp.delete("q");
        return sp;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const allOutputs = useMemo(() => [...localOutputs, ...sampleOutputs], [localOutputs]);

  const filtered = useMemo(() => {
    let arr = allOutputs.filter((o) => {
      if (
        effectiveBrandName !== "all" &&
        o.brand?.name.toLowerCase() !== effectiveBrandName.toLowerCase()
      ) {
        return false;
      }
      if (effectiveAngle !== "all" && o.angleId !== effectiveAngle) return false;
      if (effectiveCategory !== "all" && o.mode !== effectiveCategory) return false;
      if (effectivePerf === "top" && (o.qualityScore ?? 0) < 80) return false;
      if (effectiveModule !== "all") {
        const batch = outputBatchIndex.get(o.id);
        if (!batch || originKey(batch.origin) !== effectiveModule) return false;
      }
      if (effectiveCreatedBy !== "all") {
        const batch = outputBatchIndex.get(o.id);
        if (!batch || batch.createdBy !== effectiveCreatedBy) return false;
      }
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
    allOutputs,
    effectiveBrandName,
    effectiveAngle,
    effectiveCategory,
    effectivePerf,
    effectiveModule,
    effectiveCreatedBy,
    effectiveSort,
    effectiveSearch,
    outputBatchIndex,
  ]);

  const selectedOutputs = useMemo(
    () => filtered.filter((o) => selected.has(o.id)),
    [filtered, selected],
  );

  const onEditBatch = useCallback(() => {
    if (selectedOutputs.length === 0) return;
    const batchIds = new Set(
      selectedOutputs
        .map((o) => outputBatchIndex.get(o.id)?.batchId)
        .filter((id): id is string => Boolean(id)),
    );
    if (batchIds.size === 0) {
      toast.error("These outputs aren't part of a tracked batch");
      return;
    }
    if (batchIds.size > 1) {
      toast("Selection spans multiple batches — showing batch view");
    } else {
      toast.success(`Viewing ${Array.from(batchIds)[0]}`);
    }
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.delete("view"); // batch view is the default
        return sp;
      },
      { replace: false },
    );
  }, [selectedOutputs, outputBatchIndex, setSearchParams]);

  return (
    <div className="flex flex-col gap-3">
      {/* Internal toolbar (Studio mode only). Other variants render their
          own filter chrome outside this component. */}
      {showToolbar && <LibraryToolbar />}
      {confirmDialog}

      {filtered.length === 0 ? (
        // §21.3 "nothing matching the filter" — a DIFFERENT screen from the
        // page-level "nothing yet" onboarding (Library.tsx's
        // EmptyStateOnboarding, which exits to Studio). This one always
        // implies real data exists somewhere; its only honest exit is
        // clearing the filter that's hiding it.
        <EmptyState
          title="No outputs match your filters"
          description={
            effectiveSearch
              ? `Nothing matches "${effectiveSearch}". Clear filters to see everything.`
              : "Try a different brand, angle, category, source or creator."
          }
          primaryAction={
            filtersActive ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-9 items-center rounded-g6-pill bg-g6-primary px-4 font-g6-sans text-g6-sm font-semibold text-g6-text-on-accent transition-transform hover:-translate-y-0.5"
              >
                Clear filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Toolbar row — counts + CSV export (view toggle lives in
              <LibraryTopBar /> at the page level now). */}
          <div className="flex items-center justify-between gap-2">
            <div className="font-g6-sans text-g6-sm text-g6-text-secondary">
              <span className="font-g6-mono text-g6-text">{filtered.length}</span> outputs
            </div>
            <CSVExportButton outputs={filtered} filename="genie6-library.csv" />
          </div>

          <BulkToolbar
            selectedOutputs={selectedOutputs}
            onEditBatch={onEditBatch}
            onBulkDownload={() => downloadSelection(selectedOutputs)}
            onBulkLaunch={() =>
              requestLaunch(selectedOutputs.length, () =>
                toast.success(`${selectedOutputs.length} ads queued for launch (demo — no real spend)`),
              )
            }
            onBulkRegenerate={() => regenerateSelection(selectedOutputs)}
            onClear={clearSelection}
          />

          {/* View */}
          {view === "batch" ? (
            <BatchGroupedView
              outputs={filtered}
              moduleFilter={effectiveModule}
              createdByFilter={effectiveCreatedBy}
              sort={effectiveSort}
              selected={selected}
              onSelect={toggleSelect}
              onCardClick={openDrawer}
              getActions={getActions}
            />
          ) : view === "masonry" ? (
            <MasonryView
              outputs={filtered}
              selected={selected}
              onSelect={toggleSelect}
              onCardClick={openDrawer}
              getActions={getActions}
            />
          ) : (
            <GroupByAngleView
              outputs={filtered}
              selected={selected}
              onSelect={toggleSelect}
              onCardClick={openDrawer}
              getActions={getActions}
            />
          )}
        </>
      )}
    </div>
  );
}
