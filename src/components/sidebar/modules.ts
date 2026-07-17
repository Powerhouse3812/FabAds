import {
  LayoutDashboard, BarChart3, Telescope, ImageIcon, Shield,
  Wand2, Zap, Video, MessageSquare,
  History, Target, Map, Settings,
  Film, Search, Globe,
  Home, Library as LibraryIcon, FolderTree,
  Bookmark, Copy, Tag, Building2, Package, Boxes,
  Workflow, Eraser, Scissors,
  Lightbulb,
  Sparkles, Receipt,
  Compass, Eye, Layers, Rss,
  Plus,
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
  /**
   * A-11.15: visually de-emphasize this item — render with reduced opacity
   * + smaller weight so users don't focus on it. Used for legacy / archive
   * entries. The renderer also inserts a divider before the first
   * deprioritized item in a flat sub-items list.
   */
  deprioritized?: boolean;
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
  /** Optional small chip rendered on the parent rail item (e.g. "Temp", "Beta") */
  badge?: string;
  /**
   * Plans this module is visible under. Omit/undefined → visible on both
   * "full" and "ai" plans. Set to ["full"] to hide on AI plan
   * (Reports / Launch / Automation — the ad-ops surfaces). AI plan
   * focuses on AI generation + research + tools.
   */
  plans?: ("full" | "ai")[];
}

/** Shell-level functional groups used by the nav. */
export type ModuleGroup = "RUN" | "CREATE" | "TOOLS";

/* ------------------------------------------------------------------ */
/*  Module configuration                                               */
/* ------------------------------------------------------------------ *
 *  IA — locked iter-6 A-5 (2026-05-01):
 *
 *  RUN
 *    Dashboard
 *    Reports             (FB / NB / TT / Creative Reporting)
 *    Industry Insights   (Discover / Intelligence / Boards / Competitors / Saved)
 *    Launch              (Launches / Targeting Template / AutoPilot / Clones / RRM)
 *    Automation          (no Soon badge — first-class run-the-business surface)
 *
 *  CREATE
 *    Genie               (Overview / Library / Studio / Settings — plus inline
 *                          New-Gen CTA when active. Genie variant toggle now
 *                          lives as a small icon next to the Genie label, not
 *                          as a pill in sub-menu.)
 *    Catalogue           (Category / Brands / Product)
 *    Creative Library
 *
 *  TOOLS                 — top-level modules, NOT children of a "Tools" parent
 *                          (visually independent — no shared border/grouping)
 *    Video Sage
 *    Copilot
 *    BG Remover          (Soon)
 *    Object Remover      (Soon)
 *
 * (A-4 had AUTOMATE as a separate group with Automation alone. Killed in A-5
 * — single-module groups read as layout glitches; Automation is operational.)
 * ------------------------------------------------------------------ */
export const MODULES: ModuleDef[] = [
  /* RUN */
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  /* Dashboard visual-variant showcase (editorial/terminal/tonal/classic) — exploration, not final IA */
  { key: "dashboard-variants", label: "Dash Variants", icon: Layers, path: "/dashboard-variants/editorial" },
  {
    key: "reports", label: "Reports", icon: BarChart3,
    plans: ["full"],
    subItems: [
      { label: "Facebook", path: "/reports/fb", icon: Globe },
      { label: "NB", path: "/reports/nb", icon: BarChart3 },
      { label: "TikTok", path: "/reports/tt", icon: Video },
      { label: "Creative Reporting", path: "/reports/creative", icon: Film },
      {
        label: "Creative Report 2.0", path: "/reports/creative-v2", icon: Sparkles, badge: "New",
        subItems: [
          { label: "Overview", path: "/reports/creative-v2" },
          { label: "Creatives", path: "/reports/creative-v2/creatives" },
          { label: "Components", path: "/reports/creative-v2/components" },
          { label: "Compare", path: "/reports/creative-v2/compare" },
          { label: "Saved views", path: "/reports/creative-v2/views" },
        ],
      },
    ],
  },
  {
    key: "insights", label: "Industry Insights", icon: Telescope,
    subItems: [
      // Phase 3: My Feed is the primary surface (Industry Insights v2). The
      // remaining items continue to point at v1 routes until each gets its
      // own v2 redesign. Icons re-added to match Genie 6.0's sub-nav style.
      { label: "My feeds",  path: "/insights-v2/feed",     icon: Rss },
      { label: "Discover",  path: "/insights/discover",    icon: Compass },
      { label: "Saved Ads", path: "/insights/saved",       icon: Bookmark },
      { label: "Competitor", path: "/insights/competitors", icon: Eye },
      { label: "Board",     path: "/insights/boards",      icon: Layers },
    ],
  },
  {
    // Launch v2 — fresh from-scratch redesign of Launch 2.0 (4-step Meta-grounded
    // flow). Own namespace /launchv2; v1 Launch + Launch 2.0 untouched. Ungated
    // for now so it can be reviewed on any plan.
    key: "launchv2", label: "Launches", icon: Sparkles, badge: "Beta",
    subItems: [
      { label: "New launch", path: "/launchv2/new", icon: Plus },
      { label: "History", path: "/launchv2/history", icon: History },
      { label: "Strategies", path: "/launchv2/strategies", icon: Bookmark },
      { label: "Templates", path: "/launchv2/templates", icon: LibraryIcon },
      { label: "Launch settings", path: "/launchv2/settings/launch", icon: Settings },
      { label: "Auto launch", path: "/launchv2/auto", icon: Zap, badge: "Soon" },
    ],
  },

  { key: "automation", label: "Automation", icon: Workflow, path: "/automation", plans: ["full"] },

  /* CREATE */
  {
    key: "genie", label: "Genie", icon: Wand2,
    subItems: [
      // Nav iter-6 A-9 IA (2026-05-01):
      //   - "Studio" was misunderstood — was meant to be the new-generation form,
      //     not the workspace. So:
      //       a) Old "Studio" sub-item (path /iq/genie6/workspace) renamed to
      //          "Assets" (workspace data + context now belongs there).
      //       b) NEW "Studio" sub-item points to /iq/genie6/generate (ModePicker)
      //          — replaces the lime [+ New Generation] CTA which is removed.
      //   - There's a naming overlap with the Genie variant pill's "Studio" option
      //     (one of 4 internal Genie variants: Studio/Canvas/Command/Modular).
      //     Context disambiguates: this Studio = sidebar sub-item = new-gen form;
      //     pill Studio = a Genie internal layout variant.
      // Iter-6 A-10.3: Studio promoted to 2nd (was 4th) per Maalik —
      // matches the new /studio Product-first flow's primacy.
      { label: "Overview",    path: "/iq/genie6",                  icon: Home },
      // A-12.17: Studio Alpha is primary. Studio v3 + Beta deprioritized below Old Studio.
      { label: "Studio Alpha", path: "/iq/genie6/studio-alpha", icon: Wand2, badge: "New" },
      // A-12.38: Concepts library promoted to primary. Aggregates catalogue +
      // KB-attached + user-saved concepts into one searchable feed.
      { label: "Concepts",    path: "/iq/genie6/concepts",         icon: Lightbulb },
      { label: "Library",     path: "/iq/genie6/library",          icon: LibraryIcon },
      { label: "Settings",    path: "/iq/genie6/settings",         icon: Settings },
      // Deprioritized — legacy studios + Assets below divider
      { label: "Studio",      path: "/iq/genie6/generate",         icon: Wand2, deprioritized: true },
      { label: "Old Studio",  path: "/iq/genie6/generate-legacy",  icon: Wand2, deprioritized: true },
      { label: "Studio",      path: "/iq/genie6/studio",           icon: Wand2, badge: "Beta", deprioritized: true },
      { label: "Studio v3",   path: "/iq/genie6/generate-v3",      icon: Wand2, deprioritized: true },
      // A-12.38: Assets moved from primary to deprioritized — Workspace/Assets
      // is no longer the day-to-day path; Concepts + Catalogue cover that need.
      { label: "Assets",      path: "/iq/genie6/workspace",        icon: FolderTree, deprioritized: true },
      { label: "Genie 5",     path: "/iq/genie5",                  icon: Wand2, deprioritized: true },
    ],
  },
  {
    key: "catalogue", label: "Catalogue", icon: Boxes,
    subItems: [
      // A-12.38: reduced to 3 — Brands / Product / Category. Audiences /
      // Angles / Hooks / Concepts / Avatars / Voices removed from sub-nav per
      // Maalik. Routes + data files preserved (may be re-surfaced later).
      { label: "Brands", path: "/catalogue/brands", icon: Building2 },
      { label: "Product", path: "/catalogue/products", icon: Package },
      { label: "Category", path: "/catalogue/categories", icon: Tag },
    ],
  },
  { key: "creative-library", label: "Creative Library", icon: ImageIcon, path: "/iq/creative-library" },

  /* TOOLS — flat top-level modules (no parent "Tools" label) */
  { key: "video-sage", label: "Video Sage", icon: Video, path: "/iq/video-sage" },
  { key: "copilot", label: "Copilot", icon: MessageSquare, path: "/iq/copilot" },
  // Auth screens module — the new Figma login/signup/2FA flows (Onboard-UMS
  // file, "Login & Signup/ONboarding" section). Pure-UI preview: /auth renders
  // outside the app shell; the page shows a "Back to dashboard" chip so
  // reviewers can return without logging out (demo auto-login stays active).
  { key: "auth-screens", label: "Auth", icon: Shield, path: "/auth", badge: "New" },
  { key: "bg-remover", label: "BG Remover", icon: Eraser, path: "/tools/bg-remover", comingSoon: true },
  { key: "obj-remover", label: "Object Remover", icon: Scissors, path: "/tools/obj-remover", comingSoon: true },
  // Brand Book is intentionally NOT in the nav rail. The slideshow itself
  // (/brand-book/:slug) still works for direct URL access — see
  // brandBookRoutes in App.tsx. Removed from the rail per Maalik —
  // "Remove the Brand book from both navigations."
];

// System modules moved to Profile popover (UserMenu). Rail is clean.
export const SYSTEM_MODULES: ModuleDef[] = [];

/* ------------------------------------------------------------------ */
/*  Functional grouping                                                */
/* ------------------------------------------------------------------ */
/**
 * Module key → group label. Used to render the small caps group
 * headers (RUN / CREATE / TOOLS) above each cluster.
 *
 * Locked 2026-05-01 (iter-6 A-5):
 *   RUN     — operate the business: own data + market data + activation + automation
 *   CREATE  — content / asset / brand authoring
 *   TOOLS   — utilities (each tool is a top-level module; no shared grouping)
 *
 * History:
 *   A-2 had RUN/DISCOVER/CREATE/AUTOMATE — DISCOVER had Insights alone (lonely).
 *   A-4 merged Insights into RUN, kept AUTOMATE for Automation alone (still lonely).
 *   A-5 (this) folds Automation into RUN as well, killing AUTOMATE entirely.
 */
export const MODULE_GROUPS: Record<string, ModuleGroup> = {
  // RUN
  dashboard: "RUN",
  "dashboard-variants": "RUN",
  reports: "RUN",
  insights: "RUN",
  launchv2: "RUN",
  automation: "RUN",
  // CREATE
  genie: "CREATE",
  catalogue: "CREATE",
  "creative-library": "CREATE",
  // TOOLS (each tool is its own module)
  "video-sage": "TOOLS",
  copilot: "TOOLS",
  "bg-remover": "TOOLS",
  "obj-remover": "TOOLS",
  "auth-screens": "TOOLS",
};

export const GROUP_ORDER: ModuleGroup[] = ["RUN", "CREATE", "TOOLS"];

/**
 * Returns modules grouped by their functional cluster, preserving order.
 *
 * History: pre A-10.13 this took a `variantKey` param so V2 (darkAlways) could
 * route Industry Insights into a separate EXTENSIONS group as a paid-extension
 * cue. V2 was dropped, EXTENSIONS group + V2 overrides removed with it.
 */
export function groupedModules(): { group: ModuleGroup; modules: ModuleDef[] }[] {
  return GROUP_ORDER.map((group) => ({
    group,
    modules: MODULES.filter((m) => MODULE_GROUPS[m.key] === group),
  }));
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
export function hasSubItems(m: ModuleDef): boolean {
  return !!(m.subItems?.length || m.sections?.length);
}

export function allSubPaths(m: ModuleDef): string[] {
  if (m.subItems) {
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
  for (const m of [...MODULES, ...SYSTEM_MODULES]) {
    if (m.path && pathname === m.path) return m.key;
    for (const p of allSubPaths(m)) {
      if (pathname === p || pathname.startsWith(p + "/")) return m.key;
    }
    if (m.path && pathname.startsWith(m.path + "/")) return m.key;
  }
  if (pathname === "/integrations") return "integrations";
  return null;
}

export function isSubItemActive(itemPath: string, pathname: string, allPaths: string[] = []): boolean {
  if (itemPath === pathname) return true;
  if (pathname.startsWith(itemPath + "/")) {
    const hasBetterMatch = allPaths.some(
      (p) => p !== itemPath && p.length > itemPath.length && (pathname === p || pathname.startsWith(p + "/"))
    );
    return !hasBetterMatch;
  }
  return false;
}
