/**
 * Studio v3 — type model (A-11.14).
 *
 * 3-category IA per Maalik:
 *   - Brand: Brand-focused, Product-focused, Product Shoot
 *   - Ad: Product Ad, Performance Ad, Brand Ad
 *   - Social: coming soon
 *   - Quick modes (separate row): UGC Video, Variations, Image-to-Ad
 *
 * Sub-modes inside Brand-focused / Product-focused are "two angles of Brand
 * Ad" per Maalik — same form, different prompt-bias. Field/flow decisions
 * deferred until each sub-mode form lands.
 *
 * Forms ship one-by-one starting with Product Shoot (next commit).
 */

export type CategoryId = "brand" | "ad" | "social";
export type QuickModeId = "ugc-video" | "variations" | "image-to-ad";

export type SubModeStatus = "ready" | "coming-soon";

export interface SubModeDescriptor {
  /** Slug used in routing (`/generate-v3/{categoryId}/{id}`) */
  id: string;
  label: string;
  /** 1-line context shown under the label */
  description: string;
  /** lucide-react icon name */
  icon: string;
  status?: SubModeStatus;
}

export interface CategoryDescriptor {
  id: CategoryId;
  label: string;
  /** 1-line context shown under the category label */
  description: string;
  status: SubModeStatus;
  subModes: SubModeDescriptor[];
}

/**
 * Locked-in 3 categories. Order matters — defines render order on Landing.
 */
export const CATEGORIES: CategoryDescriptor[] = [
  {
    id: "brand",
    label: "Brand",
    description: "Brand assets and brand-anchored ads.",
    status: "ready",
    subModes: [
      {
        id: "brand-focused",
        label: "Brand-focused",
        description: "Brand identity-led ad",
        icon: "Sparkles",
      },
      {
        id: "product-focused",
        label: "Product-focused",
        description: "Product-led, brand-anchored ad",
        icon: "ShoppingBag",
      },
      {
        id: "product-shoot",
        label: "Product Shoot",
        description: "Studio-quality product photography (asset)",
        icon: "Camera",
      },
    ],
  },
  {
    id: "ad",
    label: "Ad",
    description: "Direct ad generation across the funnel.",
    status: "ready",
    subModes: [
      {
        id: "product-ad",
        label: "Product Ad",
        description: "Sell a product with brand context",
        icon: "ShoppingBag",
      },
      {
        id: "performance-ad",
        label: "Performance Ad",
        description: "Performance ads anchored to a category + landing page",
        icon: "Target",
      },
      {
        id: "brand-ad",
        label: "Brand Ad",
        description: "Hero ads anchored to a brand profile",
        icon: "Sparkles",
      },
    ],
  },
  {
    id: "social",
    label: "Social",
    description: "Social-native creatives (Reels, Stories, native posts).",
    status: "coming-soon",
    subModes: [],
  },
];

/**
 * Quick modes — separate row below the 3 main category cards. Smaller
 * affordance, denser. Kept alongside CATEGORIES for now; can be moved
 * into Brand/Ad/Social later if a sub-mode home makes more sense.
 */
export const QUICK_MODES: SubModeDescriptor[] = [
  {
    id: "ugc-video",
    label: "UGC Video",
    description: "Avatar / script / talking-head video",
    icon: "Video",
  },
  {
    id: "variations",
    label: "Variations",
    description: "Generate variants of a winning ad",
    icon: "RefreshCw",
  },
  {
    id: "image-to-ad",
    label: "Image-to-Ad",
    description: "Convert an image into a finished ad",
    icon: "Image",
  },
];

/* ─────────────────────────────────────────────────────────
 *  Lookup helpers
 * ───────────────────────────────────────────────────────── */

export function findCategory(id: string | undefined): CategoryDescriptor | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function findSubMode(
  categoryId: string | undefined,
  subModeId: string | undefined,
): SubModeDescriptor | undefined {
  const cat = findCategory(categoryId);
  if (!cat) return undefined;
  return cat.subModes.find((m) => m.id === subModeId);
}

export function findQuickMode(id: string | undefined): SubModeDescriptor | undefined {
  return QUICK_MODES.find((m) => m.id === id);
}
