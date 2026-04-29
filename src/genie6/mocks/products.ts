import type { Product } from "../types/entities";

/**
 * Demo product data with real-photography product images.
 *
 * Image strategy: curated Unsplash IDs that match the actual product category
 * (a real shampoo bottle for shampoo, a real smartwatch for smartwatch, etc.).
 * Stable URLs, free, photographer-quality. Each `?w=400&q=70` query renders a
 * 400px-wide JPEG at quality 70 — fast load, no compression artifacts.
 */
export const products: Product[] = [
  // Mamaearth — personal care
  {
    id: "mamaearth-onion-shampoo",
    brandId: "mamaearth",
    name: "Onion Shampoo",
    price: "₹699",
    thumbnail: "https://images.unsplash.com/photo-1631730486572-226d1f595b68?auto=format&fit=crop&w=400&q=70",
    benefits: ["reduces hair fall", "with onion oil + plant keratin", "no SLS, no parabens"],
    promo: "Buy 1 Get 1",
    generatedCount: 47,
  },
  {
    id: "mamaearth-onion-conditioner",
    brandId: "mamaearth",
    name: "Onion Conditioner",
    price: "₹449",
    thumbnail: "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?auto=format&fit=crop&w=400&q=70",
    benefits: ["frizz control", "deep conditioning", "complements onion shampoo"],
    generatedCount: 18,
  },
  {
    id: "mamaearth-vc-facewash",
    brandId: "mamaearth",
    name: "Vitamin C Face Wash",
    price: "₹399",
    thumbnail: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=400&q=70",
    benefits: ["brightening", "with turmeric", "gentle on daily skin"],
    generatedCount: 23,
  },
  {
    id: "mamaearth-biotin-gummy",
    brandId: "mamaearth",
    name: "Biotin Hair Gummies",
    price: "₹1,299",
    thumbnail: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=400&q=70",
    benefits: ["hair growth from within", "tasty", "30-day pack"],
    generatedCount: 9,
  },

  // Noise — wearable tech
  {
    id: "noise-colorfit-pro-5",
    brandId: "noise",
    name: "ColorFit Pro 5",
    price: "₹3,499",
    thumbnail: "https://images.unsplash.com/photo-1617043786394-f977fa12eddf?auto=format&fit=crop&w=400&q=70",
    benefits: ["1.85\" AMOLED display", "Bluetooth calling", "100+ sport modes", "7-day battery"],
    promo: "Save ₹500",
    generatedCount: 62,
  },
  {
    id: "noise-airwave-max-2",
    brandId: "noise",
    name: "Airwave Max 2",
    price: "₹1,999",
    thumbnail: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=400&q=70",
    benefits: ["50hr playback", "ENx for clear calls", "fast charge"],
    generatedCount: 14,
  },

  // Boat — audio + wearables
  {
    id: "boat-airdopes-161",
    brandId: "boat",
    name: "Airdopes 161",
    price: "₹999",
    thumbnail: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=400&q=70",
    benefits: ["40hr playback", "fast charge", "IPX4", "ENx environmental noise cancellation"],
    promo: "Lowest ever",
    generatedCount: 31,
  },
  {
    id: "boat-rockerz-450",
    brandId: "boat",
    name: "Rockerz 450",
    price: "₹1,499",
    thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=70",
    benefits: ["15hr playback", "40mm drivers", "padded ear cushions"],
    generatedCount: 11,
  },

  // Sleepyhead — D2C mattress
  {
    id: "sleepyhead-3-layer",
    brandId: "sleepyhead",
    name: "Sleepyhead 3-Layer Mattress",
    price: "₹17,999",
    thumbnail: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=70",
    benefits: ["100-night trial", "free delivery", "medium firm", "adapts to body"],
    generatedCount: 8,
  },
  {
    id: "sleepyhead-original",
    brandId: "sleepyhead",
    name: "Sleepyhead Original",
    price: "₹13,499",
    thumbnail: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=400&q=70",
    benefits: ["memory foam", "100-night trial", "free returns"],
    generatedCount: 5,
  },

  // Plum — clean beauty
  {
    id: "plum-biotin-gummy",
    brandId: "plum",
    name: "Biotin Hair Gummies",
    price: "₹449",
    thumbnail: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=70",
    benefits: ["5,000 mcg biotin", "vegan", "with vitamins"],
    generatedCount: 17,
  },
  {
    id: "plum-vc-serum",
    brandId: "plum",
    name: "10% Vitamin C Serum",
    price: "₹745",
    thumbnail: "https://images.unsplash.com/photo-1556228841-a3b35e1eba2c?auto=format&fit=crop&w=400&q=70",
    benefits: ["mandarin extract", "brightening", "vegan"],
    generatedCount: 12,
  },

  // Mensa Brands
  {
    id: "mensa-mybalcony",
    brandId: "mensa-brands",
    name: "MyBalcony Garden Kit",
    price: "₹1,499",
    thumbnail: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=400&q=70",
    benefits: ["10 plant starter pack", "self-watering planters", "DIY guide"],
    generatedCount: 6,
  },
  {
    id: "mensa-pebble",
    brandId: "mensa-brands",
    name: "Pebble Smartwatch",
    price: "₹2,799",
    thumbnail: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=400&q=70",
    benefits: ["AMOLED", "BT calling", "AI assistant"],
    generatedCount: 22,
  },

  // Wow Skin Science
  {
    id: "wow-onion-oil",
    brandId: "wow-skin-science",
    name: "Onion Black Seed Hair Oil",
    price: "₹399",
    thumbnail: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=400&q=70",
    benefits: ["fights hair fall", "with 10 oils", "no mineral oil"],
    generatedCount: 14,
  },
  {
    id: "wow-apple-cider",
    brandId: "wow-skin-science",
    name: "Apple Cider Vinegar",
    price: "₹349",
    thumbnail: "https://images.unsplash.com/photo-1582578598774-a377d4b32223?auto=format&fit=crop&w=400&q=70",
    benefits: ["with the mother", "raw, undiluted", "for hair & skin"],
    generatedCount: 7,
  },
];

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}
export function productsForBrand(brandId: string) {
  return products.filter((p) => p.brandId === brandId);
}
