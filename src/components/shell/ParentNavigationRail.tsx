import { useNavigate, useLocation } from "react-router-dom";
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
import { useV7Shape } from "@/components/sidebar/useV7Shape";
import faviconDark from "@/assets/favicon-dark.png";

/**
 * ParentNavigationRail — V7 ClickUp Strict (iter-6 A-10.11).
 *
 * Logo click in V7 = cycles V7 shape sub-variants (floating ↔ edge-to-edge).
 * Main V1–V7 cycler moved to a small ChevronUp button next to UserMenu in the
 * rail footer. Click chevron → opens picker (cycle/pick V1-V7).
 *
 * Edge-to-edge sub-variant: rail loses its m-2/rounded/shadow/ring chrome.
 */
export function ParentNavigationRail() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeKey = deriveActiveModule(pathname);
  const { shape, cycle: cycleShape } = useV7Shape();
  const isFloating = shape === "floating";

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
      data-fabads-v7-shape={shape}
      className={cn(
        "relative hidden md:flex w-[64px] shrink-0 flex-col overflow-hidden",
        // Shape-aware: floating = card chrome, edge = full bleed
        isFloating
          ? "my-2 ml-2 mr-1 rounded-2xl shadow-2xl ring-1 ring-white/[0.08] h-[calc(100vh-1rem)]"
          : "h-screen",
        // Brand-color glass gradient (same in both shapes)
        "bg-[linear-gradient(180deg,hsl(80_30%_12%)_0%,hsl(80_15%_8%)_50%,hsl(80_25%_10%)_100%)]",
        "backdrop-blur-2xl backdrop-saturate-150",
        "text-zinc-100"
      )}
    >
      {/* Glass cues (Apple-glass top highlight + lime brand glows) */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.03)_50%,transparent_100%)]" />
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_140px_80px_at_50%_-10%,rgba(195,235,66,0.18),transparent_70%)]" />
      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-[radial-gradient(ellipse_120px_60px_at_50%_110%,rgba(195,235,66,0.10),transparent_70%)]" />

      {/* HEADER — logo. Click cycles V7 shape sub-variant (floating ↔ edge). */}
      <ShapeToggleLogo onCycle={cycleShape} shape={shape} />

      <RailDivider />

      {/* BODY — primary modules + Tools section */}
      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto py-1.5 px-1.5">
        <div className="flex flex-col gap-0.5">
          {primary.map((mod) => (
            <RailItem key={mod.key} mod={mod} isActive={activeKey === mod.key} onClick={() => handleClick(mod)} />
          ))}
        </div>
        {tools.length > 0 && (
          <>
            <div className="my-2"><RailDivider /></div>
            <div className="flex flex-col gap-0.5">
              {tools.map((mod) => (
                <RailItem key={mod.key} mod={mod} isActive={activeKey === mod.key} onClick={() => handleClick(mod)} />
              ))}
            </div>
          </>
        )}
      </div>

      <RailDivider />

      {/* FOOTER — NotificationBell + UserMenu trigger.
          A-10.12 history: variant picker moved into UserMenu dropdown.
          A-10.13 history: V1-V6 dropped, picker removed; UserMenu is just profile now.
          A-10.15 (this commit): explicit lime focus-ring on every button inside
          the rail footer — the default `--ring` token resolves to a low-contrast
          zinc-grey when the .dark class is applied, leaving keyboard focus
          invisible against the lime-tinted dark rail background (WCAG 1.4.11).
          The descendant-selector approach catches NotificationBell + UserMenu
          triggers without needing to edit those components. */}
      <div
        className={cn(
          "relative z-10 dark flex flex-col items-center gap-1 py-2 shrink-0",
          "[&_button]:!w-9 [&_button]:!h-9 [&_button]:!p-0 [&_button]:!justify-center [&_button]:!flex [&_button]:!items-center",
          "[&_button]:focus-visible:!ring-2 [&_button]:focus-visible:!ring-[#c3eb42] [&_button]:focus-visible:!ring-offset-2 [&_button]:focus-visible:!ring-offset-[hsl(80_15%_8%)]"
        )}
      >
        <NotificationBell compact />
        <UserMenu compact />
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────
 *  ShapeToggleLogo — V7 logo click cycles shape sub-variant.
 *  Tooltip explains: "Floating · Click for Edge-to-edge" (or vice-versa).
 * ───────────────────────────────────────────────────────── */
function ShapeToggleLogo({ onCycle, shape }: { onCycle: () => void; shape: "floating" | "edge" }) {
  const next = shape === "floating" ? "edge-to-edge" : "floating";
  const tooltip = `Shape: ${shape} · Click for ${next}`;
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onCycle}
          aria-label={tooltip}
          title={tooltip}
          className="relative z-10 flex items-center justify-center h-12 shrink-0 hover:bg-white/[0.04] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#c3eb42] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(80_15%_8%)] focus-visible:rounded-md"
        >
          <img src={faviconDark} alt="FabAds" className="h-6 w-6" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

/* MainVariantCyclerChevron removed in A-10.12 — moved into UserMenu dropdown
   per Maalik's "keep it inside the profile pop-over" call. */

function RailDivider() {
  return (
    <div className="relative z-10 mx-3 shrink-0">
      <div className="h-px bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.12)_50%,transparent_100%)]" />
    </div>
  );
}

function RailItem({ mod, isActive, onClick }: { mod: ModuleDef; isActive: boolean; onClick: () => void }) {
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
            "outline-none focus-visible:ring-2 focus-visible:ring-[#c3eb42] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(80_15%_8%)]",
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
