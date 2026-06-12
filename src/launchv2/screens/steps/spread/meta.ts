/**
 * Step 3 (Creative spread) UI metadata — CTA options, spread-tile copy, and the
 * small format→icon mapping. Kept separate from the frozen data.ts so the build
 * can iterate on labels without touching the contract.
 */
import { Image, Layers, Repeat, Sparkles, SlidersHorizontal, ListVideo, type LucideIcon } from "lucide-react";
import type { AdFormat, SpreadMode } from "../../../types";

/** Meta CTA enums → human labels (the common slice). */
export const CTA_OPTIONS: { value: string; label: string }[] = [
  { value: "SHOP_NOW", label: "Shop now" },
  { value: "LEARN_MORE", label: "Learn more" },
  { value: "SIGN_UP", label: "Sign up" },
  { value: "SUBSCRIBE", label: "Subscribe" },
  { value: "BOOK_TRAVEL", label: "Book now" },
  { value: "DOWNLOAD", label: "Download" },
  { value: "GET_OFFER", label: "Get offer" },
  { value: "GET_QUOTE", label: "Get quote" },
  { value: "CONTACT_US", label: "Contact us" },
  { value: "APPLY_NOW", label: "Apply now" },
  { value: "ORDER_NOW", label: "Order now" },
  { value: "SEND_MESSAGE", label: "Send message" },
  { value: "NO_BUTTON", label: "No button" },
];

export function ctaLabel(value: string): string {
  return CTA_OPTIONS.find((c) => c.value === value)?.label ?? value;
}

/** Lucide icon per ad format (tray tiles + type chips). */
export const FORMAT_ICON: Record<AdFormat, LucideIcon> = {
  single_image: Image,
  single_video: ListVideo,
  carousel: Layers,
  collection: Layers,
  flexible: Sparkles,
  dpa: Layers,
};

export const FORMAT_CHIP: Record<AdFormat, string> = {
  single_image: "Image",
  single_video: "Video",
  carousel: "Carousel",
  collection: "Collection",
  flexible: "Flexible",
  dpa: "Catalogue",
};

/** Spread-mode tile descriptor (icon + one-line "how it builds"). */
export const SPREAD_META: Record<SpreadMode, { icon: LucideIcon; ratio: string; blurb: string }> = {
  one_per_adset: { icon: SlidersHorizontal, ratio: "1:1", blurb: "Each creative gets its own ad set — clean per-creative reads." },
  round_robin: { icon: Repeat, ratio: "N→slots", blurb: "Creatives cycle to fill existing ad-set slots." },
  stacked: { icon: Layers, ratio: "N in 1", blurb: "All creatives stacked into each ad set — let Meta pick the winner." },
  multiply: { icon: Sparkles, ratio: "×N", blurb: "Duplicate the whole structure once per creative." },
  manual: { icon: SlidersHorizontal, ratio: "map", blurb: "Place each creative into a numbered slot yourself." },
  custom: {
    icon: SlidersHorizontal,
    ratio: "free",
    blurb: "Define exact structure — campaigns, ad sets, and ads per set.",
  },
};

export const SPREAD_ORDER: SpreadMode[] = ["one_per_adset", "round_robin", "stacked", "multiply", "custom"];
