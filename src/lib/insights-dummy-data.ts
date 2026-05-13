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
  "#ChicVibes", "#StyleInspo", "#TrendAlert", "#FashionForward",
  "#DigitalFirst", "#AdCreative", "#GrowthHack", "#DTC",
  "#VideoAds", "#EcomTrends", "#SaaSTech", "#AIMarketing",
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
};

const videoUrls = [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
];

function makeAd(i: number): InsightAd {
  const industries = [...INSIGHT_INDUSTRIES];
  const brands = ["GlowSkin", "TechPulse", "FitZone", "UrbanStyle", "DataForge", "SnapBite", "EduVerse", "TravelNow", "HomeLux", "AutoDrive", "PlayCore", "BeautyHQ", "SportMax", "FinEdge", "CloudWare", "TrendLine", "WellCo", "GameVault", "ShopEase", "LearnFast", "RideOn", "CookJoy", "DesignLab", "GreenPower"];
  const domains = ["glowskin.com", "techpulse.io", "fitzone.co", "urbanstyle.com", "dataforge.dev", "snapbite.app", "eduverse.org", "travelnow.com", "homelux.co", "autodrive.com", "playcore.gg", "beautyhq.com", "sportmax.com", "finedge.io", "cloudware.dev", "trendline.co", "wellco.health", "gamevault.gg", "shopease.com", "learnfast.edu", "rideon.app", "cookjoy.co", "designlab.io", "greenpower.eco"];
  const headlines = ["Transform Your Routine", "Next-Level Performance", "Discover the Difference", "Start Today", "Join 10K+ Users", "Limited Offer", "New Collection Drop", "Fuel Your Growth", "Book Now & Save", "Free Trial Available", "Upgrade Your Game", "Feel the Change", "Expert-Approved", "Trending Now", "See Results Fast", "Build Smarter", "Fresh Arrivals", "Level Up", "Save 30% Today", "Learn More Inside", "Drive Innovation", "Cook Like a Pro", "Design Better", "Go Green"];
  const ctas = ["Shop Now", "Learn More", "Sign Up", "Get Started", "Book Now", "Try Free", "Download", "Watch Now"];
  const statuses: ("active" | "inactive" | "paused")[] = i % 7 === 0 ? ["paused"] : i % 5 === 0 ? ["inactive"] : ["active"];
  const plats: (typeof PLATFORMS)[number][] = ["Meta", "Instagram"];
  if (i % 3 === 0) plats.push("Messenger");
  if (i % 4 === 0) plats.push("Audience Network");

  const brand = brands[i % brands.length];
  const isVideo = i % 3 === 0;

  return {
    id: `dummy-ad-${i + 1}`,
    adId: `AD-${(100000 + i * 7919).toString().slice(0, 6)}`,
    pageAvatar: `https://i.pravatar.cc/150?u=${brand.toLowerCase()}`,
    pageName: brand,
    pageId: `page-${(200000 + i * 3137).toString().slice(0, 6)}`,
    brand: brand,
    domain: domains[i % domains.length],
    industry: industries[i % industries.length],
    platform: plats[0],
    platforms: plats,
    status: statuses[0],
    adType: isVideo ? "Video" : i % 3 === 1 ? "Image" : "Carousel",
    primaryText: `Discover what makes ${brand} the #1 choice for ${industries[i % industries.length].toLowerCase()} enthusiasts. Our latest campaign showcases cutting-edge creative designed to convert.`,
    headline: headlines[i % headlines.length],
    description: `${brand} — ${industries[i % industries.length]} leader since 2019.`,
    cta: ctas[i % ctas.length],
    // Pinterest-masonry variance: ~40% of ads have NO media (short cards in grid).
    // Drives natural column-pack variance without changing card logic.
    mediaUrl: i % 5 < 3 ? (isVideo ? videoUrls[i % videoUrls.length] : `https://picsum.photos/seed/${brand.toLowerCase()}/600/800`) : "",
    mediaType: isVideo ? "video" : "image",
    thumbUrl: i % 5 < 3 ? `https://picsum.photos/seed/${brand.toLowerCase()}-thumb/600/800` : "",
    transparencyMode: i % 2 === 0,
    analysed: i % 3 !== 2,
    createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
    activeDuration: `${7 + (i % 20)} days`,
    similarAdsCount: 2 + (i % 8),
    impressions: `${(10 + i * 3.7).toFixed(1)}K`,
    reach: `${(8 + i * 2.1).toFixed(1)}K`,
    spend: `$${(200 + i * 45).toLocaleString()}`,
    category: industries[i % industries.length],
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
    keywords: [`${industries[i % industries.length].toLowerCase()}`, "ads", "growth", ...(i % 2 === 0 ? ["trending"] : [])],
    tags: [TRENDING_TAGS[i % TRENDING_TAGS.length], TRENDING_TAGS[(i + 3) % TRENDING_TAGS.length]],
    additionalMediaUrls: Array.from({ length: 3 + (i % 4) }, (_, j) => `https://picsum.photos/seed/${brand.toLowerCase()}-${j}/600/400`),
    estimatedAudienceSize: `${(500 + i * 50)}K - ${(1000 + i * 100)}K`,
    spendTillNow: `$${(200 + i * 45).toLocaleString()}`,
    regionReach: [
      { region: "BR", value: `${(2 + i * 0.3).toFixed(1)}k (${60 + (i % 20)}%)` },
      { region: "EU", value: `${(1.5 + i * 0.2).toFixed(1)}k (${40 + (i % 15)}%)` },
    ],
  };
}

export const DUMMY_ADS: InsightAd[] = Array.from({ length: 480 }, (_, i) => makeAd(i));
