import { createContext, useContext } from "react";

/**
 * MobileCapabilityContext — the seam between the mobile route gate and every
 * feature surface (Reports, Insights, Creative Report, Launch Hub).
 *
 * The gate (MobileRouteGate) resolves the route policy once and publishes the
 * result here. Surfaces read it to decide whether to render their mobile layout
 * and whether write affordances (bulk select, the preferences wizard, the
 * 2-month calendar, entity mutations) are permitted.
 *
 * RULE: consumers must NEVER re-derive capability from `pathname`. There is one
 * resolver (mobileRoutePolicy) and one publisher (the gate). A surface that
 * matches paths itself will drift from the gate the first time the allowlist
 * changes, and the drift is silent.
 *
 * The default value is deliberately permissive — see below.
 */

import type { MobileSupport } from "@/components/shell/mobileRoutePolicy";

export type { MobileSupport };

export interface MobileCapability {
  isMobile: boolean;
  support: MobileSupport;
}

/**
 * Default `{ isMobile: false, support: "full" }` is LOAD-BEARING, not a
 * placeholder: everything rendered outside the provider — the entire desktop
 * shell, unit tests, isolated component harnesses — must behave exactly as it
 * did before mobile support existed. A restrictive default would silently
 * disable desktop write affordances.
 */
export const MobileCapabilityContext = createContext<MobileCapability>({
  isMobile: false,
  support: "full",
});

export function useMobileCapability(): MobileCapability {
  return useContext(MobileCapabilityContext);
}

/**
 * True when write affordances must be suppressed. Desktop is NEVER read-only —
 * `support: "readonly"` only constrains the mobile rendering of a route.
 */
export function useIsReadOnly(): boolean {
  const { isMobile, support } = useMobileCapability();
  return isMobile && support === "readonly";
}

/** True when the surface should render its mobile layout. */
export function useIsMobileSurface(): boolean {
  return useMobileCapability().isMobile;
}
