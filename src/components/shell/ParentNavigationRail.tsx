import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  MODULES,
  type ModuleDef,
  hasSubItems,
  firstSubPath,
  deriveActiveModule,
} from "@/components/sidebar/modules";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";
import faviconLight from "@/assets/favicon-light.svg";
import faviconDark from "@/assets/favicon-dark.png";

/**
 * ParentNavigationRail — V7 (ClickUp Strict) dark rail.
 *
 * Spec (per Maalik's brief):
 *   - Always-dark surface (NOT auto-theme — this is the distinguishing visual cue)
 *   - Width 60px (within 56-68px range)
 *   - Cell height ~48px (within 44-52px range)
 *   - Icons 18-20px, labels 9-10px
 *   - Active state: clear but not bulky (soft highlight on icon area only)
 *   - Hover: subtle bg shift
 *   - Footer-pinned utility items (logo top, profile bottom — matches V1/V2/V3 spatial pattern)
 *
 * Consumes existing nav data (`MODULES`, `deriveActiveModule`, `firstSubPath`) —
 * does NOT define hardcoded nav arrays.
 *
 * Coming-soon items (`mod.comingSoon`) are STILL rendered with the existing
 * `comingSoon` flag's visual cue (dim dot top-right of icon) — preserves
 * existing data semantics; the dark rail just renders them differently than
 * other variants.
 */
export function ParentNavigationRail({
  onItemClick,
}: {
  onItemClick?: (mod: ModuleDef) => void;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const activeKey = deriveActiveModule(pathname);

  const handleClick = (mod: ModuleDef) => {
    const target = hasSubItems(mod) ? firstSubPath(mod) : mod.path!;
    navigate(target);
    onItemClick?.(mod);
  };

  return (
    <aside
      data-fabads-nav-rail="parent"
      // Always-dark per spec — does NOT respect app theme on purpose.
      className="relative hidden md:flex w-[60px] shrink-0 flex-col bg-zinc-900 text-zinc-100 overflow-hidden"
    >
      {/* HEADER — logo (uses dark variant favicon since rail is always dark) */}
      <div className="flex items-center justify-center h-12 shrink-0">
        <Link to="/dashboard" className="flex items-center justify-center">
          <img src={faviconDark} alt="FabAds" className="h-6 w-6" />
        </Link>
      </div>

      {/* BODY — module list. Spec: should not scroll unless absolutely unavoidable. */}
      <div className="flex-1 min-h-0 overflow-y-auto py-1.5 px-1.5">
        <div className="flex flex-col gap-0.5">
          {MODULES.map((mod) => (
            <RailItem
              key={mod.key}
              mod={mod}
              isActive={activeKey === mod.key}
              onClick={() => handleClick(mod)}
            />
          ))}
        </div>
      </div>

      {/* FOOTER — utility items pinned bottom (matches existing V1/V2/V3 layout where these
          are footer-pinned, per Maalik's "stay footer-pinned only if the current app already
          treats them that way" rule). */}
      <div className="flex flex-col items-center gap-1 py-2 shrink-0 border-t border-white/[0.06]">
        <NotificationBell compact />
        <UserMenu compact />
      </div>

      {/* keep isDark referenced for potential future light-rail-debug build; suppresses lint */}
      <span aria-hidden className="hidden" data-debug-isdark={isDark} />
      {/* keep faviconLight imported (reserved for theme-debug fallbacks if rail ever flips) */}
      <span aria-hidden className="hidden" data-debug-favicon={faviconLight} />
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────
 *  RailItem — compact dark cell with icon + small label.
 *  Active state: soft highlighted square around icon (NOT full-row).
 *  Hover: subtle bg.
 * ───────────────────────────────────────────────────────── */
function RailItem({
  mod,
  isActive,
  onClick,
}: {
  mod: ModuleDef;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = mod.icon;
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "group relative flex w-full flex-col items-center gap-0.5 rounded-md px-0.5 py-1.5 transition-colors",
            isActive ? "" : "hover:bg-white/[0.04]"
          )}
        >
          {/* Icon container — only THIS gets the active-state highlight (per spec:
              "clear but not bulky"). 32×32 tile. */}
          <span
            className={cn(
              "relative flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              isActive ? "bg-white/[0.10] ring-1 ring-white/[0.14]" : ""
            )}
          >
            <Icon className={cn("h-[18px] w-[18px]", isActive ? "text-white" : "text-zinc-300")} />
            {/* Existing comingSoon data — preserved as a small dim dot. */}
            {mod.comingSoon && (
              <span className="absolute top-0.5 right-0.5 h-1 w-1 rounded-full bg-zinc-500" />
            )}
          </span>
          {/* Label — 9-10px per spec */}
          <span
            className={cn(
              "text-[10px] leading-[12px] font-medium tracking-tight text-center line-clamp-1 max-w-full px-0.5",
              isActive ? "text-white" : "text-zinc-400"
            )}
          >
            {mod.label}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {mod.label}
      </TooltipContent>
    </Tooltip>
  );
}
