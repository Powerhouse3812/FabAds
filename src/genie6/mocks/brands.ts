import type { Brand } from "../types/entities";

/**
 * Demo-quality dummy data (Track 4.8).
 *
 * Brand logos: Clearbit Logo API — `https://logo.clearbit.com/{domain}`. Free, no key.
 * Returns the actual brand logomark by domain. Falls back to a placeholder if missing.
 *
 * Product images: Unsplash photos curated to match each product visually.
 *
 * Numbers are non-round per design system rule (47.3%, 1,284, ₹2,499 — never 50%, 1000).
 */
export const brands: Brand[] = [
  {
    id: "mamaearth",
    name: "Mamaearth",
    domain: "mamaearth.in",
    logo: "https://www.google.com/s2/favicons?sz=128&domain=mamaearth.in",
    category: "Personal care",
    tone: "Honest, mom-friendly, no jargon",
    fonts: { display: "Inter", body: "Inter" },
    colors: ["#2D5F3F", "#F4E4C8", "#F8F8F8"],
    voice: "Honest, mom-friendly, no jargon",
    usps: ["plant-based", "toxin-free", "dermatologist-tested", "MadeSafe certified"],
    competitors: ["wow-skin-science", "plum", "the-derma-co"],
    productIds: ["mamaearth-onion-shampoo", "mamaearth-onion-conditioner", "mamaearth-vc-facewash", "mamaearth-biotin-gummy"],
  },
  {
    id: "noise",
    name: "Noise",
    domain: "gonoise.com",
    logo: "https://www.google.com/s2/favicons?sz=128&domain=gonoise.com",
    category: "Wearable tech",
    tone: "Sharp, energetic, Gen-Z confident",
    fonts: { display: "Inter", body: "Inter" },
    colors: ["#000000", "#FF3D00", "#FFFFFF"],
    voice: "Sharp, energetic, Gen-Z confident",
    usps: ["AMOLED display", "100+ sport modes", "Bluetooth calling", "made in India"],
    competitors: ["boat", "fire-boltt"],
    productIds: ["noise-colorfit-pro-5", "noise-airwave-max-2"],
  },
  {
    id: "boat",
    name: "Boat",
    domain: "boat-lifestyle.com",
    logo: "https://www.google.com/s2/favicons?sz=128&domain=boat-lifestyle.com",
    category: "Audio & wearables",
    tone: "Bold, performance-led, Indian-pop",
    fonts: { display: "Inter", body: "Inter" },
    colors: ["#000000", "#E63946", "#FFFFFF"],
    voice: "Bold, performance-led, Indian-pop",
    usps: ["Beast mode audio", "ENx tech", "fast charge", "IPX4 / IPX5"],
    competitors: ["noise", "sony", "jbl"],
    productIds: ["boat-airdopes-161", "boat-rockerz-450"],
  },
  {
    id: "sleepyhead",
    name: "Sleepyhead",
    domain: "sleepyhead.io",
    logo: "https://www.google.com/s2/favicons?sz=128&domain=sleepyhead.io",
    category: "Sleep / mattress",
    tone: "Premium, calm, design-led",
    fonts: { display: "Inter", body: "Inter" },
    colors: ["#1A2845", "#E4D3B0", "#FFFFFF"],
    voice: "Premium, calm, design-led",
    usps: ["100-night trial", "memory foam", "adapts to body", "free returns"],
    competitors: ["wakefit", "the-sleep-company"],
    productIds: ["sleepyhead-3-layer", "sleepyhead-original"],
  },
  {
    id: "plum",
    name: "Plum",
    domain: "plumgoodness.com",
    logo: "https://www.google.com/s2/favicons?sz=128&domain=plumgoodness.com",
    category: "Skincare & wellness",
    tone: "Clean, vegan, optimistic",
    fonts: { display: "Inter", body: "Inter" },
    colors: ["#5B3B8A", "#F8F0FF", "#FFFFFF"],
    voice: "Clean, vegan, optimistic",
    usps: ["100% vegan", "cruelty-free", "no parabens", "no SLS"],
    competitors: ["mamaearth", "the-derma-co"],
    productIds: ["plum-biotin-gummy", "plum-vc-serum"],
  },
  {
    id: "mensa-brands",
    name: "Mensa Brands",
    domain: "mensabrands.com",
    logo: "https://www.google.com/s2/favicons?sz=128&domain=mensabrands.com",
    category: "Multi-brand house",
    tone: "Founder-led, ambitious, performance-marketing native",
    fonts: { display: "Inter", body: "Inter" },
    colors: ["#0E1623", "#FAD15C", "#FFFFFF"],
    voice: "Founder-led, ambitious, performance-marketing native",
    usps: ["11 portfolio brands", "thrasio model", "marketplace acceleration"],
    competitors: ["globalbees", "evenflow"],
    productIds: ["mensa-mybalcony", "mensa-pebble"],
  },
  {
    id: "wow-skin-science",
    name: "Wow Skin Science",
    domain: "buywow.in",
    logo: "https://www.google.com/s2/favicons?sz=128&domain=buywow.in",
    category: "Personal care",
    tone: "Bright, accessible, ingredient-first",
    fonts: { display: "Inter", body: "Inter" },
    colors: ["#0AA6BA", "#FFFFFF", "#1A1A1A"],
    voice: "Bright, accessible, ingredient-first",
    usps: ["No parabens, sulphates, mineral oils", "vegan", "cruelty-free"],
    competitors: ["mamaearth", "plum"],
    productIds: ["wow-onion-oil", "wow-apple-cider"],
  },
];

export function getBrand(id: string) {
  return brands.find((b) => b.id === id);
}
