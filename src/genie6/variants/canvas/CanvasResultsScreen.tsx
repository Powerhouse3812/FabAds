import { useState } from "react";
import { useParams } from "react-router-dom";
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

/** Canvas variant — Results screen. Grid-floor canvas backdrop, scattered moodboard feel. */
export function CanvasResultsScreen() {
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
    <div className="relative flex min-h-full flex-col overflow-hidden">
      <div className="absolute inset-0 g6-canvas-floor opacity-40 pointer-events-none" />
      {selected.size >= 2 && (
        <BulkToolbar selectedOutputs={outputs.filter((o) => selected.has(o.id))} onClear={() => setSelected(new Set())} />
      )}
      <header className="relative z-10 flex flex-wrap items-center gap-3 border-b border-g6-border-secondary bg-g6-bg-base/80 backdrop-blur-md px-5 py-3">
        <span className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">canvas · results</span>
        <div className="flex-1 min-w-0">
          <h1 className="text-g6-h4 font-bold text-g6-text">{outputs.length} variants generated</h1>
          <p className="text-g6-xs text-g6-text-tertiary">{modeLabel} · Mamaearth Onion shampoo</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="h-8 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container/80 backdrop-blur-md px-3 text-g6-sm text-g6-text focus:outline-none">
            <option value="score">Sort: Score</option>
            <option value="date">Sort: Date</option>
          </select>
          <GridKanbanToggle value={view} onChange={setView} />
          <CSVExportButton outputs={sorted} filename={`genie6-batch-${mode}.csv`} />
        </div>
      </header>
      <div className="relative z-10 flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5">
          {view === "grid" && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {sorted.map((output) => (
                <OutputCard key={output.id} {...output} selected={selected.has(output.id)} onSelect={() => toggleSelect(output.id)} onClick={() => setPreviewId(output.id)} onEllipsisAction={(a) => handleEllipsis(output.id, a)} onSave={() => {}} onLaunch={() => {}} onDownload={() => {}} />
              ))}
            </div>
          )}
          {view === "kanban" && (
            <KanbanBoard outputs={sorted} assignment={kanbanAssignment} onChange={setKanbanAssignment} onCardClick={(id) => setPreviewId(id)} onSelect={toggleSelect} selectedIds={selected} />
          )}
        </div>
        {previewOutput && (
          <PreviewPane output={previewOutput} onClose={() => setPreviewId(null)} onSave={() => {}} onLaunch={() => {}} onDownload={() => {}} onEllipsisAction={(a) => handleEllipsis(previewOutput.id, a)} />
        )}
      </div>
    </div>
  );
}
