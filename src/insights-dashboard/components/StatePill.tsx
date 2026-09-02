/**
 * StatePill — dev-only floating switcher for forcing the dashboard into any
 * of its four states: `populated` / `firstTime` / `empty` / `loading`.
 *
 * Collapsed from five (Maalik: keep only populated, first-time and empty,
 * plus the loading transition — `error`, a partial source failure, is gone
 * entirely). `thin` → `firstTime`, `zero` → `empty`; old `?state=` links using
 * any of the three retired values still resolve, silently aliased in
 * `state/DashboardState.tsx`, so a previously shared review link never lands
 * on a blank page.
 *
 * This is how the entire review of this dashboard happens: Maalik flips
 * between the states to check every block's coverage, so the control has to
 * be instant (one click, no dropdown round-trip) and never in the way of the
 * content it's reviewing.
 *
 * ── Why two rows rather than one ──────────────────────────────────────────
 * Four buttons split as:
 *
 *   DATA   how much data exists      populated · firstTime · empty
 *   FETCH  whether the fetch worked  loading
 *
 * The split is a labelling decision as much as a layout one. `empty` and
 * `loading` render almost identically — empty everywhere — and mean opposite
 * things ("you have none" versus "we haven't looked yet"). Putting them under
 * different headings makes the reviewer read them as different questions,
 * even with `loading` alone in its row now. Order comes from
 * `DASHBOARD_STATES`, labels from `DASHBOARD_STATE_LABELS`, grouping from
 * `DASHBOARD_STATE_GROUPS` — so a future state appears here automatically.
 *
 * Same house grammar as `src/creative-report-v2/components/StatesSwitcher.tsx`
 * (FlaskConical icon, dashed border, mono micro-labels, deliberately
 * unpolished so nobody mistakes it for product UI).
 *
 * Gated on `isInsightsDashboardEnabled()` inside this component itself (not by
 * the caller) — it must never render for end users.
 *
 * That is the SAME flag that reveals the dashboard's nav row, and it is
 * deliberately not `import.meta.env.DEV`. The states are the whole point of
 * this page — firstTime, empty and loading carry most of its design argument
 * — and they are reviewed on the deployed build, not on localhost. A DEV-only
 * pill meant the one person allowed to see the page had to hand-type
 * `?state=` to see most of it.
 *
 * Anyone who has set the flag has already opted in past the nav gate, so
 * showing them the switcher reveals nothing new. End users, who never set it,
 * still never see this. Reachable on purpose, never by accident.
 */
import { FlaskConical } from "lucide-react";
import { isInsightsDashboardEnabled } from "@/insights-dashboard/lib/access";

import { cn } from "@/lib/utils";
import {
  DASHBOARD_STATES,
  DASHBOARD_STATE_GROUPS,
  DASHBOARD_STATE_LABELS,
} from "@/insights-dashboard/lib/fixtures";
import type { DashboardState } from "@/insights-dashboard/lib/types";
import {
  useDashboardState,
  useSetDashboardState,
} from "@/insights-dashboard/state/DashboardState";

/**
 * Groups, filtered to the states that actually exist and ordered by
 * `DASHBOARD_STATES`. Anything a group forgot to claim falls into a trailing
 * "OTHER" row rather than silently disappearing from the switcher — a state
 * you cannot reach is a state nobody reviews.
 */
const ROWS: ReadonlyArray<{ key: string; label: string; states: DashboardState[] }> = (() => {
  const claimed = new Set<DashboardState>();
  const rows = DASHBOARD_STATE_GROUPS.map((group) => {
    const states = DASHBOARD_STATES.filter((s) => group.states.includes(s));
    for (const s of states) claimed.add(s);
    return { key: group.key, label: group.label, states };
  }).filter((row) => row.states.length > 0);

  const orphans = DASHBOARD_STATES.filter((s) => !claimed.has(s));
  return orphans.length
    ? [...rows, { key: "other", label: "Other", states: [...orphans] }]
    : rows;
})();

/** `text-foreground/70` (5.99:1), not `text-muted-foreground` (3.48:1 on
 * `bg-card` in light — fails WCAG AA for text). The flask ICON beside it may
 * stay muted; this is real text. */
const MICRO_LABEL =
  "font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-foreground/70";

export function StatePill(): JSX.Element | null {
  // Hooks are called unconditionally (Rules of Hooks). The flag is read once
  // at module load, so this early return is stable across renders; it just has
  // to come after the hook calls, not before them.
  const current = useDashboardState();
  const setState = useSetDashboardState();

  if (!isInsightsDashboardEnabled()) return null;

  return (
    <div
      role="group"
      aria-label="Dashboard data state (dev only)"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-1 rounded-2xl border border-dashed border-border bg-card p-1.5 shadow-lg"
    >
      {ROWS.map((row, rowIndex) => (
        <div key={row.key} className="flex items-center gap-1.5">
          {/* The flask sits on the first row only — one mark for the whole
              control, not one per row. */}
          <span className="flex w-14 shrink-0 items-center gap-1">
            {rowIndex === 0 ? (
              <FlaskConical
                className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            ) : (
              <span className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            )}
            <span className={MICRO_LABEL}>{row.label}</span>
          </span>

          <div className="flex items-center gap-0.5">
            {row.states.map((state) => {
              const isActive = state === current;
              return (
                <button
                  key={state}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setState(state)}
                  className={cn(
                    "whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[9px] font-medium uppercase tracking-[0.14em] transition-colors",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    isActive
                      ? // `text-primary-text` (5.25:1), never `text-primary`
                        // (1.99:1 on this tint in light mode).
                        "bg-primary/15 text-primary-text"
                      : "text-foreground/70 hover:text-foreground",
                  )}
                >
                  {DASHBOARD_STATE_LABELS[state]}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
