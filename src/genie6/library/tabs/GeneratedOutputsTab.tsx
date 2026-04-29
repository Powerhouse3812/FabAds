import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OutputCard } from "../../components/OutputCard";
import { KanbanBoard } from "../../components/KanbanBoard";
import { BulkToolbar } from "../../components/BulkToolbar";
import { GridKanbanToggle, type GridKanbanView } from "../../components/GridKanbanToggle";
import { CSVExportButton } from "../../components/CSVExportButton";
import { EmptyState } from "../../components/EmptyState";
import { sampleOutputs } from "../../mocks/sample-outputs";
import type { KanbanColumn, OutputData } from "../../types/output";

type Props = {
  brandFilter: string;
  perfFilter: string;
  search: string;
};

export function GeneratedOutputsTab({ brandFilter, perfFilter, search }: Props) {
  const navigate = useNavigate();
  const [view, setView] = useState<GridKanbanView>("grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((o) => (
            <OutputCard
              key={o.id}
              {...o}
              selected={selected.has(o.id)}
              onSelect={() => toggleSelect(o.id)}
              onClick={() => openPreview(o)}
            />
          ))}
        </div>
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
