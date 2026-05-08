import type { Angle } from "@/genie6/types/entities";

/**
 * Angles — single source of truth (Catalogue ↔ Genie sync).
 *
 * 52 entries · conceptual selling angles. Each has a label + one-line
 * description. Used by Hooks (each hook references an angleId) and the
 * Studio generation flow.
 *
 * Schema: see `Angle` in `@/genie6/types/entities`.
 */

const ang = (id: string, label: string, description: string): Angle => ({ id, label, description });

export const angles: Angle[] = [
  // Emotional / aspirational
  ang("ang-asp-lifestyle", "Aspirational lifestyle", "Identity, transformation, future-self"),
  ang("ang-emotional-story", "Emotional storytelling", "Personal narrative, human-led"),
  ang("ang-nostalgia", "Nostalgia", "Childhood memories, throwback, heritage warmth"),
  ang("ang-empowerment", "Empowerment", "You-can-do-it, women-first, confidence"),
  ang("ang-belonging", "Belonging / community", "Join the movement, you're part of this"),

  // Pressure / urgency
  ang("ang-fomo", "FOMO", "Limited time / running out / others already bought"),
  ang("ang-urgency", "Urgency", "Last 24 hours / today only / first 100"),
  ang("ang-scarcity", "Scarcity", "Only 12 left / one per customer"),
  ang("ang-launch", "Launch / first access", "New drop / exclusive preview / waitlist-only"),

  // Comparison / proof
  ang("ang-comparison", "Comparison", "Side-by-side vs competitor or before/after"),
  ang("ang-before-after", "Before-after", "Visual transformation across timeline"),
  ang("ang-reviews-led", "Reviews-led", "Pull-quote from highest-rated reviews"),
  ang("ang-social-proof", "Social proof", "Customer count, reviews, testimonials"),
  ang("ang-celeb-endorsed", "Celebrity-endorsed", "Bollywood / sports / influencer-led"),
  ang("ang-expert-led", "Expert-led", "Doctor / dermatologist / nutritionist quotes"),

  // Authority / credibility
  ang("ang-authority", "Authority", "Expert / dermatologist / clinical"),
  ang("ang-clinical", "Clinical", "Studies, test results, lab-validated claims"),
  ang("ang-heritage", "Heritage", "X years in business / Made-in-India legacy"),
  ang("ang-certification", "Certification-led", "FDA / BIS / ISO / ECOCERT badges"),

  // Value / commercial
  ang("ang-bundle", "Bundle / upsell", "Combine with X for Y discount"),
  ang("ang-discount", "Discount-led", "20% / 30% / lowest-ever pricing"),
  ang("ang-bogo", "Buy-one-get-one", "Free product with purchase"),
  ang("ang-free-shipping", "Free shipping", "Free delivery on cart > X"),
  ang("ang-cashback", "Cashback / rewards", "Get X back · loyalty points"),
  ang("ang-emi", "EMI / split-pay", "No-cost EMI / 3-month split"),
  ang("ang-free-trial", "Free trial", "100-night trial / 30-day money back"),

  // Problem-solution
  ang("ang-problem-solution", "Problem-solution", "Identify pain → introduce fix"),
  ang("ang-objection-buster", "Objection buster", "Address top 3 buyer hesitations head-on"),
  ang("ang-myth-busting", "Myth-busting", "Debunk common misconception in category"),
  ang("ang-roi-led", "ROI / value-math", "₹/day · cost-per-use · break-even framing"),

  // Lifestyle / occasion
  ang("ang-routine-led", "Routine integration", "Show product in morning/evening routine"),
  ang("ang-gifting", "Gifting occasion", "Birthday / wedding / anniversary / festive"),
  ang("ang-self-care", "Self-care moment", "You-deserve-this micro-luxury"),
  ang("ang-sustainability", "Sustainability", "Plastic-free / recycled / climate-positive"),

  // Personalization
  ang("ang-personalized", "Personalized fit", "Based on your skin/hair/data type"),
  ang("ang-segment-specific", "Segment-specific", "For tier-2 buyers / for new moms / for office"),

  // Behavioral
  ang("ang-retargeting", "Retargeting", "Welcome back / left in cart / saw this earlier"),
  ang("ang-cart-recovery", "Cart recovery", "Complete your order with this 10% off"),
  ang("ang-winback", "Winback", "We miss you / here's 20% to return"),
  ang("ang-loyalty-tier", "Loyalty tier", "Exclusive for Gold / Platinum members"),

  // Educational
  ang("ang-how-to", "How-to / tutorial", "Step-by-step product use"),
  ang("ang-ingredient-deep-dive", "Ingredient deep-dive", "Why X% niacinamide matters"),
  ang("ang-myth-vs-fact", "Myth vs fact", "5 myths about hair fall"),
  ang("ang-explainer", "Explainer", "How this product works, in 30 seconds"),

  // Reactive / contextual
  ang("ang-trend-jacking", "Trend-jacking", "Hop on viral / cultural moment"),
  ang("ang-seasonal", "Seasonal", "Summer / monsoon / winter / festive"),
  ang("ang-city-specific", "City-specific", "Mumbai-monsoon / Delhi-pollution / Bangalore-AC"),
  ang("ang-news-jacking", "News-jacking", "Pegged to current event / launch"),

  // Trust / risk reversal
  ang("ang-risk-reversal", "Risk reversal", "Money-back / no-questions-asked refund"),
  ang("ang-warranty", "Warranty", "10-yr / lifetime / unconditional"),
  ang("ang-transparency", "Transparency", "Open ingredient list / open pricing"),

  // Founder / brand-led
  ang("ang-founder-story", "Founder story", "Why we built this / personal origin"),
  ang("ang-mission-led", "Mission-led", "We exist to do X / our purpose"),
];
