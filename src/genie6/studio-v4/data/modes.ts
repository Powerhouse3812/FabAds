import {
  Camera,
  Link2,
  Megaphone,
  ShoppingBag,
  Sliders,
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
 * §4 — Mode vs ad type is RESOLVED, not open. Studio home carries all
 * **seven** modes: Product Shoot · Brand Ad · Product Ad · Social ·
 * Performance Ad · Affiliate · Custom / Manual — "a future doc may name only
 * three modes; treat that as an example, not a scope cut — all seven stay."
 * Mode stays a coarse, separate "creative journey" selector; §4/§5 are
 * unambiguous that the Step-2 tab (Brand/Product/Category) is the ONLY
 * ad-type picker in Genie. Nothing here decides ad type.
 */
export type AlphaMode =
  | "product-shoot"
  | "brand-ad"
  | "product-ad"
  | "social"
  | "performance-ad"
  | "affiliate"
  | "custom-manual";

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
    available: false,
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
    available: false,
    tone: "indigo",
  },
  {
    id: "performance-ad",
    Icon: TrendingUp,
    title: "Performance Ad",
    desc: "ROAS-driven format. Tested angles, urgency, social proof.",
    available: true,
    tone: "amber",
  },
  {
    id: "affiliate",
    Icon: Link2,
    title: "Affiliate",
    desc: "Creator + partner-driven promo. Tracked links, code call-outs.",
    available: false,
    tone: "sky",
  },
  {
    id: "custom-manual",
    Icon: Sliders,
    title: "Custom / Manual",
    desc: "Full manual control. Skip the presets, build it field by field.",
    available: false,
    tone: "slate",
  },
];
