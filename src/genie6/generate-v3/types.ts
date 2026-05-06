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
  /**
   * A-11.15: real Unsplash creative imagery used as a preview thumbnail
   * on the Variant 2 (horizontal stacked-rows) layout. Picked to evoke
   * what each sub-mode would generate — product shoot looks like product
   * photography, UGC video looks like a portrait/talking-head, etc.
   * Stop-gap until real generated samples land in iter-8+.
   */
  previewUrl?: string;
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
    label: "Asset",
    description: "Brand-anchored assets — reusable building blocks.",
    status: "ready",
    subModes: [
      {
        id: "brand-focused",
        label: "Brand-focused",
        description: "Brand identity-led asset",
        icon: "Sparkles",
        previewUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=480&h=320&q=70",
      },
      {
        id: "product-focused",
        label: "Product-focused",
        description: "Product-led, brand-anchored asset",
        icon: "ShoppingBag",
        previewUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=480&h=320&q=70",
      },
      {
        id: "product-shoot",
        label: "Product Shoot",
        description: "Studio-quality product photography (asset)",
        icon: "Camera",
        previewUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=480&h=320&q=70",
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
        previewUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=480&h=320&q=70",
      },
      {
        id: "performance-ad",
        label: "Performance Ad",
        description: "Performance ads anchored to a category + landing page",
        icon: "Target",
        previewUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=480&h=320&q=70",
      },
      {
        id: "brand-ad",
        label: "Brand Ad",
        description: "Hero ads anchored to a brand profile",
        icon: "Sparkles",
        previewUrl: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=480&h=320&q=70",
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
    previewUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=480&h=320&q=70",
  },
  {
    id: "variations",
    label: "Variations",
    description: "Generate variants of a winning ad",
    icon: "RefreshCw",
    previewUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=480&h=320&q=70",
  },
  {
    id: "image-to-ad",
    label: "Image-to-Ad",
    description: "Convert an image into a finished ad",
    icon: "Image",
    previewUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b8?auto=format&fit=crop&w=480&h=320&q=70",
  },
  {
    id: "bg-remover",
    label: "Background Remover",
    description: "Cut your subject out — clean PNG with transparent bg",
    icon: "Eraser",
    previewUrl: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=480&h=320&q=70",
  },
  {
    id: "bg-swap",
    label: "Background Swap",
    description: "Replace product photo background — studio / lifestyle / festive",
    icon: "Layers",
    previewUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=480&h=320&q=70",
  },
  {
    id: "refresh-winner",
    label: "Refresh Winner",
    description: "Take a winning ad — get fresh variants with creative-fatigue logic",
    icon: "TrendingUp",
    previewUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=480&h=320&q=70",
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
