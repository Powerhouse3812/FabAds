import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  MODULES,
  MODULE_GROUPS,
  type ModuleDef,
  hasSubItems,
  firstSubPath,
  deriveActiveModule,
} from "@/components/sidebar/modules";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";
import faviconDark from "@/assets/favicon-dark.png";

/**
 * ParentNavigationRail — V7 ClickUp Strict (iter-6 A-10.4 update).
 *
 * Pattern 3+4 combined per Maalik:
 *   - Tiny-stacked layout: 24px icon + 8px label, ~36px cell height
 *   - Tools group → "More" overflow popover at the bottom of the body
 *   - Result: 8 primary modules + 1 "More" icon ≈ 320px body, fits without scroll
 *
 * Floating shape (m-2 + rounded-2xl + shadow-2xl), brand-gradient glass
 * (deep dark + subtle lime accent at top), Apple-glass top-edge specular,
 * thin elegant logo divider — all preserved from A-10.3.
 *
 * Always-dark — does NOT respect app theme.
 */
export function ParentNavigationRail() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeKey = deriveActiveModule(pathname);

  // Split MODULES: primary (RUN + CREATE) shown in rail, TOOLS overflow into popover.
  const primary = MODULES.filter((m) => MODULE_GROUPS[m.key] !== "TOOLS");
  const overflow = MODULES.filter((m) => MODULE_GROUPS[m.key] === "TOOLS");
  const overflowActive = overflow.some((m) => m.key === activeKey);

  const handleClick = (mod: ModuleDef) => {
    const target = hasSubItems(mod) ? firstSubPath(mod) : mod.path!;
    navigate(target);
  };

  return (
    <aside
      data-fabads-nav-rail="parent"
      className={cn(
        "relative hidden md:flex w-[64px] shrink-0 flex-col overflow-hidden",
        "my-2 ml-2 mr-1 rounded-2xl shadow-2xl",
        "h-[calc(100vh-1rem)]",
        // Brand-gradient glass — deep dark + subtle lime sheen.
        "bg-[linear-gradient(180deg,#0f1422_0%,#0a0f1c_45%,#0c1018_100%)]",
        "ring-1 ring-white/[0.06]",
        "text-zinc-100"
      )}
    >
      {/* Top-edge highlight — Apple-glass specular cue */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_50%,transparent_100%)]"
      />
      {/* Subtle lime accent overlay (brand cue) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_120px_60px_at_50%_0%,rgba(195,235,66,0.08),transparent_70%)]"
      />

      {/* HEADER — logo */}
      <div className="relative z-10 flex items-center justify-center h-12 shrink-0">
        <Link to="/dashboard" className="flex items-center justify-center">
          <img src={faviconDark} alt="FabAds" className="h-6 w-6" />
        </Link>
      </div>

      {/* Logo → rail subtle divider */}
      <div className="relative z-10 mx-3 shrink-0">
        <div className="h-px bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.10)_50%,transparent_100%)]" />
      </div>

      {/* BODY — primary modules (tiny-stacked) + Tools overflow */}
      <div className="relative z-10 flex-1 min-h-0 py-2 px-1.5 flex flex-col">
        <div className="flex flex-col gap-0.5">
          {primary.map((mod) => (
            <RailItem
              key={mod.key}
              mod={mod}
              isActive={activeKey === mod.key}
              onClick={() => handleClick(mod)}
            />
          ))}
        </div>

        {/* Spacer pushes "More" toward the bottom of the body */}
        <div className="flex-1" />

        {/* Tools → "More" overflow popover */}
        {overflow.length > 0 && (
          <MoreOverflow
            items={overflow}
            isActive={overflowActive}
            activeKey={activeKey}
            onPick={handleClick}
          />
        )}
      </div>

      {/* FOOTER — utility items pinned bottom */}
      <div className="relative z-10 flex flex-col items-center gap-1 py-2 shrink-0 border-t border-white/[0.06]">
        <NotificationBell compact />
        <UserMenu compact />
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────
 *  RailItem — Pattern 4: tiny-stacked icon + label.
 *  ~36px tall cell. Active state: soft icon-tile bg + label color shift.
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
            "group relative flex w-full flex-col items-center gap-0.5 rounded-md px-0.5 py-1 transition-colors",
            isActive ? "" : "hover:bg-white/[0.04]"
          )}
        >
          <span
            className={cn(
              "relative flex h-6 w-6 items-center justify-center rounded transition-colors",
              isActive ? "bg-white/[0.10] ring-1 ring-white/[0.14]" : ""
            )}
          >
            <Icon className={cn("h-[14px] w-[14px]", isActive ? "text-white" : "text-zinc-300")} />
            {mod.comingSoon && (
              <span className="absolute -top-0.5 -right-0.5 h-1 w-1 rounded-full bg-zinc-500" />
            )}
          </span>
          <span
            className={cn(
              "text-[8.5px] leading-[10px] font-medium tracking-tight text-center line-clamp-1 max-w-full px-0.5 mt-0.5",
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

/* ─────────────────────────────────────────────────────────
 *  MoreOverflow — Pattern 3: TOOLS group collapsed into a popover
 *  triggered by a "More" icon. Active when any Tools module is current.
 * ───────────────────────────────────────────────────────── */
function MoreOverflow({
  items,
  isActive,
  activeKey,
  onPick,
}: {
  items: ModuleDef[];
  isActive: boolean;
  activeKey: string | null;
  onPick: (mod: ModuleDef) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "group relative flex w-full flex-col items-center gap-0.5 rounded-md px-0.5 py-1 transition-colors mt-1",
            "hover:bg-white/[0.04]"
          )}
        >
          <span
            className={cn(
              "relative flex h-6 w-6 items-center justify-center rounded transition-colors",
              isActive ? "bg-white/[0.10] ring-1 ring-white/[0.14]" : ""
            )}
          >
            <MoreHorizontal className={cn("h-[14px] w-[14px]", isActive ? "text-white" : "text-zinc-300")} />
          </span>
          <span
            className={cn(
              "text-[8.5px] leading-[10px] font-medium tracking-tight text-center line-clamp-1 max-w-full px-0.5 mt-0.5",
              isActive ? "text-white" : "text-zinc-400"
            )}
          >
            More
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="end"
        sideOffset={8}
        className="w-52 p-1 bg-zinc-50 border-zinc-200/80"
      >
        <div className="px-2 py-1.5 mb-1 border-b border-zinc-200/70">
          <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Tools
          </p>
        </div>
        <div className="flex flex-col gap-0.5">
          {items.map((mod) => {
            const Icon = mod.icon;
            const active = activeKey === mod.key;
            return (
              <button
                key={mod.key}
                type="button"
                onClick={() => {
                  onPick(mod);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-left transition-colors",
                  active
                    ? "bg-zinc-900/[0.06] text-zinc-900 font-medium"
                    : "text-zinc-700 hover:bg-zinc-900/[0.04] hover:text-zinc-900"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                <span className="flex-1 truncate">{mod.label}</span>
                {mod.comingSoon && (
                  <span className="text-[9px] font-medium uppercase tracking-wider rounded px-1.5 py-0.5 bg-zinc-900/[0.06] text-zinc-500">
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
