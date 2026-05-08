import type { Hook } from "@/genie6/types/entities";

/**
 * Hooks — single source of truth (Catalogue ↔ Genie sync).
 *
 * 52 entries · real ad copy hooks with realistic CTR/impressions per angle.
 * Each hook references a `brandId` (in `./brands.ts`) and an `angleId`
 * (in `./angles.ts`). Performance numbers are non-round per design system §6.
 *
 * Schema: see `Hook` in `@/genie6/types/entities`.
 */

const hk = (id: string, text: string, brandId: string, angleId: string, ctr?: number, impressions?: number): Hook => ({
  id, text, brandId, angleId,
  ...(ctr !== undefined && impressions !== undefined ? { performance: { ctr, impressions } } : {}),
});

export const hooks: Hook[] = [
  // Mamaearth (5)
  hk("hook-1", "Hair fall is real. This is not.", "mamaearth", "ang-comparison", 4.73, 142_840),
  hk("hook-mama-2", "We tested it on our own kids. Then on yours.", "mamaearth", "ang-emotional-story", 3.28, 98_120),
  hk("hook-mama-3", "Plant-based. Mom-tested. ₹50 off your first order.", "mamaearth", "ang-discount", 2.64, 67_400),
  hk("hook-mama-4", "Onion shampoo: real ingredient, real results.", "mamaearth", "ang-ingredient-deep-dive", 3.91, 124_580),
  hk("hook-mama-5", "Made Safe certified. No more reading labels.", "mamaearth", "ang-certification", 2.18, 41_200),

  // Noise (5)
  hk("hook-4", "POV: you finally found the smartwatch that survives squat day.", "noise", "ang-asp-lifestyle", 5.18, 201_447),
  hk("hook-noise-2", "Tested 3 smartwatches. This one stayed.", "noise", "ang-comparison", 4.42, 117_890),
  hk("hook-noise-3", "Bluetooth calling. AMOLED. 100+ sport modes. ₹3,499.", "noise", "ang-roi-led", 3.71, 89_220),
  hk("hook-noise-4", "Charge in 10 mins. Last all day.", "noise", "ang-problem-solution", 4.08, 142_300),
  hk("hook-noise-5", "Made in India. Engineered for Indian wrists.", "noise", "ang-heritage", 2.93, 51_640),

  // boAt (5)
  hk("hook-2", "Stop scrolling if you've ever had AirPods die at 6pm.", "boat", "ang-fomo", 3.92, 88_120),
  hk("hook-boat-2", "Plug-in. Plush bass. Pure boAt.", "boat", "ang-asp-lifestyle", 3.14, 76_400),
  hk("hook-boat-3", "ENx tech filters out everything. Even your boss's voice.", "boat", "ang-emotional-story", 4.27, 134_780),
  hk("hook-boat-4", "Buy 1, get 1 — Airdopes 141 special.", "boat", "ang-bogo", 5.62, 287_120),
  hk("hook-boat-5", "ASAP charge: 10 mins → 200 mins playback.", "boat", "ang-explainer", 3.48, 92_300),

  // Plum (4)
  hk("hook-3", "10 reasons your hair gummy isn't working.", "plum", "ang-authority", 2.87, 45_220),
  hk("hook-plum-2", "Vegan. Cruelty-free. Planet-positive packaging.", "plum", "ang-sustainability", 2.41, 38_900),
  hk("hook-plum-3", "Niacinamide 10% — for the pores you can see.", "plum", "ang-ingredient-deep-dive", 3.78, 87_400),
  hk("hook-plum-4", "First time? ₹100 off code: NEWPLUM.", "plum", "ang-discount", 4.12, 124_300),

  // Sleepyhead / Wakefit (5)
  hk("hook-5", "Sleep that earns its place in your day.", "sleepyhead", "ang-asp-lifestyle", 1.94, 28_660),
  hk("hook-7", "Made for the back you don't think about anymore.", "sleepyhead", "ang-asp-lifestyle"),
  hk("hook-sleep-2", "100 nights to fall in love. Or your money back.", "sleepyhead", "ang-risk-reversal", 3.82, 98_400),
  hk("hook-wake-1", "Built to last 10 years. Backed by warranty.", "wakefit", "ang-warranty", 2.94, 67_200),
  hk("hook-wake-2", "₹14,999 — our lowest ever for the queen size.", "wakefit", "ang-discount", 4.21, 142_300),

  // Lenskart (4)
  hk("hook-lk-1", "Free home eye check. Frames from ₹999.", "lenskart", "ang-roi-led", 3.42, 89_400),
  hk("hook-lk-2", "BLU-Cut for the screen-time generation.", "lenskart", "ang-problem-solution", 3.18, 76_800),
  hk("hook-lk-3", "3D try-on before you buy.", "lenskart", "ang-explainer", 4.01, 132_400),
  hk("hook-lk-4", "₹1,500 off first frame. Code: NEWFRAME.", "lenskart", "ang-discount", 4.87, 198_300),

  // SUGAR / MyGlamm (4)
  hk("hook-sugar-1", "Matte. As. Hell. 12-hour wear.", "sugar", "ang-asp-lifestyle", 4.73, 167_200),
  hk("hook-sugar-2", "Made for Indian skin tones. Finally.", "sugar", "ang-segment-specific", 3.94, 124_700),
  hk("hook-mg-1", "LIT kajal — smudge-proof for 12 hours.", "myglamm", "ang-problem-solution", 3.28, 87_900),
  hk("hook-mg-2", "Manish Malhotra collab. While stocks last.", "myglamm", "ang-celeb-endorsed", 5.04, 234_700),

  // Bewakoof / Souled Store (3)
  hk("hook-bw-1", "Naruto Sage Mode tee. ₹599. Limited drop.", "bewakoof", "ang-scarcity", 4.61, 178_300),
  hk("hook-bw-2", "Buy 3 tees, pay for 2.", "bewakoof", "ang-bogo", 3.87, 142_700),
  hk("hook-ss-1", "Official Marvel hoodie. Avengers approved.", "souled-store", "ang-celeb-endorsed", 3.42, 98_400),

  // BlueStone / CaratLane (3)
  hk("hook-bs-1", "BIS-hallmarked. 30-day returns. Try at home.", "bluestone", "ang-risk-reversal", 2.84, 51_400),
  hk("hook-cl-1", "Solitaire studs from ₹18,999.", "caratlane", "ang-roi-led", 3.12, 76_800),
  hk("hook-cl-2", "First-anniversary gift sorted.", "caratlane", "ang-gifting", 3.94, 124_700),

  // Bombay Shaving Co / Beardo (3)
  hk("hook-bsc-1", "6 blades. Zero nicks. ₹599.", "bombay-shaving-co", "ang-ingredient-deep-dive", 3.42, 98_700),
  hk("hook-bd-1", "Hrithik trusts it. Shouldn't you?", "beardo", "ang-celeb-endorsed", 4.18, 167_200),
  hk("hook-bd-2", "Beard oil that fixes the itch.", "beardo", "ang-problem-solution", 3.74, 112_400),

  // Yoga Bar / OZiva (3)
  hk("hook-yb-1", "20g protein. Real food. No maltitol.", "yoga-bar", "ang-ingredient-deep-dive", 3.91, 124_300),
  hk("hook-yb-2", "Buy 6 bars, get 2 free.", "yoga-bar", "ang-bogo", 3.42, 87_900),
  hk("hook-oz-1", "Plant protein for women. Designed by women.", "oziva", "ang-empowerment", 4.27, 156_400),

  // Snitch (2)
  hk("hook-sn-1", "Slim-fit blazers from ₹2,499.", "snitch", "ang-discount", 2.84, 67_400),
  hk("hook-sn-2", "Weekly drops. New stock every Friday.", "snitch", "ang-launch", 4.18, 178_300),

  // Mensa Brands (1)
  hk("hook-8", "5 founders. 11 brands. ₹2,499 starter kit.", "mensa-brands", "ang-bundle"),

  // Mokobara (2)
  hk("hook-mk-1", "10-year warranty. Aerospace polycarbonate.", "mokobara", "ang-warranty", 2.94, 51_200),
  hk("hook-mk-2", "Designed for the 6-flight-a-year executive.", "mokobara", "ang-segment-specific", 3.41, 87_400),
];
