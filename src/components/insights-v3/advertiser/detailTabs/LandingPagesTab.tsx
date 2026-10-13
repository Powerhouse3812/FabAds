/** Competitor detail · Landing pages tab: landing pages and the pages / domains behind them, in one list. */
import { useMemo } from "react";
import { OverlaySection } from "../../shared";
import { LandingMerged } from "../LandingMerged";
import { mergeLandingPages } from "../LandingMergedModel";
import type { DetailTabProps } from "./types";

export function LandingPagesTab({ kind, detail, ads }: DetailTabProps) {
  const merged = useMemo(() => mergeLandingPages(kind, ads, detail.landingPages.rows), [kind, ads, detail.landingPages.rows]);
  const nothing = merged.rows.length === 0 && merged.otherCount === 0 && merged.uncapturedAds === 0;
  return (
    <OverlaySection
      title="Landing pages"
      basedOn={ads.length}
      disabledReason={nothing ? "None of this competitor's ads in this scope send to a landing page we captured." : undefined}
      minHeight={120}
    >
      <LandingMerged kind={kind} merged={merged} />
    </OverlaySection>
  );
}
