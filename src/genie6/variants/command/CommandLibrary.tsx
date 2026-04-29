import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Search, Plus, FileText, Database } from "lucide-react";
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
  { slug: "outputs", label: "Outputs", count: 142 },
  { slug: "hooks", label: "Hooks", count: 84 },
  { slug: "angles", label: "Angles", count: 28 },
  { slug: "concepts", label: "Concepts", count: 16 },
  { slug: "templates", label: "Templates", count: 12 },
  { slug: "avatars", label: "Avatars", count: 9 },
  { slug: "audiences", label: "Audiences", count: 24 },
] as const;

type TabSlug = (typeof TABS)[number]["slug"];

/**
 * Command variant — Library.
 *
 * Ops asset-database mental model: dense top KPI strip (asset counts), search
 * + filter chips, table-style header with monospace counts. The library is a
 * database of generated content — surfacing volume, recency and source brand.
 */
export function CommandLibrary() {
  const { assetType, assetId } = useParams<{ assetType?: string; assetId?: string }>();
  const navigate = useNavigate();
  const [brandFilter, setBrandFilter] = useState("all");
  const [perfFilter, setPerfFilter] = useState("all");
  const [search, setSearch] = useState("");

  if (!assetType) return <Navigate to="/iq/genie6/library/outputs" replace />;
  if (!TABS.find((t) => t.slug === assetType))
    return <Navigate to="/iq/genie6/library/outputs" replace />;

  const activeTab = assetType as TabSlug;
  const previewOutput =
    activeTab === "outputs" && assetId ? sampleOutputs.find((o) => o.id === assetId) ?? null : null;
  const totalAssets = TABS.reduce((sum, t) => sum + t.count, 0);

  return (
    <div className="flex h-full flex-col p-3 gap-3">
      <div className="flex flex-1 gap-3 overflow-hidden">
        <main className="flex flex-1 flex-col overflow-hidden rounded-g6-base border border-g6-border bg-g6-bg-container">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-g6-border-secondary bg-g6-bg-base px-5 py-3">
            <div className="flex items-center gap-3">
              <Database className="h-4 w-4 text-g6-primary" />
              <h1 className="text-g6-h4 font-bold text-g6-text">Asset library</h1>
              <span className="font-g6-mono text-g6-xs text-g6-text-tertiary uppercase tracking-wider">
                · {totalAssets.toLocaleString("en-IN")} total assets
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate("/iq/genie6/generate")}
              className="inline-flex items-center gap-1.5 rounded-g6-base bg-g6-primary px-3 py-1.5 text-g6-xs font-bold text-g6-text-on-accent"
            >
              <Plus className="h-3 w-3" /> New asset
            </button>
          </header>

          {/* Tab strip + search */}
          <div className="flex items-center justify-between border-b border-g6-border-secondary bg-g6-bg-base px-5 py-2">
            <nav className="flex gap-1">
              {TABS.map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => navigate(`/iq/genie6/library/${t.slug}`)}
                  className={cn(
                    "rounded-g6-base px-3 py-1.5 text-g6-sm font-medium transition-colors flex items-center gap-1.5",
                    t.slug === activeTab
                      ? "bg-g6-bg-container text-g6-text border border-g6-border"
                      : "text-g6-text-secondary hover:text-g6-text"
                  )}
                >
                  <span>{t.label}</span>
                  <span className="font-g6-mono text-g6-xs text-g6-text-tertiary tabular-nums">{t.count}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Filter row */}
          <div className="flex items-center gap-2 border-b border-g6-border-secondary bg-g6-bg-base px-5 py-2">
            <div className="flex items-center gap-2 rounded-g6-base border border-g6-border bg-g6-bg-container px-2.5 py-1">
              <Search className="h-3.5 w-3.5 text-g6-text-tertiary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="search…"
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
            <span className="ml-auto font-g6-mono text-g6-xs text-g6-text-tertiary">
              {TABS.find((t) => t.slug === activeTab)?.count} results
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
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
        </main>

        <PreviewPane
          output={previewOutput}
          onClose={() => navigate(`/iq/genie6/library/${activeTab}`)}
        />
      </div>
    </div>
  );
}
