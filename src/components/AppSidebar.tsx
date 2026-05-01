import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { Genie6SubnavNewGenButton } from "@/genie6/shell/Genie6SubnavNewGenButton";
import { useGenie6Theme } from "@/genie6/hooks/useGenie6Theme";
import {
  groupedModules,
  type ModuleDef,
  type SubItem,
  hasSubItems,
  allSubPaths,
  deriveActiveModule,
  isSubItemActive,
} from "@/components/sidebar/modules";
import faviconLight from "@/assets/favicon-light.svg";
import faviconDark from "@/assets/favicon-dark.png";

// Re-export mobile nav so existing AppLayout consumers don't need to change.
export { MobileNavContent } from "@/components/sidebar/MobileNavContent";

/* ============================================================================
 *  AppSidebar — single nav variant (iter-6 A-4, 2026-05-01)
 *
 *  History:
 *    iter-6 A-1: 9-module restructure, NotificationBell, UserMenu flatten
 *    iter-6 A-2: added Sections variant + variant picker
 *    iter-6 A-3: added Focus variant + 3-way variant cycle
 *    iter-6 A-4: simplified to single Sections variant (Maalik picked it).
 *                Killed Rail, Focus, NavVariantToggle, useFabAdsNavVariant.
 *                Improvements borrowed from Focus: tighter spacing, dot
 *                indicators on sub-items, chevron-on-hover for module rows.
 *                BG matched to content (`bg-background`), Genie theming
 *                applied when on /iq/genie6 routes (uses g6 tokens; Genie
 *                variants cascade naturally via data-genie6-variant on <html>).
 *                Collapsible with Cmd+B shortcut + localStorage persistence.
 *
 *  Layout:
 *    Expanded (240px): RUN / CREATE / AUTOMATE / TOOLS group labels +
 *                      modules under each + inline accordion sub-items.
 *    Collapsed (60px): icon-only column, hover popovers for sub-items,
 *                      group separators preserved as thin lines.
 *
 *  IA (locked):
 *    RUN       Dashboard, Reports, Industry Insights, Launch
 *    CREATE    Genie, Catalogue, Creative Library
 *    AUTOMATE  Automation (Soon)
 *    TOOLS     Video Sage, Copilot, BG Remover (Soon), Object Remover (Soon)
 * ============================================================================ */

/* ─────────────────────────────────────────────────────────
 *  Collapsed-state external store — persists to localStorage,
 *  shared across all consumers via useSyncExternalStore.
 *  Cmd+B keyboard shortcut wired here for global availability.
 * ───────────────────────────────────────────────────────── */
const COLLAPSED_KEY = "fabads-nav-collapsed";

function readCollapsedFromStorage(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(COLLAPSED_KEY) === "1";
}

let currentCollapsed = readCollapsedFromStorage();
const collapseListeners = new Set<() => void>();

function emitCollapse() {
  for (const fn of collapseListeners) fn();
}

function subscribeCollapse(fn: () => void) {
  collapseListeners.add(fn);
  return () => {
    collapseListeners.delete(fn);
  };
}

function getCollapseSnapshot() {
  return currentCollapsed;
}

function setCollapsed(next: boolean) {
  if (next === currentCollapsed) return;
  currentCollapsed = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
  }
  emitCollapse();
}

function useNavCollapsed() {
  const collapsed = useSyncExternalStore(subscribeCollapse, getCollapseSnapshot, () => false);
  return { collapsed, setCollapsed, toggle: () => setCollapsed(!currentCollapsed) };
}

// Cmd+B (Linear/VS Code convention) toggles the sidebar globally.
if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "b") {
      // Don't fire when user is typing in a textarea/contenteditable
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;
      e.preventDefault();
      setCollapsed(!currentCollapsed);
    }
  });
}

/* ─────────────────────────────────────────────────────────
 *  Token swap — match content bg in normal mode; use g6
 *  tokens when on Genie routes so the nav blends with the
 *  current Genie variant's surface treatment.
 * ───────────────────────────────────────────────────────── */
type NavTokens = ReturnType<typeof getTokens>;

function getTokens(isGenieRoute: boolean) {
  if (isGenieRoute) {
    return {
      bg: "bg-g6-bg-container",
      bgFooter: "bg-g6-bg-base",
      border: "border-g6-border-secondary",
      text: "text-g6-text",
      textMuted: "text-g6-text-tertiary",
      textSecondary: "text-g6-text-secondary",
      hoverBg: "hover:bg-g6-bg-spotlight/50",
      hoverText: "hover:text-g6-text",
      activeBg: "bg-g6-primary/10",
      activeText: "text-g6-primary-active",
      activeIconBg: "bg-g6-primary/15",
      pillBorder: "border-g6-border-secondary",
      pillBg: "bg-g6-bg-spotlight/40",
    } as const;
  }
  return {
    bg: "bg-background",
    bgFooter: "bg-background",
    border: "border-border",
    text: "text-foreground",
    textMuted: "text-muted-foreground",
    textSecondary: "text-foreground/75",
    hoverBg: "hover:bg-accent/50",
    hoverText: "hover:text-foreground",
    activeBg: "bg-g6-primary/10",
    activeText: "text-g6-primary-active",
    activeIconBg: "bg-g6-primary/15",
    pillBorder: "border-border",
    pillBg: "bg-accent/30",
  } as const;
}

/* ─────────────────────────────────────────────────────────
 *  Genie variant pill (inline under [+ New Generation])
 * ───────────────────────────────────────────────────────── */
const GENIE_VARIANTS = [
  { key: "studio" as const, label: "Studio" },
  { key: "canvas" as const, label: "Canvas" },
  { key: "command" as const, label: "Command" },
  { key: "modular" as const, label: "Modular" },
];

function GenieVariantPill({ tokens }: { tokens: NavTokens }) {
  const { variant, setVariant } = useGenie6Theme();
  return (
    <div className={cn("flex w-full rounded-full border p-0.5", tokens.pillBorder, tokens.pillBg)}>
      {GENIE_VARIANTS.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => setVariant(o.key)}
          className={cn(
            "flex-1 rounded-full py-1 text-[10px] font-semibold transition-all duration-150",
            variant === o.key
              ? "bg-g6-primary text-g6-text-on-accent shadow-sm"
              : cn(tokens.textMuted, tokens.hoverText)
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 *  Sub-item row — with dot indicator (active = lime, inactive = dim)
 * ───────────────────────────────────────────────────────── */
function SubItemRow({
  item,
  pathname,
  siblingPaths,
  onNavigate,
  tokens,
}: {
  item: SubItem;
  pathname: string;
  siblingPaths: string[];
  onNavigate: (path: string) => void;
  tokens: NavTokens;
}) {
  const active = isSubItemActive(item.path, pathname, siblingPaths);
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.path)}
      className={cn(
        "relative w-full text-left pl-9 pr-3 py-1.5 rounded-md text-[13px] transition-colors flex items-center gap-2",
        active
          ? cn(tokens.activeBg, tokens.activeText, "font-medium")
          : cn(tokens.textSecondary, tokens.hoverBg, tokens.hoverText)
      )}
    >
      <span
        className={cn(
          "absolute left-5 top-1/2 -translate-y-1/2 h-1 w-1 rounded-full transition-colors",
          active ? "bg-g6-primary-active" : "bg-current opacity-30"
        )}
      />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className={cn("text-[10px] font-medium uppercase tracking-wider rounded px-1 py-0.5 shrink-0 border", tokens.textMuted, tokens.border)}>
          {item.badge}
        </span>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
 *  Module row (expanded mode) — accordion parent
 *  Includes lime active left-edge bar + chevron-on-hover for
 *  modules without sub-items (a borrowed Focus polish).
 * ───────────────────────────────────────────────────────── */
function ModuleRowExpanded({
  mod,
  isActive,
  isOpen,
  pathname,
  onToggle,
  onNavigate,
  tokens,
}: {
  mod: ModuleDef;
  isActive: boolean;
  isOpen: boolean;
  pathname: string;
  onToggle: () => void;
  onNavigate: (path: string) => void;
  tokens: NavTokens;
}) {
  const Icon = mod.icon;
  const hasChildren = hasSubItems(mod);

  const handleClick = () => {
    if (!hasChildren) {
      onNavigate(mod.path!);
    } else {
      onToggle();
    }
  };

  const siblingPaths = allSubPaths(mod);

  return (
    <div className="relative group/row">
      {/* Active left-edge bar */}
      {isActive && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r bg-g6-primary-active" />
      )}
      <button
        type="button"
        onClick={handleClick}
        aria-expanded={hasChildren ? isOpen : undefined}
        className={cn(
          "w-full text-left pl-3 pr-2.5 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2.5",
          isActive
            ? cn(tokens.activeBg, tokens.activeText, "font-medium")
            : cn(tokens.text, "opacity-80", tokens.hoverBg, tokens.hoverText, "hover:opacity-100")
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">{mod.label}</span>
        {mod.comingSoon && (
          <span className={cn("text-[10px] font-medium uppercase tracking-wider rounded px-1 py-0.5 shrink-0 border", tokens.textMuted, tokens.border)}>
            Soon
          </span>
        )}
        {hasChildren ? (
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
              tokens.textMuted,
              isOpen && "rotate-90"
            )}
          />
        ) : (
          // chevron-on-hover for direct-navigate modules (Focus polish)
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 opacity-0 group-hover/row:opacity-60 transition-opacity",
              tokens.textMuted
            )}
          />
        )}
      </button>

      {/* Inline accordion content */}
      {hasChildren && isOpen && (
        <div className="mt-0.5 mb-1 flex flex-col gap-0.5 overflow-visible">
          {/* Genie special: New-gen CTA + variant pill before sub-items */}
          {mod.key === "genie" && (
            <div className="px-3 py-1 space-y-2">
              <Genie6SubnavNewGenButton />
              <GenieVariantPill tokens={tokens} />
            </div>
          )}
          {mod.subItems?.map((item) => (
            <SubItemRow
              key={item.path}
              item={item}
              pathname={pathname}
              siblingPaths={siblingPaths}
              onNavigate={onNavigate}
              tokens={tokens}
            />
          ))}
          {mod.sections?.map((section) => (
            <div key={section.sectionLabel} className="mt-1.5 first:mt-0">
              <span className={cn("block pl-9 pr-3 py-1 text-[10px] font-semibold uppercase tracking-wider", tokens.textMuted)}>
                {section.sectionLabel}
              </span>
              {section.items.map((item) => (
                <SubItemRow
                  key={item.path}
                  item={item}
                  pathname={pathname}
                  siblingPaths={siblingPaths}
                  onNavigate={onNavigate}
                  tokens={tokens}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 *  Module icon (collapsed mode) — hover popover for sub-items
 * ───────────────────────────────────────────────────────── */
function ModuleIconCollapsed({
  mod,
  isActive,
  pathname,
  onNavigate,
  tokens,
}: {
  mod: ModuleDef;
  isActive: boolean;
  pathname: string;
  onNavigate: (path: string) => void;
  tokens: NavTokens;
}) {
  const Icon = mod.icon;
  const hasChildren = hasSubItems(mod);

  const iconButton = (
    <button
      type="button"
      onClick={() => {
        if (!hasChildren) onNavigate(mod.path!);
        else onNavigate(mod.subItems![0].path);
      }}
      className={cn(
        "relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150",
        isActive
          ? cn(tokens.activeIconBg, tokens.activeText)
          : cn(tokens.textMuted, tokens.hoverBg, tokens.hoverText, "hover:scale-105")
      )}
    >
      <Icon className="h-5 w-5" />
      {mod.comingSoon && (
        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
      )}
    </button>
  );

  if (!hasChildren) {
    return (
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>{iconButton}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {mod.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  const siblingPaths = allSubPaths(mod);

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>{iconButton}</HoverCardTrigger>
      <HoverCardContent side="right" align="start" sideOffset={8} className="w-52 p-0">
        <div className="px-3 py-2 border-b border-border">
          <span className="text-sm font-semibold text-foreground">{mod.label}</span>
        </div>
        {mod.key === "genie" && (
          <div className="px-1.5 pt-1.5">
            <Genie6SubnavNewGenButton />
          </div>
        )}
        <div className="flex flex-col gap-0.5 p-1.5">
          {mod.subItems?.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => onNavigate(item.path)}
              className={cn(
                "w-full text-left px-2.5 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2",
                isSubItemActive(item.path, pathname, siblingPaths)
                  ? "bg-g6-primary/10 text-g6-primary-active font-medium"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground border border-border rounded px-1 py-0.5">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

/* ─────────────────────────────────────────────────────────
 *  Main — AppSidebar (single variant, sectioned, collapsible)
 * ───────────────────────────────────────────────────────── */
export function AppSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const isGenieRoute = pathname.startsWith("/iq/genie6");
  const tokens = getTokens(isGenieRoute);

  const activeKey = deriveActiveModule(pathname);
  const { collapsed, toggle: toggleCollapsed } = useNavCollapsed();

  // Open accordion state — only the active module is open by default.
  const [openKeys, setOpenKeys] = useState<Set<string>>(() => {
    return activeKey ? new Set([activeKey]) : new Set();
  });

  // Auto-open the active module's accordion on route change
  useEffect(() => {
    if (!activeKey) return;
    setOpenKeys((prev) => {
      if (prev.has(activeKey)) return prev;
      const next = new Set(prev);
      next.add(activeKey);
      return next;
    });
  }, [activeKey]);

  const toggleOpen = useCallback((key: string) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleNavigate = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate]
  );

  const groups = groupedModules();

  return (
    <aside
      data-fabads-nav-on-genie={isGenieRoute || undefined}
      className={cn(
        "hidden md:flex h-screen flex-shrink-0 flex-col border-r transition-[width] duration-200 ease-out",
        tokens.bg,
        tokens.border,
        collapsed ? "w-[60px]" : "w-[240px]"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center h-12 shrink-0 border-b",
          tokens.border,
          collapsed ? "justify-center px-0" : "justify-between px-3"
        )}
      >
        <Link to="/dashboard" className={cn("flex items-center gap-2", tokens.text)}>
          <img src={isDark ? faviconDark : faviconLight} alt="FabAds" className="h-6 w-6" />
          {!collapsed && (
            <span className="text-sm font-semibold tracking-tight">FabAds</span>
          )}
        </Link>
        {!collapsed && (
          <Tooltip delayDuration={400}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label="Collapse sidebar"
                className={cn("p-1 rounded-md transition-colors", tokens.textMuted, tokens.hoverBg, tokens.hoverText)}
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Collapse · ⌘B
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto py-2">
        {collapsed ? (
          /* COLLAPSED — icon-only with thin separators between groups */
          <div className="flex flex-col items-center gap-0.5 px-2">
            {groups.map(({ group, modules }, gi) =>
              modules.length === 0 ? null : (
                <div key={group} className="flex flex-col items-center gap-0.5 w-full">
                  {gi > 0 && <div className={cn("w-6 border-t my-1.5", tokens.border)} />}
                  {modules.map((mod) => (
                    <ModuleIconCollapsed
                      key={mod.key}
                      mod={mod}
                      isActive={activeKey === mod.key}
                      pathname={pathname}
                      onNavigate={handleNavigate}
                      tokens={tokens}
                    />
                  ))}
                </div>
              )
            )}
          </div>
        ) : (
          /* EXPANDED — sectioned with group labels */
          <div className="flex flex-col gap-2.5 px-2">
            {groups.map(({ group, modules }) =>
              modules.length === 0 ? null : (
                <div key={group} className="flex flex-col gap-0.5">
                  <span className={cn("px-3 pt-2 pb-1 font-mono text-[10px] uppercase tracking-[0.14em]", tokens.textMuted)}>
                    {group}
                  </span>
                  {modules.map((mod) => (
                    <ModuleRowExpanded
                      key={mod.key}
                      mod={mod}
                      isActive={activeKey === mod.key}
                      isOpen={openKeys.has(mod.key)}
                      pathname={pathname}
                      onToggle={() => toggleOpen(mod.key)}
                      onNavigate={handleNavigate}
                      tokens={tokens}
                    />
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Footer dock — bell + UserMenu (no separate dark-mode toggle, that's in UserMenu) */}
      <div className={cn("border-t shrink-0", tokens.border, tokens.bgFooter)}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-1 py-2">
            <Tooltip delayDuration={400}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  aria-label="Expand sidebar"
                  className={cn("flex items-center justify-center w-10 h-10 rounded-lg transition-colors", tokens.textMuted, tokens.hoverBg, tokens.hoverText)}
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                Expand · ⌘B
              </TooltipContent>
            </Tooltip>
            <NotificationBell compact />
            <UserMenu compact />
          </div>
        ) : (
          <div className="px-1.5 py-1.5 flex items-center gap-1">
            <div className="flex-1">
              <UserMenu />
            </div>
            <NotificationBell />
          </div>
        )}
      </div>
    </aside>
  );
}
