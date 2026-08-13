import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Telescope,
  BarChart3,
  Wand2,
  MoreHorizontal,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { MobileOnboardingFlowA } from "@/mobile-onboarding";
import { MobileTourLauncher } from "@/mobile-tour";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { MobileNavContent } from "@/components/sidebar/MobileNavContent";
import { NotificationBell } from "@/components/NotificationBell";
import { MODULES, deriveActiveModule, type ModuleDef } from "@/components/sidebar/modules";
import { isMobileAllowed } from "@/components/shell/mobileRoutePolicy";
import { usePlan } from "@/contexts/PlanContext";
import { MOBILE_HOME_PATH } from "./mobileNavConstants";

/**
 * MobileTabBar — primary navigation for the phone shell.
 *
 * WHY BOTTOM TABS
 * The desktop shell navigates from a 64px left rail. On a phone that rail's
 * position is the single worst place to put the thing users touch most: the
 * top-left corner is the farthest point from a thumb anchored at the bottom of
 * the device. Fitts's law says time-to-target grows with distance and shrinks
 * with target size, so the fix is both halves — move the targets into the
 * bottom thumb arc AND make them wide (each tab is `flex-1`, so a 5-tab bar on
 * a 390px screen gives ~78px-wide targets versus a 24px rail icon). Bottom tabs
 * also keep the destinations permanently visible, which is recognition rather
 * than recall (NN/g #6): a hamburger hides the entire IA behind a tap, and
 * every tap costs a decision the user shouldn't have to make to see where they
 * can go. Four destinations + More also stays inside Hick's-law comfort — the
 * long tail of the IA lives in the More sheet, not in the bar.
 *
 * WHY IN NORMAL FLOW, NOT `fixed`
 * AppLayout renders this as the last flex child of the outer column, so it
 * occupies real layout space and the scroll container above it simply gets
 * shorter. A `fixed` bar would instead float over content and require every
 * page in the product to opt into a matching `padding-bottom` — a contract
 * ~300 page files would have to honour, and silently break for any page that
 * doesn't. It would also double-count `env(safe-area-inset-bottom)` wherever a
 * page already pads for it, and it would sit on top of the sticky footers and
 * action bars several surfaces already ship. In-flow costs nothing and cannot
 * overlap anything.
 *
 * `z-30` (not higher) is deliberate: portalled dialogs/sheets live at `z-50`
 * and must cover the bar, otherwise tabs punch through an open modal.
 */

// Lives in ./mobileNavConstants so `src/mobile-tour` can read it without
// importing this component — see that file's header for the cycle it broke.
// Re-exported here so existing importers keep working.
export { MOBILE_HOME_PATH } from "./mobileNavConstants";

/**
 * Below this many slots the bar stops reading as a tab bar. Counts the always-
 * present More slot, so it implies a floor of two module tabs. See FALLBACK_TABS.
 */
const MIN_SLOTS = 3;

interface TabDef {
  /** Must match a `ModuleDef.key` so `deriveActiveModule` can light it up. */
  moduleKey: string;
  label: string;
  to: string;
  icon: React.ElementType;
}

/**
 * Icons are lifted verbatim from modules.ts (LayoutDashboard / Telescope /
 * BarChart3 / Sparkles) so a user trained on the desktop rail recognises the
 * same glyph in the same meaning down here. Do not "improve" them in isolation.
 *
 * `to` points at the first mobile-allowed leaf of each module rather than the
 * module root — Insights and Reports are accordion parents with no route of
 * their own, and Launch's root is the Hub.
 */
const TABS: TabDef[] = [
  { moduleKey: "dashboard", label: "Home", to: MOBILE_HOME_PATH, icon: LayoutDashboard },
  { moduleKey: "insights", label: "Insights", to: "/insights-v2/feed", icon: Telescope },
  { moduleKey: "reports", label: "Reports", to: "/reports/fb", icon: BarChart3 },
  // Genie holds this slot, not Launch (Maalik, 2026-08-11). Launch stays
  // reachable from the More sheet as the read-only Hub — it just isn't a
  // daily-use destination on a phone, whereas Genie is.
  { moduleKey: "genie", label: "Genie", to: "/iq/genie6", icon: Wand2 },
];

/** Last-resort bar when filtering strips too much. Home always survives. */
const FALLBACK_TABS: TabDef[] = [TABS[0], TABS[1]];

const MODULE_BY_KEY = new Map<string, ModuleDef>(MODULES.map((m) => [m.key, m]));

export function MobileTabBar({ className }: { className?: string }) {
  const { pathname } = useLocation();
  const { plan } = usePlan();
  const [moreOpen, setMoreOpen] = useState(false);
  // The two new-user flows are owned HERE, not inside MobileNavContent: that
  // component unmounts with the sheet, so a flow mounted there would disappear
  // the moment the menu closed. Each flow renders its own full-screen overlay
  // and owns its Replay / Start-fresh prompt.
  const [setupFlowOpen, setSetupFlowOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  const activeKey = deriveActiveModule(pathname);

  // Filter 1 — plan lock, copied from ParentNavigationRail so the two navs can
  // never disagree. Modules tagged `plans: ["full"]` (Reports / Launch /
  // Automation) are hidden on the AI plan; the rail renders them as a locked
  // upsell section, but a tab bar has no room for an upsell slot, so on mobile
  // they simply don't get a tab. Without this an AI-plan user would tap
  // straight into a surface the rail deliberately withholds.
  const isLocked = (m: ModuleDef | undefined) =>
    !!(m && m.plans && !m.plans.includes(plan));

  // Filter 2 — belt and braces. `to` targets are hand-written above; running
  // them through the same allowlist the gate screen uses guarantees a tab can
  // never navigate the user into "Best on desktop".
  const candidates = TABS.filter(
    (t) => !isLocked(MODULE_BY_KEY.get(t.moduleKey)) && isMobileAllowed(t.to),
  );

  // +1 for the More slot, which is always rendered.
  const tabs =
    candidates.length + 1 >= MIN_SLOTS ? candidates : FALLBACK_TABS;

  // More is active whenever the sheet is open, and also whenever the current
  // route belongs to no tab — a blocked deep link like /catalogue/brands would
  // otherwise leave every tab unlit, which reads as a broken bar rather than
  // as "you are somewhere in the long tail".
  const moreActive =
    moreOpen || !tabs.some((t) => t.moduleKey === activeKey);

  return (
    <>
      <nav
        aria-label="Primary"
        data-fabads-nav="mobile-tabbar"
        className={cn(
          // In normal flow (see header). `shrink-0` so the scroll area above
          // absorbs the height instead of squeezing the bar.
          "relative z-30 shrink-0 border-t border-border bg-background",
          // The safe-area inset is padding UNDER the 56px content row, so the
          // touch targets keep their full height on a home-bar device instead
          // of being eaten by it. viewport-fit=cover in index.html makes the
          // env() resolve; on everything else it computes to 0px.
          "pb-[env(safe-area-inset-bottom)]",
          className,
        )}
      >
        <ul className="flex h-14 items-stretch">
          {tabs.map((tab) => {
            const active = tab.moduleKey === activeKey;
            const Icon = tab.icon;
            return (
              <li key={tab.moduleKey} className="flex flex-1">
                <Link
                  to={tab.to}
                  // aria-current pairs with the colour change: active state is
                  // never communicated by colour alone (WCAG 1.4.1).
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    // min-h-12 = 48px, clearing the 44px WCAG 2.5.5 floor even
                    // though the row itself is 56px.
                    "flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5",
                    "transition-colors active:bg-muted/60",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    active
                      ? "text-primary font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-[22px] w-[22px] shrink-0" aria-hidden />
                  {/* ICON-ONLY (Maalik, 2026-08-11). The bell claimed a 6th
                      slot, and 6 labelled slots at 375px is ~62px each — the
                      labels truncate, which is worse than none. Accepted cost:
                      "Insights" vs "Reports" are not iconographically distinct
                      in a B2B tool, so this trades recognition for the slot.
                      Mitigations: identical glyphs to the desktop rail so the
                      mapping transfers, and the label survives as the
                      accessible name. */}
                  <span className="sr-only">{tab.label}</span>
                </Link>
              </li>
            );
          })}

          {/* Bell — moved out of the mobile header into the nav (Maalik,
              2026-08-11). Notifications are growing into a real destination
              (all notifications + activity logs with filters), and a surface
              that size belongs in the tab bar rather than behind a header icon.
              NotificationBell already swaps its Popover for a bottom Sheet on
              mobile, so it needs no new chrome here — only tab-shaped framing
              and a 44px target. It keeps its own unread badge. */}
          <li className="flex flex-1 items-stretch justify-center [&_button]:!h-full [&_button]:!w-full [&_button]:!rounded-none">
            <NotificationBell compact />
          </li>

          {/* Last slot is always More — never module-derived, so the escape
              hatch to the full IA cannot be filtered away by plan or policy. */}
          <li className="flex flex-1">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              aria-current={moreActive ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5",
                "transition-colors active:bg-muted/60",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                moreActive ? "text-primary font-medium" : "text-muted-foreground",
              )}
            >
              <MoreHorizontal className="h-5 w-5 shrink-0" aria-hidden />
              <span className="sr-only">More</span>
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="flex max-h-[80dvh] flex-col gap-0 rounded-t-2xl p-0 [&>button]:hidden"
        >
          {/* Sheets in this app never dismiss on outside click (standing rule,
              enforced in ui/sheet.tsx), so an explicit close control is not
              optional. SheetContent's own built-in X was previously left
              alongside the footer Close below — TWO close controls in one
              sheet, and the built-in one measures 16×16, under the 44px WCAG
              2.5.5 floor. `[&>button]:hidden` suppresses it (same technique
              already used in NotificationBell.tsx); the footer Close is the
              single, ≥44px, thumb-reachable exit. */}
          <div className="border-b border-border px-4 py-3">
            <SheetTitle className="text-base">Menu</SheetTitle>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <MobileNavContent
              onClose={() => setMoreOpen(false)}
              // This sheet already has a header ✕ and a footer Close.
              showCloseHeader={false}
              onStartSetupFlow={() => setSetupFlowOpen(true)}
              onStartMobileTour={() => setTourOpen(true)}
            />
          </div>

          <div className="border-t border-border p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <SheetClose className="min-h-12 w-full rounded-lg border border-border text-sm font-medium text-foreground transition-colors active:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Close
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>

      <MobileOnboardingFlowA open={setupFlowOpen} onOpenChange={setSetupFlowOpen} />
      <MobileTourLauncher open={tourOpen} onOpenChange={setTourOpen} />
    </>
  );
}
