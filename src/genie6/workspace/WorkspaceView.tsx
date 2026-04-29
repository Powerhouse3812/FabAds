import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { LayoutPanelLeft, Columns3, LayoutGrid, Plus, Building2, Upload, Globe, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceTree } from "./views/WorkspaceTree";
import { WorkspaceMasterDetail } from "./views/WorkspaceMasterDetail";
import { WorkspaceCards } from "./views/WorkspaceCards";
import { DotGridPattern } from "../components/DotGridPattern";

export type WorkspaceViewMode = "tree" | "master-detail" | "cards";

const STORAGE_KEY = "genie6-workspace-view";
const DEFAULT_VIEW: WorkspaceViewMode = "master-detail";

function loadView(): WorkspaceViewMode {
  if (typeof window === "undefined") return DEFAULT_VIEW;
  const saved = window.localStorage.getItem(STORAGE_KEY) as WorkspaceViewMode | null;
  return saved === "tree" || saved === "master-detail" || saved === "cards"
    ? saved
    : DEFAULT_VIEW;
}

/**
 * Workspace orchestrator — switchable between 3 views (Track 4.3).
 *
 *   master-detail (default)  Apple Settings / macOS Finder columns: brand list left,
 *                            click brand → middle column shows children, click child
 *                            → right column shows detail.
 *   tree                     Notion / Figma: collapsible nested tree on left, detail
 *                            pane on right.
 *   cards                    Linear / Krea: brand cards grid, click → side drawer.
 *
 * View toggle: small icon trio in header (right side, near "+ Add"). Persisted to
 * localStorage per user. No prominent button per Maalik's call ("button jyada pop
 * hokr na dikhe").
 *
 * Replaces the old finder-only WorkspaceFinder (which had too many drill steps + same
 * brand appearing in multiple columns when going deeper).
 */
export function WorkspaceView() {
  const params = useParams<{ brandId?: string; categoryId?: string }>();
  const [searchParams] = useSearchParams();
  const tab: "brands" | "categories" = window.location.pathname.includes("/categories")
    ? "categories"
    : "brands";
  const [view, setViewState] = useState<WorkspaceViewMode>(loadView);

  const setView = (next: WorkspaceViewMode) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setViewState(next);
  };

  // Zero-data state — ?empty=1 URL flag (Track 4.9)
  if (searchParams.get("empty") === "1") return <WorkspaceZeroData tab={tab} />;

  return (
    <div className="flex h-full flex-col">
      {/* Header: tab switcher (Brands ↔ Categories) + view switcher + add */}
      <header className="flex flex-shrink-0 items-center gap-3 border-b border-g6-border-secondary px-4 py-2">
        <TabSwitcher tab={tab} />
        <div className="ml-auto flex items-center gap-2">
          <ViewSwitcher value={view} onChange={setView} />
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-g6-base border border-g6-border bg-g6-bg-container px-3 text-g6-sm font-medium text-g6-text-secondary transition-colors hover:border-g6-border hover:text-g6-text"
          >
            <Plus className="h-3.5 w-3.5" />
            Add {tab === "brands" ? "brand" : "category"}
          </button>
        </div>
      </header>

      {/* Active view */}
      <div className="flex-1 overflow-hidden">
        {view === "tree" && <WorkspaceTree tab={tab} initialId={params.brandId ?? params.categoryId} />}
        {view === "master-detail" && (
          <WorkspaceMasterDetail tab={tab} initialId={params.brandId ?? params.categoryId} />
        )}
        {view === "cards" && <WorkspaceCards tab={tab} initialId={params.brandId ?? params.categoryId} />}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Tab switcher (Brands / Categories)
   ───────────────────────────────────────────────────────── */
function TabSwitcher({ tab }: { tab: "brands" | "categories" }) {
  return (
    <nav className="inline-flex items-center gap-1 rounded-g6-pill border border-g6-border-secondary bg-g6-bg-container p-0.5">
      <a
        href="/iq/genie6/workspace/brands"
        className={cn(
          "rounded-g6-pill px-3 py-1 text-g6-sm font-medium transition-colors",
          tab === "brands"
            ? "bg-g6-primary text-g6-text-on-accent"
            : "text-g6-text-secondary hover:text-g6-text"
        )}
      >
        Brands
      </a>
      <a
        href="/iq/genie6/workspace/categories"
        className={cn(
          "rounded-g6-pill px-3 py-1 text-g6-sm font-medium transition-colors",
          tab === "categories"
            ? "bg-g6-primary text-g6-text-on-accent"
            : "text-g6-text-secondary hover:text-g6-text"
        )}
      >
        Categories
      </a>
    </nav>
  );
}

/* ─────────────────────────────────────────────────────────
   View switcher (Tree / Master-detail / Cards) — small icons
   ───────────────────────────────────────────────────────── */
function ViewSwitcher({
  value,
  onChange,
}: {
  value: WorkspaceViewMode;
  onChange: (v: WorkspaceViewMode) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Workspace view"
      className="inline-flex items-center rounded-g6-base border border-g6-border-secondary bg-g6-bg-container p-0.5"
    >
      <ViewBtn
        title="Tree sidebar"
        Icon={LayoutPanelLeft}
        active={value === "tree"}
        onClick={() => onChange("tree")}
      />
      <ViewBtn
        title="Master-detail"
        Icon={Columns3}
        active={value === "master-detail"}
        onClick={() => onChange("master-detail")}
      />
      <ViewBtn
        title="Cards"
        Icon={LayoutGrid}
        active={value === "cards"}
        onClick={() => onChange("cards")}
      />
    </div>
  );
}

function ViewBtn({
  title,
  Icon,
  active,
  onClick,
}: {
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-g6-base transition-colors",
        active
          ? "bg-g6-primary text-g6-text-on-accent"
          : "text-g6-text-tertiary hover:bg-g6-bg-spotlight hover:text-g6-text"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

/** Small index page when no brandId / categoryId in URL. */
export function WorkspaceIndex() {
  // Just render the workspace view itself — it'll show the brand list as the entry.
  return <WorkspaceView />;
}

/* ─────────────────────────────────────────────────────────
   Zero-data state (Track 4.9)
   ───────────────────────────────────────────────────────── */
function WorkspaceZeroData({ tab }: { tab: "brands" | "categories" }) {
  const navigate = useNavigate();
  const label = tab === "brands" ? "brand" : "category";

  return (
    <div className="relative flex min-h-full flex-col">
      <DotGridPattern />
      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center gap-8 px-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-g6-2xl bg-g6-primary-bg">
          <Building2 className="h-7 w-7 text-g6-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="font-g6-sans text-g6-h1 font-black tracking-[-0.025em] text-g6-text">
            No {label}s yet
          </h1>
          <p className="text-g6-base text-g6-text-secondary max-w-md">
            Add your first {label} to start generating ads tuned to its voice, products, and audience.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 w-full">
          <ZeroNudge
            Icon={Globe}
            title="Fetch by URL"
            sub="Paste your brand site"
            cta="Start"
            onClick={() => navigate("/iq/genie6/settings/brands")}
            featured
          />
          <ZeroNudge
            Icon={Upload}
            title="Upload CSV"
            sub="Bulk import"
            cta="Upload"
            onClick={() => navigate("/iq/genie6/settings/brands")}
          />
          <ZeroNudge
            Icon={Sparkles}
            title="Try a demo"
            sub="Mamaearth pre-loaded"
            cta="Try demo"
            onClick={() => navigate("/iq/genie6/workspace/brands")}
          />
        </div>
      </div>
    </div>
  );
}

function ZeroNudge({
  Icon,
  title,
  sub,
  cta,
  onClick,
  featured,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub: string;
  cta: string;
  onClick: () => void;
  featured?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "g6-lift flex flex-col items-start gap-2 rounded-g6-xl border bg-g6-bg-container p-4 text-left",
        featured ? "border-g6-primary-border shadow-g6-md" : "border-g6-border-secondary"
      )}
    >
      <Icon className="h-4 w-4 text-g6-text-secondary" />
      <span className="text-g6-base font-bold text-g6-text">{title}</span>
      <span className="text-g6-xs text-g6-text-tertiary">{sub}</span>
      <span className="mt-1 inline-flex items-center gap-1 text-g6-sm font-medium text-g6-primary">
        {cta} →
      </span>
    </button>
  );
}
