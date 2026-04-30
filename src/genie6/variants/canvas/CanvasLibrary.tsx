import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, Grid3X3, List as ListIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { GeneratedOutputsTab } from "../../library/tabs/GeneratedOutputsTab";
import { PreviewPane } from "../../components/PreviewPane";
import { brands } from "../../mocks/brands";
import { sampleOutputs } from "../../mocks/sample-outputs";

/**
 * Canvas variant — Library.
 *
 * Outputs-only. Filter pills as a floating row, dense canvas grid with grid-floor
 * backdrop. Hooks / Angles / Concepts / Templates / Avatars / Audiences moved to
 * Assets.
 */
export function CanvasLibrary() {
  const { assetId } = useParams<{ assetId?: string }>();
  const navigate = useNavigate();
  const [brandFilter, setBrandFilter] = useState("all");
  const [perfFilter, setPerfFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const previewOutput = assetId ? sampleOutputs.find((o) => o.id === assetId) ?? null : null;

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="absolute inset-0 g6-canvas-floor opacity-40 pointer-events-none" />

      <header className="relative z-10 flex items-center justify-between border-b border-g6-border-secondary bg-g6-bg-base/80 backdrop-blur-md px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
            canvas · library
          </span>
          <h1 className="text-g6-h4 font-bold text-g6-text">Generations</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate("/iq/genie6/generate")}
          className="inline-flex items-center gap-1.5 rounded-g6-pill bg-g6-primary px-3 py-1 text-g6-xs font-bold text-g6-text-on-accent shadow-g6-glow"
        >
          <Plus className="h-3 w-3" /> New
        </button>
      </header>

      <div className="relative z-10 flex items-center gap-2 px-5 py-3">
        <div className="flex items-center gap-2 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container/90 backdrop-blur-md px-3 py-1.5 shadow-g6-md">
          <Search className="h-3.5 w-3.5 text-g6-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search outputs…"
            className="bg-transparent text-g6-sm text-g6-text placeholder:text-g6-text-tertiary outline-none w-48"
          />
        </div>
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container/90 backdrop-blur-md px-3 py-1.5 text-g6-sm text-g6-text-secondary"
        >
          <option value="all">All brands</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select
          value={perfFilter}
          onChange={(e) => setPerfFilter(e.target.value)}
          className="rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container/90 backdrop-blur-md px-3 py-1.5 text-g6-sm text-g6-text-secondary"
        >
          <option value="all">All performance</option>
          <option value="winner">Winners</option>
          <option value="paused">Paused</option>
        </select>
        <div className="ml-auto flex items-center rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container/90 backdrop-blur-md p-0.5">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-g6-pill",
              view === "grid" ? "bg-g6-primary text-g6-text-on-accent" : "text-g6-text-tertiary"
            )}
            title="Grid view"
          >
            <Grid3X3 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-g6-pill",
              view === "list" ? "bg-g6-primary text-g6-text-on-accent" : "text-g6-text-tertiary"
            )}
            title="List view"
          >
            <ListIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <GeneratedOutputsTab
            brandFilter={brandFilter === "all" ? "all" : brands.find((b) => b.id === brandFilter)?.name ?? "all"}
            perfFilter={perfFilter}
            search={search}
          />
        </div>
        <PreviewPane
          output={previewOutput}
          onClose={() => navigate("/iq/genie6/library")}
        />
      </div>
    </div>
  );
}
