/**
 * Icon resolver for Other Apps (Genie 2.0 §8).
 *
 * The registry (owned by the App Data agent, `src/genie6/apps/data/appRegistry.ts`)
 * stores each app's icon as a plain string so the data file has zero React/JSX
 * imports. This is the one place that turns that string into an actual lucide
 * component.
 *
 * The curated map below is the exact 15 icon names `appRegistry.ts` uses
 * today (checked against it directly) plus a couple of generic fallbacks.
 * Anything outside that list still resolves via a namespace lookup against
 * the real `lucide-react` export table, so a future registry edit that picks
 * a different icon name never crashes the grid — it just falls back to
 * `Sparkles` if the name truly doesn't exist. Every name below was verified
 * against the installed `lucide-react` package.
 */
import * as LucideIcons from "lucide-react";
import {
  Languages,
  UserRound,
  Presentation,
  ArrowUpNarrowWide,
  Package,
  ScanFace,
  AudioWaveform,
  Sparkles,
  Clapperboard,
  Scissors,
  Layers,
  ImagePlus,
  MousePointerClick,
  Mic,
  Webcam,
  type LucideIcon as LucideIconType,
} from "lucide-react";

export type IconComponent = LucideIconType;

/** Curated: the exact icon names `appRegistry.ts` uses, live + coming-soon. */
const ICONS: Record<string, IconComponent> = {
  // Live
  Languages,
  UserRound,
  Presentation,
  ArrowUpNarrowWide,
  Package,
  ScanFace,
  AudioWaveform,
  // Coming soon
  Sparkles,
  Clapperboard,
  Scissors,
  Layers,
  ImagePlus,
  MousePointerClick,
  Mic,
  Webcam,
};

const FALLBACK: IconComponent = Sparkles;

/** Resolve a registry icon-name string to a component. Never throws. */
export function resolveIcon(name: string | undefined): IconComponent {
  if (!name) return FALLBACK;
  if (ICONS[name]) return ICONS[name];
  const dynamic = (LucideIcons as unknown as Record<string, unknown>)[name];
  if (typeof dynamic === "function" || (typeof dynamic === "object" && dynamic !== null)) {
    return dynamic as IconComponent;
  }
  return FALLBACK;
}
