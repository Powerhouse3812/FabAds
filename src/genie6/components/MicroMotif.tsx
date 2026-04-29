import type { ModeId } from "../types/output";
import { cn } from "@/lib/utils";

/**
 * Per-mode micro-motif — distinct artwork for each of the 7 modes.
 * Used on Home mode cards and ModePicker chips.
 *
 * Each motif is a small SVG (32px square) with abstract shapes that hint at
 * the mode's purpose. Lime accent on neutral surface. Never identical across modes.
 */

type Props = { mode: ModeId; size?: number; className?: string };

export function MicroMotif({ mode, size = 32, className }: Props) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 40 40",
    "aria-hidden": true,
    className: cn("flex-shrink-0", className),
  };

  switch (mode) {
    case "brand-ad":
      // Layered rectangles — abstract logo composition
      return (
        <svg {...props}>
          <rect x="6" y="6" width="22" height="22" rx="3" fill="var(--g6-color-primary)" opacity="0.25" />
          <rect x="12" y="12" width="22" height="22" rx="3" fill="var(--g6-color-primary)" opacity="0.55" />
          <rect x="18" y="18" width="14" height="14" rx="2" fill="var(--g6-color-primary)" />
        </svg>
      );

    case "product-ad":
      // Bottle silhouette — direct product
      return (
        <svg {...props}>
          <path
            d="M16 6 h8 v4 l3 3 v18 a2 2 0 0 1 -2 2 h-10 a2 2 0 0 1 -2 -2 v-18 l3 -3 z"
            fill="var(--g6-color-primary)"
            opacity="0.85"
          />
          <rect x="16" y="22" width="8" height="3" fill="var(--g6-color-text-on-accent)" opacity="0.8" />
        </svg>
      );

    case "affiliate-ad":
      // Funnel triangle — DR funnel
      return (
        <svg {...props}>
          <path
            d="M6 8 H34 L26 22 V32 L18 30 V22 Z"
            fill="var(--g6-color-primary)"
            opacity="0.85"
          />
          <circle cx="20" cy="14" r="2" fill="var(--g6-color-text-on-accent)" />
        </svg>
      );

    case "ugc-video":
      // Avatar circle + speech bubble — talking head
      return (
        <svg {...props}>
          <circle cx="14" cy="18" r="7" fill="var(--g6-color-primary)" opacity="0.85" />
          <circle cx="14" cy="16" r="3" fill="var(--g6-color-text-on-accent)" opacity="0.7" />
          <path d="M14 21 c-3 0 -5 2 -5 4 v3 h10 v-3 c0 -2 -2 -4 -5 -4 z" fill="var(--g6-color-text-on-accent)" opacity="0.6" />
          <path
            d="M22 8 h12 a2 2 0 0 1 2 2 v8 a2 2 0 0 1 -2 2 h-7 l-3 3 v-3 h-2 a2 2 0 0 1 -2 -2 v-8 a2 2 0 0 1 2 -2 z"
            fill="var(--g6-color-primary)"
            opacity="0.55"
          />
        </svg>
      );

    case "forge":
      // Branching paths — lineage / iteration
      return (
        <svg {...props} fill="none" stroke="var(--g6-color-primary)" strokeWidth="2.5" strokeLinecap="round">
          <path d="M8 32 v-12 a4 4 0 0 1 4 -4 h6" />
          <path d="M8 32 v-22" />
          <path d="M18 16 a4 4 0 0 1 4 -4 h10" />
          <path d="M18 16 a4 4 0 0 0 4 4 h10" opacity="0.6" />
          <circle cx="8" cy="8" r="2" fill="var(--g6-color-primary)" stroke="none" />
          <circle cx="32" cy="12" r="2" fill="var(--g6-color-primary)" stroke="none" />
          <circle cx="32" cy="20" r="2" fill="var(--g6-color-primary)" stroke="none" opacity="0.6" />
        </svg>
      );

    case "image-to-ad":
      // Image rect → motion arrow + text lines (combines former image-to-adcopy + image-to-video)
      return (
        <svg {...props} fill="none" stroke="var(--g6-color-primary)" strokeWidth="2" strokeLinecap="round">
          <rect x="4" y="10" width="14" height="20" rx="2" fill="var(--g6-color-primary)" opacity="0.45" stroke="none" />
          <path d="M9 19 l3 -3 v6 z" fill="var(--g6-color-text-on-accent)" stroke="none" />
          <path d="M22 14 h12" />
          <path d="M22 20 h10" opacity="0.7" />
          <path d="M22 26 h12" opacity="0.5" />
          <path d="M19 20 l3 0" />
          <path d="M21 18 l2 2 l-2 2" />
        </svg>
      );

    default:
      return null;
  }
}
