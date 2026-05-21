import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, Plus, Database } from "lucide-react";
import { GeneratedOutputsTab } from "../../library/tabs/GeneratedOutputsTab";
import { PreviewPane } from "../../components/PreviewPane";
import { LibraryQueueStrip } from "../../library/queue-strip/LibraryQueueStrip";
import { brands } from "../../mocks/brands";
import { sampleOutputs } from "../../mocks/sample-outputs";

/**
 * Command variant — Library.
 *
 * Outputs-only. Dense ops view focused on the generation database. Other
 * asset classes live in Assets (formerly Workspace).
 */
export function CommandLibrary() {
  const { assetId } = useParams<{ assetId?: string }>();
  const navigate = useNavigate();
  const [brandFilter, setBrandFilter] = useState("all");
  const [perfFilter, setPerfFilter] = useState("all");
  const [search, setSearch] = useState("");

  const previewOutput = assetId ? sampleOutputs.find((o) => o.id === assetId) ?? null : null;

  return (
    <div className="flex h-full flex-col p-3">
      <div className="flex flex-1 gap-3 overflow-hidden">
        <main className="flex flex-1 flex-col overflow-hidden rounded-g6-base border border-g6-border bg-g6-bg-container">
          <header className="flex items-center justify-between border-b border-g6-border-secondary bg-g6-bg-base px-5 py-3">
            <div className="flex items-center gap-3">
              <Database className="h-4 w-4 text-g6-primary" />
              <h1 className="text-g6-h4 font-bold text-g6-text">Generations</h1>
              <span className="font-g6-mono text-g6-xs text-g6-text-tertiary uppercase tracking-wider">
                · 142 outputs
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate("/iq/genie6/generate")}
              className="inline-flex items-center gap-1.5 rounded-g6-base bg-g6-primary px-3 py-1.5 text-g6-xs font-bold text-g6-text-on-accent"
            >
              <Plus className="h-3 w-3" /> New generation
            </button>
          </header>

          <div className="flex items-center gap-2 border-b border-g6-border-secondary bg-g6-bg-base px-5 py-2">
            <div className="flex items-center gap-2 rounded-g6-base border border-g6-border bg-g6-bg-container px-2.5 py-1">
              <Search className="h-3.5 w-3.5 text-g6-text-tertiary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="search outputs…"
                className="bg-transparent text-g6-sm text-g6-text placeholder:text-g6-text-tertiary outline-none w-56"
              />
            </div>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="rounded-g6-base border border-g6-border bg-g6-bg-container px-2.5 py-1 text-g6-sm text-g6-text-secondary"
            >
              <option value="all">All brands</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select
              value={perfFilter}
              onChange={(e) => setPerfFilter(e.target.value)}
              className="rounded-g6-base border border-g6-border bg-g6-bg-container px-2.5 py-1 text-g6-sm text-g6-text-secondary"
            >
              <option value="all">All performance</option>
              <option value="winner">Winners only</option>
              <option value="paused">Paused</option>
            </select>
            <span className="ml-auto font-g6-mono text-g6-xs text-g6-text-tertiary">142 results</span>
          </div>

          {/* A-12.188: queue marquee — same one-row treatment as the
              other 3 variants; sits between the toolbar and the grid. */}
          <div className="px-5 pt-3">
            <LibraryQueueStrip />
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <GeneratedOutputsTab
              brandFilter={brandFilter === "all" ? "all" : brands.find((b) => b.id === brandFilter)?.name ?? "all"}
              perfFilter={perfFilter}
              search={search}
              showToolbar={false}
            />
          </div>
        </main>

        <PreviewPane
          output={previewOutput}
          onClose={() => navigate("/iq/genie6/library")}
        />
      </div>
    </div>
  );
}
