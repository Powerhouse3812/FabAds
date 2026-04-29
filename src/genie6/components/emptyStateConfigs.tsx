import { Globe, Upload, Sparkles, Building2, FolderOpen, Zap, MessageCircle, Layers, User, Mic, Users } from "lucide-react";
import type { EmptyStateStep } from "./EmptyStateOnboarding";

/**
 * Surface-specific empty-state configs. One config per Asset tab + Library.
 * Used by EmptyStateOnboarding when demo data is OFF and the surface has no
 * real data yet.
 */

export interface EmptyStateConfig {
  title: string;
  description: string;
  steps: EmptyStateStep[];
}

const ADD_BRAND: EmptyStateStep = {
  title: "Add via URL",
  description: "Paste your brand site, AI extracts logo, voice, products in 12s.",
  cta: "Start",
  to: "/iq/genie6/settings/brands",
  Icon: Globe,
  featured: true,
};

const BULK_IMPORT: EmptyStateStep = {
  title: "Bulk import",
  description: "Upload a CSV with brand domains. Up to 50 at once.",
  cta: "Upload",
  to: "/iq/genie6/settings/brands",
  Icon: Upload,
};

export const EMPTY_CONFIGS: Record<string, EmptyStateConfig> = {
  // ─── Library ───
  library: {
    title: "Your library is empty",
    description: "Generate your first batch and every output lands here — searchable, filterable, ready to launch.",
    steps: [
      {
        title: "Pick a generation mode",
        description: "Brand, Product, UGC, Variants — 6 modes to start from.",
        cta: "Open modes",
        to: "/iq/genie6/generate",
        Icon: Sparkles,
        featured: true,
      },
      {
        title: "Set up a brand first",
        description: "Brand profile gives every generation context (voice, USPs, colors).",
        cta: "Add brand",
        to: "/iq/genie6/settings/brands",
        Icon: Building2,
      },
      {
        title: "Or just paste a URL",
        description: "AI auto-categorizes the rest. Fastest path to your first ad.",
        cta: "Try Quick generate",
        to: "/iq/genie6/generate",
        Icon: Globe,
      },
    ],
  },

  // ─── Assets / Brands ───
  brands: {
    title: "No brands yet",
    description: "Brands are the home for every generation. Add one to start producing tailored ads.",
    steps: [ADD_BRAND, BULK_IMPORT, {
      title: "Manual entry",
      description: "Type out the brand profile. For when AI fetch isn't enough.",
      cta: "Form-led",
      to: "/iq/genie6/settings/brands",
      Icon: Building2,
    }],
  },

  // ─── Assets / Categories ───
  categories: {
    title: "No categories mapped",
    description: "Categories tie brands to industry-specific knowledge bases — better generations, fewer prompts.",
    steps: [
      {
        title: "Pick from suggested categories",
        description: "Personal care, Fintech, Wearables, F&B + 32 more. Pre-loaded with research.",
        cta: "Browse",
        to: "/iq/genie6/settings/categories",
        Icon: FolderOpen,
        featured: true,
      },
      {
        title: "Create custom category",
        description: "For when your brand sits in a niche that doesn't fit a preset.",
        cta: "Create",
        to: "/iq/genie6/settings/categories",
        Icon: Sparkles,
      },
      {
        title: "Auto-map from brands",
        description: "We'll guess categories from your brand profiles. Review before saving.",
        cta: "Auto-map",
        to: "/iq/genie6/settings/categories",
        Icon: Zap,
      },
    ],
  },

  // ─── Assets / Hooks ───
  hooks: {
    title: "No hooks saved",
    description: "Hooks are the first 3 seconds of an ad — the line that stops the scroll. Save winners here.",
    steps: [
      {
        title: "Generate hooks first",
        description: "Pick UGC Video or Adcopy mode. Every generation produces 4-6 hook variants.",
        cta: "Generate",
        to: "/iq/genie6/generate/ugc-video/form",
        Icon: Sparkles,
        featured: true,
      },
      {
        title: "Import from spreadsheet",
        description: "Already have a hook bank? Upload a CSV with text + brand mapping.",
        cta: "Import",
        to: "/iq/genie6/settings/templates",
        Icon: Upload,
      },
    ],
  },

  // ─── Assets / Angles ───
  angles: {
    title: "No angles tracked",
    description: "Angles are the strategic frame — \"aspirational\", \"comparison\", \"problem-solution\". Track which work.",
    steps: [
      {
        title: "Generate ads to surface angles",
        description: "Each output is tagged with its angle. The library auto-aggregates winners.",
        cta: "Open Generate",
        to: "/iq/genie6/generate",
        Icon: Sparkles,
        featured: true,
      },
      {
        title: "Add angles manually",
        description: "Have a proven angle? Save it as a starting point for future generations.",
        cta: "Add",
        to: "/iq/genie6/workspace/angles",
        Icon: MessageCircle,
      },
    ],
  },

  // ─── Assets / Concepts ───
  concepts: {
    title: "No concepts saved",
    description: "Concepts are saved settings presets — same brand + audience + angle + format combo, ready to fire.",
    steps: [
      {
        title: "Generate, then save as concept",
        description: "From any output card → \"Save as concept\". Reuse the exact recipe later.",
        cta: "Open Generate",
        to: "/iq/genie6/generate",
        Icon: Sparkles,
        featured: true,
      },
    ],
  },

  // ─── Assets / Templates ───
  templates: {
    title: "No templates yet",
    description: "Templates are visual layouts saved from winning ads. Apply on future generations to keep brand consistency.",
    steps: [
      {
        title: "Save a template from a winner",
        description: "On any output → \"Save layout as template\". The visual structure becomes reusable.",
        cta: "Browse outputs",
        to: "/iq/genie6/library",
        Icon: Layers,
        featured: true,
      },
      {
        title: "Use a starter pack",
        description: "5 hand-picked templates by FabAds team. Free with every account.",
        cta: "Explore",
        to: "/iq/genie6/settings/templates",
        Icon: Sparkles,
      },
    ],
  },

  // ─── Assets / Avatars ───
  avatars: {
    title: "No UGC avatars set up",
    description: "Avatars are the personas for UGC video mode — the on-screen face that delivers your script.",
    steps: [
      {
        title: "Pick from preset avatars",
        description: "Indian + global demographics. Hindi, English, regional voiceover support.",
        cta: "Browse",
        to: "/iq/genie6/settings/avatars",
        Icon: User,
        featured: true,
      },
      {
        title: "Upload custom avatar",
        description: "Bring your own creator. We'll lipsync to any script.",
        cta: "Upload",
        to: "/iq/genie6/settings/avatars",
        Icon: Upload,
      },
    ],
  },

  // ─── Assets / Audiences ───
  audiences: {
    title: "No audiences defined",
    description: "Audience = who you're talking to. Drives tone, references, demographics in every generation.",
    steps: [
      {
        title: "Use research-backed audiences",
        description: "Pre-built personas for D2C in India: Gen-Z urban, Tier-2 buyer, dropshipper, etc.",
        cta: "Browse presets",
        to: "/iq/genie6/workspace/audiences",
        Icon: Users,
        featured: true,
      },
      {
        title: "Define your own",
        description: "Custom audience profile — age, region, behavior, pain points.",
        cta: "Create",
        to: "/iq/genie6/workspace/audiences",
        Icon: Sparkles,
      },
    ],
  },
};
