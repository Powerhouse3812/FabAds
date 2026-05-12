import type { EntityType, EntityId } from "./kbInstructions";

/**
 * KB Concepts — visual + tonal concepts derived from Winner Ads.
 *
 * Maalik's rule: "Jitne Winner Ads, utne concepts." Each Winner Ad spawns
 * exactly 1 Concept. Plus the user can also save concepts directly from
 * Genie generations or Industry Insights without a Winner-Ad source.
 */

export type ResearchSource =
  | "reddit"
  | "youtube"
  | "instagram"
  | "tiktok"
  | "x"
  | "threads"
  | "web"
  | "reviews"
  | "insights";

export interface KbConcept {
  id: string;
  entityType: EntityType;
  entityId: EntityId;
  /** Optionally derived from a specific Winner Ad (1:1 rule). */
  winnerAdId?: string;
  source: "from-winner-ad" | "saved-from-genie" | "saved-from-insights";
  name: string;
  description: string;
  /** Visual direction summary. */
  visualDirection: string;
  /** Tone keyword. */
  tone: string;
  thumbnail?: string;
  capturedAt: Date;
  /** A-12.60 (Maalik): set when this concept came from the structured
   *  "Generate with AI" form. Optional — left undefined for legacy /
   *  winner-derived / insights-derived concepts. */
  angle?: string;
  audience?: string;
  researchSources?: ResearchSource[];
  /** The user's original generation prompt. */
  prompt?: string;
  generatedAt?: Date;
}

export const KB_CONCEPTS: KbConcept[] = [
  // Mamaearth — 3 from Winner Ads, 1 saved-from-genie
  {
    id: "kc-me-1",
    entityType: "brand",
    entityId: "mamaearth",
    winnerAdId: "wa-me-1",
    source: "from-winner-ad",
    name: "Limited-time bundle",
    description: "Hero packshot + ingredient + social proof + offer chip.",
    visualDirection:
      "Center bottle · cream bg · forest-green type · 30% off chip top-right",
    tone: "Promotional",
    thumbnail:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=75",
    capturedAt: new Date("2026-04-12"),
  },
  {
    id: "kc-me-2",
    entityType: "brand",
    entityId: "mamaearth",
    winnerAdId: "wa-me-2",
    source: "from-winner-ad",
    name: "POV creator demo",
    description: "Phone-camera UGC · 4-week timestamp · before/after mid-clip.",
    visualDirection: "Vertical 9:16 · creator hand-held · split-screen reveal at 8s",
    tone: "Authentic",
    thumbnail:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=75",
    capturedAt: new Date("2026-04-20"),
  },
  {
    id: "kc-me-3",
    entityType: "brand",
    entityId: "mamaearth",
    winnerAdId: "wa-me-3",
    source: "from-winner-ad",
    name: "Diwali gifting moment",
    description: "Festive table · daughter giving mom the bottle · warm lighting.",
    visualDirection: "Static · 4:5 · golden-hour table-top · bundle with 2 SKUs",
    tone: "Family",
    thumbnail:
      "https://images.unsplash.com/photo-1631730486572-226d1f595b68?auto=format&fit=crop&w=400&q=75",
    capturedAt: new Date("2026-05-01"),
  },
  {
    id: "kc-me-saved-1",
    entityType: "brand",
    entityId: "mamaearth",
    source: "saved-from-genie",
    name: "Ingredient explainer",
    description: "AI-generated infographic concept saved from Studio.",
    visualDirection: "Static infographic · 3 ingredients with mini-icons · brand gradient bg",
    tone: "Educational",
    thumbnail:
      "https://images.unsplash.com/photo-1631730486572-226d1f595b68?auto=format&fit=crop&w=400&q=75",
    capturedAt: new Date("2026-05-04"),
  },

  // Plum
  {
    id: "kc-plum-1",
    entityType: "brand",
    entityId: "plum",
    winnerAdId: "wa-plum-1",
    source: "from-winner-ad",
    name: "Glow before/after grid",
    description: "4-week glow comparison grid with verified-buyer overlays.",
    visualDirection: "2x2 grid · same lighting · 0/14/28-day captions",
    tone: "Proof-led",
    thumbnail:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=75",
    capturedAt: new Date("2026-04-22"),
  },

  // Boat
  {
    id: "kc-boat-1",
    entityType: "brand",
    entityId: "boat",
    winnerAdId: "wa-boat-1",
    source: "from-winner-ad",
    name: "Spec-led pricing hook",
    description: "Big spec callout (40hr battery) + price-prominent close.",
    visualDirection:
      "Vertical 9:16 · neon accent · spec-card overlay 0-3s · price card 12-15s",
    tone: "Bold",
    thumbnail:
      "https://images.unsplash.com/photo-1590658268037-41d3fd70a5cb?auto=format&fit=crop&w=400&q=75",
    capturedAt: new Date("2026-04-18"),
  },

  // Onion shampoo product
  {
    id: "kc-onion-1",
    entityType: "product",
    entityId: "mamaearth-onion-shampoo",
    winnerAdId: "wa-onion-1",
    source: "from-winner-ad",
    name: "Benefit + proof packshot",
    description: "Hero shot with benefit headline + 5-star verified-buyer chip.",
    visualDirection: "Static 4:5 · plain bg · benefit text top · star-rating bottom-left",
    tone: "Trustworthy",
    thumbnail:
      "https://images.unsplash.com/photo-1631730486572-226d1f595b68?auto=format&fit=crop&w=400&q=75",
    capturedAt: new Date("2026-04-25"),
  },
  {
    id: "kc-onion-2",
    entityType: "product",
    entityId: "mamaearth-onion-shampoo",
    winnerAdId: "wa-onion-2",
    source: "from-winner-ad",
    name: "Time-lapse transformation",
    description: "Weekly progress overlay on a single creator's hair journey.",
    visualDirection: "Vertical 9:16 · timestamp burn-in · brand-color progress bar",
    tone: "Authentic",
    thumbnail:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=75",
    capturedAt: new Date("2026-04-28"),
  },

  // Hair-care category
  {
    id: "kc-haircare-1",
    entityType: "category",
    entityId: "hair-care",
    winnerAdId: "wa-haircare-1",
    source: "saved-from-insights",
    name: "Educational listicle",
    description: "5-reason hair-fall listicle with 1 conversion close.",
    visualDirection: "Static carousel · 6 cards · brand color rotation per card",
    tone: "Educational",
    thumbnail:
      "https://images.unsplash.com/photo-1631730486572-226d1f595b68?auto=format&fit=crop&w=400&q=75",
    capturedAt: new Date("2026-04-10"),
  },
];

export function getConceptsForEntity(
  entityType: EntityType,
  entityId: EntityId,
  customConcepts: KbConcept[] = [],
): KbConcept[] {
  return [...KB_CONCEPTS, ...customConcepts].filter(
    (c) => c.entityType === entityType && c.entityId === entityId,
  );
}
