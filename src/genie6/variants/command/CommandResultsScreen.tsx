import { useState } from "react";
import { useParams } from "react-router-dom";
import { Database } from "lucide-react";
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

/** Command variant — Results screen. Ops dashboard chrome with stats summary + dense grid. */
export function CommandResultsScreen() {
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

  // Quick stats
  const avgScore = Math.round(sorted.reduce((sum, o) => sum + (o.qualityScore ?? 0), 0) / Math.max(1, sorted.length));
  const winners = sorted.filter((o) => (o.qualityScore ?? 0) >= 80).length;

  return (
    <div className="flex h-full flex-col p-3 gap-3">
      {selected.size >= 2 && (
        <BulkToolbar selectedOutputs={outputs.filter((o) => selected.has(o.id))} onClear={() => setSelected(new Set())} />
      )}
      <div className="flex flex-1 gap-3 overflow-hidden">
        <main className="flex flex-1 flex-col overflow-hidden rounded-g6-base border border-g6-border bg-g6-bg-container">
          <header className="flex items-center justify-between border-b border-g6-border-secondary bg-g6-bg-base px-5 py-3">
            <div className="flex items-center gap-3">
              <Database className="h-4 w-4 text-g6-primary" />
              <h1 className="text-g6-h4 font-bold text-g6-text">{outputs.length} variants generated</h1>
              <span className="font-g6-mono text-g6-xs text-g6-text-tertiary uppercase tracking-wider">
                · {modeLabel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="h-8 rounded-g6-base border border-g6-border bg-g6-bg-container px-2 text-g6-sm text-g6-text focus:outline-none">
                <option value="score">Sort: Score</option>
                <option value="date">Sort: Date</option>
              </select>
              <GridKanbanToggle value={view} onChange={setView} />
              <CSVExportButton outputs={sorted} filename={`genie6-batch-${mode}.csv`} />
            </div>
          </header>
          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-2 border-b border-g6-border-secondary bg-g6-bg-base p-4">
            <div className="rounded-g6-base border border-g6-border-secondary bg-g6-bg-container p-3">
              <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">Avg Q-score</p>
              <p className="font-g6-mono text-g6-h3 font-bold tabular-nums text-g6-text mt-1">{avgScore}</p>
            </div>
            <div className="rounded-g6-base border border-g6-primary-border bg-g6-primary-bg p-3">
              <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">Winners (≥80)</p>
              <p className="font-g6-mono text-g6-h3 font-bold tabular-nums text-g6-text mt-1">{winners}</p>
            </div>
            <div className="rounded-g6-base border border-g6-border-secondary bg-g6-bg-container p-3">
              <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">Total</p>
              <p className="font-g6-mono text-g6-h3 font-bold tabular-nums text-g6-text mt-1">{sorted.length}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
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
        </main>
        {previewOutput && (
          <PreviewPane output={previewOutput} onClose={() => setPreviewId(null)} onSave={() => {}} onLaunch={() => {}} onDownload={() => {}} onEllipsisAction={(a) => handleEllipsis(previewOutput.id, a)} />
        )}
      </div>
    </div>
  );
}
