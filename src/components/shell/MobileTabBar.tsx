import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Telescope, Wand2, MoreHorizontal, X } from "lucide-react";

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
import {
  useMobileSelection,
  type MobileBulkOperation,
} from "@/components/shell/MobileSelectionContext";

/**
 * MobileTabBar — primary navigation for the phone shell.
 *
 * WHY BOTTOM TABS
 * The desktop shell navigates from a 64px left rail. On a phone that rail's
 * position is the single worst place to put the thing users touch most: the
 * top-left corner is the farthest point from a thumb anchored at the bottom of
 * the device. Fitts's law says time-to-target grows with distance and shrinks
 * with target size, so the fix is both halves — move the targets into the
 * bottom thumb arc AND make them wide (each tab is `flex-1`, so a 4-tab bar on
 * a 390px screen gives ~95px-wide targets versus a 24px rail icon). Bottom tabs
 * also keep the destinations permanently visible, which is recognition rather
 * than recall (NN/g #6): a hamburger hides the entire IA behind a tap, and
 * every tap costs a decision the user shouldn't have to make to see where they
 * can go. Four labelled slots — Industry Insights, Genie, Notification, More —
 * also stays inside Hick's-law comfort: the long tail of the IA lives in the
 * More sheet, not in the bar.
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
 * Floor on how many MODULE tabs (Industry Insights / Genie — Notification and
 * More are unconditional, not counted here) must survive filtering before the
 * bar is worth rendering as computed. Below this, "candidates" would leave the
 * bar reading as just Notification + More, which looks broken rather than
 * "the rest of the IA lives in More". `insights` and `genie` both carry no
 * `plans` restriction in modules.ts and both resolve to `full` support in
 * mobileRoutePolicy.ts today, so this floor is a safety net for future policy
 * drift, not a live guard — see FALLBACK_TABS.
 */
const MIN_MODULE_TABS = 1;

interface TabDef {
  /** Must match a `ModuleDef.key` so `deriveActiveModule` can light it up. */
  moduleKey: string;
  label: string;
  to: string;
  icon: React.ElementType;
}

/**
 * Icons are lifted verbatim from modules.ts (Telescope / Wand2) so a user
 * trained on the desktop rail recognises the same glyph in the same meaning
 * down here. Do not "improve" them in isolation.
 *
 * `to` points at the first mobile-allowed leaf of each module rather than the
 * module root:
 * - Insights is an accordion parent with no route of its own — "/insights-v2
 *   /feed" (My feeds) is the landing leaf, per spec §2.2.
 * - Genie's root ("/iq/genie6") is deliberately NOT used here even though
 *   it's the module's `path`/first subItem. As of the FB-7109 mobile pass
 *   (2026-08-21) that route is the generation launcher and is BLOCKED on
 *   mobile (Genie is read-only browsing there — library + previous
 *   generations only). Pointing this tab at the root would make the
 *   `isMobileAllowed` filter below silently drop the whole Genie tab, which
 *   reads as "Genie vanished" rather than "Genie is read-only" — so this tab
 *   targets "/iq/genie6/library" instead, which stays `full` support.
 */
const TABS: TabDef[] = [
  { moduleKey: "insights", label: "Industry Insights", to: "/insights-v2/feed", icon: Telescope },
  // Genie holds this slot, not Launch (Maalik, 2026-08-11). Launch stays
  // reachable from the More sheet as the read-only Hub — it just isn't a
  // daily-use destination on a phone, whereas Genie is.
  { moduleKey: "genie", label: "Genie", to: "/iq/genie6/library", icon: Wand2 },
];

/**
 * Last-resort bar when filtering strips out every module tab. Forces Industry
 * Insights back in, bypassing the filter — it's the mobile landing surface
 * (MOBILE_HOME_PATH), carries no `plans` lock, and is `full` support in the
 * policy, so re-showing it is safe even if the inputs that produced an empty
 * `candidates` list drifted for an unrelated reason.
 */
const FALLBACK_TABS: TabDef[] = [TABS[0]];

const MODULE_BY_KEY = new Map<string, ModuleDef>(MODULES.map((m) => [m.key, m]));

/**
 * Bulk selection row (spec B §2.2, Maalik's ruling) — REPLACES the tab row
 * above, never stacks with it. Rendered inside the exact same `<nav>` the
 * tabs live in, so it inherits that nav's border/safe-area/z-30 chrome
 * unchanged; only what's *inside* the nav differs between the two states.
 *
 * Layout at 375px, left to right: a 44×44 icon-only Cancel, a flexible
 * truncating "N selected" label, then the two fixed-copy operation buttons.
 * The label is the one thing allowed to shrink (`min-w-0 truncate`) — the
 * Cancel control and the two operation buttons are `shrink-0` so their
 * touch targets can never be squeezed under the 44px floor by a long count
 * or a narrow viewport; at the 1000+-item end of the state-coverage sweep
 * the label degrades to a truncated string, never the buttons.
 */
function MobileBulkSelectionRow({
  count,
  operations,
  onCancel,
}: {
  count: number;
  operations: MobileBulkOperation[];
  onCancel: () => void;
}) {
  return (
    <div className="flex h-14 items-center gap-2 px-3">
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancel selection"
        className={cn(
          // Literal 44×44 — the Cancel/clear control spec B §2.2 requires.
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground",
          "transition-colors active:bg-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <X className="h-5 w-5" aria-hidden />
      </button>

      {/* aria-live: the count changes on every checkbox tap while this row
          is open: announce it the same way a cart-count or unread-count
          update would be, rather than staying silent for screen-reader
          users toggling selection one card at a time. */}
      <span
        className="min-w-0 flex-1 truncate text-sm font-medium text-foreground"
        aria-live="polite"
      >
        {count} selected
      </span>

      {operations.map((op) => (
        <button
          key={op.id}
          type="button"
          onClick={op.run}
          disabled={op.disabled}
          aria-disabled={op.disabled || undefined}
          className={cn(
            // min-h-11 = 44px floor; width is content + px-2.5 padding,
            // which clears 44px for both "Add to board" and "Save ads" at
            // any font size this app ships — no explicit min-w needed.
            "min-h-11 shrink-0 whitespace-nowrap rounded-md border border-border px-2.5 text-xs font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            op.disabled
              ? "cursor-not-allowed text-muted-foreground/50"
              : "text-foreground active:bg-muted",
          )}
        >
          {op.label}
        </button>
      ))}
    </div>
  );
}

export function MobileTabBar({ className }: { className?: string }) {
  const { pathname } = useLocation();
  const { plan } = usePlan();
  const [moreOpen, setMoreOpen] = useState(false);
  // Spec B §2.2: bulk row swaps in for the tab row while a selection is
  // active. The selection itself is owned by whichever routed page has
  // checkboxes (Industry Insights' feed today) — this bar only reads the
  // shared context to decide which row to render and to run the two ops.
  const { isSelecting, count, operations, clearSelection } = useMobileSelection();
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
  // they simply don't get a tab. Neither Insights nor Genie carries this
  // restriction today, but the check stays — it's what keeps this bar unable
  // to disagree with the rail if that ever changes.
  const isLocked = (m: ModuleDef | undefined) =>
    !!(m && m.plans && !m.plans.includes(plan));

  // Filter 2 — belt and braces. `to` targets are hand-written above; running
  // them through the same allowlist the gate screen uses guarantees a tab can
  // never navigate the user into "Best on desktop".
  const candidates = TABS.filter(
    (t) => !isLocked(MODULE_BY_KEY.get(t.moduleKey)) && isMobileAllowed(t.to),
  );

  const tabs = candidates.length >= MIN_MODULE_TABS ? candidates : FALLBACK_TABS;

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
        {/* Spec B §2.2, Maalik's ruling: REPLACE, never stack — a selection
            in progress swaps this entire row for the bulk row below rather
            than adding 44px+ of chrome on top of the existing 56px bar. Every
            byte of the tab `<ul>` below (including the Notification slot's
            hand-tuned absolute-positioning geometry) is untouched by this
            branch — it is exactly what shipped before this batch, just now
            conditionally rendered instead of unconditionally rendered. */}
        {isSelecting ? (
          <MobileBulkSelectionRow
            count={count}
            operations={operations}
            onCancel={clearSelection}
          />
        ) : (
        <ul className="flex h-14 items-stretch">
          {tabs.map((tab) => {
            const active = tab.moduleKey === activeKey;
            const Icon = tab.icon;
            return (
              <li key={tab.moduleKey} className="flex flex-1">
                <Link
                  to={tab.to}
                  // aria-current pairs with the colour change: active state is
                  // never communicated by colour alone (WCAG 1.4.1) — the top
                  // indicator bar below and the font-weight bump are the other
                  // two signals.
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    // `relative` anchors the active-state indicator bar below.
                    // min-h-12 = 48px, clearing the 44px WCAG 2.5.5 floor even
                    // though the row itself is 56px.
                    "relative flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5",
                    "transition-colors active:bg-muted/60",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    active
                      ? "text-primary font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {active && (
                    <span
                      aria-hidden
                      className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary"
                    />
                  )}
                  <Icon className="h-[22px] w-[22px] shrink-0" aria-hidden />
                  {/* LABELLED (Figma "Bottom Navbar" sync, 2026-08-21). The
                      previous bar was icon-only because the bell claimed a 6th
                      slot alongside Home/Insights/Reports/Genie — 6 labelled
                      slots at 375px was ~62px each and labels truncated, which
                      read worse than none. Home and Reports are gone (spec
                      §2.1) and the bell now carries its own visible label
                      too, so this is a 4-slot bar at ~94px each — comfortably
                      wide enough for "Genie", "Notification" and "More" on one
                      line. "Industry Insights" is the tight case; it's left
                      free to wrap onto its natural word boundary ("Industry" /
                      "Insights") rather than forced `whitespace-nowrap`, so a
                      narrower viewport degrades to two centred lines instead
                      of a truncated label — recognition over recall (NN/g #6)
                      only works if the label is legible, not just present. */}
                  <span className="w-full px-0.5 text-center text-[10px] leading-tight">
                    {tab.label}
                  </span>
                </Link>
              </li>
            );
          })}

          {/* Bell — moved out of the mobile header into the nav (Maalik,
              2026-08-11). Notifications are growing into a real destination
              (all notifications + activity logs with filters), and a surface
              that size belongs in the tab bar rather than behind a header icon.
              NotificationBell already swaps its Popover for a bottom Sheet on
              mobile, so it needs no new chrome here — only tab-shaped framing.
              It keeps its own unread badge and its own `aria-label`, so the
              "Notification" span below is decorative (`aria-hidden`) rather
              than a second accessible name for the same control.

              LAYOUT — the bell's button is lifted OUT of flow and centred over
              a 22px spacer that mirrors the Link tabs' icon box. In flow it
              could not work: at the 44px WCAG 2.5.5 floor the button + gap +
              label measures 59px inside a 56px row, so flexbox shrank the
              button to 42px (under the floor) AND pushed "Notification" ~10px
              below every sibling label, flush against the bar's bottom edge.
              Absolute positioning decouples the two: the label keeps the shared
              baseline, the control keeps its full 44×44 target. `!w-11` (not
              `!w-full`) keeps the button's box tight around the bell so its
              `-top-1 -right-1` unread badge stays glued to the icon instead of
              anchoring to the far right of the ~94px slot; the badge offsets
              are nudged to `top-1`/`right-1` so it can't overhang the bar's
              top border. */}
          <li className="relative flex flex-1 flex-col items-center justify-center gap-0.5">
            <span aria-hidden className="h-[22px] w-[22px] shrink-0" />
            <span aria-hidden className="w-full px-0.5 text-center text-[10px] leading-tight text-muted-foreground">
              Notification
            </span>
            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 [&_button]:!h-11 [&_button]:!w-11 [&_button>span]:!right-1 [&_button>span]:!top-1">
              <NotificationBell compact />
            </div>
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
                "relative flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5",
                "transition-colors active:bg-muted/60",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                moreActive ? "text-primary font-medium" : "text-muted-foreground",
              )}
            >
              {moreActive && (
                <span
                  aria-hidden
                  className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary"
                />
              )}
              <MoreHorizontal className="h-5 w-5 shrink-0" aria-hidden />
              <span className="w-full px-0.5 text-center text-[10px] leading-tight">More</span>
            </button>
          </li>
        </ul>
        )}
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
