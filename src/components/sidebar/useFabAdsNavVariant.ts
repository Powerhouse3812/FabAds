import { useEffect, useSyncExternalStore } from "react";

/**
 * FabAds shell-level navigation variant.
 *
 * **Dev-tool, not user-facing.** Variants exist so Maalik can A/B compare
 * visual treatments side-by-side. Hidden from users — toggled by clicking the
 * FabAds logo in the sidebar header (Shift+Click for explicit picker).
 *
 * Sets one attribute on <html>:
 *   data-fabads-nav-variant="sections|darkAlways|glass|workbench|glassDark|glassLight"
 *
 * Variants are STRUCTURALLY DISTINCT (not just chromatic re-skins). Iter-6 A-9
 * adds two new dramatic-glass variants from Maalik's inspirations.
 *
 *   sections    — default. Classic 240px flush sectioned panel. Lime accent.
 *                 Full chrome (chevrons, dots, left active-bar). Linear/Vercel.
 *   darkAlways  — same 240px footprint BUT always-dark + MONOCHROMATIC (no
 *                 lime, only white/grey) + STRIPPED chrome. Industry Insights
 *                 moves to a separate EXTENSIONS group (gated extension cue).
 *   glass       — DETACHED FLOATING panel (margin + rounded + soft shadow).
 *                 Apple liquid-glass — subtle, auto-theme. Internal orb layer +
 *                 blur plate (A-9 fix; previously the orbs bled outside as a
 *                 shadow-like artifact).
 *   workbench   — each group renders as a DISCRETE CARD with gaps between.
 *                 Notion-blocks pattern.
 *   glassDark   — NEW (A-9). Deep dark navy gradient glass. Profile block at
 *                 top + brands/recent strip + bottom CTA card. Cinematic.
 *   glassLight  — NEW (A-9). Soft warm-pink frosty glass. Profile block at
 *                 top + brands/recent strip + bottom CTA card. Light, airy.
 *
 * Same IA + hierarchy across all 6 (RUN/CREATE/TOOLS, same modules + sub-items).
 *
 * Persistence: localStorage `fabads-nav-variant`. Default: `"sections"`.
 *
 * Architecture: module-level external store + useSyncExternalStore — same
 * pattern as `useGenie6Theme.ts`. HMR-friendly, no closure drift, cross-tab
 * sync via the `storage` event.
 */

export type FabAdsNavVariant =
  | "sections"
  | "darkAlways"
  | "glass"
  | "workbench"
  | "glassDark"
  | "glassLight"
  | "clickup";

const VARIANT_KEY = "fabads-nav-variant";
const DEFAULT_VARIANT: FabAdsNavVariant = "sections";

/** Cycle order for the logo click-to-cycle. */
export const VARIANT_CYCLE: FabAdsNavVariant[] = [
  "sections",
  "darkAlways",
  "glass",
  "workbench",
  "glassDark",
  "glassLight",
  "clickup",
];

/** Display metadata — shown in picker popover and tooltips. */
export const VARIANT_META: Record<FabAdsNavVariant, { label: string; index: number; hint: string }> = {
  sections:   { label: "Sections",    index: 1, hint: "Classic flush panel · lime accent · full chrome" },
  darkAlways: { label: "Dark Always", index: 2, hint: "Always-dark · monochromatic · stripped chrome" },
  glass:      { label: "Glass",       index: 3, hint: "Floating panel · Apple liquid-glass · subtle" },
  workbench:  { label: "Workbench",   index: 4, hint: "Discrete cards per group · Notion-blocks" },
  glassDark:  { label: "Glass Dark",  index: 5, hint: "Dark glass · lime/amber orbs · profile-at-top" },
  glassLight: { label: "Glass Light", index: 6, hint: "Warm frosty glass · profile + CTA card" },
  clickup:    { label: "ClickUp",     index: 7, hint: "Narrow icon-rail with stacked labels (ClickUp-style)" },
};

const VALID_VARIANTS: ReadonlySet<string> = new Set(VARIANT_CYCLE);

function readVariantFromStorage(): FabAdsNavVariant {
  if (typeof window === "undefined") return DEFAULT_VARIANT;
  const v = window.localStorage.getItem(VARIANT_KEY);
  return v && VALID_VARIANTS.has(v) ? (v as FabAdsNavVariant) : DEFAULT_VARIANT;
}

let currentVariant: FabAdsNavVariant = readVariantFromStorage();
const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getSnapshot(): FabAdsNavVariant {
  return currentVariant;
}

function getServerSnapshot(): FabAdsNavVariant {
  return DEFAULT_VARIANT;
}

export function setNavVariant(next: FabAdsNavVariant) {
  if (next === currentVariant) return;
  currentVariant = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(VARIANT_KEY, next);
  }
  emit();
}

/** Cycles to the next variant in VARIANT_CYCLE order. */
export function cycleNavVariant() {
  const idx = VARIANT_CYCLE.indexOf(currentVariant);
  const next = VARIANT_CYCLE[(idx + 1) % VARIANT_CYCLE.length];
  setNavVariant(next);
}

export function getNextVariant(current: FabAdsNavVariant): FabAdsNavVariant {
  const idx = VARIANT_CYCLE.indexOf(current);
  return VARIANT_CYCLE[(idx + 1) % VARIANT_CYCLE.length];
}

// Cross-tab sync
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== VARIANT_KEY) return;
    const next = readVariantFromStorage();
    if (next !== currentVariant) {
      currentVariant = next;
      emit();
    }
  });
}

export function useFabAdsNavVariant() {
  const variant = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.dataset.fabadsNavVariant = variant;
    return () => {
      delete document.documentElement.dataset.fabadsNavVariant;
    };
  }, [variant]);

  return { variant, setVariant: setNavVariant, cycle: cycleNavVariant };
}
