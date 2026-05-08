import { useState } from "react";
import { useParams } from "react-router-dom";
import { LayoutPanelLeft, Columns3, LayoutGrid, Plus, FolderTree } from "lucide-react";
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

const STORAGE_KEY = "genie6-workspace-view-studio";
const DEFAULT_VIEW: ViewMode = "master-detail";

const TABS: Array<{ slug: AssetTab; label: string; count: number }> = [
  { slug: "brands", label: "Brands", count: 7 },
  { slug: "categories", label: "Categories", count: 6 },
  { slug: "hooks", label: "Hooks", count: 84 },
  { slug: "angles", label: "Angles", count: 28 },
  { slug: "concepts", label: "Concepts", count: 16 },
  { slug: "templates", label: "Templates", count: 12 },
  { slug: "avatars", label: "Avatars", count: 9 },
  { slug: "audiences", label: "Audiences", count: 24 },
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
 * Studio variant — Assets (formerly Workspace).
 *
 * 3-column workspace mental model. Tabs across the top for all asset classes
 * (Brands · Categories · Hooks · Angles · Concepts · Templates · Avatars ·
 * Audiences). Brands/Categories support 3-view switching (Tree/Master-detail/
 * Cards); other asset tabs render simpler list views from the existing Library
 * tab components.
 */
export function StudioWorkspace() {
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
    <div className="v3-page-mesh flex h-full flex-col p-3">
      <div className="v3-glass flex flex-1 flex-col overflow-hidden rounded-g6-card">
        <header className="flex flex-shrink-0 items-center gap-3 border-b border-g6-border-secondary bg-g6-bg-base px-4 py-2.5">
          <div className="flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-g6-primary" />
            <h1 className="text-g6-base font-semibold text-g6-text">Assets</h1>
          </div>
          <TabPills tab={tab} />
          <div className="ml-auto flex items-center gap-2">
            <DemoDataToggle />
            {showViewSwitcher && <ViewSwitcher value={view} onChange={update} />}
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-g6-base bg-g6-primary px-3 text-g6-sm font-bold text-g6-text-on-accent"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-hidden">
          {!demoOn && emptyConfig ? (
            <EmptyStateOnboarding {...emptyConfig} />
          ) : tab === "brands" || tab === "categories" ? (
            <>
              {view === "tree" && <WorkspaceTree tab={tab} initialId={params.brandId ?? params.categoryId} />}
              {view === "master-detail" && <WorkspaceMasterDetail tab={tab} initialId={params.brandId ?? params.categoryId} />}
              {view === "cards" && <WorkspaceCards tab={tab} initialId={params.brandId ?? params.categoryId} />}
            </>
          ) : (
            <div className="h-full overflow-y-auto px-5 py-4">
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
    </div>
  );
}

function TabPills({ tab }: { tab: AssetTab }) {
  return (
    <nav className="inline-flex items-center gap-1 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container p-0.5 overflow-x-auto">
      {TABS.map((t, i) => (
        <span key={t.slug} className="inline-flex items-center">
          <a
            href={`/iq/genie6/workspace/${t.slug}`}
            className={cn(
              "rounded-g6-pill px-3 py-1 text-g6-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap",
              tab === t.slug
                ? "bg-g6-primary text-g6-text-on-accent"
                : "text-g6-text-secondary hover:text-g6-text"
            )}
          >
            {t.label}
            <span className={cn(
              "font-g6-mono tabular-nums",
              tab === t.slug ? "text-g6-text-on-accent/70" : "text-g6-text-tertiary"
            )}>{t.count}</span>
          </a>
          {/* Divider after Categories — separates hierarchical (Brands/Categories) from flat-list assets */}
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
    <div className="inline-flex items-center rounded-g6-base border border-g6-border-secondary bg-g6-bg-container p-0.5">
      {opts.map(({ v, Icon, t }) => (
        <button
          key={v}
          type="button"
          title={t}
          onClick={() => onChange(v)}
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-g6-base transition-colors",
            value === v ? "bg-g6-primary text-g6-text-on-accent" : "text-g6-text-tertiary hover:bg-g6-bg-spotlight hover:text-g6-text"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
