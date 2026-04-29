export const STEP2_DEFAULTS = {
  campaign: {
    objective: null as string | null,
    budget_type: "CBO",
    budget_period: "daily",
    budget_value: null as number | null,
    bid_strategy: "Lowest Cost",
    delivery_type: "Standard",
    special_ad_category: [] as string[],
  },
  adset: {
    targeting: {
      locations: [] as string[],
      exclude_locations: [] as string[],
      gender: "All",
      age_min: 18,
      age_max: 65,
      interests: [] as string[],
      languages: [] as string[],
      scheduling_enabled: false,
    },
    placements: { mode: "automatic" as "automatic" | "manual", selected: [] as string[] },
    performance_goal: "Maximize Conversions",
    budget_value: null as number | null,
    budget_period: "daily",
    bid_strategy: "Lowest Cost",
    bid_amount: null as number | null,
    delivery_type: "Standard",
    schedule_start: null as string | null,
    schedule_end: null as string | null,
    devices: ["Desktop", "Mobile"] as string[],
    os: ["All"] as string[],
    flexible_creative: false,
    advantage_plus_creative: false,
    beneficiary: null as string | null,
    payor: null as string | null,
    conversion_location: null as string | null,
  },
  ads: {
    epc_key: null as string | null,
    cta: "Learn more",
  },
};

export type CampaignFormData = typeof STEP2_DEFAULTS.campaign;
export type AdsetFormData = typeof STEP2_DEFAULTS.adset;
export type AdsFormData = typeof STEP2_DEFAULTS.ads;
