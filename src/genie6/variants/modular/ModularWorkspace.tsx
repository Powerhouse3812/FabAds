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

const STORAGE_KEY = "genie6-workspace-view-modular";
const DEFAULT_VIEW: ViewMode = "cards";

const TABS: Array<{ slug: AssetTab; label: string; count: number }> = [
  { slug: "brands", label: "brands", count: 7 },
  { slug: "categories", label: "categories", count: 6 },
  { slug: "hooks", label: "hooks", count: 84 },
  { slug: "angles", label: "angles", count: 28 },
  { slug: "concepts", label: "concepts", count: 16 },
  { slug: "templates", label: "templates", count: 12 },
  { slug: "avatars", label: "avatars", count: 9 },
  { slug: "audiences", label: "audiences", count: 24 },
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
 * Modular variant — Assets (formerly Workspace).
 *
 * Composable workbench mental model. Asset class pills + active glass module
 * with code-style header. Brands/Categories support 3-view switching; other
 * asset modules render list views.
 */
export function ModularWorkspace() {
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
    <div className="g6-halo relative flex h-full flex-col p-6">
      <header className="relative z-10 mb-4 flex items-end justify-between">
        <div>
          <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
            <span className="text-g6-primary">&gt;</span> assets.{tab}
          </p>
          <h1 className="text-g6-h2 font-bold tracking-[-0.02em] text-g6-text mt-1">Assets</h1>
        </div>
        <div className="flex items-center gap-2">
          <DemoDataToggle />
          {showViewSwitcher && <ViewSwitcher value={view} onChange={update} />}
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-g6-pill bg-g6-primary px-3 font-g6-mono text-g6-xs font-bold uppercase text-g6-text-on-accent shadow-g6-glow"
          >
            <Plus className="h-3.5 w-3.5" />
            add
          </button>
        </div>
      </header>

      <div className="relative z-10 mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((t, i) => (
          <span key={t.slug} className="inline-flex items-center gap-2">
            <TabPill href={`/iq/genie6/workspace/${t.slug}`} label={t.label} count={t.count} active={tab === t.slug} />
            {i === 1 && <span className="h-4 w-px bg-g6-border" aria-hidden />}
          </span>
        ))}
      </div>

      {/* Single-asset-tab page: drop the inner module-card wrapper. The page-level
          `> assets.{tab}` header above + the active tab pill already establish "you are
          here" — the inner `> {tab}_module · view` was a 4th breadcrumb (P0 fix). The
          view-switcher state (still meaningful for Brands/Categories) moves up to the
          tab strip's right side. */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        {!demoOn && emptyConfig ? (
          <EmptyStateOnboarding {...emptyConfig} />
        ) : tab === "brands" || tab === "categories" ? (
          <>
            {view === "tree" && <WorkspaceTree tab={tab} initialId={params.brandId ?? params.categoryId} />}
            {view === "master-detail" && <WorkspaceMasterDetail tab={tab} initialId={params.brandId ?? params.categoryId} />}
            {view === "cards" && <WorkspaceCards tab={tab} initialId={params.brandId ?? params.categoryId} />}
          </>
        ) : (
          <div className="h-full overflow-y-auto pt-2">
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

function TabPill({ href, label, count, active }: { href: string; label: string; count: number; active: boolean }) {
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
      <span className="font-g6-mono tabular-nums opacity-70">{count}</span>
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
