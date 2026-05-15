import type { LucideIcon } from "lucide-react";
import {
  Sparkles, Play, Eye, Users, BarChart3, Database, Zap, Globe,
} from "lucide-react";

export type Tier = "ai" | "growth";
export type View = "direct" | "trial";
export type Billing = "monthly" | "annual";

export interface PlanPricing {
  monthly: number;
  /** Annual total — shown as the displayed price when bill === "annual". */
  annualYear: number;
  /** Full-year list price (monthly × 12). Shown as strikethrough when bill === "annual". */
  fullYear: number;
  /** Per-seat / per-workspace cycle label. */
  cycleLabel: string;
}

export interface PlanFeatureBucket {
  heading: string;
  items: string[];
}

export interface PlanValuePoint {
  icon: LucideIcon;
  title: string;
  desc: string;
}

export interface PlanDef {
  /** Stable key used in URL slugs + telemetry. */
  id: string;
  name: string;
  tier: Tier;
  /** Tag shown in trial view (small grey blurb under the plan name). */
  tagTrial?: string;
  /** Trial banner shown above CTA in trial view. */
  trialDays?: number;
  /** "Best for teams" / "Most popular" — small badge above the card. */
  badge?: string;
  /** Renders the card with the lime-tinted featured style. */
  featured?: boolean;
  pricing: PlanPricing | "custom";
  creditsPill?: string;
  ctaLabel: string;
  /** "Pay monthly. Cancel any time." / "Then $X/month. Cancel any time before day Y." */
  trustText: (monthly: number) => string;
  /** Direct-purchase value points (3 highlighted feature cards). Only meaningful when tier=ai. */
  valuePoints?: PlanValuePoint[];
  buckets: PlanFeatureBucket[];
  mutedNote?: string;
}

/* ────────────────────────────────────────────────────────────────── */

export const AI_INDIVIDUAL: PlanDef = {
  id: "ai-individual",
  name: "AI Individual",
  tier: "ai",
  tagTrial:
    "For solo media buyers and creators getting their first wins with AI generated ads.",
  trialDays: 7,
  pricing: {
    monthly: 39,
    annualYear: 390,
    fullYear: 468,
    cycleLabel: "per seat",
  },
  creditsPill: "100 credits per month",
  ctaLabel: "Get instant access",
  trustText: () => "Pay monthly. Cancel any time.",
  valuePoints: [
    {
      icon: Sparkles,
      title: "AI generated ad creatives",
      desc: "Brief Genie and ship on brand ads, hooks, and scripts. 100 credits per month.",
    },
    {
      icon: Play,
      title: "Video Sage analysis",
      desc: "Deconstruct any winning ad video. See what makes it convert.",
    },
    {
      icon: Eye,
      title: "Competitor intelligence",
      desc: "Track 5 competitors. Surface winning angles before they go mainstream.",
    },
  ],
  buckets: [
    { heading: "Account", items: ["1 user"] },
    { heading: "AI credits", items: ["100 credits per month"] },
    { heading: "Creative", items: ["Creative Studio", "Creative Library"] },
    {
      heading: "Insights",
      items: ["Video Sage", "Industry Insights — up to 5 competitors"],
    },
    { heading: "Workspace", items: ["Unlimited brands", "20 GB storage"] },
    { heading: "Support", items: ["Email support"] },
  ],
  mutedNote:
    "Credits reset monthly. Top up or add competitors any time below.",
};

export const AI_TEAM: PlanDef = {
  id: "ai-team",
  name: "AI Team",
  tier: "ai",
  tagTrial:
    "For small agencies, in house teams, and affiliate squads sharing creative workflows.",
  trialDays: 7,
  badge: "Best for teams",
  featured: true,
  pricing: {
    monthly: 99,
    annualYear: 990,
    fullYear: 1188,
    cycleLabel: "starting at 3 seats",
  },
  creditsPill: "450 credits per month, shared",
  ctaLabel: "Get instant access",
  trustText: () => "Pay monthly. Cancel any time.",
  valuePoints: [
    {
      icon: Users,
      title: "Shared creative workspace",
      desc: "Everyone briefs Genie, everyone ships. 450 credits pooled across the team.",
    },
    {
      icon: BarChart3,
      title: "Team scale intelligence",
      desc: "Track 15 competitors and dissect their videos. Patterns no solo buyer would see.",
    },
    {
      icon: Database,
      title: "Built to scale",
      desc: "100 GB storage, unlimited brands, team usage reporting included.",
    },
  ],
  buckets: [
    {
      heading: "Account",
      items: ["3, 8, or 15 user bundles", "Collaborative workspace"],
    },
    { heading: "AI credits", items: ["450 credits per month"] },
    {
      heading: "Creative",
      items: ["Creative Studio", "Creative Library shared across team"],
    },
    {
      heading: "Insights",
      items: ["Video Sage", "Industry Insights — up to 15 competitors"],
    },
    {
      heading: "Workspace",
      items: ["Unlimited brands", "100 GB storage", "Team usage reporting"],
    },
    { heading: "Support", items: ["Priority support"] },
  ],
  mutedNote: "All seats included in plan price. No per seat add on fee.",
};

export const GROWTH_STARTER: PlanDef = {
  id: "growth-starter",
  name: "Starter",
  tier: "growth",
  tagTrial: "For media buyers stepping into automated campaign ops.",
  trialDays: 14,
  pricing: {
    monthly: 349,
    annualYear: 3490,
    fullYear: 4188,
    cycleLabel: "per workspace",
  },
  creditsPill: "[TBD] Genie credits per month",
  ctaLabel: "Start free trial",
  trustText: (m) => `Then $${m}/month. Cancel any time before day 14.`,
  buckets: [
    {
      heading: "Account",
      items: ["Unlimited team members", "Up to 5 ad accounts"],
    },
    {
      heading: "Campaign ops",
      items: ["Bulk Launcher (manual)", "Basic Automation rules"],
    },
    { heading: "Platforms", items: ["Meta", "TikTok", "NewsBreak"] },
    { heading: "AI", items: ["AI Co-pilot (always on)"] },
    {
      heading: "Reporting",
      items: ["Multi Ad Account Reporting", "RedTrack + Voluum"],
    },
    { heading: "Support", items: ["Email support"] },
  ],
  mutedNote: "Genie credits billed on top of plan access. Top up any time.",
};

export const GROWTH_PRO: PlanDef = {
  id: "growth-pro",
  name: "Pro",
  tier: "growth",
  tagTrial:
    "For performance teams scaling across platforms with full automation.",
  trialDays: 14,
  badge: "Most popular",
  featured: true,
  pricing: {
    monthly: 599,
    annualYear: 5990,
    fullYear: 7188,
    cycleLabel: "per workspace",
  },
  creditsPill: "[TBD] Genie credits per month",
  ctaLabel: "Start free trial",
  trustText: (m) => `Then $${m}/month. Cancel any time before day 14.`,
  buckets: [
    {
      heading: "Account",
      items: ["Unlimited team members", "Up to 15 ad accounts"],
    },
    {
      heading: "Campaign ops",
      items: [
        "Bulk Launcher (automated)",
        "Advanced Automation rules",
        "Campaign Cloning",
      ],
    },
    { heading: "Platforms", items: ["Meta · TikTok · NewsBreak"] },
    { heading: "AI", items: ["AI Co-pilot (always on)"] },
    {
      heading: "Reporting",
      items: [
        "Multi Ad Account Reporting",
        "Cross platform reporting",
        "RedTrack + Voluum",
      ],
    },
    { heading: "Support", items: ["Priority support"] },
  ],
  mutedNote:
    "Built for teams running real budgets across multiple platforms.",
};

export const GROWTH_ENTERPRISE: PlanDef = {
  id: "growth-enterprise",
  name: "Enterprise",
  tier: "growth",
  tagTrial:
    "For agencies and high volume operators with complex stacks.",
  pricing: "custom",
  creditsPill: "Custom credit allocation",
  ctaLabel: "Book a call",
  trustText: () =>
    "We'll set up a tailored trial based on your scale.",
  buckets: [
    {
      heading: "Account",
      items: ["Unlimited team members", "Unlimited ad accounts"],
    },
    { heading: "Campaign ops", items: ["Everything in Pro"] },
    { heading: "Integrations", items: ["API access"] },
    {
      heading: "Reporting",
      items: [
        "Multi Ad Account Reporting",
        "Cross platform reporting",
        "RedTrack + Voluum",
        "Custom dashboards",
      ],
    },
    {
      heading: "Support",
      items: [
        "Dedicated CSM",
        "White glove onboarding",
        "SLA backed support",
      ],
    },
  ],
  mutedNote:
    "Pricing tailored to your volume, accounts, and integration needs.",
};

export const AI_PLANS: PlanDef[] = [AI_INDIVIDUAL, AI_TEAM];
export const GROWTH_PLANS: PlanDef[] = [
  GROWTH_STARTER,
  GROWTH_PRO,
  GROWTH_ENTERPRISE,
];

/* ── Hero content (per tier) ── */

export interface HeroContent {
  eyebrow: string;
  /** Headline with a `{highlight}` token to mark the lime-accent word(s). */
  headline: string;
  sub: string;
}

export const HEROES: Record<Tier, HeroContent> = {
  ai: {
    eyebrow: "AI Plans",
    headline: "Generate ad creatives {at the speed of thought}",
    sub: "Start solo or roll out across the team. Powered by Genie Creative Studio, Video Sage, and built for operators who ship fast.",
  },
  growth: {
    eyebrow: "Growth Plans",
    headline: "Real ad ops, {built to scale}",
    sub: "Bulk launch, automation, multi account reporting, and AI Co-pilot. Built for performance teams running real budgets across platforms.",
  },
};

/* ── Top-up add-ons (AI tier only) ── */

export interface AddOn {
  id: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  /** Highlighted strong-text segment within desc. */
  descStrong: string;
  ctaLabel: string;
}

export const ADD_ONS: AddOn[] = [
  {
    id: "credits",
    icon: Zap,
    title: "Burned through your credits?",
    desc: "Top up with {strong}. One time purchase. Credits don't expire.",
    descStrong: "100 credits for $19.99",
    ctaLabel: "Buy credits",
  },
  {
    id: "competitors",
    icon: Globe,
    title: "Need to track more competitors?",
    desc: "Add {strong}. Stacks with your plan. Cancel any time.",
    descStrong: "5 competitors for $5.99/month",
    ctaLabel: "Add competitors",
  },
];

/* ── Helpers ── */

export function formatMoney(n: number): string {
  return Number.isInteger(n) ? n.toLocaleString() : n.toFixed(2);
}

/** Render the price + cycle label string for a plan given current billing. */
export function priceFor(
  plan: PlanDef,
  billing: Billing,
): { display: string; strike?: string; cycle: string } {
  if (plan.pricing === "custom") {
    return { display: "Custom", cycle: "tailored to your scale" };
  }
  if (billing === "annual") {
    return {
      display: `$${formatMoney(plan.pricing.annualYear)}`,
      strike: `$${formatMoney(plan.pricing.fullYear)}`,
      cycle: `${plan.pricing.cycleLabel} / year, save 2 months`,
    };
  }
  return {
    display: `$${formatMoney(plan.pricing.monthly)}`,
    cycle: `${plan.pricing.cycleLabel} / month`,
  };
}
