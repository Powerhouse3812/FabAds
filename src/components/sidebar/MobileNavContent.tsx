import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { X, Sparkles, Lock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import {
  SYSTEM_MODULES,
  groupedModules,
  type ModuleDef,
  hasSubItems,
  allSubPaths,
  deriveActiveModule,
  isSubItemActive,
} from "@/components/sidebar/modules";
import { resolveMobilePolicy, type MobileSupport } from "@/components/shell/mobileRoutePolicy";
import { DesktopOnlyPrompt } from "@/components/shell/DesktopOnlyPrompt";
import { usePlan } from "@/contexts/PlanContext";
import { FEATURE_PRESETS } from "@/components/shell/LockedFeatureSellModal";
/**
 * Mobile sheet content — single-pane, sectioned by RUN/CREATE/TOOLS
 * group labels just like the desktop nav.
 *
 * Post A-10.13: V1-V6 variants dropped, so `groupedModules()` no longer takes
 * a variant param. Single canonical grouping.
 *
 * Mobile spec 2026-08-21 (review feedback, Neeraj Moudgil via Slack): this
 * sheet used to be a hand-written list that ALSO re-sorted each group so
 * mobile-allowed modules floated above blocked ones (`sortAllowedFirst`,
 * removed). Both were "effort spent making mobile feel like a separate app"
 * — the exact complaint. Fixed: `groupedModules()` renders verbatim, in
 * `modules.ts`'s own declaration order, with zero mobile-only reshuffling.
 * Blocked-ness is now communicated only by dimming + a trailing chip, not
 * by moving a row's position — the tree a desktop user already knows is the
 * tree they get here.
 *
 * MOBILE_SPEC_B §1.2 (2026-08-21, Maalik's revision): batch A made a
 * policy-blocked row a real `disabled` `<button>` — dead on tap, and a truly
 * `disabled` element is pulled out of the tab order, so a screen reader never
 * announces WHY. Replaced with `DesktopOnlyPrompt`
 * (`shell/DesktopOnlyPrompt.tsx`): the row stays a real, focusable,
 * `aria-disabled` button; tapping it opens a dialog naming the surface, a
 * reason read LIVE from `resolveMobilePolicy` (so this sheet and the
 * `BestOnDesktop` gate the same route renders can never tell two different
 * stories), and exactly one working action — copy an absolute link for
 * desktop.
 *
 * TWO DIFFERENT "can't use this here" REASONS NEED TWO DIFFERENT TREATMENTS
 * (batch-A monitor finding, fixed in this pass): this component never called
 * `usePlan()`, so on the AI plan a module tagged `plans: ["full"]` in
 * `modules.ts` (today: Reports, Automation) rendered through the exact same
 * viewport-blocked path as everything else — "needs a bigger screen." That is
 * false for these two: an AI-plan user hits the identical Growth paywall on
 * desktop too, so "Copy link for desktop" would hand back a link that opens
 * straight into an upsell, not the feature — the one-honest-story rule
 * `DesktopOnlyPrompt` was built to protect, broken one level up. So a
 * plan-locked module is checked FIRST, ahead of the mobile-policy check, and
 * short-circuits to its own row: an ordinary, always-clickable button with a
 * "Growth" chip that opens the SAME canonical paywall
 * (`LockedFeatureSellModal`, mounted once in `ParentNavigationRail` and
 * reached everywhere else via the shared `?upsell=<key>` URL param — see
 * `UserMenu`'s Team/Integration rows for the sibling usage this copies) —
 * not a second modal instance, not new copy. This also mirrors
 * `ParentNavigationRail`'s own `RailItem`: a locked module there never
 * expands into a hover-card of sub-items either, it collapses to one row —
 * the two navs read plan-lock the exact same way on purpose (see
 * `isPlanLocked` below, copied filter logic per that file's own comment).
 * `mod.comingSoon` (BG Remover / Object Remover) is a THIRD, older reason —
 * not built on ANY platform yet — and deliberately keeps its plain disabled
 * look below: there is no desktop link to send anyone to for a feature that
 * doesn't exist there either.
 *
 * This sheet is the "More" tray of a bottom tab bar, so it also needs its
 * own visible close control (see the header row) now that it's a trap
 * without navigate-to-close.
 */

export function MobileNavContent({
  onClose,
  onStartSetupFlow,
  onStartMobileTour,
  showDesktopOnly = true,
  showCloseHeader = true,
}: {
  onClose: () => void;
  /** Opens Flow A ("Set up my feed & Genie"). Owned by the caller because this
   *  component unmounts with the sheet — a flow mounted here would vanish the
   *  instant the menu closed. */
  onStartSetupFlow?: () => void;
  /**
   * Opens Flow B ("Mobile tour"). Mobile spec 2026-08-21 §2.3 parks Flow B —
   * its menu entry is removed below (the flow itself still lives, unmounted,
   * at `src/mobile-tour/`). This component no longer calls the prop, but it
   * stays in the signature: `MobileTabBar` owns both `onStartSetupFlow` and
   * `onStartMobileTour` and is outside this file's assignment, so dropping
   * the prop here would force an edit there just to keep the props type
   * satisfied. If the tour launcher is ever fully removed from MobileTabBar,
   * this prop should go with it.
   */
  onStartMobileTour?: () => void;
  /**
   * Render this component's own grabber + close row. Default true so it stays
   * self-sufficient if ever used standalone, but the More sheet in
   * `MobileTabBar` already supplies both a header ✕ and a footer Close — three
   * close controls in one sheet is noise, not redundancy — so that caller
   * passes false.
   */
  showCloseHeader?: boolean;
  /**
   * When true (default), rows the mobile policy blocks still render — just
   * dimmed, with a trailing "Desktop" chip, wrapped in `DesktopOnlyPrompt` —
   * instead of disappearing. Hiding ~80% of the nav on phones would make the
   * product look broken and would break the mental model a desktop user
   * already carries over. Tapping a dimmed row now opens the
   * explain-and-copy-link dialog rather than doing nothing (MOBILE_SPEC_B
   * §1.2) — see the file-level doc. Set to false only for a variant that
   * wants a hard allowlist instead of an honest "here, but not here yet."
   * Plan-locked rows (Reports/Automation on the AI plan, see the file-level
   * doc) are NOT gated by this flag — plan-lock is a different, more
   * fundamental reason than viewport, and it always shows regardless.
   */
  showDesktopOnly?: boolean;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const { plan } = usePlan();
  const groups = groupedModules();

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  // Plan lock, copied from `ParentNavigationRail`/`MobileTabBar` so all three
  // navs can never disagree about which modules the AI plan hides. Modules
  // tagged `plans: ["full"]` are Reports and Automation today; nothing else
  // reads this component to decide, so this stays a plain generic check
  // rather than a hardcoded module-key list.
  const isPlanLocked = (mod: ModuleDef) => !!(mod.plans && !mod.plans.includes(plan));

  // Same `?upsell=<key>` URL-param channel `UserMenu`'s Team/Integration rows
  // already write to. The modal itself is mounted once, in
  // `ParentNavigationRail` — that aside is `hidden md:flex` but still always
  // MOUNTED (AppShell never conditionally renders it), so the Dialog it
  // contains still portals to <body> and opens correctly from a phone. Not
  // this file's job to mount a second instance of a paywall the app already
  // has one canonical copy of.
  const openUpsell = (key: string) => {
    if (import.meta.env.DEV && !FEATURE_PRESETS[key]) {
      console.warn(
        `[MobileNavContent] "${key}" is plan-locked (modules.ts \`plans\`) but has no matching ` +
          `FEATURE_PRESETS entry — the Growth upsell modal will silently no-op when this row is tapped. ` +
          `Add a "${key}" preset in LockedFeatureSellModal.tsx.`,
      );
    }
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.set("upsell", key);
        return sp;
      },
      { replace: false },
    );
  };

  const renderDesktopChip = (support: MobileSupport) =>
    showDesktopOnly && support === "blocked" ? (
      <span className="ml-auto shrink-0 text-[10px] text-muted-foreground border border-border rounded px-1">
        Desktop
      </span>
    ) : null;

  const renderModule = (mod: ModuleDef) => {
    const active = deriveActiveModule(pathname) === mod.key;

    // Plan lock short-circuits BEFORE the sub-items check — see the
    // file-level doc's "two reasons, two treatments." A locked module
    // collapses to one row regardless of whether it has sub-items, exactly
    // like `ParentNavigationRail`'s `RailItem` never expands a locked
    // module's hover-card either.
    if (isPlanLocked(mod)) {
      return (
        <button
          key={mod.key}
          onClick={() => openUpsell(mod.key)}
          className="w-full text-left px-3 py-2 min-h-11 rounded-md text-sm flex items-center gap-2.5 text-muted-foreground"
        >
          <mod.icon className="h-4 w-4 shrink-0" />
          {mod.label}
          <span className="ml-auto shrink-0 flex items-center gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-wider bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 leading-none">
              Growth
            </span>
            <Lock className="h-3 w-3 text-muted-foreground/70" />
          </span>
        </button>
      );
    }

    if (!hasSubItems(mod)) {
      const policy = mod.path ? resolveMobilePolicy(mod.path) : undefined;
      const isBlocked = showDesktopOnly && policy?.support === "blocked";

      // Not built on ANY platform yet (BG Remover / Object Remover) — kept as
      // a plain disabled row, unchanged from before. `DesktopOnlyPrompt`'s
      // "Copy link for desktop" promises a working surface on a bigger
      // screen; that's not true here, so the pattern doesn't apply.
      if (mod.comingSoon) {
        return (
          <button
            key={mod.key}
            disabled
            className="w-full text-left px-3 py-2 min-h-11 rounded-md text-sm flex items-center gap-2.5 text-muted-foreground/60 cursor-not-allowed"
          >
            <mod.icon className="h-4 w-4 shrink-0" />
            {mod.label}
            <span className="ml-auto shrink-0 text-[10px] text-muted-foreground border border-border rounded px-1">
              Soon
            </span>
          </button>
        );
      }

      if (isBlocked) {
        return (
          <DesktopOnlyPrompt key={mod.key} label={policy!.label} path={mod.path} showIndicatorIcon={false}>
            <mod.icon className="h-4 w-4 shrink-0" />
            {mod.label}
            {renderDesktopChip(policy!.support)}
          </DesktopOnlyPrompt>
        );
      }

      return (
        <button
          key={mod.key}
          onClick={() => go(mod.path!)}
          className={cn(
            "w-full text-left px-3 py-2 min-h-11 rounded-md text-sm flex items-center gap-2.5",
            active ? "bg-g6-primary/10 text-g6-primary-active font-medium" : "text-foreground/80"
          )}
        >
          <mod.icon className="h-4 w-4 shrink-0" />
          {mod.label}
        </button>
      );
    }

    return (
      <div key={mod.key}>
        <div className="px-3 py-2 min-h-11 text-sm font-medium text-foreground flex items-center gap-2.5">
          <mod.icon className="h-4 w-4" />
          {mod.label}
        </div>
        {/* iter-6 A-9: Genie6SubnavNewGenButton removed — Studio sub-item replaces it. */}
        <div className="ml-6 flex flex-col gap-0.5">
          {mod.subItems?.map((item) => {
            const siblings = allSubPaths(mod);
            const itemPolicy = resolveMobilePolicy(item.path);
            const itemBlocked = showDesktopOnly && itemPolicy.support === "blocked";
            const itemActive = isSubItemActive(item.path, pathname, siblings);

            if (itemBlocked) {
              return (
                <DesktopOnlyPrompt
                  key={item.path}
                  label={itemPolicy.label}
                  path={item.path}
                  // Sub-item rows run tighter than top-level rows
                  // (`py-1.5`/`gap-2` vs the default `py-2`/`gap-2.5`) —
                  // exactly the delta `DesktopOnlyPrompt`'s own doc calls out
                  // as the intended use of `className`.
                  className="px-3 py-1.5 gap-2"
                  showIndicatorIcon={false}
                >
                  {/* Sub-item badges (e.g. "Current"/"New" on Creative Report
                      2.0/3.0) were never rendered here pre-existing — keeping
                      that as-is and only adding the desktop-only chip. */}
                  {item.label}
                  {renderDesktopChip(itemPolicy.support)}
                </DesktopOnlyPrompt>
              );
            }

            return (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                className={cn(
                  "w-full text-left px-3 py-1.5 min-h-11 rounded-md text-sm flex items-center gap-2",
                  itemActive
                    ? "bg-g6-primary/10 text-g6-primary-active font-medium"
                    : "text-foreground/70"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {showCloseHeader && (
        <div className="flex items-center justify-between px-2 pt-2 pb-1 shrink-0">
          {/* Balances the close button so the grabber stays visually centered. */}
          <div className="h-11 w-11" aria-hidden="true" />
          <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" aria-hidden="true" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="flex items-center justify-center h-11 w-11 shrink-0 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      <ScrollArea className="flex-1">
        <div className="flex flex-col py-2 px-2">
          {groups.map(({ group, modules }) =>
            modules.length === 0 ? null : (
              <div key={group} className="mb-3">
                <span className="block px-3 pt-2 pb-1 text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
                  {group}
                </span>
                <div className="flex flex-col gap-0.5">
                  {modules.map(renderModule)}
                </div>
              </div>
            )
          )}
          {SYSTEM_MODULES.length > 0 && (
            <>
              <div className="border-t border-border my-2" />
              {SYSTEM_MODULES.map(renderModule)}
            </>
          )}

          {/* One new-user flow lives here (Maalik, 2026-08-11; Flow B parked
              2026-08-21 per §2.3 above). Flow A sets up both the feed and
              Genie, and owns its own Replay / Start-fresh prompt, so this
              menu only has to open it. */}
          <div className="border-t border-border my-2" />
          <span className="block px-3 pt-2 pb-1 text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
            Get started
          </span>
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => {
                onStartSetupFlow?.();
                onClose();
              }}
              className="flex min-h-11 items-center gap-2.5 rounded-md px-3 text-left text-[13px] text-foreground hover:bg-accent/10"
            >
              <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground" />
              Set up my feed &amp; Genie
            </button>
          </div>
        </div>
      </ScrollArea>

      <div className="border-t border-border px-1.5 py-1.5 flex items-center gap-1">
        {/* UserMenu's trigger has no explicit height — it's sized by its two
            lines of text (email + client name) plus `py-1.5`, which lands at
            43px (measured), 1px under the WCAG 2.5.5 floor. `min-h-11` sets a
            floor without fighting that content-driven height — at 43px
            already, this is a 1px nudge, not a redesign. Scoped to THIS
            wrapper's direct button child only ([&>button], not [&_button])
            so it can never reach into UserMenu's own dropdown content. */}
        <div className="flex-1 [&>button]:min-h-11">
          <UserMenu />
        </div>
        {/* NotificationBell's trigger (compact=false here) is a fixed 36×36
            box (`w-9 h-9`) — 8px short of 44px. Grown via an invisible
            hit-area expansion, not by enlarging the visible bell: the same
            `after:-inset` technique `ui/sidebar.tsx`'s `SidebarGroupAction`
            and `DesktopOnlyPrompt`'s iconButton shape already use, so the
            glyph stays proportional to the rest of this compact footer row.
            The button is already `position: relative` in NotificationBell.tsx,
            so `after:absolute` positions against its own box; 36px + 4px on
            every side (`-inset-1`) = 44px. */}
        <div className="[&>button]:after:absolute [&>button]:after:-inset-1">
          <NotificationBell />
        </div>
      </div>
    </div>
  );
}
