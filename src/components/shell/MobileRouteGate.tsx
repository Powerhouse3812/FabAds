import { useMemo } from "react";
import BestOnDesktop from "@/components/shell/BestOnDesktop";
import { MobileCapabilityContext } from "@/components/shell/MobileCapabilityContext";
import { useMobilePolicy } from "@/components/shell/mobileRoutePolicy";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * MobileRouteGate — the single choke point for the mobile allowlist.
 *
 * WHY IT LIVES AT LAYOUT LEVEL
 * AppLayout renders exactly one `<Outlet/>` for ~200 routes. Wrapping that one
 * Outlet here means the gate is applied by construction — no per-page opt-in,
 * no route that can forget to check the policy. It also sits INSIDE AppLayout,
 * which means it structurally cannot reach the print/export routes: those
 * mount their own tree outside AppLayout precisely so a browser's print
 * dialog or an exported PDF never carries app chrome (or a gate screen).
 *
 * WHY BLOCKED ROUTES RENDER INSTEAD OF REDIRECTING
 * A redirect would rewrite the URL, and the URL is the artifact the copy-link
 * flow depends on — Maalik shares `/reports/creative` links into Slack
 * expecting the recipient to land on that exact path (readable on desktop,
 * an honest "best on desktop" card on a phone). Redirecting to /dashboard
 * would silently break that contract.
 */
export function MobileRouteGate({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const policy = useMobilePolicy();

  // Hooks must run unconditionally every render, so this is computed before
  // the early-return check below rather than after it.
  const cap = useMemo(
    () => ({ isMobile, support: policy.support }),
    [isMobile, policy.support],
  );

  // JS gate, not `hidden md:hidden` CSS. A blocked page must never mount: it
  // would still fire its data hooks and let ResizeObservers measure a 0x0
  // wide table, which is the exact class of breakage this gate exists to
  // prevent. So the blocked branch returns EARLY, before children reach the
  // provider below.
  if (isMobile && policy.support === "blocked") {
    return (
      <BestOnDesktop
        variant="screen"
        label={policy.label}
        reason={policy.reason}
        fallback={policy.fallback}
      />
    );
  }

  // `children` must pass through as the SAME element reference — never
  // cloned, never wrapped, never mapped. The caller hands this a single
  // `<Outlet/>`; only the context VALUE is memoized here. If an `isMobile`
  // flip (crossing 768px, rotating the device) produced a new `children`
  // identity, React would remount the entire routed subtree on every
  // crossing — wiping accumulated infinite-scroll pages and scroll position
  // in the Insights feed. Passing the same reference through is what keeps
  // the subtree mounted across the flip.
  return (
    <MobileCapabilityContext.Provider value={cap}>
      {children}
    </MobileCapabilityContext.Provider>
  );
}
