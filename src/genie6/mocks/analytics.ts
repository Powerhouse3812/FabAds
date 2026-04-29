import type { AnalyticsSnapshot } from "../types/entities";

/**
 * Default analytics for the populated Home dashboard. Numbers are deliberately
 * non-round (1,284 not 1,000; 47.3% not 50%; ₹2,499 not ₹2,500).
 */
export const analyticsAgency: AnalyticsSnapshot = {
  generationsThisMonth: { count: 1284, deltaPct: 18 },
  creditsUsed: { used: 12450, limit: 50000 },
  topPerformer: {
    outputId: "var_4a2k7q9",
    brand: "Mamaearth",
    product: "Onion shampoo",
    ctr: 4.73,
    roas: 3.2,
    // Shampoo / hair-care product close-up (real product feel, not a person photo).
    thumbnail:
      "https://images.unsplash.com/photo-1631730486572-226d1f595b68?auto=format&fit=crop&w=600&q=70",
    mode: "Product Ad",
  },
  trendingFinding: {
    headline: "Aspirational lifestyle angle is up",
    deltaPct: 38,
    angleLabel: "Aspirational lifestyle",
  },
  activeBrands: 12,
  recentActivityCount: 15,
};

export const analyticsSolo: AnalyticsSnapshot = {
  generationsThisMonth: { count: 184, deltaPct: 42 },
  creditsUsed: { used: 738, limit: 1500 },
  topPerformer: {
    outputId: "var_v4i2t7n",
    brand: "Mamaearth",
    product: "Vitamin C face wash",
    ctr: 5.18,
    roas: 4.1,
    // Face wash / skincare product close-up.
    thumbnail:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=70",
    mode: "Image to Ad",
  },
  trendingFinding: {
    headline: "Image-to-Video is your new winner",
    deltaPct: 22,
    angleLabel: "Aspirational lifestyle",
  },
  activeBrands: 1,
  recentActivityCount: 8,
};
