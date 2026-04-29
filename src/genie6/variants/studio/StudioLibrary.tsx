import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { FilterBar } from "../../library/FilterBar";
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
 * Studio variant — Library.
 *
 * 3-column workspace: left vertical tab list with counts (file-tree feel) ·
 * middle content · right preview pane (already exists for outputs detail).
 * Agency-desk vibe: every asset class addressable in one click.
 */
export function StudioLibrary() {
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
  const brandOptions = brands.map((b) => ({ value: b.id, label: b.name }));

  return (
    <div className="grid h-full grid-cols-[200px_1fr] gap-3 p-3">
      {/* LEFT — vertical tab tree */}
      <aside className="overflow-y-auto rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-3">
        <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary mb-2">
          Library
        </p>
        <ul className="space-y-0.5">
          {TABS.map((t) => {
            const isActive = t.slug === activeTab;
            return (
              <li key={t.slug}>
                <button
                  type="button"
                  onClick={() => navigate(`/iq/genie6/library/${t.slug}`)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-g6-base px-2 py-1.5 text-left transition-colors",
                    isActive
                      ? "bg-g6-primary-bg font-semibold text-g6-text"
                      : "text-g6-text-secondary hover:bg-g6-bg-spotlight hover:text-g6-text"
                  )}
                >
                  <span className="text-g6-sm">{t.label}</span>
                  <span className="font-g6-mono text-g6-xs text-g6-text-tertiary tabular-nums">{t.count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* MAIN */}
      <main className="flex overflow-hidden rounded-g6-card border border-g6-border-secondary bg-g6-bg-container">
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="border-b border-g6-border-secondary bg-g6-bg-base px-5 py-3">
            <h1 className="text-g6-h4 font-bold text-g6-text">
              {TABS.find((t) => t.slug === activeTab)?.label}
            </h1>
            <p className="text-g6-xs text-g6-text-tertiary">
              {TABS.find((t) => t.slug === activeTab)?.count} items
            </p>
          </header>
          {activeTab !== "templates" && (
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
          )}
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
        </div>
        <PreviewPane
          output={previewOutput}
          onClose={() => navigate(`/iq/genie6/library/${activeTab}`)}
        />
      </main>
    </div>
  );
}
