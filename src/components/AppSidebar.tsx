import { useRef, useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  LayoutDashboard, BarChart3, Rocket, Telescope, ImageIcon, Shield, Brain,
  Plug, Users, FileText, Moon, Sun, ChevronLeft, Menu,
  Wand2, Sparkles, Zap, Bot, Video, MessageSquare,
  History, Target, Compass, Map, FolderOpen, Settings, Link2,
  TrendingUp, PieChart, Film, Layers, Search, Globe, UserPlus,
  Home, Library as LibraryIcon, PenLine, FolderTree,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { InsightsBoardListPanel } from "@/components/insights/InsightsBoardListPanel";
import faviconLight from "@/assets/favicon-light.svg";
import faviconDark from "@/assets/favicon-dark.png";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface SubItem {
  label: string;
  path: string;
  icon?: React.ElementType;
}

interface SectionGroup {
  sectionLabel: string;
  items: SubItem[];
}

interface ModuleDef {
  key: string;
  label: string;
  icon: React.ElementType;
  /** Direct route for modules without sub-items */
  path?: string;
  /** Flat sub-items (no grouping) */
  subItems?: SubItem[];
  /** Grouped sub-items (e.g. Reports) */
  sections?: SectionGroup[];
  comingSoon?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Module configuration                                               */
/* ------------------------------------------------------------------ */
const MODULES: ModuleDef[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  {
    key: "reports", label: "Reports", icon: BarChart3,
    sections: [
      {
        sectionLabel: "Performance",
        items: [
          { label: "Ad Accounts", path: "/reports/performance/ad-accounts", icon: PieChart },
          { label: "Campaigns", path: "/reports/performance/campaigns", icon: TrendingUp },
          { label: "Ad Sets", path: "/reports/performance/ad-sets", icon: Layers },
          { label: "Ads", path: "/reports/performance/ads", icon: ImageIcon },
        ],
      },
      {
        sectionLabel: "Creative",
        items: [
          { label: "Image Report", path: "/reports/creative/image", icon: ImageIcon },
          { label: "Video Report", path: "/reports/creative/video", icon: Film },
          { label: "Ad Group Report", path: "/reports/creative/ad-groups", icon: FolderOpen },
        ],
      },
    ],
  },
  {
    key: "launch", label: "Launch", icon: Rocket,
    subItems: [
      { label: "History", path: "/launch", icon: History },
      { label: "AutoPilot", path: "/launch/autopilot", icon: Zap },
      { label: "Targeting Templates", path: "/launch/templates", icon: Target },
      { label: "Campaign URLs", path: "/launch/campaign-urls", icon: Link2 },
    ],
  },
  {
    key: "insights", label: "Industry Insights", icon: Telescope,
    subItems: [
      { label: "Intelligence", path: "/insights/intelligence", icon: Search },
      { label: "Discover", path: "/insights/discover", icon: Compass },
      { label: "Boards", path: "/insights/boards", icon: Map },
      { label: "Competitors", path: "/insights/competitors", icon: Globe },
    ],
  },
  { key: "creative-library", label: "Creative Library", icon: ImageIcon, path: "/iq/creative-library" },
  {
    key: "genie6", label: "Genie 6.0", icon: Wand2,
    subItems: [
      { label: "Home", path: "/iq/genie6", icon: Home },
      { label: "Workspace", path: "/iq/genie6/workspace", icon: FolderTree },
      { label: "Generate", path: "/iq/genie6/generate", icon: PenLine },
      { label: "Library", path: "/iq/genie6/library", icon: LibraryIcon },
      { label: "Settings", path: "/iq/genie6/settings", icon: Settings },
      { label: "Wizard / Tour", path: "/iq/genie6/wizard", icon: Sparkles },
    ],
  },
  {
    key: "genie5", label: "Genie 5.0", icon: Sparkles,
    subItems: [
      { label: "New Generation", path: "/iq/genie5", icon: Sparkles },
      { label: "Studio", path: "/iq/genie5/studio", icon: Layers },
      { label: "Templates", path: "/iq/genie5/templates", icon: FileText },
      { label: "Brands", path: "/iq/genie5/brands", icon: ImageIcon },
      { label: "Categories", path: "/iq/genie5/categories", icon: FolderOpen },
      { label: "Quick Start", path: "/iq/genie5/quick-start", icon: Zap },
      { label: "AI Setup", path: "/iq/genie5/ai-setup", icon: Sparkles },
    ],
  },
  {
    key: "iq", label: "IQ", icon: Brain,
    subItems: [
      { label: "Genie", path: "/iq/genie", icon: Wand2 },
      { label: "Genie 2.0", path: "/iq/genie2", icon: Sparkles },
      { label: "Genie 3.0", path: "/iq/genie3", icon: Zap },
      { label: "Genie 4.0", path: "/iq/genie4", icon: Bot },
      { label: "Genie 5.0", path: "/iq/genie5", icon: Sparkles },
      { label: "Video Sage", path: "/iq/video-sage", icon: Video },
      { label: "Copilot", path: "/iq/copilot", icon: MessageSquare },
    ],
  },
  {
    key: "rrm", label: "RRM", icon: Shield,
    subItems: [
      { label: "Ad Accounts", path: "/rrm", icon: Shield },
      { label: "Settings", path: "/rrm/settings", icon: Settings },
      { label: "Integrations", path: "/integrations", icon: Plug },
    ],
  },
];

const SYSTEM_MODULES: ModuleDef[] = [
  { key: "integrations", label: "Integrations", icon: Plug, path: "/integrations" },
  { key: "team", label: "Team", icon: Users, path: "/ums" },
  { key: "clients", label: "Clients", icon: UserPlus, path: "/settings/clients" },
  { key: "activity-logs", label: "Activity Logs", icon: FileText, path: "/activity-logs" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function hasSubItems(m: ModuleDef): boolean {
  return !!(m.subItems?.length || m.sections?.length);
}

function allSubPaths(m: ModuleDef): string[] {
  if (m.subItems) return m.subItems.map((s) => s.path);
  if (m.sections) return m.sections.flatMap((g) => g.items.map((s) => s.path));
  return [];
}

function firstSubPath(m: ModuleDef): string {
  if (m.subItems?.length) return m.subItems[0].path;
  if (m.sections?.length) return m.sections[0].items[0].path;
  return m.path ?? "/";
}

function deriveActiveModule(pathname: string): string | null {
  // Order matters — check sub-path modules first
  for (const m of [...MODULES, ...SYSTEM_MODULES]) {
    if (m.path && pathname === m.path) return m.key;
    for (const p of allSubPaths(m)) {
      if (pathname === p || pathname.startsWith(p + "/")) return m.key;
    }
    // prefix match for direct-path modules that may have deeper paths
    if (m.path && pathname.startsWith(m.path + "/")) return m.key;
  }
  // Special: /integrations could be RRM or system integrations – prefer system
  if (pathname === "/integrations") return "integrations";
  return null;
}

function isSubItemActive(itemPath: string, pathname: string, allPaths: string[] = []): boolean {
  if (itemPath === pathname) return true;
  // Only allow prefix match if no other sibling path is a better (longer) match
  if (pathname.startsWith(itemPath + "/")) {
    // Check if another sibling sub-item is a more specific match
    const hasBetterMatch = allPaths.some(
      (p) => p !== itemPath && p.length > itemPath.length && (pathname === p || pathname.startsWith(p + "/"))
    );
    return !hasBetterMatch;
  }
  return false;
}

/* ------------------------------------------------------------------ */
/*  Dark Mode Toggle                                                   */
/* ------------------------------------------------------------------ */
function DarkModeToggleExpanded() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <div className="flex items-center gap-2 text-sidebar-foreground">
        {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        <span className="text-sm">Dark Mode</span>
      </div>
      <Switch checked={isDark} onCheckedChange={(c) => setTheme(c ? "dark" : "light")} />
    </div>
  );
}

function DarkModeToggleIcon() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="relative flex items-center justify-center w-10 h-10 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-primary transition-colors"
        >
          <Sun className={cn(
            "h-5 w-5 absolute transition-all duration-300 ease-in-out",
            isDark ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
          )} />
          <Moon className={cn(
            "h-5 w-5 absolute transition-all duration-300 ease-in-out",
            isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
          )} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {isDark ? "Light Mode" : "Dark Mode"}
      </TooltipContent>
    </Tooltip>
  );
}

/* ------------------------------------------------------------------ */
/*  Rail Icon                                                          */
/* ------------------------------------------------------------------ */
function RailIcon({
  mod,
  isActive,
  onClick,
  pathname,
  onNavigate,
  isPanelOpen,
}: {
  mod: ModuleDef;
  isActive: boolean;
  onClick: () => void;
  pathname: string;
  onNavigate: (path: string) => void;
  isPanelOpen: boolean;
}) {
  const Icon = mod.icon;
  const showHoverMenu = hasSubItems(mod) && !isPanelOpen;

  const iconButton = (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:scale-105"
      )}
    >
      <Icon className="h-5 w-5" />
      {mod.comingSoon && (
        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
      )}
    </button>
  );

  if (showHoverMenu) {
    const siblingPaths = allSubPaths(mod);
    return (
      <HoverCard openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>{iconButton}</HoverCardTrigger>
        <HoverCardContent side="right" align="start" sideOffset={8} className="w-52 p-0">
          <div className="px-3 py-2 border-b border-border">
            <span className="text-sm font-semibold text-foreground">{mod.label}</span>
          </div>
          <div className="flex flex-col gap-0.5 p-1.5">
            {mod.subItems?.map((item) => {
              const SubIcon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2",
                    isSubItemActive(item.path, pathname, siblingPaths)
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  {SubIcon && <SubIcon className="h-3.5 w-3.5 shrink-0" />}
                  {item.label}
                </button>
              );
            })}
            {mod.sections?.map((section) => (
              <div key={section.sectionLabel} className="mt-1.5 first:mt-0">
                <span className="block px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.sectionLabel}
                </span>
                {section.items.map((item) => {
                  const SubIcon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => onNavigate(item.path)}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2",
                        isSubItemActive(item.path, pathname, siblingPaths)
                          ? "bg-accent text-accent-foreground font-medium"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      )}
                    >
                      {SubIcon && <SubIcon className="h-3.5 w-3.5 shrink-0" />}
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>{iconButton}</TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {mod.label}
      </TooltipContent>
    </Tooltip>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-Panel                                                          */
/* ------------------------------------------------------------------ */
function SubPanel({
  mod,
  pathname,
  onClose,
  onNavigate,
}: {
  mod: ModuleDef;
  pathname: string;
  onClose: () => void;
  onNavigate: (path: string) => void;
}) {
  const siblingPaths = allSubPaths(mod);
  const renderItem = (item: SubItem) => {
    const ItemIcon = item.icon;
    return (
      <button
        key={item.path}
        onClick={() => onNavigate(item.path)}
        className={cn(
          "w-full text-left px-3 py-1.5 rounded-md text-sm transition-all duration-150 flex items-center gap-2",
          isSubItemActive(item.path, pathname, siblingPaths)
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )}
      >
        {ItemIcon && <ItemIcon className="h-3.5 w-3.5 shrink-0" />}
        {item.label}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header: module name + collapse */}
      <div className="flex items-center justify-between px-3 py-3">
        <span className="text-sm font-semibold text-sidebar-foreground flex items-center gap-2">
          <mod.icon className="h-4 w-4" />
          {mod.label}
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="px-2">
        <div className="flex flex-col gap-1">
          {mod.subItems?.map(renderItem)}
          {mod.sections?.map((section) => (
            <div key={section.sectionLabel} className="mt-2 first:mt-0">
              <span className="block px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.sectionLabel}
              </span>
              {section.items.map(renderItem)}
            </div>
          ))}
        </div>
      </div>

      {/* Insights module: board list below nav links */}
      {mod.key === "insights" && (
        <>
          <div className="mx-3 my-2 border-t border-sidebar-border" />
          <InsightsBoardListPanel />
        </>
      )}

    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile Nav (Sheet Content)                                         */
/* ------------------------------------------------------------------ */
export function MobileNavContent({ onClose }: { onClose: () => void }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  const renderModule = (mod: ModuleDef) => {
    const active = deriveActiveModule(pathname) === mod.key;
    if (!hasSubItems(mod)) {
      return (
        <button
          key={mod.key}
          onClick={() => go(mod.path!)}
          className={cn(
            "w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2",
            active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/80"
          )}
        >
          <mod.icon className="h-4 w-4" />
          {mod.label}
          {mod.comingSoon && (
            <span className="ml-auto text-[10px] text-muted-foreground border border-sidebar-border rounded px-1">Soon</span>
          )}
        </button>
      );
    }

    return (
      <div key={mod.key}>
        <div className="px-3 py-2 text-sm font-medium text-sidebar-foreground flex items-center gap-2">
          <mod.icon className="h-4 w-4" />
          {mod.label}
          {mod.comingSoon && (
            <span className="ml-auto text-[10px] text-muted-foreground border border-sidebar-border rounded px-1">Soon</span>
          )}
        </div>
        <div className="ml-6 flex flex-col gap-0.5">
          {mod.subItems?.map((item) => {
            const siblings = allSubPaths(mod);
            return (
            <button
              key={item.path}
              onClick={() => go(item.path)}
              className={cn(
                "w-full text-left px-3 py-1.5 rounded-md text-sm",
                isSubItemActive(item.path, pathname, siblings)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70"
              )}
            >
              {item.label}
            </button>
          );})}
          {mod.sections?.map((section) => (
            <div key={section.sectionLabel} className="mt-1">
              <span className="block px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.sectionLabel}
              </span>
              {section.items.map((item) => {
                const siblings = allSubPaths(mod);
                return (
                <button
                  key={item.path}
                  onClick={() => go(item.path)}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded-md text-sm",
                    isSubItemActive(item.path, pathname, siblings)
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/70"
                  )}
                >
                  {item.label}
                </button>
              );})}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 py-2">
          {MODULES.map(renderModule)}
          <div className="border-t border-sidebar-border my-2" />
          {SYSTEM_MODULES.map(renderModule)}
        </div>
      </ScrollArea>
      <div className="border-t border-sidebar-border">
        <DarkModeToggleExpanded />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Sidebar Component                                             */
/* ------------------------------------------------------------------ */
export function AppSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const logo = isDark ? faviconDark : faviconLight;

  // Last-visited per module
  const lastVisited = useRef<Record<string, string>>({});

  // Which module's panel is showing (null = no panel)
  const [openModule, setOpenModule] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  const activeKey = deriveActiveModule(pathname);

  // Update last-visited whenever pathname changes
  useEffect(() => {
    if (activeKey) {
      const mod = [...MODULES, ...SYSTEM_MODULES].find((m) => m.key === activeKey);
      if (mod && hasSubItems(mod)) {
        lastVisited.current[activeKey] = pathname;
      }
    }
  }, [pathname, activeKey]);

  // On mount / route change: ensure the correct module panel is shown
  useEffect(() => {
    if (activeKey) {
      const mod = [...MODULES, ...SYSTEM_MODULES].find((m) => m.key === activeKey);
      if (mod && hasSubItems(mod)) {
        setOpenModule(activeKey);
        setIsPanelOpen(true);
      } else {
        setOpenModule(null);
        setIsPanelOpen(false);
      }
    }
  }, [activeKey]);

  const handleRailClick = useCallback(
    (mod: ModuleDef) => {
      if (!hasSubItems(mod)) {
        // Direct nav, close panel
        navigate(mod.path!);
        setOpenModule(null);
        setIsPanelOpen(false);
        return;
      }

      if (openModule === mod.key) {
        // Same module — toggle panel
        setIsPanelOpen((prev) => !prev);
      } else {
        // Different module — open panel, navigate to last-visited or first
        const target = lastVisited.current[mod.key] || firstSubPath(mod);
        setOpenModule(mod.key);
        setIsPanelOpen(true);
        navigate(target);
      }
    },
    [openModule, navigate]
  );

  const handleSubNavigate = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate]
  );

  // Navigate from hover popover: go to page + open the sub-panel for the module
  const handleHoverNavigate = useCallback(
    (path: string) => {
      navigate(path);
      // Derive which module this path belongs to and open its panel
      for (const m of [...MODULES, ...SYSTEM_MODULES]) {
        const paths = allSubPaths(m);
        if (paths.some((p) => path === p || path.startsWith(p + "/"))) {
          setOpenModule(m.key);
          setIsPanelOpen(true);
          break;
        }
      }
    },
    [navigate]
  );

  const openMod = openModule
    ? [...MODULES, ...SYSTEM_MODULES].find((m) => m.key === openModule)
    : null;

  const showPanel = isPanelOpen && openMod && hasSubItems(openMod);

  return (
    <div className="hidden md:flex h-screen flex-shrink-0">
      {/* Icon Rail */}
      <div className="flex flex-col items-center w-[60px] bg-sidebar border-r border-sidebar-border py-3 gap-0.5">
        {/* Logo */}
        <Link to="/dashboard" className="mb-3 flex items-center justify-center">
          <img src={isDark ? faviconDark : faviconLight} alt="FabAds" className="h-7 w-7" />
        </Link>

        {/* Main modules */}
        <div className="flex flex-col items-center gap-1 flex-1">
          {MODULES.map((mod) => (
            <RailIcon
              key={mod.key}
              mod={mod}
              isActive={activeKey === mod.key}
              onClick={() => handleRailClick(mod)}
              pathname={pathname}
              onNavigate={handleHoverNavigate}
              isPanelOpen={isPanelOpen && openModule === mod.key}
            />
          ))}

          {/* Separator */}
          <div className="w-6 border-t border-sidebar-border my-2" />

          {/* System modules */}
          {SYSTEM_MODULES.map((mod) => (
            <RailIcon
              key={mod.key}
              mod={mod}
              isActive={activeKey === mod.key}
              onClick={() => handleRailClick(mod)}
              pathname={pathname}
              onNavigate={handleHoverNavigate}
              isPanelOpen={isPanelOpen && openModule === mod.key}
            />
          ))}
        </div>

        {/* Dark mode toggle at bottom of rail */}
        <div className="mt-auto">
          <DarkModeToggleIcon />
        </div>
      </div>

      {/* Sub-nav Panel */}
      <div
        className={cn(
          "bg-sidebar border-r border-sidebar-border overflow-hidden transition-all duration-200",
          showPanel ? "w-[200px]" : "w-0"
        )}
      >
        {showPanel && openMod && (
          <SubPanel
            mod={openMod}
            pathname={pathname}
            onClose={() => setIsPanelOpen(false)}
            onNavigate={handleSubNavigate}
          />
        )}
      </div>
    </div>
  );
}
