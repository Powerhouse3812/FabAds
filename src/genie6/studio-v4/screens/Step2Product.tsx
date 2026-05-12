import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Building2,
  ChevronDown,
  Check,
  Plus,
  Loader2,
  Package,
  FolderOpen,
  Factory,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { brands as ALL_BRANDS, products as ALL_PRODUCTS, categories as ALL_CATEGORIES } from "@/mocks/shared";
import { HeroHeader } from "../components/HeroHeader";
import { SectionHeader } from "../components/SectionHeader";
import { UrlFetchModal } from "../components/UrlFetchModal";
import type { UseWizardReturn } from "../state/useWizard";

interface Step2Props {
  wizard: UseWizardReturn;
  onAdvance: () => void;
  onBack?: () => void;
}

type Tab = "brand" | "product" | "category";

/* ────────────────────────────────────────────────────────── *
 *  Image helpers — curated Unsplash photos for products and
 *  categories. Specific to the actual Indian DTC verticals;
 *  never generic stock.
 * ────────────────────────────────────────────────────────── */
const u = (id: string, w = 400) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

/** Category-id → curated Unsplash photo (editorial, category-specific) */
const CATEGORY_IMAGES: Record<string, string> = {
  "hair-care":          u("1631730486572-226d1f595b68"),
  "hair-oil":           u("1631730486572-226d1f595b68"),
  "hair-color":         u("1522337360826-84a329978e71"),
  "anti-dandruff":      u("1631730486572-226d1f595b68"),
  "skin-care":          u("1620916566398-39f1143ab7be"),
  "anti-aging":         u("1556228720-195a672e8a03"),
  "acne":               u("1571781926291-c477ebfd024b"),
  "pigmentation":       u("1620916566398-39f1143ab7be"),
  "sunscreen":          u("1556228453-efd6c1ff04f6"),
  "body-care":          u("1556228453-efd6c1ff04f6"),
  "foot-care":          u("1556228453-efd6c1ff04f6"),
  "lip-care":           u("1586495777744-4413f21062fa"),
  "baby-care":          u("1555252333-9f8e92e65df9"),
  "mens-grooming":      u("1622286342621-4bd786c2447c"),
  "beard-care":         u("1622286342621-4bd786c2447c"),
  "oral-care":          u("1571781926291-c477ebfd024b"),
  "personal-hygiene":   u("1556228720-195a672e8a03"),
  "fragrance":          u("1563170352-4d82b0b55f4b"),
  "makeup":             u("1586495777744-4413f21062fa"),
  "makeup-lip":         u("1586495777744-4413f21062fa"),
  "makeup-eye":         u("1531085258133-ffa7eb5cb5e9"),
  "makeup-face":        u("1586495777744-4413f21062fa"),
  "smartwatches":       u("1523275335684-37898b6baf30"),
  "wireless-earbuds":   u("1590658268037-41d3fd70a5cb"),
  "bluetooth-speakers": u("1589003077984-894e133dabab"),
  "fitness-trackers":   u("1523275335684-37898b6baf30"),
  "gaming-headsets":    u("1606220588913-b3aacb4d2f46"),
  "smart-rings":        u("1523275335684-37898b6baf30"),
  "mattresses":         u("1631049552057-403cdb8f0658"),
  "pillows":            u("1631049552057-403cdb8f0658"),
  "bedding":            u("1631049552057-403cdb8f0658"),
  "wellness":           u("1610450949065-1f2841536c88"),
  "vitamins":           u("1610450949065-1f2841536c88"),
  "probiotics":         u("1610450949065-1f2841536c88"),
  "apparel-casual":     u("1521572163474-6864f9cf17ab"),
  "apparel-formal":     u("1594938298603-f98e1dfb7c9e"),
  "apparel-ethnic":     u("1583391265465-7b0b43c6f68c"),
  "streetwear":         u("1576566588028-4147f3842f27"),
  "activewear":         u("1571019613454-1cb2f99b2d8b"),
  "yoga":               u("1545389336-cf090694435a"),
  "innerwear":          u("1521572163474-6864f9cf17ab"),
  "sleepwear":          u("1521572163474-6864f9cf17ab"),
  "sneakers":           u("1542291026-7eec264c27ff"),
  "footwear-formal":    u("1542291026-7eec264c27ff"),
  "sandals":            u("1542291026-7eec264c27ff"),
  "eyewear-sunglasses": u("1574258495973-f010dfbb5371"),
  "eyewear-optical":    u("1574258495973-f010dfbb5371"),
  "jewellery-gold":     u("1599643478518-a784e5dc4c8f"),
  "jewellery-silver":   u("1599643478518-a784e5dc4c8f"),
  "diamond":            u("1599643478518-a784e5dc4c8f"),
  "lab-diamond":        u("1599643478518-a784e5dc4c8f"),
  "furniture-sofa":     u("1555041469-a586c61ea9bc"),
  "furniture-bed":      u("1631049552057-403cdb8f0658"),
  "kitchen-appliances": u("1556909114-f6e7ad7d3136"),
  "cookware":           u("1556909114-f6e7ad7d3136"),
  "pet-care":           u("1543466835-00a7907e9de1"),
  "pet-food":           u("1543466835-00a7907e9de1"),
  "travel-bags":        u("1565620731358-7b6c1b95dadd"),
};

function resolveCategoryThumb(categoryId: string): string {
  return CATEGORY_IMAGES[categoryId] ?? u("1556228720-195a672e8a03");
}

/** Category-id → emoji illustration (top 30+ Indian DTC verticals) */
const CATEGORY_EMOJI: Record<string, string> = {
  "hair-care":          "💇",
  "hair-oil":           "🫒",
  "hair-color":         "🎨",
  "anti-dandruff":      "💆",
  "skin-care":          "🧴",
  "anti-aging":         "✨",
  "acne":               "🧪",
  "pigmentation":       "🌗",
  "sunscreen":          "☀️",
  "body-care":          "🧼",
  "foot-care":          "🦶",
  "lip-care":           "💋",
  "baby-care":          "👶",
  "mens-grooming":      "🪒",
  "beard-care":         "🧔",
  "oral-care":          "🪥",
  "personal-hygiene":   "🧻",
  "fragrance":          "🌸",
  "makeup":             "💄",
  "makeup-lip":         "💋",
  "makeup-eye":         "👁️",
  "makeup-face":        "💄",
  "smartwatches":       "⌚",
  "wireless-earbuds":   "🎧",
  "bluetooth-speakers": "🔊",
  "fitness-trackers":   "⌚",
  "gaming-headsets":    "🎮",
  "smart-rings":        "💍",
  "mattresses":         "🛏️",
  "pillows":            "🛌",
  "bedding":            "🛏️",
  "wellness":           "🌿",
  "vitamins":           "💊",
  "probiotics":         "🦠",
  "apparel-casual":     "👕",
  "apparel-formal":     "👔",
  "apparel-ethnic":     "🥻",
  "streetwear":         "🧢",
  "activewear":         "🏃",
  "yoga":               "🧘",
  "innerwear":          "🩲",
  "sleepwear":          "🌙",
  "sneakers":           "👟",
  "footwear-formal":    "👞",
  "sandals":            "🩴",
  "eyewear-sunglasses": "🕶️",
  "eyewear-optical":    "👓",
  "jewellery-gold":     "💍",
  "jewellery-silver":   "💎",
  "diamond":            "💎",
  "lab-diamond":        "💎",
  "furniture-sofa":     "🛋️",
  "furniture-bed":      "🛏️",
  "kitchen-appliances": "🍳",
  "cookware":           "🍲",
  "pet-care":           "🐾",
  "pet-food":           "🦴",
  "travel-bags":        "🧳",
};

/** Product keyword → curated photo. Prioritise thumbnail, then categoryId, then name. */
const PRODUCT_THUMB_BY_KEYWORD: { match: RegExp; url: string }[] = [
  { match: /hair/i,                   url: u("1631730486572-226d1f595b68") },
  { match: /serum|glow|vit.?c/i,      url: u("1620916566398-39f1143ab7be") },
  { match: /facewash|face.wash/i,      url: u("1571781926291-c477ebfd024b") },
  { match: /lip/i,                     url: u("1586495777744-4413f21062fa") },
  { match: /watch/i,                   url: u("1523275335684-37898b6baf30") },
  { match: /earbud|airpod|tws/i,       url: u("1590658268037-41d3fd70a5cb") },
  { match: /headphone|speaker/i,       url: u("1606220588913-b3aacb4d2f46") },
  { match: /mattress|bed/i,            url: u("1631049552057-403cdb8f0658") },
  { match: /sofa|furniture/i,          url: u("1555041469-a586c61ea9bc") },
  { match: /t.?shirt|jeans|shirt/i,    url: u("1521572163474-6864f9cf17ab") },
  { match: /sneaker|shoe/i,            url: u("1542291026-7eec264c27ff") },
  { match: /eyewear|sunglass|glass/i,  url: u("1574258495973-f010dfbb5371") },
  { match: /jewel|gold|diamond/i,      url: u("1599643478518-a784e5dc4c8f") },
  { match: /beard|groom/i,             url: u("1622286342621-4bd786c2447c") },
  { match: /vitamin|protein|supplement/i, url: u("1610450949065-1f2841536c88") },
  { match: /pet/i,                     url: u("1543466835-00a7907e9de1") },
  { match: /coffee|tea|snack|food/i,   url: u("1560472354-b33ff0c44a43") },
  { match: /travel|luggage/i,          url: u("1565620731358-7b6c1b95dadd") },
  { match: /skin|moistur|cream|body/i, url: u("1556228453-efd6c1ff04f6") },
];

function resolveProductThumb(p: { thumbnail?: string; categoryId?: string; name: string }): string {
  if (p.thumbnail) return p.thumbnail;
  // Try product name first (more specific), then categoryId
  const name = p.name.toLowerCase();
  const cat = p.categoryId ?? "";
  for (const { match, url } of PRODUCT_THUMB_BY_KEYWORD) {
    if (match.test(name) || match.test(cat)) return url;
  }
  // Category image as fallback (better than generic)
  if (cat && CATEGORY_IMAGES[cat]) return CATEGORY_IMAGES[cat];
  return u("1556228720-195a672e8a03");
}

/**
 * Top categories from canonical data — sorted by winner count (most
 * generated for = most relevant). Show up to 30 in the default grid.
 */
const TOP_CATEGORIES = [...ALL_CATEGORIES]
  .sort((a, b) => b.winnerCount - a.winnerCount)
  .slice(0, 30);

export function Step2Product({ wizard, onAdvance, onBack }: Step2Props) {
  // A-12.49 (Maalik): tab + the 3 picker popovers are URL-backed so a hard
  // refresh / deep link restores the exact UI state, and HTML.to.design
  // captures pick up the same screen the user was on.
  //
  //   ?step-tab     = brand | product | category   (active sub-tab)
  //   ?brand-picker = open                          (brand filter popover)
  //   ?industry-picker = open                       (industry filter popover)
  //   ?url-fetch    = open                          (URL fetch popover)
  //
  // Picker opens use replace:false → browser Back closes the picker first.
  // Tab switching uses replace:true → no history clutter.
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("step-tab");
  const tab: Tab =
    urlTab === "product" || urlTab === "category" || urlTab === "brand"
      ? urlTab
      : wizard.state.productId
        ? "product"
        : wizard.state.categoryId
          ? "category"
          : "brand";
  const setTab = (next: Tab) => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (next === "brand") sp.delete("step-tab");
        else sp.set("step-tab", next);
        return sp;
      },
      { replace: true },
    );
  };

  const makePopoverUrlState = (key: string) => {
    const open = searchParams.get(key) === "open";
    const setOpen = (next: boolean) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (next) sp.set(key, "open");
          else sp.delete(key);
          return sp;
        },
        { replace: false },
      );
    };
    return [open, setOpen] as const;
  };

  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [brandSearch, setBrandSearch] = useState("");
  const [brandOpen, setBrandOpen] = makePopoverUrlState("brand-picker");
  // Industry filter (Brand tab) — distinct values pulled from brands[].category
  const [industryFilter, setIndustryFilter] = useState<string | null>(null);
  const [industrySearch, setIndustrySearch] = useState("");
  const [industryOpen, setIndustryOpen] = makePopoverUrlState("industry-picker");
  const [urlOpen, setUrlOpen] = makePopoverUrlState("url-fetch");
  const [urlInput, setUrlInput] = useState("");
  const [fetching, setFetching] = useState(false);
  const [showFetchModal, setShowFetchModal] = useState(false);
  const [fetchedProduct, setFetchedProduct] = useState<typeof ALL_PRODUCTS[0] | null>(null);

  const handleFetchUrl = async () => {
    const v = urlInput.trim();
    if (!v) return;
    setFetching(true);
    await new Promise((r) => setTimeout(r, 1200));
    setFetching(false);
    setUrlInput("");
    setUrlOpen(false);

    if (tab === "brand") {
      // Brand tab: pick a random brand, set wizard state, toast, advance.
      const sampleBrand =
        ALL_BRANDS[Math.floor(Math.random() * Math.min(20, ALL_BRANDS.length))];
      if (!sampleBrand) return;
      wizard.patch({
        brandId: sampleBrand.id,
        productId: null,
        categoryId: null,
      });
      toast.success(`Found brand: ${sampleBrand.name}`);
      onAdvance();
      return;
    }

    const sample =
      ALL_PRODUCTS[Math.floor(Math.random() * Math.min(20, ALL_PRODUCTS.length))];
    if (!sample) return;
    setFetchedProduct(sample);
    setShowFetchModal(true);
  };

  const filteredBrands = useMemo(() => {
    let list = ALL_BRANDS;
    if (industryFilter) list = list.filter((b) => b.category === industryFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q),
      );
    }
    return list.slice(0, 60);
  }, [industryFilter, search]);

  const industries = useMemo(
    () => Array.from(new Set(ALL_BRANDS.map((b) => b.category))).sort(),
    [],
  );

  const filteredIndustryList = useMemo(() => {
    const term = industrySearch.trim().toLowerCase();
    if (!term) return industries;
    return industries.filter((i) => i.toLowerCase().includes(term));
  }, [industries, industrySearch]);

  const filteredProducts = useMemo(() => {
    let list = ALL_PRODUCTS;
    if (brandFilter) list = list.filter((p) => p.brandId === brandFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const brand = ALL_BRANDS.find((b) => b.id === p.brandId);
        return (
          p.name.toLowerCase().includes(q) ||
          (brand?.name.toLowerCase().includes(q) ?? false)
        );
      });
    }
    return list.slice(0, 60);
  }, [brandFilter, search]);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return TOP_CATEGORIES;
    return ALL_CATEGORIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.instruction.toLowerCase().includes(q),
    ).slice(0, 30);
  }, [search]);

  /** Products inside the currently selected category (for drill-down) */
  const categoryProducts = useMemo(() => {
    if (!wizard.state.categoryId) return [];
    return ALL_PRODUCTS.filter(
      (p) => p.categoryId === wizard.state.categoryId,
    ).slice(0, 20);
  }, [wizard.state.categoryId]);

  const filteredBrandList = useMemo(() => {
    const term = brandSearch.trim().toLowerCase();
    if (!term) return ALL_BRANDS.slice(0, 30);
    return ALL_BRANDS.filter((b) =>
      b.name.toLowerCase().includes(term),
    ).slice(0, 30);
  }, [brandSearch]);

  const selectedBrand = brandFilter
    ? ALL_BRANDS.find((b) => b.id === brandFilter)
    : null;

  // Switch tab — clear other tabs' selections to enforce XOR across
  // brand / product / category.
  const switchTab = (t: Tab) => {
    if (t === tab) return;
    setTab(t);
    setSearch("");
    if (t === "brand") {
      // Picking the brand tab clears product + category
      if (wizard.state.productId || wizard.state.categoryId) {
        wizard.patch({ productId: null, categoryId: null });
      }
    }
    if (t === "product") {
      if (wizard.state.brandId || wizard.state.categoryId) {
        wizard.patch({ brandId: null, categoryId: null });
      }
    }
    if (t === "category") {
      if (wizard.state.brandId || wizard.state.productId) {
        wizard.patch({ brandId: null, productId: null });
      }
    }
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col gap-4 px-6 pt-8 pb-6">
      <HeroHeader title="What are you creating for?" onBack={onBack} />

      {/* Tab toggle — Brand vs Product vs Category */}
      <div className="flex justify-center">
        <div
          role="tablist"
          className="inline-flex rounded-xl border border-border bg-muted/40 p-1 shadow-sm"
        >
          <TabBtn
            active={tab === "brand"}
            onClick={() => switchTab("brand")}
            icon={Building2}
            label="Brand"
            count={ALL_BRANDS.length}
          />
          <TabBtn
            active={tab === "product"}
            onClick={() => switchTab("product")}
            icon={Package}
            label="Product"
            count={ALL_PRODUCTS.length}
          />
          <TabBtn
            active={tab === "category"}
            onClick={() => switchTab("category")}
            icon={FolderOpen}
            label="Category"
            count={ALL_CATEGORIES.length}
          />
        </div>
      </div>

      {/* Toolbar — search + (Product-only) brand filter + fetch URL */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              tab === "brand"
                ? "Search brands or industries…"
                : tab === "product"
                  ? "Search products or brands…"
                  : "Search categories…"
            }
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>

        {(tab === "brand" || tab === "product") && (
          <Popover open={urlOpen} onOpenChange={setUrlOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="shrink-0 inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:border-foreground/30"
              >
                <Plus className="h-3.5 w-3.5" />
                Fetch URL
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-3 space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                {tab === "brand" ? "Paste a brand URL" : "Paste a product URL"}
              </p>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleFetchUrl();
                  }
                }}
                placeholder={
                  tab === "brand"
                    ? "https://brand.example.com"
                    : "https://store.example.com/product/…"
                }
                autoFocus
                disabled={fetching}
                className="block h-9 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary/40 focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUrlInput("");
                    setUrlOpen(false);
                  }}
                  disabled={fetching}
                  className="inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFetchUrl}
                  disabled={!urlInput.trim() || fetching}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors",
                    !urlInput.trim() || fetching
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary text-primary-foreground hover:opacity-90",
                  )}
                >
                  {fetching ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  {fetching ? "Fetching…" : "Fetch"}
                </button>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {tab === "brand" && (
          <Popover open={industryOpen} onOpenChange={setIndustryOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "shrink-0 inline-flex h-9 items-center gap-1.5 rounded-lg border bg-card px-3 text-xs transition-colors",
                  industryFilter
                    ? "border-primary/40 bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                <Factory className="h-3.5 w-3.5" />
                <span className="font-medium max-w-[120px] truncate">
                  {industryFilter ?? "All industries"}
                </span>
                <ChevronDown className="h-3 w-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-0">
              <div className="border-b border-border p-2">
                <div className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={industrySearch}
                    onChange={(e) => setIndustrySearch(e.target.value)}
                    placeholder="Search industry…"
                    className="w-full bg-transparent text-xs outline-none"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-[260px] overflow-y-auto py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIndustryFilter(null);
                    setIndustryOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors",
                    !industryFilter
                      ? "bg-primary/10 text-foreground"
                      : "text-foreground hover:bg-muted/40",
                  )}
                >
                  <span className="flex-1 truncate font-medium">All industries</span>
                  {!industryFilter && (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  )}
                </button>
                {filteredIndustryList.map((i) => {
                  const active = industryFilter === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setIndustryFilter(i);
                        setIndustryOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors",
                        active
                          ? "bg-primary/10 text-foreground"
                          : "text-foreground hover:bg-muted/40",
                      )}
                    >
                      <Factory className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="flex-1 truncate font-medium">{i}</span>
                      {active && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {tab === "product" && (
          <>
            <Popover open={brandOpen} onOpenChange={setBrandOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "shrink-0 inline-flex h-9 items-center gap-1.5 rounded-lg border bg-card px-3 text-xs transition-colors",
                    selectedBrand
                      ? "border-primary/40 bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                  )}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span className="font-medium max-w-[120px] truncate">
                    {selectedBrand?.name ?? "All brands"}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-0">
                <div className="border-b border-border p-2">
                  <div className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5">
                    <Search className="h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      placeholder="Search brand…"
                      className="w-full bg-transparent text-xs outline-none"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-[260px] overflow-y-auto py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setBrandFilter(null);
                      setBrandOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors",
                      !brandFilter
                        ? "bg-primary/10 text-foreground"
                        : "text-foreground hover:bg-muted/40",
                    )}
                  >
                    <span className="flex-1 truncate font-medium">All brands</span>
                    {!brandFilter && (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    )}
                  </button>
                  {filteredBrandList.map((b) => {
                    const active = brandFilter === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setBrandFilter(b.id);
                          setBrandOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors",
                          active
                            ? "bg-primary/10 text-foreground"
                            : "text-foreground hover:bg-muted/40",
                        )}
                      >
                        {b.logo ? (
                          <img
                            src={b.logo}
                            alt=""
                            className="h-4 w-4 rounded-sm shrink-0"
                          />
                        ) : (
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className="flex-1 truncate font-medium">
                          {b.name}
                        </span>
                        {active && <Check className="h-3.5 w-3.5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}

        <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {tab === "brand" ? (
            <>
              {filteredBrands.length}
              <span className="text-muted-foreground/60">
                {" / "}
                {ALL_BRANDS.length}
              </span>
            </>
          ) : tab === "product" ? (
            <>
              {filteredProducts.length}
              <span className="text-muted-foreground/60">
                {" / "}
                {ALL_PRODUCTS.length}
              </span>
            </>
          ) : (
            <>
              {filteredCategories.length}
              <span className="text-muted-foreground/60">
                {" / "}
                {ALL_CATEGORIES.length}
              </span>
            </>
          )}
        </span>
      </div>

      {/* Grid — brand / product / category */}
      {tab === "brand" ? (
        <BrandGrid
          brands={filteredBrands}
          selectedId={wizard.state.brandId}
          onPick={(id) => {
            wizard.patch({
              brandId: id,
              productId: null,
              categoryId: null,
            });
            onAdvance();
          }}
          search={search}
        />
      ) : tab === "product" ? (
        <ProductGrid
          products={filteredProducts}
          selectedId={wizard.state.productId}
          onPick={(id) => {
            wizard.patch({ productId: id, categoryId: null, brandId: null });
            onAdvance();
          }}
          search={search}
        />
      ) : (
        /* A-12.66 (Maalik): no page scroll. Category branch fills the
           remaining height of the step. Both categories and the optional
           refine-with-product section use INTERNAL overflow only.
           60% / 40% height split when refine toggle is ON. Continue
           button always visible at the bottom. */
        <CategoryBranch
          categories={filteredCategories}
          selectedCategoryId={wizard.state.categoryId}
          onPickCategory={(id) =>
            wizard.patch({ categoryId: id, productId: null, brandId: null })
          }
          search={search}
          products={categoryProducts}
          selectedProductId={wizard.state.productId}
          onPickProduct={(id) => {
            wizard.patch({
              productId: wizard.state.productId === id ? null : id,
              categoryId: wizard.state.categoryId,
              brandId: null,
            });
            if (wizard.state.productId !== id) onAdvance();
          }}
          onContinue={onAdvance}
          refineOpen={searchParams.get("refine") === "open"}
          onRefineToggle={(next) =>
            setSearchParams(
              (prev) => {
                const sp = new URLSearchParams(prev);
                if (next) sp.set("refine", "open");
                else sp.delete("refine");
                return sp;
              },
              { replace: true },
            )
          }
        />
      )}

      {showFetchModal && fetchedProduct && (
        <UrlFetchModal
          product={fetchedProduct}
          brand={ALL_BRANDS.find((b) => b.id === fetchedProduct.brandId)}
          onSave={(productId) => {
            wizard.patch({ productId, categoryId: null, brandId: null });
            setShowFetchModal(false);
            setFetchedProduct(null);
            onAdvance();
          }}
          onCancel={() => {
            setShowFetchModal(false);
            setFetchedProduct(null);
          }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── *
 *  Tab button
 * ─────────────────────────────────────────────────────────── */
function TabBtn({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
        active
          ? "bg-foreground text-background shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 font-mono text-[10px]",
          active
            ? "bg-background/20 text-background"
            : "bg-muted text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────── *
 *  Product grid — image + brand chip + check on select
 * ─────────────────────────────────────────────────────────── */
interface ProductGridProps {
  products: typeof ALL_PRODUCTS;
  selectedId: string | null;
  onPick: (id: string) => void;
  search: string;
}

function ProductGrid({ products, selectedId, onPick, search }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-3 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Search className="h-5 w-5 text-muted-foreground/70" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            No products found
          </p>
          <p className="text-[11px] text-muted-foreground">
            {search
              ? `Nothing matches "${search}". Try a different search or pick another brand.`
              : "Adjust the brand filter or use Fetch URL to add a new product."}
          </p>
        </div>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-3 pr-1 sm:grid-cols-3">
      {products.map((p) => {
        const isSelected = selectedId === p.id;
        const brand = ALL_BRANDS.find((b) => b.id === p.brandId);
        return (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onPick(p.id)}
              className={cn(
                "group relative flex h-full w-full flex-col overflow-hidden rounded-xl border bg-background text-left transition-all",
                isSelected
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
              )}
            >
              {/* Image — real Unsplash fallback by category keyword */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                <img
                  src={resolveProductThumb(p)}
                  alt={p.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform group-hover:scale-[1.04]"
                />
                {/* Brand chip top-left */}
                {brand && (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-card/90 px-1.5 py-0.5 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur-sm">
                    {brand.logo && (
                      <img
                        src={brand.logo}
                        alt=""
                        className="h-2.5 w-2.5 rounded-sm"
                      />
                    )}
                    <span className="max-w-[80px] truncate">{brand.name}</span>
                  </span>
                )}
                {/* Check badge top-right when selected */}
                {isSelected && (
                  <span className="absolute top-2 right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </div>
              {/* Meta */}
              <div className="flex flex-1 flex-col gap-0.5 px-2.5 py-2">
                <p className="truncate text-xs font-semibold text-foreground">
                  {p.name}
                </p>
                <ProductDetailLine
                  benefits={p.benefits}
                  promo={p.promo}
                  generatedCount={p.generatedCount}
                />
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ─────────────────────────────────────────────────────────── *
 *  Brand grid — square logo + industry chip + tone snippet
 * ─────────────────────────────────────────────────────────── */
interface BrandGridProps {
  brands: typeof ALL_BRANDS;
  selectedId: string | null;
  onPick: (id: string) => void;
  search: string;
}

function BrandGrid({ brands, selectedId, onPick, search }: BrandGridProps) {
  if (brands.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-3 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Search className="h-5 w-5 text-muted-foreground/70" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            No brands found
          </p>
          <p className="text-[11px] text-muted-foreground">
            {search
              ? `Nothing matches "${search}". Try a different search or industry filter.`
              : "Adjust the industry filter or use Fetch URL to add a new brand."}
          </p>
        </div>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-3 pr-1 sm:grid-cols-3">
      {brands.map((b) => {
        const isSelected = selectedId === b.id;
        const detail =
          b.tone && b.tone.trim().length > 0
            ? b.tone
            : `${b.productIds.length} products`;
        return (
          <li key={b.id}>
            <button
              type="button"
              onClick={() => onPick(b.id)}
              className={cn(
                "group relative flex h-full w-full flex-col overflow-hidden rounded-xl border bg-background text-left transition-all",
                isSelected
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
              )}
            >
              {/* Logo / image area — square aspect */}
              <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-muted">
                {b.logo ? (
                  <img
                    src={b.logo}
                    alt={b.name}
                    loading="lazy"
                    className="h-16 w-16 rounded-lg object-contain"
                  />
                ) : (
                  <Building2 className="h-12 w-12 text-muted-foreground/40" />
                )}
                {/* Industry chip top-left */}
                <span className="absolute left-2 top-2 inline-flex items-center rounded-full bg-card/90 px-1.5 py-0.5 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur-sm">
                  {b.category}
                </span>
                {/* Check on selected */}
                {isSelected && (
                  <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </div>
              {/* Meta */}
              <div className="flex flex-col gap-0.5 px-2.5 py-2">
                <p className="truncate text-xs font-semibold text-foreground">
                  {b.name}
                </p>
                <p className="line-clamp-2 text-[10px] leading-tight text-muted-foreground">
                  {detail}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ─────────────────────────────────────────────────────────── *
 *  Shared product card detail line — primary benefit (or promo
 *  fallback) plus a small mono pill showing run count. Used in
 *  both ProductGrid and CategoryProductsSection.
 * ─────────────────────────────────────────────────────────── */
function ProductDetailLine({
  benefits,
  promo,
  generatedCount,
}: {
  benefits?: string[];
  promo?: string;
  generatedCount?: number;
}) {
  const primary = (benefits && benefits[0]) || promo || null;
  const truncated =
    primary && primary.length > 50 ? `${primary.slice(0, 49).trimEnd()}…` : primary;
  const showCount = typeof generatedCount === "number" && generatedCount > 0;
  if (!truncated && !showCount) return null;
  return (
    <>
      {truncated && (
        <p className="line-clamp-2 text-[10px] text-muted-foreground leading-tight">
          {truncated}
        </p>
      )}
      {showCount && (
        <span className="mt-0.5 inline-flex w-fit items-center font-mono text-[10px] text-muted-foreground/80">
          · {generatedCount} runs
        </span>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────── *
 *  Category grid — large emoji, name, description
 * ─────────────────────────────────────────────────────────── */
type CategoryItem = { id: string; name: string; instruction: string };

interface CategoryGridProps {
  categories: CategoryItem[];
  selectedId: string | null;
  onPick: (id: string) => void;
  search: string;
  /** When true, render in narrower split-layout column (1 col → 2 col) */
  compact?: boolean;
}

function CategoryGrid({
  categories,
  selectedId,
  onPick,
  search,
  compact = false,
}: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-3 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <FolderOpen className="h-5 w-5 text-muted-foreground/70" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            No categories found
          </p>
          <p className="text-[11px] text-muted-foreground">
            {search
              ? `Nothing matches "${search}". Try another keyword.`
              : "No categories available."}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "grid gap-2",
        compact
          ? "grid-cols-1 sm:grid-cols-2"
          : "grid-cols-2 sm:grid-cols-3",
      )}
    >
      {categories.map((c) => {
        const isSelected = selectedId === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onPick(c.id)}
            className={cn(
              "v3-glass-card flex min-h-[72px] items-center gap-2 rounded-xl p-3 text-left transition-all",
              isSelected
                ? "ring-2 ring-primary/30"
                : "hover:border-foreground/20",
            )}
          >
            <span className="shrink-0 text-xl" aria-hidden>
              {CATEGORY_EMOJI[c.id] ?? "📦"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold text-foreground">
                {c.name}
              </p>
              <p className="line-clamp-1 text-[10px] text-muted-foreground">
                {c.instruction}
              </p>
            </div>
            {isSelected && (
              <Check
                className="h-3 w-3 shrink-0 text-primary"
                strokeWidth={3}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── *
 *  CategoryProductsSection — shows products linked to the
 *  selected category. Appears below the category grid when a
 *  category is active. User can optionally pick a specific
 *  product (sets both categoryId + productId) or skip.
 * ─────────────────────────────────────────────────────────── */
interface CategoryProductsSectionProps {
  categoryName: string;
  products: typeof ALL_PRODUCTS;
  selectedProductId: string | null;
  onPick: (id: string) => void;
  onSkip: () => void;
}

function CategoryProductsSection({
  categoryName,
  products,
  selectedProductId,
  onPick,
  onSkip,
}: CategoryProductsSectionProps) {
  return (
    <div className="space-y-3">
      {/* A-12.65 (Maalik): Continue priority flipped.
          Was: tiny "Skip" text link tucked into the header trailing slot
               (de-prioritized) — picking a product looked mandatory.
          Now: section is framed as OPTIONAL refinement; the primary
               action is the Continue CTA at the bottom of the grid. */}
      <SectionHeader
        title={`Products in ${categoryName}`}
        icon={Package}
        hint="optional — pick one to refine, or just continue"
      />

      {products.length === 0 ? (
        <p className="py-4 text-center text-[12px] text-muted-foreground">
          No products in this category
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 pr-1 sm:grid-cols-2">
          {products.map((p) => {
            const isSelected = selectedProductId === p.id;
            const brand = ALL_BRANDS.find((b) => b.id === p.brandId);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onPick(p.id)}
                  className={cn(
                    "group relative flex h-full w-full flex-col overflow-hidden rounded-xl border bg-background text-left transition-all",
                    isSelected
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
                  )}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                    <img
                      src={resolveProductThumb(p)}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform group-hover:scale-[1.04]"
                    />
                    {brand?.logo && (
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="absolute bottom-1.5 left-1.5 h-5 w-5 rounded bg-white/90 object-contain p-0.5 shadow-sm"
                      />
                    )}
                    {isSelected && (
                      <span className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div className="px-2 pb-2 pt-1.5">
                    <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-foreground">
                      {p.name}
                    </p>
                    <ProductDetailLine
                      benefits={p.benefits}
                      promo={p.promo}
                      generatedCount={p.generatedCount}
                    />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* A-12.65 (Maalik): primary Continue CTA. Click → advances to
          Step 3 without selecting a specific product (categoryId only). */}
      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={onSkip}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-[13px] font-bold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Continue with {categoryName}
          <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── *
 *  CategoryBranch — A-12.66 (Maalik): height-constrained layout
 *  for the Category tab. No page scroll, internal containers only.
 *
 *  Layout (vertical stack inside the step's available height):
 *    ┌──────────────────────────────────────────────────┐
 *    │ Categories grid                       60% height │
 *    │   internal overflow-y-auto                       │
 *    ├──────────────────────────────────────────────────┤
 *    │ Toggle: "Add a product to refine?"     auto      │
 *    ├──────────────────────────────────────────────────┤
 *    │ Products grid (only when toggle ON)   40% height │
 *    │   internal overflow-y-auto                       │
 *    ├──────────────────────────────────────────────────┤
 *    │ Continue button                        auto      │
 *    └──────────────────────────────────────────────────┘
 *
 *  Continue button is always visible regardless of toggle state.
 *  Heights are constrained so the whole layout fits in viewport.
 *  Refine toggle URL-backed via ?refine=open.
 * ─────────────────────────────────────────────────────────── */

interface CategoryBranchProps {
  categories: CategoryItem[];
  selectedCategoryId: string | null;
  onPickCategory: (id: string) => void;
  search: string;
  products: typeof ALL_PRODUCTS;
  selectedProductId: string | null;
  onPickProduct: (id: string) => void;
  onContinue: () => void;
  refineOpen: boolean;
  onRefineToggle: (next: boolean) => void;
}

function CategoryBranch({
  categories,
  selectedCategoryId,
  onPickCategory,
  search,
  products,
  selectedProductId,
  onPickProduct,
  onContinue,
  refineOpen,
  onRefineToggle,
}: CategoryBranchProps) {
  const selectedCategoryName =
    categories.find((c) => c.id === selectedCategoryId)?.name ?? null;
  const continueDisabled = !selectedCategoryId;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Categories — flex-[6] when refine ON, flex-1 when OFF */}
      <div
        className={cn(
          "flex min-h-0 flex-col rounded-2xl border border-border/40 bg-card/40 p-3",
          refineOpen ? "flex-[6]" : "flex-1",
        )}
      >
        <p className="mb-2 shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Pick a category
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/10 [&::-webkit-scrollbar]:w-1.5">
          <CategoryGrid
            categories={categories}
            selectedId={selectedCategoryId}
            onPick={onPickCategory}
            search={search}
          />
        </div>
      </div>

      {/* Refine toggle row — only meaningful once a category is picked */}
      <div
        className={cn(
          "flex shrink-0 items-center gap-2 rounded-xl border border-border/40 bg-card/40 px-3 py-2 transition-opacity",
          !selectedCategoryId && "opacity-50 pointer-events-none",
        )}
      >
        <span className="text-[12px] font-medium text-foreground">
          Add a product to refine?
        </span>
        <span className="text-[10px] text-muted-foreground">
          (optional)
        </span>
        <button
          type="button"
          onClick={() => onRefineToggle(!refineOpen)}
          aria-pressed={refineOpen}
          disabled={!selectedCategoryId}
          className={cn(
            "ml-auto relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
            refineOpen ? "bg-primary" : "bg-muted",
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-background shadow-sm transition-transform",
              refineOpen ? "translate-x-4" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      {/* Products — only renders when refine ON. flex-[4] keeps the 60:40 ratio */}
      {refineOpen && (
        <div className="flex min-h-0 flex-[4] flex-col rounded-2xl border border-border/40 bg-card/40 p-3">
          <p className="mb-2 shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Products in {selectedCategoryName ?? "category"}
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/10 [&::-webkit-scrollbar]:w-1.5">
            {products.length === 0 ? (
              <p className="py-4 text-center text-[12px] italic text-muted-foreground">
                No products in this category — just continue.
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {products.map((p) => {
                  const isSelected = selectedProductId === p.id;
                  const brand = ALL_BRANDS.find((b) => b.id === p.brandId);
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => onPickProduct(p.id)}
                        className={cn(
                          "group relative flex h-full w-full flex-col overflow-hidden rounded-xl border bg-background text-left transition-all",
                          isSelected
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
                        )}
                      >
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                          <img
                            src={resolveProductThumb(p)}
                            alt={p.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform group-hover:scale-[1.04]"
                          />
                          {brand?.logo && (
                            <img
                              src={brand.logo}
                              alt={brand.name}
                              className="absolute bottom-1 left-1 h-4 w-4 rounded bg-white/90 object-contain p-0.5 shadow-sm"
                            />
                          )}
                          {isSelected && (
                            <span className="absolute right-1 top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                              <Check className="h-2.5 w-2.5" strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <div className="px-2 pb-1.5 pt-1">
                          <p className="line-clamp-1 text-[11px] font-semibold leading-tight text-foreground">
                            {p.name}
                          </p>
                          <p className="line-clamp-1 font-mono text-[9px] text-muted-foreground">
                            {p.price}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Continue button — always visible, sticks to bottom */}
      <div className="shrink-0 flex justify-center pt-1">
        <button
          type="button"
          onClick={onContinue}
          disabled={continueDisabled}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[13px] font-bold shadow-sm transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            continueDisabled
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : "bg-primary text-primary-foreground hover:scale-[1.02]",
          )}
        >
          {selectedCategoryName
            ? `Continue with ${selectedCategoryName}`
            : "Pick a category to continue"}
          {!continueDisabled && <span aria-hidden>→</span>}
        </button>
      </div>
    </div>
  );
}
