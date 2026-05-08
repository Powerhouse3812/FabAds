import type { EntityType, EntityId } from "./kbInstructions";

/**
 * Reference URLs — links saved against a Brand / Product / Category KB.
 *
 * Sourced from the user pasting a URL via the Studio paperclip → URL
 * flow, or from the Catalogue Detail page. Each URL is a lightweight
 * reference: hostname-only display in compact UIs, full URL on click.
 */

export interface ReferenceUrl {
  id: string;
  entityType: EntityType;
  entityId: EntityId;
  label: string;
  url: string;
  /** Optional thumbnail / preview image URL. */
  thumbnail?: string;
  capturedAt: Date;
}

export const REFERENCE_URLS: ReferenceUrl[] = [
  // Brand-level
  {
    id: "ref-me-1",
    entityType: "brand",
    entityId: "mamaearth",
    label: "Mamaearth — Diwali campaign landing",
    url: "https://mamaearth.in/diwali-2026",
    capturedAt: new Date("2026-04-15"),
  },
  {
    id: "ref-me-2",
    entityType: "brand",
    entityId: "mamaearth",
    label: "Mamaearth — Brand book PDF",
    url: "https://drive.example.com/me-brand-book.pdf",
    capturedAt: new Date("2026-03-20"),
  },
  {
    id: "ref-plum-1",
    entityType: "brand",
    entityId: "plum",
    label: "Plum — Hero campaign hero shot",
    url: "https://plumgoodness.com/hero",
    capturedAt: new Date("2026-04-10"),
  },
  {
    id: "ref-boat-1",
    entityType: "brand",
    entityId: "boat",
    label: "Boat — Airdopes 161 launch page",
    url: "https://www.boat-lifestyle.com/products/airdopes-161",
    capturedAt: new Date("2026-04-12"),
  },

  // Product-level
  {
    id: "ref-onion-1",
    entityType: "product",
    entityId: "mamaearth-onion-shampoo",
    label: "Onion Shampoo — Amazon listing",
    url: "https://amazon.in/mamaearth-onion-shampoo/dp/B0XXX",
    capturedAt: new Date("2026-04-25"),
  },
  {
    id: "ref-onion-2",
    entityType: "product",
    entityId: "mamaearth-onion-shampoo",
    label: "Onion Shampoo — Influencer review",
    url: "https://instagram.com/p/XYZ123",
    capturedAt: new Date("2026-04-28"),
  },

  // Category-level
  {
    id: "ref-haircare-1",
    entityType: "category",
    entityId: "hair-care",
    label: "Hair Care category — Statista report",
    url: "https://statista.com/india-haircare-market",
    capturedAt: new Date("2026-03-10"),
  },
  {
    id: "ref-haircare-2",
    entityType: "category",
    entityId: "hair-care",
    label: "Hair Care category — Trend benchmark",
    url: "https://nielsen.com/india-haircare-2026",
    capturedAt: new Date("2026-03-22"),
  },
];

export function getReferenceUrlsForEntity(
  entityType: EntityType,
  entityId: EntityId,
  custom: ReferenceUrl[] = [],
): ReferenceUrl[] {
  return [...REFERENCE_URLS, ...custom].filter(
    (r) => r.entityType === entityType && r.entityId === entityId,
  );
}

/** Extract hostname for compact display. */
export function shortUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
