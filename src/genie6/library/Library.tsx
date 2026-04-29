import { useState } from "react";
import { Navigate, NavLink, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FilterBar } from "./FilterBar";
import { GeneratedOutputsTab } from "./tabs/GeneratedOutputsTab";
import { HooksTab } from "./tabs/HooksTab";
import { AnglesTab } from "./tabs/AnglesTab";
import { ConceptsTab } from "./tabs/ConceptsTab";
import { TemplatesTab } from "./tabs/TemplatesTab";
import { AvatarsTab } from "./tabs/AvatarsTab";
import { AudiencesTab } from "./tabs/AudiencesTab";
import { PreviewPane } from "../components/PreviewPane";
import { DotGridPattern } from "../components/DotGridPattern";
import { brands } from "../mocks/brands";
import { sampleOutputs } from "../mocks/sample-outputs";

const TABS = [
  { slug: "outputs", label: "Outputs" },
  { slug: "hooks", label: "Hooks" },
  { slug: "angles", label: "Angles" },
  { slug: "concepts", label: "Concepts" },
  { slug: "templates", label: "Templates" },
  { slug: "avatars", label: "Avatars" },
  { slug: "audiences", label: "Audiences" },
] as const;

type TabSlug = (typeof TABS)[number]["slug"];

export function Library() {
  const { assetType, assetId } = useParams<{ assetType?: string; assetId?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [brandFilter, setBrandFilter] = useState("all");
  const [perfFilter, setPerfFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Zero-data state — ?empty=1 URL flag (Track 4.9)
  if (searchParams.get("empty") === "1") return <LibraryZeroData />;

  // Default to outputs tab if no assetType in URL
  if (!assetType) return <Navigate to="/iq/genie6/library/outputs" replace />;
  if (!TABS.find((t) => t.slug === assetType))
    return <Navigate to="/iq/genie6/library/outputs" replace />;

  const activeTab = assetType as TabSlug;
  const previewOutput =
    activeTab === "outputs" && assetId ? sampleOutputs.find((o) => o.id === assetId) ?? null : null;

  const brandOptions = brands.map((b) => ({ value: b.id, label: b.name }));

  return (
    <div className="flex h-full">
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex flex-col gap-3 border-b border-g6-border-secondary bg-g6-bg-base px-6 py-4">
          {/* Tabs */}
          <nav role="tablist" aria-label="Library tabs" className="flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <NavLink
                key={t.slug}
                to={`/iq/genie6/library/${t.slug}`}
                role="tab"
                aria-selected={t.slug === activeTab}
                className={({ isActive }) =>
                  cn(
                    "relative inline-flex h-8 items-center rounded-g6-pill px-3 font-g6-sans text-g6-sm font-medium transition-colors",
                    isActive
                      ? "bg-g6-primary-bg text-g6-text"
                      : "text-g6-text-secondary hover:bg-g6-bg-container hover:text-g6-text"
                  )
                }
              >
                {t.label}
              </NavLink>
            ))}
          </nav>

          {/* Filter bar — hidden on tabs that don't filter */}
          {activeTab !== "templates" && (
            <FilterBar
              brandFilter={brandFilter}
              onBrandChange={setBrandFilter}
              perfFilter={perfFilter}
              onPerfChange={setPerfFilter}
              search={search}
              onSearchChange={setSearch}
              brandOptions={brandOptions}
            />
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
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

      {/* Right rail PreviewPane (Outputs tab only, when assetId is present) */}
      <PreviewPane
        output={previewOutput}
        onClose={() => navigate(`/iq/genie6/library/${activeTab}`)}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Zero-data state (Track 4.9)
   ───────────────────────────────────────────────────────── */
function LibraryZeroData() {
  const navigate = useNavigate();
  return (
    <div className="relative flex min-h-full flex-col">
      <DotGridPattern />
      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-6 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-g6-2xl bg-g6-primary-bg">
          <Sparkles className="h-7 w-7 text-g6-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="font-g6-sans text-g6-h1 font-black tracking-[-0.025em] text-g6-text">
            Your library is empty
          </h1>
          <p className="text-g6-base text-g6-text-secondary max-w-md">
            Generate your first batch and your library will fill with outputs, hooks, angles, concepts, templates, avatars, and audiences.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/iq/genie6/generate")}
          className="inline-flex items-center gap-2 rounded-g6-pill bg-g6-primary px-5 py-2.5 text-g6-sm font-semibold text-g6-text-on-accent shadow-g6-primary-btn transition-transform hover:-translate-y-0.5"
        >
          Start a generation
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
