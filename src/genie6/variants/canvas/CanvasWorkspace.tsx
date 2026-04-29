import { useState } from "react";
import { useParams } from "react-router-dom";
import { LayoutPanelLeft, Columns3, LayoutGrid, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceTree } from "../../workspace/views/WorkspaceTree";
import { WorkspaceMasterDetail } from "../../workspace/views/WorkspaceMasterDetail";
import { WorkspaceCards } from "../../workspace/views/WorkspaceCards";
import { HooksTab } from "../../library/tabs/HooksTab";
import { AnglesTab } from "../../library/tabs/AnglesTab";
import { ConceptsTab } from "../../library/tabs/ConceptsTab";
import { TemplatesTab } from "../../library/tabs/TemplatesTab";
import { AvatarsTab } from "../../library/tabs/AvatarsTab";
import { AudiencesTab } from "../../library/tabs/AudiencesTab";
import { EmptyStateOnboarding } from "../../components/EmptyStateOnboarding";
import { EMPTY_CONFIGS } from "../../components/emptyStateConfigs";
import { DemoDataToggle } from "../../components/DemoDataToggle";
import { useDemoData } from "../../hooks/useDemoData";

type ViewMode = "tree" | "master-detail" | "cards";
type AssetTab = "brands" | "categories" | "hooks" | "angles" | "concepts" | "templates" | "avatars" | "audiences";

const STORAGE_KEY = "genie6-workspace-view-canvas";
const DEFAULT_VIEW: ViewMode = "cards";

const TABS: Array<{ slug: AssetTab; label: string }> = [
  { slug: "brands", label: "Brands" },
  { slug: "categories", label: "Categories" },
  { slug: "hooks", label: "Hooks" },
  { slug: "angles", label: "Angles" },
  { slug: "concepts", label: "Concepts" },
  { slug: "templates", label: "Templates" },
  { slug: "avatars", label: "Avatars" },
  { slug: "audiences", label: "Audiences" },
];

function loadView(): ViewMode {
  if (typeof window === "undefined") return DEFAULT_VIEW;
  const saved = window.localStorage.getItem(STORAGE_KEY) as ViewMode | null;
  return saved === "tree" || saved === "master-detail" || saved === "cards" ? saved : DEFAULT_VIEW;
}

function detectTab(pathname: string): AssetTab {
  for (const t of TABS) if (pathname.includes(`/workspace/${t.slug}`)) return t.slug;
  return "brands";
}

const NEEDS_HIERARCHY: AssetTab[] = ["brands", "categories"];

/**
 * Canvas variant — Assets (formerly Workspace).
 *
 * Editor-style chrome with grid floor + floating tab strip. Brands/Categories
 * default to Cards view; other asset tabs render simpler list views.
 */
export function CanvasWorkspace() {
  const params = useParams<{ brandId?: string; categoryId?: string }>();
  const tab = detectTab(typeof window !== "undefined" ? window.location.pathname : "");
  const [view, setView] = useState<ViewMode>(loadView);
  const [search, setSearch] = useState("");
  const { on: demoOn } = useDemoData();

  const update = (next: ViewMode) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setView(next);
  };

  const showViewSwitcher = NEEDS_HIERARCHY.includes(tab);
  const emptyConfig = EMPTY_CONFIGS[tab];

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="absolute inset-0 g6-canvas-floor opacity-40 pointer-events-none" />

      <header className="relative z-10 flex flex-shrink-0 items-center gap-3 border-b border-g6-border-secondary bg-g6-bg-base/80 backdrop-blur-md px-5 py-3">
        <span className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
          canvas · assets
        </span>
        <TabPills tab={tab} />
        <div className="ml-auto flex items-center gap-2">
          <DemoDataToggle />
          {showViewSwitcher && <ViewSwitcher value={view} onChange={update} />}
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-g6-pill bg-g6-primary px-3 text-g6-sm font-bold text-g6-text-on-accent shadow-g6-glow"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </button>
        </div>
      </header>

      <div className="relative z-10 flex-1 overflow-hidden">
        {!demoOn && emptyConfig ? (
          <EmptyStateOnboarding {...emptyConfig} />
        ) : tab === "brands" || tab === "categories" ? (
          <>
            {view === "tree" && <WorkspaceTree tab={tab} initialId={params.brandId ?? params.categoryId} />}
            {view === "master-detail" && <WorkspaceMasterDetail tab={tab} initialId={params.brandId ?? params.categoryId} />}
            {view === "cards" && <WorkspaceCards tab={tab} initialId={params.brandId ?? params.categoryId} />}
          </>
        ) : (
          <div className="h-full overflow-y-auto px-5 py-5">
            {tab === "hooks" && <HooksTab brandFilter="all" search={search} />}
            {tab === "angles" && <AnglesTab search={search} />}
            {tab === "concepts" && <ConceptsTab brandFilter="all" search={search} />}
            {tab === "templates" && <TemplatesTab />}
            {tab === "avatars" && <AvatarsTab search={search} />}
            {tab === "audiences" && <AudiencesTab brandFilter="all" search={search} />}
          </div>
        )}
      </div>
    </div>
  );
}

function TabPills({ tab }: { tab: AssetTab }) {
  return (
    <nav className="inline-flex items-center gap-1 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container/80 backdrop-blur-md p-0.5 overflow-x-auto">
      {TABS.map((t, i) => (
        <span key={t.slug} className="inline-flex items-center">
          <a
            href={`/iq/genie6/workspace/${t.slug}`}
            className={cn(
              "rounded-g6-pill px-3 py-1 text-g6-xs font-medium transition-colors whitespace-nowrap",
              tab === t.slug ? "bg-g6-primary text-g6-text-on-accent" : "text-g6-text-secondary hover:text-g6-text"
            )}
          >
            {t.label}
          </a>
          {i === 1 && <span className="mx-1 h-4 w-px bg-g6-border" aria-hidden />}
        </span>
      ))}
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
