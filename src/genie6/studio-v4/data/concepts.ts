export type ConceptCategory = "hero" | "story" | "lifestyle" | "promo";

export interface Concept {
  id: string;
  emoji: string;
  name: string;
  /** 1-line, ~10-15 words, what this concept does */
  desc: string;
  category: ConceptCategory;
  /** Mock Unsplash thumbnail — matches the concept's visual feel */
  thumbnail: string;
}

export const CONCEPT_CATEGORIES: { id: ConceptCategory; label: string; emoji: string }[] = [
  { id: "hero",      label: "Hero",      emoji: "🎯" },
  { id: "story",     label: "Story",     emoji: "📖" },
  { id: "lifestyle", label: "Lifestyle", emoji: "🌅" },
  { id: "promo",     label: "Promo",     emoji: "🔥" },
];

const u = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=320&q=70`;

export const CONCEPTS: Concept[] = [
  // Hero (3) — clean, product-forward
  { id: "c-hero-pack",      emoji: "📦", name: "Hero Pack",        desc: "Clean studio shot with the product front and center on a minimal backdrop.",            category: "hero",      thumbnail: u("1556228720-195a672e8a03") },
  { id: "c-detail-macro",   emoji: "🔬", name: "Detail Macro",     desc: "Tight close-up showcasing texture, finish, and craftsmanship.",                          category: "hero",      thumbnail: u("1546868871-7041f2a55e12") },
  { id: "c-bundle-stack",   emoji: "🎁", name: "Bundle Stack",     desc: "Product range arranged together — communicates variety and value.",                     category: "hero",      thumbnail: u("1503602642458-232111445657") },

  // Story (3) — narrative-led
  { id: "c-founder-note",   emoji: "✍️", name: "Founder Note",     desc: "Personal voice from the founder — origin, purpose, conviction.",                        category: "story",     thumbnail: u("1580489944761-15a19d654956") },
  { id: "c-before-after",   emoji: "🔄", name: "Before / After",   desc: "Side-by-side transformation showing the product's effect over time.",                   category: "story",     thumbnail: u("1583394838336-acd977736f90") },
  { id: "c-heritage",       emoji: "🏛️", name: "Heritage Craft",   desc: "Roots, materials, and process — slow-build trust through provenance.",                   category: "story",     thumbnail: u("1604719312566-8912e9227c6a") },

  // Lifestyle (3) — context + mood
  { id: "c-morning-ritual", emoji: "☕", name: "Morning Ritual",   desc: "Product in a daily routine — relaxed, aspirational, real-feel.",                        category: "lifestyle", thumbnail: u("1495474472287-4d71bcdd2085") },
  { id: "c-fest-scene",     emoji: "🎊", name: "Festive Scene",    desc: "Festival-coded styling for Diwali, Raksha Bandhan, weddings.",                          category: "lifestyle", thumbnail: u("1605649487212-47bdab064df7") },
  { id: "c-ugc-creator",    emoji: "📱", name: "UGC Creator Look", desc: "Phone-shot, authentic-creator framing — high relate, low polish.",                      category: "lifestyle", thumbnail: u("1565299585323-38d6b0865b47") },

  // Promo (3) — urgency + offer
  { id: "c-flash-sale",     emoji: "⚡", name: "Flash Sale",       desc: "Hard offer with timer / limited-stock framing.",                                         category: "promo",     thumbnail: u("1607082348824-0a96f2a4b9da") },
  { id: "c-bogo",           emoji: "🎯", name: "Buy 1 Get 1",      desc: "Stack-the-deal framing — emphasize quantity + savings.",                                category: "promo",     thumbnail: u("1607082349566-187342175e2f") },
  { id: "c-launch-tease",   emoji: "🚀", name: "Launch Tease",     desc: "New-drop reveal — countdown, waitlist, exclusivity.",                                   category: "promo",     thumbnail: u("1604933834413-4a0a9a4e9ba8") },
];

export function getConceptById(id: string): Concept | undefined {
  return CONCEPTS.find((c) => c.id === id);
}

export function getConceptsByCategory(category: ConceptCategory): Concept[] {
  return CONCEPTS.filter((c) => c.category === category);
}
