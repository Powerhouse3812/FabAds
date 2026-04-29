import { Zap, Users, Palette, Tag, Rocket, Brain, Globe, RefreshCw, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface PredefinedTemplate {
  id: string;
  name: string;
  description: string;
  tags: string[];
  icon: LucideIcon;
  payload: {
    campaign: Record<string, any>;
    adset: Record<string, any>;
  };
}

export const PREDEFINED_TEMPLATES: PredefinedTemplate[] = [
  {
    id: "quick-launch",
    name: "Quick launch",
    description: "Fast setup with optimized defaults for quick campaign deployment.",
    tags: ["Multichannel", "Speed"],
    icon: Zap,
    payload: {
      campaign: { objective: "Conversions", budget_type: "CBO", budget_period: "daily", budget_value: 20, bid_strategy: "Lowest Cost", delivery_type: "Standard", special_ad_category: [] },
      adset: { targeting: { locations: [], exclude_locations: [], gender: "All", age_min: 18, age_max: 65, interests: [], languages: [], scheduling_enabled: false }, placements: { mode: "automatic", selected: [] }, performance_goal: "Maximize Conversions", budget_value: null, budget_period: "daily", bid_strategy: "Lowest Cost", bid_amount: null, delivery_type: "Standard", schedule_start: null, schedule_end: null },
    },
  },
  {
    id: "audience-split-test",
    name: "Audience split test",
    description: "Test different audiences with controlled budget allocation.",
    tags: ["Testing", "Audience"],
    icon: Users,
    payload: {
      campaign: { objective: "Traffic", budget_type: "ABO", budget_period: "daily", budget_value: null, bid_strategy: "Bid Cap", delivery_type: "Standard", special_ad_category: [] },
      adset: { targeting: { locations: [], exclude_locations: [], gender: "All", age_min: 18, age_max: 65, interests: [], languages: [], scheduling_enabled: false }, placements: { mode: "automatic", selected: [] }, performance_goal: "Maximize Link Clicks", budget_value: 10, budget_period: "daily", bid_strategy: "Bid Cap", bid_amount: null, delivery_type: "Standard", schedule_start: null, schedule_end: null },
    },
  },
  {
    id: "creative-batch-launch",
    name: "Creative batch launch",
    description: "Launch multiple creatives simultaneously for rapid testing.",
    tags: ["Creative", "Testing"],
    icon: Palette,
    payload: {
      campaign: { objective: "Engagement", budget_type: "CBO", budget_period: "daily", budget_value: 50, bid_strategy: "Lowest Cost", delivery_type: "Standard", special_ad_category: [] },
      adset: { targeting: { locations: [], exclude_locations: [], gender: "All", age_min: 18, age_max: 65, interests: [], languages: [], scheduling_enabled: false }, placements: { mode: "automatic", selected: [] }, performance_goal: "Maximize Conversions", budget_value: null, budget_period: "daily", bid_strategy: "Lowest Cost", bid_amount: null, delivery_type: "Standard", schedule_start: null, schedule_end: null },
    },
  },
  {
    id: "offer-testing",
    name: "Offer testing",
    description: "Optimize conversion rates by testing different offer structures.",
    tags: ["CRO", "Launch"],
    icon: Tag,
    payload: {
      campaign: { objective: "Conversions", budget_type: "CBO", budget_period: "daily", budget_value: 30, bid_strategy: "Cost Cap", delivery_type: "Standard", special_ad_category: [] },
      adset: { targeting: { locations: [], exclude_locations: [], gender: "All", age_min: 25, age_max: 55, interests: [], languages: [], scheduling_enabled: false }, placements: { mode: "automatic", selected: [] }, performance_goal: "Maximize Conversions", budget_value: null, budget_period: "daily", bid_strategy: "Cost Cap", bid_amount: null, delivery_type: "Standard", schedule_start: null, schedule_end: null },
    },
  },
  {
    id: "blitz-launch",
    name: "Blitz launch",
    description: "High-volume launch with aggressive delivery for maximum reach.",
    tags: ["High-Volume", "Urgency"],
    icon: Rocket,
    payload: {
      campaign: { objective: "Traffic", budget_type: "CBO", budget_period: "daily", budget_value: 100, bid_strategy: "Lowest Cost", delivery_type: "Accelerated", special_ad_category: [] },
      adset: { targeting: { locations: [], exclude_locations: [], gender: "All", age_min: 18, age_max: 65, interests: [], languages: [], scheduling_enabled: false }, placements: { mode: "automatic", selected: [] }, performance_goal: "Maximize Link Clicks", budget_value: null, budget_period: "daily", bid_strategy: "Lowest Cost", bid_amount: null, delivery_type: "Accelerated", schedule_start: null, schedule_end: null },
    },
  },
  {
    id: "ai-powered-launch",
    name: "AI-Powered launch",
    description: "Leverage predictive targeting with AI-optimized budget allocation.",
    tags: ["AI", "Predictive"],
    icon: Brain,
    payload: {
      campaign: { objective: "Conversions", budget_type: "CBO", budget_period: "lifetime", budget_value: 500, bid_strategy: "Target Cost", delivery_type: "Standard", special_ad_category: [] },
      adset: { targeting: { locations: [], exclude_locations: [], gender: "All", age_min: 18, age_max: 65, interests: [], languages: [], scheduling_enabled: false }, placements: { mode: "automatic", selected: [] }, performance_goal: "Maximize Conversions", budget_value: null, budget_period: "lifetime", bid_strategy: "Target Cost", bid_amount: null, delivery_type: "Standard", schedule_start: null, schedule_end: null },
    },
  },
  {
    id: "geo-expansion",
    name: "Geo expansion",
    description: "Expand campaigns into new geographic markets with localized targeting.",
    tags: ["Localization", "Scaling"],
    icon: Globe,
    payload: {
      campaign: { objective: "Awareness", budget_type: "CBO", budget_period: "daily", budget_value: 25, bid_strategy: "Lowest Cost", delivery_type: "Standard", special_ad_category: [] },
      adset: { targeting: { locations: [], exclude_locations: [], gender: "All", age_min: 18, age_max: 65, interests: [], languages: [], scheduling_enabled: false }, placements: { mode: "automatic", selected: [] }, performance_goal: "Maximize Reach", budget_value: null, budget_period: "daily", bid_strategy: "Lowest Cost", bid_amount: null, delivery_type: "Standard", schedule_start: null, schedule_end: null },
    },
  },
  {
    id: "clone-and-refresh",
    name: "Clone and refresh",
    description: "Duplicate top-performing campaigns with refreshed creatives.",
    tags: ["Automation", "Optimization"],
    icon: RefreshCw,
    payload: {
      campaign: { objective: "Conversions", budget_type: "CBO", budget_period: "daily", budget_value: 20, bid_strategy: "Lowest Cost", delivery_type: "Standard", special_ad_category: [] },
      adset: { targeting: { locations: [], exclude_locations: [], gender: "All", age_min: 18, age_max: 65, interests: [], languages: [], scheduling_enabled: false }, placements: { mode: "automatic", selected: [] }, performance_goal: "Maximize Conversions", budget_value: null, budget_period: "daily", bid_strategy: "Lowest Cost", bid_amount: null, delivery_type: "Standard", schedule_start: null, schedule_end: null },
    },
  },
  {
    id: "persona-drive-launch",
    name: "Persona drive launch",
    description: "Segment campaigns by audience personas for personalized messaging.",
    tags: ["Segmentation", "Personalize"],
    icon: UserCheck,
    payload: {
      campaign: { objective: "Leads", budget_type: "ABO", budget_period: "daily", budget_value: null, bid_strategy: "Bid Cap", delivery_type: "Standard", special_ad_category: [] },
      adset: { targeting: { locations: [], exclude_locations: [], gender: "All", age_min: 18, age_max: 65, interests: [], languages: [], scheduling_enabled: false }, placements: { mode: "automatic", selected: [] }, performance_goal: "Maximize Conversions", budget_value: 15, budget_period: "daily", bid_strategy: "Bid Cap", bid_amount: null, delivery_type: "Standard", schedule_start: null, schedule_end: null },
    },
  },
];
