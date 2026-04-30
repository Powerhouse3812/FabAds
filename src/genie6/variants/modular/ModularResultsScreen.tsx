import { useState } from "react";
import { useParams } from "react-router-dom";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { OutputCard } from "../../components/OutputCard";
import { PreviewPane } from "../../components/PreviewPane";
import { BulkToolbar } from "../../components/BulkToolbar";
import { GridKanbanToggle, type GridKanbanView } from "../../components/GridKanbanToggle";
import { KanbanBoard } from "../../components/KanbanBoard";
import { CSVExportButton } from "../../components/CSVExportButton";
import { sampleOutputs } from "../../mocks/sample-outputs";
import { MODE_LABELS } from "../../types/output";
import type { KanbanColumn, EllipsisAction } from "../../types/output";

type SortKey = "score" | "date";

/** Modular variant — Results screen. Glass module card on cosmic halo. */
export function ModularResultsScreen() {
  const { mode } = useParams<{ mode: string }>();
  const [view, setView] = useState<GridKanbanView>("grid");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [kanbanAssignment, setKanbanAssignment] = useState<Record<string, KanbanColumn>>({});

  const outputs = [...sampleOutputs].filter((o) => o.thumbnail !== undefined || o.headline);
  const sorted = [...outputs].sort((a, b) => {
    if (sortKey === "score") return (b.qualityScore ?? 0) - (a.qualityScore ?? 0);
    return b.generatedAt.getTime() - a.generatedAt.getTime();
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const previewOutput = previewId ? outputs.find((o) => o.id === previewId) ?? null : null;
  const handleEllipsis = (_id: string, _action: EllipsisAction) => {};
  const modeLabel = mode ? (MODE_LABELS[mode as keyof typeof MODE_LABELS] ?? mode) : "Generation";

  return (
    <div className="g6-halo relative flex h-full flex-col p-6">
      {selected.size >= 2 && (
        <BulkToolbar selectedOutputs={outputs.filter((o) => selected.has(o.id))} onClear={() => setSelected(new Set())} />
      )}
      <header className="relative z-10 mb-4">
        <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
          <span className="text-g6-primary">&gt;</span> generation.results
        </p>
        <h1 className="text-g6-h2 font-bold tracking-[-0.02em] text-g6-text mt-1">
          {outputs.length} variants generated
        </h1>
        <p className="text-g6-sm text-g6-text-secondary mt-1">{modeLabel} · Mamaearth Onion shampoo · Aspirational angle</p>
      </header>
      <div className="relative z-10 flex flex-1 gap-3 overflow-hidden">
        <div className="g6-glass flex flex-1 flex-col overflow-hidden rounded-g6-card">
          <header className="flex items-center justify-between border-b border-g6-border-secondary px-4 py-3">
            <p className="text-g6-xs font-medium text-g6-text-tertiary">Outputs · {sorted.length}</p>
            <div className="flex items-center gap-2">
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="h-7 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-base/50 px-2.5 font-g6-mono text-g6-xs text-g6-text-secondary focus:outline-none">
                <option value="score">score</option>
                <option value="date">date</option>
              </select>
              <GridKanbanToggle value={view} onChange={setView} />
              <CSVExportButton outputs={sorted} filename={`genie6-batch-${mode}.csv`} />
              <GripVertical className="h-3.5 w-3.5 text-g6-text-disabled cursor-grab" aria-hidden />
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-4">
            {view === "grid" && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {sorted.map((output) => (
                  <OutputCard key={output.id} {...output} selected={selected.has(output.id)} onSelect={() => toggleSelect(output.id)} onClick={() => setPreviewId(output.id)} onEllipsisAction={(a) => handleEllipsis(output.id, a)} onSave={() => {}} onLaunch={() => {}} onDownload={() => {}} />
                ))}
              </div>
            )}
            {view === "kanban" && (
              <KanbanBoard outputs={sorted} assignment={kanbanAssignment} onChange={setKanbanAssignment} onCardClick={(id) => setPreviewId(id)} onSelect={toggleSelect} selectedIds={selected} />
            )}
          </div>
        </div>
        {previewOutput && (
          <PreviewPane output={previewOutput} onClose={() => setPreviewId(null)} onSave={() => {}} onLaunch={() => {}} onDownload={() => {}} onEllipsisAction={(a) => handleEllipsis(previewOutput.id, a)} />
        )}
      </div>
    </div>
  );
}
