/**
 * Board helpers: a snapshot to render a saved item without re-resolving it,
 * and the drawer / overlay a saved item opens as.
 */
import { FUNNEL_TYPE_LABEL, SAVABLE_LABEL } from "../types";
import type { BoardItemSnapshot, DetailTarget, ElementType, SavedItemRef } from "../types";
import { INDEX } from "../data";
import type { DataIndex } from "../data";
import { formatCompact } from "./context";

const ELEMENT_TYPES: ElementType[] = ["framework", "hook", "angle", "concept"];

export function isElementType(t: string): t is ElementType {
  return (ELEMENT_TYPES as string[]).includes(t);
}

/** Snapshot for a board item. Null when the item doesn't exist. */
export function snapshotFor(ref: SavedItemRef, data: DataIndex = INDEX): BoardItemSnapshot | null {
  switch (ref.type) {
    case "ad": {
      const ad = data.adById.get(ref.id);
      if (!ad) return null;
      return {
        title: ad.headline,
        subtitle: `${ad.pageName} · ${data.categoryById.get(ad.categoryId)?.label ?? ad.categoryId}`,
        thumbnailUrl: ad.thumbnailUrl,
      };
    }
    case "domain":
    case "page": {
      const adv = data.advertiserById.get(ref.id);
      if (!adv || adv.kind !== ref.type) return null;
      const n = (ref.type === "page" ? data.adsByPage.get(ref.id) : data.adsByDomain.get(ref.id))?.length ?? 0;
      return { title: adv.name, subtitle: `${SAVABLE_LABEL[ref.type]} · ${formatCompact(n)} ads`, thumbnailUrl: adv.avatarUrl };
    }
    case "landing-page": {
      const lp = data.landingPageById.get(ref.id);
      if (!lp) return null;
      return {
        title: lp.title ?? lp.url.replace(/^https?:\/\//, ""),
        subtitle: `${lp.domain}${lp.funnelType ? ` · ${FUNNEL_TYPE_LABEL[lp.funnelType]}` : ""}`,
        thumbnailUrl: lp.screenshotUrl,
      };
    }
    case "offer": {
      const offer = data.offerById.get(ref.id);
      if (!offer) return null;
      const n = offer.landingPageIds.length;
      return { title: offer.domain, subtitle: `Offer · ${n} landing page${n === 1 ? "" : "s"}`, thumbnailUrl: null };
    }
    default: {
      if (!isElementType(ref.type)) return null;
      const el = data.elementById[ref.type].get(ref.id);
      if (!el) return null;
      return { title: el.label, subtitle: SAVABLE_LABEL[ref.type], thumbnailUrl: null };
    }
  }
}

/** What a saved item opens as (same drawer / overlay it was saved from). */
export function detailTargetFor(ref: SavedItemRef): DetailTarget {
  switch (ref.type) {
    case "ad": return { kind: "ad", id: ref.id };
    case "domain": return { kind: "advertiser", advertiserKind: "domain", id: ref.id };
    case "page": return { kind: "advertiser", advertiserKind: "page", id: ref.id };
    case "landing-page": return { kind: "landing-page", id: ref.id };
    case "offer": return { kind: "offer", id: ref.id };
    default: return { kind: "element", elementType: ref.type as ElementType, id: ref.id };
  }
}
