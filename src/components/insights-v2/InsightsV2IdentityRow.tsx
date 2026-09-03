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
 *
 * `hidden md:flex` (F3, mobile Figma sync): the row doesn't survive to
 * mobile at all, not even a trimmed-down version. Figma's mobile feed goes
 * straight from the segmented control to the toolbar — "800 ads · 28 brands
 * followed" was a desktop-density readout nobody asked to see on a phone,
 * and the section label / date picker inside were already `md:`-only. Gating
 * the whole container (rather than just its remaining children) means it
 * contributes zero height/padding on mobile — no empty padded band — while
 * staying pure CSS, so it isn't one of the four JS-branching leaves.
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
        "hidden flex-wrap items-center gap-2 gap-y-2 px-3 py-1.5 bg-background md:flex md:gap-3 md:px-5 md:py-2.5 md:border-b md:border-border/40",
        className,
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-wrap">
        {/* md:-only. On mobile MobileInsightsTabs sits directly above and its
            active segment already names this surface — a heading repeating it
            spent a whole row saying nothing. (Moot now that the whole row is
            md:-only, but left as-is: harmless, and it's the same idiom the
            rest of this row uses.) */}
        <span className="hidden text-sm font-medium text-foreground truncate md:inline">
          {sectionLabel}
        </span>
        {/* Read-only count, styled as a pill at md (the only breakpoint this
            row ever paints in). A pill implies "tappable", and this one is
            not — the brands chip beside it is. */}
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
