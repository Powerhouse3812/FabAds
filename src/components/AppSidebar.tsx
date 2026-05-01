import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { ChevronRight, ChevronsLeft, ChevronsRight, Search, Sparkles, Maximize2, Terminal, Grid3x3 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { Genie6SubnavNewGenButton } from "@/genie6/shell/Genie6SubnavNewGenButton";
import { useGenie6Theme, type GenieVariant } from "@/genie6/hooks/useGenie6Theme";
import {
  groupedModules,
  type ModuleDef,
  type SubItem,
  hasSubItems,
  allSubPaths,
  deriveActiveModule,
  isSubItemActive,
} from "@/components/sidebar/modules";
import {
  useFabAdsNavVariant,
  VARIANT_META,
  type FabAdsNavVariant,
} from "@/components/sidebar/useFabAdsNavVariant";
import { NavVariantPicker } from "@/components/sidebar/NavVariantPicker";
import { openPalette } from "@/components/sidebar/CommandPalette";
import faviconLight from "@/assets/favicon-light.svg";
import faviconDark from "@/assets/favicon-dark.png";

// Re-export mobile nav so existing AppLayout consumers don't need to change.
export { MobileNavContent } from "@/components/sidebar/MobileNavContent";

/* ============================================================================
 *  AppSidebar — single sectioned nav with 3 visual variants (iter-6 A-5)
 *
 *  Variants (Maalik-only dev tool, hidden from end users — toggled by clicking
 *  the FabAds logo in the sidebar header; Shift+Click opens explicit picker):
 *
 *    sections    — default. Follows app theme. Lime active state. Matches content bg.
 *    darkAlways  — always-dark nav regardless of app theme. Monochromatic-white
 *                  selection on the active row only (other rows stay dim).
 *                  Subtle vertical gradient on the bg.
 *    glass       — frosted glass + subtle lime-to-transparent gradient overlay.
 *                  Auto-adapts to app theme (light tokens on light, dark on dark).
 *
 *  IA (locked):
 *    RUN     Dashboard, Reports, Industry Insights, Launch, Automation
 *    CREATE  Genie, Catalogue, Creative Library
 *    TOOLS   Video Sage, Copilot, BG Remover (Soon), Object Remover (Soon)
 *
 *  Genie variant toggle:
 *    Lives as a small icon next to the "Genie" label (NOT as a pill in
 *    sub-menu). Click cycles studio → canvas → command → modular. Icon
 *    cross-fades to show current variant (Sparkles / Maximize2 / Terminal /
 *    Grid3x3).
 *
 *  Search:
 *    Inline thin "Search · ⌘K" field at top of body. Click or ⌘K → opens
 *    global CommandPalette modal (mounted by AppLayout).
 *
 *  Cmd+B toggles collapse globally.
 * ============================================================================ */

/* ─────────────────────────────────────────────────────────
 *  Collapsed-state external store (Cmd+B)
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

if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "b") {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;
      e.preventDefault();
      setCollapsed(!currentCollapsed);
    }
  });
}

/* ─────────────────────────────────────────────────────────
 *  Token swap — variant × isGenieRoute matrix
 *
 *  Returns a token bag that components consume. Three variants × Genie-route
 *  cascade gives us 6 effective combinations. We don't proliferate variant×
 *  Genie permutations — instead, when on a Genie route we ALWAYS use g6
 *  tokens regardless of variant (Genie has its own visual ecosystem).
 *  Variant differences only apply outside Genie routes.
 *
 *  EXCEPT: Glass effect should still apply on Genie routes (frosted bg
 *  blends nicely with Genie's canvas treatments). Dark Always also applies
 *  on Genie routes (forces dark nav even if Genie variant is light-leaning).
 * ───────────────────────────────────────────────────────── */
type NavTokens = ReturnType<typeof getTokens>;

function getTokens(variant: FabAdsNavVariant, isGenieRoute: boolean) {
  // Dark Always — always-dark, monochromatic white selection
  if (variant === "darkAlways") {
    return {
      // Subtle vertical gradient on bg
      bg: "bg-[linear-gradient(180deg,#1c1c1c_0%,#141414_100%)]",
      border: "border-white/[0.08]",
      borderFooter: "border-white/[0.06]",
      text: "text-white/85",
      textMuted: "text-white/40",
      textSecondary: "text-white/65",
      hoverBg: "hover:bg-white/[0.04]",
      hoverText: "hover:text-white/95",
      // Monochromatic white selection on active row only
      activeBg: "bg-white/[0.08]",
      activeText: "text-white",
      activeIconBg: "bg-white/[0.12]",
      activeBar: "bg-white",
      // Search + chip fills (no borders — minimalist crit fix)
      searchBg: "bg-white/[0.04]",
      searchBgHover: "hover:bg-white/[0.08]",
      chipBg: "bg-white/[0.08]",
      chipText: "text-white/55",
      glassOverlay: false,
    } as const;
  }

  // Glass — frosted with lime gradient overlay (auto-theme)
  if (variant === "glass") {
    if (isGenieRoute) {
      return {
        bg: "bg-g6-bg-container/60 backdrop-blur-xl",
        border: "border-g6-border-secondary/60",
        borderFooter: "border-g6-border-secondary/40",
        text: "text-g6-text",
        textMuted: "text-g6-text-tertiary",
        textSecondary: "text-g6-text-secondary",
        hoverBg: "hover:bg-g6-bg-spotlight/40",
        hoverText: "hover:text-g6-text",
        activeBg: "bg-g6-primary/15",
        activeText: "text-g6-primary-active",
        activeIconBg: "bg-g6-primary/20",
        activeBar: "bg-g6-primary-active",
        searchBg: "bg-g6-bg-spotlight/30",
        searchBgHover: "hover:bg-g6-bg-spotlight/50",
        chipBg: "bg-g6-bg-spotlight/60",
        chipText: "text-g6-text-tertiary",
        glassOverlay: true,
      } as const;
    }
    return {
      bg: "bg-background/65 backdrop-blur-xl",
      border: "border-border/60",
      borderFooter: "border-border/40",
      text: "text-foreground",
      textMuted: "text-muted-foreground",
      textSecondary: "text-foreground/75",
      hoverBg: "hover:bg-accent/40",
      hoverText: "hover:text-foreground",
      activeBg: "bg-g6-primary/10",
      activeText: "text-g6-primary-active",
      activeIconBg: "bg-g6-primary/15",
      activeBar: "bg-g6-primary-active",
      searchBg: "bg-foreground/[0.04]",
      searchBgHover: "hover:bg-foreground/[0.07]",
      chipBg: "bg-muted-foreground/15",
      chipText: "text-muted-foreground",
      glassOverlay: true,
    } as const;
  }

  // Sections (default) — Genie tokens on Genie routes, content tokens otherwise
  if (isGenieRoute) {
    return {
      bg: "bg-g6-bg-container",
      border: "border-g6-border-secondary",
      borderFooter: "border-g6-border-secondary/60",
      text: "text-g6-text",
      textMuted: "text-g6-text-tertiary",
      textSecondary: "text-g6-text-secondary",
      hoverBg: "hover:bg-g6-bg-spotlight/50",
      hoverText: "hover:text-g6-text",
      activeBg: "bg-g6-primary/10",
      activeText: "text-g6-primary-active",
      activeIconBg: "bg-g6-primary/15",
      activeBar: "bg-g6-primary-active",
      searchBg: "bg-g6-bg-spotlight/40",
      searchBgHover: "hover:bg-g6-bg-spotlight/60",
      chipBg: "bg-g6-bg-spotlight/60",
      chipText: "text-g6-text-tertiary",
      glassOverlay: false,
    } as const;
  }
  return {
    bg: "bg-background",
    border: "border-border",
    borderFooter: "border-border/50",
    text: "text-foreground",
    textMuted: "text-muted-foreground",
    textSecondary: "text-foreground/75",
    hoverBg: "hover:bg-accent/50",
    hoverText: "hover:text-foreground",
    activeBg: "bg-g6-primary/10",
    activeText: "text-g6-primary-active",
    activeIconBg: "bg-g6-primary/15",
    activeBar: "bg-g6-primary-active",
    searchBg: "bg-accent/30",
    searchBgHover: "hover:bg-accent/60",
    chipBg: "bg-muted-foreground/15",
    chipText: "text-muted-foreground",
    glassOverlay: false,
  } as const;
}

/* ─────────────────────────────────────────────────────────
 *  Genie variant toggle — small icon next to the Genie label.
 *  Replaces the inline pill (which was inside Genie sub-menu).
 *  Click cycles studio → canvas → command → modular.
 * ───────────────────────────────────────────────────────── */
const GENIE_VARIANT_META: Record<GenieVariant, { Icon: React.ElementType; label: string }> = {
  studio:  { Icon: Sparkles,   label: "Studio" },
  canvas:  { Icon: Maximize2,  label: "Canvas" },
  command: { Icon: Terminal,   label: "Command" },
  modular: { Icon: Grid3x3,    label: "Modular" },
};
const GENIE_CYCLE: GenieVariant[] = ["studio", "canvas", "command", "modular"];

function GenieVariantIconToggle({ tokens }: { tokens: NavTokens }) {
  const { variant, setVariant } = useGenie6Theme();
  const { Icon, label } = GENIE_VARIANT_META[variant];
  const nextIdx = (GENIE_CYCLE.indexOf(variant) + 1) % GENIE_CYCLE.length;
  const nextLabel = GENIE_VARIANT_META[GENIE_CYCLE[nextIdx]].label;

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setVariant(GENIE_CYCLE[nextIdx]);
          }}
          aria-label={`Genie variant: ${label}. Click to switch to ${nextLabel}.`}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded shrink-0 transition-colors",
            tokens.textMuted,
            tokens.hoverBg,
            tokens.hoverText
          )}
        >
          <Icon className="h-3 w-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        Genie · {label} → {nextLabel}
      </TooltipContent>
    </Tooltip>
  );
}

/* ─────────────────────────────────────────────────────────
 *  Sub-item row — dot indicator (lime when active, dim otherwise)
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
          active ? tokens.activeBar : "bg-current opacity-25"
        )}
      />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className={cn("text-[9px] font-medium uppercase tracking-wider rounded px-1.5 py-0.5 shrink-0", tokens.chipBg, tokens.chipText)}>
          {item.badge}
        </span>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
 *  Module row (expanded) — accordion parent
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
  const isGenie = mod.key === "genie";

  const handleClick = () => {
    if (!hasChildren) onNavigate(mod.path!);
    else onToggle();
  };

  const siblingPaths = allSubPaths(mod);

  return (
    <div className="relative group/row">
      {isActive && (
        <span className={cn("absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r", tokens.activeBar)} />
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
        {/* Genie variant icon toggle next to the label (replaces the inline pill) */}
        {isGenie && <GenieVariantIconToggle tokens={tokens} />}
        {mod.comingSoon && (
          <span className={cn("text-[9px] font-medium uppercase tracking-wider rounded px-1.5 py-0.5 shrink-0", tokens.chipBg, tokens.chipText)}>
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
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 opacity-0 group-hover/row:opacity-60 transition-opacity",
              tokens.textMuted
            )}
          />
        )}
      </button>

      {hasChildren && isOpen && (
        <div className="mt-0.5 mb-1 flex flex-col gap-0.5 overflow-visible">
          {/* Genie special: New-gen CTA only (variant pill removed — moved to icon toggle next to title) */}
          {isGenie && (
            <div className="px-3 py-1">
              <Genie6SubnavNewGenButton />
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
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 *  Module icon (collapsed) — hover popover for sub-items
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
 *  Search field — opens Cmd+K palette on click or focus
 * ───────────────────────────────────────────────────────── */
function SearchField({ tokens }: { tokens: NavTokens }) {
  return (
    <button
      type="button"
      onClick={openPalette}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 transition-colors",
        tokens.searchBg,
        tokens.searchBgHover
      )}
    >
      <Search className={cn("h-3.5 w-3.5 shrink-0", tokens.textMuted)} />
      <span className={cn("flex-1 text-left text-[12px]", tokens.textMuted)}>
        Search
      </span>
      <kbd className={cn("ml-auto text-[10px] font-mono rounded px-1.5 py-0.5", tokens.chipBg, tokens.textMuted)}>
        ⌘K
      </kbd>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
 *  Logo — variant cycler. Click cycles, Shift+Click opens picker.
 *  Variant index badge shown top-right (notification-style).
 * ───────────────────────────────────────────────────────── */
function LogoCycler({
  isDark,
  collapsed,
  tokens,
}: {
  isDark: boolean;
  collapsed: boolean;
  tokens: NavTokens;
}) {
  const { variant, cycle } = useFabAdsNavVariant();
  const [pickerOpen, setPickerOpen] = useState(false);
  const meta = VARIANT_META[variant];
  const totalVariants = Object.keys(VARIANT_META).length;
  const tooltipText = `Click: cycle · Shift+Click: pick · ${meta.label} (${meta.index}/${totalVariants})`;

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      e.preventDefault();
      setPickerOpen(true);
    } else {
      cycle();
    }
  };

  const trigger = (
    <button
      type="button"
      onClick={handleClick}
      aria-label={tooltipText}
      title={tooltipText}
      className={cn(
        "relative flex items-center gap-2 rounded-md transition-colors",
        tokens.text,
        collapsed ? "p-1" : "px-1 py-0.5",
        tokens.hoverBg
      )}
    >
      <div className="relative shrink-0">
        <img
          src={isDark ? faviconDark : faviconLight}
          alt="FabAds"
          className="h-6 w-6"
        />
        {/* Variant index badge — minimal lime dot in top-right corner.
            No ring (per crit P2#6); the lime contrast carries on its own. */}
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold leading-none bg-g6-primary text-g6-text-on-accent">
          {meta.index}
        </span>
      </div>
      {!collapsed && (
        <span className="text-sm font-semibold tracking-tight">FabAds</span>
      )}
    </button>
  );

  return (
    <NavVariantPicker
      open={pickerOpen}
      onOpenChange={setPickerOpen}
      trigger={trigger}
    />
  );
}

/* ─────────────────────────────────────────────────────────
 *  Main — AppSidebar
 * ───────────────────────────────────────────────────────── */
export function AppSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const isGenieRoute = pathname.startsWith("/iq/genie6");
  const { variant } = useFabAdsNavVariant();
  const tokens = getTokens(variant, isGenieRoute);

  const activeKey = deriveActiveModule(pathname);
  const { collapsed, toggle: toggleCollapsed } = useNavCollapsed();

  const [openKeys, setOpenKeys] = useState<Set<string>>(() => {
    return activeKey ? new Set([activeKey]) : new Set();
  });

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
      data-fabads-nav-variant={variant}
      className={cn(
        "relative hidden md:flex h-screen flex-shrink-0 flex-col border-r transition-[width] duration-200 ease-out",
        tokens.bg,
        tokens.border,
        collapsed ? "w-[60px]" : "w-[240px]"
      )}
    >
      {/* Glass gradient overlay layer (Glass variant only) — lime-to-transparent
          gradient sitting above the bg blur but behind all content. Pointer-
          events disabled so it never intercepts clicks. */}
      {tokens.glassOverlay && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(195,235,66,0.08)_0%,rgba(195,235,66,0.02)_45%,transparent_100%)]"
        />
      )}

      {/* Header — logo cycler + collapse toggle. No border-b: spacing alone
          separates from the search field below (per ui-ux-pro-max crit P1#1). */}
      <div
        className={cn(
          "relative z-10 flex items-center h-12 shrink-0",
          collapsed ? "justify-center px-0" : "justify-between px-3"
        )}
      >
        <LogoCycler isDark={isDark} collapsed={collapsed} tokens={tokens} />
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

      {/* Search field — only when expanded; collapsed mode skips it (Cmd+K still works globally) */}
      {!collapsed && (
        <div className="relative z-10 px-2 pt-2 pb-1 shrink-0">
          <SearchField tokens={tokens} />
        </div>
      )}

      {/* Body */}
      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto py-2">
        {collapsed ? (
          <div className="flex flex-col items-center gap-0.5 px-2">
            {groups.map(({ group, modules }, gi) =>
              modules.length === 0 ? null : (
                <div key={group} className="flex flex-col items-center gap-0.5 w-full">
                  {/* Whitespace gap between groups (no line — per crit P2#5) */}
                  {gi > 0 && <div className="h-3" />}
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

      {/* Footer dock — single thin border-t, inherits aside bg (per crit P1#3) */}
      <div className={cn("relative z-10 border-t shrink-0", tokens.borderFooter)}>
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
