import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { GripVertical, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { GeneratedOutputsTab } from "../../library/tabs/GeneratedOutputsTab";
import { HooksTab } from "../../library/tabs/HooksTab";
import { AnglesTab } from "../../library/tabs/AnglesTab";
import { ConceptsTab } from "../../library/tabs/ConceptsTab";
import { TemplatesTab } from "../../library/tabs/TemplatesTab";
import { AvatarsTab } from "../../library/tabs/AvatarsTab";
import { AudiencesTab } from "../../library/tabs/AudiencesTab";
import { PreviewPane } from "../../components/PreviewPane";
import { brands } from "../../mocks/brands";
import { sampleOutputs } from "../../mocks/sample-outputs";

const TABS = [
  { slug: "outputs", label: "outputs_module", count: 142 },
  { slug: "hooks", label: "hooks_module", count: 84 },
  { slug: "angles", label: "angles_module", count: 28 },
  { slug: "concepts", label: "concepts_module", count: 16 },
  { slug: "templates", label: "templates_module", count: 12 },
  { slug: "avatars", label: "avatars_module", count: 9 },
  { slug: "audiences", label: "audiences_module", count: 24 },
] as const;

type TabSlug = (typeof TABS)[number]["slug"];

/**
 * Modular variant — Library.
 *
 * Each asset class is its own module. Active module = full-bleed cosmic card
 * with code-style header. Tab strip = module-switcher pills. Filter strip =
 * inline module sub-controls.
 */
export function ModularLibrary() {
  const { assetType, assetId } = useParams<{ assetType?: string; assetId?: string }>();
  const navigate = useNavigate();
  const [brandFilter, setBrandFilter] = useState("all");
  const [perfFilter, setPerfFilter] = useState("all");
  const [search, setSearch] = useState("");

  if (!assetType) return <Navigate to="/iq/genie6/library/outputs" replace />;
  if (!TABS.find((t) => t.slug === assetType))
    return <Navigate to="/iq/genie6/library/outputs" replace />;

  const activeTab = assetType as TabSlug;
  const activeTabConfig = TABS.find((t) => t.slug === activeTab)!;
  const previewOutput =
    activeTab === "outputs" && assetId ? sampleOutputs.find((o) => o.id === assetId) ?? null : null;

  return (
    <div className="g6-halo relative flex h-full flex-col p-6">
      <header className="relative z-10 mb-4">
        <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
          <span className="text-g6-primary">&gt;</span> library.modules
        </p>
        <h1 className="text-g6-h2 font-bold tracking-[-0.02em] text-g6-text mt-1">
          Library
        </h1>
      </header>

      {/* Module switcher pills */}
      <div className="relative z-10 mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const isActive = t.slug === activeTab;
          return (
            <button
              key={t.slug}
              type="button"
              onClick={() => navigate(`/iq/genie6/library/${t.slug}`)}
              className={cn(
                "inline-flex items-center gap-2 rounded-g6-pill px-3 py-1.5 font-g6-mono text-g6-xs uppercase tracking-wider transition-colors",
                isActive
                  ? "bg-g6-primary text-g6-text-on-accent"
                  : "bg-g6-bg-container/60 text-g6-text-tertiary border border-g6-border-secondary hover:text-g6-text"
              )}
            >
              {isActive && <span>&gt;</span>}
              <span>{t.label}</span>
              <span className="font-g6-mono tabular-nums opacity-70">{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* Active module card */}
      <div className="relative z-10 flex flex-1 gap-3 overflow-hidden">
        <div className="g6-glass flex flex-1 flex-col overflow-hidden rounded-g6-card">
          <header className="flex items-center justify-between border-b border-g6-border-secondary px-4 py-3">
            <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
              <span className="text-g6-primary">&gt;</span> {activeTabConfig.label}
              <span className="text-g6-text-disabled"> · {activeTabConfig.count}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/iq/genie6/generate")}
                className="inline-flex items-center gap-1 rounded-g6-pill bg-g6-primary px-2.5 py-1 font-g6-mono text-g6-xs font-bold uppercase text-g6-text-on-accent"
              >
                <Plus className="h-3 w-3" /> add
              </button>
              <GripVertical className="h-3.5 w-3.5 text-g6-text-disabled cursor-grab" aria-hidden />
            </div>
          </header>

          {/* Inline filter row */}
          <div className="flex items-center gap-2 border-b border-g6-border-secondary px-4 py-2">
            <div className="flex items-center gap-2 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-base/50 px-2.5 py-1">
              <Search className="h-3.5 w-3.5 text-g6-text-tertiary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="filter…"
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

          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "outputs" && (
              <GeneratedOutputsTab
                brandFilter={brandFilter === "all" ? "all" : brands.find((b) => b.id === brandFilter)?.name ?? "all"}
                perfFilter={perfFilter}
                search={search}
              />
            )}
            {activeTab === "hooks" && <HooksTab brandFilter={brandFilter} search={search} />}
            {activeTab === "angles" && <AnglesTab search={search} />}
            {activeTab === "concepts" && <ConceptsTab brandFilter={brandFilter} search={search} />}
            {activeTab === "templates" && <TemplatesTab />}
            {activeTab === "avatars" && <AvatarsTab search={search} />}
            {activeTab === "audiences" && <AudiencesTab brandFilter={brandFilter} search={search} />}
          </div>
        </div>

        <PreviewPane
          output={previewOutput}
          onClose={() => navigate(`/iq/genie6/library/${activeTab}`)}
        />
      </div>
    </div>
  );
}
