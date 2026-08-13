/**
 * Static option lists for the mobile onboarding flow.
 *
 * Copy + ordering lifted verbatim from the web screens so the two surfaces
 * stay recognisably the same product:
 *   COUNTRIES   ← src/onboarding-demo/steps/CountrySelection.tsx
 *   PLATFORMS   ← src/onboarding-demo/steps/AffiliateInput.tsx
 *   INDUSTRIES  ← src/onboarding-demo/steps/AffiliateInput.tsx
 *   ECOM/AFFILIATE_SUMMARY ← src/onboarding-demo/steps/Done.tsx defaults
 *
 * The Insights picker lists are NOT duplicated here — they are imported
 * live from `@/lib/insights-dummy-data` at the point of use, exactly like
 * `src/components/insights/OnboardingModal.tsx` does.
 */
import {
  FileText,
  Instagram,
  Mail,
  Music,
  Pin,
  Twitter,
  Youtube,
} from "lucide-react";
import { DUMMY_ADS } from "@/lib/insights-dummy-data";
import type { MobileCountry } from "./types";

/* 20 markets — same set + ordering as the web CountrySelection step. */
export const COUNTRIES: MobileCountry[] = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "AE", name: "UAE", flag: "🇦🇪" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
];

/** Posting platforms for the affiliate input (multi-select). */
export const AFFILIATE_PLATFORMS: { id: string; icon: typeof Instagram }[] = [
  { id: "Instagram", icon: Instagram },
  { id: "TikTok", icon: Music },
  { id: "YouTube", icon: Youtube },
  { id: "Blog / Website", icon: FileText },
  { id: "Pinterest", icon: Pin },
  { id: "X / Twitter", icon: Twitter },
  { id: "Email", icon: Mail },
];

/** Affiliate industries (single-select). */
export const AFFILIATE_INDUSTRIES = [
  "Insurance",
  "Finance",
  "Health & Wellness",
  "Software / SaaS",
  "Home Services",
  "Education",
  "Travel",
];

/**
 * Brand universe for the Insights "Brands" step — derived the same way as
 * `KNOWN_BRANDS` in `src/components/insights/OnboardingModal.tsx` so the
 * two surfaces offer identical suggestions.
 */
export const KNOWN_BRANDS: string[] = [
  ...new Set(DUMMY_ADS.map((a) => a.brand)),
].sort();

/** Processing stage copy — verbatim from the web Processing step. */
export const PROCESSING_STAGES: Record<"ecom" | "affiliate", string[]> = {
  ecom: [
    "Fetching your inputs",
    "Analyzing brand & style",
    "Preparing templates",
    "Finalizing your brand profile",
  ],
  affiliate: [
    "Fetching your inputs",
    "Analyzing category & competitors",
    "Preparing ad angles",
    "Finalizing your niche profile",
  ],
};

/** Sample "Brand Ready" values — verbatim from the web Done step. */
export const ECOM_SUMMARY = {
  description:
    "Premium everyday apparel made in small batches. Sustainable materials, modern silhouettes, honest pricing.",
  voice: "Friendly · Confident",
  typographyDisplay: "Geist",
  typographyBody: "Geist Mono",
  audiences: "25–40, Urban · Style-forward",
  colors: [
    { hex: "#d8d4cf", name: "Sand" },
    { hex: "#a8a097", name: "Stone" },
    { hex: "#5b5247", name: "Bark" },
    { hex: "#111111", name: "Ink" },
  ],
  competitors: [
    { name: "Aritzia", desc: "Ad creatives · Visual style" },
    { name: "Everlane", desc: "Messaging · Social posts" },
    { name: "Uniqlo", desc: "Promotions · Pricing" },
    { name: "COS", desc: "Visual style · Product launches" },
  ],
};

/** Sample "Category Ready" values — verbatim from the web Done step. */
export const AFFILIATE_SUMMARY = {
  niche: "Insurance",
  description:
    "High-volume affiliate category with rich comparison-shop angles. Regulated content — disclaimers required — but steady CPA payouts and warm-buyer intent.",
  audience: "Homeowners, 30–55 · Cost-sensitive",
  angles: [
    "Price savings",
    "Switching made easy",
    "Customer testimonials",
    "Comparison",
    "Urgency / limited",
  ],
  keywords: [
    "cheap car insurance",
    "compare quotes",
    "switch & save",
    "best rates 2026",
  ],
  competitors: [
    { name: "Progressive", desc: "Ad creatives · Messaging" },
    { name: "GEICO", desc: "Video ads · Humor" },
    { name: "Lemonade", desc: "Social posts · UGC" },
    { name: "State Farm", desc: "Brand ads" },
  ],
};

/** `https://www.foo.com/` → `foo.com`, with a fallback for empty input. */
export function hostnameOf(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  const stripped = url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  return stripped || fallback;
}

/** `aurora-apparel.com` → `Aurora Apparel`. */
export function brandNameFromHost(host: string): string {
  return host
    .replace(/^www\./, "")
    .split(".")[0]
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** `Aurora Apparel` → `AA`. */
export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
