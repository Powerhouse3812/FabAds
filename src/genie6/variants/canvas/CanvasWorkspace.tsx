import { useState } from "react";
import { useParams } from "react-router-dom";
import { LayoutPanelLeft, Columns3, LayoutGrid, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceTree } from "../../workspace/views/WorkspaceTree";
import { WorkspaceMasterDetail } from "../../workspace/views/WorkspaceMasterDetail";
import { WorkspaceCards } from "../../workspace/views/WorkspaceCards";

type ViewMode = "tree" | "master-detail" | "cards";
const STORAGE_KEY = "genie6-workspace-view-canvas";
const DEFAULT_VIEW: ViewMode = "cards";

function loadView(): ViewMode {
  if (typeof window === "undefined") return DEFAULT_VIEW;
  const saved = window.localStorage.getItem(STORAGE_KEY) as ViewMode | null;
  return saved === "tree" || saved === "master-detail" || saved === "cards" ? saved : DEFAULT_VIEW;
}

/**
 * Canvas variant — Workspace.
 *
 * Editor mental model: workspace = your asset gallery on the canvas. Defaults
 * to Cards view (visual brand tiles), grid-floor backdrop, floating top
 * toolbar with translucent surface.
 */
export function CanvasWorkspace() {
  const params = useParams<{ brandId?: string; categoryId?: string }>();
  const tab: "brands" | "categories" = window.location.pathname.includes("/categories")
    ? "categories"
    : "brands";
  const [view, setView] = useState<ViewMode>(loadView);

  const update = (next: ViewMode) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setView(next);
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Grid floor */}
      <div className="absolute inset-0 g6-canvas-floor opacity-40 pointer-events-none" />

      {/* Floating toolbar */}
      <header className="relative z-10 flex flex-shrink-0 items-center gap-3 border-b border-g6-border-secondary bg-g6-bg-base/80 backdrop-blur-md px-5 py-3">
        <span className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
          canvas · workspace
        </span>
        <TabPills tab={tab} />
        <div className="ml-auto flex items-center gap-2">
          <ViewSwitcher value={view} onChange={update} />
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-g6-pill bg-g6-primary px-3 text-g6-sm font-bold text-g6-text-on-accent shadow-g6-glow"
          >
            <Plus className="h-3.5 w-3.5" />
            New {tab === "brands" ? "brand" : "category"}
          </button>
        </div>
      </header>

      <div className="relative z-10 flex-1 overflow-hidden">
        {view === "tree" && <WorkspaceTree tab={tab} initialId={params.brandId ?? params.categoryId} />}
        {view === "master-detail" && <WorkspaceMasterDetail tab={tab} initialId={params.brandId ?? params.categoryId} />}
        {view === "cards" && <WorkspaceCards tab={tab} initialId={params.brandId ?? params.categoryId} />}
      </div>
    </div>
  );
}

function TabPills({ tab }: { tab: "brands" | "categories" }) {
  return (
    <nav className="inline-flex items-center gap-1 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container/80 backdrop-blur-md p-0.5">
      <a
        href="/iq/genie6/workspace/brands"
        className={cn(
          "rounded-g6-pill px-3 py-1 text-g6-sm font-medium transition-colors",
          tab === "brands" ? "bg-g6-primary text-g6-text-on-accent" : "text-g6-text-secondary hover:text-g6-text"
        )}
      >
        Brands
      </a>
      <a
        href="/iq/genie6/workspace/categories"
        className={cn(
          "rounded-g6-pill px-3 py-1 text-g6-sm font-medium transition-colors",
          tab === "categories" ? "bg-g6-primary text-g6-text-on-accent" : "text-g6-text-secondary hover:text-g6-text"
        )}
      >
        Categories
      </a>
    </nav>
  );
}

function ViewSwitcher({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  const opts: { v: ViewMode; Icon: typeof LayoutPanelLeft; t: string }[] = [
    { v: "tree", Icon: LayoutPanelLeft, t: "Tree" },
    { v: "master-detail", Icon: Columns3, t: "Master-detail" },
    { v: "cards", Icon: LayoutGrid, t: "Cards" },
  ];
  return (
    <div className="inline-flex items-center rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container/80 backdrop-blur-md p-0.5">
      {opts.map(({ v, Icon, t }) => (
        <button
          key={v}
          type="button"
          title={t}
          onClick={() => onChange(v)}
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-g6-pill transition-colors",
            value === v ? "bg-g6-primary text-g6-text-on-accent" : "text-g6-text-tertiary hover:bg-g6-bg-spotlight hover:text-g6-text"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
