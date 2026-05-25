import type { Brand } from "@/genie6/types/entities";

/**
 * Brands — single source of truth (Catalogue ↔ Genie sync).
 *
 * Iter-6 A-9 expansion: from 7 entries → 55+ entries spanning the Indian DTC
 * + global SaaS/D2C landscape. Real brands we plausibly run ads for. No
 * generic filler ("Brand 1 / Acme / Demo Corp") — quality matters per
 * design system §6.
 *
 * Logos: `https://www.google.com/s2/favicons?sz=128&domain=…` (free, no key).
 * Colors are best-effort brand-accurate. `categoryIds` references the
 * shared categories file.
 *
 * Schema matches `Brand` from `@/genie6/types/entities`:
 *   id, name, domain, logo, category, categoryIds, tone, fonts, colors,
 *   voice, usps, competitors, productIds
 */

// Compact builder — keeps each entry to ~6-8 lines without sacrificing fields.
const b = (
  id: string,
  name: string,
  domain: string,
  category: string,
  categoryIds: string[],
  voice: string,
  colors: string[],
  usps: string[],
  competitors: string[] = [],
  productIds: string[] = []
): Brand => ({
  id,
  name,
  domain,
  logo: `https://www.google.com/s2/favicons?sz=128&domain=${domain}`,
  category,
  categoryIds,
  tone: voice,
  fonts: { display: "Geist", body: "Geist" },
  colors,
  voice,
  usps,
  competitors,
  productIds,
});

export const brands: Brand[] = [
  // Personal care & beauty (DTC)
  b("mamaearth",      "Mamaearth",      "mamaearth.in",          "Personal care",   ["hair-care","skin-care","baby-care","body-care"],         "Honest, mom-friendly, no jargon",          ["#2D5F3F","#F4E4C8","#F8F8F8"], ["plant-based","toxin-free","dermatologist-tested","MadeSafe certified"], ["wow-skin-science","plum","the-derma-co"], ["mamaearth-onion-shampoo","mamaearth-onion-conditioner","mamaearth-vc-facewash","mamaearth-biotin-gummy"]),
  b("wow-skin-science","WOW Skin Science","buywow.in",            "Personal care",   ["hair-care","skin-care","body-care"],                     "Direct, ingredient-first, science-leaning", ["#1D3557","#F1FAEE","#A8DADC"], ["paraben-free","sulfate-free","apple-cider-vinegar","activated-charcoal"], ["mamaearth","plum"], ["wow-acv-shampoo","wow-vc-serum"]),
  b("plum",           "Plum Goodness",  "plumgoodness.com",      "Personal care",   ["skin-care","hair-care","body-care"],                     "Vegan, friendly, vibrant",                  ["#7B2CBF","#FFFFFF","#F8B500"], ["100% vegan","cruelty-free","planet-positive packaging"], ["mamaearth","mcaffeine"], ["plum-gh-serum","plum-niacinamide"]),
  b("mcaffeine",      "mCaffeine",      "mcaffeine.com",         "Personal care",   ["skin-care","mens-grooming","body-care"],                 "Caffeine-fueled, energetic, urban",         ["#3B2718","#D4A574","#FFFFFF"], ["caffeine-infused","cruelty-free","FDA-approved"], ["plum","wow-skin-science"], ["mcaffeine-coffee-bodyscrub"]),
  b("the-derma-co",   "The Derma Co.",  "thedermaco.com",        "Personal care",   ["skin-care","acne","pigmentation","anti-aging"],          "Clinical, dermatologist-led, claims-first",  ["#0D3B66","#FFFFFF","#F95738"], ["dermatologist-formulated","clinically-tested","FDA-grade actives"], ["minimalist","plum"], ["dermaco-1-niacinamide"]),
  b("minimalist",     "Minimalist",     "beminimalist.co",       "Personal care",   ["skin-care","anti-aging","pigmentation"],                 "Honest, science-first, transparent",        ["#000000","#FFFFFF","#E0E0E0"], ["transparent ingredients","clinically-validated","no marketing fluff"], ["the-derma-co","plum"], ["minimalist-niacinamide-10","minimalist-vit-c-16"]),
  b("foxtale",        "Foxtale",        "foxtale.in",            "Personal care",   ["skin-care","sunscreen","acne"],                          "Confident, modern Indian skincare",         ["#FF6B6B","#FFFFFF","#1A1A1A"], ["dermatologist-approved","Indian skin formulated","minimal routine"], ["the-derma-co","minimalist"], []),
  b("myglamm",        "MyGlamm",        "myglamm.com",           "Beauty",          ["makeup","makeup-lip","makeup-eye","makeup-face"],        "Bold, glamorous, Insta-ready",              ["#FF1493","#000000","#FFFFFF"], ["vegan makeup","cruelty-free","celeb-collabs (Manish Malhotra)"], ["sugar","nykaa"], []),
  b("sugar",          "SUGAR Cosmetics","sugarcosmetics.com",    "Beauty",          ["makeup","makeup-lip","makeup-eye","makeup-face"],        "Sharp, witty, unapologetic",                ["#FF3D5C","#000000","#FFFFFF"], ["mat finish","100% vegan","cruelty-free","made for Indian skin"], ["myglamm","nykaa"], []),
  b("nykaa",          "Nykaa",          "nykaa.com",             "Beauty platform", ["makeup","skin-care","fragrance","jewellery-gold"],       "Editorial, trustworthy, premium-curated",   ["#FF3F6C","#FFFFFF","#000000"], ["1500+ brands","beauty + fashion + wellness","trusted reviews"], ["myglamm","tira","purplle"], []),
  b("purplle",        "Purplle",        "purplle.com",           "Beauty platform", ["makeup","skin-care","fragrance"],                        "Mass-friendly, value-led, gen-Z",           ["#80138C","#FFFFFF","#F4F4F4"], ["mass beauty","price-conscious","wide assortment"], ["nykaa","myglamm"], []),
  b("tira",           "Tira",           "tirabeauty.com",        "Beauty platform", ["makeup","skin-care","fragrance"],                        "Premium, curated, cinematic",               ["#000000","#FFFFFF","#D4AF37"], ["luxury beauty","Reliance-backed","curated edits"], ["nykaa","sephora-india"], []),
  b("bombay-shaving-co","Bombay Shaving Co.","bombayshavingcompany.com","Mens grooming",["mens-grooming","beard-care","personal-hygiene"],       "Crafted, premium, no-nonsense",             ["#000000","#D4A574","#FFFFFF"], ["6-blade razor","sandalwood post-shave","India-first"], ["beardo","ustraa"], []),
  b("beardo",         "Beardo",         "beardo.in",             "Mens grooming",   ["mens-grooming","beard-care","personal-hygiene"],         "Bold, masculine, witty",                    ["#000000","#FFD700","#FFFFFF"], ["beard oil + balm","made for Indian beards","Hrithik-endorsed"], ["bombay-shaving-co","ustraa"], []),
  b("ustraa",         "USTRAA",         "ustraa.com",            "Mens grooming",   ["mens-grooming","beard-care","fragrance"],                "Direct, value-led, masculine",              ["#1A1A1A","#FF6B00","#FFFFFF"], ["chemical-free","cooling de-tan","ammonia-free hair color"], ["beardo","bombay-shaving-co"], []),

  // Wearable tech & audio
  b("noise",          "Noise",          "gonoise.com",           "Wearable tech",   ["smartwatches","wireless-earbuds","fitness-trackers","gaming-headsets"], "Sharp, energetic, Gen-Z confident",         ["#000000","#FF3D00","#FFFFFF"], ["AMOLED display","100+ sport modes","Bluetooth calling","made in India"], ["boat","fire-boltt"], ["noise-colorfit-pro-5","noise-airwave-max-2"]),
  b("boat",           "boAt",           "boat-lifestyle.com",    "Wearable tech",   ["wireless-earbuds","bluetooth-speakers","gaming-headsets","smartwatches"], "Loud, fun, lifestyle-driven",               ["#FF6F00","#000000","#FFFFFF"], ["plush bass","ENx tech","lightweight","ASAP charge"], ["noise","fire-boltt"], ["boat-airdopes-141"]),
  b("fire-boltt",     "Fire-Boltt",     "fireboltt.com",         "Wearable tech",   ["smartwatches","fitness-trackers"],                       "Performance-led, sporty, value",            ["#E63946","#000000","#FFFFFF"], ["AI voice assistant","BT calling","large display","budget-tier"], ["noise","boat"], []),
  b("boult",          "Boult Audio",    "boultaudio.com",        "Wearable tech",   ["wireless-earbuds","bluetooth-speakers"],                 "Immersive, bass-first",                     ["#000000","#00C2FF","#FFFFFF"], ["pro+ ENC","48hr battery","made for India"], ["boat","ptron"], []),
  b("ptron",          "pTron",          "ptron.in",              "Wearable tech",   ["wireless-earbuds","bluetooth-speakers","fitness-trackers"], "Affordable tech, no-fluff",                 ["#0066CC","#FFFFFF","#000000"], ["budget-friendly","wide range","fast shipping"], ["boult","boat"], []),

  // Sleep & wellness
  b("sleepyhead",     "Sleepyhead",     "sleepyhead.in",         "Sleep",           ["mattresses","pillows","bedding"],                        "Calm, scientific, sleep-obsessed",          ["#1A535C","#F7B801","#FFFFFF"], ["100-night trial","memory foam","made in India","CertiPUR-US"], ["wakefit","the-sleep-company"], ["sleepyhead-original-mattress"]),
  b("wakefit",        "Wakefit",        "wakefit.co",            "Sleep",           ["mattresses","pillows","bedding","furniture-bed"],        "Friendly, affordable, sleep-first",         ["#FF6F00","#FFFFFF","#1A1A1A"], ["100-night trial","ortho-curve","cooling gel","D2C pricing"], ["sleepyhead","the-sleep-company"], []),
  b("the-sleep-company","The Sleep Company","thesleepcompany.in", "Sleep",           ["mattresses","pillows","furniture-bed"],                  "Premium, science-backed, ortho-led",        ["#003566","#FFD60A","#FFFFFF"], ["SmartGRID tech","ortho-recommended","100-night trial"], ["sleepyhead","wakefit"], []),
  b("centuary",       "Centuary",       "centuaryindia.com",     "Sleep",           ["mattresses","pillows"],                                  "Trusted, heritage Indian sleep brand",      ["#003049","#D62828","#FFFFFF"], ["50+ years legacy","ortho-back-care","trusted by hospitals"], ["wakefit","sleepyhead"], []),
  b("yoga-bar",       "Yoga Bar",       "yogabars.in",           "Wellness",        ["wellness","vitamins"],                                   "Honest, plant-led, real-food",              ["#52B788","#1B4332","#FFFFFF"], ["20g protein","clean ingredients","no maltitol","real food"], ["myprotein","oziva"], []),
  b("oziva",          "OZiva",          "oziva.in",              "Wellness",        ["wellness","vitamins","probiotics"],                      "Plant-based, women-led wellness",           ["#06A77D","#FFFFFF","#1A1A1A"], ["plant protein","ayurvedic","DGCA-certified"], ["yoga-bar","kapiva"], []),
  b("kapiva",         "Kapiva",         "kapiva.in",             "Wellness",        ["wellness","vitamins","hair-care","skin-care"],           "Ayurvedic, ancient, modern delivery",       ["#1B5E20","#FBC02D","#FFFFFF"], ["pure ayurveda","farm-to-bottle","traditional formulas"], ["dabur","oziva"], []),

  // Fashion & apparel
  b("bewakoof",       "Bewakoof",       "bewakoof.com",          "Fashion",         ["streetwear","apparel-casual","footwear-formal"],         "Quirky, witty, gen-Z streetwear",           ["#FFC400","#000000","#FFFFFF"], ["pop-culture prints","budget-friendly","wide size range"], ["souled-store","snitch"], ["bewakoof-anime-tee"]),
  b("souled-store",   "The Souled Store","thesouledstore.com",   "Fashion",         ["streetwear","apparel-casual"],                           "Pop-culture-driven, fan-first",             ["#000000","#FFFFFF","#FF1744"], ["official Marvel/DC license","character merch","unisex"], ["bewakoof","redwolf"], []),
  b("snitch",         "Snitch",         "snitch.co.in",          "Fashion",         ["streetwear","apparel-casual","apparel-formal"],          "Modern menswear, fast-fashion premium",     ["#000000","#D4AF37","#FFFFFF"], ["weekly drops","slim-fit","sub-1500 pricing"], ["bewakoof","celio"], []),
  b("zudio",          "Zudio",          "zudio.com",             "Fashion",         ["streetwear","apparel-casual","sneakers"],                "Fast-fashion, value, accessible",           ["#FFC107","#000000","#FFFFFF"], ["Tata-backed","budget pricing","every-occasion staples"], ["bewakoof","westside"], []),
  b("fabindia",       "FabIndia",       "fabindia.com",          "Fashion",         ["apparel-ethnic","apparel-casual","furniture-sofa"],      "Heritage, handloom, conscious",             ["#8B4513","#F5E6D3","#FFFFFF"], ["handloom","artisan-made","conscious craft","heritage Indian"], ["biba","w-for-woman"], []),
  b("biba",           "BIBA",           "biba.in",               "Fashion",         ["apparel-ethnic"],                                        "Festive, contemporary Indian wear",         ["#C71585","#FFD700","#FFFFFF"], ["wide ethnic range","wedding wear","plus-size inclusive"], ["fabindia","w-for-woman"], []),
  b("w-for-woman",    "W for Woman",    "wforwoman.com",         "Fashion",         ["apparel-ethnic","apparel-casual"],                       "Modern Indian woman, fusion wear",          ["#9C27B0","#FFFFFF","#000000"], ["fusion wear","easy-care fabrics","work-to-weekend"], ["fabindia","biba"], []),
  b("westside",       "Westside",       "westside.com",          "Fashion",         ["apparel-casual","apparel-formal","apparel-ethnic"],      "Tata-backed, modern Indian retail",         ["#000000","#FFD700","#FFFFFF"], ["Tata Group","SoCh / LOV","family-shopping"], ["zudio","pantaloons"], []),
  b("jockey",         "Jockey India",   "jockey.in",             "Fashion",         ["innerwear","sleepwear","activewear"],                    "Comfort-first, trusted heritage",           ["#1976D2","#FFFFFF","#000000"], ["100% cotton","tag-free","global trust"], ["damensch","xyxx"], []),
  b("damensch",       "DaMensch",       "damensch.com",          "Fashion",         ["innerwear","sleepwear"],                                 "Modern men's essentials",                   ["#1A1A1A","#00BFA5","#FFFFFF"], ["bamboo modal","odor-resistant","sweat-wicking"], ["jockey","xyxx"], []),
  b("xyxx",           "XYXX",           "xyxxcrew.com",          "Fashion",         ["innerwear","sleepwear","activewear"],                    "Performance-meets-fashion menswear",        ["#000000","#1DE9B6","#FFFFFF"], ["intellisoft fabric","anti-bacterial","streetwear-inspired"], ["damensch","jockey"], []),

  // Footwear
  b("campus",         "Campus Activewear","campusshoes.com",     "Footwear",        ["sneakers","sandals","activewear"],                       "Affordable performance footwear",           ["#FF1744","#000000","#FFFFFF"], ["lightweight","India-first sizing","sub-2000 pricing"], ["puma-india","reebok"], []),
  b("bata",           "Bata India",     "bata.in",               "Footwear",        ["footwear-formal","sneakers","sandals"],                  "Heritage everyday footwear",                ["#FF1744","#FFFFFF","#000000"], ["100+ years","wide assortment","family-shopping"], ["liberty","relaxo"], []),
  b("relaxo",         "Relaxo",         "relaxofootwear.com",    "Footwear",        ["sandals","sneakers"],                                    "Mass-market, value-driven",                 ["#0277BD","#FFFFFF","#000000"], ["wide assortment","budget pricing","durable"], ["bata","liberty"], []),

  // Eyewear & jewellery
  b("lenskart",       "Lenskart",       "lenskart.com",          "Eyewear",         ["eyewear-optical","eyewear-sunglasses"],                  "Tech-led, premium eyewear retail",          ["#00B5BD","#FFFFFF","#000000"], ["3D try-on","BLU-cut lenses","home eye check","free returns"], ["titan-eye-plus","john-jacobs"], ["lenskart-air-clip-on"]),
  b("john-jacobs",    "John Jacobs",    "johnjacobs.com",        "Eyewear",         ["eyewear-optical","eyewear-sunglasses"],                  "Premium, designer eyewear",                 ["#000000","#D4AF37","#FFFFFF"], ["premium frames","designer-led","Lenskart-owned"], ["lenskart","ray-ban-india"], []),
  b("titan-eye-plus", "Titan Eye+",     "titaneyeplus.com",      "Eyewear",         ["eyewear-optical","eyewear-sunglasses"],                  "Trusted retail, family eyecare",            ["#000000","#E91E63","#FFFFFF"], ["Tata-backed","800+ stores","comprehensive eye care"], ["lenskart","specsmakers"], []),
  b("bluestone",      "BlueStone",      "bluestone.com",         "Jewellery",       ["jewellery-gold","jewellery-silver","diamond"],           "Modern, contemporary fine jewellery",       ["#0277BD","#FFFFFF","#FFD700"], ["BIS-hallmarked","30-day returns","try-at-home"], ["caratlane","tanishq"], []),
  b("caratlane",      "CaratLane",      "caratlane.com",         "Jewellery",       ["jewellery-gold","jewellery-silver","diamond","lab-diamond"], "Tanishq-backed contemporary jewellery",     ["#000000","#FFD700","#FFFFFF"], ["IGI-certified","Tanishq-backed","wide design library"], ["bluestone","tanishq"], []),
  b("aukera",         "Aukera",         "aukera.in",             "Jewellery",       ["lab-diamond","diamond"],                                 "Lab-grown, ethical luxury",                 ["#000000","#D4AF37","#FFFFFF"], ["lab-grown","ethical","same brilliance, lower price"], ["caratlane","bluestone"], []),

  // Furniture & home
  b("pepperfry",      "Pepperfry",      "pepperfry.com",         "Furniture",       ["furniture-sofa","furniture-bed","decor","kitchen-appliances"], "Wide-assortment online furniture",          ["#FF6B35","#FFFFFF","#000000"], ["7000+ designs","studios across India","easy assembly"], ["urban-ladder","wakefit"], []),
  b("urban-ladder",   "Urban Ladder",   "urbanladder.com",       "Furniture",       ["furniture-sofa","furniture-bed","decor"],                "Premium, design-forward",                   ["#000000","#E91E63","#FFFFFF"], ["original designs","showroom + online","assembly included"], ["pepperfry","ikea-india"], []),
  b("home-centre",    "Home Centre",    "homecentre.in",         "Furniture",       ["furniture-sofa","furniture-bed","decor","kitchen-appliances"], "Modern home, accessible luxury",            ["#1A1A1A","#FFD700","#FFFFFF"], ["Landmark Group","contemporary collections","family-friendly"], ["pepperfry","urban-ladder"], []),

  // Pet
  b("supertails",     "Supertails",     "supertails.com",        "Pet care",        ["pet-care","pet-food"],                                   "Pet-parent-first, full-stack",              ["#FFC107","#000000","#FFFFFF"], ["vet-on-call","pet meds","food + grooming"], ["heads-up-for-tails","pet-station"], []),
  b("heads-up-for-tails","Heads Up For Tails","headsupfortails.com","Pet care",     ["pet-care","pet-food"],                                   "Premium pet lifestyle",                     ["#000000","#FF1744","#FFFFFF"], ["custom collars","grooming spa","luxury treats"], ["supertails"], []),

  // Travel
  b("mokobara",       "Mokobara",       "mokobara.com",          "Travel",          ["travel-bags"],                                           "Modern, premium luggage",                   ["#000000","#D4AF37","#FFFFFF"], ["10-yr warranty","aerospace-grade polycarbonate","modular tracker"], ["uppercase","american-tourister"], []),
  b("uppercase",      "Uppercase",      "uppercase.in",          "Travel",          ["travel-bags"],                                           "Sustainable, modern luggage",               ["#1A1A1A","#1DE9B6","#FFFFFF"], ["100% recycled materials","made-to-last","lifetime warranty"], ["mokobara","american-tourister"], []),

  // Food / D2C
  b("country-delight","Country Delight","countrydelight.in",     "Food",            ["wellness"],                                              "Pure, farm-fresh, daily delivery",          ["#388E3C","#FFFFFF","#FFD600"], ["A2 milk","farm-direct","daily delivery"], ["mr-milkman","milkbasket"], []),
  b("licious",        "Licious",        "licious.in",            "Food",            ["wellness"],                                              "Premium fresh meat & seafood",              ["#E11D48","#000000","#FFFFFF"], ["antibiotic-free","slaughterhouse-to-doorstep","2hr delivery"], ["fresh-to-home","tendercuts"], []),

  // Big Indian conglomerates / family aggregators
  b("mensa-brands",   "Mensa Brands",   "mensabrands.com",       "Aggregator",      ["apparel-casual","wellness","skin-care","hair-care"],     "House of D2C brands",                       ["#000000","#FFC107","#FFFFFF"], ["50+ brands","tech-enabled scale","data-driven"], ["good-glamm","goat-brand-labs"], []),
  b("good-glamm",     "Good Glamm Group","goodglammgroup.com",   "Aggregator",      ["makeup","skin-care","hair-care","makeup-lip"],           "House of beauty brands",                    ["#FF1493","#000000","#FFFFFF"], ["MyGlamm + Sirona + others","content-led","womens-focused"], ["mensa-brands","nykaa"], []),

  // Global SaaS / tech (for comparison demos)
  b("notion",         "Notion",         "notion.so",             "SaaS",            ["wellness"],                                              "Tools for clear thinking",                  ["#000000","#FFFFFF","#999999"], ["all-in-one workspace","blocks-based","AI built-in"], ["coda","clickup"], []),
  b("figma",          "Figma",          "figma.com",             "SaaS",            ["wellness"],                                              "Design tools for the multiplayer web",      ["#0ACF83","#A259FF","#1ABCFE"], ["multiplayer design","dev-mode handoff","Figma AI"], ["sketch","framer"], []),
];

/* ───────── Lookup helper — preserved from the original mocks/brands.ts ───────── */
export function getBrand(id: string) {
  return brands.find((b) => b.id === id);
}
