import type { Audience } from "@/genie6/types/entities";

/**
 * Audiences — single source of truth (Catalogue ↔ Genie sync).
 *
 * 52 entries · DTC personas across age × gender × geography × intent.
 * `brandId` links audience to a parent brand in `./brands.ts` (optional —
 * geography- and intent-based audiences are brand-agnostic).
 *
 * Schema: see `Audience` in `@/genie6/types/entities`.
 */

const aud = (id: string, label: string, segment: string, brandId?: string): Audience => ({
  id, label, segment, brandId,
});

export const audiences: Audience[] = [
  // Personal care / mom-led
  aud("aud-aff-w-30-45", "Affluent women 30-45", "F · 30-45 · HHI 12L+ · metro", "mamaearth"),
  aud("aud-mom-25-35", "New mom 25-35", "F · 25-35 · with toddler · safety-first shopper", "mamaearth"),
  aud("aud-mom-tier2", "Tier-2 wellness mom", "F · 28-42 · tier-2 city · wellness-curious", "mamaearth"),
  aud("aud-haircare-25-40", "Haircare-focused 25-40", "F · 25-40 · pro-clean ingredient", "plum"),
  aud("aud-acne-18-28", "Acne-prone 18-28", "F · 18-28 · breakout-frustrated", "the-derma-co"),
  aud("aud-anti-aging-35-50", "Anti-aging 35-50", "F · 35-50 · early signs of aging", "minimalist"),
  aud("aud-skin-tier1-22-32", "Tier-1 skin-savvy 22-32", "F · 22-32 · metro · routine-builder", "foxtale"),
  aud("aud-pigmentation-30-45", "Pigmentation-care 30-45", "F · 30-45 · sun-damage concern", "the-derma-co"),

  // Gen Z / fitness
  aud("aud-genz-fit", "Gen Z fitness", "M+F · 18-26 · gym-active", "noise"),
  aud("aud-genz-streetwear", "Gen Z streetwear", "M+F · 18-24 · meme-literate · mobile-native", "bewakoof"),
  aud("aud-college-22-25", "College graduates 22-25", "M+F · 22-25 · first job · budget-conscious", "snitch"),
  aud("aud-runner-25-35", "Runner / athleisure 25-35", "M+F · 25-35 · running 3+ days/week", "campus"),
  aud("aud-yoga-women-28-40", "Yoga women 28-40", "F · 28-40 · 4+ classes/week · mindful living", "oziva"),
  aud("aud-cricket-fans", "Cricket fans 18-45", "M · 18-45 · IPL season · BCCI engagement", "boat"),

  // Wearable tech / electronics
  aud("aud-male-22-30", "Urban male 22-30", "M · 22-30 · tier 1-2 · earphone heavy", "boat"),
  aud("aud-tech-enthu-25-35", "Tech enthusiast 25-35", "M · 25-35 · early-adopter · spec-sheet reader", "noise"),
  aud("aud-budget-tws-18-25", "Budget TWS shopper 18-25", "M+F · 18-25 · sub-2K willing", "boult"),
  aud("aud-gamer-20-30", "PC/console gamer 20-30", "M · 20-30 · 10+ hrs/week", "ptron"),

  // Sleep / wellness
  aud("aud-couple-30-45", "Settling-in couple", "30-45 · first-home · DTC-curious", "sleepyhead"),
  aud("aud-back-pain-35-55", "Back-pain sufferer 35-55", "M+F · 35-55 · chronic back issue", "wakefit"),
  aud("aud-quality-sleep-30-45", "Quality-sleep seeker 30-45", "M+F · 30-45 · sleep tracker user", "the-sleep-company"),
  aud("aud-supplements-25-40", "Supplement-curious 25-40", "M+F · 25-40 · gym + nutrition awareness", "yoga-bar"),
  aud("aud-wellness-women-30-45", "Women wellness 30-45", "F · 30-45 · holistic + ayurvedic openness", "kapiva"),

  // Beauty / makeup
  aud("aud-makeup-genz-18-26", "Makeup Gen Z 18-26", "F · 18-26 · TikTok/Insta-led trends", "sugar"),
  aud("aud-luxury-beauty-32-50", "Luxury beauty 32-50", "F · 32-50 · HHI 25L+ · premium brands only", "tira"),
  aud("aud-mass-beauty-22-35", "Mass beauty 22-35", "F · 22-35 · value-conscious · platform-shopper", "purplle"),
  aud("aud-bridal-22-30", "Bridal 22-30", "F · 22-30 · pre-wedding shopping · 6-month window", "myglamm"),

  // Men's grooming
  aud("aud-mens-grooming-25-35", "Men's grooming 25-35", "M · 25-35 · beard-active · premium-curious", "bombay-shaving-co"),
  aud("aud-budget-grooming-22-30", "Budget grooming 22-30", "M · 22-30 · sub-1K willing", "ustraa"),

  // Fashion
  aud("aud-young-prof-25-35", "Young professional 25-35", "M+F · 25-35 · tier-1 · workwear seekers", "snitch"),
  aud("aud-festive-shopper", "Festive shopper", "F · 25-50 · Diwali/wedding season · bulk buyer", "biba"),
  aud("aud-conscious-fashion-30-45", "Conscious fashion 30-45", "F · 30-45 · sustainable · handmade-aware", "fabindia"),
  aud("aud-comfort-wear-25-40", "Comfort-wear 25-40", "M+F · 25-40 · WFH staple buyers", "damensch"),

  // Eyewear / jewellery
  aud("aud-prescription-eyewear-25-50", "Prescription eyewear 25-50", "M+F · 25-50 · spec-wearer · home-test interest", "lenskart"),
  aud("aud-jewellery-occasions-25-50", "Jewellery occasions 25-50", "F · 25-50 · gifting + festive", "bluestone"),
  aud("aud-ethical-luxury-30-45", "Ethical luxury 30-45", "F · 30-45 · lab-grown-curious", "aukera"),

  // Furniture / home
  aud("aud-new-home-28-40", "New-home owner 28-40", "M+F · 28-40 · post-purchase furnishing", "pepperfry"),
  aud("aud-design-conscious-30-50", "Design-conscious 30-50", "M+F · 30-50 · architecture/design follower", "urban-ladder"),

  // Pet
  aud("aud-pet-parent-25-45", "Pet parent 25-45", "M+F · 25-45 · dog/cat owner · premium food", "supertails"),
  aud("aud-luxury-pet-30-50", "Luxury pet 30-50", "M+F · 30-50 · designer-pet-products", "heads-up-for-tails"),

  // Travel
  aud("aud-business-traveller-30-45", "Business traveller 30-45", "M+F · 30-45 · 6+ flights/yr", "mokobara"),
  aud("aud-leisure-traveller-25-40", "Leisure traveller 25-40", "M+F · 25-40 · 2-4 trips/yr", "uppercase"),

  // Food / direct delivery
  aud("aud-daily-essentials", "Daily essentials buyer", "F · 28-45 · primary household shopper", "country-delight"),
  aud("aud-meat-lovers-28-45", "Meat lovers 28-45", "M+F · 28-45 · non-veg · weekly buyer", "licious"),

  // Geography-specific
  aud("aud-mumbai-metro", "Mumbai metro", "All · 25-45 · pin-code 400xxx", undefined),
  aud("aud-bangalore-tech", "Bangalore tech 25-40", "M+F · 25-40 · IT/SaaS workforce", undefined),
  aud("aud-delhi-ncr", "Delhi NCR", "All · 22-45 · pin-code 110xxx + 12xxxx", undefined),
  aud("aud-tier2-rising", "Tier-2 rising", "All · 22-45 · Indore/Lucknow/Jaipur/Coimbatore", undefined),

  // Intent-based
  aud("aud-cart-abandoners", "Cart abandoners", "All · added-to-cart 24-72hr ago · no purchase", undefined),
  aud("aud-repeat-buyers", "Repeat buyers", "All · 2+ orders in 90 days", undefined),
  aud("aud-newsletter-engaged", "Newsletter engaged", "All · opened 3+ emails in 30 days", undefined),
  aud("aud-high-aov", "High-AOV buyers", "All · ₹3,000+ avg order value", undefined),
];
