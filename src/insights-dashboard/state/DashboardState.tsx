/**
 * Industry Insights Dashboard — state reader.
 *
 * Pattern borrowed from `src/creative-report-v2/state/ForcedStateContext.tsx`:
 * the URL `?state=` param IS the store. It is shareable and screenshot-able,
 * and there is no separate store to drift out of sync with the link someone
 * pastes into Slack.
 *
 * Two differences from that precedent:
 *
 *  1. No "real data" fallthrough. This module never had a live backend, so an
 *     absent or unrecognised `state` param means `"populated"` — never null.
 *     `useDashboardState` therefore returns `DashboardState`, not
 *     `DashboardState | null`, and components must never branch on null here.
 *     The accepted values are exactly `DASHBOARD_STATES` — five of them now:
 *     `populated` · `thin` · `zero` · `loading` · `error`. Validation reads
 *     that array rather than a literal list, so adding a state there is all
 *     it takes for `?state=` to accept it, and anything unrecognised
 *     (`?state=lodaing`) still falls back to `populated` rather than
 *     rendering a broken page.
 *  2. We also need a setter (the dev-only state pill writes the param), so
 *     this file wraps `useSearchParams` on both ends:
 *       - Reads default to `"populated"` when the param is missing or does
 *         not match one of `DASHBOARD_STATES`.
 *       - Writes use `{ replace: true }` so rapid toggling (pill-clicking)
 *         does not spam browser history with one entry per click.
 *       - Writing `"populated"` REMOVES the param instead of writing it out
 *         literally, since `"populated"` is already the default — this keeps
 *         the URL clean for the common case and matches what a reader should
 *         expect: "no param" and "?state=populated" are the same state.
 *       - Every other search param on the URL is preserved untouched; only
 *         `state` is added, changed, or removed.
 */
import { createContext, useCallback, useContext } from "react";
import { useSearchParams } from "react-router-dom";

import type { DashboardState } from "@/insights-dashboard/lib/types";
import { DASHBOARD_STATES } from "@/insights-dashboard/lib/fixtures";

/** The URL search param this whole module reads and writes. */
export const DASHBOARD_STATE_PARAM = "state";

const DEFAULT_STATE: DashboardState = "populated";

function isDashboardState(value: string | null): value is DashboardState {
  return value !== null && (DASHBOARD_STATES as readonly string[]).includes(value);
}

type SetDashboardState = (next: DashboardState) => void;

const DashboardStateContext = createContext<DashboardState>(DEFAULT_STATE);
const SetDashboardStateContext = createContext<SetDashboardState>(() => {});

export function DashboardStateProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();

  const raw = searchParams.get(DASHBOARD_STATE_PARAM);
  const value: DashboardState = isDashboardState(raw) ? raw : DEFAULT_STATE;

  const setValue = useCallback<SetDashboardState>(
    (next) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next === DEFAULT_STATE) {
            // Writing the default REMOVES the param — "no param" and
            // "?state=populated" are the same state, and the clean URL is
            // the one people should be sharing.
            params.delete(DASHBOARD_STATE_PARAM);
          } else {
            params.set(DASHBOARD_STATE_PARAM, next);
          }
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return (
    <DashboardStateContext.Provider value={value}>
      <SetDashboardStateContext.Provider value={setValue}>
        {children}
      </SetDashboardStateContext.Provider>
    </DashboardStateContext.Provider>
  );
}

/** Current dashboard state from the URL. Never null — defaults to "populated". */
export function useDashboardState(): DashboardState {
  return useContext(DashboardStateContext);
}

/** Setter that writes `?state=` on the URL, preserving every other param. */
export function useSetDashboardState(): SetDashboardState {
  return useContext(SetDashboardStateContext);
}
