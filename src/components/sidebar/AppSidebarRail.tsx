import { useRef, useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { ChevronLeft } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { InsightsBoardListPanel } from "@/components/insights/InsightsBoardListPanel";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { Genie6SubnavNewGenButton } from "@/genie6/shell/Genie6SubnavNewGenButton";
import { useGenie6Theme } from "@/genie6/hooks/useGenie6Theme";
import { NavVariantToggle } from "@/components/sidebar/NavVariantToggle";
import {
  MODULES,
  SYSTEM_MODULES,
  type ModuleDef,
  type SubItem,
  hasSubItems,
  allSubPaths,
  firstSubPath,
  deriveActiveModule,
  isSubItemActive,
} from "@/components/sidebar/modules";
import faviconLight from "@/assets/favicon-light.svg";
import faviconDark from "@/assets/favicon-dark.png";

/* ------------------------------------------------------------------ */
/*  Sidebar Footer                                                     */
/* ------------------------------------------------------------------ */
/**
 * Sidebar footer block (nav iter-6 A-2, 2026-05-01).
 * - Dark/light toggle removed — lives in UserMenu now.
 * - NavVariantToggle (Rail ↔ Sections) replaces it in the same dock slot.
 * - UserMenu absorbs Settings / Integrations / Team / Clients / Help / Theme.
 * - NotificationBell sits next to UserMenu in the collapsed rail.
 */
function SidebarFooter({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="border-t border-sidebar-border bg-sidebar-background">
      {collapsed ? (
        <div className="flex flex-col items-center gap-1 py-2">
          <NotificationBell compact />
          <NavVariantToggle compact />
          <UserMenu compact />
        </div>
      ) : (
        <div className="px-1.5 py-1.5 flex items-center gap-1">
          <div className="flex-1">
            <UserMenu />
          </div>
          <NavVariantToggle />
          <NotificationBell />
        </div>
      )}
    </div>
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
          ? "bg-g6-primary/15 text-g6-primary-active"
          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground hover:scale-105"
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
          {/* "+ New generation" button at top of Genie sub-nav hover popover. */}
          {mod.key === "genie" && (
            <div className="px-1.5 pt-1.5">
              <Genie6SubnavNewGenButton />
            </div>
          )}
          <div className="flex flex-col gap-0.5 p-1.5">
            {mod.subItems?.map((item) => {
              const SubIcon = item.icon;
              // Nested 2nd-level children — render as small section
              if (item.subItems && item.subItems.length > 0) {
                return (
                  <div key={item.path} className="mt-1.5 first:mt-0">
                    <button
                      onClick={() => onNavigate(item.path)}
                      className="w-full text-left px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 hover:text-foreground"
                    >
                      {SubIcon && <SubIcon className="h-3 w-3 shrink-0" />}
                      {item.label}
                    </button>
                    {item.subItems.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <button
                          key={child.path}
                          onClick={() => onNavigate(child.path)}
                          className={cn(
                            "w-full text-left pl-6 pr-2.5 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2",
                            isSubItemActive(child.path, pathname, siblingPaths)
                              ? "bg-g6-primary/10 text-g6-primary-active font-medium"
                              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                          )}
                        >
                          {ChildIcon && <ChildIcon className="h-3.5 w-3.5 shrink-0" />}
                          {child.label}
                        </button>
                      );
                    })}
                  </div>
                );
              }
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2",
                    isSubItemActive(item.path, pathname, siblingPaths)
                      ? "bg-g6-primary/10 text-g6-primary-active font-medium"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  {SubIcon && <SubIcon className="h-3.5 w-3.5 shrink-0" />}
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground border border-border rounded px-1 py-0.5">
                      {item.badge}
                    </span>
                  )}
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
                          ? "bg-g6-primary/10 text-g6-primary-active font-medium"
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
/*  Genie Variant Pill (inside Genie sub-panel)                        */
/* ------------------------------------------------------------------ */
const GENIE_VARIANTS = [
  { key: "studio" as const, label: "Studio" },
  { key: "canvas" as const, label: "Canvas" },
  { key: "command" as const, label: "Command" },
  { key: "modular" as const, label: "Modular" },
];

function GenieVariantPill() {
  const { variant, setVariant } = useGenie6Theme();
  return (
    <div className="mt-2 flex w-full rounded-full border border-sidebar-border bg-sidebar-accent/20 p-0.5">
      {GENIE_VARIANTS.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => setVariant(o.key)}
          className={cn(
            "flex-1 rounded-full py-1 text-[10px] font-semibold transition-all duration-150",
            variant === o.key
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
              : "text-sidebar-foreground/50 hover:text-sidebar-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
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
    // 2-level nested item — render as a labelled section
    if (item.subItems && item.subItems.length > 0) {
      return (
        <div key={item.path} className="mt-2 first:mt-0">
          <button
            onClick={() => onNavigate(item.path)}
            className={cn(
              "w-full text-left px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-2",
              isSubItemActive(item.path, pathname, siblingPaths)
                ? "text-sidebar-accent-foreground"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
            )}
          >
            {ItemIcon && <ItemIcon className="h-3.5 w-3.5 shrink-0" />}
            {item.label}
          </button>
          <div className="ml-2 flex flex-col gap-0.5 border-l border-sidebar-border pl-2">
            {item.subItems.map((child) => {
              const ChildIcon = child.icon;
              return (
                <button
                  key={child.path}
                  onClick={() => onNavigate(child.path)}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded-md text-sm transition-all duration-150 flex items-center gap-2",
                    isSubItemActive(child.path, pathname, siblingPaths)
                      ? "bg-g6-primary/10 text-g6-primary-active font-medium"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                  )}
                >
                  {ChildIcon && <ChildIcon className="h-3.5 w-3.5 shrink-0" />}
                  {child.label}
                </button>
              );
            })}
          </div>
        </div>
      );
    }
    return (
      <button
        key={item.path}
        onClick={() => onNavigate(item.path)}
        className={cn(
          "w-full text-left px-3 py-1.5 rounded-md text-sm transition-all duration-150 flex items-center gap-2",
          isSubItemActive(item.path, pathname, siblingPaths)
            ? "bg-g6-primary/10 text-g6-primary-active font-medium"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
        )}
      >
        {ItemIcon && <ItemIcon className="h-3.5 w-3.5 shrink-0" />}
        <span className="flex-1">{item.label}</span>
        {item.badge && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground border border-border rounded px-1 py-0.5">
            {item.badge}
          </span>
        )}
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

      {/* "+ New generation" CTA + variant pill at top of Genie sub-panel. */}
      {mod.key === "genie" && (
        <div className="px-2 pb-1">
          <Genie6SubnavNewGenButton />
          <GenieVariantPill />
        </div>
      )}

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
            active ? "bg-g6-primary/10 text-g6-primary-active font-medium" : "text-sidebar-foreground/80"
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
        {/* "+ New generation" button at top of Genie sub-nav (mobile). */}
        {mod.key === "genie" && (
          <div className="ml-6 mr-3 mb-1.5">
            <Genie6SubnavNewGenButton />
          </div>
        )}
        <div className="ml-6 flex flex-col gap-0.5">
          {mod.subItems?.map((item) => {
            const siblings = allSubPaths(mod);
            // Nested 2nd-level children
            if (item.subItems && item.subItems.length > 0) {
              return (
                <div key={item.path} className="mt-1.5 first:mt-0">
                  <button
                    onClick={() => go(item.path)}
                    className="w-full text-left px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50"
                  >
                    {item.label}
                  </button>
                  {item.subItems.map((child) => (
                    <button
                      key={child.path}
                      onClick={() => go(child.path)}
                      className={cn(
                        "w-full text-left pl-6 pr-3 py-1.5 rounded-md text-sm",
                        isSubItemActive(child.path, pathname, siblings)
                          ? "bg-g6-primary/10 text-g6-primary-active font-medium"
                          : "text-sidebar-foreground/70"
                      )}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              );
            }
            return (
            <button
              key={item.path}
              onClick={() => go(item.path)}
              className={cn(
                "w-full text-left px-3 py-1.5 rounded-md text-sm",
                isSubItemActive(item.path, pathname, siblings)
                  ? "bg-g6-primary/10 text-g6-primary-active font-medium"
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
                      ? "bg-g6-primary/10 text-g6-primary-active font-medium"
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
          {SYSTEM_MODULES.length > 0 && (
            <>
              <div className="border-t border-sidebar-border my-2" />
              {SYSTEM_MODULES.map(renderModule)}
            </>
          )}
        </div>
      </ScrollArea>
      <SidebarFooter />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Sidebar Component — Rail variant                              */
/* ------------------------------------------------------------------ */
export function AppSidebarRail() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

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

          {SYSTEM_MODULES.length > 0 && (
            <>
              <div className="w-6 border-t border-sidebar-border my-2" />
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
            </>
          )}
        </div>

        {/* Sidebar footer */}
        <div className="mt-auto">
          <SidebarFooter collapsed />
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
