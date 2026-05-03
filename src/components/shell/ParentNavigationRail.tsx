import { Link, useNavigate, useLocation } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
 * ParentNavigationRail — V7 ClickUp Strict (iter-6 A-10.5).
 *
 * Layout per Maalik:
 *   [Logo] → divider → [Primary 8 modules] → divider → [Tools 4 modules] → footer
 *
 * Tools render INLINE (no "More" overflow popover) with a divider above them
 * matching the logo→menu divider style. Tiny-stacked layout (Pattern 4).
 *
 * BG: true primary-color gradient — lime-tinted dark glass with backdrop-blur
 * + saturate (Apple Liquid Glass cues). Multiple gradient layers for depth.
 *
 * Footer: NotificationBell + UserMenu wrapped in `.dark` so their CSS-var
 * colors resolve to dark-theme values (light icons on dark rail) regardless
 * of app theme.
 */
export function ParentNavigationRail() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeKey = deriveActiveModule(pathname);

  const primary = MODULES.filter((m) => MODULE_GROUPS[m.key] !== "TOOLS");
  const tools = MODULES.filter((m) => MODULE_GROUPS[m.key] === "TOOLS");

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
        // True primary-color (lime hue) gradient at low lightness — brand-rich
        // dark glass. Apple Liquid Glass cues via backdrop-blur + saturate.
        "bg-[linear-gradient(180deg,hsl(80_30%_12%)_0%,hsl(80_15%_8%)_50%,hsl(80_25%_10%)_100%)]",
        "backdrop-blur-2xl backdrop-saturate-150",
        "ring-1 ring-white/[0.08]",
        "text-zinc-100"
      )}
    >
      {/* Layered overlays for depth + glass-edge cues — all pointer-events disabled. */}
      {/* Top-edge bright specular (Apple-glass key cue) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.03)_50%,transparent_100%)]"
      />
      {/* Lime brand glow at top-center (more visible than before) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_140px_80px_at_50%_-10%,rgba(195,235,66,0.18),transparent_70%)]"
      />
      {/* Lime accent glow at bottom-center (bracketing brand presence) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-[radial-gradient(ellipse_120px_60px_at_50%_110%,rgba(195,235,66,0.10),transparent_70%)]"
      />
      {/* Right-edge thin specular line (glass-edge cue) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-[1px] bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.05)_30%,transparent_60%,rgba(255,255,255,0.05)_85%,rgba(255,255,255,0.12)_100%)]"
      />

      {/* HEADER — logo */}
      <div className="relative z-10 flex items-center justify-center h-12 shrink-0">
        <Link to="/dashboard" className="flex items-center justify-center">
          <img src={faviconDark} alt="FabAds" className="h-6 w-6" />
        </Link>
      </div>

      <RailDivider />

      {/* BODY — primary modules + Tools section */}
      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto py-1.5 px-1.5">
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

        {/* Tools section — divider above (matches logo→menu divider style) */}
        {tools.length > 0 && (
          <>
            <div className="my-2">
              <RailDivider />
            </div>
            <div className="flex flex-col gap-0.5">
              {tools.map((mod) => (
                <RailItem
                  key={mod.key}
                  mod={mod}
                  isActive={activeKey === mod.key}
                  onClick={() => handleClick(mod)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* FOOTER — wrapped in `.dark` so NotificationBell + UserMenu CSS-var
          colors (text-sidebar-foreground/60 etc.) resolve to dark-theme
          values → light icons on dark rail, regardless of app theme. */}
      <div className="relative z-10 dark flex flex-col items-center gap-1 py-2 shrink-0 border-t border-white/[0.08]">
        <NotificationBell compact />
        <UserMenu compact />
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────
 *  RailDivider — thin elegant divider used between logo+menu
 *  AND between primary+tools sections (Maalik's "ek elegant
 *  sa subtle divider rakh skte hai" pattern).
 * ───────────────────────────────────────────────────────── */
function RailDivider() {
  return (
    <div className="relative z-10 mx-3 shrink-0">
      <div className="h-px bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.12)_50%,transparent_100%)]" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 *  RailItem — Pattern 4: tiny-stacked icon + label.
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
            isActive ? "" : "hover:bg-white/[0.05]"
          )}
        >
          <span
            className={cn(
              "relative flex h-6 w-6 items-center justify-center rounded transition-colors",
              isActive ? "bg-white/[0.12] ring-1 ring-white/[0.18]" : ""
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
