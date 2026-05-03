import { Link, useNavigate, useLocation } from "react-router-dom";
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
import faviconDark from "@/assets/favicon-dark.png";

/**
 * ParentNavigationRail — V7 ClickUp Strict (iter-6 A-10.3 update).
 *
 * Floating dark glass rail per Maalik's brief:
 *   - m-2 margin + rounded-2xl + soft shadow → independent surface, gap from panel
 *   - Brand-gradient glass: deep navy → lime-tinted bottom, top-edge highlight
 *   - Logo top + thin elegant divider + module list + footer-pinned utilities
 *   - Width 60px, cell ~52px (relaxed spacing — was bhari-bhari per Maalik)
 *   - Always-dark (does NOT respect app theme)
 */
export function ParentNavigationRail() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeKey = deriveActiveModule(pathname);

  const handleClick = (mod: ModuleDef) => {
    const target = hasSubItems(mod) ? firstSubPath(mod) : mod.path!;
    navigate(target);
  };

  return (
    <aside
      data-fabads-nav-rail="parent"
      // Floating shape: margin + rounded + shadow. Always-dark glass surface
      // with brand-color gradient + top-edge highlight (Apple-glass cue).
      className={cn(
        "relative hidden md:flex w-[60px] shrink-0 flex-col overflow-hidden",
        "my-2 ml-2 mr-1 rounded-2xl shadow-2xl",
        "h-[calc(100vh-1rem)]",
        // Brand-gradient glass: deep navy → subtle lime-tinted dark, with a
        // hint of lime at the top edge and bottom for warmth + brand presence.
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
      {/* Subtle lime accent overlay near the top (brand cue without overpowering) */}
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

      {/* Subtle elegant divider between logo and module rail */}
      <div className="relative z-10 mx-3 shrink-0">
        <div className="h-px bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.10)_50%,transparent_100%)]" />
      </div>

      {/* BODY — module list. Relaxed spacing per Maalik's "phle wali spacing achhi thi". */}
      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto py-2 px-1.5">
        <div className="flex flex-col gap-1">
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

      {/* FOOTER — utility items pinned bottom */}
      <div className="relative z-10 flex flex-col items-center gap-1 py-2 shrink-0 border-t border-white/[0.06]">
        <NotificationBell compact />
        <UserMenu compact />
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────
 *  RailItem — relaxed spacing, soft active highlight on icon tile.
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
            "group relative flex w-full flex-col items-center gap-1 rounded-lg px-0.5 py-2 transition-colors",
            isActive ? "" : "hover:bg-white/[0.04]"
          )}
        >
          <span
            className={cn(
              "relative flex h-8 w-8 items-center justify-center rounded-md transition-colors",
              isActive ? "bg-white/[0.10] ring-1 ring-white/[0.14]" : ""
            )}
          >
            <Icon className={cn("h-[18px] w-[18px]", isActive ? "text-white" : "text-zinc-300")} />
            {mod.comingSoon && (
              <span className="absolute top-0.5 right-0.5 h-1 w-1 rounded-full bg-zinc-500" />
            )}
          </span>
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
