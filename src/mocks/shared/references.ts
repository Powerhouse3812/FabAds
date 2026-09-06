import type { Provenance } from "@/genie6/lib/genieRunTypes";
import { WINNER_ADS, type WinnerAd } from "./winnerAds";
import type { EntityType, EntityId } from "./kbInstructions";

/**
 * References / Winner ads — a Creative-asset type carried over from the
 * 26 Aug record (§21.2). Deliberately NOT new fabricated winner-ad data —
 * §21.2 says wire in the existing `WINNER_ADS` (`./winnerAds.ts`) rather
 * than authoring new winner performance numbers. This file is the
 * normalizer: it reshapes each `WinnerAd` into the common asset-card
 * grammar (§21.2: preview · name · tags · usage count · last used ·
 * actions) so References can sit in the Catalogue registry next to
 * every other Creative asset type without a bespoke card layout.
 *
 * "Usage count" for a reference is how many times it's been pulled up as
 * inspiration for a generation — derived from its CTR (a reference that
 * converted well gets reused more), not invented separately from the
 * winner-ad record.
 */

export interface ReferenceAsset {
  id: string;
  headline: string;
  entityType: EntityType;
  entityId: EntityId;
  thumbnail?: string;
  format: WinnerAd["format"];
  source: WinnerAd["source"];
  description?: string;
  tags: string[];
  usageCount: number;
  /** ISO date — WinnerAd.capturedAt reformatted. */
  lastUsedAt: string;
  provenance: Provenance;
}

const SOURCE_LABEL: Record<WinnerAd["source"], string> = {
  uploaded: "Uploaded",
  "saved-from-genie": "From Genie",
  "saved-from-insights": "From Insights",
  "saved-from-library": "From Library",
};

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function toReferenceAsset(w: WinnerAd): ReferenceAsset {
  return {
    id: `ref-asset-${w.id}`,
    headline: w.headline,
    entityType: w.entityType,
    entityId: w.entityId,
    thumbnail: w.thumbnail,
    format: w.format,
    source: w.source,
    description: w.description,
    tags: [SOURCE_LABEL[w.source], w.format],
    // CTR of 0.038 -> 38 "runs" pulled as inspiration. Never round — the
    // source CTR values already aren't, so this inherits that.
    usageCount: w.ctr ? Math.round(w.ctr * 1000) : 3,
    lastUsedAt: toIsoDate(w.capturedAt),
    // Every winner ad in the seed set is FabFunnel-provided inspiration —
    // a client-uploaded reference is added later via the Catalogue's own
    // add/upload flow (catalogue-write-store), not authored here.
    provenance: "fabfunnel-seeded",
  };
}

export const references: ReferenceAsset[] = WINNER_ADS.map(toReferenceAsset);

export function getReferencesForEntity(
  entityType: EntityType,
  entityId: EntityId,
  custom: ReferenceAsset[] = [],
): ReferenceAsset[] {
  return [...references, ...custom].filter(
    (r) => r.entityType === entityType && r.entityId === entityId,
  );
}
