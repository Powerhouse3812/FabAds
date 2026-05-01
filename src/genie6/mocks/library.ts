import type { Audience, Angle, Hook, Concept, Avatar, Voice } from "../types/entities";

/**
 * Genie library mocks — expanded to 50+ entries per asset type in iter-6 A-9.3.
 *
 * Realistic Indian DTC + global personas. Numbers are non-round per design
 * system §6 (47.3% not 50%, ₹2,499 not ₹2,500). All references match brands
 * in `src/mocks/shared/brands.ts`.
 */

/* ======================================================================
 *  AUDIENCES — 52 entries
 *  DTC personas across age × gender × geography × intent.
 * ====================================================================== */
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

/* ======================================================================
 *  ANGLES — 52 entries
 *  Conceptual selling angles. Each has a label + one-line description.
 * ====================================================================== */
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

/* ======================================================================
 *  HOOKS — 52 entries
 *  Real copy hooks with realistic CTR/impressions data per angle.
 * ====================================================================== */
const hk = (id: string, text: string, brandId: string, angleId: string, ctr?: number, impressions?: number): Hook => ({
  id, text, brandId, angleId,
  ...(ctr !== undefined && impressions !== undefined ? { performance: { ctr, impressions } } : {}),
});

export const hooks: Hook[] = [
  // Mamaearth (5)
  hk("hook-1", "Hair fall is real. This is not.", "mamaearth", "ang-comparison", 4.73, 142_840),
  hk("hook-mama-2", "We tested it on our own kids. Then on yours.", "mamaearth", "ang-emotional-story", 3.28, 98_120),
  hk("hook-mama-3", "Plant-based. Mom-tested. ₹50 off your first order.", "mamaearth", "ang-discount", 2.64, 67_400),
  hk("hook-mama-4", "Onion shampoo: real ingredient, real results.", "mamaearth", "ang-ingredient-deep-dive", 3.91, 124_580),
  hk("hook-mama-5", "Made Safe certified. No more reading labels.", "mamaearth", "ang-certification", 2.18, 41_200),

  // Noise (5)
  hk("hook-4", "POV: you finally found the smartwatch that survives squat day.", "noise", "ang-asp-lifestyle", 5.18, 201_447),
  hk("hook-noise-2", "Tested 3 smartwatches. This one stayed.", "noise", "ang-comparison", 4.42, 117_890),
  hk("hook-noise-3", "Bluetooth calling. AMOLED. 100+ sport modes. ₹3,499.", "noise", "ang-roi-led", 3.71, 89_220),
  hk("hook-noise-4", "Charge in 10 mins. Last all day.", "noise", "ang-problem-solution", 4.08, 142_300),
  hk("hook-noise-5", "Made in India. Engineered for Indian wrists.", "noise", "ang-heritage", 2.93, 51_640),

  // boAt (5)
  hk("hook-2", "Stop scrolling if you've ever had AirPods die at 6pm.", "boat", "ang-fomo", 3.92, 88_120),
  hk("hook-boat-2", "Plug-in. Plush bass. Pure boAt.", "boat", "ang-asp-lifestyle", 3.14, 76_400),
  hk("hook-boat-3", "ENx tech filters out everything. Even your boss's voice.", "boat", "ang-emotional-story", 4.27, 134_780),
  hk("hook-boat-4", "Buy 1, get 1 — Airdopes 141 special.", "boat", "ang-bogo", 5.62, 287_120),
  hk("hook-boat-5", "ASAP charge: 10 mins → 200 mins playback.", "boat", "ang-explainer", 3.48, 92_300),

  // Plum (4)
  hk("hook-3", "10 reasons your hair gummy isn't working.", "plum", "ang-authority", 2.87, 45_220),
  hk("hook-plum-2", "Vegan. Cruelty-free. Planet-positive packaging.", "plum", "ang-sustainability", 2.41, 38_900),
  hk("hook-plum-3", "Niacinamide 10% — for the pores you can see.", "plum", "ang-ingredient-deep-dive", 3.78, 87_400),
  hk("hook-plum-4", "First time? ₹100 off code: NEWPLUM.", "plum", "ang-discount", 4.12, 124_300),

  // Sleepyhead / Wakefit (5)
  hk("hook-5", "Sleep that earns its place in your day.", "sleepyhead", "ang-asp-lifestyle", 1.94, 28_660),
  hk("hook-7", "Made for the back you don't think about anymore.", "sleepyhead", "ang-asp-lifestyle"),
  hk("hook-sleep-2", "100 nights to fall in love. Or your money back.", "sleepyhead", "ang-risk-reversal", 3.82, 98_400),
  hk("hook-wake-1", "Built to last 10 years. Backed by warranty.", "wakefit", "ang-warranty", 2.94, 67_200),
  hk("hook-wake-2", "₹14,999 — our lowest ever for the queen size.", "wakefit", "ang-discount", 4.21, 142_300),

  // Lenskart (4)
  hk("hook-lk-1", "Free home eye check. Frames from ₹999.", "lenskart", "ang-roi-led", 3.42, 89_400),
  hk("hook-lk-2", "BLU-Cut for the screen-time generation.", "lenskart", "ang-problem-solution", 3.18, 76_800),
  hk("hook-lk-3", "3D try-on before you buy.", "lenskart", "ang-explainer", 4.01, 132_400),
  hk("hook-lk-4", "₹1,500 off first frame. Code: NEWFRAME.", "lenskart", "ang-discount", 4.87, 198_300),

  // SUGAR / MyGlamm (4)
  hk("hook-sugar-1", "Matte. As. Hell. 12-hour wear.", "sugar", "ang-asp-lifestyle", 4.73, 167_200),
  hk("hook-sugar-2", "Made for Indian skin tones. Finally.", "sugar", "ang-segment-specific", 3.94, 124_700),
  hk("hook-mg-1", "LIT kajal — smudge-proof for 12 hours.", "myglamm", "ang-problem-solution", 3.28, 87_900),
  hk("hook-mg-2", "Manish Malhotra collab. While stocks last.", "myglamm", "ang-celeb-endorsed", 5.04, 234_700),

  // Bewakoof / Souled Store (3)
  hk("hook-bw-1", "Naruto Sage Mode tee. ₹599. Limited drop.", "bewakoof", "ang-scarcity", 4.61, 178_300),
  hk("hook-bw-2", "Buy 3 tees, pay for 2.", "bewakoof", "ang-bogo", 3.87, 142_700),
  hk("hook-ss-1", "Official Marvel hoodie. Avengers approved.", "souled-store", "ang-celeb-endorsed", 3.42, 98_400),

  // BlueStone / CaratLane (3)
  hk("hook-bs-1", "BIS-hallmarked. 30-day returns. Try at home.", "bluestone", "ang-risk-reversal", 2.84, 51_400),
  hk("hook-cl-1", "Solitaire studs from ₹18,999.", "caratlane", "ang-roi-led", 3.12, 76_800),
  hk("hook-cl-2", "First-anniversary gift sorted.", "caratlane", "ang-gifting", 3.94, 124_700),

  // Bombay Shaving Co / Beardo (3)
  hk("hook-bsc-1", "6 blades. Zero nicks. ₹599.", "bombay-shaving-co", "ang-ingredient-deep-dive", 3.42, 98_700),
  hk("hook-bd-1", "Hrithik trusts it. Shouldn't you?", "beardo", "ang-celeb-endorsed", 4.18, 167_200),
  hk("hook-bd-2", "Beard oil that fixes the itch.", "beardo", "ang-problem-solution", 3.74, 112_400),

  // Yoga Bar / OZiva (3)
  hk("hook-yb-1", "20g protein. Real food. No maltitol.", "yoga-bar", "ang-ingredient-deep-dive", 3.91, 124_300),
  hk("hook-yb-2", "Buy 6 bars, get 2 free.", "yoga-bar", "ang-bogo", 3.42, 87_900),
  hk("hook-oz-1", "Plant protein for women. Designed by women.", "oziva", "ang-empowerment", 4.27, 156_400),

  // Snitch (2)
  hk("hook-sn-1", "Slim-fit blazers from ₹2,499.", "snitch", "ang-discount", 2.84, 67_400),
  hk("hook-sn-2", "Weekly drops. New stock every Friday.", "snitch", "ang-launch", 4.18, 178_300),

  // Mensa Brands (1)
  hk("hook-8", "5 founders. 11 brands. ₹2,499 starter kit.", "mensa-brands", "ang-bundle"),

  // Mokobara (2)
  hk("hook-mk-1", "10-year warranty. Aerospace polycarbonate.", "mokobara", "ang-warranty", 2.94, 51_200),
  hk("hook-mk-2", "Designed for the 6-flight-a-year executive.", "mokobara", "ang-segment-specific", 3.41, 87_400),
];

/* ======================================================================
 *  CONCEPTS — 50 entries
 *  Visual directions per brand/angle/format.
 * ====================================================================== */
const cn = (
  id: string,
  name: string,
  brandId: string,
  angle: string,
  hook: string,
  tone: string,
  format: string,
  visualDirection: string,
  generationCount: number = 0
): Concept => ({ id, name, brandId, angle, hook, tone, format, visualDirection, generationCount });

export const concepts: Concept[] = [
  cn("concept-mamaearth-asp-haircare", "Aspirational hair journey", "mamaearth", "Aspirational lifestyle", "Hair fall is real. This is not.",
    "Premium, mom-friendly", "4:5 static",
    "Soft daylight bathroom · woman 30-40 · long shiny hair · golden-hour palette", 24),
  cn("concept-mamaearth-onion-ingredient", "Onion ingredient hero", "mamaearth", "Ingredient deep-dive", "Onion shampoo: real ingredient, real results.",
    "Honest, ingredient-first", "1:1 static",
    "Macro shot of fresh onion next to bottle · clean white bg · drop of oil reflecting", 18),
  cn("concept-mamaearth-mom-emotional", "Mom emotional story", "mamaearth", "Emotional storytelling", "We tested it on our own kids. Then on yours.",
    "Warm, intimate", "9:16 video",
    "Real mom + toddler in bath · UGC handheld feel · soft daylight · 30s narrative arc", 14),

  cn("concept-noise-perf-comparison", "ColorFit Pro 5 vs the field", "noise", "Comparison", "Tested 3 smartwatches. This one stayed.",
    "Sharp, performance-led", "9:16 video",
    "30s reel · 3 watches lined up · third one zoom · aggressive cuts on beat", 18),
  cn("concept-noise-amoled-hero", "AMOLED display hero", "noise", "Ingredient deep-dive", "Bluetooth calling. AMOLED. 100+ sport modes. ₹3,499.",
    "Sharp, energetic", "1:1 static",
    "Watch face glowing in dark · OLED panel zoom · cyan + black palette", 22),
  cn("concept-noise-cricket-hook", "Cricket-fan hook", "noise", "Trend-jacking", "Made for the wrist that watched the World Cup.",
    "Energetic, fan-first", "9:16 video",
    "IPL stadium B-roll · cricket bat motion · watch on athletic wrist", 9),

  cn("concept-boat-fomo-budget", "Lowest ever — 161 buds", "boat", "FOMO", "Stop scrolling if you've ever had AirPods died at 6pm.",
    "Bold, energetic", "1:1 static",
    "Close-up earbud · battery icon · fast-charge motion lines", 31),
  cn("concept-boat-bogo-festive", "BOGO festive", "boat", "BOGO", "Buy 1, get 1 — Airdopes 141 special.",
    "Loud, festive", "4:5 static",
    "Two earbuds spotlight · diwali bokeh · ₹1,499 stamp · festive cracker glow", 27),
  cn("concept-boat-asap-charge", "ASAP charge demo", "boat", "Explainer", "10 mins → 200 mins playback.",
    "Demo-heavy, clear", "9:16 video",
    "Phone timer + earbud charge · split-screen demo · counter animation", 19),

  cn("concept-sleepyhead-premium-calm", "Premium calm", "sleepyhead", "Aspirational lifestyle", "Sleep that earns its place in your day.",
    "Calm, design-led", "16:9 static",
    "Soft morning light · linen bedding · neutral palette · empty room", 6),
  cn("concept-sleepyhead-100-night", "100-night trial guarantee", "sleepyhead", "Risk reversal", "100 nights to fall in love. Or your money back.",
    "Confident, reassuring", "1:1 static",
    "Bold typography over neutral bedroom shot · 100 number animation", 11),

  cn("concept-wakefit-warranty", "Built to last", "wakefit", "Warranty", "Built to last 10 years. Backed by warranty.",
    "Trustworthy, value-led", "1:1 static",
    "Mattress cutaway showing layers · warranty seal · clean studio bg", 8),
  cn("concept-wakefit-back-pain", "Back-pain solution", "wakefit", "Problem-solution", "Wake up without back pain. Or send it back.",
    "Empathetic, problem-aware", "9:16 video",
    "Person tossing in bed → switch → peaceful sleep on Wakefit · split-screen", 12),

  cn("concept-plum-niacinamide", "Niacinamide hero", "plum", "Ingredient deep-dive", "Niacinamide 10% — for the pores you can see.",
    "Clinical, friendly", "1:1 static",
    "Macro pore-skin texture before/after · 30-day timeline overlay", 16),
  cn("concept-plum-vegan", "Vegan + cruelty-free", "plum", "Sustainability", "Vegan. Cruelty-free. Planet-positive packaging.",
    "Conscious, friendly", "4:5 static",
    "Plant leaves + product flat-lay · earthy greens + creams", 9),

  cn("concept-derma-clinical", "Clinical credibility", "the-derma-co", "Authority", "Dermatologist-formulated. FDA-grade actives.",
    "Clinical, no-fluff", "1:1 static",
    "Lab coat + petri dish + product · cool blue palette · sans-serif type", 21),
  cn("concept-derma-sa-clear", "Salicylic clear-skin", "the-derma-co", "Problem-solution", "BHA-based. Gentle exfoliation. Real clear skin.",
    "Direct, clinical", "9:16 video",
    "Acne before/after · ingredient labels overlay · 30-day timeline", 14),

  cn("concept-minimalist-transparency", "Transparent ingredients", "minimalist", "Transparency", "Open ingredient list. No marketing fluff.",
    "Honest, science-first", "1:1 static",
    "Black on white · ingredient % printed large · no model · just bottle", 18),

  cn("concept-foxtale-niacinamide", "For Indian skin", "foxtale", "Segment-specific", "Niacinamide formulated for Indian skin tones.",
    "Confident, modern", "4:5 static",
    "South-Asian woman · golden hour · close-up · skin texture detail", 11),

  cn("concept-myglamm-bridal", "Bridal launch", "myglamm", "Launch", "Manish Malhotra collab. While stocks last.",
    "Glamorous, festive", "9:16 video",
    "Bride lehenga + makeup application · gold + crimson palette · slow-mo turns", 14),
  cn("concept-myglamm-kajal", "Kajal long-wear demo", "myglamm", "Problem-solution", "LIT kajal — smudge-proof for 12 hours.",
    "Bold, demo-heavy", "1:1 video",
    "Kajal application + 12hr time-lapse · no smudge proof · gen-z model", 8),

  cn("concept-sugar-matte", "Matte as hell", "sugar", "Aspirational lifestyle", "Matte. As. Hell. 12-hour wear.",
    "Bold, witty", "9:16 video",
    "Lipstick application + 12hr wear test · neon pink palette · sharp typography", 22),
  cn("concept-sugar-shades", "Indian skin shade range", "sugar", "Segment-specific", "Made for Indian skin tones. Finally.",
    "Inclusive, confident", "1:1 static",
    "30-shade swatch grid · diverse Indian skin tones · clean studio", 13),

  cn("concept-bewakoof-anime-drop", "Anime-drop scarcity", "bewakoof", "Scarcity", "Naruto Sage Mode tee. ₹599. Limited drop.",
    "Pop-culture, urgent", "1:1 static",
    "Tee on streetwear model · sage-mode glow · clock animation · neon palette", 27),
  cn("concept-bewakoof-bogo", "Buy 3 pay for 2", "bewakoof", "BOGO", "Buy 3 tees, pay for 2.",
    "Loud, value-led", "1:1 static",
    "3 tees stacked · ₹1,499 stamp · gradient yellow bg", 19),

  cn("concept-snitch-weekly-drop", "Weekly drop launch", "snitch", "Launch", "Weekly drops. New stock every Friday.",
    "Modern, premium", "9:16 video",
    "Friday-themed reel · model in 3 outfits · counter-tick animation", 11),

  cn("concept-lenskart-3d-tryon", "3D try-on demo", "lenskart", "Explainer", "3D try-on before you buy.",
    "Tech-forward", "9:16 video",
    "Webcam-style 3D try-on demo · UI overlays · multiple frame swaps", 16),
  cn("concept-lenskart-blu-cut", "Blu-cut screen-time", "lenskart", "Problem-solution", "BLU-Cut for the screen-time generation.",
    "Direct, problem-aware", "1:1 static",
    "Eye strain visual · before-after blu-cut filter · indigo overlay", 8),

  cn("concept-bluestone-try-home", "Try-at-home risk reversal", "bluestone", "Risk reversal", "BIS-hallmarked. 30-day returns. Try at home.",
    "Trust-led, premium", "1:1 static",
    "Box on home table · ring on hand · soft window light", 6),

  cn("concept-caratlane-anniversary", "Anniversary gifting", "caratlane", "Gifting", "First-anniversary gift sorted.",
    "Romantic, intimate", "9:16 video",
    "Couple unwrapping ring box · candlelight · soft acoustic background", 9),

  cn("concept-bsc-6blade-spec", "6-blade specification", "bombay-shaving-co", "Ingredient deep-dive", "6 blades. Zero nicks. ₹599.",
    "Sharp, premium", "1:1 static",
    "Macro 6-blade close-up · sandalwood + steel palette", 12),

  cn("concept-beardo-celeb", "Hrithik endorsement", "beardo", "Celebrity-endorsed", "Hrithik trusts it. Shouldn't you?",
    "Aspirational, masculine", "9:16 video",
    "Celebrity B-roll-style + product close-up · cinematic letterboxing", 18),
  cn("concept-beardo-itch", "Beard itch fix", "beardo", "Problem-solution", "Beard oil that fixes the itch.",
    "Direct, masculine", "1:1 video",
    "Itchy beard B-roll → calm post-application · before-after shots", 11),

  cn("concept-yogabar-protein", "20g protein bar", "yoga-bar", "Ingredient deep-dive", "20g protein. Real food. No maltitol.",
    "Honest, plant-led", "1:1 static",
    "Bar cut in half showing nuts/oats · ingredient labels overlay · earthy bg", 14),

  cn("concept-oziva-women", "Plant protein for women", "oziva", "Empowerment", "Plant protein for women. Designed by women.",
    "Empowering, plant-led", "4:5 static",
    "Diverse Indian women post-workout · green palette · founder cameo", 13),

  cn("concept-pepperfry-festive", "Festive furniture", "pepperfry", "Seasonal", "Festive 20% off — only this Diwali.",
    "Festive, warm", "1:1 static",
    "Diwali-styled living room · marigold + brass palette · sofa hero", 8),

  cn("concept-mensa-bundle", "Mensa starter kit bundle", "mensa-brands", "Bundle", "5 founders. 11 brands. ₹2,499 starter kit.",
    "Bundle-led, value-aware", "1:1 static",
    "Flat-lay of 11 sachets · price stamp · founder portraits in corners", 6),

  cn("concept-mokobara-warranty", "10-yr warranty hero", "mokobara", "Warranty", "10-year warranty. Aerospace polycarbonate.",
    "Premium, confident", "1:1 static",
    "Suitcase on airport conveyor · warranty stamp · cool greys", 7),

  cn("concept-cd-a2-daily", "A2 milk daily routine", "country-delight", "Routine integration", "Fresh A2 milk. Delivered before sunrise.",
    "Calm, daily-life", "16:9 video",
    "Pre-dawn doorstep delivery · cup of chai · morning sun warm-up", 5),

  cn("concept-licious-2hr", "2-hour fresh delivery", "licious", "Explainer", "Antibiotic-free. 2-hour delivery from cut to door.",
    "Premium, fresh", "9:16 video",
    "Cut → packing → delivery rider · cool steel palette · snappy cuts", 11),

  cn("concept-purplle-mass", "Mass beauty value", "purplle", "Discount", "Beauty under ₹500. 1500+ brands.",
    "Mass-friendly, value-led", "1:1 static",
    "Grid of 9 product flat-lays · price tags · pink palette", 14),

  cn("concept-tira-luxury", "Luxury exclusive", "tira", "Launch", "Charlotte Tilbury exclusive — only at Tira.",
    "Cinematic, luxury", "9:16 video",
    "Slow-mo product reveal · gold + black palette · cinematic letterboxing", 4),

  cn("concept-kapiva-ayurveda", "Ayurvedic farm-to-bottle", "kapiva", "Heritage", "Pure ayurveda. Farm to bottle.",
    "Heritage, calm", "16:9 video",
    "Farmland B-roll · ayurvedic herb close-up · founder narration", 7),

  cn("concept-jockey-comfort", "Comfort heritage", "jockey", "Heritage", "100 years. 100% cotton. Tag-free.",
    "Trustworthy, heritage", "1:1 static",
    "Vintage Jockey ad pastiche · modern model · cream palette", 11),

  cn("concept-damensch-bamboo", "Bamboo modal demo", "damensch", "Ingredient deep-dive", "Bamboo modal. Anti-bacterial. Sweat-wicking.",
    "Premium menswear", "9:16 video",
    "Fabric close-up + drop test · clean studio bg · cool palette", 9),

  cn("concept-fabindia-handloom", "Handloom artisan", "fabindia", "Heritage", "Handloom. Artisan-made. Conscious.",
    "Calm, artisan-led", "4:5 static",
    "Weaver hands + loom + finished kurta · earth palette · slow video", 6),

  cn("concept-uppercase-recycled", "Sustainability", "uppercase", "Sustainability", "100% recycled materials. Lifetime warranty.",
    "Conscious, premium", "1:1 static",
    "Suitcase + recycled-bottle visual · green + grey palette", 8),
];

/* ======================================================================
 *  AVATARS — 52 entries
 *  Multilingual personas across regions + ages.
 * ====================================================================== */
const av = (id: string, name: string, demographic: string, language: string[]): Avatar => ({
  id, name, demographic, language,
});

export const avatars: Avatar[] = [
  // South Asian
  av("ava-priya", "Priya", "F · 28-34 · South Asian", ["en-IN", "hi-IN"]),
  av("ava-aarav", "Aarav", "M · 25-31 · South Asian", ["en-IN", "hi-IN"]),
  av("ava-naina", "Naina", "F · 21-26 · South Asian", ["en-IN", "hi-IN"]),
  av("ava-rohan", "Rohan", "M · 30-38 · Pan-Asian", ["en-IN", "en-US"]),
  av("ava-ananya", "Ananya", "F · 24-30 · South Asian · metro", ["en-IN", "hi-IN"]),
  av("ava-vikram", "Vikram", "M · 32-40 · South Asian · tier-1", ["en-IN", "hi-IN"]),
  av("ava-meera", "Meera", "F · 35-44 · South Asian · mom", ["en-IN", "hi-IN", "ta-IN"]),
  av("ava-arjun", "Arjun", "M · 22-28 · South Asian · gen-z", ["en-IN", "hi-IN"]),
  av("ava-divya", "Divya", "F · 26-32 · South Indian", ["en-IN", "ta-IN", "hi-IN"]),
  av("ava-karthik", "Karthik", "M · 28-36 · South Indian", ["en-IN", "ta-IN", "te-IN"]),
  av("ava-kavya", "Kavya", "F · 22-28 · South Indian · gen-z", ["en-IN", "ta-IN"]),
  av("ava-sanya", "Sanya", "F · 30-38 · Punjabi · expressive", ["en-IN", "hi-IN", "pa-IN"]),
  av("ava-ishaan", "Ishaan", "M · 24-30 · Bengali · creative", ["en-IN", "hi-IN", "bn-IN"]),
  av("ava-rohini", "Rohini", "F · 38-46 · Maharashtrian · mom", ["en-IN", "hi-IN", "mr-IN"]),
  av("ava-zoya", "Zoya", "F · 25-32 · South Asian · urban-fashion", ["en-IN", "hi-IN", "ur"]),
  av("ava-dev", "Dev", "M · 35-44 · South Asian · executive", ["en-IN", "hi-IN", "en-GB"]),

  // MENA
  av("ava-zara", "Zara", "F · 32-38 · MENA", ["en-US", "ar"]),
  av("ava-omar", "Omar", "M · 28-36 · MENA · urban", ["en-US", "ar"]),
  av("ava-leila", "Leila", "F · 24-30 · MENA · modest-fashion", ["en-US", "ar", "fr"]),
  av("ava-hassan", "Hassan", "M · 36-44 · MENA · entrepreneur", ["en-US", "ar"]),

  // Caucasian / North America / Europe
  av("ava-emily", "Emily", "F · 24-30 · Caucasian", ["en-US", "en-GB"]),
  av("ava-marcus", "Marcus", "M · 28-34 · African-American", ["en-US"]),
  av("ava-james", "James", "M · 32-40 · Caucasian · finance", ["en-US"]),
  av("ava-sarah", "Sarah", "F · 35-42 · Caucasian · mom-of-2", ["en-US"]),
  av("ava-jessica", "Jessica", "F · 22-28 · Caucasian · gen-z creator", ["en-US"]),
  av("ava-ethan", "Ethan", "M · 26-32 · Caucasian · tech bro", ["en-US"]),
  av("ava-olivia", "Olivia", "F · 30-38 · Caucasian · UK-based", ["en-GB"]),
  av("ava-ava", "Ava", "F · 28-34 · Caucasian · LA fitness", ["en-US"]),
  av("ava-noah", "Noah", "M · 24-30 · Caucasian · NY hipster", ["en-US"]),
  av("ava-isabella", "Isabella", "F · 30-36 · Latina · LA", ["en-US", "es"]),
  av("ava-mateo", "Mateo", "M · 25-32 · Latino · Miami", ["en-US", "es"]),
  av("ava-sofia", "Sofia", "F · 26-32 · European · Spain", ["en-GB", "es", "fr"]),

  // East Asian
  av("ava-yuki", "Yuki", "F · 26-32 · East Asian", ["ja", "en-US"]),
  av("ava-hiroshi", "Hiroshi", "M · 30-38 · Japanese", ["ja", "en-US"]),
  av("ava-mei", "Mei", "F · 24-30 · Chinese · urban Shanghai", ["zh-CN", "en-US"]),
  av("ava-kenji", "Kenji", "M · 28-36 · Japanese · creative", ["ja", "en-US"]),
  av("ava-ji-eun", "Ji-eun", "F · 22-28 · Korean · K-beauty enthusiast", ["ko", "en-US"]),
  av("ava-min-jun", "Min-jun", "M · 26-32 · Korean · streetwear", ["ko", "en-US"]),
  av("ava-xiao-lin", "Xiao Lin", "F · 30-38 · Chinese · mom in Beijing", ["zh-CN"]),

  // SEA
  av("ava-anya-th", "Anya", "F · 24-30 · Thai · Bangkok urban", ["th", "en-US"]),
  av("ava-darius", "Darius", "M · 28-34 · Filipino · Manila", ["en-PH", "fil"]),
  av("ava-rina-id", "Rina", "F · 22-28 · Indonesian · Jakarta gen-z", ["id", "en-US"]),
  av("ava-aaron-sg", "Aaron", "M · 30-38 · Singaporean Chinese", ["en-SG", "zh-CN"]),
  av("ava-mai-vn", "Mai", "F · 26-32 · Vietnamese · Saigon", ["vi", "en-US"]),

  // Africa
  av("ava-amara", "Amara", "F · 28-34 · West African · Lagos", ["en-NG"]),
  av("ava-kwame", "Kwame", "M · 26-32 · West African · Accra", ["en-GH"]),
  av("ava-thandi", "Thandi", "F · 30-38 · South African · Johannesburg", ["en-ZA"]),

  // Australia / Oceania
  av("ava-max-au", "Max", "M · 30-38 · Australian · Sydney creative", ["en-AU"]),
  av("ava-charlotte-au", "Charlotte", "F · 26-32 · Australian · Melbourne mom", ["en-AU"]),

  // Senior / older
  av("ava-margaret", "Margaret", "F · 50-60 · Caucasian · empty-nester", ["en-US"]),
  av("ava-david", "David", "M · 55-65 · Caucasian · semi-retired", ["en-US", "en-GB"]),
  av("ava-uncle-rajan", "Uncle Rajan", "M · 50-60 · South Asian · traditional", ["en-IN", "hi-IN"]),
];

/* ======================================================================
 *  VOICES — 52 entries
 *  Voice samples across languages + tones.
 * ====================================================================== */
const vc = (id: string, name: string, language: string, description: string): Voice => ({
  id, name, language, description,
});

export const voices: Voice[] = [
  // Hindi / Indian English
  vc("voice-priya-warm", "Priya — Warm Hindi", "hi-IN", "Warm, motherly, conversational. Best for haircare/skincare."),
  vc("voice-aarav-energetic", "Aarav — Energetic Hinglish", "en-IN", "Sharp Gen Z, energetic. Best for tech/wearables."),
  vc("voice-naina-confident", "Naina — Confident Hinglish", "en-IN", "Direct, confident, no-nonsense. Best for ratio products."),
  vc("voice-meera-mom", "Meera — Soft motherly", "hi-IN", "Soft, caring, mom-tone. Best for baby + wellness."),
  vc("voice-vikram-authority", "Vikram — Authority Hindi", "hi-IN", "Deep, authoritative. Best for finance/insurance/B2B."),
  vc("voice-rohan-corporate", "Rohan — Corporate English", "en-IN", "Crisp, clean, mid-pitch. Best for SaaS/B2B."),
  vc("voice-zoya-fashion", "Zoya — Fashion-forward English", "en-IN", "Stylish, urban, fashion-savvy. Best for makeup/apparel."),
  vc("voice-arjun-genz", "Arjun — Gen Z Hinglish", "en-IN", "Slang-friendly, expressive, fast-paced. Best for streetwear/tech."),
  vc("voice-ananya-storyteller", "Ananya — Hindi storyteller", "hi-IN", "Narrative, soft-spoken. Best for emotional storytelling/long-form."),

  // South Indian languages
  vc("voice-divya-tamil", "Divya — Tamil female", "ta-IN", "Warm, conversational. Best for South-Indian-targeted DTC."),
  vc("voice-karthik-tamil", "Karthik — Tamil male", "ta-IN", "Confident, direct. Best for Chennai-targeted finance/tech."),
  vc("voice-kavya-telugu", "Kavya — Telugu female", "te-IN", "Friendly, gen-z. Best for Hyderabad-targeted beauty/fashion."),
  vc("voice-suresh-malayalam", "Suresh — Malayalam male", "ml-IN", "Smooth, calm. Best for Kerala-targeted wellness."),
  vc("voice-nila-kannada", "Nila — Kannada female", "kn-IN", "Bright, friendly. Best for Bangalore-targeted tech/D2C."),

  // Other Indian languages
  vc("voice-rohini-marathi", "Rohini — Marathi female", "mr-IN", "Maternal, trustworthy. Best for Mumbai-targeted family products."),
  vc("voice-pranay-marathi", "Pranay — Marathi male", "mr-IN", "Conversational, mid-pitch. Best for Pune-targeted finance."),
  vc("voice-ishaan-bengali", "Ishaan — Bengali male", "bn-IN", "Soft, intellectual. Best for Kolkata-targeted books/wellness."),
  vc("voice-tara-bengali", "Tara — Bengali female", "bn-IN", "Sweet, expressive. Best for Bengal-targeted beauty/jewellery."),
  vc("voice-sanya-punjabi", "Sanya — Punjabi female", "pa-IN", "Bright, festive, expressive. Best for Punjab-targeted festivities."),
  vc("voice-jaspal-punjabi", "Jaspal — Punjabi male", "pa-IN", "Strong, festive. Best for Punjab-targeted automotive/fashion."),
  vc("voice-priti-gujarati", "Priti — Gujarati female", "gu-IN", "Warm, family-oriented. Best for Gujarat-targeted gold/festive."),
  vc("voice-rajesh-gujarati", "Rajesh — Gujarati male", "gu-IN", "Trader-confident. Best for Gujarat-targeted business products."),

  // US English
  vc("voice-emily-calm", "Emily — Calm US English", "en-US", "Premium, calm, design-led. Best for mattress/wellness."),
  vc("voice-marcus-bold", "Marcus — Bold US English", "en-US", "Bold, confident, performance copy. Best for tech."),
  vc("voice-james-finance", "James — Finance US English", "en-US", "Crisp, authoritative. Best for fintech/banking."),
  vc("voice-sarah-mom", "Sarah — Mom-next-door US", "en-US", "Relatable, warm. Best for family/parenting brands."),
  vc("voice-ethan-tech", "Ethan — Tech bro US", "en-US", "Casual, fast-paced, gen-z. Best for SaaS/tech demos."),
  vc("voice-jessica-creator", "Jessica — Creator-style US", "en-US", "TikTok-style, expressive. Best for UGC/influencer feel."),

  // UK English
  vc("voice-olivia-rp", "Olivia — Received Pronunciation", "en-GB", "Refined, premium. Best for luxury/heritage brands."),
  vc("voice-david-narrator", "David — UK narrator", "en-GB", "Documentary-style, authoritative. Best for explainer videos."),
  vc("voice-charlotte-au", "Charlotte — Australian female", "en-AU", "Friendly, beachy. Best for activewear/lifestyle."),
  vc("voice-max-au", "Max — Australian male", "en-AU", "Easy-going, sporty. Best for outdoor/lifestyle."),

  // Latin / Spanish
  vc("voice-isabella-spanish", "Isabella — LATAM Spanish female", "es", "Warm, expressive. Best for Latin-America-targeted beauty."),
  vc("voice-mateo-spanish", "Mateo — LATAM Spanish male", "es", "Confident, energetic. Best for sports/automotive."),
  vc("voice-sofia-spain", "Sofia — Spain Castilian female", "es-ES", "Polished, urban. Best for Spain-targeted luxury."),

  // East Asian
  vc("voice-yuki-bright", "Yuki — Bright Japanese", "ja", "Bright, polite, optimistic. Best for global expansion."),
  vc("voice-hiroshi-narrator", "Hiroshi — Japanese narrator", "ja", "Calm, premium. Best for design/architecture brands."),
  vc("voice-mei-mandarin", "Mei — Mandarin female", "zh-CN", "Soft, friendly. Best for China-targeted beauty/skincare."),
  vc("voice-li-mandarin", "Li Wei — Mandarin male", "zh-CN", "Authoritative. Best for China-targeted automotive/finance."),
  vc("voice-jieun-korean", "Ji-eun — Korean female", "ko", "Sweet, K-beauty-style. Best for K-beauty brands."),
  vc("voice-minjun-korean", "Min-jun — Korean male", "ko", "Cool, streetwear-energy. Best for fashion/streetwear."),

  // SEA
  vc("voice-anya-thai", "Anya — Thai female", "th", "Friendly, warm. Best for SEA-targeted wellness/beauty."),
  vc("voice-darius-tagalog", "Darius — Tagalog male", "fil", "Friendly, expressive. Best for Philippines-targeted FMCG."),
  vc("voice-rina-bahasa", "Rina — Bahasa female", "id", "Bright, gen-z. Best for Indonesia-targeted gen-z brands."),
  vc("voice-mai-vietnamese", "Mai — Vietnamese female", "vi", "Soft, friendly. Best for Vietnam-targeted beauty."),

  // MENA
  vc("voice-zara-arabic", "Zara — Arabic female", "ar", "Warm, expressive. Best for MENA-targeted modest fashion/beauty."),
  vc("voice-omar-arabic", "Omar — Arabic male", "ar", "Confident, urban. Best for MENA-targeted tech/auto."),

  // French / European
  vc("voice-marie-french", "Marie — Parisian French female", "fr", "Refined, premium. Best for luxury beauty."),
  vc("voice-pierre-french", "Pierre — French male narrator", "fr", "Authoritative, polished. Best for luxury automotive."),

  // Specialty (older, character)
  vc("voice-margaret-narrator", "Margaret — Mature US female", "en-US", "Wise, calm. Best for senior wellness/insurance."),
  vc("voice-uncle-rajan", "Uncle Rajan — Mature Hindi", "hi-IN", "Traditional, family elder. Best for traditional/heritage products."),
  vc("voice-sutradhaar", "Sutradhaar — Hindi narrator", "hi-IN", "Theatrical narrator. Best for storytelling/heritage brands."),
];
