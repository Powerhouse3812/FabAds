import { useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import {
  MODULES,
  MODULE_GROUPS,
  type ModuleDef,
  type SubItem,
  hasSubItems,
  firstSubPath,
  deriveActiveModule,
} from "@/components/sidebar/modules";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";
import { useV7Shape } from "@/components/sidebar/useV7Shape";
import { usePlan } from "@/contexts/PlanContext";
import { PlanShiftToggle } from "@/components/shell/PlanShiftToggle";
import {
  FEATURE_PRESETS,
  LockedFeatureSellModal,
} from "@/components/shell/LockedFeatureSellModal";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const activeKey = deriveActiveModule(pathname);
  const { shape, cycle: cycleShape } = useV7Shape();
  const isFloating = shape === "floating";

  // Growth upsell popover open state lives in the URL as `?upsell=<moduleKey>`.
  // Click a locked rail item → URL gets the param, popover opens.
  // Closing the popover removes the param. Deep-linking the URL re-opens
  // the matching popover on load. Also makes the state visible /
  // shareable for QA + design exports.
  const upsellKey = searchParams.get("upsell");
  const setUpsellKey = useCallback(
    (key: string | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (key) next.set("upsell", key);
          else next.delete("upsell");
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const { plan } = usePlan();
  // Lock derivation. On AI plan the modules tagged `plans: ["full"]`
  // (Reports / Launch / Automation) render as LOCKED — greyed icon +
  // Growth badge + click opens the upsell popover. On the Growth plan
  // nothing is locked.
  const isLocked = (m: ModuleDef) =>
    !!(m.plans && !m.plans.includes(plan));

  // Sort modules into three buckets: unlocked-primary (RUN + CREATE),
  // unlocked-tools (TOOLS group), and locked (rendered at the very
  // bottom as a separate upsell section). Maalik: "Report, Launch,
  // Automation ko separate kr do bs sbse niche. Otherwise AI plan
  // me inka kaam thode hi h."
  const visibleModules = MODULES.filter((m) => !m.comingSoon);
  const primary = visibleModules.filter(
    (m) => !isLocked(m) && MODULE_GROUPS[m.key] !== "TOOLS",
  );
  const tools = visibleModules.filter(
    (m) => !isLocked(m) && MODULE_GROUPS[m.key] === "TOOLS",
  );
  const locked = visibleModules.filter((m) => isLocked(m));

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
            <RailItem
              key={mod.key}
              mod={mod}
              isActive={activeKey === mod.key}
              locked={isLocked(mod)}
              onClick={() => handleClick(mod)}
            />
          ))}
        </div>
        {tools.length > 0 && (
          <>
            <div className="my-2"><RailDivider /></div>
            <div className="flex flex-col gap-0.5">
              {tools.map((mod) => (
                <RailItem
                  key={mod.key}
                  mod={mod}
                  isActive={activeKey === mod.key}
                  locked={isLocked(mod)}
                  onClick={() => handleClick(mod)}
                />
              ))}
            </div>
          </>
        )}
        {locked.length > 0 && (
          <>
            <div className="my-2"><RailDivider /></div>
            <div className="px-1 pb-1 text-center">
              <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-zinc-500">
                Upgrade to Growth
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              {locked.map((mod) => (
                <RailItem
                  key={mod.key}
                  mod={mod}
                  isActive={activeKey === mod.key}
                  locked
                  upsellOpen={upsellKey === mod.key}
                  onUpsellOpenChange={(open) =>
                    setUpsellKey(open ? mod.key : null)
                  }
                  onClick={() => handleClick(mod)}
                />
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
        <PlanShiftToggle />
        <NotificationBell compact />
        <UserMenu compact />
      </div>

      {/* Locked-feature sell modal — URL-driven via ?upsell=<moduleKey>.
          Single mount at the rail level. Replaces the in-RailItem Popover
          (which was too small for a real sell pitch). Modal stays
          dismissible via X / Esc / backdrop / "Stay on AI plan" link;
          all four call setUpsellKey(null) to strip the URL param. */}
      <LockedFeatureSellModal
        presetKey={upsellKey && FEATURE_PRESETS[upsellKey] ? upsellKey : null}
        onClose={() => setUpsellKey(null)}
      />
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

function RailItem({
  mod,
  isActive,
  locked = false,
  upsellOpen,
  onUpsellOpenChange,
  onClick,
}: {
  mod: ModuleDef;
  isActive: boolean;
  locked?: boolean;
  /** Controls the upsell Popover open state when `locked` is true. Wired
      to `?upsell=<key>` URL param in ParentNavigationRail so the open
      state is shareable / deep-linkable. */
  upsellOpen?: boolean;
  onUpsellOpenChange?: (open: boolean) => void;
  onClick: () => void;
}) {
  const Icon = mod.icon;
  const navigate = useNavigate();

  // Locked items show a "Growth" badge in the existing badge slot (overrides
  // any other badge). Greyed icon + label so the disabled state is clear.
  const displayBadge = locked ? "Growth" : mod.badge;

  // Tooltip preview line per locked module — one specific number that
  // hints at what the user is missing by staying on AI. The rich pitch
  // lives in LockedFeatureSellModal; this is just the quiet preview.
  const lockedPreview: Record<string, string> = {
    reports: "Multi-account · up to 15 ad accounts",
    launch: "Round Robin · 50+ ads at once",
    launch2: "Meta bulk · 50+ ads, guided flow",
    automation: "Rules-based · auto-rotate winners",
  };
  const previewLine = locked ? lockedPreview[mod.key] : undefined;

  // Locked items: click → open the sell modal via URL param.
  // Unlocked: standard nav.
  const handleClick = locked
    ? () => onUpsellOpenChange?.(true)
    : onClick;

  const button = (
    <button
      type="button"
      onClick={handleClick}
      aria-current={isActive ? "page" : undefined}
      aria-haspopup={locked ? "dialog" : undefined}
      className={cn(
        "group relative flex w-full flex-col items-center gap-0.5 rounded-md px-0.5 py-1 transition-colors",
        "outline-none focus-visible:ring-2 focus-visible:ring-[#c3eb42] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(80_15%_8%)]",
        isActive ? "" : "hover:bg-white/[0.05]",
        locked && "cursor-pointer",
      )}
    >
      <span
        className={cn(
          "relative flex h-6 w-6 items-center justify-center rounded transition-colors",
          isActive ? "bg-white/[0.12] ring-1 ring-white/[0.18]" : "",
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4",
            locked
              ? "text-zinc-500"
              : isActive
                ? "text-white"
                : "text-zinc-300",
          )}
        />
        {displayBadge ? (
          <span
            className={cn(
              "absolute rounded-full font-mono font-bold uppercase leading-none shadow-[0_0_0_1px_rgba(0,0,0,0.25)]",
              locked
                ? "-right-3.5 -top-2 px-[5px] py-[2px] text-[9px] tracking-[0.04em] bg-zinc-200 text-zinc-700"
                : "-right-2 -top-1.5 px-[3px] py-[1px] text-[7px] tracking-wider bg-[#c3eb42] text-[#1a1a17]",
            )}
            aria-hidden="true"
          >
            {displayBadge}
          </span>
        ) : null}
        {locked ? (
          <span
            aria-hidden="true"
            className="absolute -right-1 -bottom-1 flex h-3 w-3 items-center justify-center rounded-full bg-zinc-800 ring-1 ring-zinc-900"
          >
            <Lock className="h-2 w-2 text-zinc-300" strokeWidth={2.5} />
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "text-[8.5px] leading-[10px] font-medium tracking-tight text-center line-clamp-1 max-w-full px-0.5 mt-0.5",
          locked
            ? "text-zinc-500"
            : isActive
              ? "text-white"
              : "text-zinc-400",
        )}
      >
        {mod.label}
      </span>
    </button>
  );

  // 0) Locked → click opens LockedFeatureSellModal at the rail root
  //    (controlled via ?upsell=<key>). Hover shows a quiet two-line preview:
  //    `<module> · Growth` (line 1) + one specific number on a faded line 2
  //    that hints at what staying on AI costs. The rich pitch lives in the
  //    modal, not the tooltip, so we don't double up on sell content.
  if (locked) {
    void upsellOpen; // open state lives at rail level — modal reads URL
    return (
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          <div className="flex items-center">
            <span className="font-medium">{mod.label}</span>
            <span className="ml-1.5 text-muted-foreground">· Growth</span>
          </div>
          {previewLine ? (
            <div className="mt-0.5 text-[11px] text-muted-foreground/70">
              {previewLine}
            </div>
          ) : null}
        </TooltipContent>
      </Tooltip>
    );
  }

  // 1) Active module → suppress popover, render bare button (no tooltip noise either —
  //    user is already in this module).
  if (isActive) {
    return button;
  }

  const flatSubs: SubItem[] = [
    ...(mod.subItems ?? []),
    ...(mod.sections?.flatMap((s) => s.items) ?? []),
  ];

  // 3) No sub-items → keep the legacy tooltip-only path.
  if (flatSubs.length === 0) {
    return (
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {mod.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  // 2) Has sub-items → V4 (Studio v3 glass) hover popover.
  return (
    <HoverCard openDelay={200} closeDelay={120}>
      <HoverCardTrigger asChild>{button}</HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={8}
        className={cn(
          "v3-glass relative overflow-hidden",
          "z-[60] w-60 rounded-2xl p-1.5",
          "shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)]"
        )}
      >
        {/* Lime mesh tint overlay */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, hsl(74 81% 70% / 0.15), transparent 70%)",
          }}
        />

        {/* Module-label header row → routes to firstSubPath via the rail's onClick */}
        <button
          type="button"
          onClick={onClick}
          className="relative flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-primary/15 transition-colors"
        >
          <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center ring-1 ring-primary/40">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <span className="flex-1 text-sm font-semibold text-foreground truncate">
            {mod.label}
          </span>
        </button>

        {/* Divider */}
        <div className="relative h-px bg-foreground/10 my-1.5 mx-1" />

        {/* Sub-item rows */}
        <div className="relative flex flex-col gap-0.5">
          {flatSubs.map((sub) => {
            const SubIcon = sub.icon;
            return (
              <button
                key={sub.path}
                type="button"
                onClick={() => navigate(sub.path)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium hover:bg-foreground/5 transition-colors",
                  sub.deprioritized && "opacity-60 italic"
                )}
              >
                {SubIcon ? (
                  <SubIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                ) : null}
                <span className="flex-1 text-foreground truncate">{sub.label}</span>
                {sub.badge ? (
                  <span className="shrink-0 rounded bg-muted px-1 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    {sub.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
