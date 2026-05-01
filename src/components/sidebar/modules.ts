import {
  LayoutDashboard, BarChart3, Rocket, Telescope, ImageIcon, Shield,
  Wand2, Zap, Video, MessageSquare,
  History, Target, Compass, Map, Settings,
  Film, Search, Globe,
  Home, Library as LibraryIcon, FolderTree,
  Bookmark, Copy, Tag, Building2, Package, Boxes,
  Wrench, Workflow, Eraser, Scissors,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface SubItem {
  label: string;
  path: string;
  icon?: React.ElementType;
  /** Optional small chip after the label, e.g. "Soon" */
  badge?: string;
  /** Optional 2nd-level nested sub-items (used by IQ → Genie 5.0 group) */
  subItems?: SubItem[];
}

export interface SectionGroup {
  sectionLabel: string;
  items: SubItem[];
}

export interface ModuleDef {
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

/** Shell-level functional groups used by the "Sections" nav variant. */
export type ModuleGroup = "RUN" | "DISCOVER" | "CREATE" | "AUTOMATE";

/* ------------------------------------------------------------------ */
/*  Module configuration                                               */
/* ------------------------------------------------------------------ */
export const MODULES: ModuleDef[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  {
    key: "reports", label: "Reports", icon: BarChart3,
    subItems: [
      { label: "Facebook", path: "/reports/fb", icon: Globe },
      { label: "NB", path: "/reports/nb", icon: BarChart3 },
      { label: "TikTok", path: "/reports/tt", icon: Video },
      { label: "Creative Reporting", path: "/reports/creative", icon: Film },
    ],
  },
  {
    key: "launch", label: "Launch", icon: Rocket,
    subItems: [
      { label: "Launches", path: "/launch", icon: History },
      { label: "Targeting Template", path: "/launch/templates", icon: Target },
      { label: "AutoPilot", path: "/launch/autopilot", icon: Zap },
      { label: "Clones", path: "/launch/clones", icon: Copy },
      { label: "RRM", path: "/rrm", icon: Shield },
    ],
  },
  {
    key: "insights", label: "Industry Insights", icon: Telescope,
    subItems: [
      { label: "Discover", path: "/insights/discover", icon: Compass },
      { label: "Intelligence", path: "/insights/intelligence", icon: Search },
      { label: "Boards", path: "/insights/boards", icon: Map },
      { label: "Competitors", path: "/insights/competitors", icon: Globe },
      { label: "Saved Ads", path: "/insights/saved", icon: Bookmark },
    ],
  },
  {
    key: "genie", label: "Genie", icon: Wand2,
    subItems: [
      // Nav iter-4 IA (2026-05-01):
      //   Dashboard → Overview, Library (Assets) → Studio, Generations kept
      //   Tour removed from nav → CTA card on Overview page
      //   Settings back in Genie sub-nav
      { label: "Overview", path: "/iq/genie6", icon: Home },
      { label: "Generations", path: "/iq/genie6/library", icon: LibraryIcon },
      { label: "Studio", path: "/iq/genie6/workspace", icon: FolderTree },
      { label: "Settings", path: "/iq/genie6/settings", icon: Settings },
    ],
  },
  {
    key: "catalogue", label: "Catalogue", icon: Boxes,
    subItems: [
      { label: "Category", path: "/catalogue/categories", icon: Tag },
      { label: "Brands", path: "/catalogue/brands", icon: Building2 },
      { label: "Product", path: "/catalogue/products", icon: Package },
    ],
  },
  { key: "creative-library", label: "Creative Library", icon: ImageIcon, path: "/iq/creative-library" },
  { key: "automation", label: "Automation", icon: Workflow, path: "/automation", comingSoon: true },
  {
    key: "tools", label: "Tools", icon: Wrench,
    subItems: [
      { label: "Video Sage", path: "/iq/video-sage", icon: Video },
      { label: "Copilot", path: "/iq/copilot", icon: MessageSquare },
      { label: "BG Remover", path: "/tools/bg-remover", icon: Eraser, badge: "Soon" },
      { label: "Object Remover", path: "/tools/obj-remover", icon: Scissors, badge: "Soon" },
    ],
  },
];

// System modules moved to Profile popover (UserMenu). Rail is clean.
export const SYSTEM_MODULES: ModuleDef[] = [];

/* ------------------------------------------------------------------ */
/*  Functional grouping (Sections variant only — Rail variant ignores) */
/* ------------------------------------------------------------------ */
/**
 * Module key → group label. Used by the "Sections" nav variant to render
 * thin separators + small caps group headers between functional clusters.
 *
 * Locked 2026-05-01:
 *   RUN       — operate the business (perf data + activation)
 *   DISCOVER  — research surface
 *   CREATE    — content / asset / brand authoring
 *   AUTOMATE  — system utilities + power tools
 *
 * Order of groups matches MODULES order; modules within a group preserve
 * their MODULES order as well.
 */
export const MODULE_GROUPS: Record<string, ModuleGroup> = {
  dashboard: "RUN",
  reports: "RUN",
  launch: "RUN",
  insights: "DISCOVER",
  genie: "CREATE",
  catalogue: "CREATE",
  "creative-library": "CREATE",
  automation: "AUTOMATE",
  tools: "AUTOMATE",
};

export const GROUP_ORDER: ModuleGroup[] = ["RUN", "DISCOVER", "CREATE", "AUTOMATE"];

/** Returns modules grouped by their functional cluster, preserving order. */
export function groupedModules(): { group: ModuleGroup; modules: ModuleDef[] }[] {
  return GROUP_ORDER.map((group) => ({
    group,
    modules: MODULES.filter((m) => MODULE_GROUPS[m.key] === group),
  }));
}

/* ------------------------------------------------------------------ */
/*  Helpers (shared by Rail + Sections variants)                       */
/* ------------------------------------------------------------------ */
export function hasSubItems(m: ModuleDef): boolean {
  return !!(m.subItems?.length || m.sections?.length);
}

export function allSubPaths(m: ModuleDef): string[] {
  if (m.subItems) {
    // Flatten 2nd-level nested children too (e.g., IQ → Genie 5.0 → 7 children)
    return m.subItems.flatMap((s) =>
      s.subItems && s.subItems.length > 0
        ? [s.path, ...s.subItems.map((c) => c.path)]
        : [s.path]
    );
  }
  if (m.sections) return m.sections.flatMap((g) => g.items.map((s) => s.path));
  return [];
}

export function firstSubPath(m: ModuleDef): string {
  if (m.subItems?.length) return m.subItems[0].path;
  if (m.sections?.length) return m.sections[0].items[0].path;
  return m.path ?? "/";
}

export function deriveActiveModule(pathname: string): string | null {
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

export function isSubItemActive(itemPath: string, pathname: string, allPaths: string[] = []): boolean {
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
