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
 * ParentNavigationRail — V7 ClickUp Strict (iter-6 A-10.6).
 *
 * Now flush inside AppShell (the outer wrapper owns m-2/rounded/shadow).
 * This component is just the dark rail content — no self-floating.
 *
 * Layout: Logo → divider → Primary modules (8) → divider → Tools (visible-only)
 * → footer (Copilot + Bell + UserMenu, all centered consistently).
 *
 * Maalik fixes in A-10.6:
 *   • Coming-soon tools (BG/Object Remover) hidden from rail entirely
 *   • Footer icons all 36×36 centered (UserMenu/NotificationBell forced to
 *     consistent box via [&_button] arbitrary selectors)
 *   • Icon size unified at 16px (h-4 w-4) to match the secondary panel
 */
export function ParentNavigationRail() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeKey = deriveActiveModule(pathname);

  // Drop coming-soon items from the rail entirely (per Maalik A-10.6).
  const visibleModules = MODULES.filter((m) => !m.comingSoon);
  const primary = visibleModules.filter((m) => MODULE_GROUPS[m.key] !== "TOOLS");
  const tools = visibleModules.filter((m) => MODULE_GROUPS[m.key] === "TOOLS");

  const handleClick = (mod: ModuleDef) => {
    const target = hasSubItems(mod) ? firstSubPath(mod) : mod.path!;
    navigate(target);
  };

  return (
    <aside
      data-fabads-nav-rail="parent"
      className={cn(
        "relative hidden md:flex w-[64px] shrink-0 flex-col overflow-hidden",
        // Floating: m-2 + rounded-2xl + shadow + ring (Maalik A-10.6 revert
        // — keep both floating, not fused).
        "my-2 ml-2 mr-1 rounded-2xl shadow-2xl ring-1 ring-white/[0.08]",
        "h-[calc(100vh-1rem)]",
        // True primary-color (lime hue) gradient at low lightness.
        "bg-[linear-gradient(180deg,hsl(80_30%_12%)_0%,hsl(80_15%_8%)_50%,hsl(80_25%_10%)_100%)]",
        "backdrop-blur-2xl backdrop-saturate-150",
        "text-zinc-100"
      )}
    >
      {/* Top-edge bright specular */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.03)_50%,transparent_100%)]"
      />
      {/* Lime glow at top-center */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_140px_80px_at_50%_-10%,rgba(195,235,66,0.18),transparent_70%)]"
      />
      {/* Lime glow at bottom-center */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-[radial-gradient(ellipse_120px_60px_at_50%_110%,rgba(195,235,66,0.10),transparent_70%)]"
      />

      {/* HEADER — logo */}
      <div className="relative z-10 flex items-center justify-center h-12 shrink-0">
        <Link to="/dashboard" className="flex items-center justify-center">
          <img src={faviconDark} alt="FabAds" className="h-6 w-6" />
        </Link>
      </div>

      <RailDivider />

      {/* BODY — primary modules + Tools section (each tool gets a divider above) */}
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

      {/* Pre-footer divider — same elegant gradient style as logo→menu divider
          (Maalik A-10.7: "jaisa divider logo and menu ke beech me hai, waisa hi
          profile wale section se phle"). */}
      <RailDivider />

      {/* FOOTER — wrapped in `.dark` so CSS-vars resolve to dark-theme values
          (light icons on dark rail). Arbitrary [&_button] selectors force all
          inner buttons to a consistent 36×36 centered box. */}
      <div
        className={cn(
          "relative z-10 dark flex flex-col items-center gap-1 py-2 shrink-0",
          "[&_button]:!w-9 [&_button]:!h-9 [&_button]:!p-0 [&_button]:!justify-center [&_button]:!flex [&_button]:!items-center"
        )}
      >
        <NotificationBell compact />
        <UserMenu compact />
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────
 *  RailDivider — thin elegant gradient line.
 * ───────────────────────────────────────────────────────── */
function RailDivider() {
  return (
    <div className="relative z-10 mx-3 shrink-0">
      <div className="h-px bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.12)_50%,transparent_100%)]" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 *  RailItem — tiny-stacked icon + label.
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
            <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-zinc-300")} />
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
