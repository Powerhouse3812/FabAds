import type { ComponentType } from "react";
import { Cover } from "./Cover";
import { HeroLockup } from "./HeroLockup";
import { Anatomy } from "./Anatomy";
import { Variants } from "./Variants";
import { ClearSpace } from "./ClearSpace";
import { MinSizes } from "./MinSizes";
import { DoDont } from "./DoDont";
import { MonoUsage } from "./MonoUsage";
import { ColorSystem } from "./ColorSystem";
import { Typography } from "./Typography";
import { AppIcons } from "./AppIcons";
import { InContextApp } from "./InContextApp";
import { PrintApps } from "./PrintApps";
import { Swag } from "./Swag";
import { Social } from "./Social";
import { FileInventory } from "./FileInventory";
import { TokensSlide } from "./TokensSlide";

export interface Slide {
  slug: string;
  section: string;
  label: string;
  w: number;
  h: number;
  Component: ComponentType;
}

export const SLIDES: Slide[] = [
  { slug: "cover",       section: "01 · Identity",     label: "Cover",             w: 1280, h: 860, Component: Cover },
  { slug: "hero",        section: "01 · Identity",     label: "Primary lockup",    w: 1280, h: 620, Component: HeroLockup },
  { slug: "anatomy",     section: "01 · Identity",     label: "Mark anatomy",      w: 1280, h: 780, Component: Anatomy },
  { slug: "variants",    section: "01 · Identity",     label: "Approved variants", w: 1280, h: 780, Component: Variants },
  { slug: "clear-space", section: "02 · Logo usage",   label: "Clear space",       w: 1280, h: 780, Component: ClearSpace },
  { slug: "min-sizes",   section: "02 · Logo usage",   label: "Minimum sizes",     w: 1280, h: 780, Component: MinSizes },
  { slug: "do-dont",     section: "02 · Logo usage",   label: "Do & don't",        w: 1280, h: 780, Component: DoDont },
  { slug: "mono",        section: "02 · Logo usage",   label: "Mono with detail",  w: 1280, h: 780, Component: MonoUsage },
  { slug: "color",       section: "03 · Color & type", label: "Color system",      w: 1280, h: 920, Component: ColorSystem },
  { slug: "type",        section: "03 · Color & type", label: "Typography",        w: 1280, h: 780, Component: Typography },
  { slug: "app-icons",   section: "03 · Color & type", label: "App icons",         w: 1280, h: 780, Component: AppIcons },
  { slug: "product-ui",  section: "04 · In context",   label: "Product UI",        w: 1280, h: 620, Component: InContextApp },
  { slug: "stationery",  section: "04 · In context",   label: "Stationery",        w: 1280, h: 620, Component: PrintApps },
  { slug: "swag",        section: "04 · In context",   label: "Swag",              w: 1280, h: 620, Component: Swag },
  { slug: "social",      section: "04 · In context",   label: "Social & OG",       w: 1280, h: 620, Component: Social },
  { slug: "files",       section: "05 · Files",        label: "File inventory",    w: 1280, h: 780, Component: FileInventory },
  // 06 · Tokens — last slide. Full migration table (25 tokens across 7
  // sections) with NEW + OLD strikethrough per token, side-by-side
  // Light/Dark swatches. Reference-grade for designer/dev handoff.
  { slug: "tokens",      section: "06 · Tokens",       label: "Token migration",   w: 1280, h: 1180, Component: TokensSlide },
];

export const SLIDE_BY_SLUG: Record<string, number> = Object.fromEntries(
  SLIDES.map((s, i) => [s.slug, i]),
);
