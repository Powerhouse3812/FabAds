import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { EntityLevel } from "@/lib/reports-dummy-data";

// ── Mobile Reports level switcher ─────────────────────────────────────
// A 4-segment control that swaps between the existing entity-level report
// routes. It preserves the current query string (?accountId=, ?campaignId=,
// ?launch=, etc.) across switches so drill-down state and deep links keep
// working, and it derives the active segment from the URL so the browser
// back/forward buttons stay in sync without any extra state.
//
// KNOWN NAMING MISMATCH (separately filed, do not "fix" by renaming routes):
// the underlying paths are named like platforms — /reports/fb, /reports/nb,
// /reports/tt — but each one actually renders an entity LEVEL (accounts /
// campaigns / ad sets), not a platform filter. /reports/ads is the 4th level
// (ads) and does not follow the fb/nb/tt naming at all. The labels below
// describe what each route renders on screen, not what its path implies.

interface LevelSegment {
  level: EntityLevel;
  label: string;
  path: string;
}

const SEGMENTS: LevelSegment[] = [
  { level: "account", label: "Accounts", path: "/reports/fb" },
  { level: "campaign", label: "Campaigns", path: "/reports/nb" },
  { level: "adset", label: "Ad sets", path: "/reports/tt" },
  { level: "ad", label: "Ads", path: "/reports/ads" },
];

export interface MobileLevelSegmentsProps {
  /**
   * Optional explicit override for which segment reads as active. When
   * omitted (the common case), the active segment is derived from the
   * current URL pathname so back/forward navigation stays correct for free.
   */
  activeLevel?: EntityLevel;
  className?: string;
}

/**
 * 4-segment level switcher for mobile Reports: Accounts · Campaigns ·
 * Ad sets · Ads. Intended to sit at ~343px content width (~84px per
 * segment) — tight but still comfortably inside Hick's-law territory at
 * only 4 options. Renders at `text-[11px]`, each segment ≥44px tall.
 */
export function MobileLevelSegments({ activeLevel, className }: MobileLevelSegmentsProps) {
  const location = useLocation();
  // Preserve the existing search string (drill-down + filter + launch-scope
  // params) when switching level — this is what keeps deep links intact.
  const search = location.search;

  return (
    <div
      role="tablist"
      aria-label="Report level"
      className={cn("grid grid-cols-4 gap-1 w-full", className)}
    >
      {SEGMENTS.map((seg) => {
        const isActive = activeLevel ? activeLevel === seg.level : location.pathname === seg.path;
        return (
          <NavLink
            key={seg.level}
            to={{ pathname: seg.path, search }}
            role="tab"
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-[44px] items-center justify-center rounded-md border px-1 text-center text-[11px] leading-tight transition-colors",
              isActive
                // Active state is signalled by weight + border + fill, not colour alone.
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
