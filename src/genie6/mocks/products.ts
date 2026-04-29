import type { Product } from "../types/entities";

export const products: Product[] = [
  // Mamaearth
  {
    id: "mamaearth-onion-shampoo",
    brandId: "mamaearth",
    name: "Onion Shampoo",
    price: "₹699",
    thumbnail: "https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&w=400&q=70",
    benefits: ["reduces hair fall", "with onion oil + plant keratin", "no SLS, no parabens"],
    promo: "Buy 1 Get 1",
    generatedCount: 47,
  },
  {
    id: "mamaearth-onion-conditioner",
    brandId: "mamaearth",
    name: "Onion Conditioner",
    price: "₹449",
    thumbnail: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=70",
    benefits: ["frizz control", "deep conditioning", "complements onion shampoo"],
    generatedCount: 18,
  },
  {
    id: "mamaearth-vc-facewash",
    brandId: "mamaearth",
    name: "Vitamin C Face Wash",
    price: "₹399",
    thumbnail: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=400&q=70",
    benefits: ["brightening", "with turmeric", "gentle on daily skin"],
    generatedCount: 23,
  },
  {
    id: "mamaearth-biotin-gummy",
    brandId: "mamaearth",
    name: "Biotin Hair Gummies",
    price: "₹1,299",
    benefits: ["hair growth from within", "tasty", "30-day pack"],
    generatedCount: 9,
  },

  // Noise
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
    benefits: ["50hr playback", "ENx for clear calls", "fast charge"],
    generatedCount: 14,
  },

  // Boat
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
    benefits: ["15hr playback", "40mm drivers", "padded ear cushions"],
    generatedCount: 11,
  },

  // Sleepyhead
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
    benefits: ["memory foam", "100-night trial", "free returns"],
    generatedCount: 5,
  },

  // Plum
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
    benefits: ["mandarin extract", "brightening", "vegan"],
    generatedCount: 12,
  },

  // Mensa
  {
    id: "mensa-mybalcony",
    brandId: "mensa-brands",
    name: "MyBalcony Garden Kit",
    price: "₹1,499",
    benefits: ["10 plant starter pack", "self-watering planters", "DIY guide"],
    generatedCount: 6,
  },
  {
    id: "mensa-pebble",
    brandId: "mensa-brands",
    name: "Pebble Smartwatch",
    price: "₹2,799",
    benefits: ["AMOLED", "BT calling", "AI assistant"],
    generatedCount: 22,
  },

  // Wow
  {
    id: "wow-onion-oil",
    brandId: "wow-skin-science",
    name: "Onion Black Seed Hair Oil",
    price: "₹399",
    benefits: ["fights hair fall", "with 10 oils", "no mineral oil"],
    generatedCount: 14,
  },
  {
    id: "wow-apple-cider",
    brandId: "wow-skin-science",
    name: "Apple Cider Vinegar",
    price: "₹349",
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
