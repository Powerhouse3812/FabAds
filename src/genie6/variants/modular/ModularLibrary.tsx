import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, Plus } from "lucide-react";
import { GeneratedOutputsTab } from "../../library/tabs/GeneratedOutputsTab";
import { PreviewPane } from "../../components/PreviewPane";
import { brands } from "../../mocks/brands";
import { sampleOutputs } from "../../mocks/sample-outputs";

/**
 * Modular variant — Library.
 *
 * Single outputs_module on the cosmic canvas. No tab strip — Library is
 * outputs-only; other asset classes live in Assets (formerly Workspace).
 */
export function ModularLibrary() {
  const { assetId } = useParams<{ assetId?: string }>();
  const navigate = useNavigate();
  const [brandFilter, setBrandFilter] = useState("all");
  const [perfFilter, setPerfFilter] = useState("all");
  const [search, setSearch] = useState("");

  const previewOutput = assetId ? sampleOutputs.find((o) => o.id === assetId) ?? null : null;

  return (
    <div className="g6-halo relative flex h-full flex-col p-6">
      <header className="relative z-10 mb-4">
        <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
          <span className="text-g6-primary">&gt;</span> generations.outputs
        </p>
        <h1 className="text-g6-h2 font-bold tracking-[-0.02em] text-g6-text mt-1">
          Generations
        </h1>
        <p className="text-g6-sm text-g6-text-secondary mt-1">142 outputs across all batches</p>
      </header>

      <div className="relative z-10 flex flex-1 gap-3 overflow-hidden">
        {/* Single-module page — no inner module-card wrapper. The page header above already
            establishes "this is the outputs module"; wrapping again creates redundant breadcrumb
            (P0 from UX audit, option A). */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-end gap-2 mb-2">
            <button
              type="button"
              onClick={() => navigate("/iq/genie6/generate")}
              className="inline-flex items-center gap-1 rounded-g6-pill bg-g6-primary px-3 py-1.5 font-g6-mono text-g6-xs font-bold uppercase text-g6-text-on-accent shadow-g6-glow"
            >
              <Plus className="h-3 w-3" /> generate
            </button>
          </div>

          <div className="flex items-center gap-2 border-y border-g6-border-secondary py-2 mb-3">
            <div className="flex items-center gap-2 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-base/50 px-2.5 py-1">
              <Search className="h-3.5 w-3.5 text-g6-text-tertiary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="filter outputs…"
                className="bg-transparent font-g6-mono text-g6-xs text-g6-text placeholder:text-g6-text-tertiary outline-none w-40"
              />
            </div>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="rounded-g6-pill border border-g6-border-secondary bg-g6-bg-base/50 px-2.5 py-1 font-g6-mono text-g6-xs text-g6-text-secondary"
            >
              <option value="all">all brands</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select
              value={perfFilter}
              onChange={(e) => setPerfFilter(e.target.value)}
              className="rounded-g6-pill border border-g6-border-secondary bg-g6-bg-base/50 px-2.5 py-1 font-g6-mono text-g6-xs text-g6-text-secondary"
            >
              <option value="all">all perf</option>
              <option value="winner">winners</option>
              <option value="paused">paused</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto">
            <GeneratedOutputsTab
              brandFilter={brandFilter === "all" ? "all" : brands.find((b) => b.id === brandFilter)?.name ?? "all"}
              perfFilter={perfFilter}
              search={search}
            />
          </div>
        </div>

        <PreviewPane
          output={previewOutput}
          onClose={() => navigate("/iq/genie6/library")}
        />
      </div>
    </div>
  );
}
