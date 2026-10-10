/**
 * Industries + A–Z categories (BUILD-LOG Q1/Q2).
 *
 * - 6 industries. The reference's jewellery industry folds into E-commerce
 *   (its "Demi-fine & Fashion" category lives there); the reference's
 *   "Arbitrage" is labelled "Search Arb".
 * - Categories = A–Z union of the reference canon lists, deduped by label.
 *   "Adult" is excluded from the demo data.
 * - Categories are global for the dropdown; each ad's category belongs to its
 *   own industry's canon list (INDUSTRY_CATEGORIES).
 */
import type { Category, CategoryId, Industry, IndustryId } from "../types";

export const INDUSTRIES: Industry[] = [
  { id: "vsl", label: "VSL" },
  { id: "telehealth", label: "Telehealth" },
  { id: "lead-gen", label: "Lead Gen" },
  { id: "e-commerce", label: "E-commerce" },
  { id: "search-arb", label: "Search Arb" },
  { id: "others", label: "Others" },
];

/** Label → slug id. "Men's Health" → "mens-health", "Longevity & NAD+" → "longevity-and-nad". */
export function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/\+/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Canon lists per industry (labels), in reference order. */
const CANON: Record<IndustryId, string[]> = {
  vsl: [
    "Weight Loss", "Blood Sugar / Diabetes", "Brain & Memory", "Hearing & Tinnitus", "Vision", "Prostate",
    "Dental", "Joint & Back Pain", "Skin & Anti-Aging", "Nail & Fungus", "Hair Growth", "Men's Health",
    "Women's Health", "Gut & Detox", "Heart & Blood Pressure", "Sleep & Anxiety", "Make Money / Bizopp",
    "Crypto & Trading", "Survival & Self-Defense", "Relationships & Manifestation", "Pets", "Other",
  ],
  telehealth: [
    "Weight Loss", "GLP-1", "Longevity & NAD+", "Labs & Diagnostics", "ED", "TRT", "HRT", "Mental Health",
    "Skin & Derm", "Hair Loss", "Sleep", "Primary Care", "Other",
  ],
  "lead-gen": [
    "Auto Insurance", "Health Insurance", "Life Insurance", "Medicare", "Home & Property Insurance",
    "Insurance (Other)", "Solar", "Roofing", "HVAC & Plumbing", "Home Services", "Local Clinics & Healthcare",
    "Legal & Mass Tort", "Loans & Mortgage", "Debt & Tax Relief", "Education & Courses", "Real Estate",
    "Automotive", "Jobs & Recruiting", "B2B / SaaS", "Banking & Finance", "Sweepstakes", "Surveys & Rewards",
    "Government & Senior Benefits", "Home & Auto Warranty", "Legal & Permits", "Business & Coaching",
    "Dance & Fitness", "Other",
  ],
  others: [
    "Dance & Fitness", "App Installs", "Gaming", "Finance & Fintech", "Crypto & Trading", "Insurance",
    "Education & Courses", "Real Estate", "Travel", "Automotive", "Dating", "SaaS", "AI & Digital Products",
    "Competitions & Raffles", "Advocacy & Non-Profit", "Events & Tickets", "News & Media", "Food & Dining",
    "Home Services", "Jobs & Recruiting", "Entertainment & Streaming", "Astrology & Psychics", "Other",
  ],
  "e-commerce": [
    "General Merchandise", "Apparel", "Nutrition", "Beauty", "Pet", "Gifts", "Fitness", "Viral Products",
    "Home Decor", "Electronics", "Outdoor", "Sleep", "Bags & Accessories", "Shoes", "Kitchen", "Hair Care",
    "Fragrance", "Baby & Kids", "Watches", "Home & Garden", "Arts & Crafts", "Tools & Hardware",
    "Home Organizers", "Automotive Accessories", "Cleaning", "Musical Instruments", "Toys & Games",
    "Books & Info Products", "Health Devices", "Astrology & Psychics", "Pest Control", "Sexual Wellness",
    "Jewelry", "Demi-fine & Fashion",
  ],
  // "Adult" deliberately excluded (Q1).
  "search-arb": ["Search Arbitrage", "Native", "Shopping Content", "Article Pages", "Other"],
};

function buildCategories(): Category[] {
  const byLabel = new Map<string, Category>();
  for (const ind of INDUSTRIES) {
    for (const label of CANON[ind.id]) {
      if (!byLabel.has(label)) byLabel.set(label, { id: slugify(label), label });
    }
  }
  return Array.from(byLabel.values()).sort((a, b) =>
    a.label.localeCompare(b.label, "en", { sensitivity: "base" }),
  );
}

/** Global A–Z category list. */
export const CATEGORIES: Category[] = buildCategories();

/** Industry → its canon category ids. */
export const INDUSTRY_CATEGORIES: Record<IndustryId, CategoryId[]> = Object.fromEntries(
  INDUSTRIES.map((i) => [i.id, CANON[i.id].map(slugify)]),
) as Record<IndustryId, CategoryId[]>;

/** Categories that get the bulk of ads inside each industry (realistic, uneven). */
export const FEATURED_CATEGORIES: Record<IndustryId, CategoryId[]> = {
  vsl: ["weight-loss", "blood-sugar-diabetes", "joint-and-back-pain", "brain-and-memory", "hearing-and-tinnitus", "prostate", "vision", "make-money-bizopp"],
  telehealth: ["glp-1", "weight-loss", "trt", "ed", "mental-health", "hair-loss"],
  "lead-gen": ["auto-insurance", "medicare", "solar", "debt-and-tax-relief", "health-insurance", "legal-and-mass-tort", "government-and-senior-benefits", "home-and-auto-warranty", "roofing", "life-insurance"],
  "e-commerce": ["viral-products", "beauty", "jewelry", "demi-fine-and-fashion", "apparel", "home-decor", "kitchen", "pet"],
  "search-arb": ["search-arbitrage", "article-pages", "native"],
  others: ["dating", "gaming", "ai-and-digital-products", "finance-and-fintech", "travel", "app-installs"],
};

/** Share of ads per industry (Lead Gen + VSL heavy, Search Arb light). */
export const INDUSTRY_WEIGHTS: Record<IndustryId, number> = {
  "lead-gen": 0.3,
  vsl: 0.25,
  "e-commerce": 0.18,
  telehealth: 0.12,
  others: 0.1,
  "search-arb": 0.05,
};
