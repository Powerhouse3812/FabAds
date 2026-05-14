import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Bell, Layers } from "lucide-react";
import { UpsellPopover } from "@/components/shell/UpsellPopover";
import { MODULES, MODULE_GROUPS, type ModuleDef } from "@/components/sidebar/modules";
import { cn } from "@/lib/utils";

/**
 * Public print-friendly export of the FabAds upsell experience.
 *
 * URL: /upsell-print/:moduleKey  (reports | launch | automation)
 *
 * Renders the FULL composition that the user sees in-app when they
 * click a PRO menu item on the AI plan:
 *   - The AI plan nav rail (static replica) on the left
 *   - A dimmed app body to the right (representing the My Feeds page
 *     behind the modal)
 *   - The upsell popover positioned next to the locked rail item
 *
 * Critically, the popover is rendered INLINE (no Radix Portal) so
 * design-importer tools like html.to.design can capture it as part
 * of the page DOM. Radix Popover portals to document.body which
 * makes the in-app interactive popover invisible to scrapers.
 *
 * Mirrors the brand-book-print pattern (public, no auth, no shell,
 * no animation).
 */

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@400;500;600;700&display=swap";

function usePrintEnvironment() {
  useEffect(() => {
    const id = "upsell-print-fonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = FONT_HREF;
      document.head.appendChild(link);
    }
    const prev = {
      htmlOverflow: document.documentElement.style.overflow,
      bodyOverflow: document.body.style.overflow,
      bodyMargin: document.body.style.margin,
    };
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.margin = "0";
    return () => {
      document.documentElement.style.overflow = prev.htmlOverflow;
      document.body.style.overflow = prev.bodyOverflow;
      document.body.style.margin = prev.bodyMargin;
    };
  }, []);
}

/* ── Static replica of a single rail item ── */
function StaticRailItem({
  mod,
  locked = false,
  active = false,
}: {
  mod: ModuleDef;
  locked?: boolean;
  active?: boolean;
}) {
  const Icon = mod.icon;
  const badge = locked ? "PRO" : mod.badge;
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center gap-0.5 rounded-md px-0.5 py-1",
        active && "bg-white/[0.05]",
      )}
    >
      <span
        className={cn(
          "relative flex h-6 w-6 items-center justify-center rounded",
          active && "bg-white/[0.12] ring-1 ring-white/[0.18]",
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4",
            locked ? "text-zinc-500" : active ? "text-white" : "text-zinc-300",
          )}
        />
        {badge ? (
          <span
            className={cn(
              "absolute -right-2 -top-1.5 rounded-sm px-[3px] py-[1px] font-mono text-[7px] font-bold uppercase tracking-wider leading-none shadow-[0_0_0_1px_rgba(0,0,0,0.25)]",
              locked
                ? "bg-zinc-200 text-zinc-700"
                : "bg-[#c3eb42] text-[#1a1a17]",
            )}
          >
            {badge}
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "text-[8.5px] leading-[10px] font-medium tracking-tight text-center line-clamp-1 max-w-full px-0.5 mt-0.5",
          locked
            ? "text-zinc-500"
            : active
              ? "text-white"
              : "text-zinc-400",
        )}
      >
        {mod.label}
      </span>
    </div>
  );
}

function RailDivider() {
  return (
    <div className="mx-3 my-2 h-px bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.12)_50%,transparent_100%)]" />
  );
}

/* ── Main print page ── */
export function UpsellPrintPage() {
  usePrintEnvironment();
  const { moduleKey = "reports" } = useParams<{ moduleKey: string }>();

  // Same filter logic as ParentNavigationRail (AI plan)
  const visibleModules = MODULES.filter((m) => !m.comingSoon);
  const isLockedForAi = (m: ModuleDef) =>
    !!(m.plans && !m.plans.includes("ai"));
  const primary = visibleModules.filter(
    (m) => !isLockedForAi(m) && MODULE_GROUPS[m.key] !== "TOOLS",
  );
  const tools = visibleModules.filter(
    (m) => !isLockedForAi(m) && MODULE_GROUPS[m.key] === "TOOLS",
  );
  const locked = visibleModules.filter(isLockedForAi);

  // Find which locked item gets the popover anchor
  const lockedIndex = locked.findIndex((m) => m.key === moduleKey);
  const popoverAnchor = lockedIndex >= 0 ? lockedIndex : 0;

  return (
    <div
      className="flex min-h-screen w-full font-[system-ui]"
      style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
      data-design-export="upsell-full-composition"
    >
      {/* AI plan rail — static replica */}
      <aside
        className={cn(
          "relative flex w-[64px] shrink-0 flex-col overflow-hidden",
          "h-screen",
          "bg-[linear-gradient(180deg,hsl(80_30%_12%)_0%,hsl(80_15%_8%)_50%,hsl(80_25%_10%)_100%)]",
          "text-zinc-100",
        )}
      >
        {/* Glass highlight */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.03)_50%,transparent_100%)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_140px_80px_at_50%_-10%,rgba(195,235,66,0.18),transparent_70%)]"
        />

        {/* Header — logo placeholder */}
        <div className="relative z-10 flex h-12 shrink-0 items-center justify-center">
          <div className="h-7 w-7 rounded-md bg-primary/30 inline-flex items-center justify-center text-[12px] font-bold text-foreground">
            F
          </div>
        </div>

        <RailDivider />

        {/* Body — primary + tools + locked */}
        <div className="relative z-10 flex-1 min-h-0 py-1.5 px-1.5">
          <div className="flex flex-col gap-0.5">
            {primary.map((mod) => (
              <StaticRailItem
                key={mod.key}
                mod={mod}
                active={mod.key === "insights"}
              />
            ))}
          </div>
          {tools.length > 0 && (
            <>
              <RailDivider />
              <div className="flex flex-col gap-0.5">
                {tools.map((mod) => (
                  <StaticRailItem key={mod.key} mod={mod} />
                ))}
              </div>
            </>
          )}
          {locked.length > 0 && (
            <>
              <RailDivider />
              <div className="px-1 pb-1 text-center">
                <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-zinc-500">
                  Upgrade
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                {locked.map((mod) => (
                  <StaticRailItem
                    key={mod.key}
                    mod={mod}
                    locked
                    active={mod.key === moduleKey}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <RailDivider />

        {/* Footer — Plan toggle (lime dot for AI plan) + Bell */}
        <div className="relative z-10 flex flex-col items-center gap-1 py-2 shrink-0">
          <button
            type="button"
            aria-label="Switch plan — current: AI plan"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-300"
          >
            <Layers className="h-4 w-4" />
            <span
              className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-primary"
              aria-hidden
            />
          </button>
          <button
            type="button"
            aria-label="Notifications"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-300"
          >
            <Bell className="h-4 w-4" />
          </button>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-foreground">
            M
          </span>
        </div>
      </aside>

      {/* Dimmed main area — represents the My Feeds page behind the modal */}
      <main
        className="relative flex-1 bg-background"
        style={{ minHeight: "100vh" }}
      >
        {/* Backdrop overlay */}
        <div
          aria-hidden
          className="absolute inset-0 bg-black/70"
          style={{ backdropFilter: "blur(4px)" }}
        />

        {/* Inline upsell card — positioned approximately next to the
            locked rail item. Y offset puts it near the bottom-left
            since locked items live at the bottom of the rail. */}
        <div
          className="absolute left-3"
          style={{
            // Approximate y to match the locked item's vertical position
            // in the rail. Each locked item is ~50px; the locked block
            // starts roughly 78% down the rail.
            top: `calc(100vh - ${260 - popoverAnchor * 50}px)`,
          }}
        >
          <article
            className="rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
            data-design-export="upsell-tooltip"
          >
            <UpsellPopover />
          </article>
        </div>
      </main>
    </div>
  );
}
