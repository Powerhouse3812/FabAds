import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  ChevronRight, ChevronsLeft, ChevronsRight, ChevronsUpDown,
  Search, Sparkles, Maximize2, Terminal, Grid3x3, Lock, ArrowRight,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { useGenie6Theme, type GenieVariant } from "@/genie6/hooks/useGenie6Theme";
import {
  groupedModules,
  type ModuleDef,
  type SubItem,
  hasSubItems,
  allSubPaths,
  deriveActiveModule,
  isSubItemActive,
  MODULE_EXTENSION_KEYS,
} from "@/components/sidebar/modules";
import { brands as sharedBrands } from "@/genie6/mocks/brands";
import { BrandLogo } from "@/genie6/components/BrandLogo";
import { useAuth } from "@/contexts/AuthContext";
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
 *  Chrome flags drive structural decisions:
 *    showChevrons / showSubItemDots / showActiveBar / showModuleIcons
 *
 *  Layout/shape flags:
 *    shape: "flush" | "floating" | "cards"
 *    internalOrbs: render gradient-orb backdrop INSIDE the aside (Glass variants)
 *    glassOverlay: render top-edge highlight + right-edge specular streak
 *    profileBlock: render ProfileBlock at top instead of plain LogoCycler
 *    brandsStrip:  render BrandsRecentStrip after the last group
 *    ctaCard:      render BottomCTACard between body and footer dock
 *
 *  Helper to keep all variants type-unified — every variant exports the same
 *  flag keys; defaults are false unless a variant opts in.
 * ───────────────────────────────────────────────────────── */
type NavShape = "flush" | "floating" | "cards";
type NavTokens = ReturnType<typeof getTokens>;

interface BaseFlags {
  shape: NavShape;
  glassOverlay: boolean;
  internalOrbs: boolean;
  profileBlock: boolean;
  brandsStrip: boolean;
  ctaCard: boolean;
  showChevrons: boolean;
  showSubItemDots: boolean;
  showActiveBar: boolean;
  showModuleIcons: boolean;
}

const FLAG_DEFAULTS: BaseFlags = {
  shape: "flush",
  glassOverlay: false,
  internalOrbs: false,
  profileBlock: false,
  brandsStrip: false,
  ctaCard: false,
  showChevrons: true,
  showSubItemDots: true,
  showActiveBar: true,
  showModuleIcons: true,
};

function getTokens(variant: FabAdsNavVariant, isGenieRoute: boolean) {
  // Dark Always — always-dark + MONOCHROMATIC + STRIPPED chrome.
  if (variant === "darkAlways") {
    return {
      ...FLAG_DEFAULTS,
      bg: "bg-[linear-gradient(180deg,#1a1a1a_0%,#0e0e0e_100%)]",
      cardBg: "bg-[linear-gradient(180deg,#1a1a1a_0%,#0e0e0e_100%)]",
      border: "border-white/[0.06]",
      borderFooter: "border-white/[0.05]",
      text: "text-white/85",
      textMuted: "text-white/35",
      textSecondary: "text-white/55",
      hoverBg: "hover:bg-white/[0.03]",
      hoverText: "hover:text-white",
      activeBg: "bg-transparent",
      activeText: "text-white font-semibold",
      activeIconBg: "bg-white/10",
      activeBar: "bg-transparent",
      searchBg: "bg-white/[0.04]",
      searchBgHover: "hover:bg-white/[0.07]",
      chipBg: "bg-white/[0.06]",
      chipText: "text-white/45",
      // Chrome flags: stripped
      showChevrons: false,
      showSubItemDots: false,
      showActiveBar: false,
      showModuleIcons: true,
    } as const;
  }

  // Glass — Apple subtle frosted glass, FLOATING shape, internal orbs (no body bleed).
  if (variant === "glass") {
    if (isGenieRoute) {
      return {
        ...FLAG_DEFAULTS,
        bg: "bg-white/[0.04]",
        cardBg: "bg-white/[0.05]",
        border: "border-white/[0.08]",
        borderFooter: "border-white/[0.05]",
        text: "text-g6-text",
        textMuted: "text-g6-text-tertiary",
        textSecondary: "text-g6-text-secondary",
        hoverBg: "hover:bg-white/[0.06]",
        hoverText: "hover:text-g6-text",
        activeBg: "bg-g6-primary/15",
        activeText: "text-g6-primary-active",
        activeIconBg: "bg-g6-primary/20",
        activeBar: "bg-g6-primary-active",
        searchBg: "bg-white/[0.06]",
        searchBgHover: "hover:bg-white/[0.10]",
        chipBg: "bg-white/[0.08]",
        chipText: "text-g6-text-tertiary",
        shape: "floating" as const,
        glassOverlay: true,
        internalOrbs: true,
      } as const;
    }
    return {
      ...FLAG_DEFAULTS,
      bg: "bg-white/40 dark:bg-white/[0.04]",
      cardBg: "bg-white/50 dark:bg-white/[0.05]",
      border: "border-white/40 dark:border-white/[0.08]",
      borderFooter: "border-white/30 dark:border-white/[0.05]",
      text: "text-foreground",
      textMuted: "text-muted-foreground",
      textSecondary: "text-foreground/75",
      hoverBg: "hover:bg-white/30 dark:hover:bg-white/[0.06]",
      hoverText: "hover:text-foreground",
      activeBg: "bg-g6-primary/15",
      activeText: "text-g6-primary-active",
      activeIconBg: "bg-g6-primary/20",
      activeBar: "bg-g6-primary-active",
      searchBg: "bg-white/40 dark:bg-white/[0.06]",
      searchBgHover: "hover:bg-white/60 dark:hover:bg-white/[0.10]",
      chipBg: "bg-white/40 dark:bg-white/[0.08]",
      chipText: "text-muted-foreground",
      shape: "floating" as const,
      glassOverlay: true,
      internalOrbs: true,
    } as const;
  }

  // Workbench — discrete cards per group.
  if (variant === "workbench") {
    if (isGenieRoute) {
      return {
        ...FLAG_DEFAULTS,
        bg: "bg-g6-bg-base",
        cardBg: "bg-g6-bg-container",
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
        shape: "cards" as const,
      } as const;
    }
    return {
      ...FLAG_DEFAULTS,
      bg: "bg-muted/30",
      cardBg: "bg-background",
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
      searchBg: "bg-background",
      searchBgHover: "hover:bg-accent/30",
      chipBg: "bg-muted-foreground/15",
      chipText: "text-muted-foreground",
      shape: "cards" as const,
    } as const;
  }

  // V5 Glass Dark — deep navy gradient + profile + brands strip + CTA card.
  // Dramatic / cinematic. Always-dark regardless of theme.
  if (variant === "glassDark") {
    return {
      ...FLAG_DEFAULTS,
      bg: "bg-[linear-gradient(180deg,#0e1024_0%,#1a1d3a_50%,#080919_100%)]",
      cardBg: "bg-white/[0.04]",
      border: "border-white/[0.08]",
      borderFooter: "border-white/[0.06]",
      text: "text-white/90",
      textMuted: "text-white/40",
      textSecondary: "text-white/65",
      hoverBg: "hover:bg-white/[0.05]",
      hoverText: "hover:text-white",
      activeBg: "bg-white/[0.10]",
      activeText: "text-white font-medium",
      activeIconBg: "bg-white/[0.14]",
      activeBar: "bg-white/80",
      searchBg: "bg-white/[0.06]",
      searchBgHover: "hover:bg-white/[0.10]",
      chipBg: "bg-white/[0.08]",
      chipText: "text-white/55",
      shape: "floating" as const,
      glassOverlay: true,
      internalOrbs: true,
      profileBlock: true,
      brandsStrip: true,
      ctaCard: true,
    } as const;
  }

  // V6 Glass Light — soft warm cream/pink frosty glass + profile + brands + CTA.
  // Always-light regardless of theme.
  if (variant === "glassLight") {
    return {
      ...FLAG_DEFAULTS,
      bg: "bg-[linear-gradient(180deg,#fdf6f3_0%,#f5e6df_50%,#f0e7e3_100%)]",
      cardBg: "bg-white/55",
      border: "border-black/[0.06]",
      borderFooter: "border-black/[0.05]",
      text: "text-zinc-900",
      textMuted: "text-zinc-500",
      textSecondary: "text-zinc-700",
      hoverBg: "hover:bg-white/50",
      hoverText: "hover:text-zinc-900",
      activeBg: "bg-white/70",
      activeText: "text-zinc-900 font-medium",
      activeIconBg: "bg-white/80",
      activeBar: "bg-g6-primary-active",
      searchBg: "bg-white/50",
      searchBgHover: "hover:bg-white/70",
      chipBg: "bg-white/60",
      chipText: "text-zinc-600",
      shape: "floating" as const,
      glassOverlay: true,
      internalOrbs: true,
      profileBlock: true,
      brandsStrip: true,
      ctaCard: true,
    } as const;
  }

  // Sections (default).
  if (isGenieRoute) {
    return {
      ...FLAG_DEFAULTS,
      bg: "bg-g6-bg-container",
      cardBg: "bg-g6-bg-container",
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
    } as const;
  }
  return {
    ...FLAG_DEFAULTS,
    bg: "bg-background",
    cardBg: "bg-background",
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
        "relative w-full text-left pr-3 py-1.5 rounded-md text-[13px] transition-colors flex items-center gap-2",
        // Indent: more when dots are shown, less when stripped (mono variant)
        tokens.showSubItemDots ? "pl-9" : "pl-6",
        active
          ? cn(tokens.activeBg, tokens.activeText, "font-medium tracking-[0.01em]")
          : cn(tokens.textSecondary, tokens.hoverBg, tokens.hoverText)
      )}
    >
      {tokens.showSubItemDots && (
        <span
          className={cn(
            "absolute left-5 top-1/2 -translate-y-1/2 h-1 w-1 rounded-full transition-colors",
            active ? tokens.activeBar : "bg-current opacity-25"
          )}
        />
      )}
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
  isExtension,
}: {
  mod: ModuleDef;
  isActive: boolean;
  isOpen: boolean;
  pathname: string;
  onToggle: () => void;
  onNavigate: (path: string) => void;
  tokens: NavTokens;
  isExtension?: boolean;
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
      {/* Active left-edge bar (suppressed by chrome flag for Mono) */}
      {isActive && tokens.showActiveBar && (
        <span className={cn("absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r", tokens.activeBar)} />
      )}
      <button
        type="button"
        onClick={handleClick}
        aria-expanded={hasChildren ? isOpen : undefined}
        className={cn(
          "w-full text-left pl-3 pr-2.5 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2.5",
          isActive
            ? cn(tokens.activeBg, tokens.activeText)
            : cn(tokens.text, "opacity-80", tokens.hoverBg, tokens.hoverText, "hover:opacity-100")
        )}
      >
        {tokens.showModuleIcons && <Icon className="h-4 w-4 shrink-0" />}
        <span className="flex-1 truncate">{mod.label}</span>
        {/* Extension marker (lock icon) — Industry Insights in V2 Dark Always */}
        {isExtension && (
          <Lock className={cn("h-3 w-3 shrink-0", tokens.textMuted)} aria-label="Extension — upgrade required" />
        )}
        {/* Genie variant icon toggle next to the label (replaces the inline pill) */}
        {isGenie && <GenieVariantIconToggle tokens={tokens} />}
        {mod.comingSoon && (
          <span className={cn("text-[9px] font-medium uppercase tracking-wider rounded px-1.5 py-0.5 shrink-0", tokens.chipBg, tokens.chipText)}>
            Soon
          </span>
        )}
        {/* Chevrons (suppressed by chrome flag for Mono) */}
        {tokens.showChevrons && (
          hasChildren ? (
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
          )
        )}
      </button>

      {hasChildren && isOpen && (
        <div className="mt-0.5 mb-1 flex flex-col gap-0.5 overflow-visible">
          {/* iter-6 A-9: dropped the lime [+ New Generation] CTA from Genie sub-nav.
              The new "Studio" sub-item (path /iq/genie6/generate) handles new-gen entry.
              Genie variant icon-toggle stays next to the "Genie" label (above). */}
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
        {/* iter-6 A-9: Genie6SubnavNewGenButton removed here too — the Studio
            sub-item is the new entry-point. */}
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
 *  ProfileBlock — V5/V6 only. Avatar + name + email at top of nav,
 *  in place of the plain LogoCycler header. Logo cycler still works
 *  via a small chevron to the right of the profile (Shift+Click for
 *  picker preserved via the same NavVariantPicker wrapper).
 * ───────────────────────────────────────────────────────── */
function ProfileBlock({
  isDark,
  tokens,
  collapseToggle,
}: {
  isDark: boolean;
  tokens: NavTokens;
  collapseToggle: React.ReactNode;
}) {
  const auth = useAuth();
  const user = auth?.user;
  // Stub for the Maalik-comparison demo. Real auth context is checked first.
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Rahul Saini";
  const displayEmail = user?.email || "rahul@fabads.com";
  // Initials fallback for avatar
  const initials = displayName.split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className={cn("relative z-10 px-3 py-3 shrink-0 flex items-center gap-2.5", tokens.text)}>
      {/* Avatar — initials chip with subtle gradient ring */}
      <div className={cn(
        "shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-[12px] font-semibold",
        tokens.activeIconBg, tokens.text
      )}>
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold tracking-tight truncate">{displayName}</p>
        <p className={cn("text-[11px] truncate", tokens.textMuted)}>{displayEmail}</p>
      </div>
      {/* Logo cycler chevron — keeps the variant cycle functionality compact.
          Sits at the right edge; Shift+Click on this opens the picker. */}
      <div className="shrink-0">
        {collapseToggle}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 *  BrandsRecentStrip — V5/V6 only. Lists the first 6 brands
 *  as colored entity icons + label (mirrors PROJECTS in inspiration).
 *  Click → navigate to /iq/genie6/workspace/brands/:id.
 * ───────────────────────────────────────────────────────── */
function BrandsRecentStrip({
  tokens,
  onNavigate,
}: {
  tokens: NavTokens;
  onNavigate: (path: string) => void;
}) {
  const visibleBrands = sharedBrands.slice(0, 6);
  return (
    <div className="flex flex-col gap-0.5 px-2 pt-2">
      <span className={cn("px-3 pt-2 pb-1 font-mono text-[10px] uppercase tracking-[0.14em]", tokens.textMuted)}>
        Brands
      </span>
      {visibleBrands.map((b) => (
        <button
          key={b.id}
          type="button"
          onClick={() => onNavigate(`/iq/genie6/workspace/brands/${b.id}`)}
          className={cn(
            "w-full text-left pl-3 pr-2.5 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2.5",
            tokens.text, "opacity-85", tokens.hoverBg, tokens.hoverText, "hover:opacity-100"
          )}
        >
          <BrandLogo name={b.name} src={b.logo} tint={b.colors?.[0]} size="h-5 w-5" rounded="rounded-md" />
          <span className="flex-1 truncate">{b.name}</span>
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 *  BottomCTACard — V5/V6 only. Recessed card just above the footer
 *  dock with a primary action. Default content nudges the guided tour.
 * ───────────────────────────────────────────────────────── */
function BottomCTACard({
  tokens,
  onNavigate,
}: {
  tokens: NavTokens;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="relative z-10 px-2 pb-2 shrink-0">
      <div className={cn(
        "rounded-lg border p-3 text-center",
        tokens.cardBg,
        tokens.border
      )}>
        <p className={cn("text-[12px] font-semibold", tokens.text)}>Take the tour</p>
        <p className={cn("text-[11px] mt-0.5 mb-2", tokens.textMuted)}>
          12-stop walkthrough of Genie
        </p>
        <button
          type="button"
          onClick={() => onNavigate("/iq/genie6/wizard")}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-g6-primary px-3 py-1.5 text-[12px] font-semibold text-g6-text-on-accent hover:bg-g6-primary-hover transition-colors"
        >
          Start <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
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

  // V2 Dark Always uses a different group order (Industry Insights → EXTENSIONS).
  const groups = groupedModules(variant);

  // Outer shape per variant.
  //  - flush:    full-height, edge-to-edge, border-r only
  //  - floating: detached panel — m-2 margin, rounded-2xl, soft shadow, no border-r
  //  - cards:    flush container BUT body renders cards-per-group (handled in body)
  const isFloating = tokens.shape === "floating";
  const isCards = tokens.shape === "cards";

  // Width per variant. New glass variants get extra width to fit the profile
  // block + brands strip + CTA card without cramping.
  const expandedWidth =
    variant === "glassDark" || variant === "glassLight"
      ? "w-[264px]"
      : isCards
        ? "w-[260px]"
        : isFloating
          ? "w-[244px]"
          : "w-[240px]";

  return (
    <aside
      data-fabads-nav-variant={variant}
      className={cn(
        "relative hidden md:flex flex-shrink-0 flex-col transition-[width] duration-200 ease-out overflow-hidden",
        tokens.bg,
        // Floating: detach with margin + rounded + shadow, NO border-r
        isFloating
          ? cn(
              "my-2 ml-2 mr-1 rounded-2xl shadow-2xl border",
              tokens.border,
              "h-[calc(100vh-1rem)]"
            )
          : cn("h-screen border-r", tokens.border),
        collapsed ? "w-[60px]" : expandedWidth
      )}
    >
      {/* Internal gradient orbs (Glass variants). Renders INSIDE the aside at
          z:0 so the parent's overflow-hidden clips them — no bleed-as-shadow
          outside the panel (the bug from A-7). The blur plate (next layer)
          sits above and applies backdrop-blur, smearing these orbs into the
          visible glass effect. */}
      {tokens.internalOrbs && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 z-0",
            // Per-variant orb palette
            variant === "glassDark"
              ? "bg-[radial-gradient(ellipse_220px_380px_at_25%_18%,rgba(99,102,241,0.30),transparent_60%),radial-gradient(ellipse_200px_340px_at_75%_55%,rgba(217,70,239,0.22),transparent_60%),radial-gradient(ellipse_180px_280px_at_30%_92%,rgba(195,235,66,0.18),transparent_60%)]"
              : variant === "glassLight"
                ? "bg-[radial-gradient(ellipse_220px_380px_at_30%_18%,rgba(255,178,148,0.55),transparent_65%),radial-gradient(ellipse_200px_320px_at_72%_50%,rgba(244,114,182,0.40),transparent_65%),radial-gradient(ellipse_180px_280px_at_25%_92%,rgba(251,191,36,0.30),transparent_65%)]"
                : // V3 glass — auto-theme subtle lime + warm
                  "bg-[radial-gradient(ellipse_220px_380px_at_30%_18%,rgba(195,235,66,0.18),transparent_65%),radial-gradient(ellipse_200px_320px_at_75%_55%,rgba(195,235,66,0.10),transparent_65%),radial-gradient(ellipse_180px_280px_at_25%_92%,rgba(255,178,148,0.12),transparent_65%)] dark:bg-[radial-gradient(ellipse_220px_380px_at_30%_18%,rgba(195,235,66,0.30),transparent_65%),radial-gradient(ellipse_200px_320px_at_75%_55%,rgba(168,85,247,0.20),transparent_65%),radial-gradient(ellipse_180px_280px_at_25%_92%,rgba(251,146,60,0.18),transparent_65%)]"
          )}
        />
      )}

      {/* Blur plate — sits at z:1 above orbs but BELOW content. Backdrop-filter
          captures the orbs (which are below in stacking order) and smears them.
          This is what produces the actual visible glass effect. */}
      {tokens.internalOrbs && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1] backdrop-blur-2xl backdrop-saturate-150"
        />
      )}

      {/* Glass overlay layers (Glass variants). Stacked above blur plate.
          Order: top-edge highlight → lime/brand gradient → right-edge specular.
          All pointer-events disabled. */}
      {tokens.glassOverlay && (
        <>
          {/* Bright top-edge highlight — simulates light catching the glass.
              Strongest at the top 80px, fades out by 30%. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(255,255,255,0.35)_0%,rgba(255,255,255,0.08)_40%,transparent_100%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_40%,transparent_100%)]"
          />
          {/* Lime brand gradient — subtle, full-height. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(195,235,66,0.10)_0%,rgba(195,235,66,0.04)_45%,transparent_100%)]"
          />
          {/* Right-edge specular line — barely visible bright streak that
              suggests a glass edge meeting content. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-[1px] bg-[linear-gradient(180deg,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0.15)_30%,transparent_100%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.04)_30%,transparent_100%)]"
          />
        </>
      )}

      {/* Header — V5/V6 use ProfileBlock; others use the LogoCycler+collapse-toggle row. */}
      {tokens.profileBlock && !collapsed ? (
        <ProfileBlock
          isDark={isDark}
          tokens={tokens}
          collapseToggle={
            <Tooltip delayDuration={400}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  aria-label="Collapse sidebar"
                  className={cn("p-1 rounded-md transition-colors", tokens.textMuted, tokens.hoverBg, tokens.hoverText)}
                >
                  <ChevronsUpDown className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Collapse · ⌘B</TooltipContent>
            </Tooltip>
          }
        />
      ) : (
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
      )}

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
        ) : isCards ? (
          /* WORKBENCH — each group is a discrete card with gap between */
          <div className="flex flex-col gap-2 px-2">
            {groups.map(({ group, modules }) =>
              modules.length === 0 ? null : (
                <div
                  key={group}
                  className={cn(
                    "rounded-lg border p-1.5",
                    tokens.cardBg,
                    tokens.border
                  )}
                >
                  <span className={cn("block px-2.5 pt-1.5 pb-1.5 font-mono text-[10px] uppercase tracking-[0.14em]", tokens.textMuted)}>
                    {group}
                  </span>
                  <div className="flex flex-col gap-0.5">
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
                        isExtension={variant === "darkAlways" && MODULE_EXTENSION_KEYS.has(mod.key)}
                      />
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          /* SECTIONS / DARK ALWAYS / GLASS — flat sectioned list */
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
                      isExtension={variant === "darkAlways" && MODULE_EXTENSION_KEYS.has(mod.key)}
                    />
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* Brands strip (V5/V6) — after the last group, inside scrollable body. */}
        {!collapsed && tokens.brandsStrip && (
          <BrandsRecentStrip tokens={tokens} onNavigate={handleNavigate} />
        )}
      </div>

      {/* Bottom CTA card (V5/V6) — between body scroll and footer dock. */}
      {!collapsed && tokens.ctaCard && (
        <BottomCTACard tokens={tokens} onNavigate={handleNavigate} />
      )}

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
