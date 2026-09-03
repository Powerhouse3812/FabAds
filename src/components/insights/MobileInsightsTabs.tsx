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
 * VISUAL TREATMENT (Figma sync, mobile batch F2, 2026-08-21)
 * Restyled from 3 large lime-filled pills (~56px tall) to a 36px iOS-style
 * segmented control: a `bg-muted` track with a 2px inset (`p-0.5`), the
 * active segment reading as a `bg-background` pill with a subtle shadow, and
 * neutral (non-lime) text everywhere. The active segment is still signalled
 * by more than colour — font-weight plus `aria-selected`/`aria-current` — per
 * WCAG 1.4.1.
 *
 * TOUCH TARGET (INV-10) — the visible chrome shrinks to 36px but each
 * segment's actual hit area stays ≥44px tall. This is done by decoupling the
 * two: every `NavLink` is `min-h-11` (44px, the real clickable box) and
 * simply centers a smaller decorative pill (`h-8`, 32px — the track's 36px
 * height minus its 2px inset on each side) inside it via absolute
 * positioning. The link's box overflows the track's fixed `h-9` visually
 * (symmetrically, since the grid centers it), which is fine because overflow
 * is transparent — only the inner pill paints. Net effect: the control reads
 * as 36px, but nowhere is the tappable region shorter than 44px.
 *
 * SIBLING STATUS (was: kept in lockstep with
 * `components/reports/mobile/MobileLevelSegments.tsx`) — that file still
 * renders the OLD 44px lime-fill pill treatment and was deliberately left
 * untouched this batch (Reports is being blocked on mobile, see
 * `mobileRoutePolicy.ts`), so the two have now VISUALLY DIVERGED. The
 * "keep them in sync" instruction below is stale as of this pass. Leaving it
 * written rather than deleting it: if Reports mobile ever ships again, this
 * file's 36px treatment is the one to bring it up to, not the reverse.
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
        // Track: 36px tall (`h-9`), 2px inset (`p-0.5`) on all sides, grey
        // (`bg-muted`) — no lime. `items-center` lets each 44px-tall segment
        // overflow the track symmetrically instead of stretching it taller.
        "grid h-9 w-full grid-cols-3 items-center gap-0.5 rounded-lg bg-muted p-0.5 md:hidden",
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
            className="relative flex min-h-11 items-center justify-center rounded-md px-1 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
          >
            {/* Decorative pill — the ONLY thing that visually reads as
                36px. Sized to the track's 32px content box (36px − 2×2px
                inset), centered inside the 44px link. Never the click
                target itself; `aria-hidden` because the label span below
                already carries the accessible name. */}
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-0 top-1/2 h-8 -translate-y-1/2 rounded-md transition-shadow",
                isActive ? "bg-background shadow-sm" : "bg-transparent",
              )}
            />
            <span
              className={cn(
                "relative z-10 text-[11px] leading-tight",
                // Weight carries the active signal, not colour (WCAG 1.4.1)
                // — both states use neutral foreground tokens, no lime fill.
                isActive
                  ? "font-semibold text-foreground"
                  : "font-medium text-muted-foreground",
              )}
            >
              {seg.label}
            </span>
          </NavLink>
        );
      })}
    </div>
  );
}

export default MobileInsightsTabs;
