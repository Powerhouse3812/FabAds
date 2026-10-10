/**
 * Element vocabularies (reference A §4.7, reference B §1).
 *  - frameworks:          closed list of 13
 *  - hook styles:         the open hook_type list normalised into 12 labels
 *  - angles:              grouped short angles (SHORT_ANGLE_RULE: lowercase, 2–6 words, never a framework word)
 *  - concepts:            the reference "creative format" renamed — 14 video formats + 23 image styles
 *  - framework elements:  the 25 element keys with labels
 * Every element carries a one-line description.
 */
import type { CategoryId, CreativeElement, ElementType, FrameworkElementKey, FunnelType } from "../types";
import { slugify } from "./taxonomy";

/* ── Frameworks ─────────────────────────────────────────────────────────── */

const FRAMEWORK_DEFS: [string, string, string][] = [
  ["pas", "PAS", "Problem, Agitate, Solution: name the pain, make it sting, then offer the fix."],
  ["aida", "AIDA", "Attention, Interest, Desire, Action: a classic four-step pull toward the click."],
  ["bab", "BAB", "Before, After, Bridge: show life now, life after, and the product as the bridge."],
  ["pastor", "PASTOR", "Problem, Amplify, Story, Transformation, Offer, Response: long-form sales structure."],
  ["4ps", "4Ps", "Promise, Picture, Proof, Push: a big promise backed by proof, then a nudge."],
  ["fab", "FAB", "Features, Advantages, Benefits: walks from what it is to why it matters to you."],
  ["star-story-solution", "Star-Story-Solution", "Introduces a relatable character, tells their story, then reveals the solution."],
  ["testimonial", "Testimonial", "A customer or patient tells their own result in their own words."],
  ["listicle", "Listicle", "A numbered list of reasons, signs or tips that leads into the product."],
  ["direct-offer", "Direct Offer", "Leads with the deal itself: price, discount or free trial, with little build-up."],
  ["curiosity-loop", "Curiosity Loop", "Opens a question the viewer can only close by clicking through."],
  ["problem-solution", "Problem-Solution", "States one clear problem and answers it with the product, without agitation."],
  ["other", "Other", "Structure that does not fit a named framework."],
];

export const FRAMEWORKS: CreativeElement[] = FRAMEWORK_DEFS.map(([id, label, description]) => ({
  id,
  type: "framework",
  label,
  description,
}));

/* ── Hook styles ────────────────────────────────────────────────────────── */

const HOOK_DEFS: [string, string, string][] = [
  ["curiosity-question", "Curiosity question", "Opens with a question that makes the viewer want the answer."],
  ["shock-stat", "Shock stat", "Leads with a surprising number or statistic."],
  ["personal-story", "Personal story", "Starts in the first person with a moment from the speaker's life."],
  ["callout", "Callout", "Calls out a specific audience by who they are or where they live."],
  ["warning", "Warning", "Opens with an alert or a reason to stop and pay attention."],
  ["before-after", "Before/after", "Contrasts how things were with how they are now."],
  ["authority", "Authority", "Borrows trust from an expert, doctor, agent or official source."],
  ["offer-led", "Offer-led", "Puts the price, discount or free offer in the first line."],
  ["testimonial", "Testimonial", "Opens on a customer quote or result."],
  ["problem-question", "Problem question", "Asks whether the viewer still has the problem."],
  ["myth-busting", "Myth-busting", "Challenges something the viewer believes to be true."],
  ["listicle-opener", "Listicle opener", "Opens with a numbered list promise, like five signs or three mistakes."],
];

export const HOOK_STYLES: CreativeElement[] = HOOK_DEFS.map(([id, label, description]) => ({
  id,
  type: "hook",
  label,
  description,
}));

/* ── Angles (grouped short angles) ──────────────────────────────────────── */

export interface AngleDef {
  label: string;
  /** Categories where this claim is realistic. */
  cats: CategoryId[];
}

const ANGLE_DEFS: AngleDef[] = [
  // insurance
  { label: "save money on auto insurance", cats: ["auto-insurance"] },
  { label: "insurers are overcharging you", cats: ["auto-insurance", "home-and-property-insurance", "health-insurance", "insurance-other", "insurance"] },
  { label: "extra benefits for medicare members", cats: ["medicare"] },
  { label: "low-cost health plans for families", cats: ["health-insurance", "insurance"] },
  { label: "lock in life cover early", cats: ["life-insurance", "insurance-other"] },
  { label: "cover repairs before they happen", cats: ["home-and-auto-warranty", "home-and-property-insurance", "automotive"] },
  { label: "compare quotes in minutes", cats: ["auto-insurance", "health-insurance", "life-insurance", "home-and-property-insurance", "insurance-other", "insurance", "medicare"] },
  // home + energy
  { label: "solar with no upfront cost", cats: ["solar"] },
  { label: "cut your electric bill", cats: ["solar", "hvac-and-plumbing"] },
  { label: "free roof inspection for homeowners", cats: ["roofing", "home-and-property-insurance"] },
  { label: "local pros at fair prices", cats: ["home-services", "hvac-and-plumbing", "roofing", "local-clinics-and-healthcare", "legal-and-permits", "automotive"] },
  // finance
  { label: "lower your monthly payments", cats: ["loans-and-mortgage", "debt-and-tax-relief", "banking-and-finance", "real-estate"] },
  { label: "relief from credit card debt", cats: ["debt-and-tax-relief", "banking-and-finance", "finance-and-fintech"] },
  { label: "copy the pros trading setup", cats: ["crypto-and-trading", "finance-and-fintech"] },
  // legal + benefits
  { label: "compensation for injury victims", cats: ["legal-and-mass-tort"] },
  { label: "unclaimed benefits for seniors", cats: ["government-and-senior-benefits", "medicare"] },
  { label: "free grocery allowance card", cats: ["government-and-senior-benefits", "medicare"] },
  { label: "win a gift card today", cats: ["sweepstakes", "surveys-and-rewards", "competitions-and-raffles", "advocacy-and-non-profit", "news-and-media"] },
  // career + business
  { label: "earn from home online", cats: ["make-money-bizopp", "jobs-and-recruiting", "business-and-coaching"] },
  { label: "learn in-demand skills fast", cats: ["education-and-courses", "ai-and-digital-products", "jobs-and-recruiting", "books-and-info-products"] },
  { label: "automate your sales pipeline", cats: ["b2b-saas", "saas", "business-and-coaching"] },
  // nutra (VSL)
  { label: "melt stubborn belly fat", cats: ["weight-loss", "nutrition", "fitness"] },
  { label: "natural blood sugar support", cats: ["blood-sugar-diabetes"] },
  { label: "sharpen memory and focus", cats: ["brain-and-memory"] },
  { label: "quiet ringing ears naturally", cats: ["hearing-and-tinnitus"] },
  { label: "natural eye health support", cats: ["vision"] },
  { label: "support a healthy prostate", cats: ["prostate", "mens-health"] },
  { label: "relieve joint pain naturally", cats: ["joint-and-back-pain", "health-devices"] },
  { label: "regrow thinning hair", cats: ["hair-growth", "hair-loss"] },
  { label: "restore deep restful sleep", cats: ["sleep-and-anxiety", "sleep"] },
  { label: "hidden cause of aging skin", cats: ["skin-and-anti-aging", "skin-and-derm", "beauty"] },
  { label: "fix bloating from the gut", cats: ["gut-and-detox", "nutrition", "womens-health"] },
  { label: "stronger teeth and gums", cats: ["dental"] },
  { label: "clear nail fungus at home", cats: ["nail-and-fungus"] },
  { label: "doctor-formulated daily support", cats: ["womens-health", "mens-health", "other", "nutrition", "primary-care", "longevity-and-nad", "heart-and-blood-pressure"] },
  // telehealth
  { label: "prescription weight loss online", cats: ["weight-loss", "glp-1"] },
  { label: "doctor-led glp-1 treatment", cats: ["glp-1"] },
  { label: "restore testosterone levels", cats: ["trt", "mens-health", "hrt"] },
  { label: "discreet ed treatment online", cats: ["ed", "sexual-wellness"] },
  { label: "talk to a therapist today", cats: ["mental-health"] },
  { label: "at-home lab testing", cats: ["labs-and-diagnostics", "longevity-and-nad", "primary-care", "local-clinics-and-healthcare"] },
  // e-commerce
  { label: "upgrade your everyday style", cats: ["apparel", "shoes", "bags-and-accessories", "demi-fine-and-fashion", "watches"] },
  { label: "viral gadget everyone wants", cats: ["viral-products", "electronics", "general-merchandise", "kitchen", "tools-and-hardware", "automotive-accessories", "home-organizers", "cleaning", "pest-control", "health-devices", "outdoor"] },
  { label: "salon results at home", cats: ["beauty", "skin-and-derm", "fragrance", "hair-care"] },
  { label: "fine jewelry without the markup", cats: ["jewelry", "demi-fine-and-fashion", "watches"] },
  { label: "gift they will actually use", cats: ["gifts", "toys-and-games", "baby-and-kids", "arts-and-crafts", "musical-instruments", "books-and-info-products"] },
  { label: "transform your home for less", cats: ["home-decor", "home-and-garden", "outdoor", "home-organizers"] },
  // search arb
  { label: "compare current offers", cats: ["search-arbitrage", "shopping-content", "native", "article-pages", "other"] },
  { label: "senior discounts most people miss", cats: ["article-pages", "native", "search-arbitrage"] },
  // lifestyle / others
  { label: "meet singles near you", cats: ["dating", "relationships-and-manifestation"] },
  { label: "play free and win prizes", cats: ["gaming", "app-installs", "competitions-and-raffles"] },
  { label: "learn to dance at home", cats: ["dance-and-fitness", "fitness"] },
  { label: "cheap last-minute travel deals", cats: ["travel", "events-and-tickets", "entertainment-and-streaming", "food-and-dining"] },
  { label: "what your birth chart reveals", cats: ["astrology-and-psychics", "relationships-and-manifestation"] },
  { label: "protect your family in a crisis", cats: ["survival-and-self-defense"] },
  { label: "healthier happier pets", cats: ["pets", "pet"] },
];

export const ANGLE_AFFINITY: Record<string, CategoryId[]> = {};

export const ANGLES: CreativeElement[] = ANGLE_DEFS.map((d) => {
  const id = slugify(d.label);
  ANGLE_AFFINITY[id] = d.cats;
  return {
    id,
    type: "angle" as const,
    label: d.label,
    description: `Ads whose core claim is “${d.label}”, grouped across different wordings.`,
  };
});

/** Words SHORT_ANGLE_RULE bans from angle labels. Exported for tests. */
export const ANGLE_BANNED_WORDS = [
  "pas", "aida", "fomo", "fear of missing out", "social proof", "curiosity gap", "curiosity",
  "urgency", "scarcity", "government program", "testimonial", "authority",
];

/* ── Concepts (video formats + image styles) ────────────────────────────── */

export type ConceptMedia = "video" | "image";

const VIDEO_FORMATS: [string, string][] = [
  ["UGC selfie", "A creator films themselves on a phone, talking straight to camera."],
  ["UGC voiceover", "Phone-shot footage with a creator's voice laid over it."],
  ["Talking head / expert", "An expert or presenter speaks to camera in a set-up shot."],
  ["Street interview", "Quick vox-pop questions to people on the street."],
  ["Testimonial", "A real-looking customer describes their result on video."],
  ["News / editorial style", "Styled like a news segment or report, with lower-thirds and b-roll."],
  ["Documentary / B-roll", "Narrated story told over documentary-style footage."],
  ["Screen recording / demo", "A phone or desktop screen recording that walks through the product."],
  ["Animation / motion graphics", "Animated explainer with kinetic type or illustrations."],
  ["Product demo", "Hands-on demonstration of the product doing its job."],
  ["Reaction / duet", "A creator reacts to another clip, split-screen or picture-in-picture."],
  ["Slideshow", "A sequence of stills or text cards set to music or voice."],
  ["AI avatar", "A generated presenter reads the script to camera."],
  ["Podcast clip", "A cut-down from a podcast or interview conversation."],
];

const IMAGE_STYLES: [string, string][] = [
  ["Native screenshot", "Looks like a screenshot from a phone or a social feed, not an ad."],
  ["UGC photo", "A casual, phone-shot photo that reads as user-made."],
  ["News / editorial", "Designed like a news article header or magazine page."],
  ["Text message / chat", "A mock text or chat conversation carries the message."],
  ["Comment collage", "Several comments or reviews stacked into one image."],
  ["Social comment", "A single highlighted social comment or reply."],
  ["iPhone note", "Styled as a notes-app page with typed text."],
  ["IG question sticker", "Uses the look of a social question sticker with an answer."],
  ["Google / native search", "Mimics a search bar or search result."],
  ["Is it a scam?", "Opens with the question of whether the product is a scam, then answers it."],
  ["Credential selfie", "A professional in uniform or scrubs, photographed selfie-style."],
  ["Comparison card", "Side-by-side comparison of the product against an alternative."],
  ["Before / after", "Split image showing the result over time."],
  ["Proof / results", "Screenshots or numbers that show an outcome."],
  ["Testimonial quote", "A large customer quote with a name or photo."],
  ["Offer & scarcity", "The deal and a deadline or stock limit, front and centre."],
  ["Product photo", "Clean studio shot of the product."],
  ["Lifestyle photo", "The product in use in a real-life setting."],
  ["Meme / novelty", "A meme format or novelty image that stops the scroll."],
  ["Infographic / chart", "Information laid out as a chart or diagram."],
  ["Listicle graphic", "A numbered list designed as a single graphic."],
  ["Checklist / tips", "A checklist or set of tips with ticks."],
  ["Warning / alert", "Styled as an alert, notice or warning banner."],
];

export const CONCEPT_MEDIA: Record<string, ConceptMedia> = {};

export const CONCEPTS: CreativeElement[] = [
  ...VIDEO_FORMATS.map(([label, description]) => {
    const id = slugify(label);
    CONCEPT_MEDIA[id] = "video";
    return { id, type: "concept" as const, label, description };
  }),
  ...IMAGE_STYLES.map(([label, description]) => {
    // "Testimonial quote" etc. are unique; "News / editorial" vs "News / editorial style" differ by slug.
    const id = slugify(label);
    CONCEPT_MEDIA[id] = "image";
    return { id, type: "concept" as const, label, description };
  }),
];

export const VIDEO_CONCEPT_IDS = CONCEPTS.filter((c) => CONCEPT_MEDIA[c.id] === "video").map((c) => c.id);
export const IMAGE_CONCEPT_IDS = CONCEPTS.filter((c) => CONCEPT_MEDIA[c.id] === "image").map((c) => c.id);

/* ── Framework elements (25 keys) ───────────────────────────────────────── */

export interface FrameworkElementInfo {
  key: FrameworkElementKey;
  label: string;
  description: string;
}

export const FRAMEWORK_ELEMENTS: FrameworkElementInfo[] = [
  { key: "hook", label: "Hook", description: "The opening line or shot that earns the next second." },
  { key: "lead", label: "Lead", description: "The bridge from the hook into the body of the pitch." },
  { key: "context", label: "Context", description: "Sets the scene: who, where and why this matters now." },
  { key: "pain", label: "Pain point", description: "Names the problem the viewer has." },
  { key: "agitation", label: "Agitation", description: "Makes the problem feel worse or more costly." },
  { key: "fear", label: "Fear / risk", description: "Points to what happens if nothing changes." },
  { key: "curiosity_loop", label: "Curiosity loop", description: "Holds back an answer to keep the viewer watching." },
  { key: "story", label: "Story", description: "A personal or customer story that carries the message." },
  { key: "mechanism", label: "Mechanism", description: "Explains how or why the product works." },
  { key: "solution", label: "Solution", description: "Presents the way out of the problem." },
  { key: "product", label: "Product", description: "Introduces the product or service by name." },
  { key: "benefits", label: "Benefits", description: "Lists what the viewer gets out of it." },
  { key: "demonstration", label: "Demonstration", description: "Shows the product in action." },
  { key: "social_proof", label: "Social proof", description: "Reviews, numbers of customers or ratings." },
  { key: "authority", label: "Authority", description: "Expert, doctor or official backing." },
  { key: "comparison", label: "Comparison", description: "Compares against the old way or a rival option." },
  { key: "objection", label: "Objection handling", description: "Answers the doubt the viewer is likely to have." },
  { key: "guarantee", label: "Guarantee", description: "Money-back or risk-free promise." },
  { key: "offer", label: "Offer", description: "The deal itself: discount, free quote, free trial." },
  { key: "price", label: "Price", description: "States the price or monthly cost." },
  { key: "bonus", label: "Bonus", description: "Extra items or perks added to the offer." },
  { key: "urgency", label: "Urgency", description: "A reason to act now, like a deadline." },
  { key: "scarcity", label: "Scarcity", description: "Limited stock, spots or availability." },
  { key: "cta", label: "Call to action", description: "Tells the viewer exactly what to do next." },
  { key: "disclaimer", label: "Disclaimer", description: "Legal or results-may-vary small print." },
];

export const FRAMEWORK_ELEMENT_LABEL: Record<FrameworkElementKey, string> = Object.fromEntries(
  FRAMEWORK_ELEMENTS.map((e) => [e.key, e.label]),
) as Record<FrameworkElementKey, string>;

/* ── Lookups ────────────────────────────────────────────────────────────── */

export const ELEMENTS_BY_TYPE: Record<ElementType, CreativeElement[]> = {
  framework: FRAMEWORKS,
  hook: HOOK_STYLES,
  angle: ANGLES,
  concept: CONCEPTS,
};

export const ELEMENT_TYPE_LABEL: Record<ElementType, string> = {
  framework: "Framework",
  hook: "Hook",
  angle: "Angle",
  concept: "Concept",
};

export const ELEMENT_TYPE_PLURAL: Record<ElementType, string> = {
  framework: "frameworks",
  hook: "hook styles",
  angle: "angles",
  concept: "concepts",
};

export const FUNNEL_TYPES: FunnelType[] = ["quiz", "advertorial", "direct-vsl", "lead-form", "product-page"];

/* ── Countries (ISO-2, subset of reference §4.3 used in the demo) ───────── */

export const COUNTRY_NAME: Record<string, string> = {
  US: "United States", CA: "Canada", GB: "United Kingdom", AU: "Australia", NZ: "New Zealand",
  IE: "Ireland", DE: "Germany", FR: "France", ES: "Spain", IT: "Italy", NL: "Netherlands",
  SE: "Sweden", NO: "Norway", DK: "Denmark", CH: "Switzerland", AT: "Austria", BE: "Belgium",
  PL: "Poland", PT: "Portugal", MX: "Mexico", BR: "Brazil", AR: "Argentina", CO: "Colombia",
  CL: "Chile", IN: "India", AE: "United Arab Emirates", SA: "Saudi Arabia", SG: "Singapore",
  MY: "Malaysia", PH: "Philippines", ZA: "South Africa", NG: "Nigeria", JP: "Japan", KR: "South Korea",
};

/** Region names used in the drawer's transparency line. */
export const TRANSPARENCY_REGION_POOL = ["UK", "EU", "US", "CA", "AU"];
