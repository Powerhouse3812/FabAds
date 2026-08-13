import { useLocation, useNavigate } from "react-router-dom";
import { X, Sparkles, Compass } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import {
  MODULES,
  SYSTEM_MODULES,
  groupedModules,
  type ModuleDef,
  hasSubItems,
  allSubPaths,
  deriveActiveModule,
  isSubItemActive,
} from "@/components/sidebar/modules";
import { resolveMobilePolicy, type MobileSupport } from "@/components/shell/mobileRoutePolicy";
import { useMobileTourProgress } from "@/mobile-tour";
/**
 * Mobile sheet content — single-pane, sectioned by RUN/CREATE/AUTOMATE/TOOLS
 * group labels just like the desktop nav.
 *
 * Post A-10.13: V1-V6 variants dropped, so `groupedModules()` no longer takes
 * a variant param. Single canonical grouping.
 *
 * This sheet is becoming the "More" tray of a bottom tab bar, so it now also
 * has to be honest about which of these rows actually work on a phone —
 * see `showDesktopOnly` below — and needs its own visible close control
 * (see the header row) now that it's a trap without navigate-to-close.
 */

/**
 * Worst-case mobile support across everything a module can navigate to.
 * A module with no sub-items is just its own route's verdict. A module WITH
 * sub-items is "blocked" for sorting purposes only when every single child is
 * blocked — Industry Insights has both allowed children (feed/discover/
 * boards) and blocked ones (competitors/saved), and demoting the whole
 * module because of two locked children would bury the allowed ones too.
 * Individual rows still resolve their OWN policy for the dimmed/chip
 * treatment — this is only used to decide sort position.
 */
function moduleMobileSupport(mod: ModuleDef): MobileSupport {
  if (hasSubItems(mod)) {
    const paths = allSubPaths(mod);
    if (paths.length === 0) return "blocked";
    const allBlocked = paths.every((p) => resolveMobilePolicy(p).support === "blocked");
    if (allBlocked) return "blocked";
    const allFull = paths.every((p) => resolveMobilePolicy(p).support === "full");
    return allFull ? "full" : "readonly";
  }
  if (!mod.path) return "blocked";
  return resolveMobilePolicy(mod.path).support;
}

/**
 * Allowed-first ordering within a group: full/readonly modules before
 * blocked ones. `Array.prototype.sort` is stable in every engine this app
 * targets (ES2019+), so modules that land in the same bucket keep their
 * original `modules.ts` order — this only ever moves blocked rows down,
 * never reshuffles within a tier.
 */
function sortAllowedFirst(modules: ModuleDef[]): ModuleDef[] {
  const rank = (m: ModuleDef) => (moduleMobileSupport(m) === "blocked" ? 1 : 0);
  return [...modules].sort((a, b) => rank(a) - rank(b));
}

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
  /** Opens Flow B ("Mobile tour"). Same ownership reason. */
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
   * dimmed with a "Desktop" chip — instead of disappearing. Hiding ~80% of
   * the nav on phones would make the product look broken and would break
   * the mental model a desktop user already carries over. Tapping a
   * dimmed row still navigates: it lands on the "Best on desktop" gate
   * screen, which offers a copy-link / "send myself this link for later"
   * action that is genuinely useful when you're on the bus and the report
   * you need is a laptop-only surface. Set to false only for a variant that
   * wants a hard allowlist instead of an honest "here, but not here yet."
   */
  showDesktopOnly?: boolean;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const groups = groupedModules();
  const tourProgress = useMobileTourProgress();

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  const renderDesktopChip = (support: MobileSupport) =>
    showDesktopOnly && support === "blocked" ? (
      <span className="ml-auto shrink-0 text-[10px] text-muted-foreground border border-border rounded px-1">
        Desktop
      </span>
    ) : null;

  const renderModule = (mod: ModuleDef) => {
    const active = deriveActiveModule(pathname) === mod.key;
    if (!hasSubItems(mod)) {
      const policy = mod.path ? resolveMobilePolicy(mod.path) : undefined;
      const isBlocked = showDesktopOnly && policy?.support === "blocked";
      return (
        <button
          key={mod.key}
          onClick={() => go(mod.path!)}
          className={cn(
            "w-full text-left px-3 py-2 min-h-11 rounded-md text-sm flex items-center gap-2.5",
            active
              ? "bg-g6-primary/10 text-g6-primary-active font-medium"
              : isBlocked
                ? "text-muted-foreground/60"
                : "text-foreground/80"
          )}
        >
          <mod.icon className="h-4 w-4 shrink-0" />
          {mod.label}
          {mod.comingSoon ? (
            <span className="ml-auto shrink-0 text-[10px] text-muted-foreground border border-border rounded px-1">
              Soon
            </span>
          ) : (
            policy && renderDesktopChip(policy.support)
          )}
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
            return (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                className={cn(
                  "w-full text-left px-3 py-1.5 min-h-11 rounded-md text-sm flex items-center gap-2",
                  itemActive
                    ? "bg-g6-primary/10 text-g6-primary-active font-medium"
                    : itemBlocked
                      ? "text-muted-foreground/60"
                      : "text-foreground/70"
                )}
              >
                {item.label}
                {/* Sub-item badges (e.g. "Current"/"New" on Creative Report
                    2.0/3.0) were never rendered here pre-existing — keeping
                    that as-is and only adding the desktop-only chip. */}
                {renderDesktopChip(itemPolicy.support)}
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
                  {sortAllowedFirst(modules).map(renderModule)}
                </div>
              </div>
            )
          )}
          {SYSTEM_MODULES.length > 0 && (
            <>
              <div className="border-t border-border my-2" />
              {sortAllowedFirst(SYSTEM_MODULES).map(renderModule)}
            </>
          )}

          {/* Two new-user flows, deliberately separate (Maalik, 2026-08-11).
              Flow A sets up the feed + Genie; Flow B orients the user in the
              mobile app itself. Each owns its own Replay / Start-fresh prompt,
              so this menu only has to open them. */}
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
            <button
              type="button"
              onClick={() => {
                onStartMobileTour?.();
                onClose();
              }}
              className="flex min-h-11 items-center gap-2.5 rounded-md px-3 text-left text-[13px] text-foreground hover:bg-accent/10"
            >
              <Compass className="h-4 w-4 shrink-0 text-muted-foreground" />
              Mobile tour
              {tourProgress.started && !tourProgress.allDone && (
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                  {tourProgress.doneCount}/{tourProgress.total}
                </span>
              )}
            </button>
          </div>
        </div>
      </ScrollArea>

      <div className="border-t border-border px-1.5 py-1.5 flex items-center gap-1">
        <div className="flex-1">
          <UserMenu />
        </div>
        <NotificationBell />
      </div>
    </div>
  );
}
