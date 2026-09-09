import type { Provenance } from "@/genie6/lib/genieRunTypes";

/**
 * Storyboards — scene-by-scene shot plans for a video (or multi-frame
 * static) ad. A Creative-asset type joining the Catalogue registry
 * (`src/catalogue/assetTypes.ts`) alongside Scripts and Frameworks, its
 * two closest siblings: like Scripts, each one is brand/product-linked,
 * reviewed, reusable copy; like Frameworks, the substance is an ordered
 * breakdown (here, scenes rather than named sections).
 *
 * These are REVIEWED, SAVED storyboards — distinct from
 * `src/genie6/library/tabs/generatedAssetPool.ts`'s `GENERATED_STORYBOARDS`
 * (Genie's own "generated, not yet saved anywhere" pool, owned by the
 * Library agent). Same scene vocabulary (sceneNumber / shot / description /
 * durationSec) so the two read as one concept, but this file is its own,
 * independent seed set — it does not import from or mutate that pool.
 */

export interface StoryboardScene {
  sceneNumber: number;
  shot: string;
  description: string;
  durationSec: number;
}

export interface StoryboardAsset {
  id: string;
  title: string;
  brandId?: string;
  productName?: string;
  /** Display format, e.g. "9:16 video" / "1:1 static" — same vocabulary as Concepts. */
  formatLabel: string;
  scenes: StoryboardScene[];
  thumbnail: string;
  tags: string[];
  usageCount: number;
  /** ISO date. */
  lastUsedAt: string;
  provenance: Provenance;
}

const sc = (sceneNumber: number, shot: string, description: string, durationSec: number): StoryboardScene => ({
  sceneNumber,
  shot,
  description,
  durationSec,
});

const sb = (
  id: string,
  title: string,
  brandId: string | undefined,
  productName: string | undefined,
  formatLabel: string,
  scenes: StoryboardScene[],
  thumbnail: string,
  tags: string[],
  usageCount: number,
  lastUsedAt: string,
  provenance: Provenance = "fabfunnel-seeded",
): StoryboardAsset => ({ id, title, brandId, productName, formatLabel, scenes, thumbnail, tags, usageCount, lastUsedAt, provenance });

export const storyboards: StoryboardAsset[] = [
  sb(
    "storyboard-mamaearth-onion-hairline",
    "Onion Shampoo — hairline recovery UGC storyboard",
    "mamaearth",
    "Onion Hair Shampoo for Hair Fall Control",
    "9:16 video",
    [
      sc(1, "Close-up", "Hairbrush check after a shower, visible strands caught in the bristles", 4),
      sc(2, "Mid shot", "Presenter picks up the bottle, states the onion + keratin claim direct to camera", 5),
      sc(3, "Overhead", "Lathering demo on wet hair, product texture visible", 4),
      sc(4, "Macro", "Scalp close-up six weeks later, visibly fuller part-line", 5),
      sc(5, "End card", "Pack shot with the 30-day money-back badge", 3),
    ],
    "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=400&q=75",
    ["UGC", "haircare", "5-scene"],
    22,
    "2026-08-24",
  ),
  sb(
    "storyboard-boat-airdopes-monsoon",
    "Airdopes 161 — monsoon commute proof storyboard",
    "boat",
    "Airdopes 161",
    "1:1 static",
    [
      sc(1, "Wide", "Rain hitting a commuter's shoulder, earbuds still seated and playing", 4),
      sc(2, "Macro", "Water beading off the IPX4 shell, sealed charging case beside it", 3),
      sc(3, "End card", "42-hour battery claim over a clean pack shot with price", 3),
    ],
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=75",
    ["durability", "audio", "3-scene"],
    15,
    "2026-08-19",
  ),
  sb(
    "storyboard-noise-colorfit-battery",
    "ColorFit Pro 5 — 7-day battery comparison storyboard",
    "noise",
    "ColorFit Pro 5 Buzz with Bluetooth Calling",
    "9:16 video",
    [
      sc(1, "Establishing", "Three smartwatches lined up on a desk, a day-counter overlay starts at zero", 5),
      sc(2, "Time-lapse", "Two watches go dark by day three; the ColorFit Pro 5 keeps its display lit", 6),
      sc(3, "Close-up", "Bluetooth call answered straight from the watch face", 4),
      sc(4, "End card", "Price and the 7-day battery claim over a clean product shot", 3),
    ],
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=75",
    ["comparison", "wearables", "4-scene"],
    27,
    "2026-08-21",
  ),
  sb(
    "storyboard-plum-vitc-glow",
    "Vit C Serum — 2-week glow storyboard",
    "plum",
    "Plum 15% Vit C Serum",
    "9:16 video",
    [
      sc(1, "Close-up", "Dull skin under bathroom light, no filter, diary-style caption", 4),
      sc(2, "Mid shot", "Applying the serum as part of a morning routine", 4),
      sc(3, "Macro", "Brighter, more even tone at the two-week mark, split-screen comparison", 5),
      sc(4, "End card", "Vegan, cruelty-free badge over the pack shot", 3),
    ],
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=75",
    ["skincare", "before-after", "4-scene"],
    18,
    "2026-08-12",
  ),
  sb(
    "storyboard-sleepyhead-mattress-trial",
    "Original Mattress — 100-night trial storyboard",
    "sleepyhead",
    "Sleepyhead Original Mattress",
    "1:1 static",
    [
      sc(1, "Wide", "Stiff-backed morning stretch, a cluttered pillow fort in the background", 4),
      sc(2, "Mid shot", "Unboxing the memory foam mattress, the trial card visible in frame", 4),
      sc(3, "End card", "\"No more back pain\" callout with the 100-night trial badge", 3),
    ],
    "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=400&q=75",
    ["sleep", "trial", "3-scene"],
    9,
    "2026-07-30",
  ),
  sb(
    "storyboard-mcaffeine-scrub-reset",
    "Coffee Body Scrub — 2-minute reset storyboard",
    "mcaffeine",
    "mCaffeine Coffee Body Scrub",
    "9:16 video",
    [
      sc(1, "Overhead", "Coffee grounds and the scrub jar laid out on a shower ledge", 3),
      sc(2, "Close-up", "Scrub massaged into damp skin, visible exfoliation texture", 4),
      sc(3, "Mid shot", "Rinse-off reveal, presenter reacts to smoother skin", 4),
      sc(4, "End card", "Cruelty-free badge with pack shot and price", 3),
    ],
    "https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=400&q=75",
    ["lifestyle", "skincare", "4-scene"],
    11,
    "2026-08-06",
  ),
  sb(
    "storyboard-wakefit-pillow-support",
    "Ortho Pillow — neck-support spec storyboard",
    "wakefit",
    "Wakefit Ortho Pillow",
    "4:5 static",
    [
      sc(1, "Macro", "Cooling gel layer cross-section, the ortho-curve edge visible", 4),
      sc(2, "Mid shot", "Side-sleeper resting with visibly aligned neck posture", 4),
      sc(3, "End card", "CertiPUR-US badge with price and the 100-night trial", 3),
    ],
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=75",
    ["sleep", "spec-led", "3-scene"],
    6,
    "2026-07-02",
  ),
  sb(
    "storyboard-derma-co-niacinamide-proof",
    "Niacinamide Serum — pigmentation proof storyboard",
    "the-derma-co",
    "The Derma Co 10% Niacinamide Serum",
    "9:16 video",
    [
      sc(1, "Close-up", "Post-acne marks under ring light, no makeup, diary-style caption", 4),
      sc(2, "Mid shot", "Dermatologist-in-coat cutaway citing the 4-week clinical claim", 5),
      sc(3, "Overhead", "Serum drop applied under the eye and along the cheekbone", 3),
      sc(4, "Macro", "Marks visibly faded at four weeks, split-screen comparison", 5),
      sc(5, "End card", "\"Dermatologist-tested\" badge over the pack shot", 3),
    ],
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=75",
    ["skincare", "clinical", "5-scene"],
    13,
    "2026-08-16",
  ),
  sb(
    "storyboard-client-diwali-bundle-draft",
    "Diwali gifting bundle — storyboard draft v1",
    "mamaearth",
    "Onion Shampoo + Vitamin C Facewash gift set",
    "1:1 static",
    [
      sc(1, "Wide", "Festive table setup with the gift hamper, diyas softly out of focus", 3),
      sc(2, "Close-up", "[DRAFT — swap in the real hamper packaging once photography is back from the shoot]", 4),
      sc(3, "End card", "Diwali offer badge over placeholder pack art", 3),
    ],
    "https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=400&q=75",
    ["festive", "draft"],
    1,
    "2026-09-05",
    "client-created",
  ),
];

export function getStoryboardsForBrand(brandId: string): StoryboardAsset[] {
  return storyboards.filter((s) => s.brandId === brandId);
}
