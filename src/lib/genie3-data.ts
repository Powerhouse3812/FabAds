/* ------------------------------------------------------------------ */
/*  Genie 3.0 / 4.0 — Constants, types, dummy data                    */
/* ------------------------------------------------------------------ */

export type IntentType = "creative-image" | "creative-video" | "adcopy";
export type PurposeType = "ecommerce" | "affiliate";
export type EcomFocusType = "product" | "brand" | "asset";

export interface BrandInfo {
  id: string;
  name: string;
  website?: string;
  category?: string;
  industry?: string;
  colors: string[];
  logo_url?: string;
  guidelines?: string;
  tone?: string;
  typography?: string;
}

/* ---------- Step 1 intent cards ------------------------------------ */
export const INTENT_OPTIONS = [
  { value: "creative" as const, label: "Creative (Image/Video)", desc: "Generate ad images or videos", icon: "ImageIcon" },
  { value: "adcopy" as const, label: "Ad Copy", desc: "Full ad copy with creative, headline, text & description", icon: "FileText" },
];

export const CREATIVE_SUB_OPTIONS = [
  { value: "creative-image" as IntentType, label: "Image", icon: "ImageIcon" },
  { value: "creative-video" as IntentType, label: "Video", icon: "Video" },
];

export const PURPOSE_OPTIONS = [
  { value: "ecommerce" as PurposeType, label: "E-commerce", desc: "Sell a specific product or brand", icon: "ShoppingBag" },
  { value: "affiliate" as PurposeType, label: "Affiliate", desc: "Promote an offer, idea, or angle", icon: "Megaphone" },
];

export const ECOM_FOCUS_OPTIONS = [
  { value: "product" as EcomFocusType, label: "Product Ads", desc: "Focus on specific product features, benefits, and USPs" },
  { value: "brand" as EcomFocusType, label: "Brand Ads", desc: "Highlight brand identity, story, and overall value prop" },
  { value: "asset" as EcomFocusType, label: "Product Asset Creative", desc: "Product visuals through multiple creative variations and angles" },
];

/* ---------- Brand categories --------------------------------------- */
export const BRAND_CATEGORIES = [
  "Apparel & Footwear", "Health & Supplements", "Consumer Electronics",
  "Beauty & Skincare", "Food & Beverage", "Home & Living",
  "Finance & Fintech", "Education & Courses", "SaaS & Tech",
  "Automotive", "Travel & Hospitality", "Other",
];

export const BRAND_INDUSTRIES = [
  "Retail", "DTC", "B2B", "Healthcare", "Finance",
  "Technology", "Entertainment", "Real Estate", "Other",
];

/* ---------- Fake brand detection ----------------------------------- */
export function detectBrandFromWebsite(url: string): Partial<BrandInfo> {
  const lower = url.toLowerCase();
  if (lower.includes("nike")) return { name: "Nike", colors: ["#111111", "#FA5400", "#FFFFFF"], tone: "Bold & Motivational", category: "Apparel & Footwear" };
  if (lower.includes("glowskin") || lower.includes("beauty")) return { name: "GlowSkin", colors: ["#F8E8D4", "#C97B63", "#3D2B1F"], tone: "Warm & Luxurious", category: "Beauty & Skincare" };
  if (lower.includes("technova") || lower.includes("tech")) return { name: "TechNova", colors: ["#1A1A2E", "#0F3460", "#E94560"], tone: "Futuristic & Sleek", category: "Consumer Electronics" };
  if (lower.includes("vita") || lower.includes("supplement")) return { name: "VitaBoost", colors: ["#2D8C3C", "#F5A623", "#FAFAFA"], tone: "Trustworthy & Clean", category: "Health & Supplements" };
  return { name: new URL(url).hostname.replace("www.", "").split(".")[0], colors: ["#6366F1", "#EC4899"], tone: "Modern & Friendly", category: "General" };
}

/* ---------- E-commerce scene/mood chips (simplified) --------------- */
export const ECOM_SCENE_CHIPS = ["Studio", "Outdoor", "Lifestyle", "Flat Lay", "In-Use", "Model"];
export const ECOM_MOOD_CHIPS = ["Energetic", "Calm", "Luxurious", "Playful", "Minimalist", "Bold"];
export const ECOM_LIGHTING_CHIPS = ["Natural", "Studio", "Golden Hour", "Neon", "Soft", "Dramatic"];

/* ---------- Video format cards (for video intent) ------------------ */
export const VIDEO_FORMAT_OPTIONS = [
  { value: "ugc", label: "UGC", desc: "User-generated content style" },
  { value: "model_shoot", label: "Model Shoot", desc: "Professional model footage" },
  { value: "product_demo", label: "Product Demo", desc: "Hands-on product demonstration" },
  { value: "testimonial", label: "Testimonial", desc: "Customer review style" },
  { value: "unboxing", label: "Unboxing", desc: "Premium unboxing experience" },
];

/* ---------- Wizard step labels ------------------------------------- */
export const WIZARD_STEPS = [
  { step: 1, label: "Intent" },
  { step: 2, label: "Context" },
  { step: 3, label: "Generate" },
];
