/**
 * Launch v2 mock data — objective/format/bid labels, sources, targeting
 * templates. Reuses launch2's mock ad-accounts + creatives (same app, no point
 * re-authoring) and maps them to the v2 shapes.
 */
import { MOCK_ACCOUNTS } from "@/launch2/data/mockData";
import { MOCK_CREATIVES } from "@/launch2/data/mockCreatives";
import type {
  AdFormat,
  BidStrategy,
  CreativeRef,
  DestinationType,
  Intent,
  Objective,
  SourceType,
  SpecialAdCategory,
  SpreadMode,
  TargetPair,
} from "./types";

/* ---- Step 1 reducer options ---- */
export const INTENTS: { id: Intent; label: string; blurb: string }[] = [
  { id: "test", label: "Test", blurb: "Clean per-creative reads · ABO · 1 creative / ad set" },
  { id: "scale", label: "Scale", blurb: "Let Meta optimize · CBO · Advantage+ · stacked" },
  { id: "custom", label: "Custom", blurb: "Full manual control — no preset" },
];

export const OBJECTIVES: { id: Objective; label: string; desc: string }[] = [
  { id: "OUTCOME_AWARENESS", label: "Awareness", desc: "Be remembered by the most people." },
  { id: "OUTCOME_TRAFFIC", label: "Traffic", desc: "Send people to a destination." },
  { id: "OUTCOME_ENGAGEMENT", label: "Engagement", desc: "Messages, video views, post engagement." },
  { id: "OUTCOME_LEADS", label: "Leads", desc: "Collect leads for your business." },
  { id: "OUTCOME_APP_PROMOTION", label: "App promotion", desc: "Drive installs / app events." },
  { id: "OUTCOME_SALES", label: "Sales", desc: "Find people likely to purchase." },
];

export const FORMATS: { id: AdFormat; label: string }[] = [
  { id: "single_image", label: "Single image" },
  { id: "single_video", label: "Video" },
  { id: "carousel", label: "Carousel" },
  { id: "collection", label: "Collection" },
  { id: "flexible", label: "Flexible" },
  { id: "dpa", label: "Catalogue (DPA)" },
];

export const SOURCES: { id: SourceType; label: string }[] = [
  { id: "url", label: "URL" },
  { id: "library", label: "Library" },
  { id: "upload", label: "Upload" },
  { id: "genie", label: "Genie" },
  { id: "drive", label: "Google Drive" },
  { id: "reports", label: "Reports" },
];

/** UI label for each canonical bid-strategy enum (2026 names). */
export const BID_LABELS: Record<BidStrategy, string> = {
  LOWEST_COST_WITHOUT_CAP: "Highest volume",
  COST_CAP: "Cost per result goal",
  LOWEST_COST_WITH_BID_CAP: "Bid cap",
  LOWEST_COST_WITH_MIN_ROAS: "ROAS goal",
  HIGHEST_VALUE: "Highest value",
};

export const SPREAD_LABELS: Record<SpreadMode, string> = {
  one_per_adset: "One per ad set (1:1)",
  round_robin: "Round-robin",
  stacked: "Stacked",
  multiply: "Multiply",
  manual: "Manual",
};

export const SPECIAL_CATEGORIES: { id: SpecialAdCategory; label: string }[] = [
  { id: "HOUSING", label: "Housing" },
  { id: "EMPLOYMENT", label: "Employment" },
  { id: "FINANCIAL_PRODUCTS_SERVICES", label: "Financial products & services" },
  { id: "ISSUES_ELECTIONS_POLITICS", label: "Social issues, elections or politics" },
];

/* ---- Targeting templates (the only template type) ---- */
export interface TargetingTemplateV2 {
  id: string;
  name: string;
  /** Minimal summary chips shown inline. */
  summary: string[];
  advantageAudience: boolean;
  advantageCreative: boolean;
  /** Per-template conversion location — drives the cascade when this template is selected. */
  destinationType: DestinationType;
  /** Ad-set-level settings (kept light for the mock). */
  settings: {
    locations: string;
    ageMin: number;
    ageMax: number;
    gender: "all" | "men" | "women";
    placements: "advantage" | "manual";
    detailedTargeting: string[];
    exclusions: string[];
  };
}

export const TARGETING_TEMPLATES: TargetingTemplateV2[] = [
  {
    id: "tpl_us_broad",
    name: "US Broad",
    summary: ["US", "18–65", "Advantage+ Audience", "Auto placements"],
    advantageAudience: true,
    advantageCreative: true,
    destinationType: "WEBSITE",
    settings: { locations: "United States", ageMin: 18, ageMax: 65, gender: "all", placements: "advantage", detailedTargeting: [], exclusions: ["Purchasers (90d)"] },
  },
  {
    id: "tpl_lal1",
    name: "Lookalike 1% (Purchasers)",
    summary: ["US", "18–54", "LAL 1%", "Advantage+ Creative"],
    advantageAudience: true,
    advantageCreative: true,
    destinationType: "WEBSITE",
    settings: { locations: "United States", ageMin: 18, ageMax: 54, gender: "all", placements: "advantage", detailedTargeting: ["Lookalike 1% – Purchasers"], exclusions: [] },
  },
  {
    id: "tpl_in_metro",
    name: "India Metros — Engaged",
    summary: ["India metros", "18–35", "Manual placements"],
    advantageAudience: false,
    advantageCreative: true,
    destinationType: "WEBSITE",
    settings: { locations: "Delhi, Mumbai, Bangalore", ageMin: 18, ageMax: 35, gender: "all", placements: "manual", detailedTargeting: ["Engaged shoppers"], exclusions: [] },
  },
];

export function getTemplate(id: string | null): TargetingTemplateV2 | undefined {
  return id ? TARGETING_TEMPLATES.find((t) => t.id === id) : undefined;
}

/* ---- Reuse launch2 accounts/pages/creatives ---- */
export const ACCOUNTS = MOCK_ACCOUNTS;

export function makeTargetV2(accountId: string, pageId: string): TargetPair | null {
  const acc = MOCK_ACCOUNTS.find((a) => a.id === accountId);
  const pg = acc?.pages.find((p) => p.id === pageId);
  if (!acc || !pg) return null;
  return {
    accountId: acc.id,
    accountName: acc.name,
    currency: acc.currency,
    pageId: pg.id,
    fbPageId: pg.fbPageId,
    pageName: pg.name,
    pixelId: acc.pixels[0]?.id,
  };
}

/** Current active ads on a page (for the 250-cap meter). */
export function pageActiveAds(fbPageId: string): number {
  for (const a of MOCK_ACCOUNTS) {
    const pg = a.pages.find((p) => p.fbPageId === fbPageId);
    if (pg) return pg.activeAds;
  }
  return 0;
}

export const CREATIVES: CreativeRef[] = MOCK_CREATIVES.map((c) => ({
  id: c.id,
  name: c.name,
  format: c.type === "carousel" ? "carousel" : c.type === "video" ? "single_video" : c.type === "dpa" ? "dpa" : "single_image",
  source: c.source === "post" ? "library" : (c.source as SourceType),
  thumbnail: c.thumbnail,
}));

export function creativesForFormat(format: AdFormat | null): CreativeRef[] {
  if (!format) return CREATIVES;
  if (format === "dpa") return CREATIVES.filter((c) => c.format === "dpa");
  if (format === "single_video") return CREATIVES.filter((c) => c.format === "single_video");
  if (format === "carousel") return CREATIVES.filter((c) => c.format === "carousel" || c.format === "single_image");
  return CREATIVES.filter((c) => c.format !== "dpa");
}
