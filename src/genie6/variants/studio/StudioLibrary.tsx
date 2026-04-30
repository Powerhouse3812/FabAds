import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GeneratedOutputsTab } from "../../library/tabs/GeneratedOutputsTab";
import { FilterBar } from "../../library/FilterBar";
import { PreviewPane } from "../../components/PreviewPane";
import { brands } from "../../mocks/brands";
import { sampleOutputs } from "../../mocks/sample-outputs";

/**
 * Studio variant — Library.
 *
 * Library is now strictly Generated Outputs (no sub-nav). Hooks / Angles /
 * Concepts / Templates / Avatars / Audiences moved to Assets (formerly
 * Workspace). Single dense surface focused on browsing what was generated.
 */
export function StudioLibrary() {
  const { assetId } = useParams<{ assetId?: string }>();
  const navigate = useNavigate();
  const [brandFilter, setBrandFilter] = useState("all");
  const [perfFilter, setPerfFilter] = useState("all");
  const [search, setSearch] = useState("");

  const previewOutput = assetId ? sampleOutputs.find((o) => o.id === assetId) ?? null : null;
  const brandOptions = brands.map((b) => ({ value: b.id, label: b.name }));

  return (
    <div className="flex h-full p-3">
      <main className="flex flex-1 overflow-hidden rounded-g6-card border border-g6-border-secondary bg-g6-bg-container">
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="border-b border-g6-border-secondary bg-g6-bg-base px-5 py-3">
            <h1 className="text-g6-h4 font-bold text-g6-text">Generations</h1>
            <p className="text-g6-xs text-g6-text-tertiary">142 outputs across all batches</p>
          </header>
          <div className="border-b border-g6-border-secondary bg-g6-bg-base px-5 py-2">
            <FilterBar
              brandFilter={brandFilter}
              onBrandChange={setBrandFilter}
              perfFilter={perfFilter}
              onPerfChange={setPerfFilter}
              search={search}
              onSearchChange={setSearch}
              brandOptions={brandOptions}
            />
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
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
      </main>
    </div>
  );
}
