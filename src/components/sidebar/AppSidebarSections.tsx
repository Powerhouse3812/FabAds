import { useState, useEffect, useCallback } from "react";
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
import { NavVariantToggle } from "@/components/sidebar/NavVariantToggle";
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

/* ------------------------------------------------------------------ */
/*  Genie variant pill (inline, expanded mode)                         */
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
/*  Sub-item row (used inside accordion)                               */
/* ------------------------------------------------------------------ */
function SubItemRow({
  item,
  pathname,
  siblingPaths,
  onNavigate,
}: {
  item: SubItem;
  pathname: string;
  siblingPaths: string[];
  onNavigate: (path: string) => void;
}) {
  const active = isSubItemActive(item.path, pathname, siblingPaths);
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.path)}
      className={cn(
        "w-full text-left pl-9 pr-3 py-1.5 rounded-md text-[13px] transition-colors flex items-center gap-2",
        active
          ? "bg-g6-primary/10 text-g6-primary-active font-medium"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
      )}
    >
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground border border-border rounded px-1 py-0.5 shrink-0">
          {item.badge}
        </span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Module row (expanded mode) — accordion parent                      */
/* ------------------------------------------------------------------ */
function ModuleRowExpanded({
  mod,
  isActive,
  isOpen,
  pathname,
  onToggle,
  onNavigate,
}: {
  mod: ModuleDef;
  isActive: boolean;
  isOpen: boolean;
  pathname: string;
  onToggle: () => void;
  onNavigate: (path: string) => void;
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
    <div className="relative">
      {/* Active left-edge bar */}
      {isActive && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r bg-g6-primary-active" />
      )}
      <button
        type="button"
        onClick={handleClick}
        aria-expanded={hasChildren ? isOpen : undefined}
        className={cn(
          "w-full text-left pl-3 pr-2.5 py-2 rounded-md text-sm transition-colors flex items-center gap-2.5",
          isActive
            ? "bg-g6-primary/10 text-g6-primary-active font-medium"
            : "text-sidebar-foreground/85 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">{mod.label}</span>
        {mod.comingSoon && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground border border-border rounded px-1 py-0.5 shrink-0">
            Soon
          </span>
        )}
        {hasChildren && (
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-sidebar-foreground/40 transition-transform duration-200",
              isOpen && "rotate-90"
            )}
          />
        )}
      </button>

      {/* Inline accordion content */}
      {hasChildren && isOpen && (
        <div className="mt-0.5 mb-1 flex flex-col gap-0.5 overflow-visible">
          {/* Genie special: New-gen CTA + variant pill before sub-items */}
          {mod.key === "genie" && (
            <div className="px-3 pb-1">
              <Genie6SubnavNewGenButton />
              <GenieVariantPill />
            </div>
          )}
          {mod.subItems?.map((item) => (
            <SubItemRow
              key={item.path}
              item={item}
              pathname={pathname}
              siblingPaths={siblingPaths}
              onNavigate={onNavigate}
            />
          ))}
          {mod.sections?.map((section) => (
            <div key={section.sectionLabel} className="mt-1.5 first:mt-0">
              <span className="block pl-9 pr-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.sectionLabel}
              </span>
              {section.items.map((item) => (
                <SubItemRow
                  key={item.path}
                  item={item}
                  pathname={pathname}
                  siblingPaths={siblingPaths}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Module icon (collapsed mode) — hover popover for sub-items         */
/* ------------------------------------------------------------------ */
function ModuleIconCollapsed({
  mod,
  isActive,
  pathname,
  onNavigate,
}: {
  mod: ModuleDef;
  isActive: boolean;
  pathname: string;
  onNavigate: (path: string) => void;
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

/* ------------------------------------------------------------------ */
/*  Main — Sections variant                                            */
/* ------------------------------------------------------------------ */
export function AppSidebarSections() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const activeKey = deriveActiveModule(pathname);

  // Collapse state: 240px expanded ↔ 60px collapsed
  const [collapsed, setCollapsed] = useState(false);

  // Open accordion state: which module keys are expanded.
  // Default: only the active module (if it has children) is open.
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
      className={cn(
        "hidden md:flex h-screen flex-shrink-0 flex-col bg-sidebar border-r border-sidebar-border transition-[width] duration-200 ease-out",
        collapsed ? "w-[60px]" : "w-[240px]"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center border-b border-sidebar-border h-12 shrink-0",
          collapsed ? "justify-center px-0" : "justify-between px-3"
        )}
      >
        <Link to="/dashboard" className="flex items-center gap-2 text-sidebar-foreground">
          <img src={isDark ? faviconDark : faviconLight} alt="FabAds" className="h-6 w-6" />
          {!collapsed && (
            <span className="text-sm font-semibold tracking-tight">FabAds</span>
          )}
        </Link>
        {!collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label="Collapse sidebar"
            className="p-1 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition-colors"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto py-2">
        {collapsed ? (
          /* COLLAPSED: icon-only with thin separators between groups */
          <div className="flex flex-col items-center gap-0.5 px-2">
            {groups.map(({ group, modules }, gi) =>
              modules.length === 0 ? null : (
                <div key={group} className="flex flex-col items-center gap-0.5 w-full">
                  {gi > 0 && <div className="w-6 border-t border-sidebar-border my-1.5" />}
                  {modules.map((mod) => (
                    <ModuleIconCollapsed
                      key={mod.key}
                      mod={mod}
                      isActive={activeKey === mod.key}
                      pathname={pathname}
                      onNavigate={handleNavigate}
                    />
                  ))}
                </div>
              )
            )}
          </div>
        ) : (
          /* EXPANDED: sectioned with group labels */
          <div className="flex flex-col gap-3 px-2">
            {groups.map(({ group, modules }) =>
              modules.length > 0 ? (
                <div key={group} className="flex flex-col gap-0.5">
                  <span className="px-3 pt-2 pb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-sidebar-foreground/45">
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
                    />
                  ))}
                </div>
              ) : null
            )}
          </div>
        )}
      </div>

      {/* Footer dock */}
      <div className="border-t border-sidebar-border bg-sidebar-background shrink-0">
        {collapsed ? (
          <div className="flex flex-col items-center gap-1 py-2">
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              aria-label="Expand sidebar"
              className="flex items-center justify-center w-10 h-10 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground transition-colors"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
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
    </aside>
  );
}
