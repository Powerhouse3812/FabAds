import { useState } from "react";
import { useParams } from "react-router-dom";
import { LayoutPanelLeft, Columns3, LayoutGrid, Plus, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceTree } from "../../workspace/views/WorkspaceTree";
import { WorkspaceMasterDetail } from "../../workspace/views/WorkspaceMasterDetail";
import { WorkspaceCards } from "../../workspace/views/WorkspaceCards";

type ViewMode = "tree" | "master-detail" | "cards";
const STORAGE_KEY = "genie6-workspace-view-modular";
const DEFAULT_VIEW: ViewMode = "cards";

function loadView(): ViewMode {
  if (typeof window === "undefined") return DEFAULT_VIEW;
  const saved = window.localStorage.getItem(STORAGE_KEY) as ViewMode | null;
  return saved === "tree" || saved === "master-detail" || saved === "cards" ? saved : DEFAULT_VIEW;
}

/**
 * Modular variant — Workspace.
 *
 * Composable workbench mental model: workspace = brand modules on the dark
 * cosmic canvas. Defaults to Cards view (each brand = its own module),
 * code-style header, halo backdrop.
 */
export function ModularWorkspace() {
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
    <div className="g6-halo relative flex h-full flex-col p-6">
      <header className="relative z-10 mb-4 flex items-end justify-between">
        <div>
          <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
            <span className="text-g6-primary">&gt;</span> workspace.{tab}
          </p>
          <h1 className="text-g6-h2 font-bold tracking-[-0.02em] text-g6-text mt-1">Workspace</h1>
        </div>
        <div className="flex items-center gap-2">
          <ViewSwitcher value={view} onChange={update} />
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-g6-pill bg-g6-primary px-3 font-g6-mono text-g6-xs font-bold uppercase text-g6-text-on-accent shadow-g6-glow"
          >
            <Plus className="h-3.5 w-3.5" />
            add {tab === "brands" ? "brand" : "category"}
          </button>
        </div>
      </header>

      <div className="relative z-10 mb-4 flex flex-wrap gap-2">
        <TabPill href="/iq/genie6/workspace/brands" label="brands_module" active={tab === "brands"} />
        <TabPill href="/iq/genie6/workspace/categories" label="categories_module" active={tab === "categories"} />
      </div>

      <div className="g6-glass relative z-10 flex flex-1 flex-col overflow-hidden rounded-g6-card">
        <header className="flex items-center justify-between border-b border-g6-border-secondary px-4 py-2.5">
          <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
            <span className="text-g6-primary">&gt;</span> {tab}_module · {view.replace("-", "_")}_view
          </p>
          <GripVertical className="h-3.5 w-3.5 text-g6-text-disabled cursor-grab" aria-hidden />
        </header>
        <div className="flex-1 overflow-hidden">
          {view === "tree" && <WorkspaceTree tab={tab} initialId={params.brandId ?? params.categoryId} />}
          {view === "master-detail" && <WorkspaceMasterDetail tab={tab} initialId={params.brandId ?? params.categoryId} />}
          {view === "cards" && <WorkspaceCards tab={tab} initialId={params.brandId ?? params.categoryId} />}
        </div>
      </div>
    </div>
  );
}

function TabPill({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-g6-pill px-3 py-1.5 font-g6-mono text-g6-xs uppercase tracking-wider transition-colors",
        active
          ? "bg-g6-primary text-g6-text-on-accent"
          : "bg-g6-bg-container/60 text-g6-text-tertiary border border-g6-border-secondary hover:text-g6-text"
      )}
    >
      {active && <span>&gt;</span>}
      {label}
    </a>
  );
}

function ViewSwitcher({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  const opts: { v: ViewMode; Icon: typeof LayoutPanelLeft; t: string }[] = [
    { v: "tree", Icon: LayoutPanelLeft, t: "Tree" },
    { v: "master-detail", Icon: Columns3, t: "Master-detail" },
    { v: "cards", Icon: LayoutGrid, t: "Cards" },
  ];
  return (
    <div className="inline-flex items-center rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container/60 p-0.5">
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
