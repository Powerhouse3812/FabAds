import type { EntityType, EntityId } from "./kbInstructions";

/**
 * Winner Ads — top-performing ads attached to a Brand / Product / Category.
 *
 * Sources: uploaded by user, saved from Genie generations, saved from
 * Industry Insights, or pulled from Creative Library. Winner Ads seed
 * the Concepts list (1:1 — each Winner Ad becomes 1 Concept).
 */

export interface WinnerAd {
  id: string;
  entityType: EntityType;
  entityId: EntityId;
  /** Where the ad was sourced from. */
  source: "uploaded" | "saved-from-genie" | "saved-from-insights" | "saved-from-library";
  thumbnail?: string;
  format: "image" | "video" | "carousel";
  headline: string;
  description?: string;
  ctr?: number;
  impressions?: number;
  spend?: number;
  capturedAt: Date;
}

export const WINNER_ADS: WinnerAd[] = [
  // Mamaearth brand winners
  {
    id: "wa-me-1",
    entityType: "brand",
    entityId: "mamaearth",
    source: "saved-from-insights",
    thumbnail:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=75",
    format: "image",
    headline: "30% off Onion Shampoo — limited time",
    description: "Hero packshot · ingredient callout · social proof",
    ctr: 0.038,
    impressions: 124_000,
    spend: 18_400,
    capturedAt: new Date("2026-04-12"),
  },
  {
    id: "wa-me-2",
    entityType: "brand",
    entityId: "mamaearth",
    source: "uploaded",
    thumbnail:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=75",
    format: "video",
    headline: "POV: hair fall stopped in 4 weeks",
    description: "UGC creator demo · 15s · 4-week before/after",
    ctr: 0.052,
    impressions: 218_000,
    spend: 32_100,
    capturedAt: new Date("2026-04-20"),
  },
  {
    id: "wa-me-3",
    entityType: "brand",
    entityId: "mamaearth",
    source: "saved-from-genie",
    thumbnail:
      "https://images.unsplash.com/photo-1631730486572-226d1f595b68?auto=format&fit=crop&w=400&q=75",
    format: "image",
    headline: "Diwali bundle — Mom's haircare ritual",
    description: "Festive · gifting · family moment",
    ctr: 0.029,
    impressions: 88_400,
    spend: 12_700,
    capturedAt: new Date("2026-05-01"),
  },

  // Plum brand winner
  {
    id: "wa-plum-1",
    entityType: "brand",
    entityId: "plum",
    source: "saved-from-insights",
    thumbnail:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=75",
    format: "image",
    headline: "Pro-clean Vit C serum — visible glow",
    description: "Ingredient-led · before/after grid",
    ctr: 0.041,
    impressions: 156_000,
    spend: 22_300,
    capturedAt: new Date("2026-04-22"),
  },

  // Boat brand winner
  {
    id: "wa-boat-1",
    entityType: "brand",
    entityId: "boat",
    source: "saved-from-genie",
    thumbnail:
      "https://images.unsplash.com/photo-1590658268037-41d3fd70a5cb?auto=format&fit=crop&w=400&q=75",
    format: "video",
    headline: "Airdopes 161 — 40hr battery, ₹999",
    description: "Spec-led · price-prominent · TWS hero",
    ctr: 0.048,
    impressions: 312_000,
    spend: 41_500,
    capturedAt: new Date("2026-04-18"),
  },

  // Product-level winner
  {
    id: "wa-onion-1",
    entityType: "product",
    entityId: "mamaearth-onion-shampoo",
    source: "uploaded",
    thumbnail:
      "https://images.unsplash.com/photo-1631730486572-226d1f595b68?auto=format&fit=crop&w=400&q=75",
    format: "image",
    headline: "Reduces hair fall in 4 weeks — 5★ verified",
    description: "Product hero · benefit · proof badge",
    ctr: 0.037,
    impressions: 95_000,
    spend: 14_200,
    capturedAt: new Date("2026-04-25"),
  },
  {
    id: "wa-onion-2",
    entityType: "product",
    entityId: "mamaearth-onion-shampoo",
    source: "saved-from-genie",
    thumbnail:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=75",
    format: "video",
    headline: "From flat to full — 6-week journey",
    description: "Time-lapse UGC · weekly progress overlays",
    ctr: 0.045,
    impressions: 132_000,
    spend: 19_500,
    capturedAt: new Date("2026-04-28"),
  },

  // Category-level winner
  {
    id: "wa-haircare-1",
    entityType: "category",
    entityId: "hair-care",
    source: "saved-from-insights",
    thumbnail:
      "https://images.unsplash.com/photo-1631730486572-226d1f595b68?auto=format&fit=crop&w=400&q=75",
    format: "image",
    headline: "5 reasons your hair is falling — and 1 fix",
    description: "Educational · listicle · category-level",
    ctr: 0.044,
    impressions: 178_000,
    spend: 26_800,
    capturedAt: new Date("2026-04-10"),
  },
];

export function getWinnerAdsForEntity(
  entityType: EntityType,
  entityId: EntityId,
  customWinners: WinnerAd[] = [],
): WinnerAd[] {
  return [...WINNER_ADS, ...customWinners].filter(
    (w) => w.entityType === entityType && w.entityId === entityId,
  );
}
