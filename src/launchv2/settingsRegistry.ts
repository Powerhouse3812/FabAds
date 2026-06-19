/**
 * settingsRegistry — the data contract for the Review master-detail editor.
 *
 * Catalogs the Meta settings exposed at each hierarchy level, split into
 * COMMON (rendered inline in the edit pane) vs ADVANCED (opened in a modal via a
 * per-section action). Each field has a stable `id` that doubles as the
 * NodeOverride key (see nodeOverrides.ts) and a `planKey` resolver used to read
 * the inherited plan-level default.
 *
 *  • Account level  → OUR launch settings (pages, pixel) — not Meta's.
 *  • Campaign / Ad set / Ad → Meta's real fields, canonical enums.
 *
 * The catalog is intentionally extensible — advanced fields can be appended per
 * section without touching the editor (the UI renders generically from `kind`).
 * Source: Meta Marketing API (ads_create_campaign / _ad_set / _ad / _creative).
 */
import type { NodeKind } from "./screens/review/reviewModel";
import type { PlanV2 } from "./types";

export type FieldKind =
  | "text"
  | "textarea"
  | "number"
  | "money"
  | "select"
  | "toggle"
  | "segmented"
  | "multitext" // up to `max` text options (Advantage+ creative)
  | "placements" // the manual placement tree (custom renderer)
  | "crop" // per-placement asset customization matrix (custom renderer)
  | "tags"
  | "url"
  | "readonly";

export interface FieldOption {
  value: string;
  label: string;
}

export interface SettingField {
  /** stable id; also the NodeOverride key. */
  id: string;
  label: string;
  kind: FieldKind;
  tier: "common" | "advanced";
  /** section id this field groups under (within pane or modal). */
  section: string;
  help?: string;
  options?: FieldOption[];
  /** money/number affordances. */
  unitPrefix?: string;
  max?: number;
  min?: number;
  /** dot/simple path into PlanV2 for the inherited default value. */
  planKey?: string;
  /** when false → field hidden for this plan (cascade). */
  visibleWhen?: (plan: PlanV2) => boolean;
  /** when true → field shown but locked (cascade), with `lockReason`. */
  lockedWhen?: (plan: PlanV2) => boolean;
  lockReason?: string;
}

export interface SectionDef {
  id: string;
  label: string;
}

export interface LevelRegistry {
  level: NodeKind;
  /** ordered sections (each may contain common + advanced fields). */
  sections: SectionDef[];
  fields: SettingField[];
}

/* ------------------------------------------------------------------ */
/*  Shared option sets                                                 */
/* ------------------------------------------------------------------ */

export const CTA_OPTIONS: FieldOption[] = [
  { value: "LEARN_MORE", label: "Learn more" },
  { value: "SHOP_NOW", label: "Shop now" },
  { value: "BUY_NOW", label: "Buy now" },
  { value: "SIGN_UP", label: "Sign up" },
  { value: "BOOK_NOW", label: "Book now" },
  { value: "GET_OFFER", label: "Get offer" },
  { value: "DOWNLOAD", label: "Download" },
  { value: "SUBSCRIBE", label: "Subscribe" },
  { value: "CONTACT_US", label: "Contact us" },
  { value: "APPLY_NOW", label: "Apply now" },
  { value: "GET_QUOTE", label: "Get quote" },
  { value: "SEND_MESSAGE", label: "Send message" },
  { value: "WHATSAPP_MESSAGE", label: "WhatsApp message" },
  { value: "CALL_NOW", label: "Call now" },
  { value: "DONATE_NOW", label: "Donate now" },
  { value: "WATCH_MORE", label: "Watch more" },
  { value: "INSTALL_APP", label: "Install app" },
];

export const BID_STRATEGY_OPTIONS: FieldOption[] = [
  { value: "LOWEST_COST_WITHOUT_CAP", label: "Highest volume (default)" },
  { value: "COST_CAP", label: "Cost per result goal" },
  { value: "LOWEST_COST_WITH_BID_CAP", label: "Bid cap" },
  { value: "LOWEST_COST_WITH_MIN_ROAS", label: "ROAS goal" },
  { value: "HIGHEST_VALUE", label: "Highest value" },
];

export const OPT_GOAL_OPTIONS: FieldOption[] = [
  { value: "REACH", label: "Reach" },
  { value: "IMPRESSIONS", label: "Impressions" },
  { value: "LINK_CLICKS", label: "Link clicks" },
  { value: "LANDING_PAGE_VIEWS", label: "Landing page views" },
  { value: "OFFSITE_CONVERSIONS", label: "Conversions" },
  { value: "VALUE", label: "Value" },
  { value: "LEAD_GENERATION", label: "Leads" },
  { value: "QUALITY_LEAD", label: "Quality leads" },
  { value: "THRUPLAY", label: "ThruPlay" },
  { value: "POST_ENGAGEMENT", label: "Post engagement" },
  { value: "CONVERSATIONS", label: "Conversations" },
  { value: "APP_INSTALLS", label: "App installs" },
];

export const ATTRIBUTION_OPTIONS: FieldOption[] = [
  { value: "1d_click", label: "1-day click" },
  { value: "7d_click", label: "7-day click" },
  { value: "7d_click_1d_view", label: "7-day click + 1-day view (default)" },
];

export const BILLING_EVENT_OPTIONS: FieldOption[] = [
  { value: "IMPRESSIONS", label: "Impressions" },
  { value: "LINK_CLICKS", label: "Link clicks" },
  { value: "POST_ENGAGEMENT", label: "Post engagement" },
  { value: "VIDEO_VIEWS", label: "Video views" },
];

export const DELIVERY_OPTIONS: FieldOption[] = [
  { value: "standard", label: "Standard" },
  { value: "day_parting", label: "Scheduled (dayparting)" },
  { value: "no_pacing", label: "Accelerated" },
];

export const CONVERSION_LOCATION_OPTIONS: FieldOption[] = [
  { value: "WEBSITE", label: "Website" },
  { value: "APP", label: "App" },
  { value: "MESSENGER", label: "Messenger" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "INSTAGRAM_DIRECT", label: "Instagram Direct" },
  { value: "PHONE_CALL", label: "Calls" },
  { value: "ON_AD", label: "Instant form" },
];

/* ------------------------------------------------------------------ */
/*  CAMPAIGN level (Meta)                                              */
/* ------------------------------------------------------------------ */

const CAMPAIGN: LevelRegistry = {
  level: "campaign",
  sections: [
    { id: "budget", label: "Campaign" },
  ],
  fields: [
    {
      id: "campaignName",
      label: "Campaign name",
      kind: "text",
      tier: "common",
      section: "budget",
      planKey: "name",
    },
    {
      id: "budgetMode",
      label: "Budget optimization",
      kind: "segmented",
      tier: "common",
      section: "budget",
      planKey: "budgetMode",
      options: [
        { value: "CBO", label: "Campaign (CBO)" },
        { value: "ABO", label: "Ad set (ABO)" },
      ],
    },
    // visibility/lock now resolved per-node in screens/review/fieldGating.ts
    {
      id: "budgetAmount",
      label: "Daily budget",
      kind: "money",
      tier: "common",
      section: "budget",
      planKey: "budgetAmount",
      min: 1,
    },
    {
      id: "advantagePlus",
      label: "Advantage+ campaign",
      kind: "toggle",
      tier: "common",
      section: "budget",
      planKey: "advantagePlus",
    },
    {
      id: "abTest",
      label: "A/B test",
      kind: "toggle",
      tier: "common",
      section: "budget",
      planKey: "abTest",
      help: "Meta auto-splits traffic 50/50 between two variants.",
    },
    {
      id: "bidStrategy",
      label: "Bid strategy",
      kind: "select",
      tier: "common",
      section: "budget",
      planKey: "bidStrategy",
      options: BID_STRATEGY_OPTIONS,
    },
    {
      id: "bidValue",
      label: "Bid / cost cap",
      kind: "money",
      tier: "advanced",
      section: "budget",
      planKey: "bidValue",
      visibleWhen: (p) =>
        p.bidStrategy === "COST_CAP" ||
        p.bidStrategy === "LOWEST_COST_WITH_BID_CAP" ||
        p.bidStrategy === "LOWEST_COST_WITH_MIN_ROAS",
    },
    {
      id: "spendCap",
      label: "Campaign spending limit",
      kind: "money",
      tier: "advanced",
      section: "budget",
    },
    {
      id: "specialAdCategories",
      label: "Special ad categories",
      kind: "tags",
      tier: "advanced",
      section: "budget",
      planKey: "specialAdCategories",
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  AD SET level (Meta) — the densest level                            */
/* ------------------------------------------------------------------ */

const ADSET: LevelRegistry = {
  level: "adset",
  sections: [
    { id: "budget", label: "Budget & schedule" },
    { id: "conversion", label: "Conversion" },
    { id: "audience", label: "Audience" },
    { id: "placements", label: "Placements" },
    { id: "optimization", label: "Optimization & delivery" },
    { id: "advanced", label: "Advanced" },
  ],
  fields: [
    // Budget & schedule
    // visibility/lock now resolved per-node in screens/review/fieldGating.ts
    {
      id: "dailyBudget",
      label: "Daily budget",
      kind: "money",
      tier: "common",
      section: "budget",
      planKey: "budgetAmount",
      min: 1,
    },
    { id: "startTime", label: "Start time", kind: "text", tier: "advanced", section: "budget" },
    { id: "endTime", label: "End time", kind: "text", tier: "advanced", section: "budget" },
    {
      id: "dayparting",
      label: "Ad scheduling (dayparting)",
      kind: "toggle",
      tier: "advanced",
      section: "budget",
      help: "Run only on chosen days / hours.",
    },
    // Conversion
    {
      id: "destinationType",
      label: "Conversion location",
      kind: "select",
      tier: "common",
      section: "conversion",
      planKey: "destinationType",
      options: CONVERSION_LOCATION_OPTIONS,
    },
    {
      id: "optimizationGoal",
      label: "Performance goal",
      kind: "select",
      tier: "common",
      section: "conversion",
      planKey: "optimizationGoal",
      options: OPT_GOAL_OPTIONS,
    },
    // visibility/lock now resolved per-node in screens/review/fieldGating.ts
    {
      id: "conversionEvent",
      label: "Conversion event",
      kind: "text",
      tier: "common",
      section: "conversion",
      planKey: "conversionEvent",
    },
    {
      id: "attribution",
      label: "Attribution setting",
      kind: "select",
      tier: "advanced",
      section: "conversion",
      planKey: "attribution",
      options: ATTRIBUTION_OPTIONS,
    },
    // Audience
    {
      id: "targetingTemplateId",
      label: "Targeting template",
      kind: "select",
      tier: "common",
      section: "audience",
      planKey: "targetingTemplateId",
    },
    {
      id: "advantageAudience",
      label: "Advantage+ Audience",
      kind: "toggle",
      tier: "common",
      section: "audience",
      planKey: "advantageAudience",
      help: "Start broad; Meta finds buyers.",
    },
    { id: "ageMin", label: "Min age", kind: "number", tier: "advanced", section: "audience", min: 13, max: 65 },
    { id: "ageMax", label: "Max age", kind: "number", tier: "advanced", section: "audience", min: 13, max: 65 },
    {
      id: "genders",
      label: "Gender",
      kind: "segmented",
      tier: "advanced",
      section: "audience",
      options: [
        { value: "all", label: "All" },
        { value: "male", label: "Men" },
        { value: "female", label: "Women" },
      ],
    },
    { id: "detailedTargeting", label: "Detailed targeting (interests / behaviors)", kind: "tags", tier: "advanced", section: "audience" },
    { id: "excludedAudiences", label: "Audience exclusions", kind: "tags", tier: "advanced", section: "audience" },
    { id: "locales", label: "Languages", kind: "tags", tier: "advanced", section: "audience" },
    // Placements
    {
      id: "placementMode",
      label: "Placements",
      kind: "segmented",
      tier: "common",
      section: "placements",
      planKey: "placementMode",
      options: [
        { value: "advantage", label: "Advantage+ (automatic)" },
        { value: "manual", label: "Manual" },
      ],
    },
    // visibility/lock now resolved per-node in screens/review/fieldGating.ts
    {
      id: "placements",
      label: "Manual placements",
      kind: "placements",
      tier: "common",
      section: "placements",
      planKey: "placements",
    },
    { id: "devicePlatforms", label: "Devices", kind: "segmented", tier: "advanced", section: "placements", options: [
      { value: "all", label: "All" },
      { value: "mobile", label: "Mobile" },
      { value: "desktop", label: "Desktop" },
    ] },
    // Optimization & delivery
    {
      id: "billingEvent",
      label: "Billing event",
      kind: "select",
      tier: "advanced",
      section: "optimization",
      options: BILLING_EVENT_OPTIONS,
    },
    {
      id: "deliveryType",
      label: "Delivery type",
      kind: "select",
      tier: "advanced",
      section: "optimization",
      options: DELIVERY_OPTIONS,
    },
    {
      id: "isDynamicCreative",
      label: "Dynamic creative",
      kind: "toggle",
      tier: "advanced",
      section: "optimization",
      help: "Meta mixes assets into combinations.",
    },
    {
      id: "adsPerAdSet",
      label: "Ads in this ad set",
      kind: "number",
      tier: "common",
      section: "optimization",
      planKey: "structure.adsPerAdSet",
      min: 1,
      help: "Override the number of ads launched into this specific ad set.",
    },
    { id: "frequencyCap", label: "Frequency cap", kind: "text", tier: "advanced", section: "advanced" },
  ],
};

/* ------------------------------------------------------------------ */
/*  AD level (Meta)                                                    */
/* ------------------------------------------------------------------ */

const AD: LevelRegistry = {
  level: "ad",
  sections: [
    { id: "identity", label: "Identity" },
    { id: "content", label: "Ad content" },
    { id: "destination", label: "Destination" },
    { id: "media", label: "Media & placements" },
    { id: "tracking", label: "Tracking" },
  ],
  fields: [
    { id: "pageName", label: "Facebook Page", kind: "readonly", tier: "common", section: "identity" },
    { id: "instagramAccount", label: "Instagram account", kind: "text", tier: "advanced", section: "identity" },
    // Content (multi-text, gated by the Advantage+ creative toggle in the form)
    {
      id: "primaryText",
      label: "Primary text",
      kind: "multitext",
      tier: "common",
      section: "content",
      planKey: "adCopy.primaryText",
      max: 5,
    },
    {
      id: "headline",
      label: "Headline",
      kind: "multitext",
      tier: "common",
      section: "content",
      planKey: "adCopy.headline",
      max: 5,
    },
    {
      id: "description",
      label: "Description",
      kind: "multitext",
      tier: "advanced",
      section: "content",
      planKey: "adCopy.description",
      max: 5,
    },
    {
      id: "cta",
      label: "Call to action",
      kind: "select",
      tier: "common",
      section: "content",
      planKey: "adCopy.cta",
      options: CTA_OPTIONS,
    },
    // Destination
    {
      id: "destinationUrl",
      label: "Website URL",
      kind: "url",
      tier: "common",
      section: "destination",
      planKey: "adCopy.destinationUrl",
      visibleWhen: (p) => p.format !== "collection",
    },
    {
      id: "displayLink",
      label: "Display link",
      kind: "url",
      tier: "advanced",
      section: "destination",
      planKey: "adCopy.displayLink",
    },
    // Media & placements
    {
      id: "__assetCustomization",
      label: "Customize media per placement",
      kind: "crop",
      tier: "advanced",
      section: "media",
      help: "Different crop / asset per Feed, Stories & Reels, In-stream.",
    },
    // Tracking
    {
      id: "utmTemplate",
      label: "URL parameters (UTM)",
      kind: "text",
      tier: "advanced",
      section: "tracking",
      planKey: "adCopy.utmTemplate",
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  ACCOUNT level — OUR launch settings (not Meta)                     */
/* ------------------------------------------------------------------ */

const ACCOUNT: LevelRegistry = {
  level: "account",
  sections: [{ id: "destination", label: "Account & page" }],
  fields: [
    { id: "accountName", label: "Ad account", kind: "readonly", tier: "common", section: "destination" },
    { id: "pageName", label: "Facebook Page", kind: "readonly", tier: "common", section: "destination" },
    { id: "pixelId", label: "Pixel / dataset", kind: "text", tier: "common", section: "destination" },
    { id: "currency", label: "Currency", kind: "readonly", tier: "common", section: "destination" },
  ],
};

export const SETTINGS_REGISTRY: Record<NodeKind, LevelRegistry> = {
  account: ACCOUNT,
  campaign: CAMPAIGN,
  adset: ADSET,
  ad: AD,
};

/** Read the inherited plan-level default for a field (supports "adCopy.x" paths). */
export function planDefaultFor(plan: PlanV2, field: SettingField): unknown {
  if (!field.planKey) return undefined;
  if (field.planKey.includes(".")) {
    const [head, tail] = field.planKey.split(".");
    const obj = (plan as unknown as Record<string, unknown>)[head];
    if (obj && typeof obj === "object") return (obj as Record<string, unknown>)[tail];
    return undefined;
  }
  return (plan as unknown as Record<string, unknown>)[field.planKey];
}

/** Common (inline) fields for a level, honoring cascade visibility. */
export function commonFields(level: NodeKind, plan: PlanV2): SettingField[] {
  return SETTINGS_REGISTRY[level].fields.filter(
    (f) => f.tier === "common" && (!f.visibleWhen || f.visibleWhen(plan)),
  );
}

/** Advanced fields for a level (for the modal), grouped consumers can use `section`. */
export function advancedFields(level: NodeKind, plan: PlanV2): SettingField[] {
  return SETTINGS_REGISTRY[level].fields.filter(
    (f) => f.tier === "advanced" && (!f.visibleWhen || f.visibleWhen(plan)),
  );
}

/** All fields for a level honoring cascade visibility. */
export function levelFields(level: NodeKind, plan: PlanV2): SettingField[] {
  return SETTINGS_REGISTRY[level].fields.filter(
    (f) => !f.visibleWhen || f.visibleWhen(plan),
  );
}
