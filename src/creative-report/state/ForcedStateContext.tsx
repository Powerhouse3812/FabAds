/**
 * Creative Report 2.0 — dev-only forced-state layer.
 *
 * The URL `?state=` param IS the store (shareable + screenshot-able). This hook
 * reads it; the footer StatesSwitcher (build step 7) writes it. useCreativeData
 * short-circuits on the returned value to render each §8 data state on demand.
 *
 * A provider is exported for future overrides, but the value is derived purely
 * from the URL today, so no wiring beyond reading the param is required.
 */
import { createContext, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { FORCED_STATES, P, type ForcedState } from "@/creative-report/lib/paramSchema";

const ForcedStateContext = createContext<ForcedState | null>(null);

export function ForcedStateProvider({ children }: { children: React.ReactNode }) {
  const [params] = useSearchParams();
  const raw = params.get(P.state);
  const value = raw && (FORCED_STATES as readonly string[]).includes(raw)
    ? (raw as ForcedState)
    : null;
  return <ForcedStateContext.Provider value={value}>{children}</ForcedStateContext.Provider>;
}

/** Current forced state, or null when running against real data. */
export function useForcedState(): ForcedState | null {
  return useContext(ForcedStateContext);
}
