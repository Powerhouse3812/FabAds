/**
 * Mock creative pool — the small "real creative" slice: identifiable, pickable
 * assets (vs the earlier fake-append). The Step-4 picker selects from these,
 * allocation maps them onto ad slots, and the Detail/CSV surfaces show which
 * creative landed where. Thumbnails are optional (the picker falls back to a
 * type-icon tile). [I] placeholder names/types — Maalik can swap the real pool.
 */
import type { CreativeAsset } from "../types";

export const MOCK_CREATIVES: CreativeAsset[] = [
  { id: "cr_acme_hero", name: "Acme — Hero static", type: "single-image", source: "library" },
  { id: "cr_acme_carousel", name: "Acme — 5-card carousel", type: "carousel", source: "library" },
  { id: "cr_acme_ugc", name: "Acme — UGC unboxing 15s", type: "video", source: "library", durationSec: 15 },
  { id: "cr_mama_before_after", name: "Mamaearth — Before/After", type: "single-image", source: "library" },
  { id: "cr_mama_routine", name: "Mamaearth — Morning routine 22s", type: "video", source: "library", durationSec: 22 },
  { id: "cr_mama_post", name: "Mamaearth — Boosted IG post", type: "single-image", source: "post" },
  { id: "cr_boat_tws", name: "boAt — TWS launch reel 18s", type: "video", source: "library", durationSec: 18 },
  { id: "cr_boat_carousel", name: "boAt — Specs carousel", type: "carousel", source: "library" },
  { id: "cr_noise_watch", name: "Noise — Smartwatch hero", type: "single-image", source: "upload" },
  { id: "cr_dpa_feed", name: "Catalogue — DPA dynamic feed", type: "dpa", source: "catalogue" },
  { id: "cr_sleepy_lifestyle", name: "Sleepyhead — Lifestyle still", type: "single-image", source: "upload" },
  { id: "cr_sleepy_demo", name: "Sleepyhead — Product demo 30s", type: "video", source: "library", durationSec: 30 },
];

export function getCreativeAsset(id: string): CreativeAsset | undefined {
  return MOCK_CREATIVES.find((c) => c.id === id);
}

/** Assets matching an ad type (dpa shows only dpa; others exclude dpa). */
export function creativesForType(type: CreativeAsset["type"]): CreativeAsset[] {
  if (type === "dpa") return MOCK_CREATIVES.filter((c) => c.type === "dpa");
  return MOCK_CREATIVES.filter((c) => c.type === type);
}
