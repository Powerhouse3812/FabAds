import {
  Camera,
  Megaphone,
  ShoppingBag,
  Smartphone,
  TrendingUp,
} from "lucide-react";

/**
 * modes — Studio "Mode" metadata (§21.2 / §22 item 2).
 *
 * Extracted out of StudioHome.tsx so the SAME roster + tone scheme can also
 * render on the merged Format step (AlphaStep1Format) — §21.2 asks Mode and
 * Format to become one screen, so the mode picker needs a home in two places
 * now: the pre-wizard StudioHome landing page, and the in-wizard step where
 * the user can change it without exiting to Home.
 *
 * §22 item 2 — Mode (5: Product Shoot / Brand Ad / Product Ad / Social /
 * Performance Ad) vs ad type (3: Brand / Product / Category-Performance) is a
 * DELIBERATELY UNRESOLVED tension per the planning doc ("do not block on
 * it"). Mode stays a coarse, separate "creative journey" selector; §4 is
 * unambiguous that the Step-2 tab (Brand/Product/Category) is the ONLY ad-type
 * selector in Genie. Nothing here decides ad type.
 */
export type AlphaMode =
  | "product-shoot"
  | "brand-ad"
  | "product-ad"
  | "social"
  | "performance-ad";

export interface ModeOption {
  id: AlphaMode;
  Icon: React.ElementType;
  title: string;
  desc: string;
  available: boolean;
  /** Optional badge label shown top-right of the card (e.g. "Affiliate"). */
  tag?: string;
  /** Per-mode tonal SCHEME key (same palette as Step 3 Approach). */
  tone: "rose" | "fuchsia" | "lime" | "indigo" | "amber";
}

/** Soft-tint per card. Shared by StudioHome's grid and Step 1's compact row. */
export const MODE_SCHEME = {
  rose: {
    bg: "bg-rose-50",   text: "text-rose-600",
    bgSel: "bg-rose-100", textSel: "text-rose-700",
  },
  fuchsia: {
    bg: "bg-fuchsia-50", text: "text-fuchsia-600",
    bgSel: "bg-fuchsia-100", textSel: "text-fuchsia-700",
  },
  lime: {
    bg: "bg-primary/[0.10]", text: "text-primary",
    bgSel: "bg-primary/[0.18]", textSel: "text-primary",
  },
  indigo: {
    bg: "bg-indigo-50", text: "text-indigo-600",
    bgSel: "bg-indigo-100", textSel: "text-indigo-700",
  },
  amber: {
    bg: "bg-amber-50", text: "text-amber-600",
    bgSel: "bg-amber-100", textSel: "text-amber-700",
  },
} as const;

export const MODES: ModeOption[] = [
  {
    id: "product-shoot",
    Icon: Camera,
    title: "Product Shoot",
    desc: "Studio-quality product photography. Hero shots, detail macros, bundles.",
    available: false,
    tone: "rose",
  },
  {
    id: "brand-ad",
    Icon: Megaphone,
    title: "Brand Ad",
    desc: "Top-of-funnel awareness. Tone, story, brand positioning.",
    available: false,
    tone: "fuchsia",
  },
  {
    id: "product-ad",
    Icon: ShoppingBag,
    title: "Product Ad",
    desc: "Conversion-driven product creative with offer + CTA.",
    available: true,
    tone: "lime",
  },
  {
    id: "social",
    Icon: Smartphone,
    title: "Social",
    desc: "Organic content for feed, Stories, Reels, and carousels.",
    available: false,
    tone: "indigo",
  },
  {
    id: "performance-ad",
    Icon: TrendingUp,
    title: "Performance Ad",
    desc: "ROAS-driven format. Tested angles, urgency, social proof.",
    available: false,
    tag: "Affiliate",
    tone: "amber",
  },
];
