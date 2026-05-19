import type { ComponentType } from "react";
import { TokensPrimary } from "./TokensPrimary";
import { TokensSurfaces } from "./TokensSurfaces";
import { TokensStatus } from "./TokensStatus";

export interface Slide {
  slug: string;
  section: string;
  label: string;
  w: number;
  h: number;
  Component: ComponentType;
}

/**
 * Brand Book — slide registry.
 *
 * Currently stripped down to just the Token Migration deck (3 slides)
 * per Maalik's call. The previous 16 slides (Cover / Logo / Color
 * system / Typography / etc.) are unregistered but their component
 * files remain in `slides/` so they can be re-added in the future
 * without rebuild.
 *
 * The Brand Book frame has `overflow: hidden` on `.bb-artboard`, so
 * each slide must fit inside its declared `h` value. The Token
 * migration (25 tokens + 6 usage rules) was originally one ~1180-tall
 * slide that clipped — split into 3 below at h: 920 each.
 */
export const SLIDES: Slide[] = [
  { slug: "tokens-primary",  section: "06 · Tokens", label: "Token migration · 1/3 Primary",  w: 1280, h: 920, Component: TokensPrimary },
  { slug: "tokens-surfaces", section: "06 · Tokens", label: "Token migration · 2/3 Surfaces", w: 1280, h: 920, Component: TokensSurfaces },
  { slug: "tokens-status",   section: "06 · Tokens", label: "Token migration · 3/3 Status",   w: 1280, h: 920, Component: TokensStatus },
];

export const SLIDE_BY_SLUG: Record<string, number> = Object.fromEntries(
  SLIDES.map((s, i) => [s.slug, i]),
);
