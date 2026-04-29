/* ------------------------------------------------------------------ */
/*  Genie 2.0 — Dummy data for demo mode                              */
/* ------------------------------------------------------------------ */

export type BrandProfile = {
  name: string;
  colors: string[];
  tone: string;
  category: string;
  logoPlaceholder: string;
};

export type AdCopySet = {
  id: string;
  headline: string;
  primaryText: string;
  description: string;
  vertical: string;
  imageUrl: string;
};

/* ---------- Fake brand profiles (keyed by URL keywords) ----------- */
export const BRAND_PROFILES: Record<string, BrandProfile> = {
  nike: { name: "Nike", colors: ["#111111", "#FA5400", "#FFFFFF"], tone: "Bold & Motivational", category: "Apparel & Footwear", logoPlaceholder: "N" },
  supplement: { name: "VitaBoost", colors: ["#2D8C3C", "#F5A623", "#FAFAFA"], tone: "Trustworthy & Clean", category: "Health & Supplements", logoPlaceholder: "V" },
  gadget: { name: "TechNova", colors: ["#1A1A2E", "#0F3460", "#E94560"], tone: "Futuristic & Sleek", category: "Consumer Electronics", logoPlaceholder: "T" },
  beauty: { name: "GlowSkin", colors: ["#F8E8D4", "#C97B63", "#3D2B1F"], tone: "Warm & Luxurious", category: "Beauty & Skincare", logoPlaceholder: "G" },
};

export function detectBrandFromUrl(url: string): BrandProfile {
  const lower = url.toLowerCase();
  for (const [keyword, profile] of Object.entries(BRAND_PROFILES)) {
    if (lower.includes(keyword)) return profile;
  }
  return { name: "Brand Co.", colors: ["#6366F1", "#EC4899", "#FFFFFF"], tone: "Modern & Friendly", category: "General", logoPlaceholder: "B" };
}

/* ---------- Dummy existing products -------------------------------- */
export const EXISTING_PRODUCTS = [
  { id: "p1", name: "Running Shoes Pro X", brand: "Nike", url: "https://nike.com/pro-x", image: "https://picsum.photos/seed/nike-prox/80/80", price: "$149.99" },
  { id: "p2", name: "Omega-3 Fish Oil 1000mg", brand: "VitaBoost", url: "https://vitaboost.com/omega3", image: "https://picsum.photos/seed/omega3/80/80", price: "$24.99" },
  { id: "p3", name: "Smart Watch Ultra", brand: "TechNova", url: "https://technova.com/watch", image: "https://picsum.photos/seed/smartwatch/80/80", price: "$299.00" },
  { id: "p4", name: "Hydrating Serum", brand: "GlowSkin", url: "https://glowskin.com/serum", image: "https://picsum.photos/seed/serum/80/80", price: "$39.99" },
];

/* ---------- Affiliate categories ----------------------------------- */
export const AFFILIATE_CATEGORIES = [
  "Health & Wellness", "Finance & Investing", "Insurance", "Tech & SaaS",
  "Dating & Relationships", "Education & Courses", "E-commerce & Dropshipping", "Crypto & Web3",
];

/* ---------- Ad copy pool ------------------------------------------- */
export const AD_COPY_POOL: AdCopySet[] = [
  { id: "ac1", headline: "Transform Your Morning Routine", primaryText: "Start your day with the energy you deserve. Our all-natural blend fuels your body and mind — no crash, no jitters. Join 50,000+ customers who made the switch.", description: "Shop now and get 30% off your first order. Free shipping on orders over $50.", vertical: "Health & Wellness", imageUrl: "https://picsum.photos/seed/ac1/640/640" },
  { id: "ac2", headline: "Your Portfolio Deserves Better", primaryText: "Stop leaving money on the table. Our AI-powered trading signals have outperformed the S&P 500 by 23% this year. See the data for yourself.", description: "Start your free 14-day trial. No credit card required.", vertical: "Finance & Investing", imageUrl: "https://picsum.photos/seed/ac2/640/640" },
  { id: "ac3", headline: "Protection That Actually Pays", primaryText: "Why overpay for coverage you'll never use? Our smart plans adapt to YOUR life — not the other way around. Get a quote in 60 seconds.", description: "Save up to 40% vs. traditional plans. Rated #1 by Consumer Reports.", vertical: "Insurance", imageUrl: "https://picsum.photos/seed/ac3/640/640" },
  { id: "ac4", headline: "Build. Ship. Scale.", primaryText: "The only platform that takes you from idea to 10K users without a DevOps team. Automatic scaling, built-in analytics, and a developer-first experience.", description: "Free tier available. No credit card needed to start.", vertical: "Tech & SaaS", imageUrl: "https://picsum.photos/seed/ac4/640/640" },
  { id: "ac5", headline: "Meet Someone Worth Meeting", primaryText: "Tired of swiping? Our matchmaking algorithm focuses on compatibility, not just looks. 83% of our members find a meaningful connection within 3 months.", description: "Download free. Premium features starting at $9.99/mo.", vertical: "Dating & Relationships", imageUrl: "https://picsum.photos/seed/ac5/640/640" },
  { id: "ac6", headline: "Learn What Schools Won't Teach", primaryText: "From negotiation to personal finance to AI — our bite-sized courses are taught by industry leaders and designed for real-world impact. Join 200K+ learners.", description: "First course free. Cancel anytime.", vertical: "Education & Courses", imageUrl: "https://picsum.photos/seed/ac6/640/640" },
  { id: "ac7", headline: "Run Faster. Feel Unstoppable.", primaryText: "Engineered with responsive foam and adaptive fit technology, the Pro X delivers elite performance for every stride. Your new PR starts here.", description: "Free returns. 60-day trial. Shop the collection.", vertical: "Apparel & Footwear", imageUrl: "https://picsum.photos/seed/ac7/640/640" },
  { id: "ac8", headline: "Skin That Speaks For Itself", primaryText: "Clinically tested. Dermatologist approved. Our hydrating serum locks in moisture for 72 hours — because great skin shouldn't be complicated.", description: "Subscribe & save 25%. Free shipping always.", vertical: "Beauty & Skincare", imageUrl: "https://picsum.photos/seed/ac8/640/640" },
  { id: "ac9", headline: "Your Wrist. Your Command Center.", primaryText: "Track fitness, manage calls, control your smart home — all from a single device. The Ultra watch redefines what wearable tech can do.", description: "Starting at $299. Trade in your old device for up to $100 off.", vertical: "Consumer Electronics", imageUrl: "https://picsum.photos/seed/ac9/640/640" },
  { id: "ac10", headline: "Drop Ship Without The Drama", primaryText: "Our platform handles sourcing, fulfillment, and returns so you can focus on marketing. Start your store in under 10 minutes with zero inventory risk.", description: "14-day free trial. Plans from $29/mo.", vertical: "E-commerce & Dropshipping", imageUrl: "https://picsum.photos/seed/ac10/640/640" },
  { id: "ac11", headline: "The Future of Money Is Here", primaryText: "Earn up to 12% APY on your crypto holdings with institutional-grade security. Fully regulated, fully transparent, and designed for the long game.", description: "Get $50 in BTC when you sign up. Terms apply.", vertical: "Crypto & Web3", imageUrl: "https://picsum.photos/seed/ac11/640/640" },
  { id: "ac12", headline: "Energy Without The Compromise", primaryText: "Packed with adaptogens and zero artificial sweeteners, our energy drink is the clean fuel your body craves. Try the flavor that's taking TikTok by storm.", description: "Buy 2, get 1 free. Use code ENERGY at checkout.", vertical: "Health & Wellness", imageUrl: "https://picsum.photos/seed/ac12/640/640" },
];

export function getAdCopies(vertical?: string, count = 4): AdCopySet[] {
  const pool = vertical
    ? AD_COPY_POOL.filter((a) => a.vertical.toLowerCase().includes(vertical.toLowerCase()))
    : AD_COPY_POOL;
  const source = pool.length >= count ? pool : AD_COPY_POOL;
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getDummyImages(seed: string, count = 4): string[] {
  return Array.from({ length: count }, (_, i) => `https://picsum.photos/seed/${seed}${i}/640/640`);
}

/* ---------- Aspect ratio presets ----------------------------------- */
export const ASPECT_RATIOS = [
  { label: "1:1", value: "1:1" },
  { label: "4:5", value: "4:5" },
  { label: "9:16", value: "9:16" },
  { label: "16:9", value: "16:9" },
];

export const MODEL_OPTIONS = [
  { label: "Auto", value: "auto" },
  { label: "Fast", value: "fast" },
  { label: "Pro", value: "pro" },
];

/* ---------- Product-driven suggestion chips (base layer) ----------- */
export type SuggestionItem = {
  type: "chip" | "card";
  label: string;
  description?: string;
  promptSnippet: string;
};

export const PRODUCT_SUGGESTIONS: Record<string, SuggestionItem[]> = {
  "Apparel & Footwear": [
    { type: "chip", label: "UGC Style", promptSnippet: "User-generated content style, authentic feel" },
    { type: "chip", label: "Lifestyle Shot", promptSnippet: "Lifestyle setting, model wearing the product naturally" },
    { type: "chip", label: "Product Focus", promptSnippet: "Clean product-centered composition, studio lighting" },
    { type: "chip", label: "Before/After", promptSnippet: "Before and after comparison, transformation angle" },
    { type: "card", label: "Sport Performance", description: "High-energy action shot emphasizing speed & motion", promptSnippet: "Dynamic action shot, motion blur, athletic performance" },
  ],
  "Health & Supplements": [
    { type: "chip", label: "Clean & Minimal", promptSnippet: "Clean white background, minimal composition" },
    { type: "chip", label: "Ingredients Focus", promptSnippet: "Showcase natural ingredients, fresh and organic feel" },
    { type: "chip", label: "Testimonial", promptSnippet: "Social proof style, customer testimonial visual" },
    { type: "chip", label: "Before/After", promptSnippet: "Before and after transformation results" },
    { type: "card", label: "Wellness Lifestyle", description: "Calm, aspirational setting with healthy living vibes", promptSnippet: "Peaceful wellness scene, morning routine, healthy lifestyle" },
  ],
  "Consumer Electronics": [
    { type: "chip", label: "Tech Minimal", promptSnippet: "Sleek product shot, dark background, tech aesthetic" },
    { type: "chip", label: "In Use", promptSnippet: "Person using the device in everyday setting" },
    { type: "chip", label: "Feature Highlight", promptSnippet: "Close-up highlighting key feature, detail shot" },
    { type: "chip", label: "Unboxing", promptSnippet: "Premium unboxing experience, packaging reveal" },
    { type: "card", label: "Futuristic Scene", description: "Bold sci-fi inspired composition with dramatic lighting", promptSnippet: "Futuristic setting, neon lighting, cutting-edge technology feel" },
  ],
  "Beauty & Skincare": [
    { type: "chip", label: "Flat Lay", promptSnippet: "Flat lay composition with complementary textures" },
    { type: "chip", label: "Glow Effect", promptSnippet: "Dewy skin effect, glowing radiant look" },
    { type: "chip", label: "Ingredients", promptSnippet: "Natural ingredients surrounding the product" },
    { type: "chip", label: "Application", promptSnippet: "Close-up of product being applied on skin" },
    { type: "card", label: "Luxury Editorial", description: "High-end magazine feel with rich tones", promptSnippet: "Editorial beauty shot, luxury magazine aesthetic, rich warm tones" },
  ],
  General: [
    { type: "chip", label: "Product Focus", promptSnippet: "Clean product-centered composition" },
    { type: "chip", label: "Lifestyle", promptSnippet: "Natural lifestyle setting, authentic feel" },
    { type: "chip", label: "UGC Style", promptSnippet: "User-generated content style, casual and authentic" },
    { type: "chip", label: "Offer Highlight", promptSnippet: "Emphasis on the deal, discount callout visual" },
    { type: "card", label: "Bold & Eye-catching", description: "High contrast, scroll-stopping visual", promptSnippet: "Bold colors, high contrast, scroll-stopping composition" },
  ],
};

/* ---------- Post-generation iteration suggestions (layer 2) -------- */
export const POST_GEN_SUGGESTIONS: SuggestionItem[] = [
  { type: "chip", label: "Add urgency", promptSnippet: "Add urgency — limited time, scarcity, countdown feel" },
  { type: "chip", label: "Change tone", promptSnippet: "Try a different emotional tone — warmer / bolder / calmer" },
  { type: "chip", label: "Lifestyle angle", promptSnippet: "Switch to a lifestyle angle, person using the product" },
  { type: "chip", label: "Minimal version", promptSnippet: "Simplify — minimal composition, fewer elements" },
];

/* ---------- Tone & Style options ----------------------------------- */
export const TONE_OPTIONS = [
  "Bold", "Friendly", "Luxury", "Minimal", "Urgent", "Playful",
];

export const STYLE_OPTIONS = [
  "Product Focus", "Lifestyle", "Flat Lay", "UGC Style",
];

/* ---------- Credit cost per output per model ----------------------- */
export const CREDIT_PER_OUTPUT: Record<string, number> = {
  auto: 1,
  fast: 1,
  pro: 3,
};

/* ---------- Instant-start examples --------------------------------- */
export const INSTANT_START_EXAMPLES = [
  { label: "Skincare glow ad", prompt: "Dewy skincare ad with soft lighting and glass skin effect", productKeyword: "beauty" },
  { label: "Shoe lifestyle campaign", prompt: "Lifestyle running shoe ad, outdoor action shot, golden hour", productKeyword: "nike" },
  { label: "Tech unboxing reveal", prompt: "Premium tech product unboxing, dark background, dramatic lighting", productKeyword: "gadget" },
  { label: "Supplement trust ad", prompt: "Clean supplement ad with natural ingredients, white background", productKeyword: "supplement" },
];
