import type { Concept } from "@/genie6/types/entities";

/**
 * Concepts — single source of truth (Catalogue ↔ Genie sync).
 *
 * 50 entries · visual directions per brand/angle/format. Each concept
 * references a `brandId` (in `./brands.ts`) and contains a hook + tone +
 * format + visual-direction prose used by the Studio generation flow.
 *
 * Schema: see `Concept` in `@/genie6/types/entities`.
 */

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
