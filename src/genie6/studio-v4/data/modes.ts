import {
  Camera,
  Megaphone,
  ShoppingBag,
  Smartphone,
  TrendingUp,
} from "lucide-react";

/**
 * modes — Studio "Mode" metadata (§21.2 / §4).
 *
 * Extracted out of StudioHome.tsx so the SAME roster + tone scheme can also
 * render on the merged Format step (AlphaStep1Format) — §21.2 asks Mode and
 * Format to become one screen, so the mode picker needs a home in two places
 * now: the pre-wizard StudioHome landing page, and the in-wizard step where
 * the user can change it without exiting to Home.
 *
 * §4 — Mode vs ad type is RESOLVED, not open. Mode stays a coarse, separate
 * "creative journey" selector; §4/§5 are unambiguous that the Step-2 tab
 * (Brand/Product/Category) is the ONLY ad-type picker in Genie. Nothing here
 * decides ad type.
 *
 * Maalik's call (2026-09-08): Affiliate and Custom/Manual dropped from
 * Studio entirely — both had sat `available: false` with no shipped date,
 * unlike Product Shoot/Social below which flip straight to live. Product
 * Shoot and Social enabled the same day.
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
  tone: "rose" | "fuchsia" | "lime" | "indigo" | "amber" | "sky" | "slate";
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
  sky: {
    bg: "bg-sky-50", text: "text-sky-600",
    bgSel: "bg-sky-100", textSel: "text-sky-700",
  },
  slate: {
    bg: "bg-slate-50", text: "text-slate-600",
    bgSel: "bg-slate-100", textSel: "text-slate-700",
  },
} as const;

export const MODES: ModeOption[] = [
  {
    id: "product-shoot",
    Icon: Camera,
    title: "Product Shoot",
    desc: "Studio-quality product photography. Hero shots, detail macros, bundles.",
    available: true,
    tone: "rose",
  },
  {
    id: "brand-ad",
    Icon: Megaphone,
    title: "Brand Ad",
    desc: "Top-of-funnel awareness. Tone, story, brand positioning.",
    available: true,
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
    available: true,
    tone: "indigo",
  },
  {
    id: "performance-ad",
    Icon: TrendingUp,
    title: "Performance Ad",
    // Maalik (2026-09-08): "Category me hi category Ads bnti hai" — a
    // Category-level ad (rather than one scoped to a single Brand/Product)
    // runs through Performance Ad specifically, not a mode of its own. Led
    // with it so it survives the card's line-clamp-1 even if "Tested
    // angles..." gets truncated; the tag badge is a second, guaranteed-
    // visible confirmation.
    desc: "Category-wide, ROAS-driven. Tested angles, urgency, social proof.",
    tag: "+ Category",
    available: true,
    tone: "amber",
  },
];
