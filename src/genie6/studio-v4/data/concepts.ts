export type ConceptCategory = "hero" | "story" | "lifestyle" | "promo";

export interface Concept {
  id: string;
  emoji: string;
  name: string;
  /** 1-line, ~10-15 words, what this concept does */
  desc: string;
  category: ConceptCategory;
}

export const CONCEPT_CATEGORIES: { id: ConceptCategory; label: string; emoji: string }[] = [
  { id: "hero",      label: "Hero",      emoji: "🎯" },
  { id: "story",     label: "Story",     emoji: "📖" },
  { id: "lifestyle", label: "Lifestyle", emoji: "🌅" },
  { id: "promo",     label: "Promo",     emoji: "🔥" },
];

export const CONCEPTS: Concept[] = [
  // Hero (3) — clean, product-forward
  { id: "c-hero-pack",      emoji: "📦", name: "Hero Pack",        desc: "Clean studio shot with the product front and center on a minimal backdrop.",            category: "hero" },
  { id: "c-detail-macro",   emoji: "🔬", name: "Detail Macro",     desc: "Tight close-up showcasing texture, finish, and craftsmanship.",                          category: "hero" },
  { id: "c-bundle-stack",   emoji: "🎁", name: "Bundle Stack",     desc: "Product range arranged together — communicates variety and value.",                     category: "hero" },

  // Story (3) — narrative-led
  { id: "c-founder-note",   emoji: "✍️", name: "Founder Note",     desc: "Personal voice from the founder — origin, purpose, conviction.",                        category: "story" },
  { id: "c-before-after",   emoji: "🔄", name: "Before / After",   desc: "Side-by-side transformation showing the product's effect over time.",                   category: "story" },
  { id: "c-heritage",       emoji: "🏛️", name: "Heritage Craft",   desc: "Roots, materials, and process — slow-build trust through provenance.",                   category: "story" },

  // Lifestyle (3) — context + mood
  { id: "c-morning-ritual", emoji: "☕", name: "Morning Ritual",   desc: "Product in a daily routine — relaxed, aspirational, real-feel.",                        category: "lifestyle" },
  { id: "c-fest-scene",     emoji: "🎊", name: "Festive Scene",    desc: "Festival-coded styling for Diwali, Raksha Bandhan, weddings.",                          category: "lifestyle" },
  { id: "c-ugc-creator",    emoji: "📱", name: "UGC Creator Look", desc: "Phone-shot, authentic-creator framing — high relate, low polish.",                      category: "lifestyle" },

  // Promo (3) — urgency + offer
  { id: "c-flash-sale",     emoji: "⚡", name: "Flash Sale",       desc: "Hard offer with timer / limited-stock framing.",                                         category: "promo" },
  { id: "c-bogo",           emoji: "🎯", name: "Buy 1 Get 1",      desc: "Stack-the-deal framing — emphasize quantity + savings.",                                category: "promo" },
  { id: "c-launch-tease",   emoji: "🚀", name: "Launch Tease",     desc: "New-drop reveal — countdown, waitlist, exclusivity.",                                   category: "promo" },
];

export function getConceptById(id: string): Concept | undefined {
  return CONCEPTS.find((c) => c.id === id);
}

export function getConceptsByCategory(category: ConceptCategory): Concept[] {
  return CONCEPTS.filter((c) => c.category === category);
}
