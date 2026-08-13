import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { BrandsFollowedPopover } from "./BrandsFollowedPopover";
import { DateRangeWithPresets } from "./DateRangeWithPresets";

interface InsightsV2IdentityRowProps {
  sectionLabel: string;
  adCount: number;
  brandsFollowed: number;
  /** Real followed brand names — drives the popover checkbox state. */
  followedBrandNames: string[];
  /** All brands available for follow/unfollow. */
  allBrands: string[];
  /** Mutation callback fired when user toggles a brand. */
  onToggleBrand: (brand: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  /** Optional controlled date-picker popover state (URL-backed in feed). */
  dateRangeOpen?: boolean;
  onDateRangeOpenChange?: (open: boolean) => void;
  className?: string;
}

/**
 * ROW 1 — Identity row. Foreplay-style page-identity band:
 *   [Section label]  [Ad count chip]  [Brands followed chip]   ........   [Date range picker]
 *
 * Collapses entirely on scroll (controlled by the Feed page's `isScrolled`
 * grid-rows wrapper). Date picker re-appears in the Toolbar when scrolled
 * so the user can still change it.
 */
export function InsightsV2IdentityRow({
  sectionLabel,
  adCount,
  brandsFollowed,
  followedBrandNames,
  allBrands,
  onToggleBrand,
  dateRange,
  onDateRangeChange,
  dateRangeOpen,
  onDateRangeOpenChange,
  className,
}: InsightsV2IdentityRowProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 gap-y-2 px-3 py-1.5 bg-background md:gap-3 md:px-5 md:py-2.5 md:border-b md:border-border/40",
        className,
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-wrap">
        {/* md:-only. On mobile MobileInsightsTabs sits directly above and its
            active segment already names this surface — a heading repeating it
            spent a whole row saying nothing. */}
        <span className="hidden text-sm font-medium text-foreground truncate md:inline">
          {sectionLabel}
        </span>
        {/* Read-only count: plain text on mobile, pill at md. A pill implies
            "tappable", and this one is not — the brands chip beside it is. */}
        <span className="inline-flex items-center gap-1 rounded-full px-0 py-0 text-[11px] text-muted-foreground md:bg-muted md:px-2.5 md:py-1">
          <span className="font-mono text-foreground font-semibold">
            {adCount.toLocaleString()}
          </span>{" "}
          ads
        </span>
        <BrandsFollowedPopover
          followedBrands={followedBrandNames}
          allBrands={allBrands}
          onToggleBrand={onToggleBrand}
          trigger={
            <button
              type="button"
              aria-label="Edit brands followed"
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
            >
              <span className="font-mono text-foreground font-semibold">
                {brandsFollowed.toLocaleString()}
              </span>{" "}
              {brandsFollowed === 1 ? "brand followed" : "brands followed"}
            </button>
          }
        />
      </div>

      <div className="hidden flex-1 min-w-[1rem] md:block" />

      {/* md:-only — on mobile the date control lives in the toolbar row, so the
          whole toolbar is one horizontal row (Maalik, 2026-08-11). */}
      <div className="hidden md:block">
        <DateRangeWithPresets
          value={dateRange}
          onChange={onDateRangeChange}
          size="md"
          open={dateRangeOpen}
          onOpenChange={onDateRangeOpenChange}
        />
      </div>
    </div>
  );
}
