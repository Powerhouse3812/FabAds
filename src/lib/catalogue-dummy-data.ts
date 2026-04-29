export interface DummyCatalogue {
  id: string;
  name: string;
}

export interface DummyProductSet {
  id: string;
  name: string;
  items: number;
  variants: number;
}

export const DUMMY_CATALOGUES: DummyCatalogue[] = [
  { id: "cat-1", name: "Catalogue name example" },
  { id: "cat-2", name: "Summer Collection 2025" },
  { id: "cat-3", name: "Electronics Store" },
  { id: "cat-4", name: "Home & Living" },
];

export const DUMMY_PRODUCT_SETS: Record<string, DummyProductSet[]> = {
  "cat-1": [
    { id: "all-1", name: "All products", items: 15, variants: 32 },
    { id: "set-1a", name: "Best Sellers", items: 5, variants: 12 },
    { id: "set-1b", name: "New Arrivals", items: 3, variants: 3 },
  ],
  "cat-2": [
    { id: "all-2", name: "All products", items: 42, variants: 89 },
    { id: "set-2a", name: "Swimwear", items: 12, variants: 24 },
    { id: "set-2b", name: "Sandals", items: 8, variants: 16 },
  ],
  "cat-3": [
    { id: "all-3", name: "All products", items: 120, variants: 340 },
    { id: "set-3a", name: "Smartphones", items: 18, variants: 36 },
    { id: "set-3b", name: "Laptops", items: 22, variants: 44 },
  ],
  "cat-4": [
    { id: "all-4", name: "All products", items: 67, variants: 150 },
    { id: "set-4a", name: "Furniture", items: 30, variants: 60 },
  ],
};

export const DUMMY_PRODUCT_IMAGES = [
  "/placeholder.svg",
  "/placeholder.svg",
  "/placeholder.svg",
  "/placeholder.svg",
];

export const PROMOTED_PRODUCT_PREFERENCES = [
  "All products equally",
  "Best sellers first",
  "Highest margin first",
  "Recently viewed first",
];

export const DUMMY_ACCOUNT_DEFAULTS = {
  page: "page-1",
  pixel: "pixel-1",
  website_url: "https://techflow.store",
  url_tags: "utm_source=facebook&utm_medium=cpc",
  display_link: "techflow.store",
  strategy_campaigns: 1,
  strategy_adsets: 2,
  strategy_ads: 3,
  catalogue_ads_defaults: {
    catalogue_id: "cat-1",
    promoted_preference: "All products equally",
    product_set_id: "set-1a",
    include_other_products: true,
    primary_text: "Discover our latest collection of premium products. Shop now and get free shipping on your first order!",
    headline: "Summer Sale|||Best Deals|||Limited Offer",
    description: "Free shipping on orders over $50|||Premium quality guaranteed",
    cta: "Shop now",
  },
};
