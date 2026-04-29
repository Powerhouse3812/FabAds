import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { OutputCard } from "../../components/OutputCard";
import { KanbanBoard } from "../../components/KanbanBoard";
import { BulkToolbar } from "../../components/BulkToolbar";
import { GridKanbanToggle, type GridKanbanView } from "../../components/GridKanbanToggle";
import { CSVExportButton } from "../../components/CSVExportButton";
import { EmptyState } from "../../components/EmptyState";
import { sampleOutputs } from "../../mocks/sample-outputs";
import type { KanbanColumn, OutputData } from "../../types/output";

const PAGE_SIZE = 24;

type Props = {
  brandFilter: string;
  perfFilter: string;
  search: string;
};

export function GeneratedOutputsTab({ brandFilter, perfFilter, search }: Props) {
  const navigate = useNavigate();
  const [view, setView] = useState<GridKanbanView>("grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [brandFilter, perfFilter, search]);
  const [kanbanAssign, setKanbanAssign] = useState<Record<string, KanbanColumn>>(() => {
    // Seed kanban: first 3 = winner, next 3 = maybe, rest = reject
    const seed: Record<string, KanbanColumn> = {};
    sampleOutputs.forEach((o, i) => {
      seed[o.id] = i < 3 ? "winner" : i < 6 ? "maybe" : "reject";
    });
    return seed;
  });

  const filtered = useMemo(() => {
    return sampleOutputs.filter((o) => {
      if (brandFilter !== "all" && o.brand?.name.toLowerCase() !== brandFilter.toLowerCase())
        return false;
      if (perfFilter === "top" && (o.qualityScore ?? 0) < 80) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = [o.headline, o.body, o.cta, o.brand?.name, o.product?.name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [brandFilter, perfFilter, search]);

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectedOutputs = useMemo(
    () => filtered.filter((o) => selected.has(o.id)),
    [filtered, selected]
  );

  const openPreview = (output: OutputData) => navigate(`/iq/genie6/library/outputs/${output.id}`);

  if (filtered.length === 0) {
    return (
      <EmptyState
        title="No outputs match your filters"
        description={search ? `Nothing matches "${search}". Clear search to see everything.` : "Try a different brand or performance filter."}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Sticky toolbar row */}
      <div className="flex items-center justify-between gap-2">
        <div className="font-g6-sans text-g6-sm text-g6-text-secondary">
          <span className="font-g6-mono text-g6-text">{filtered.length}</span> outputs
        </div>
        <div className="flex items-center gap-2">
          <GridKanbanToggle value={view} onChange={setView} />
          <CSVExportButton outputs={filtered} filename="genie6-library.csv" />
        </div>
      </div>

      <BulkToolbar
        selectedOutputs={selectedOutputs}
        onClear={() => setSelected(new Set())}
      />

      {/* View */}
      {view === "grid" ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((o) => (
              <OutputCard
                key={o.id}
                {...o}
                selected={selected.has(o.id)}
                onSelect={() => toggleSelect(o.id)}
                onClick={() => openPreview(o)}
              />
            ))}
          </div>
          <PaginationBar total={filtered.length} pageSize={PAGE_SIZE} page={page} onPage={setPage} />
        </>
      ) : (
        <KanbanBoard
          outputs={filtered}
          assignment={kanbanAssign}
          onChange={setKanbanAssign}
          selectedIds={selected}
          onSelect={toggleSelect}
          onCardClick={(id) => {
            const o = filtered.find((x) => x.id === id);
            if (o) openPreview(o);
          }}
        />
      )}
    </div>
  );
}

function PaginationBar({ total, pageSize, page, onPage }: { total: number; pageSize: number; page: number; onPage: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="mt-4 flex items-center justify-between border-t border-g6-border-secondary pt-3">
      <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">
        Showing <span className="text-g6-text">{start}–{end}</span> of <span className="text-g6-text tabular-nums">{total}</span>
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="inline-flex h-7 w-7 items-center justify-center rounded-g6-base border border-g6-border-secondary bg-g6-bg-container text-g6-text-secondary disabled:opacity-40 disabled:cursor-not-allowed hover:text-g6-text"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="font-g6-mono text-g6-xs text-g6-text-secondary px-2 tabular-nums">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="inline-flex h-7 w-7 items-center justify-center rounded-g6-base border border-g6-border-secondary bg-g6-bg-container text-g6-text-secondary disabled:opacity-40 disabled:cursor-not-allowed hover:text-g6-text"
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
