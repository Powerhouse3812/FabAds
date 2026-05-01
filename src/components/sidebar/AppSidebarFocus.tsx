import { useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { Genie6SubnavNewGenButton } from "@/genie6/shell/Genie6SubnavNewGenButton";
import { useGenie6Theme } from "@/genie6/hooks/useGenie6Theme";
import { NavVariantToggle } from "@/components/sidebar/NavVariantToggle";
import {
  MODULES,
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

/* ------------------------------------------------------------------ *
 *  Focus variant — Claude's from-scratch design (iter-6 A-3)
 * ------------------------------------------------------------------ *
 *  Premise: agency directors spend ~80% of their time in 2–3 modules.
 *  The sidebar should reward focused context — actively foreground
 *  whatever module the user is currently in, demote everything else
 *  to a compact quick-jump strip below.
 *
 *  Layout (220px wide, single pane, no collapse for v1):
 *
 *  ┌────────────────────────────────┐
 *  │ ▥ FabAds                       │  header
 *  ├────────────────────────────────┤
 *  │ ┌─ ACTIVE ───────────────────┐ │
 *  │ │ ▤  Reports                 │ │  active module — large icon + name
 *  │ │ [+ New Gen / variant pill] │ │  (Genie only)
 *  │ │  • FB              [active]│ │  active sub-items, lime active state
 *  │ │  • NB                      │ │
 *  │ │  • TT                      │ │
 *  │ │  • Creative Reporting      │ │
 *  │ └────────────────────────────┘ │
 *  │                                │
 *  │ ── Other ─────                  │  thin separator + label
 *  │  ◫ Dashboard                   │  compact rows for other modules
 *  │  ⚡ Launch                      │  click → jumps to that module's
 *  │  ◎ Industry Insights            │     first sub-path, becomes active
 *  │  ✦ Genie                        │
 *  │  ▦ Catalogue                    │
 *  │  ▣ Creative Library             │
 *  │  ⚙ Automation                   │
 *  │  🔧 Tools                       │
 *  ├────────────────────────────────┤
 *  │ 🔔  ▥(picker)  ⌃ alex@…        │  footer dock
 *  └────────────────────────────────┘
 *
 *  Edge cases handled:
 *   - No active module derived (NotFound page) → render all modules in flat list,
 *     hide the active block.
 *   - Active module without sub-items (Dashboard, Creative Library, Automation)
 *     → show just the module title in active block, no sub-items list.
 *   - Genie active → variant pill + [+ New Generation] CTA inline at top of
 *     the active block, before sub-items.
 * ------------------------------------------------------------------ */

const GENIE_VARIANTS = [
  { key: "studio" as const, label: "Studio" },
  { key: "canvas" as const, label: "Canvas" },
  { key: "command" as const, label: "Command" },
  { key: "modular" as const, label: "Modular" },
];

function GenieVariantPill() {
  const { variant, setVariant } = useGenie6Theme();
  return (
    <div className="flex w-full rounded-full border border-sidebar-border bg-sidebar-accent/20 p-0.5">
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

/* Sub-item row inside the active block. */
function ActiveSubItemRow({
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
        "relative w-full text-left pl-5 pr-3 py-1.5 rounded-md text-[13px] transition-colors flex items-center gap-2",
        active
          ? "bg-g6-primary/10 text-g6-primary-active font-medium"
          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
      )}
    >
      <span
        className={cn(
          "absolute left-2 top-1/2 -translate-y-1/2 h-1 w-1 rounded-full transition-colors",
          active ? "bg-g6-primary-active" : "bg-sidebar-foreground/25"
        )}
      />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground border border-border rounded px-1 py-0.5 shrink-0">
          {item.badge}
        </span>
      )}
    </button>
  );
}

/* Active block — foregrounded current module + its sub-items. */
function ActiveBlock({
  mod,
  pathname,
  onNavigate,
}: {
  mod: ModuleDef;
  pathname: string;
  onNavigate: (path: string) => void;
}) {
  const Icon = mod.icon;
  const siblingPaths = allSubPaths(mod);
  const showGenieExtras = mod.key === "genie";

  return (
    <div className="rounded-lg bg-sidebar-accent/15 border border-sidebar-border p-2">
      {/* Header row: large icon + name */}
      <div className="flex items-center gap-2 px-1.5 pb-2 mb-1 border-b border-sidebar-border/60">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-g6-primary/15 text-g6-primary-active shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-sidebar-foreground/45">
            Active
          </p>
          <p className="text-sm font-semibold text-sidebar-foreground truncate">
            {mod.label}
          </p>
        </div>
      </div>

      {/* Genie special: New-gen CTA + variant pill */}
      {showGenieExtras && (
        <div className="px-1 pb-2 space-y-2">
          <Genie6SubnavNewGenButton />
          <GenieVariantPill />
        </div>
      )}

      {/* Sub-items */}
      {hasSubItems(mod) ? (
        <div className="flex flex-col gap-0.5">
          {mod.subItems?.map((item) => (
            <ActiveSubItemRow
              key={item.path}
              item={item}
              pathname={pathname}
              siblingPaths={siblingPaths}
              onNavigate={onNavigate}
            />
          ))}
          {mod.sections?.map((section) => (
            <div key={section.sectionLabel} className="mt-1.5 first:mt-0">
              <span className="block px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.sectionLabel}
              </span>
              {section.items.map((item) => (
                <ActiveSubItemRow
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
      ) : (
        <p className="px-2 py-1 text-[11px] text-sidebar-foreground/45 italic">
          No sub-pages
        </p>
      )}
    </div>
  );
}

/* Other-module compact row. */
function OtherModuleRow({
  mod,
  onNavigate,
}: {
  mod: ModuleDef;
  onNavigate: (path: string) => void;
}) {
  const Icon = mod.icon;
  const target = hasSubItems(mod) ? firstSubPath(mod) : mod.path!;
  return (
    <Tooltip delayDuration={400}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => onNavigate(target)}
          className="w-full text-left pl-3 pr-2 py-1.5 rounded-md text-[13px] text-sidebar-foreground/65 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground transition-colors flex items-center gap-2.5"
        >
          <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
          <span className="flex-1 truncate">{mod.label}</span>
          {mod.comingSoon && (
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground border border-border rounded px-1 py-0.5 shrink-0">
              Soon
            </span>
          )}
          <ChevronRight className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        Open {mod.label}
      </TooltipContent>
    </Tooltip>
  );
}

/* ------------------------------------------------------------------ */
/*  Main — Focus variant                                               */
/* ------------------------------------------------------------------ */
export function AppSidebarFocus() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const activeKey = deriveActiveModule(pathname);
  const activeMod = activeKey ? MODULES.find((m) => m.key === activeKey) : null;
  const otherMods = MODULES.filter((m) => m.key !== activeKey);

  const handleNavigate = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate]
  );

  return (
    <aside className="hidden md:flex h-screen w-[220px] flex-shrink-0 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-12 shrink-0 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-2 text-sidebar-foreground">
          <img src={isDark ? faviconDark : faviconLight} alt="FabAds" className="h-6 w-6" />
          <span className="text-sm font-semibold tracking-tight">FabAds</span>
        </Link>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-3 space-y-3">
        {activeMod && <ActiveBlock mod={activeMod} pathname={pathname} onNavigate={handleNavigate} />}

        <div>
          <div className="flex items-center gap-2 px-3 pb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-sidebar-foreground/45">
              {activeMod ? "Other modules" : "All modules"}
            </span>
            <div className="flex-1 h-px bg-sidebar-border/60" />
          </div>
          <div className="flex flex-col gap-0.5">
            {otherMods.map((mod) => (
              <OtherModuleRow key={mod.key} mod={mod} onNavigate={handleNavigate} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer dock */}
      <div className="border-t border-sidebar-border bg-sidebar-background shrink-0 px-1.5 py-1.5 flex items-center gap-1">
        <div className="flex-1">
          <UserMenu />
        </div>
        <NavVariantToggle />
        <NotificationBell />
      </div>
    </aside>
  );
}
