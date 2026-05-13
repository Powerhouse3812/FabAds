// ── Predefined lists ──

export const INSIGHT_INDUSTRIES = [
  "E-commerce", "SaaS", "Gaming", "Health & Wellness", "Finance",
  "Fashion", "Food & Beverage", "Education", "Travel", "Real Estate",
  "Automotive", "Entertainment", "Beauty", "Sports", "Technology",
] as const;

export const INSIGHT_INTERESTS = [
  "Performance Marketing", "Brand Awareness", "Retargeting",
  "Influencer Marketing", "Content Marketing", "Social Commerce",
  "Video Ads", "Lead Generation", "App Installs", "DTC Brands",
] as const;

export const TRENDING_TAGS = [
  "#ChicVibes", "#StyleInspo", "#TrendAlert", "#FashionForward", "#GrowthHack", "#AIMarketing",
] as const;

export const PLATFORMS = ["Meta", "Instagram", "Messenger", "WhatsApp", "Audience Network", "Threads"] as const;

export type InsightAd = {
  id: string;
  adId: string;
  pageAvatar: string;
  pageName: string;
  pageId: string;
  brand: string;
  domain: string;
  industry: string;
  platform: (typeof PLATFORMS)[number];
  platforms: (typeof PLATFORMS)[number][];
  status: "active" | "inactive" | "paused";
  adType: string;
  primaryText: string;
  headline: string;
  description: string;
  cta: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  thumbUrl: string;
  transparencyMode: boolean;
  analysed: boolean;
  mediaProcessing?: boolean;
  /** CSS aspect-ratio string for the media block (e.g. "3/4", "1/1", "16/9").
      Drives Pinterest masonry variance — each ad gets a deterministic ratio. */
  mediaAspectRatio?: string;
  createdAt: string;
  activeDuration: string;
  similarAdsCount: number;
  impressions: string;
  reach: string;
  spend: string;
  category: string;
  demographics: { ageGroup: string; gender: string; percentage: number }[];
  locations: { name: string; type: string; includeExclude: "include" | "exclude" }[];
  languages: string[];
  keywords: string[];
  tags: string[];
  additionalMediaUrls: string[];
  estimatedAudienceSize: string;
  spendTillNow: string;
  regionReach: { region: string; value: string }[];
  /** Sync state of the source page (Foreplay-style page-tracking).
      Surfaced inline in the detail-drawer top meta row. */
  syncStatus?: { state: "synced" | "paused" | "syncing"; lastSyncedAt: string };
  /** Region codes the ad is in transparency mode for, e.g. ["UK","EU"].
      Drives the "(Transparency mode: UK, EU...)" inline label. Empty/undefined
      when not in transparency mode. */
  transparencyRegions?: string[];
  /** Multi-domain support. Single-domain ads get [domain]; some ads carry
      2-3 sibling domains (alt brand fronts). Drives the "Domains" list in
      the not-analysed detail view. */
  domains?: string[];
};

const videoUrls = [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
];

// Real-looking ad copy varies by industry — picks rotate by (i * prime) so
// every ad in a feed reads differently even with the same brand.
const PRIMARY_TEXT_BY_INDUSTRY: Record<string, string[]> = {
  "E-commerce": [
    "Best-sellers everyone's talking about. Free shipping on orders over $50.",
    "Up to 40% off — our biggest sale of the season. Ends Sunday.",
    "New arrivals just dropped. Shop before they're gone.",
    "The bag that's been on every waitlist this year. Back in stock — limited drop.",
    "Premium quality, honest pricing. No middlemen, no markups.",
  ],
  "SaaS": [
    "Cut your reporting time by 70%. Try the dashboard free for 14 days, no card needed.",
    "Used by 12,000+ teams to ship faster. Replaces 6 tools for the price of one.",
    "Stop juggling tools. One platform, all your customer data — fully integrated.",
    "From spreadsheet chaos to clean dashboards in under 10 minutes.",
    "Stripe, Shopify, HubSpot — connect them all and finally see the full picture.",
  ],
  "Gaming": [
    "The most addictive puzzle game of 2026. Free to play, no pay-to-win.",
    "Build your empire — millions are already playing. Free download, optional purchases.",
    "Real-time strategy meets card battling. Drop in, three minutes to a match.",
    "Compete in seasonal tournaments. New maps drop every Friday.",
    "Casual on the surface, deep underneath. The pros recommend it for a reason.",
  ],
  "Health & Wellness": [
    "Personalized supplements built around your DNA. Skin, energy, sleep — covered.",
    "12-week transformation backed by science. 87% of users hit their goal.",
    "The mindfulness app trusted by 500K+ users. 10 minutes a day is all it takes.",
    "Daily protein, the way pros take it. No bloat, no aftertaste.",
    "Better sleep starts tonight. Backed by clinical research.",
  ],
  "Finance": [
    "Earn 5.1% APY on your savings — no minimums, no fees, no nonsense.",
    "The credit card that pays you back. 2% on everything, 5% on rotating categories.",
    "Investing made simple. Start with as little as $5, no advisor required.",
    "Tax filing in 12 minutes. Get your refund up to 5 days early.",
    "Set it once, save automatically. The smarter way to build your safety net.",
  ],
  "Fashion": [
    "The dress that breaks the internet — back in stock for 48 hours.",
    "Made for movement. Built to last. Free returns within 30 days.",
    "Premium denim. Honest prices. The fit you've been chasing.",
    "Sustainable cashmere at a fraction of luxury brand prices.",
    "Curated by stylists. Delivered to your door. Keep what you love.",
  ],
  "Food & Beverage": [
    "Meal kits delivered weekly. Skip whenever, cancel anytime.",
    "The high-protein snack everyone's reaching for. 12g protein, 4g sugar.",
    "Organic coffee, shipped fresh from family farms. Try 3 roasts for $1.",
    "Plant-based, chef-developed. Eat better without thinking about it.",
    "The cookware your grandparents would have used — built to outlive trends.",
  ],
  "Education": [
    "Learn to code in 30 days — even if you've never written a line.",
    "Master a new skill in 15 minutes a day. Self-paced, no deadlines.",
    "From beginner to conversational fluency. The fastest way to learn a language.",
    "Real classes, real instructors. Get certified, get hired.",
    "Math finally clicks when it's taught like this. Risk-free 7-day trial.",
  ],
  "Travel": [
    "Hidden gems, vetted hotels, best price guaranteed. Travel without the FOMO.",
    "Plan your dream trip in under 5 minutes. Powered by AI, vetted by humans.",
    "Insider tips for the destinations on your list. From people who actually live there.",
    "Round-trip flights at last-minute prices, weeks in advance.",
    "The local experiences travel blogs don't tell you about.",
  ],
  "Real Estate": [
    "Find your next home — without the 3% agent fee.",
    "Off-market listings before they hit the MLS. Buyer's edge, built in.",
    "Rent smarter. Search by what actually matters — commute, daylight, deal-breakers.",
    "Down-payment savings, automated. Your home goal is closer than you think.",
    "Tour homes virtually. Schedule in-person walkthroughs in one tap.",
  ],
  "Automotive": [
    "Compare 1000+ models. Get a fair price in minutes — no dealer haggling.",
    "The smart way to buy a used car. Every car inspected, every history known.",
    "Lease deals updated daily — see this week's hidden offers before they go.",
    "Trade-in value in 60 seconds. Get cash, not a runaround.",
    "EV ownership made easy. Charging map, tax credits, the works.",
  ],
  "Entertainment": [
    "Unlimited streaming. Cancel anytime, no questions asked.",
    "The shows everyone's binging this week. New drops every Friday.",
    "Live concerts, no ticket scalpers. Real seats, real prices.",
    "The best of indie cinema, curated and ad-free.",
    "Audiobooks + podcasts, one subscription. 20,000+ titles included.",
  ],
  "Beauty": [
    "Skincare that actually works — backed by 47,000 5-star reviews.",
    "Customized for your skin. Built in 30 seconds, shipped in 3 days.",
    "Salon-grade results at home. The tool stylists are quietly switching to.",
    "Clean ingredients, real results. No greenwashing, no nonsense.",
    "The serum that's been on every dermatologist's recommendation list this year.",
  ],
  "Sports": [
    "Train with the pros. Get the gear they use, at the price they don't pay.",
    "The fitness tracker that does more — coaching, recovery, sleep, the lot.",
    "Performance gear, tested by athletes, priced for everyone.",
    "Run faster, recover smarter. The shoe biomechanists keep talking about.",
    "Adventure gear for the trips you've been planning.",
  ],
  "Technology": [
    "The laptop everyone's talking about — finally back in stock. Limited inventory.",
    "Faster Wi-Fi, fewer dropouts. Engineered for streamers and gamers who hate lag.",
    "AI-powered tools that save you 10 hours a week. 30-day free trial, no card.",
    "Privacy-first phone, no ads, no tracking, no compromise.",
    "The headphones audio engineers actually wear. Honest pricing, no hype.",
  ],
};

const HEADLINES_BY_INTENT = [
  // Question
  "Tired of slow tools?", "Want better skin in 30 days?", "Ready to ship faster?",
  "Lost in your data?", "Need a faster checkout?",
  // Stat
  "Trusted by 100K+ teams", "12,000+ users can't be wrong", "Save up to 40%",
  "5-star rated, 47K reviews", "Used by Fortune 500",
  // Urgency
  "Limited time — ends Sunday", "Today only", "Last 24 hours",
  "While supplies last", "48-hour drop",
  // Benefit
  "Sleep better tonight", "Read 12 books a year", "Cut reporting time 70%",
  "Earn 5.1% APY", "Free returns, always",
  // Curiosity
  "The secret pros use", "What VCs don't tell founders", "Inside the 1%'s playbook",
  "The shortcut nobody talks about", "How they do it differently",
  // Direct
  "New collection drop", "Back in stock", "Now available",
  "Just launched", "Now shipping",
];

const DESCRIPTIONS = [
  "Free shipping on orders $50+",
  "Loved by 12,000+ customers",
  "Save 30% with code FALL30",
  "Free 14-day trial. No card needed.",
  "Cancel anytime. No fees.",
  "Get yours before they're gone",
  "As featured in TechCrunch & Forbes",
  "Backed by 47K 5-star reviews",
  "Limited drop — once it's gone, it's gone",
  "Money-back guarantee, no questions",
  "Made in small batches. Built to last.",
  "Used by teams at Stripe, Notion, Linear",
  "Try risk-free for 30 days",
  "Same-day delivery in most cities",
  "Carbon-neutral shipping included",
];

const CTAS_BY_INDUSTRY: Record<string, string[]> = {
  "E-commerce": ["Shop Now", "Get Yours", "View Collection", "Buy Now"],
  "SaaS": ["Try Free", "Book Demo", "Start Free Trial", "See It Live"],
  "Gaming": ["Play Now", "Download Free", "Install", "Get the Game"],
  "Health & Wellness": ["Get Started", "Take the Quiz", "Start Today", "Order Now"],
  "Finance": ["Sign Up", "Open Account", "Learn More", "Get Started"],
  "Fashion": ["Shop Now", "View Sizes", "Get Yours", "Browse Edit"],
  "Food & Beverage": ["Order Now", "Try It", "Get 50% Off", "Subscribe"],
  "Education": ["Start Learning", "Try Free", "Enroll Now", "Get Course"],
  "Travel": ["Plan Trip", "Search Flights", "Browse Stays", "Get the App"],
  "Real Estate": ["Search Homes", "Get Listings", "Schedule Tour", "Find a Match"],
  "Automotive": ["Compare Now", "Get Quote", "Find Deals", "Test Drive"],
  "Entertainment": ["Watch Free", "Subscribe", "Start Streaming", "Listen Now"],
  "Beauty": ["Take the Quiz", "Shop Now", "Get Yours", "Build Routine"],
  "Sports": ["Shop Now", "Get the App", "Train With Us", "Buy Now"],
  "Technology": ["Buy Now", "Pre-Order", "Learn More", "Get It Now"],
};

export const BRANDS = [
  "GlowSkin", "TechPulse", "FitZone", "UrbanStyle", "DataForge", "SnapBite",
  "EduVerse", "TravelNow", "HomeLux", "AutoDrive", "PlayCore", "BeautyHQ",
  "SportMax", "FinEdge", "CloudWare", "TrendLine", "WellCo", "GameVault",
  "ShopEase", "LearnFast", "RideOn", "CookJoy", "DesignLab", "GreenPower",
  "Nimbus", "Vesper", "Ardent", "Lumen", "Northwind", "Pixelpath",
  "Mantra Labs", "Slingshot", "Quill & Roam", "Atlas Co", "Verda Foods",
  "BlueTrack", "OrbitGym", "Hearth Home", "Cascade", "Helios Health",
];

const DOMAINS = [
  "glowskin.com", "techpulse.io", "fitzone.co", "urbanstyle.com", "dataforge.dev",
  "snapbite.app", "eduverse.org", "travelnow.com", "homelux.co", "autodrive.com",
  "playcore.gg", "beautyhq.com", "sportmax.com", "finedge.io", "cloudware.dev",
  "trendline.co", "wellco.health", "gamevault.gg", "shopease.com", "learnfast.edu",
  "rideon.app", "cookjoy.co", "designlab.io", "greenpower.eco", "nimbus.app",
  "vesper.co", "ardent.io", "lumen.studio", "northwind.co", "pixelpath.io",
  "mantralabs.com", "slingshot.app", "quillandroam.com", "atlasco.com", "verdafoods.com",
  "bluetrack.io", "orbitgym.com", "hearthhome.co", "cascade.app", "helioshealth.co",
];

function pick<T>(arr: readonly T[] | T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function makeAd(i: number): InsightAd {
  const industries = [...INSIGHT_INDUSTRIES];
  const statuses: ("active" | "inactive" | "paused")[] = i % 7 === 0 ? ["paused"] : i % 5 === 0 ? ["inactive"] : ["active"];
  const plats: (typeof PLATFORMS)[number][] = ["Meta", "Instagram"];
  if (i % 3 === 0) plats.push("Messenger");
  if (i % 4 === 0) plats.push("Audience Network");

  const brand = BRANDS[i % BRANDS.length];
  const domain = DOMAINS[i % DOMAINS.length];
  const industry = industries[i % industries.length];
  const isVideo = i % 3 === 0;

  const primaryVariants = PRIMARY_TEXT_BY_INDUSTRY[industry] ?? PRIMARY_TEXT_BY_INDUSTRY["E-commerce"];
  const ctaVariants = CTAS_BY_INDUSTRY[industry] ?? CTAS_BY_INDUSTRY["E-commerce"];

  return {
    id: `dummy-ad-${i + 1}`,
    adId: `AD-${(100000 + i * 7919).toString().slice(0, 6)}`,
    pageAvatar: `https://i.pravatar.cc/150?u=${brand.toLowerCase().replace(/\s+/g, "")}`,
    pageName: brand,
    pageId: `page-${(200000 + i * 3137).toString().slice(0, 6)}`,
    brand: brand,
    domain: domain,
    industry: industry,
    platform: plats[0],
    platforms: plats,
    status: statuses[0],
    adType: isVideo ? "Video" : i % 3 === 1 ? "Image" : "Carousel",
    primaryText: pick(primaryVariants, i * 7 + 3),
    headline: pick(HEADLINES_BY_INTENT, i * 11 + 5),
    description: pick(DESCRIPTIONS, i * 13 + 1),
    cta: pick(ctaVariants, i * 5 + 2),
    // Pinterest-masonry variance: ~40% of ads have NO media (short cards in grid).
    // Drives natural column-pack variance without changing card logic.
    mediaUrl: i % 5 < 3 ? (isVideo ? videoUrls[i % videoUrls.length] : `https://picsum.photos/seed/${brand.toLowerCase().replace(/\s+/g, "")}-${i}/600/800`) : "",
    mediaType: isVideo ? "video" : "image",
    thumbUrl: i % 5 < 3 ? `https://picsum.photos/seed/${brand.toLowerCase().replace(/\s+/g, "")}-thumb-${i}/600/800` : "",
    // Random aspect ratio per ad — true Pinterest variance.
    // Locked to: 1:1 (square), 2:3 (portrait), 16:9 (landscape wide), 9:16 (portrait tall).
    // Deterministic by i so re-renders stay stable.
    mediaAspectRatio: ["1/1", "2/3", "16/9", "9/16"][i % 4],
    transparencyMode: i % 2 === 0,
    analysed: i % 3 !== 2,
    createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
    activeDuration: `${7 + (i % 20)} days`,
    similarAdsCount: 2 + (i % 8),
    impressions: `${(10 + i * 3.7).toFixed(1)}K`,
    reach: `${(8 + i * 2.1).toFixed(1)}K`,
    spend: `$${(200 + i * 45).toLocaleString()}`,
    category: industry,
    demographics: [
      { ageGroup: "18-24", gender: "All", percentage: 25 + (i % 10) },
      { ageGroup: "25-34", gender: "All", percentage: 35 - (i % 8) },
      { ageGroup: "35-44", gender: "All", percentage: 20 + (i % 5) },
      { ageGroup: "45+", gender: "All", percentage: 15 - (i % 4) },
    ],
    locations: [
      { name: "United States", type: "Country", includeExclude: "include" },
      { name: "United Kingdom", type: "Country", includeExclude: "include" },
      ...(i % 3 === 0 ? [{ name: "Germany", type: "Country", includeExclude: "include" as const }] : []),
    ],
    languages: ["English", ...(i % 4 === 0 ? ["Spanish"] : [])],
    keywords: [`${industry.toLowerCase()}`, "ads", "growth", ...(i % 2 === 0 ? ["trending"] : [])],
    tags: [TRENDING_TAGS[i % TRENDING_TAGS.length], TRENDING_TAGS[(i + 3) % TRENDING_TAGS.length]],
    additionalMediaUrls: Array.from({ length: 3 + (i % 4) }, (_, j) => `https://picsum.photos/seed/${brand.toLowerCase().replace(/\s+/g, "")}-${i}-${j}/600/400`),
    estimatedAudienceSize: `${(500 + i * 50)}K - ${(1000 + i * 100)}K`,
    spendTillNow: `$${(200 + i * 45).toLocaleString()}`,
    regionReach: [
      { region: "BR", value: `${(2 + i * 0.3).toFixed(1)}k (${60 + (i % 20)}%)` },
      { region: "EU", value: `${(1.5 + i * 0.2).toFixed(1)}k (${40 + (i % 15)}%)` },
    ],
    // Sync status: ~70% synced, ~25% paused (1-7d ago), ~5% syncing.
    syncStatus: (() => {
      const bucket = i % 20;
      if (bucket < 14) {
        return {
          state: "synced" as const,
          lastSyncedAt: new Date(Date.now() - (i % 6) * 3600000).toISOString(),
        };
      }
      if (bucket < 19) {
        return {
          state: "paused" as const,
          lastSyncedAt: new Date(Date.now() - (1 + (i % 7)) * 86400000).toISOString(),
        };
      }
      return {
        state: "syncing" as const,
        lastSyncedAt: new Date(Date.now() - 60000 * (i % 30)).toISOString(),
      };
    })(),
    // Transparency regions: only populated when transparencyMode=true.
    // Random 1-3 picks from the canonical list, seeded by i for stability.
    transparencyRegions: (() => {
      if (i % 2 !== 0) return []; // mirrors transparencyMode logic
      const all = ["UK", "EU", "US", "CA", "AU"];
      const count = 1 + (i % 3);
      const start = i % all.length;
      return Array.from({ length: count }, (_, k) => all[(start + k) % all.length]);
    })(),
    // Multi-domain: 75% single, 25% multi (2-3 sibling domains).
    domains: (() => {
      if (i % 4 !== 0) return [domain];
      const altA = DOMAINS[(i + 7) % DOMAINS.length];
      const altB = DOMAINS[(i + 13) % DOMAINS.length];
      return i % 8 === 0 ? [domain, altA, altB] : [domain, altA];
    })(),
  };
}

export const DUMMY_ADS: InsightAd[] = Array.from({ length: 800 }, (_, i) => makeAd(i));
