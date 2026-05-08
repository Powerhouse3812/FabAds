import type { Product, Variant } from "@/genie6/types/entities";

/**
 * Products — single source of truth (Catalogue ↔ Genie sync).
 *
 * Iter-6 A-9 expansion: from 16 entries → 60+ entries with new relations:
 *   - categoryId  (many-to-one) — used by Affiliate Ad mode + KB
 *   - landingPages[] — destination URLs for Product Ad / Affiliate Ad
 *   - campaignUrls[] — UTM-decorated variants for Launch flow
 *
 * Each product ID uses the brand-id prefix (e.g., `mamaearth-onion-shampoo`).
 * Realistic Indian DTC SKUs across the 55 brands in `shared/brands.ts`.
 */

const p = (
  id: string,
  brandId: string,
  categoryId: string,
  name: string,
  price: string,
  benefits: string[],
  promo: string | undefined,
  landingPages: string[],
  campaignUrls: string[],
  generatedCount: number,
  thumbnail?: string
): Product => ({
  id,
  brandId,
  categoryId,
  name,
  price,
  thumbnail,
  benefits,
  promo,
  landingPages,
  campaignUrls,
  generatedCount,
});

const _baseProducts: Product[] = [
  // Mamaearth (4)
  p("mamaearth-onion-shampoo", "mamaearth", "hair-care", "Onion Hair Shampoo for Hair Fall Control",
    "₹349", ["reduces hair fall","strengthens roots","biotin-enriched","sulfate-free"],
    "Buy 2 Get 1 Free",
    ["https://mamaearth.in/onion-shampoo","https://mamaearth.in/hair-fall-bundle"],
    ["https://mamaearth.in/onion-shampoo?utm_source=fb&utm_campaign=hairfall_apr","https://mamaearth.in/onion-shampoo?utm_source=google&utm_campaign=brand_search"],
    284),
  p("mamaearth-onion-conditioner", "mamaearth", "hair-care", "Onion Hair Conditioner with Coconut Milk",
    "₹299", ["softens hair","reduces frizz","strengthens roots","paraben-free"],
    undefined,
    ["https://mamaearth.in/onion-conditioner"],
    ["https://mamaearth.in/onion-conditioner?utm_source=fb&utm_campaign=haircare_apr"],
    142),
  p("mamaearth-vc-facewash", "mamaearth", "skin-care", "Vitamin C Daily Glow Face Wash",
    "₹249", ["instant glow","reduces dullness","20% Vit C complex","skin-brightening"],
    "₹50 OFF First Order",
    ["https://mamaearth.in/vc-facewash"],
    ["https://mamaearth.in/vc-facewash?utm_source=ig&utm_campaign=glow_summer"],
    97),
  p("mamaearth-biotin-gummy", "mamaearth", "wellness", "Biotin Hair Gummies — 30 Day Pack",
    "₹599", ["5000mcg biotin","supports hair growth","tasty strawberry","no maltitol"],
    undefined,
    ["https://mamaearth.in/biotin-gummies"],
    ["https://mamaearth.in/biotin-gummies?utm_source=fb&utm_campaign=wellness_q2"],
    63),

  // WOW (2)
  p("wow-acv-shampoo", "wow-skin-science", "hair-care", "Apple Cider Vinegar Shampoo",
    "₹399", ["clears product buildup","balances scalp pH","sulfate-free","cruelty-free"],
    undefined,
    ["https://buywow.in/acv-shampoo"],
    ["https://buywow.in/acv-shampoo?utm_source=fb&utm_campaign=acv_summer"],
    78),
  p("wow-vc-serum", "wow-skin-science", "skin-care", "Vitamin C Face Serum",
    "₹699", ["dark spot fade","20% Vitamin C","brightening","anti-oxidant"],
    "20% OFF",
    ["https://buywow.in/vc-serum"],
    ["https://buywow.in/vc-serum?utm_source=ig&utm_campaign=glow_apr"],
    52),

  // Plum (2)
  p("plum-gh-serum", "plum", "skin-care", "Green Tea Skin Clarifying Serum",
    "₹525", ["fades acne marks","2% niacinamide","oil-control","vegan"],
    undefined,
    ["https://plumgoodness.com/gt-serum"],
    ["https://plumgoodness.com/gt-serum?utm_source=fb&utm_campaign=acne_clear"],
    61),
  p("plum-niacinamide", "plum", "acne", "10% Niacinamide Face Serum",
    "₹699", ["oil control","minimizes pores","skin-clarifying","fragrance-free"],
    undefined,
    ["https://plumgoodness.com/niacinamide"],
    ["https://plumgoodness.com/niacinamide?utm_source=fb&utm_campaign=clearskin"],
    44),

  // mCaffeine (1)
  p("mcaffeine-coffee-bodyscrub", "mcaffeine", "body-care", "Coffee Body Scrub with Walnut",
    "₹599", ["exfoliates","de-tans","caffeine-infused","FDA-approved"],
    "Buy 1 Get 1 Free",
    ["https://mcaffeine.com/coffee-scrub"],
    ["https://mcaffeine.com/coffee-scrub?utm_source=fb&utm_campaign=detan_apr"],
    89),

  // The Derma Co (1)
  p("dermaco-1-niacinamide", "the-derma-co", "acne", "1% Salicylic Acid Daily Face Wash",
    "₹399", ["BHA-based","gentle exfoliation","oil-control","dermatologist-formulated"],
    undefined,
    ["https://thedermaco.com/sa-facewash"],
    ["https://thedermaco.com/sa-facewash?utm_source=google&utm_campaign=clearskin_brand"],
    71),

  // Minimalist (2)
  p("minimalist-niacinamide-10", "minimalist", "skin-care", "Niacinamide 10% Face Serum",
    "₹599", ["minimizes pores","oil control","brightening","clinically-validated"],
    undefined,
    ["https://beminimalist.co/niacinamide-10"],
    ["https://beminimalist.co/niacinamide-10?utm_source=fb&utm_campaign=clearskin"],
    132),
  p("minimalist-vit-c-16", "minimalist", "anti-aging", "Vitamin C 16% Face Serum",
    "₹999", ["powerful brightening","stable Vit C","ethyl ascorbic acid","clinical strength"],
    "10% OFF First Order",
    ["https://beminimalist.co/vit-c-16"],
    ["https://beminimalist.co/vit-c-16?utm_source=ig&utm_campaign=glow"],
    98),

  // Noise (3)
  p("noise-colorfit-pro-5", "noise", "smartwatches", "ColorFit Pro 5 Buzz with Bluetooth Calling",
    "₹3,499", ["1.85\" AMOLED","BT calling","100+ sport modes","SpO2 monitoring"],
    "₹500 OFF",
    ["https://gonoise.com/colorfit-pro-5"],
    ["https://gonoise.com/colorfit-pro-5?utm_source=fb&utm_campaign=cfp5_launch","https://gonoise.com/colorfit-pro-5?utm_source=google&utm_campaign=brand_search"],
    412),
  p("noise-airwave-max-2", "noise", "wireless-earbuds", "AirWave Max 2 Bass-Forward TWS",
    "₹1,499", ["50hr battery","ENx tech","13mm drivers","low-latency mode"],
    undefined,
    ["https://gonoise.com/airwave-max-2"],
    ["https://gonoise.com/airwave-max-2?utm_source=fb&utm_campaign=audio_apr"],
    267),
  p("noise-buds-vs-104", "noise", "wireless-earbuds", "Buds VS104 with 60hr Battery",
    "₹999", ["60hr playtime","instacharge","ENC tech","IPX5 water-resistant"],
    "₹200 OFF",
    ["https://gonoise.com/buds-vs104"],
    ["https://gonoise.com/buds-vs104?utm_source=fb&utm_campaign=budget_tws"],
    178),

  // boAt (2)
  p("boat-airdopes-141", "boat", "wireless-earbuds", "Airdopes 141 with 42hr Battery",
    "₹1,299", ["42hr battery","ENx tech","ASAP charge","Beast Mode"],
    "Buy 2 ₹2,099",
    ["https://boat-lifestyle.com/airdopes-141"],
    ["https://boat-lifestyle.com/airdopes-141?utm_source=fb&utm_campaign=audio_q2"],
    523),
  p("boat-rockerz-450", "boat", "wireless-earbuds", "Rockerz 450 Bluetooth Headphones",
    "₹1,499", ["15hr battery","40mm drivers","BT 5.0","foldable design"],
    undefined,
    ["https://boat-lifestyle.com/rockerz-450"],
    ["https://boat-lifestyle.com/rockerz-450?utm_source=ig&utm_campaign=audio_apr"],
    156),

  // Sleepyhead (2)
  p("sleepyhead-original-mattress", "sleepyhead", "mattresses", "The Original Memory Foam Mattress",
    "₹14,999", ["memory foam","100-night trial","CertiPUR-US","made in India"],
    "30% OFF + Free Pillow",
    ["https://sleepyhead.in/original-mattress"],
    ["https://sleepyhead.in/original-mattress?utm_source=fb&utm_campaign=sleep_summer"],
    287),
  p("sleepyhead-cervical-pillow", "sleepyhead", "pillows", "Memory Foam Cervical Pillow",
    "₹1,299", ["neck-pain relief","cooling gel","memory foam","ortho-recommended"],
    undefined,
    ["https://sleepyhead.in/cervical-pillow"],
    ["https://sleepyhead.in/cervical-pillow?utm_source=fb&utm_campaign=neck_pain"],
    98),

  // Wakefit (2)
  p("wakefit-orthopedic", "wakefit", "mattresses", "Orthopedic Memory Foam Mattress",
    "₹12,999", ["ortho-curve","100-night trial","cooling gel","D2C pricing"],
    "Free Sheets + 100-Night Trial",
    ["https://wakefit.co/orthopedic-mattress"],
    ["https://wakefit.co/orthopedic-mattress?utm_source=fb&utm_campaign=back_pain"],
    341),
  p("wakefit-sheesham-bed", "wakefit", "furniture-bed", "Sheesham Wood Hydraulic Storage Bed",
    "₹38,999", ["sheesham wood","hydraulic storage","ergonomic","5-year warranty"],
    undefined,
    ["https://wakefit.co/sheesham-bed"],
    ["https://wakefit.co/sheesham-bed?utm_source=fb&utm_campaign=furniture_apr"],
    52),

  // The Sleep Company (1)
  p("tsc-smart-mattress", "the-sleep-company", "mattresses", "SmartGRID Luxe Mattress",
    "₹19,999", ["SmartGRID tech","ortho-recommended","100-night trial","queen size"],
    "20% OFF",
    ["https://thesleepcompany.in/smart-luxe"],
    ["https://thesleepcompany.in/smart-luxe?utm_source=fb&utm_campaign=premium_sleep"],
    187),

  // Yoga Bar (2)
  p("yogabar-protein-bar", "yoga-bar", "wellness", "20g Protein Bar — Pack of 6",
    "₹659", ["20g protein","clean ingredients","real food","no maltitol"],
    undefined,
    ["https://yogabars.in/protein-bar"],
    ["https://yogabars.in/protein-bar?utm_source=ig&utm_campaign=fitness_q2"],
    142),
  p("yogabar-muesli", "yoga-bar", "wellness", "Crunchy Almond + Quinoa Muesli",
    "₹499", ["high fiber","real almonds","no maida","natural sweeteners"],
    undefined,
    ["https://yogabars.in/muesli"],
    ["https://yogabars.in/muesli?utm_source=fb&utm_campaign=breakfast_apr"],
    78),

  // OZiva (1)
  p("oziva-protein-women", "oziva", "wellness", "Protein & Herbs for Women",
    "₹999", ["plant protein","ayurvedic herbs","supports hair + skin","DGCA-certified"],
    "BOGO Free Shaker",
    ["https://oziva.in/protein-women"],
    ["https://oziva.in/protein-women?utm_source=fb&utm_campaign=women_wellness"],
    132),

  // SUGAR + MyGlamm (4)
  p("sugar-matte-lipstick", "sugar", "makeup-lip", "Matte As Hell Crayon Lipstick",
    "₹499", ["mat finish","12-hour stay","Indian skin-tones","100% vegan"],
    undefined,
    ["https://sugarcosmetics.com/matte-as-hell"],
    ["https://sugarcosmetics.com/matte-as-hell?utm_source=ig&utm_campaign=lip_apr"],
    284),
  p("sugar-foundation", "sugar", "makeup-face", "Ace Of Face Foundation Stick",
    "₹999", ["weightless coverage","12-hour wear","30 shades","SPF 15"],
    undefined,
    ["https://sugarcosmetics.com/ace-foundation"],
    ["https://sugarcosmetics.com/ace-foundation?utm_source=fb&utm_campaign=foundation_summer"],
    167),
  p("myglamm-kajal", "myglamm", "makeup-eye", "LIT Kajal Pencil",
    "₹399", ["smudge-proof","12-hour wear","kohl-black","vegan"],
    "Buy 2 ₹699",
    ["https://myglamm.com/lit-kajal"],
    ["https://myglamm.com/lit-kajal?utm_source=fb&utm_campaign=kajal_apr"],
    234),
  p("myglamm-lipgloss", "myglamm", "makeup-lip", "Pose HD Liquid Lip Color",
    "₹599", ["non-drying","HD finish","8-hour wear","celeb-collab shades"],
    undefined,
    ["https://myglamm.com/pose-hd"],
    ["https://myglamm.com/pose-hd?utm_source=ig&utm_campaign=glam_summer"],
    98),

  // Bombay Shaving Co + Beardo (2)
  p("bsc-6-blade", "bombay-shaving-co", "mens-grooming", "Sensiblade 6-Blade Razor",
    "₹599", ["6 blades","no nicks","5x more durable","India-first"],
    "Free Shaving Cream",
    ["https://bombayshavingcompany.com/sensiblade"],
    ["https://bombayshavingcompany.com/sensiblade?utm_source=fb&utm_campaign=razor_apr"],
    156),
  p("beardo-beard-oil", "beardo", "beard-care", "Godfather Beard Oil",
    "₹399", ["softens beard","argan oil","reduces itching","sandalwood scent"],
    undefined,
    ["https://beardo.in/godfather-beard-oil"],
    ["https://beardo.in/godfather-beard-oil?utm_source=fb&utm_campaign=beard_q2"],
    178),

  // Bewakoof + Souled Store (2)
  p("bewakoof-anime-tee", "bewakoof", "streetwear", "Naruto Sage Mode Oversized T-Shirt",
    "₹599", ["100% cotton","oversized fit","official anime print","sub-1500 pricing"],
    "Buy 3 ₹1499",
    ["https://bewakoof.com/naruto-sage-tee"],
    ["https://bewakoof.com/naruto-sage-tee?utm_source=ig&utm_campaign=anime_drop"],
    321),
  p("souled-marvel-hoodie", "souled-store", "streetwear", "Marvel Avengers Hoodie",
    "₹1,499", ["official Marvel license","fleece-lined","unisex fit","oversized"],
    undefined,
    ["https://thesouledstore.com/marvel-hoodie"],
    ["https://thesouledstore.com/marvel-hoodie?utm_source=fb&utm_campaign=marvel_apr"],
    142),

  // Snitch + Zudio (2)
  p("snitch-blazer", "snitch", "apparel-formal", "Slim-Fit Knit Blazer",
    "₹2,499", ["slim-fit","stretch-knit","weekly drops","sub-3000 pricing"],
    undefined,
    ["https://snitch.co.in/knit-blazer"],
    ["https://snitch.co.in/knit-blazer?utm_source=fb&utm_campaign=formals_apr"],
    98),
  p("zudio-tee-pack", "zudio", "apparel-casual", "Crew Neck T-Shirt — 3 Pack",
    "₹699", ["100% cotton","every-occasion","Tata-backed","budget pricing"],
    undefined,
    ["https://zudio.com/tee-3pack"],
    ["https://zudio.com/tee-3pack?utm_source=fb&utm_campaign=basics_apr"],
    234),

  // Lenskart (2)
  p("lenskart-air-clip-on", "lenskart", "eyewear-optical", "Lenskart AIR Clip-On Sunglasses",
    "₹999", ["clip-on UV","BLU-cut compatible","ultra-light","30-day returns"],
    undefined,
    ["https://lenskart.com/air-clip-on"],
    ["https://lenskart.com/air-clip-on?utm_source=fb&utm_campaign=eyewear_summer"],
    142),
  p("lenskart-vincent-chase", "lenskart", "eyewear-sunglasses", "Vincent Chase Polarized Aviators",
    "₹1,499", ["polarized","UV400","stainless-steel","carry case included"],
    "Free Eye Test",
    ["https://lenskart.com/vincent-chase-aviator"],
    ["https://lenskart.com/vincent-chase-aviator?utm_source=ig&utm_campaign=summer_shades"],
    187),

  // BlueStone + CaratLane (2)
  p("bluestone-pendant", "bluestone", "jewellery-gold", "Adorable Heart 18kt Gold Pendant",
    "₹12,999", ["18kt gold","BIS-hallmarked","try-at-home","30-day returns"],
    undefined,
    ["https://bluestone.com/adorable-heart-pendant"],
    ["https://bluestone.com/adorable-heart-pendant?utm_source=fb&utm_campaign=gifting"],
    52),
  p("caratlane-stud-earrings", "caratlane", "diamond", "Solitaire Diamond Stud Earrings",
    "₹18,999", ["IGI-certified","18kt gold","Tanishq-backed","lifetime exchange"],
    "10% OFF First Order",
    ["https://caratlane.com/solitaire-studs"],
    ["https://caratlane.com/solitaire-studs?utm_source=fb&utm_campaign=anniversary"],
    78),

  // Pepperfry + Urban Ladder (2)
  p("pepperfry-recliner", "pepperfry", "furniture-sofa", "Mark 3-Seater Recliner Sofa",
    "₹49,999", ["3-seater","manual recliner","leatherette","2-year warranty"],
    "20% OFF Festive",
    ["https://pepperfry.com/mark-recliner"],
    ["https://pepperfry.com/mark-recliner?utm_source=fb&utm_campaign=festive_furniture"],
    34),
  p("urban-ladder-dining", "urban-ladder", "furniture-sofa", "Diner 6-Seater Dining Table Set",
    "₹52,999", ["solid sheesham","6-seater","includes chairs","assembly included"],
    undefined,
    ["https://urbanladder.com/diner-6-seater"],
    ["https://urbanladder.com/diner-6-seater?utm_source=fb&utm_campaign=dining_apr"],
    27),

  // Damensch + XYXX (2)
  p("damensch-bamboo-trunks", "damensch", "innerwear", "Bamboo Modal Trunks Pack of 3",
    "₹1,199", ["bamboo modal","odor-resistant","sweat-wicking","tag-free"],
    "Buy 5 ₹1,899",
    ["https://damensch.com/bamboo-trunks-3pack"],
    ["https://damensch.com/bamboo-trunks-3pack?utm_source=fb&utm_campaign=mens_basics"],
    123),
  p("xyxx-intellisoft-tee", "xyxx", "innerwear", "IntelliSoft Crew Vest Pack of 3",
    "₹999", ["intellisoft fabric","anti-bacterial","tag-free","streetwear-inspired"],
    undefined,
    ["https://xyxxcrew.com/intellisoft-vest"],
    ["https://xyxxcrew.com/intellisoft-vest?utm_source=fb&utm_campaign=mens_essentials"],
    87),

  // Country Delight + Licious (2)
  p("country-delight-a2", "country-delight", "wellness", "A2 Cow Milk Daily Subscription",
    "₹89/L", ["A2 milk","farm-direct","daily delivery","glass bottle option"],
    "First Week Free",
    ["https://countrydelight.in/a2-milk"],
    ["https://countrydelight.in/a2-milk?utm_source=fb&utm_campaign=daily_milk"],
    98),
  p("licious-chicken-curry", "licious", "wellness", "Chicken Curry Cut — 1kg",
    "₹449", ["antibiotic-free","slaughterhouse-to-doorstep","2hr delivery","fresh-cut"],
    undefined,
    ["https://licious.in/chicken-curry-cut"],
    ["https://licious.in/chicken-curry-cut?utm_source=fb&utm_campaign=fresh_meat"],
    142),

  // Mokobara + Uppercase (2)
  p("mokobara-cabin", "mokobara", "travel-bags", "The Em Cabin Hard-Shell Suitcase",
    "₹14,499", ["aerospace polycarbonate","10-yr warranty","Hinomoto wheels","modular tracker"],
    undefined,
    ["https://mokobara.com/em-cabin"],
    ["https://mokobara.com/em-cabin?utm_source=fb&utm_campaign=travel_premium"],
    47),
  p("uppercase-ranger", "uppercase", "travel-bags", "Ranger 55 Cabin Trolley",
    "₹3,999", ["100% recycled","TSA-lock","Japanese wheels","lifetime warranty"],
    "10% OFF Plus Free Pouch",
    ["https://uppercase.in/ranger-55"],
    ["https://uppercase.in/ranger-55?utm_source=fb&utm_campaign=travel_value"],
    62),

  // FabIndia + BIBA + W (3)
  p("fabindia-cotton-kurta", "fabindia", "apparel-ethnic", "Handloom Cotton Kurta",
    "₹2,199", ["handloom cotton","artisan-made","conscious craft","50+ years legacy"],
    undefined,
    ["https://fabindia.com/handloom-kurta"],
    ["https://fabindia.com/handloom-kurta?utm_source=fb&utm_campaign=ethnic_summer"],
    98),
  p("biba-anarkali", "biba", "apparel-ethnic", "Floral Print Anarkali Suit Set",
    "₹3,499", ["wedding wear","plus-size inclusive","embroidered","includes dupatta"],
    "30% OFF Festive",
    ["https://biba.in/anarkali-suit"],
    ["https://biba.in/anarkali-suit?utm_source=fb&utm_campaign=festive_ethnic"],
    142),
  p("w-fusion-tunic", "w-for-woman", "apparel-ethnic", "Fusion Wear Tunic & Pant Set",
    "₹2,799", ["fusion wear","easy-care fabrics","work-to-weekend","modern Indian"],
    undefined,
    ["https://wforwoman.com/fusion-tunic"],
    ["https://wforwoman.com/fusion-tunic?utm_source=fb&utm_campaign=fusion_office"],
    87),

  // Boult + pTron (2)
  p("boult-zenith", "boult", "wireless-earbuds", "Zenith TWS with 48hr Battery",
    "₹1,299", ["48hr playtime","Pro+ ENC","BT 5.3","made for India"],
    undefined,
    ["https://boultaudio.com/zenith"],
    ["https://boultaudio.com/zenith?utm_source=fb&utm_campaign=audio_value"],
    143),
  p("ptron-bassbuds", "ptron", "wireless-earbuds", "Bassbuds Indi TWS",
    "₹699", ["budget-friendly","20hr battery","BT 5.0","IPX4"],
    undefined,
    ["https://ptron.in/bassbuds-indi"],
    ["https://ptron.in/bassbuds-indi?utm_source=fb&utm_campaign=value_tws"],
    87),

  // Foxtale + Tira (2)
  p("foxtale-niacinamide", "foxtale", "skin-care", "Niacinamide + Hyaluronic Daily Serum",
    "₹599", ["dermatologist-approved","Indian skin formulated","minimal routine"],
    undefined,
    ["https://foxtale.in/niacinamide-ha"],
    ["https://foxtale.in/niacinamide-ha?utm_source=fb&utm_campaign=skin_basics"],
    78),
  p("tira-charlotte", "tira", "makeup-face", "Charlotte Tilbury Hollywood Filter (Tira-exclusive)",
    "₹4,999", ["luxury complexion","Reliance-backed","Tira-exclusive shade"],
    undefined,
    ["https://tirabeauty.com/charlotte-hollywood"],
    ["https://tirabeauty.com/charlotte-hollywood?utm_source=ig&utm_campaign=luxury_glow"],
    34),
];

/* ───────── Lookup helpers — preserved from the original mocks/products.ts ───────── */

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}

/* ─── Variants — A-12.42 SKU-level distinctions ──────────────────── *
 * Curated variants for ~12 popular products. Most products keep
 * `variants` undefined; only ones below have meaningful SKU diversity.
 * ─────────────────────────────────────────────────────────────────── */
const VARIANTS_BY_PRODUCT: Record<string, Variant[]> = {
  "mamaearth-onion-shampoo": [
    { id: "v-mh-onion-100", name: "100 ml", sku: "ME-ONS-100", price: "₹199", size: "100ml" },
    { id: "v-mh-onion-250", name: "250 ml", sku: "ME-ONS-250", price: "₹349", size: "250ml" },
    { id: "v-mh-onion-500", name: "500 ml", sku: "ME-ONS-500", price: "₹599", size: "500ml" },
  ],
  "mamaearth-vc-facewash": [
    { id: "v-mh-vc-100", name: "100 ml", sku: "ME-VCF-100", price: "₹249", size: "100ml" },
    { id: "v-mh-vc-200", name: "200 ml", sku: "ME-VCF-200", price: "₹399", size: "200ml" },
  ],
  "plum-vc-serum": [
    { id: "v-plum-vc-15", name: "15 ml", sku: "PLM-VCS-15", price: "₹525", size: "15ml" },
    { id: "v-plum-vc-30", name: "30 ml", sku: "PLM-VCS-30", price: "₹875", size: "30ml" },
  ],
  "boat-airdopes-161": [
    { id: "v-boat-161-blk", name: "Active Black", sku: "BT-AD161-BK", price: "₹999", color: "Black" },
    { id: "v-boat-161-wht", name: "Pearl White", sku: "BT-AD161-WH", price: "₹999", color: "White" },
    { id: "v-boat-161-blu", name: "Bold Blue", sku: "BT-AD161-BL", price: "₹999", color: "Blue" },
    { id: "v-boat-161-red", name: "Hot Red", sku: "BT-AD161-RD", price: "₹999", color: "Red" },
  ],
  "noise-colorfit-pro-5": [
    { id: "v-noise-cfp5-jb", name: "Jet Black", sku: "NS-CFP5-JB", price: "₹2299", color: "Black" },
    { id: "v-noise-cfp5-rg", name: "Rose Gold", sku: "NS-CFP5-RG", price: "₹2499", color: "Rose Gold" },
    { id: "v-noise-cfp5-sg", name: "Silver Grey", sku: "NS-CFP5-SG", price: "₹2299", color: "Silver" },
  ],
  "sleepyhead-original-mattress": [
    { id: "v-sh-orig-s", name: "Single", sku: "SH-OM-S", price: "₹13,999", size: "Single" },
    { id: "v-sh-orig-q", name: "Queen", sku: "SH-OM-Q", price: "₹19,999", size: "Queen" },
    { id: "v-sh-orig-k", name: "King", sku: "SH-OM-K", price: "₹24,999", size: "King" },
  ],
  "sugar-matte-lipstick": [
    { id: "v-sg-mt-01", name: "Brown Sugar", sku: "SG-ML-01", price: "₹499", color: "Brown" },
    { id: "v-sg-mt-02", name: "Cherry Tomato", sku: "SG-ML-02", price: "₹499", color: "Red" },
    { id: "v-sg-mt-03", name: "Plum Punch", sku: "SG-ML-03", price: "₹499", color: "Plum" },
    { id: "v-sg-mt-04", name: "Nude Rose", sku: "SG-ML-04", price: "₹499", color: "Nude" },
  ],
  "yoga-bar-protein-bar": [
    { id: "v-yb-pb-choco", name: "Chocolate Brownie · 6 pack", sku: "YB-PB-CB-6", price: "₹399" },
    { id: "v-yb-pb-peanut", name: "Peanut Butter · 6 pack", sku: "YB-PB-PB-6", price: "₹399" },
    { id: "v-yb-pb-mix", name: "Mixed flavors · 12 pack", sku: "YB-PB-MX-12", price: "₹749" },
  ],
  "wow-apple-cider-shampoo": [
    { id: "v-wow-acs-200", name: "200 ml", sku: "WOW-ACS-200", price: "₹299", size: "200ml" },
    { id: "v-wow-acs-300", name: "300 ml", sku: "WOW-ACS-300", price: "₹399", size: "300ml" },
  ],
  "lenskart-air-flex": [
    { id: "v-lk-af-blk", name: "Matte Black", sku: "LK-AF-BK", price: "₹1,999", color: "Black" },
    { id: "v-lk-af-tor", name: "Tortoise", sku: "LK-AF-TR", price: "₹1,999", color: "Tortoise" },
    { id: "v-lk-af-grd", name: "Gradient Blue", sku: "LK-AF-GB", price: "₹2,199", color: "Blue" },
  ],
  "bluestone-everyday-ring": [
    { id: "v-bs-er-14k", name: "14K Gold", sku: "BS-ER-14K", price: "₹14,500" },
    { id: "v-bs-er-18k", name: "18K Gold", sku: "BS-ER-18K", price: "₹19,800" },
    { id: "v-bs-er-pl", name: "Platinum", sku: "BS-ER-PL", price: "₹24,500" },
  ],
  "kapiva-himalayan-shilajit": [
    { id: "v-kp-shi-15", name: "15 g", sku: "KP-SHI-15", price: "₹699", size: "15g" },
    { id: "v-kp-shi-30", name: "30 g", sku: "KP-SHI-30", price: "₹1,199", size: "30g" },
  ],
};

/** Final products export — base seed augmented with variants where curated. */
export const products: Product[] = _baseProducts.map((p) =>
  VARIANTS_BY_PRODUCT[p.id] ? { ...p, variants: VARIANTS_BY_PRODUCT[p.id] } : p,
);

export function productsForBrand(brandId: string) {
  return products.filter((p) => p.brandId === brandId);
}

/** Iter-6 A-9 — lookup by category, used by Affiliate Ad mode + KB. */
export function productsForCategory(categoryId: string) {
  return products.filter((p) => p.categoryId === categoryId);
}
