/** Competitor detail · Offers tab: the offers this competitor's landing pages send people to. */
import { useMemo } from "react";
import { DisabledSection } from "../../shared";
import { OffersList, groupOffers } from "../OffersList";
import type { DetailTabProps } from "./types";

export function OffersTab({ detail }: DetailTabProps) {
  const rows = detail.landingPages.rows;
  const groups = useMemo(() => groupOffers(rows), [rows]);
  if (groups.offers.length === 0) {
    return <DisabledSection title="Offers" reason="None of this competitor's ads in this scope lead to an offer we could trace." />;
  }
  return <OffersList groups={groups} landingPageCount={rows.length} />;
}
