import type { OutputData } from "../types/output";

/**
 * Realistic seed data for the OutputCard showcase and downstream surfaces.
 * Brands: Mamaearth, Noise, Boat, Sleepyhead, Plum, Mensa Brands.
 * Numbers are deliberately non-round (47.3%, ₹2,499, score 87 not 80).
 */

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const NOW = new Date("2026-04-28T14:32:00").getTime();

export const sampleOutputs: OutputData[] = [
  {
    id: "var_4a2k7q9",
    mediaType: "image",
    mode: "product-ad",
    generatedAt: new Date(NOW - 2 * HOUR),
    thumbnail:
      "https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&w=600&q=70",
    headline: "Hair fall is real. This is not.",
    body: "Mamaearth Onion Shampoo — clinically tested for visible reduction in 6 weeks.",
    cta: "Shop ₹699",
    brand: { name: "Mamaearth" },
    product: { name: "Onion shampoo" },
    qualityScore: 87,
  },
  {
    id: "var_n9k3v1m",
    mediaType: "video",
    mode: "ugc-video",
    generatedAt: new Date(NOW - 5 * HOUR),
    thumbnail:
      "https://images.unsplash.com/photo-1617043786394-f977fa12eddf?auto=format&fit=crop&w=600&q=70",
    headline: "Tested 3 smartwatches. This one stayed.",
    body: "Real reviewer · 31 days · Noise ColorFit Pro 5 — battery beat the rest.",
    cta: "₹3,499",
    brand: { name: "Noise" },
    product: { name: "ColorFit Pro 5" },
    qualityScore: 73,
  },
  {
    id: "var_b7t4h2x",
    mediaType: "text-only",
    mode: "image-to-ad",
    generatedAt: new Date(NOW - 8 * HOUR),
    headline: "Stop scrolling if you've ever had AirPods die at 6pm.",
    body: "Boat Airdopes 161 — 40 hours total playback. ₹999, free returns.",
    cta: "Order now",
    brand: { name: "Boat" },
    product: { name: "Airdopes 161" },
  },
  {
    id: "var_s8m1q5z",
    mediaType: "image",
    mode: "brand-ad",
    generatedAt: new Date(NOW - 1 * DAY),
    thumbnail:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=70",
    headline: "Sleep that earns its place in your day.",
    body: "Sleepyhead — engineered for the back you don't think about anymore.",
    cta: "Try 100 nights",
    brand: { name: "Sleepyhead" },
    qualityScore: 91,
  },
  {
    id: "var_p3l6e8w",
    mediaType: "image",
    mode: "forge",
    generatedAt: new Date(NOW - 3 * DAY),
    thumbnail:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=70",
    headline: "10 reasons your hair gummy isn't working.",
    body: "Plum Goodness Biotin Gummies — 5,000 mcg, dermatologist-formulated.",
    cta: "Shop ₹449",
    brand: { name: "Plum" },
    product: { name: "Biotin gummies" },
    qualityScore: 64,
    parentWinnerId: "var_4a2k7q9", // forged from Mamaearth Onion shampoo winner
  },
  {
    id: "var_m2c8r1y",
    mediaType: "image",
    mode: "affiliate-ad",
    generatedAt: new Date(NOW - 4 * DAY),
    thumbnail:
      "https://images.unsplash.com/photo-1586367474466-3b09c1d6d3b1?auto=format&fit=crop&w=600&q=70",
    headline: "5 founders. 11 brands. ₹2,499 starter kit.",
    body: "Mensa Brands x first-time buyers. Limited to first 1,284 orders.",
    cta: "Claim",
    brand: { name: "Mensa Brands" },
    qualityScore: 79,
  },
  {
    id: "var_v4i2t7n",
    mediaType: "video",
    mode: "image-to-ad",
    generatedAt: new Date(NOW - 6 * DAY),
    thumbnail:
      "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=600&q=70",
    headline: "Your favourite static, now in motion.",
    body: "Mamaearth Vitamin C Face Wash — 6s subtle parallax + product reveal.",
    cta: "Buy ₹399",
    brand: { name: "Mamaearth" },
    product: { name: "Vitamin C face wash" },
    qualityScore: 82,
    parentWinnerId: "var_s8m1q5z", // generated from a Sleepyhead winner
  },
  {
    id: "var_zerocase",
    mediaType: "image",
    mode: "product-ad",
    generatedAt: new Date(NOW - 9 * DAY),
    // No thumbnail, no headline — tests zero-data fallback rendering
  },
];
