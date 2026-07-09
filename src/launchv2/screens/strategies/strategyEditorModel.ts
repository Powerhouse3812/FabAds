/**
 * Launch v2 — Strategy editor MODEL layer (pure, no React).
 *
 * Single source of truth for the strategy editor's options, label helpers,
 * topic sections, completion logic and summary-chip building. A sibling
 * editor component imports from here; the public API in this file is
 * contractual (other agents code against these signatures).
 *
 * Label strings are pulled from `../../data.ts` (OBJECTIVES, INTENTS, FORMATS,
 * BID_LABELS, SPREAD_LABELS, SPECIAL_CATEGORIES) where they already exist;
 * only the strings that don't live there (budget mode, page-split, attribution)
 * are declared locally to keep one canonical source.
 */
import type {
  PlanV2,
  Objective,
  Intent,
  AdFormat,
  BudgetMode,
  BidStrategy,
  SpreadMode,
  PageDistribution,
  AttributionWindow,
  SpecialAdCategory,
} from "../../types";
import {
  OBJECTIVES,
  INTENTS,
  FORMATS,
  BID_LABELS,
  SPREAD_LABELS,
  SPECIAL_CATEGORIES,
} from "../../data";
import type { LaunchStrategy } from "../../services/strategiesService";

export interface OptionItem<T = string> {
  value: T;
  label: string;
}

/* ------------------------------------------------------------------ */
/*  Option lists                                                        */
/* ------------------------------------------------------------------ */

/** 6 objectives in canonical order — labels reused from data.ts OBJECTIVES. */
export const OBJECTIVE_OPTIONS: OptionItem<Objective>[] = OBJECTIVES.map((o) => ({
  value: o.id,
  label: o.label,
}));

/** test / scale / custom — labels reused from data.ts INTENTS. */
export const INTENT_OPTIONS: OptionItem<Intent>[] = INTENTS.map((i) => ({
  value: i.id,
  label: i.label,
}));

/** Ad formats — labels reused from data.ts FORMATS. */
export const FORMAT_OPTIONS: OptionItem<AdFormat>[] = FORMATS.map((f) => ({
  value: f.id,
  label: f.label,
}));

/** Budget mode — labels declared here (not in data.ts). */
export const BUDGET_MODE_OPTIONS: OptionItem<BudgetMode>[] = [
  { value: "CBO", label: "Campaign (CBO)" },
  { value: "ABO", label: "Ad set (ABO)" },
];

/** 5 bid strategies — labels reused from data.ts BID_LABELS. */
export const BID_OPTIONS: OptionItem<BidStrategy>[] = (
  Object.keys(BID_LABELS) as BidStrategy[]
).map((value) => ({ value, label: BID_LABELS[value] }));

/** Creative→ad-set spread modes — labels reused from data.ts SPREAD_LABELS. */
export const SPREAD_OPTIONS: OptionItem<SpreadMode>[] = (
  Object.keys(SPREAD_LABELS) as SpreadMode[]
).map((value) => ({ value, label: SPREAD_LABELS[value] }));

/** Page-split (ad→page) modes — labels declared here. */
export const PAGE_SPLIT_OPTIONS: OptionItem<PageDistribution>[] = [
  { value: "fill_first", label: "Fill first" },
  { value: "equal", label: "Equal" },
  { value: "one_page", label: "One page" },
  { value: "duplicate", label: "Duplicate" },
  { value: "custom", label: "Custom" },
];

/** Attribution windows — labels declared here. */
export const ATTRIBUTION_OPTIONS: OptionItem<AttributionWindow>[] = [
  { value: "1d_click", label: "1-day click" },
  { value: "7d_click", label: "7-day click" },
  { value: "7d_click_1d_view", label: "7-day click + 1-day view" },
];

/** Special ad categories — labels reused from data.ts SPECIAL_CATEGORIES. */
export const SPECIAL_CATEGORY_OPTIONS: OptionItem<SpecialAdCategory>[] =
  SPECIAL_CATEGORIES.map((c) => ({ value: c.id, label: c.label }));

/** Destination type options. */
export const DESTINATION_TYPE_OPTIONS: OptionItem[] = [
  { value: "WEBSITE", label: "Website" },
  { value: "APP", label: "App" },
  { value: "MESSENGER", label: "Messenger" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "INSTAGRAM_DIRECT", label: "Instagram DM" },
  { value: "ON_AD", label: "Instant Form / On-ad" },
  { value: "PHONE_CALL", label: "Phone Call" },
];

/** Optimization goal options. */
export const OPTIMIZATION_GOAL_OPTIONS: OptionItem[] = [
  { value: "OFFSITE_CONVERSIONS", label: "Conversions" },
  { value: "LINK_CLICKS", label: "Link clicks" },
  { value: "LANDING_PAGE_VIEWS", label: "Landing page views" },
  { value: "REACH", label: "Reach" },
  { value: "IMPRESSIONS", label: "Impressions" },
  { value: "VALUE", label: "Value (ROAS)" },
  { value: "LEAD_GENERATION", label: "Lead generation" },
  { value: "POST_ENGAGEMENT", label: "Post engagement" },
  { value: "VIDEO_VIEWS", label: "Video views" },
  { value: "APP_INSTALLS", label: "App installs" },
];

/** Budget period options. */
export const BUDGET_PERIOD_OPTIONS: OptionItem[] = [
  { value: "daily", label: "Daily" },
  { value: "lifetime", label: "Lifetime" },
];

/** Account distribution options. */
export const ACCOUNT_DISTRIBUTION_OPTIONS: OptionItem[] = [
  { value: "equal", label: "Equal split" },
  { value: "duplicate", label: "Duplicate all" },
  { value: "custom", label: "Custom weights" },
];

/** CTA options (from settingsRegistry — most complete list). */
export const CTA_OPTIONS: OptionItem[] = [
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
  { value: "WHATSAPP_MESSAGE", label: "WhatsApp" },
  { value: "CALL_NOW", label: "Call now" },
  { value: "DONATE_NOW", label: "Donate now" },
  { value: "WATCH_MORE", label: "Watch more" },
  { value: "INSTALL_APP", label: "Install app" },
];

/** Placement mode options. */
export const PLACEMENT_MODE_OPTIONS: OptionItem[] = [
  { value: "advantage", label: "Advantage+ placements (Auto)" },
  { value: "manual", label: "Manual placements" },
];

/* ------------------------------------------------------------------ */
/*  Label helpers                                                       */
/* ------------------------------------------------------------------ */

const EM_DASH = "—";

function lookup<T extends string>(options: OptionItem<T>[], v: T | null | undefined): string {
  if (v == null) return EM_DASH;
  return options.find((o) => o.value === v)?.label ?? EM_DASH;
}

export function objectiveLabel(v?: Objective | null): string {
  return lookup(OBJECTIVE_OPTIONS, v);
}
export function intentLabel(v?: Intent | null): string {
  return lookup(INTENT_OPTIONS, v);
}
export function formatLabel(v?: AdFormat | null): string {
  return lookup(FORMAT_OPTIONS, v);
}
export function spreadLabel(v?: SpreadMode): string {
  return lookup(SPREAD_OPTIONS, v);
}
export function pageSplitLabel(v?: PageDistribution): string {
  return lookup(PAGE_SPLIT_OPTIONS, v);
}
export function bidLabel(v?: BidStrategy): string {
  return lookup(BID_OPTIONS, v);
}

/* ------------------------------------------------------------------ */
/*  Currency + budget                                                   */
/* ------------------------------------------------------------------ */

/** Same map used by strategiesService.ts CURRENCY_SYMBOLS. */
const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
};

export function currencySymbol(plan: Partial<PlanV2>): string {
  const code = plan.targets?.[0]?.currency;
  if (!code) return "₹";
  return CURRENCY_SYMBOLS[code] ?? `${code} `;
}

export function formatBudget(plan: Partial<PlanV2>): string {
  const amount = plan.budgetAmount;
  if (!amount) return EM_DASH;
  return `${currencySymbol(plan)}${Math.round(amount).toLocaleString("en-IN")}/day`;
}

/* ------------------------------------------------------------------ */
/*  Topic sections                                                      */
/* ------------------------------------------------------------------ */

export type SectionId =
  | "objective"
  | "creative"
  | "conversion"
  | "budget"
  | "audience"
  | "placements"
  | "accounts"
  | "structure"
  | "distribution"
  | "scheduling"
  | "attribution"
  | "naming"
  | "special";

export interface TopicSection {
  id: SectionId;
  label: string;
  required: boolean;
}

export const TOPIC_SECTIONS: TopicSection[] = [
  { id: "objective",    label: "Objective & intent",   required: true },
  { id: "creative",     label: "Creative & copy",       required: false },
  { id: "conversion",   label: "Conversion & pixel",    required: false },
  { id: "budget",       label: "Budget & bidding",      required: true },
  { id: "audience",     label: "Audience",              required: false },
  { id: "placements",   label: "Placements",            required: false },
  { id: "accounts",     label: "Accounts & pages",      required: false },
  { id: "structure",    label: "Structure",             required: false },
  { id: "distribution", label: "Distribution",          required: false },
  { id: "scheduling",   label: "Scheduling",            required: false },
  { id: "attribution",  label: "Attribution",           required: false },
  { id: "naming",       label: "Naming",                required: false },
  { id: "special",      label: "Special categories",    required: false },
];

/* ------------------------------------------------------------------ */
/*  Structure totals                                                    */
/* ------------------------------------------------------------------ */

export function structureTotals(plan: Partial<PlanV2>): {
  campaigns: number;
  adSets: number;
  ads: number;
} {
  const s = plan.structure;
  if (!s) return { campaigns: 0, adSets: 0, ads: 0 };
  const campaigns = s.campaigns || 0;
  const adSets = campaigns * (s.adSetsPerCampaign || 0);
  const ads = adSets * (s.adsPerAdSet || 0);
  return { campaigns, adSets, ads };
}

/* ------------------------------------------------------------------ */
/*  Preset / completion logic                                           */
/* ------------------------------------------------------------------ */

export function isSectionPreset(strategy: LaunchStrategy, id: SectionId): boolean {
  if ((strategy.askAtLaunch ?? []).includes(id)) return false;
  const plan = strategy.plan;
  switch (id) {
    case "objective":
      return !!plan.objective;
    case "creative":
      return !!(plan.format || plan.adCopy?.primaryText);
    case "conversion":
      return !!(plan.optimizationGoal || plan.destinationType);
    case "budget":
      return (plan.budgetAmount ?? 0) > 0;
    case "audience":
      return !!(plan.targetingTemplateId || plan.advantageAudience || plan.useCustomAudience);
    case "placements":
      return !!plan.placementMode;
    case "accounts":
      return (plan.targets?.length ?? 0) > 0;
    case "structure":
      return !!plan.structure;
    case "distribution":
      return !!(plan.spread || plan.pageDistribution);
    case "scheduling":
      return !!plan.scheduledFor;
    case "attribution":
      return !!plan.attribution;
    case "naming":
      return !!(plan.namingPatterns?.campaign || plan.namingPattern);
    case "special":
      return (plan.specialAdCategories?.length ?? 0) > 0;
    default:
      return false;
  }
}

export interface StepCompletion {
  step1: boolean;
  step2: boolean;
  step3: boolean;
  step4: boolean;
}

export function stepCompletion(strategy: LaunchStrategy): StepCompletion {
  const step1 = isSectionPreset(strategy, "objective");
  const step2 =
    isSectionPreset(strategy, "budget") && isSectionPreset(strategy, "accounts");
  const step3 =
    isSectionPreset(strategy, "structure") && isSectionPreset(strategy, "distribution");
  const step4 = step1 && step2 && step3;
  return { step1, step2, step3, step4 };
}

/* ------------------------------------------------------------------ */
/*  Summary chips (kept for backwards compat)                          */
/* ------------------------------------------------------------------ */

export interface SummaryChip {
  sectionId: SectionId;
  text: string;
  muted?: boolean;
}

const ASK_AT_LAUNCH = "ask at launch";

export function summaryChips(strategy: LaunchStrategy): SummaryChip[] {
  const plan = strategy.plan;
  const chips: SummaryChip[] = [];

  if (isSectionPreset(strategy, "objective")) {
    chips.push({ sectionId: "objective", text: objectiveLabel(plan.objective) });
  } else {
    chips.push({ sectionId: "objective", text: ASK_AT_LAUNCH, muted: true });
  }

  if (isSectionPreset(strategy, "budget")) {
    chips.push({ sectionId: "budget", text: formatBudget(plan) });
    if (plan.budgetMode) {
      chips.push({ sectionId: "budget", text: plan.budgetMode });
    }
  } else {
    chips.push({ sectionId: "budget", text: ASK_AT_LAUNCH, muted: true });
  }

  if (plan.format) {
    chips.push({ sectionId: "creative", text: formatLabel(plan.format) });
  }

  if (isSectionPreset(strategy, "structure")) {
    const t = structureTotals(plan);
    chips.push({
      sectionId: "structure",
      text: `${t.campaigns}×${plan.structure?.adSetsPerCampaign ?? 0}×${plan.structure?.adsPerAdSet ?? 0}`,
    });
  } else {
    chips.push({ sectionId: "structure", text: ASK_AT_LAUNCH, muted: true });
  }

  if (isSectionPreset(strategy, "audience")) {
    const tplId = plan.targetingTemplateId;
    chips.push({
      sectionId: "audience",
      text: tplId && !plan.advantageAudience ? audienceTemplateLabel(tplId) : "broad",
    });
  } else {
    chips.push({ sectionId: "audience", text: ASK_AT_LAUNCH, muted: true });
  }

  if (isSectionPreset(strategy, "distribution")) {
    chips.push({
      sectionId: "distribution",
      text: plan.spread ? spreadLabel(plan.spread) : pageSplitLabel(plan.pageDistribution),
    });
  } else {
    chips.push({ sectionId: "distribution", text: ASK_AT_LAUNCH, muted: true });
  }

  return chips;
}

function audienceTemplateLabel(templateId: string): string {
  const known: Record<string, string> = {
    tpl_us_broad: "US Broad",
    tpl_lal1: "Lookalike 1%",
    tpl_in_metro: "India Metro",
    tpl_in_awareness_video: "India Awareness",
    tpl_in_engagement: "India Engagement",
    tpl_in_leads_native: "India Leads",
    tpl_in_app_installs: "India App",
    tpl_us_traffic: "US Traffic",
  };
  return known[templateId] ?? "Saved audience";
}
