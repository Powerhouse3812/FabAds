import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * MobileInsightsTabs — 3-segment surface switcher for Industry Insights on
 * mobile: My feeds · Discover · Saved Ads.
 *
 * WHY IT EXISTS
 * Desktop reaches these through the sub-nav panel, which is `display:none` on
 * a phone. Without this control, mobile only ever showed My feeds and its
 * siblings were reachable only by opening the More sheet — i.e. effectively
 * invisible on the module that matters most on a phone.
 *
 * Deliberately a sibling of `components/reports/mobile/MobileLevelSegments.tsx`
 * — same markup, same active-state treatment, same 44px floor. Two modules
 * doing the same job should not look like two designers' work. Keep them in
 * sync if either changes.
 *
 * BOARDS IS DELIBERATELY ABSENT (Maalik, 2026-08-11): the toggle is the three
 * surfaces above; Boards stays reachable from the More sheet. Note Saved Ads is
 * still an unbuilt `ComingSoonPage` stub — it is allowed on mobile in
 * `mobileRoutePolicy.ts` precisely so this segment lands on "coming soon"
 * rather than a "Best on desktop" gate for a screen that has no desktop
 * version either.
 *
 * `md:hidden` — this is mobile-only chrome; desktop keeps its sub-nav.
 */

interface Segment {
  label: string;
  path: string;
  /** Extra paths that should still light this segment (detail routes etc.). */
  alsoMatches?: string[];
}

const SEGMENTS: Segment[] = [
  { label: "My feeds", path: "/insights-v2/feed" },
  { label: "Discover", path: "/insights/discover" },
  { label: "Saved Ads", path: "/insights/saved" },
];

export interface MobileInsightsTabsProps {
  className?: string;
}

export function MobileInsightsTabs({ className }: MobileInsightsTabsProps) {
  const { pathname } = useLocation();

  return (
    <div
      role="tablist"
      aria-label="Industry Insights surface"
      className={cn(
        // 3 segments across ~343px is ~114px each — comfortable, no truncation.
        "grid w-full grid-cols-3 gap-1 md:hidden",
        className,
      )}
    >
      {SEGMENTS.map((seg) => {
        const isActive =
          pathname === seg.path ||
          (seg.alsoMatches?.some((p) => pathname.startsWith(p)) ?? false);
        return (
          <NavLink
            key={seg.path}
            to={seg.path}
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-[44px] items-center justify-center rounded-md border px-1 text-center text-[11px] leading-tight transition-colors",
              isActive
                // Weight + border + fill, never colour alone (WCAG 1.4.1).
                ? "border-primary bg-primary font-semibold text-primary-foreground"
                : "border-border bg-background font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {seg.label}
          </NavLink>
        );
      })}
    </div>
  );
}

export default MobileInsightsTabs;
