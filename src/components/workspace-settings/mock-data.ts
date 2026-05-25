/**
 * Mock data for the Workspace Settings → Plans & Payment tab.
 *
 * Demo-only per Maalik. No backend wiring — these constants drive every
 * section (Plan Overview, Payment Methods, Products, Add-ons) and the
 * Manage Subscription modal. Numbers + dates match the Figma reference at
 * node-id=2984-18221.
 *
 * Plan name comes from `usePlan()` at consumer level; the rest is here.
 */

import type { LucideIcon } from "lucide-react";

/* ── Plan Overview stats ─────────────────────────────────────────── */

export interface PlanOverviewStats {
  spendUsd: string;
  iqCreditWithPlan: { used: number; total: number };
  iqCreditAddonBalance: number;
  nextBillDate: string; // "DD/MM/YY"
  amountUsd: number;
}

export interface UsageMetric {
  label: string;
  // For unlimited metrics (∞), `total` is null and the bar is full + lime
  used: number;
  total: number | null;
  // Indicates the destructive state (at-cap = red bar + red number)
  status?: "ok" | "danger";
}

export const PLAN_OVERVIEW_STATS: PlanOverviewStats = {
  spendUsd: "$678.93k",
  iqCreditWithPlan: { used: 128, total: 500 },
  iqCreditAddonBalance: 0,
  nextBillDate: "26/08/25",
  amountUsd: 349,
};

export const USAGE_METRICS: UsageMetric[] = [
  { label: "Launch", used: 1, total: null }, // ∞
  { label: "Upload", used: 423, total: 1000 },
  { label: "Ad account", used: 10, total: 10, status: "danger" },
  { label: "User", used: 4, total: 5 },
  { label: "Automations", used: 120, total: 200 },
];

/* ── Add-on upsell cards (inside Plan Overview) ──────────────────── */

export interface PlanOverviewUpsell {
  id: string;
  /** Lucide icon component. */
  iconKey: "Zap" | "Eye";
  title: string;
  description: string;
  cta: string;
  /** Where the CTA navigates to (plans-v2 query string). */
  href: string;
}

export const PLAN_OVERVIEW_UPSELLS: PlanOverviewUpsell[] = [
  {
    id: "credits-topup",
    iconKey: "Zap",
    title: "Burned through your credits?",
    description:
      "Top up with 100 credits for $19.99. One time purchase. Credits don't expire.",
    cta: "Top up",
    href: "/plans-v2?addon=credits",
  },
  {
    id: "competitors-topup",
    iconKey: "Eye",
    title: "Need to track more competitors?",
    description:
      "Add 5 competitors for $5.99/month. Stacks with your plan. Cancel any time.",
    cta: "Add competitors",
    href: "/plans-v2?addon=competitors",
  },
];

/* ── Payment methods ─────────────────────────────────────────────── */

export interface PaymentCard {
  id: string;
  brand: "visa" | "mastercard" | "amex";
  holderName: string;
  /** Last 4 digits — full PAN is never stored. */
  last4: string;
  /** "MM/YYYY" */
  expiry: string;
  /** Default surface — one is dark/active, one is light/secondary. */
  surface: "dark" | "light";
}

export const PAYMENT_CARDS: PaymentCard[] = [
  {
    id: "card-1",
    brand: "visa",
    holderName: "Rohit Ajmani",
    last4: "4002",
    expiry: "11/2028",
    surface: "dark",
  },
  {
    id: "card-2",
    brand: "amex",
    holderName: "Sahil Walia",
    last4: "9018",
    expiry: "09/2029",
    surface: "light",
  },
];

/* ── Products you own or can own ─────────────────────────────────── */

export interface ProductCard {
  id: string;
  name: string;
  /** When owned, the plan name + tag. When locked, the trial CTA. */
  state: "owned" | "locked";
  /** Owned: plan name (e.g. "Growth Plan + Rule engine"). Locked: hook copy. */
  planLine: string;
  whatItDoes: string;
  idealFor: string;
  features: string[];
  /** Owned: monthly spend usage progress (0-100). Locked: undefined. */
  spendUsagePct?: number;
  spendUsageLabel?: string;
  nextBillingDate?: string;
  monthlyPriceUsd?: number;
  /** Footer italic blurb. */
  socialProof: string;
  ctaLabel: string;
  ctaHref: string;
}

export const PRODUCTS: ProductCard[] = [
  {
    id: "fabads",
    name: "FabAds",
    state: "owned",
    planLine: "Growth Plan + Rule engine",
    whatItDoes: "Centralised ad launch, sync & optimisation",
    idealFor: "Growth marketers scaling across platforms",
    features: ["Bulk launch", "Creative sync", "Multi ad-account launch"],
    spendUsagePct: 1,
    spendUsageLabel: "01k out of 100k monthly spend",
    nextBillingDate: "26 July 2025",
    monthlyPriceUsd: 349,
    socialProof: "Used by top teams to save 5+ hours/week on ad-ops.",
    ctaLabel: "Manage plan",
    ctaHref: "/planning",
  },
  {
    id: "fabppc",
    name: "FabPPC",
    state: "locked",
    planLine: "Unlock for 7 Days Free!",
    whatItDoes: "Cross-channel PPC automation & optimisation",
    idealFor: "Performance marketers managing PPC ads",
    features: ["Auto-bidding", "ROI-driven rules", "Campaign syncing"],
    socialProof: "Trusted by top pros to boost ROAS & cut manual work.",
    ctaLabel: "Start 7-day free trial",
    ctaHref: "/plans-v2?tier=growth&view=trial&product=fabppc",
  },
];

/* ── Add-on feature trial cards ──────────────────────────────────── */

export interface AddonCard {
  id: string;
  tagLabel: string; // "AI", "Pro" etc.
  title: string;
  features: {
    columnLabel: string;
    items: string[];
  }[];
  socialProof: string;
  ctaLabel: string;
}

export const ADDONS: AddonCard[] = [
  {
    id: "creative-ai",
    tagLabel: "AI",
    title: "Supercharge Your Creativity with AI",
    features: [
      {
        columnLabel: "What you get",
        items: [
          "Generate 5 unique variations for any image.",
          "Upload and enhance new images with AI. and more...",
        ],
      },
      {
        columnLabel: "Outcomes",
        items: [
          "Save time and effort with automation.",
          "Scale campaigns faster and more efficiently. and more...",
        ],
      },
    ],
    socialProof: "Request now and try it free for 30 days!",
    ctaLabel: "Request",
  },
  {
    id: "auto-scale",
    tagLabel: "Pro",
    title: "Auto-Scale Winning Campaigns",
    features: [
      {
        columnLabel: "What you get",
        items: [
          "Detect winning ad-sets automatically.",
          "Apply budget rules with one-click presets. and more...",
        ],
      },
      {
        columnLabel: "Outcomes",
        items: [
          "Lift ROAS by 18% on average in 4 weeks.",
          "Cut wasted spend on under-performers. and more...",
        ],
      },
    ],
    socialProof: "Request now and try it free for 30 days!",
    ctaLabel: "Request",
  },
];

/* ── Manage Subscription modal — line items ──────────────────────── */

export type SubscriptionLineKind = "plan" | "addon" | "trial";

export interface SubscriptionLine {
  id: string;
  kind: SubscriptionLineKind;
  name: string;
  description: string;
  /** Billing cadence label — "/mo" | "one-time" | "Trial · 23 days left". */
  billingLabel: string;
  /** Per-month USD contribution to the running total. Trials count as 0. */
  monthlyContributionUsd: number;
  /**
   * Whether the line can be cancelled in-modal. Base plan is locked
   * here per Maalik (downgrade happens on /plans-v2).
   */
  cancellable: boolean;
  /** Reason shown in tooltip when cancellable === false. */
  lockedReason?: string;
  /**
   * Only meaningful for the IQ Credits add-on — the auto-renew toggle
   * Maalik called out specifically.
   */
  autoRenew?: boolean;
}

export const SUBSCRIPTION_LINES: SubscriptionLine[] = [
  {
    id: "base-fabads-growth",
    kind: "plan",
    name: "FabAds — Growth Plan",
    description: "Base plan with Rule engine. Renews monthly.",
    billingLabel: "/mo",
    monthlyContributionUsd: 349,
    cancellable: false,
    lockedReason: "Use the Plans page to downgrade your base plan.",
  },
  {
    id: "addon-iq-credits",
    kind: "addon",
    name: "IQ Credits Top-up",
    description: "100 credits — one-time purchase. Credits don't expire.",
    billingLabel: "one-time",
    monthlyContributionUsd: 0,
    cancellable: true,
    autoRenew: true,
  },
  {
    id: "addon-competitors-5",
    kind: "addon",
    name: "Competitor Tracker — 5 slots",
    description: "Stacks with your plan. Cancel any time.",
    billingLabel: "/mo",
    monthlyContributionUsd: 5.99,
    cancellable: true,
  },
  {
    id: "trial-creative-ai",
    kind: "trial",
    name: "Creative AI Suite",
    description: "30-day free trial — 23 days remaining.",
    billingLabel: "Trial · 23 days left",
    monthlyContributionUsd: 0,
    cancellable: true,
  },
];
