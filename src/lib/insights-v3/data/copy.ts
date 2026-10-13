/**
 * Copy bank for the dummy universe. All names, brands and domains are fictional.
 * Direct-response copy is assembled from a per-category descriptor + a per-theme
 * pack, so a hook, headline, angle and landing page always match the ad's category.
 */
import type { CategoryId, FrameworkElementKey, FunnelType, IndustryId, Platform } from "../types";

export type ThemeId =
  | "insurance" | "home" | "finance" | "legal" | "benefits" | "career"
  | "nutra" | "telehealth" | "ecom" | "arb" | "lifestyle";

/** Per-category descriptor. */
export interface CatDesc {
  /** audience, plural ("drivers") */
  a: string;
  /** problem, noun phrase */
  p: string;
  /** outcome, base verb phrase ("pay less for car insurance") */
  o: string;
  /** product, noun phrase without article */
  pr: string;
  /** 3–4 topic tags (TOPIC_TAG_RULE: lowercase, no brands, no countries) */
  k: string[];
  /** Theme when the industry doesn't force one. */
  th: ThemeId;
}

export const CAT_DESC: Record<CategoryId, CatDesc> = {
  // ── insurance ──
  "auto-insurance": { a: "drivers", p: "rising car insurance premiums", o: "pay less for car insurance", pr: "auto insurance quotes", k: ["auto insurance", "car insurance quote", "drivers", "save money"], th: "insurance" },
  "health-insurance": { a: "families", p: "health plans that cost too much", o: "find an affordable health plan", pr: "low-cost health plans", k: ["health insurance", "families", "low premiums", "aca plans"], th: "insurance" },
  "life-insurance": { a: "parents over 40", p: "leaving your family unprotected", o: "lock in life cover for less", pr: "term life cover", k: ["life insurance", "term life", "parents", "family protection"], th: "insurance" },
  medicare: { a: "seniors on Medicare", p: "missing out on plan benefits", o: "get more from your Medicare plan", pr: "Medicare Advantage plans", k: ["medicare", "seniors", "dental and vision", "plan benefits"], th: "insurance" },
  "home-and-property-insurance": { a: "homeowners", p: "overpriced home insurance", o: "cut your home insurance bill", pr: "home insurance quotes", k: ["home insurance", "homeowners", "property cover", "save money"], th: "insurance" },
  "insurance-other": { a: "pet owners", p: "surprise vet bills", o: "cover vet bills for less", pr: "pet insurance plans", k: ["pet insurance", "pet owners", "vet bills"], th: "insurance" },
  insurance: { a: "renters", p: "paying for cover you don't need", o: "compare cover in minutes", pr: "insurance comparison", k: ["insurance", "renters", "compare quotes"], th: "insurance" },
  "home-and-auto-warranty": { a: "homeowners", p: "expensive appliance repairs", o: "stop paying for surprise repairs", pr: "home warranty plans", k: ["home warranty", "homeowners", "appliance repair", "car warranty"], th: "insurance" },

  // ── home + energy ──
  solar: { a: "homeowners", p: "sky-high electric bills", o: "go solar with no upfront cost", pr: "solar panel installs", k: ["solar", "homeowners", "electric bill", "solar incentives"], th: "home" },
  roofing: { a: "homeowners", p: "storm damage on your roof", o: "get a new roof for less", pr: "free roof inspections", k: ["roofing", "roof replacement", "homeowners", "storm damage"], th: "home" },
  "hvac-and-plumbing": { a: "homeowners", p: "an old furnace eating your budget", o: "upgrade your heating and cooling", pr: "HVAC replacement", k: ["hvac", "heat pump", "homeowners", "energy rebates"], th: "home" },
  "home-services": { a: "busy homeowners", p: "unreliable contractors", o: "book a trusted local pro", pr: "vetted local pros", k: ["home services", "local contractors", "homeowners"], th: "home" },
  "local-clinics-and-healthcare": { a: "adults over 50", p: "long waits for a specialist", o: "see a specialist this week", pr: "local clinic appointments", k: ["local clinic", "specialist", "adults over 50", "free screening"], th: "home" },
  "legal-and-permits": { a: "small business owners", p: "permit paperwork piling up", o: "get your permits sorted fast", pr: "permit filing help", k: ["permits", "small business", "filing service"], th: "home" },
  automotive: { a: "car owners", p: "costly dealership servicing", o: "keep your car running for less", pr: "auto service plans", k: ["car owners", "auto repair", "vehicle service"], th: "home" },

  // ── finance ──
  "loans-and-mortgage": { a: "homeowners", p: "a high mortgage rate", o: "lower your monthly mortgage payment", pr: "refinance offers", k: ["mortgage", "refinance", "homeowners", "lower payments"], th: "finance" },
  "debt-and-tax-relief": { a: "Americans with debt", p: "credit card debt that won't shrink", o: "cut what you owe", pr: "debt relief programs", k: ["debt relief", "credit card debt", "tax relief", "lower payments"], th: "finance" },
  "real-estate": { a: "first-time buyers", p: "being priced out of the market", o: "buy a home with less down", pr: "low down payment loans", k: ["real estate", "first-time buyers", "home loans"], th: "finance" },
  "banking-and-finance": { a: "savers", p: "money sitting in a low-interest account", o: "grow your savings faster", pr: "high-yield accounts", k: ["high-yield savings", "savers", "banking", "interest rates"], th: "finance" },
  "finance-and-fintech": { a: "young professionals", p: "losing track of your spending", o: "take control of your money", pr: "budgeting app", k: ["budgeting app", "personal finance", "fintech"], th: "finance" },
  "crypto-and-trading": { a: "new traders", p: "guessing at the market", o: "trade with a proven system", pr: "trading course", k: ["trading", "crypto", "new investors", "trading signals"], th: "career" },

  // ── legal + benefits ──
  "legal-and-mass-tort": { a: "injury victims", p: "being underpaid after an accident", o: "claim the compensation you're owed", pr: "free case reviews", k: ["personal injury", "compensation", "free case review", "lawsuit"], th: "legal" },
  "government-and-senior-benefits": { a: "seniors over 65", p: "benefits you never claimed", o: "claim your unused benefits", pr: "benefit eligibility check", k: ["seniors", "senior benefits", "grocery allowance", "eligibility"], th: "benefits" },
  sweepstakes: { a: "shoppers", p: "paying full price", o: "win a $750 gift card", pr: "gift card giveaway", k: ["gift card", "giveaway", "shoppers", "rewards"], th: "benefits" },
  "surveys-and-rewards": { a: "people at home", p: "spare time that earns nothing", o: "get paid for quick surveys", pr: "paid survey rewards", k: ["paid surveys", "rewards", "side income"], th: "benefits" },
  "competitions-and-raffles": { a: "dream car fans", p: "never winning anything", o: "win a dream car this month", pr: "prize draw entries", k: ["prize draw", "competition", "raffle"], th: "benefits" },

  // ── career + business ──
  "make-money-bizopp": { a: "stay-at-home parents", p: "living paycheck to paycheck", o: "earn from home on your schedule", pr: "home income system", k: ["make money online", "side income", "work from home"], th: "career" },
  "education-and-courses": { a: "career switchers", p: "being stuck in a dead-end job", o: "get certified in weeks", pr: "online certificate courses", k: ["online courses", "certification", "career change"], th: "career" },
  "jobs-and-recruiting": { a: "job seekers", p: "applications that go nowhere", o: "land a better-paying job", pr: "local hiring events", k: ["jobs", "hiring now", "job seekers", "warehouse jobs"], th: "career" },
  "b2b-saas": { a: "sales teams", p: "leads slipping through the cracks", o: "book more meetings on autopilot", pr: "sales automation software", k: ["sales automation", "crm", "b2b", "lead generation"], th: "career" },
  "business-and-coaching": { a: "agency owners", p: "inconsistent client flow", o: "sign clients every week", pr: "client acquisition coaching", k: ["business coaching", "agency owners", "client acquisition"], th: "career" },
  saas: { a: "small teams", p: "juggling too many tools", o: "run your team from one dashboard", pr: "project management app", k: ["project management", "small teams", "productivity software"], th: "career" },
  "ai-and-digital-products": { a: "creators", p: "spending hours on content", o: "create a week of content in an hour", pr: "AI writing assistant", k: ["ai tools", "content creation", "creators"], th: "career" },

  // ── nutra (VSL) ──
  "weight-loss": { a: "women over 40", p: "stubborn belly fat", o: "lose weight without dieting", pr: "metabolism formula", k: ["weight loss", "belly fat", "women over 40", "metabolism"], th: "nutra" },
  "blood-sugar-diabetes": { a: "adults over 50", p: "unstable blood sugar", o: "keep blood sugar in a healthy range", pr: "blood sugar support formula", k: ["blood sugar", "diabetes", "adults over 50", "supplement"], th: "nutra" },
  "brain-and-memory": { a: "seniors", p: "brain fog and forgetfulness", o: "sharpen your memory", pr: "memory support capsules", k: ["memory", "brain fog", "seniors", "focus"], th: "nutra" },
  "hearing-and-tinnitus": { a: "adults over 55", p: "constant ringing in your ears", o: "quiet the ringing for good", pr: "tinnitus relief formula", k: ["tinnitus", "hearing", "ringing ears", "supplement"], th: "nutra" },
  vision: { a: "adults over 50", p: "blurry, tired eyes", o: "support clearer vision", pr: "eye health formula", k: ["vision", "eye health", "adults over 50"], th: "nutra" },
  prostate: { a: "men over 50", p: "waking up to pee every night", o: "sleep through the night again", pr: "prostate support formula", k: ["prostate", "men over 50", "frequent urination", "supplement"], th: "nutra" },
  dental: { a: "adults with sensitive teeth", p: "receding gums", o: "rebuild healthier gums", pr: "oral probiotic", k: ["gum health", "dental", "oral probiotic"], th: "nutra" },
  "joint-and-back-pain": { a: "seniors", p: "aching knees and back pain", o: "move without joint pain", pr: "joint relief formula", k: ["joint pain", "back pain", "seniors", "mobility"], th: "nutra" },
  "skin-and-anti-aging": { a: "women over 45", p: "fine lines and sagging skin", o: "look years younger", pr: "collagen serum", k: ["anti-aging", "wrinkles", "women over 45", "collagen"], th: "nutra" },
  "nail-and-fungus": { a: "adults", p: "yellow, brittle toenails", o: "get clear, healthy nails", pr: "nail fungus treatment", k: ["nail fungus", "toenails", "foot care"], th: "nutra" },
  "hair-growth": { a: "men and women", p: "thinning hair", o: "regrow fuller hair", pr: "hair growth formula", k: ["hair loss", "thinning hair", "hair growth"], th: "nutra" },
  "mens-health": { a: "men over 40", p: "low energy and drive", o: "feel like yourself again", pr: "men's vitality formula", k: ["men over 40", "energy", "vitality", "supplement"], th: "nutra" },
  "womens-health": { a: "women in menopause", p: "hot flashes and mood swings", o: "ease menopause symptoms", pr: "menopause support", k: ["menopause", "hot flashes", "women over 45"], th: "nutra" },
  "gut-and-detox": { a: "adults", p: "bloating after every meal", o: "flatten a bloated belly", pr: "gut health formula", k: ["gut health", "bloating", "probiotic", "digestion"], th: "nutra" },
  "heart-and-blood-pressure": { a: "adults over 50", p: "high blood pressure readings", o: "support healthy blood pressure", pr: "heart health formula", k: ["blood pressure", "heart health", "adults over 50"], th: "nutra" },
  "sleep-and-anxiety": { a: "restless sleepers", p: "lying awake at 3 a.m.", o: "fall asleep faster", pr: "natural sleep aid", k: ["sleep", "insomnia", "anxiety", "natural sleep aid"], th: "nutra" },
  "survival-and-self-defense": { a: "families", p: "being unprepared for an emergency", o: "keep your family safe in a crisis", pr: "emergency preparedness guide", k: ["survival", "emergency kit", "preparedness"], th: "lifestyle" },
  "relationships-and-manifestation": { a: "women over 30", p: "a relationship that went cold", o: "bring the spark back", pr: "relationship guide", k: ["relationships", "dating advice", "manifestation"], th: "lifestyle" },
  pets: { a: "dog owners", p: "an itchy, uncomfortable dog", o: "give your dog relief", pr: "dog allergy chews", k: ["dog owners", "dog allergies", "pet health"], th: "lifestyle" },
  other: { a: "adults", p: "everyday aches and low energy", o: "feel better every day", pr: "daily wellness formula", k: ["wellness", "daily supplement", "energy"], th: "nutra" },

  // ── telehealth ──
  "glp-1": { a: "adults ready to lose weight", p: "diets that never stick", o: "start GLP-1 treatment online", pr: "GLP-1 program", k: ["glp-1", "weight loss", "online prescription", "semaglutide"], th: "telehealth" },
  "longevity-and-nad": { a: "adults over 40", p: "slowing down with age", o: "boost your energy at the cell level", pr: "NAD+ injections", k: ["nad+", "longevity", "energy", "healthy aging"], th: "telehealth" },
  "labs-and-diagnostics": { a: "health-conscious adults", p: "guessing about your health", o: "check 80+ biomarkers from home", pr: "at-home blood test", k: ["blood test", "biomarkers", "at-home lab"], th: "telehealth" },
  ed: { a: "men", p: "performance worries", o: "get ED treatment discreetly", pr: "online ED treatment", k: ["ed treatment", "men's health", "discreet delivery"], th: "telehealth" },
  trt: { a: "men over 35", p: "low testosterone", o: "restore your testosterone", pr: "testosterone therapy", k: ["trt", "low testosterone", "men over 35"], th: "telehealth" },
  hrt: { a: "women in perimenopause", p: "hormone swings", o: "balance your hormones", pr: "hormone therapy", k: ["hrt", "perimenopause", "hormone balance"], th: "telehealth" },
  "mental-health": { a: "busy adults", p: "anxiety that won't let up", o: "talk to a licensed therapist this week", pr: "online therapy", k: ["online therapy", "anxiety", "mental health"], th: "telehealth" },
  "skin-and-derm": { a: "adults with acne", p: "breakouts that won't clear", o: "get a custom prescription skincare plan", pr: "online dermatology", k: ["acne", "dermatology", "prescription skincare"], th: "telehealth" },
  "hair-loss": { a: "men", p: "a receding hairline", o: "stop hair loss early", pr: "prescription hair loss treatment", k: ["hair loss", "receding hairline", "prescription treatment"], th: "telehealth" },
  sleep: { a: "light sleepers", p: "waking up tired", o: "sleep deeper every night", pr: "sleep support", k: ["sleep", "deep sleep", "sleep quality"], th: "telehealth" },
  "primary-care": { a: "busy families", p: "waiting weeks to see a doctor", o: "see a doctor today from your phone", pr: "online doctor visits", k: ["online doctor", "primary care", "virtual visit"], th: "telehealth" },

  // ── e-commerce ──
  "general-merchandise": { a: "online shoppers", p: "overpaying at big-box stores", o: "save on everyday essentials", pr: "everyday essentials", k: ["deals", "home essentials", "online shopping"], th: "ecom" },
  apparel: { a: "women", p: "clothes that never fit right", o: "find clothes that actually fit", pr: "everyday wardrobe staples", k: ["womens clothing", "wardrobe staples", "comfortable fit"], th: "ecom" },
  nutrition: { a: "gym-goers", p: "protein shakes that taste chalky", o: "hit your protein goal daily", pr: "clean protein powder", k: ["protein powder", "nutrition", "gym", "clean ingredients"], th: "ecom" },
  beauty: { a: "skincare lovers", p: "dull, uneven skin", o: "get glowing skin in a week", pr: "vitamin C serum", k: ["skincare", "serum", "glowing skin"], th: "ecom" },
  pet: { a: "cat owners", p: "litter that smells", o: "keep your home odour-free", pr: "self-cleaning litter box", k: ["cat owners", "litter box", "pet products"], th: "ecom" },
  gifts: { a: "gift shoppers", p: "last-minute gift panic", o: "find a gift they'll love", pr: "personalised gifts", k: ["gifts", "personalised gifts", "gift ideas"], th: "ecom" },
  fitness: { a: "home workout fans", p: "a cluttered home gym", o: "train anywhere in 20 minutes", pr: "compact home gym kit", k: ["home workout", "fitness gear", "resistance bands"], th: "ecom" },
  "viral-products": { a: "online shoppers", p: "gadgets that break in a week", o: "get the gadget everyone's talking about", pr: "viral gadget", k: ["viral gadget", "trending products", "online shopping"], th: "ecom" },
  "home-decor": { a: "renters", p: "a home that feels bland", o: "make your space feel new", pr: "statement decor", k: ["home decor", "renters", "interior design"], th: "ecom" },
  electronics: { a: "commuters", p: "earbuds that die mid-commute", o: "get all-day battery life", pr: "wireless earbuds", k: ["wireless earbuds", "electronics", "battery life"], th: "ecom" },
  outdoor: { a: "campers", p: "heavy, bulky gear", o: "pack lighter for every trip", pr: "ultralight camping gear", k: ["camping", "outdoor gear", "hiking"], th: "ecom" },
  "bags-and-accessories": { a: "travellers", p: "bags that fall apart", o: "carry everything in one bag", pr: "everyday travel backpack", k: ["backpack", "travel bag", "accessories"], th: "ecom" },
  shoes: { a: "people on their feet all day", p: "sore feet by noon", o: "stay comfortable all day", pr: "cushioned walking shoes", k: ["walking shoes", "foot pain", "comfortable shoes"], th: "ecom" },
  kitchen: { a: "home cooks", p: "dinner taking forever", o: "cook dinner in 15 minutes", pr: "multi-cooker", k: ["kitchen gadget", "home cooks", "air fryer"], th: "ecom" },
  "hair-care": { a: "women with frizzy hair", p: "frizz and heat damage", o: "get salon-smooth hair at home", pr: "ionic hair styler", k: ["hair care", "frizzy hair", "hair styler"], th: "ecom" },
  fragrance: { a: "fragrance lovers", p: "designer scents at designer prices", o: "smell expensive for less", pr: "inspired fragrances", k: ["fragrance", "perfume", "inspired scents"], th: "ecom" },
  "baby-and-kids": { a: "new parents", p: "sleepless nights with a newborn", o: "help your baby sleep longer", pr: "baby sleep sack", k: ["new parents", "baby sleep", "baby products"], th: "ecom" },
  watches: { a: "men", p: "watches that cost a fortune", o: "wear a classic watch for less", pr: "minimalist watches", k: ["watches", "minimalist watch", "mens accessories"], th: "ecom" },
  "home-and-garden": { a: "gardeners", p: "a patchy, tired lawn", o: "grow a greener lawn", pr: "smart garden kit", k: ["gardening", "lawn care", "garden tools"], th: "ecom" },
  "arts-and-crafts": { a: "crafters", p: "projects that never get finished", o: "finish a craft project this weekend", pr: "diy craft kits", k: ["crafts", "diy kits", "hobbies"], th: "ecom" },
  "tools-and-hardware": { a: "diy fans", p: "the wrong tool for the job", o: "fix anything around the house", pr: "cordless tool kit", k: ["power tools", "diy", "tool kit"], th: "ecom" },
  "home-organizers": { a: "busy families", p: "cluttered closets", o: "organise any room in an afternoon", pr: "stackable organisers", k: ["home organisation", "storage", "decluttering"], th: "ecom" },
  "automotive-accessories": { a: "drivers", p: "a messy car interior", o: "keep your car spotless", pr: "car organiser set", k: ["car accessories", "drivers", "car cleaning"], th: "ecom" },
  cleaning: { a: "busy households", p: "scrubbing for hours", o: "clean the whole house in half the time", pr: "cordless spin scrubber", k: ["cleaning", "spin scrubber", "home cleaning"], th: "ecom" },
  "musical-instruments": { a: "adult beginners", p: "giving up on learning music", o: "play your first song this week", pr: "smart keyboard", k: ["learn piano", "beginners", "music"], th: "ecom" },
  "toys-and-games": { a: "parents", p: "screen time battles", o: "keep kids busy without screens", pr: "STEM building toys", k: ["toys", "stem toys", "parents"], th: "ecom" },
  "books-and-info-products": { a: "aspiring authors", p: "a book idea that never gets written", o: "publish your first book", pr: "self-publishing guide", k: ["self-publishing", "ebook", "writing"], th: "ecom" },
  "health-devices": { a: "people with neck pain", p: "a stiff neck from desk work", o: "relieve neck tension at home", pr: "neck massager", k: ["neck pain", "massager", "health device"], th: "ecom" },
  "astrology-and-psychics": { a: "spiritual seekers", p: "feeling lost about what's next", o: "get a reading tonight", pr: "personal psychic reading", k: ["astrology", "psychic reading", "birth chart"], th: "lifestyle" },
  "pest-control": { a: "homeowners", p: "mice in the walls", o: "keep pests out humanely", pr: "ultrasonic pest repeller", k: ["pest control", "mice", "homeowners"], th: "ecom" },
  "sexual-wellness": { a: "couples", p: "a routine that went flat", o: "reconnect as a couple", pr: "couples wellness kit", k: ["couples", "wellness", "intimacy"], th: "ecom" },
  jewelry: { a: "women", p: "jewellery that tarnishes", o: "wear fine jewellery every day", pr: "gold vermeil jewellery", k: ["jewellery", "gold vermeil", "gifts for her"], th: "ecom" },
  "demi-fine-and-fashion": { a: "women", p: "costume pieces that turn green", o: "build a demi-fine jewellery stack", pr: "demi-fine jewellery", k: ["demi-fine jewellery", "waterproof jewellery", "everyday stack"], th: "ecom" },

  // ── search arb ──
  "search-arbitrage": { a: "searchers", p: "too many options to compare", o: "compare current offers", pr: "comparison results", k: ["compare offers", "deals", "search results"], th: "arb" },
  native: { a: "readers", p: "missing out on discounts", o: "see what's on offer near you", pr: "sponsored listings", k: ["discounts", "local offers", "seniors"], th: "arb" },
  "shopping-content": { a: "shoppers", p: "overpaying online", o: "find today's price drops", pr: "shopping guides", k: ["price drops", "shopping guide", "deals"], th: "arb" },
  "article-pages": { a: "seniors", p: "discounts nobody tells you about", o: "unlock senior discounts", pr: "discount guides", k: ["senior discounts", "seniors", "savings guide"], th: "arb" },

  // ── lifestyle / others ──
  "dance-and-fitness": { a: "beginners", p: "boring workouts", o: "dance your way fit at home", pr: "online dance classes", k: ["dance workout", "beginners", "home fitness"], th: "lifestyle" },
  "app-installs": { a: "puzzle fans", p: "boring commutes", o: "play free puzzles offline", pr: "puzzle game app", k: ["mobile game", "puzzle game", "free to play"], th: "lifestyle" },
  gaming: { a: "strategy gamers", p: "games that feel pay-to-win", o: "build an empire for free", pr: "strategy game", k: ["strategy game", "free to play", "gamers"], th: "lifestyle" },
  travel: { a: "weekend travellers", p: "overpriced flights", o: "fly for less this season", pr: "flight deal alerts", k: ["cheap flights", "travel deals", "weekend trips"], th: "lifestyle" },
  dating: { a: "singles over 40", p: "endless swiping", o: "meet someone who gets you", pr: "dating app", k: ["dating", "singles over 40", "relationships"], th: "lifestyle" },
  "advocacy-and-non-profit": { a: "animal lovers", p: "shelter animals with no home", o: "help a rescue dog today", pr: "monthly donation", k: ["animal rescue", "donation", "non-profit"], th: "lifestyle" },
  "events-and-tickets": { a: "music fans", p: "sold-out shows", o: "get tickets before they're gone", pr: "presale tickets", k: ["concert tickets", "presale", "live music"], th: "lifestyle" },
  "news-and-media": { a: "busy readers", p: "news overload", o: "get the news in five minutes", pr: "daily news briefing", k: ["newsletter", "daily briefing", "news"], th: "lifestyle" },
  "food-and-dining": { a: "busy families", p: "takeout costs adding up", o: "eat well for less every week", pr: "meal kit", k: ["meal kit", "healthy meals", "busy families"], th: "lifestyle" },
  "entertainment-and-streaming": { a: "movie lovers", p: "paying for five streaming apps", o: "stream more for less", pr: "streaming bundle", k: ["streaming", "movies", "tv shows"], th: "lifestyle" },
};

/** Generic fallback (never expected to be used; keeps the generator total). */
export function descFor(categoryId: CategoryId, label: string): CatDesc {
  return (
    CAT_DESC[categoryId] ?? {
      a: "shoppers",
      p: `overpaying for ${label.toLowerCase()}`,
      o: `save on ${label.toLowerCase()}`,
      pr: label.toLowerCase(),
      k: [label.toLowerCase(), "deals", "save money"],
      th: "lifestyle",
    }
  );
}

/** Theme decided by industry first, then by the category descriptor. */
export function themeFor(industryId: IndustryId, categoryId: CategoryId, label: string): ThemeId {
  if (industryId === "telehealth") return "telehealth";
  if (industryId === "search-arb") return "arb";
  if (industryId === "e-commerce") return CAT_DESC[categoryId]?.th === "lifestyle" ? "lifestyle" : "ecom";
  const d = descFor(categoryId, label);
  if (industryId === "vsl") return d.th === "telehealth" ? "nutra" : d.th;
  if (industryId === "lead-gen" && categoryId === "other") return "home";
  return d.th === "nutra" ? "lifestyle" : d.th;
}

/* ── Theme packs ────────────────────────────────────────────────────────── */

export interface ThemePack {
  experts: string[];
  offers: string[];
  ctaLabels: Record<string, number>;
  ctaTexts: string[];
  frameworks: Record<string, number>;
  hooks: Record<string, number>;
  videoConcepts: Record<string, number>;
  imageConcepts: Record<string, number>;
  funnels: Partial<Record<FunnelType, number>>;
  videoShare: number;
  bodies: string[];
  headlines: string[];
  pagePrefixes: string[];
  pageSuffixes: string[];
  domainStems: string[];
  tlds: string[];
  offerStems: string[];
  countries: Record<string, number>;
  platforms: Partial<Record<Platform, number>>;
  extraTags: string[];
}

const US_HEAVY = { US: 80, CA: 6, GB: 4, AU: 3, PR: 1 };
const GLOBAL_EN = { US: 55, GB: 12, CA: 10, AU: 8, NZ: 2, IE: 2, DE: 3, FR: 2, IN: 2, AE: 2, SG: 1, ZA: 1 };

export const THEMES: Record<ThemeId, ThemePack> = {
  insurance: {
    experts: ["licensed agent", "former insurance adjuster", "consumer savings expert"],
    offers: ["free quote in under 2 minutes", "no obligation, no spam calls", "rates from $29/month", "compare 10+ carriers at once"],
    ctaLabels: { "Get Quote": 5, "Learn More": 4, "Check Eligibility": 2, "Apply Now": 1 },
    ctaTexts: ["Tap the button below to see your rate.", "Click Get Quote and compare in two minutes.", "Enter your zip code to see what you qualify for.", "Check your rate now. It's free."],
    frameworks: { pas: 4, aida: 4, "problem-solution": 4, "direct-offer": 3, "curiosity-loop": 2, listicle: 2, testimonial: 1, other: 1 },
    hooks: { "shock-stat": 4, callout: 5, "curiosity-question": 3, "offer-led": 3, warning: 2, "problem-question": 3, authority: 2, "myth-busting": 1, "listicle-opener": 1 },
    videoConcepts: { "ugc-selfie": 4, "talking-head-expert": 4, "street-interview": 2, "news-editorial-style": 2, "ai-avatar": 2, "screen-recording-demo": 2, slideshow: 1 },
    imageConcepts: { "google-native-search": 3, "native-screenshot": 3, "comparison-card": 3, "offer-and-scarcity": 2, "news-editorial": 2, "warning-alert": 2, "text-message-chat": 1, "checklist-tips": 1 },
    funnels: { "lead-form": 6, quiz: 4, advertorial: 2 },
    videoShare: 0.4,
    bodies: [
      "Answer a few quick questions and compare rates from carriers in your area.",
      "Most {a} haven't compared rates in years, and they're paying for it.",
      "It takes less than two minutes and there's no obligation to buy.",
      "Rates changed this month. If you haven't checked yours, you could be overpaying.",
    ],
    headlines: ["{O} — {offer}", "{A}: Compare Rates in 2 Minutes", "See If You Qualify to {O}", "New {year} Rates for {A}", "How {A} {O} This Year"],
    pagePrefixes: ["Smart", "Clear", "Safe", "Prime", "Bright", "Harbor", "Summit", "True", "Easy", "Shield"],
    pageSuffixes: ["Rate Finder", "Cover", "Quote Hub", "Coverage Center", "Policy Savers", "Insurance Help"],
    domainStems: ["ratefinder", "coverhub", "quotesaver", "policyhelp", "coverwise", "ratecheck"],
    tlds: [".com", ".com", ".co", ".net"],
    offerStems: ["quotecompare-portal", "ratematch-direct", "coverage-checkout", "policyquote-center"],
    countries: { US: 92, PR: 2, CA: 3 },
    platforms: { "Facebook & Instagram": 8, YouTube: 2, TikTok: 1 },
    extraTags: ["free quote", "compare rates", "lower premiums"],
  },
  home: {
    experts: ["local contractor", "energy auditor", "home inspector"],
    offers: ["free in-home estimate", "$0 down options", "up to 30% back in incentives", "same-week appointments"],
    ctaLabels: { "Learn More": 4, "Get Quote": 4, "Book Now": 2, "Check Eligibility": 2 },
    ctaTexts: ["Tap below to book your free estimate.", "Enter your address to check eligibility.", "Click Learn More to see if your home qualifies."],
    frameworks: { pas: 3, aida: 4, "problem-solution": 4, bab: 3, "direct-offer": 2, testimonial: 2, listicle: 1 },
    hooks: { callout: 5, "shock-stat": 3, "offer-led": 3, "before-after": 3, "problem-question": 3, authority: 2, "curiosity-question": 2 },
    videoConcepts: { "ugc-selfie": 3, "documentary-b-roll": 3, "talking-head-expert": 3, "product-demo": 2, testimonial: 2, "news-editorial-style": 1 },
    imageConcepts: { "before-after": 4, "lifestyle-photo": 3, "comparison-card": 2, "offer-and-scarcity": 2, "infographic-chart": 2, "news-editorial": 1, "proof-results": 2 },
    funnels: { "lead-form": 6, quiz: 3, advertorial: 1 },
    videoShare: 0.45,
    bodies: [
      "Local {a} are taking advantage of new incentives before they change.",
      "A quick check tells you what you qualify for, with no pressure.",
      "Our vetted pros handle everything from permits to install.",
    ],
    headlines: ["{O} — {offer}", "{A}: Check Your Eligibility", "{year} Incentives for {A}", "Is Your Home Eligible? Find Out in 60 Seconds"],
    pagePrefixes: ["Sun", "Bright", "Keystone", "Evergreen", "Northside", "Liberty", "Peak", "Homestead", "Cardinal", "Ridge"],
    pageSuffixes: ["Energy", "Home Pros", "Roofing Co", "Solar Savings", "Comfort Air", "Home Services"],
    domainStems: ["homeprosnow", "solarsavingscheck", "roofquote", "comfortair", "energyrebates", "homefixdirect"],
    tlds: [".com", ".com", ".co", ".us"],
    offerStems: ["homeestimate-direct", "energyquote-portal", "install-booking"],
    countries: { US: 90, CA: 6, AU: 4 },
    platforms: { "Facebook & Instagram": 8, YouTube: 2 },
    extraTags: ["homeowners", "free estimate", "incentives"],
  },
  finance: {
    experts: ["former bank manager", "certified financial counsellor", "mortgage broker"],
    offers: ["no impact on your credit score", "free consultation", "approval in minutes", "rates from 4.9% APR"],
    ctaLabels: { "Learn More": 5, "Apply Now": 4, "Check Eligibility": 3, "Get Quote": 1 },
    ctaTexts: ["Tap to check your options. It won't affect your credit.", "Click Apply Now to see your rate.", "Find out what you qualify for in under a minute."],
    frameworks: { pas: 5, aida: 3, "problem-solution": 3, bab: 2, "direct-offer": 2, "curiosity-loop": 2, "star-story-solution": 1 },
    hooks: { "shock-stat": 4, "problem-question": 4, callout: 3, "personal-story": 2, warning: 2, "myth-busting": 2, authority: 2 },
    videoConcepts: { "talking-head-expert": 4, "ugc-selfie": 3, "animation-motion-graphics": 2, "news-editorial-style": 2, "screen-recording-demo": 2, "podcast-clip": 1 },
    imageConcepts: { "infographic-chart": 3, "comparison-card": 3, "native-screenshot": 2, "text-message-chat": 2, "proof-results": 2, "news-editorial": 2, "warning-alert": 1 },
    funnels: { "lead-form": 5, quiz: 4, advertorial: 2 },
    videoShare: 0.4,
    bodies: [
      "Thousands of {a} have already used this to {o}.",
      "Checking your options takes a minute and won't touch your credit score.",
      "Rates are moving. Locking in now could save you real money every month.",
    ],
    headlines: ["{O} — {offer}", "{A}: See What You Qualify For", "How {A} {O}", "The {year} Guide to {PR}"],
    pagePrefixes: ["Clear", "Freedom", "Northstar", "Ledger", "Anchor", "Pinnacle", "Beacon", "Compass"],
    pageSuffixes: ["Financial", "Debt Help", "Lending", "Money", "Relief Center", "Savings"],
    domainStems: ["debtfreedomnow", "ratequote", "lendmatch", "reliefcheck", "moneywise", "savingsrate"],
    tlds: [".com", ".com", ".co", ".net"],
    offerStems: ["loanmatch-direct", "relief-application", "rate-portal"],
    countries: US_HEAVY,
    platforms: { "Facebook & Instagram": 8, YouTube: 2, X: 1 },
    extraTags: ["lower payments", "free consultation", "personal finance"],
  },
  legal: {
    experts: ["injury attorney", "former claims adjuster"],
    offers: ["free case review", "no fee unless you win", "takes 60 seconds"],
    ctaLabels: { "Learn More": 4, "Check Eligibility": 4, "Apply Now": 1 },
    ctaTexts: ["Tap below for your free case review.", "Answer 3 questions to see if you qualify.", "Check if you're eligible. It's free."],
    frameworks: { pas: 4, "problem-solution": 3, aida: 2, testimonial: 2, "direct-offer": 2 },
    hooks: { callout: 5, warning: 3, "shock-stat": 3, "problem-question": 3, authority: 2 },
    videoConcepts: { "talking-head-expert": 5, "news-editorial-style": 3, "ai-avatar": 2, testimonial: 2 },
    imageConcepts: { "warning-alert": 4, "news-editorial": 3, "native-screenshot": 2, "checklist-tips": 2 },
    funnels: { "lead-form": 6, quiz: 4 },
    videoShare: 0.45,
    bodies: [
      "If you or a loved one was affected, you may be entitled to compensation.",
      "Most people never claim what they're owed because they don't know they can.",
    ],
    headlines: ["{O} — {offer}", "{A}: You May Qualify", "Were You Affected? Check in 60 Seconds"],
    pagePrefixes: ["Justice", "Claim", "Advocate", "Liberty"],
    pageSuffixes: ["Claim Center", "Case Review", "Legal Help"],
    domainStems: ["claimcheck", "casereviewnow", "injuryhelp"],
    tlds: [".com", ".com", ".net"],
    offerStems: ["case-intake", "claim-review-portal"],
    countries: { US: 100 },
    platforms: { "Facebook & Instagram": 8, YouTube: 2 },
    extraTags: ["free case review", "compensation", "eligibility"],
  },
  benefits: {
    experts: ["benefits counsellor", "senior advocate"],
    offers: ["check eligibility free", "takes under a minute", "no cost to apply"],
    ctaLabels: { "Check Eligibility": 5, "Learn More": 4, "Sign Up": 2 },
    ctaTexts: ["Tap below to check if you qualify.", "Enter your zip code to see your benefits.", "Claim yours before the deadline."],
    frameworks: { "curiosity-loop": 3, "direct-offer": 3, aida: 3, pas: 2, listicle: 2 },
    hooks: { callout: 5, "curiosity-question": 3, "offer-led": 3, "shock-stat": 2, warning: 2 },
    videoConcepts: { "talking-head-expert": 3, "news-editorial-style": 3, "ugc-selfie": 3, "street-interview": 2, "ai-avatar": 2 },
    imageConcepts: { "news-editorial": 3, "offer-and-scarcity": 3, "native-screenshot": 2, "text-message-chat": 2, "checklist-tips": 2, "is-it-a-scam": 1 },
    funnels: { quiz: 5, "lead-form": 4, advertorial: 2 },
    videoShare: 0.45,
    bodies: [
      "Millions of {a} qualify and have no idea.",
      "Checking takes less than a minute and there's no cost.",
      "Spots are limited each month, so don't wait.",
    ],
    headlines: ["{O} — {offer}", "{A}: Check What You Qualify For", "Did You Claim This Yet?"],
    pagePrefixes: ["Senior", "Golden", "Everyday", "Lucky", "Reward"],
    pageSuffixes: ["Benefits Desk", "Savings Center", "Rewards Club", "Giveaways"],
    domainStems: ["benefitsdesk", "seniorhelpline", "rewardsclub", "giveawayhub"],
    tlds: [".com", ".org", ".info", ".site"],
    offerStems: ["eligibility-check", "rewards-signup", "benefit-portal"],
    countries: { US: 95, CA: 5 },
    platforms: { "Facebook & Instagram": 9, YouTube: 1 },
    extraTags: ["eligibility", "seniors", "free"],
  },
  career: {
    experts: ["career coach", "former recruiter", "self-made trader", "agency founder"],
    offers: ["free 7-day trial", "free training video", "first lesson free", "join 40,000+ members"],
    ctaLabels: { "Sign Up": 4, "Learn More": 4, "Watch More": 2, "Download": 2, "Apply Now": 2 },
    ctaTexts: ["Tap below to watch the free training.", "Sign up free and start today.", "Click to grab your spot. It's free."],
    frameworks: { "star-story-solution": 3, bab: 3, aida: 3, "curiosity-loop": 3, testimonial: 2, fab: 2, pastor: 2 },
    hooks: { "personal-story": 4, "before-after": 3, "curiosity-question": 3, "shock-stat": 2, "myth-busting": 3, "listicle-opener": 2, callout: 2 },
    videoConcepts: { "ugc-selfie": 4, "screen-recording-demo": 3, "podcast-clip": 2, "talking-head-expert": 3, "reaction-duet": 2, "animation-motion-graphics": 1 },
    imageConcepts: { "proof-results": 4, "native-screenshot": 3, "iphone-note": 2, "listicle-graphic": 2, "testimonial-quote": 2, "meme-novelty": 1 },
    funnels: { "direct-vsl": 3, "lead-form": 3, quiz: 2, "product-page": 2 },
    videoShare: 0.55,
    bodies: [
      "I teach {a} exactly how to {o}, step by step.",
      "No experience needed. Most members see results in their first month.",
      "Watch the free training before it comes down.",
    ],
    headlines: ["{O} — {offer}", "How {A} {O}", "Free Training: {O}", "{n} Steps to {O}"],
    pagePrefixes: ["Launch", "Momentum", "Skill", "Remote", "Growth", "Ascend", "Signal"],
    pageSuffixes: ["Academy", "Labs", "Institute", "Hub", "Collective"],
    domainStems: ["skillacademy", "remoteincome", "growthlabs", "tradesignal", "salesflow"],
    tlds: [".com", ".io", ".co", ".academy"],
    offerStems: ["training-checkout", "members-join", "course-enroll"],
    countries: GLOBAL_EN,
    platforms: { "Facebook & Instagram": 7, YouTube: 3, TikTok: 2, LinkedIn: 1, X: 1 },
    extraTags: ["online training", "side income", "beginners"],
  },
  nutra: {
    experts: ["board-certified doctor", "nutrition researcher", "retired nurse"],
    offers: ["up to 70% off today", "180-day money-back guarantee", "free shipping on 6 bottles", "2 free bonuses with every order"],
    ctaLabels: { "Learn More": 5, "Watch More": 4, "Shop Now": 2, "Order Now": 2 },
    ctaTexts: ["Click Learn More to watch the full presentation before it's taken down.", "Tap the link below to see the short video.", "Order today while stock lasts."],
    frameworks: { pas: 4, "star-story-solution": 4, pastor: 3, "curiosity-loop": 4, testimonial: 2, bab: 1, listicle: 1 },
    hooks: { "curiosity-question": 4, "personal-story": 4, warning: 3, "shock-stat": 3, authority: 3, "myth-busting": 2, testimonial: 2, "problem-question": 2 },
    videoConcepts: { "ugc-voiceover": 3, "talking-head-expert": 4, "documentary-b-roll": 3, "news-editorial-style": 3, "animation-motion-graphics": 2, testimonial: 2, "ai-avatar": 1 },
    imageConcepts: { "news-editorial": 4, "before-after": 3, "warning-alert": 2, "credential-selfie": 3, "ugc-photo": 2, "testimonial-quote": 2, "is-it-a-scam": 1, "infographic-chart": 1 },
    funnels: { "direct-vsl": 6, advertorial: 4, quiz: 1 },
    videoShare: 0.55,
    bodies: [
      "Researchers found a simple morning ritual that helps {a} {o}.",
      "It has nothing to do with diets, pills or expensive treatments.",
      "Over {big} people have already tried it.",
      "The short presentation explains how it works, and it may not stay up long.",
    ],
    headlines: ["{O} — Watch the Video", "The {year} Trick {A} Use to {O}", "Doctors Explain How to {O}", "{A}: Try This Before Bed"],
    pagePrefixes: ["Dr. Ellison's", "Pure", "Vita", "Nature's", "Golden", "Primal", "Herbal", "Daily"],
    pageSuffixes: ["Naturals", "Wellness", "Health Labs", "Remedies", "Vitality", "Research"],
    domainStems: ["vitaflow", "purecore", "natureslab", "healthbreakthrough", "dailyvita", "goldenroot"],
    tlds: [".com", ".com", ".co", ".health", ".info"],
    offerStems: ["officialvitaorder", "secure-bottle-checkout", "orderpurecore", "getnaturesformula"],
    countries: { US: 70, CA: 8, GB: 8, AU: 8, NZ: 3, IE: 3 },
    platforms: { "Facebook & Instagram": 8, YouTube: 3, TikTok: 1 },
    extraTags: ["natural remedy", "supplement", "doctor formulated"],
  },
  telehealth: {
    experts: ["licensed physician", "nurse practitioner", "board-certified doctor"],
    offers: ["$0 first visit", "plans from $99/month", "medication shipped to your door", "100% online, no insurance needed"],
    ctaLabels: { "Get Started": 5, "Learn More": 3, "Book Now": 3, "Sign Up": 1 },
    ctaTexts: ["Take the 2-minute quiz to see if you qualify.", "Tap Get Started to talk to a provider.", "Book your online visit today."],
    frameworks: { "problem-solution": 4, aida: 3, bab: 3, testimonial: 3, pas: 2, fab: 2, "direct-offer": 2 },
    hooks: { "problem-question": 4, "before-after": 4, testimonial: 3, "offer-led": 3, authority: 3, "personal-story": 2, "myth-busting": 2 },
    videoConcepts: { "ugc-selfie": 5, testimonial: 3, "talking-head-expert": 3, "podcast-clip": 1, "reaction-duet": 1, "product-demo": 1 },
    imageConcepts: { "before-after": 4, "ugc-photo": 3, "product-photo": 3, "comparison-card": 2, "testimonial-quote": 2, "lifestyle-photo": 2, "credential-selfie": 1 },
    funnels: { quiz: 6, "lead-form": 3, "product-page": 2 },
    videoShare: 0.5,
    bodies: [
      "Answer a few questions and a licensed provider reviews your case, usually same day.",
      "No waiting rooms. Everything happens from your phone.",
      "If prescribed, your treatment ships discreetly to your door.",
    ],
    headlines: ["{O} — {offer}", "{A}: {O} From Home", "Doctor-Led {PR}", "See If You Qualify for {PR}"],
    pagePrefixes: ["Vela", "Nova", "Hale", "Kindred", "Bloom", "Onward", "Rally"],
    pageSuffixes: ["Health", "Clinic", "Care", "Rx", "Medical"],
    domainStems: ["velahealth", "novaclinic", "halecare", "bloomrx", "onwardmd"],
    tlds: [".com", ".health", ".co"],
    offerStems: ["intake-start", "patient-portal-signup", "rx-checkout"],
    countries: { US: 96, CA: 4 },
    platforms: { "Facebook & Instagram": 7, TikTok: 3, YouTube: 2, Snapchat: 1 },
    extraTags: ["online prescription", "telehealth", "licensed providers"],
  },
  ecom: {
    experts: ["product designer", "founder", "stylist"],
    offers: ["40% off today only", "free shipping over $50", "buy 2, get 1 free", "30-day free returns"],
    ctaLabels: { "Shop Now": 7, "Order Now": 2, "Learn More": 2, "Buy Now": 1 },
    ctaTexts: ["Tap Shop Now before the sale ends.", "Order today and get free shipping.", "Grab yours while stock lasts."],
    frameworks: { fab: 4, bab: 3, "direct-offer": 4, testimonial: 3, aida: 2, "problem-solution": 2, listicle: 1 },
    hooks: { "offer-led": 4, "before-after": 3, testimonial: 3, "curiosity-question": 2, "problem-question": 3, "listicle-opener": 2, "personal-story": 1 },
    videoConcepts: { "ugc-selfie": 4, "product-demo": 5, "ugc-voiceover": 3, "reaction-duet": 2, slideshow: 2, "street-interview": 1 },
    imageConcepts: { "product-photo": 5, "lifestyle-photo": 5, "before-after": 2, "offer-and-scarcity": 3, "testimonial-quote": 2, "comment-collage": 2, "ugc-photo": 2, "meme-novelty": 1 },
    funnels: { "product-page": 8, advertorial: 2, quiz: 1 },
    videoShare: 0.42,
    bodies: [
      "Made for {a} who are done with {p}.",
      "Over {big} happy customers and counting.",
      "Ships in 24 hours with free returns.",
    ],
    headlines: ["{PR} — {offer}", "{O}", "The {PR} Everyone's Talking About", "{A} Love This {PR}"],
    pagePrefixes: ["Luma", "Nook", "Wren", "Atelier", "Kova", "Maven", "Olive", "Sola", "Tide", "Fable"],
    pageSuffixes: ["Co", "Studio", "Goods", "Home", "Store", "Collective"],
    domainStems: ["lumaco", "nookhome", "wrenstudio", "kovagoods", "mavenstore", "olivejewels"],
    tlds: [".com", ".shop", ".co", ".store"],
    offerStems: [],
    countries: { US: 60, GB: 10, CA: 8, AU: 7, DE: 4, FR: 3, NL: 2, IN: 3, AE: 3 },
    platforms: { "Facebook & Instagram": 7, TikTok: 4, Pinterest: 2, YouTube: 1, Snapchat: 1 },
    extraTags: ["online shopping", "free shipping", "gift ideas"],
  },
  arb: {
    experts: ["savings editor", "consumer researcher"],
    offers: ["see current offers", "compare options in seconds", "updated daily"],
    ctaLabels: { "Learn More": 7, "See More": 3 },
    ctaTexts: ["Tap to see the full list.", "Click Learn More to compare options.", "See today's results."],
    frameworks: { listicle: 6, "curiosity-loop": 5, aida: 2, other: 2 },
    hooks: { "listicle-opener": 5, "curiosity-question": 5, callout: 3, "shock-stat": 2 },
    videoConcepts: { slideshow: 4, "documentary-b-roll": 2, "animation-motion-graphics": 2 },
    imageConcepts: { "listicle-graphic": 5, "google-native-search": 5, "native-screenshot": 3, "lifestyle-photo": 2, "news-editorial": 2 },
    funnels: { advertorial: 8, quiz: 1 },
    videoShare: 0.12,
    bodies: ["See the full list of options available right now.", "Prices and availability vary by area.", "Many {a} don't realise how much they could save."],
    headlines: ["{n} {PR} {A} Are Searching For", "{A}: {O}", "Search {PR} Near You"],
    pagePrefixes: ["Daily", "Smart", "Savvy", "Local", "Trend"],
    pageSuffixes: ["Finds", "Savings", "Search", "Guide", "Picks"],
    domainStems: ["dailyfinds", "savvysearch", "localguide", "trendpicks", "smartsavings"],
    tlds: [".com", ".info", ".site", ".online", ".xyz"],
    offerStems: [],
    countries: { US: 60, GB: 10, CA: 10, AU: 10, DE: 5, FR: 5 },
    platforms: { "Facebook & Instagram": 8, Pinterest: 1 },
    extraTags: ["search results", "compare options", "savings guide"],
  },
  lifestyle: {
    experts: ["coach", "founder", "community lead"],
    offers: ["free to join", "first month free", "download free", "limited spots this week"],
    ctaLabels: { "Learn More": 3, "Sign Up": 3, "Install Now": 3, "Download": 2, "Shop Now": 1, "Book Now": 1 },
    ctaTexts: ["Tap to join free today.", "Download free and start now.", "Sign up in 30 seconds."],
    frameworks: { aida: 3, bab: 3, "star-story-solution": 2, testimonial: 2, fab: 2, "direct-offer": 2, "curiosity-loop": 2, other: 1 },
    hooks: { "curiosity-question": 3, "personal-story": 3, callout: 3, "offer-led": 2, testimonial: 2, "before-after": 2, "listicle-opener": 1 },
    videoConcepts: { "ugc-selfie": 4, "screen-recording-demo": 3, "reaction-duet": 2, "animation-motion-graphics": 2, testimonial: 2, "street-interview": 1 },
    imageConcepts: { "lifestyle-photo": 4, "meme-novelty": 2, "ugc-photo": 3, "social-comment": 2, "ig-question-sticker": 2, "text-message-chat": 2, "offer-and-scarcity": 1 },
    funnels: { "product-page": 3, "lead-form": 3, quiz: 3, advertorial: 1 },
    videoShare: 0.5,
    bodies: ["Join {big} {a} who already did.", "It takes 30 seconds to start.", "Made for {a} who want more from their week."],
    headlines: ["{O} — {offer}", "{A}: {O}", "Why {A} Are Switching"],
    pagePrefixes: ["Kindle", "Spark", "Wander", "Rhythm", "Haven", "Echo", "Orbit"],
    pageSuffixes: ["App", "Club", "Community", "Studio", "Co"],
    domainStems: ["sparkclub", "wanderdeals", "rhythmstudio", "havenmatch", "orbitplay"],
    tlds: [".com", ".app", ".io", ".co"],
    offerStems: [],
    countries: GLOBAL_EN,
    platforms: { "Facebook & Instagram": 6, TikTok: 3, YouTube: 2, Snapchat: 1, Reddit: 1 },
    extraTags: ["free to join", "community", "mobile app"],
  },
};

/* ── Hook templates per hook style ──────────────────────────────────────── */

export const HOOK_TEMPLATES: Record<string, string[]> = {
  "curiosity-question": [
    "Why are so many {a} switching to {pr} this year?",
    "What do {a} know about {p} that you don't?",
    "Have you seen what {a} are doing about {p}?",
  ],
  "shock-stat": [
    "{pct}% of {a} are dealing with {p}, and most never fix it.",
    "Over {big} {a} have already found a way to {o}.",
  ],
  "personal-story": [
    "I spent years fighting {p}. Then my {rel} showed me this.",
    "I was {age} when I finally decided to {o}. Here's what happened.",
  ],
  callout: [
    "Attention {a}: this changes how you deal with {p}.",
    "Calling all {a} in {stName}: read this before {month} ends.",
  ],
  warning: [
    "Warning: if you're dealing with {p}, stop scrolling.",
    "Don't sign anything until you see this. {A} keep getting caught out by {p}.",
  ],
  "before-after": [
    "{days} days ago I was stuck with {p}. Today it's a different story.",
    "Day 1 vs day {days}: what happened when I tried {pr}.",
  ],
  authority: [
    "A {expert} explains how {a} can {o}.",
    "{Expert} here. This is what I tell people about {p}.",
  ],
  "offer-led": ["{Offer}, for {a} only.", "Get {pr} today: {offer}."],
  testimonial: [
    "“I didn't think it would work, but I finally {o}.” — {name}, {st}",
    "“Wish I'd done this sooner.” {name}, {age}, on how they managed to {o}.",
  ],
  "problem-question": ["Still dealing with {p}?", "Tired of {p}? There's an easier way."],
  "myth-busting": [
    "Everything you've been told about {p} is wrong.",
    "No, you don't have to live with {p}. Here's why.",
  ],
  "listicle-opener": [
    "{n} things {a} wish they knew about {p}.",
    "{n} mistakes that keep {a} stuck with {p}.",
  ],
};

/* ── Beat text per framework element ────────────────────────────────────── */

export const BEAT_TEXT: Record<FrameworkElementKey, string[]> = {
  hook: ["{hook}"],
  lead: ["Here's what nobody tells you.", "Stick with me for the next 30 seconds."],
  context: ["Most {a} don't realise this until it's too late.", "This started when {a} began comparing notes online."],
  pain: ["Living with {p} drains your time, money and confidence.", "{P} is more common than you think."],
  agitation: ["And it only gets worse the longer you wait.", "Every month you ignore it costs you more."],
  fear: ["Ignore it, and you could end up paying twice as much.", "Wait too long and the window closes."],
  curiosity_loop: ["But there's one thing that changed everything, and I'll get to it in a second.", "The answer surprised even the experts."],
  story: ["My {rel} was in the same spot last year.", "{name} from {stName} tried everything before finding this."],
  mechanism: ["It works by tackling the real cause behind {p}.", "The reason is simple once you see it."],
  solution: ["That's why {a} are turning to {pr}.", "There is a simpler way to {o}."],
  product: ["Meet {pr}.", "This is {pr}, built for {a}."],
  benefits: ["You can {o} without the hassle.", "Less stress, more money in your pocket, and results you can see."],
  demonstration: ["Watch how it works in under a minute.", "Here's exactly what it looks like."],
  social_proof: ["Over {big} {a} already use it.", "Rated 4.8 out of 5 by thousands of customers."],
  authority: ["Recommended by a {expert}.", "A {expert} reviewed it before we launched."],
  comparison: ["Compared with the old way, it's faster and cheaper.", "Unlike the alternatives, there are no hidden fees."],
  objection: ["Worried it won't work for you? Most people felt the same.", "No catch. You can cancel any time."],
  guarantee: ["Backed by a full money-back guarantee.", "Try it risk-free."],
  offer: ["Right now you can get {offer}.", "Today only: {offer}."],
  price: ["It costs less than a coffee a day.", "Plans start at just {price}."],
  bonus: ["Plus two free bonuses with your order.", "You also get a free starter guide."],
  urgency: ["This offer ends at midnight.", "Prices go up this week."],
  scarcity: ["Only a few spots left in your area.", "Stock is limited."],
  cta: ["{ctaText}"],
  disclaimer: ["Results may vary.", "Terms apply. Not available in all states."],
};

export const BEAT_VISUAL_VIDEO: Record<FrameworkElementKey, string> = {
  hook: "Creator speaks straight to camera, bold caption on screen",
  lead: "Quick zoom on the speaker's face",
  context: "B-roll of everyday life, text overlay",
  pain: "Frustrated close-up, problem shown on screen",
  agitation: "Fast cuts, red text overlay with the cost",
  fear: "Dark grade, warning icon pops in",
  curiosity_loop: "Blurred reveal with an arrow pointing off-screen",
  story: "Handheld shots of the speaker at home",
  mechanism: "Simple animated diagram",
  solution: "Bright cut to the product or service screen",
  product: "Product hero shot with logo",
  benefits: "Checklist of benefits ticking in",
  demonstration: "Hands-on demo shot",
  social_proof: "Review stars and customer comments scroll",
  authority: "Expert in a professional setting, name caption",
  comparison: "Split screen: old way vs new way",
  objection: "Speaker shrugs, FAQ-style caption",
  guarantee: "Guarantee badge animates in",
  offer: "Price slash animation with the offer",
  price: "Price card on screen",
  bonus: "Bonus items slide in",
  urgency: "Countdown timer",
  scarcity: "Low-stock bar on screen",
  cta: "End card with button and arrow",
  disclaimer: "Small print at the bottom of the frame",
};

export const BEAT_VISUAL_IMAGE: Partial<Record<FrameworkElementKey, string>> = {
  hook: "Headline text in the top third",
  pain: "Problem shown in the main image",
  solution: "Product or service in the centre",
  product: "Product shot with logo",
  benefits: "Benefit bullets on the right",
  social_proof: "Star rating badge",
  offer: "Offer banner across the bottom",
  urgency: "Deadline sticker",
  cta: "Button-style CTA at the bottom",
  comparison: "Two-column comparison",
};

/** Ordered element skeletons per framework. Trimmed/extended to 4–9 beats. */
export const FRAMEWORK_BEATS: Record<string, FrameworkElementKey[]> = {
  pas: ["hook", "pain", "agitation", "fear", "solution", "product", "benefits", "offer", "cta"],
  aida: ["hook", "context", "benefits", "social_proof", "offer", "urgency", "cta"],
  bab: ["hook", "pain", "story", "solution", "benefits", "demonstration", "offer", "cta"],
  pastor: ["hook", "pain", "agitation", "story", "mechanism", "solution", "social_proof", "offer", "cta"],
  "4ps": ["hook", "benefits", "demonstration", "social_proof", "offer", "urgency", "cta"],
  fab: ["hook", "product", "demonstration", "benefits", "price", "guarantee", "cta"],
  "star-story-solution": ["hook", "story", "pain", "curiosity_loop", "mechanism", "solution", "social_proof", "offer", "cta"],
  testimonial: ["hook", "story", "pain", "solution", "benefits", "social_proof", "cta"],
  listicle: ["hook", "lead", "benefits", "comparison", "solution", "cta"],
  "direct-offer": ["hook", "offer", "price", "bonus", "scarcity", "urgency", "cta"],
  "curiosity-loop": ["hook", "curiosity_loop", "context", "mechanism", "authority", "solution", "cta"],
  "problem-solution": ["hook", "pain", "solution", "product", "benefits", "objection", "cta"],
  other: ["hook", "context", "product", "benefits", "cta"],
};

/* ── People + places for templates ─────────────────────────────────────── */

export const FIRST_NAMES = ["Linda", "Maria", "Karen", "Denise", "Patricia", "Angela", "Sharon", "Rachel", "Tanya", "Grace", "Monica", "Brenda"];
export const RELATIONS = ["daughter", "neighbour", "sister", "close friend", "pharmacist", "doctor", "son"];
export const STATES: [string, string][] = [
  ["TX", "Texas"], ["FL", "Florida"], ["CA", "California"], ["OH", "Ohio"], ["GA", "Georgia"],
  ["AZ", "Arizona"], ["NC", "North Carolina"], ["PA", "Pennsylvania"], ["MI", "Michigan"], ["TN", "Tennessee"],
];
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/* ── Landing page copy ──────────────────────────────────────────────────── */

export const LP_TITLES: Record<FunnelType, string[]> = {
  quiz: ["Take the 60-Second Quiz: Can You {O}?", "Find Out If You Qualify in 4 Quick Questions", "{A}: Answer 3 Questions to See Your Options"],
  advertorial: ["{A} Are Rushing to {O}. Here's Why", "How One Simple Change Helps {A} {O}", "The {year} Report: {PR} Explained"],
  "direct-vsl": ["Watch: The Simple Way {A} {O}", "Free Presentation: How to {O}", "This Short Video Shows How to {O}"],
  "lead-form": ["Get Your Free {PR} Quote", "{O}: Check Your Options in 60 Seconds", "See What You Qualify For Today"],
  "product-page": ["{PR} | Free Shipping Over $50", "Shop {PR} | Official Store", "{PR} — 30-Day Free Returns"],
};

export const LP_PATHS: Record<FunnelType, string[]> = {
  quiz: ["/quiz/start", "/quiz", "/qualify", "/survey/step-1"],
  advertorial: ["/article/{slug}", "/news/{slug}", "/report/{slug}", "/story/{slug}"],
  "direct-vsl": ["/vsl/watch", "/presentation", "/watch/{slug}", "/video"],
  "lead-form": ["/get-quote", "/apply", "/check-eligibility", "/free-estimate"],
  "product-page": ["/products/{slug}", "/shop/{slug}", "/collections/{slug}"],
};

export const LP_TEXT: Record<FunnelType, string[]> = {
  quiz: [
    "Answer a few quick questions to see what you qualify for.",
    "Question 1 of 4: Which of these describes you?",
    "It takes less than 60 seconds and there is no obligation.",
    "Your answers are private and are only used to match you with options.",
  ],
  advertorial: [
    "Updated 3 days ago. More {a} are learning how to {o}, and the reason might surprise you.",
    "For years, {p} was something most people simply put up with.",
    "Then a {expert} noticed a pattern that changed how {a} think about it.",
    "Here's what we found after looking into {pr}.",
    "Readers who tried it reported real changes within weeks.",
    "Check availability below; this page may contain affiliate links.",
  ],
  "direct-vsl": [
    "Watch the full presentation below before it's taken down.",
    "In this short video, a {expert} explains the real cause of {p}.",
    "You'll see why {a} are using this to {o}.",
    "The video will play automatically. Please turn your sound on.",
  ],
  "lead-form": [
    "Enter your zip code to get started.",
    "Compare options from trusted providers in your area.",
    "{O} with a free, no-obligation quote.",
    "We respect your privacy. Your details are never sold.",
  ],
  "product-page": [
    "{PR}. Designed for {a} who are done with {p}.",
    "Free shipping on orders over $50. 30-day free returns.",
    "Rated 4.8 by thousands of customers.",
    "Add to cart and checkout in seconds.",
  ],
};

/* ── Long names (60+ chars) for truncation tests ────────────────────────── */

export const LONG_PAGE_NAMES: { name: string; industry: IndustryId; category: CategoryId }[] = [
  { name: "The Official Senior Benefits & Medicare Savings Information Center of America", industry: "lead-gen", category: "medicare" },
  { name: "Doctor Recommended Natural Joint Comfort and Mobility Support Community Page", industry: "vsl", category: "joint-and-back-pain" },
  { name: "Homeowners Across the Country Solar Savings and Energy Rebates Information Network", industry: "lead-gen", category: "solar" },
];

export const LONG_DOMAIN = "affordable-auto-insurance-quotes-for-safe-drivers-nationwide.com";
