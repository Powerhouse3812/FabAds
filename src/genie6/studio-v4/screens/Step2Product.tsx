import { useEffect, useMemo, useRef, useState } from "react";
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
  Upload,
  Image as ImageIcon,
  ImageOff,
  X,
  CheckSquare,
  Square,
  Info,
  Users,
  Trash2,
  // A-12.70: category icons replace emoji
  Scissors, Droplet, Palette, Sparkles, FlaskConical, CircleDot, Sun,
  Bath, Footprints, Heart, Baby, Smile, User, Flower2, Eye,
  Watch, Headphones, Volume2, Activity, Gamepad2, Bed, Leaf, Pill,
  Shirt, Moon, Glasses, Gem, Sofa, ChefHat, Utensils, PawPrint, Bone,
  Briefcase, PersonStanding,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { brands as ALL_BRANDS, products as ALL_PRODUCTS, categories as ALL_CATEGORIES } from "@/mocks/shared";
import { registerUploadedImage, resolveUploadedImage } from "@/genie6/lib/uploaded-image-store";
import { HeroHeader } from "../components/HeroHeader";
import { SectionHeader } from "../components/SectionHeader";
import { UrlFetchModal } from "../components/UrlFetchModal";
import type { UseWizardReturn } from "../state/useWizard";
// Genie 2.0 §6 Rule 4 — Step 2 IS the ad-type screen for every module that
// redirects into Genie. `resolveFlowContext` turns the ?src/?ref/?act URL
// params (owned by the Flows Data agent, src/genie6/flows/data/) into the
// module/action/source-ref/highlight this screen reacts to. Contract:
// src/genie6/flows/data/resolveFlowContext.ts.
import { resolveFlowContext } from "@/genie6/flows/data/resolveFlowContext";
import type { FlowContext } from "@/genie6/flows/flowTypes";

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

/** A-12.70 (Maalik): emojis swapped for lucide icons + tonal color
 *  per category. Same color SCHEME used as Step 3 Approach (indigo /
 *  emerald / fuchsia / amber / rose / cyan / lime). Categories grouped
 *  by domain — Hair / Skin / Body / Mens → rose · Fragrance / Makeup /
 *  Apparel → fuchsia · Tech / Travel → indigo · Sleep / Wellness / Pet
 *  / Baby → emerald · Footwear / Kitchen / Furniture / Sunscreen / Gold
 *  jewellery → amber · Eyewear / Diamond → cyan. */
const CATEGORY_SCHEME = {
  indigo: {
    bgRest: "bg-indigo-50", bgHover: "group-hover:bg-indigo-100",
    bgSelected: "bg-indigo-100",
    textRest: "text-indigo-600", textSelected: "text-indigo-700",
  },
  emerald: {
    bgRest: "bg-emerald-50", bgHover: "group-hover:bg-emerald-100",
    bgSelected: "bg-emerald-100",
    textRest: "text-emerald-600", textSelected: "text-emerald-700",
  },
  fuchsia: {
    bgRest: "bg-fuchsia-50", bgHover: "group-hover:bg-fuchsia-100",
    bgSelected: "bg-fuchsia-100",
    textRest: "text-fuchsia-600", textSelected: "text-fuchsia-700",
  },
  amber: {
    bgRest: "bg-warning-text/10", bgHover: "group-hover:bg-warning-text/10",
    bgSelected: "bg-warning-text/10",
    textRest: "text-warning-text", textSelected: "text-warning-text",
  },
  rose: {
    bgRest: "bg-rose-50", bgHover: "group-hover:bg-rose-100",
    bgSelected: "bg-rose-100",
    textRest: "text-rose-600", textSelected: "text-rose-700",
  },
  cyan: {
    bgRest: "bg-cyan-50", bgHover: "group-hover:bg-cyan-100",
    bgSelected: "bg-cyan-100",
    textRest: "text-cyan-600", textSelected: "text-cyan-700",
  },
  lime: {
    bgRest: "bg-primary/[0.10]", bgHover: "group-hover:bg-primary/[0.18]",
    bgSelected: "bg-primary/[0.20]",
    textRest: "text-primary", textSelected: "text-primary",
  },
} as const;
type CategoryTone = keyof typeof CATEGORY_SCHEME;

const CATEGORY_ICON: Record<
  string,
  { Icon: React.ElementType; tone: CategoryTone }
> = {
  // Hair
  "hair-care":          { Icon: Scissors,        tone: "rose" },
  "hair-oil":           { Icon: Droplet,         tone: "rose" },
  "hair-color":         { Icon: Palette,         tone: "rose" },
  "anti-dandruff":      { Icon: Sparkles,        tone: "rose" },
  // Skin
  "skin-care":          { Icon: Droplet,         tone: "rose" },
  "anti-aging":         { Icon: Sparkles,        tone: "rose" },
  "acne":               { Icon: FlaskConical,    tone: "rose" },
  "pigmentation":       { Icon: CircleDot,       tone: "rose" },
  "sunscreen":          { Icon: Sun,             tone: "amber" },
  // Body
  "body-care":          { Icon: Bath,            tone: "rose" },
  "foot-care":          { Icon: Footprints,      tone: "rose" },
  "lip-care":           { Icon: Heart,           tone: "rose" },
  // Baby / Hygiene / Oral
  "baby-care":          { Icon: Baby,            tone: "emerald" },
  "personal-hygiene":   { Icon: Bath,            tone: "emerald" },
  "oral-care":          { Icon: Smile,           tone: "emerald" },
  // Mens
  "mens-grooming":      { Icon: User,            tone: "rose" },
  "beard-care":         { Icon: User,            tone: "rose" },
  // Fragrance / Makeup
  "fragrance":          { Icon: Flower2,         tone: "fuchsia" },
  "makeup":             { Icon: Sparkles,        tone: "fuchsia" },
  "makeup-lip":         { Icon: Heart,           tone: "fuchsia" },
  "makeup-eye":         { Icon: Eye,             tone: "fuchsia" },
  "makeup-face":        { Icon: Sparkles,        tone: "fuchsia" },
  // Tech
  "smartwatches":       { Icon: Watch,           tone: "indigo" },
  "wireless-earbuds":   { Icon: Headphones,      tone: "indigo" },
  "bluetooth-speakers": { Icon: Volume2,         tone: "indigo" },
  "fitness-trackers":   { Icon: Activity,        tone: "indigo" },
  "gaming-headsets":    { Icon: Gamepad2,        tone: "indigo" },
  "smart-rings":        { Icon: CircleDot,       tone: "indigo" },
  // Sleep
  "mattresses":         { Icon: Bed,             tone: "emerald" },
  "pillows":            { Icon: Bed,             tone: "emerald" },
  "bedding":            { Icon: Bed,             tone: "emerald" },
  "sleepwear":          { Icon: Moon,            tone: "emerald" },
  // Wellness
  "wellness":           { Icon: Leaf,            tone: "emerald" },
  "vitamins":           { Icon: Pill,            tone: "emerald" },
  "probiotics":         { Icon: FlaskConical,    tone: "emerald" },
  "yoga":               { Icon: PersonStanding,  tone: "emerald" },
  // Apparel
  "apparel-casual":     { Icon: Shirt,           tone: "fuchsia" },
  "apparel-formal":     { Icon: Shirt,           tone: "fuchsia" },
  "apparel-ethnic":     { Icon: Shirt,           tone: "fuchsia" },
  "streetwear":         { Icon: Shirt,           tone: "fuchsia" },
  "activewear":         { Icon: Activity,        tone: "fuchsia" },
  "innerwear":          { Icon: Shirt,           tone: "fuchsia" },
  // Footwear
  "sneakers":           { Icon: Footprints,      tone: "amber" },
  "footwear-formal":    { Icon: Footprints,      tone: "amber" },
  "sandals":            { Icon: Footprints,      tone: "amber" },
  // Eyewear
  "eyewear-sunglasses": { Icon: Glasses,         tone: "cyan" },
  "eyewear-optical":    { Icon: Glasses,         tone: "cyan" },
  // Jewellery / Diamond
  "jewellery-gold":     { Icon: Gem,             tone: "amber" },
  "jewellery-silver":   { Icon: Gem,             tone: "cyan" },
  "diamond":            { Icon: Gem,             tone: "cyan" },
  "lab-diamond":        { Icon: Gem,             tone: "cyan" },
  // Furniture
  "furniture-sofa":     { Icon: Sofa,            tone: "amber" },
  "furniture-bed":      { Icon: Bed,             tone: "amber" },
  // Kitchen
  "kitchen-appliances": { Icon: ChefHat,         tone: "amber" },
  "cookware":           { Icon: Utensils,        tone: "amber" },
  // Pet
  "pet-care":           { Icon: PawPrint,        tone: "emerald" },
  "pet-food":           { Icon: Bone,            tone: "emerald" },
  // Travel
  "travel-bags":        { Icon: Briefcase,       tone: "indigo" },
};

const DEFAULT_CATEGORY_META: { Icon: React.ElementType; tone: CategoryTone } = {
  Icon: Package, tone: "lime",
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

  // ── §6 Rule 4 — flow context resolution ─────────────────────────────
  // When a module redirects into Genie, ?src/?ref/?act resolve to a
  // FlowContext. It decides which tab opens (`action.entityTab`) and what
  // to show as the suggested/pre-selected entity (`highlight` / `preselect`)
  // — see the render blocks below and `acceptHighlight`. `null` means Studio
  // is running standalone (no redirect), which must behave exactly as it
  // does today.
  const flowCtx: FlowContext | null = useMemo(
    () => resolveFlowContext(searchParams),
    [searchParams],
  );

  const urlTab = searchParams.get("step-tab");
  const tab: Tab =
    urlTab === "product" || urlTab === "category" || urlTab === "brand"
      ? urlTab
      : flowCtx
        ? // Open the tab the highlight lives on. For a competitor-owned or
          // undetected source the highlight is forced to the user's own BRAND
          // while the action's default tab is often "product" — opening the
          // product tab made §7.2's one visible safeguard (own brand
          // highlighted at the top of the picker) render nowhere.
          (flowCtx.highlight?.kind ?? flowCtx.action.entityTab)
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

  // ── §7.5 — Campaign URLs' documented exception to Rule 4 ────────────
  // A matched catalogue product is PRE-SELECTED and editable (because the
  // landing page is the user's own — unlike every other source). This
  // effect seeds that initial value once per source ref; after that the
  // user is free to click a different brand/product/category below and
  // this never re-applies over their own choice.
  const preselectedForRef = useRef<string | null>(null);
  useEffect(() => {
    if (!flowCtx?.preselect || !flowCtx.highlight) return;
    if (preselectedForRef.current === flowCtx.ref.id) return;
    preselectedForRef.current = flowCtx.ref.id;
    const { kind, id } = flowCtx.highlight;
    if (kind === "product") wizard.patch({ productId: id, brandId: null, categoryId: null });
    else if (kind === "brand") wizard.patch({ brandId: id, productId: null, categoryId: null });
    else wizard.patch({ categoryId: id, productId: null, brandId: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowCtx?.ref.id, flowCtx?.preselect, flowCtx?.highlight?.id, flowCtx?.highlight?.kind]);

  // ── §6 Rule 4 base case — highlighted, NOT selected ─────────────────
  // One click on the suggested band commits it. Nothing is written to
  // wizard state before that click (Rule 3: Generate stays disabled until
  // the user actually chooses).
  const acceptHighlight = () => {
    if (!flowCtx?.highlight) return;
    const { kind, id } = flowCtx.highlight;
    if (kind === "brand") wizard.patch({ brandId: id, productId: null, categoryId: null });
    else if (kind === "product") wizard.patch({ productId: id, brandId: null, categoryId: null });
    else wizard.patch({ categoryId: id, productId: null, brandId: null });
    onAdvance();
  };

  /** Renders the flow band for a given tab — the amber "Suggested" band
   *  for the highlight-only case, or the neutral "pre-filled" note for the
   *  §7.5 exception. `null` on every other tab and when there's no flow
   *  context at all. */
  const flowBandForTab = (t: Tab) => {
    if (!flowCtx?.highlight || flowCtx.highlight.kind !== t) return null;
    return flowCtx.preselect ? (
      <FlowPreselectNote ctx={flowCtx} />
    ) : (
      <FlowHighlightBand ctx={flowCtx} onAccept={acceptHighlight} />
    );
  };

  // ── §9 — bulk product selection (Category Ad + Product Ad) ─────────
  // `productId` stays the hero; `bulkProductIds` are the co-stars. Toggling
  // in EITHER the Product tab or the Category tab's refine section writes
  // the same two wizard fields, so the outcome — one ad containing all of
  // them — is identical regardless of which tab built it.
  const [bulkMode, setBulkMode] = useState(() => wizard.state.bulkProductIds.length > 0);
  const bulkSelectedIds = useMemo(
    () =>
      new Set(
        [wizard.state.productId, ...wizard.state.bulkProductIds].filter(
          (x): x is string => !!x,
        ),
      ),
    [wizard.state.productId, wizard.state.bulkProductIds],
  );
  const toggleBulkProduct = (id: string) => {
    const hero = wizard.state.productId;
    const bulk = wizard.state.bulkProductIds;
    if (hero === id) {
      const [nextHero, ...rest] = bulk;
      wizard.patch({ productId: nextHero ?? null, bulkProductIds: rest });
      return;
    }
    if (bulk.includes(id)) {
      wizard.patch({ bulkProductIds: bulk.filter((x) => x !== id) });
      return;
    }
    if (!hero) {
      wizard.patch({ productId: id });
      return;
    }
    wizard.patch({ bulkProductIds: [...bulk, id] });
  };

  // ── §21.2 — Product Shoot's third route: Brand → skip product →
  // upload image. Lets a brand whose product isn't in the Catalogue yet
  // (or a one-off) satisfy Step 2 without a catalogue product id.
  const [uploadOpen, setUploadOpen] = makePopoverUrlState("upload-image");
  const [uploadBrandId, setUploadBrandId] = useState<string | null>(
    () => wizard.state.brandId,
  );
  const [uploadBrandSearch, setUploadBrandSearch] = useState("");
  // DEFECT FIX: wizard.state.uploadedProductImage is a TOKEN now (see
  // uploaded-image-store.ts), not the data: URL itself — resolve it back to
  // the actual image for this popover's local preview. A token that no
  // longer resolves (reload) seeds `null`, same as "nothing uploaded yet".
  const [uploadPreview, setUploadPreview] = useState<string | null>(
    () => resolveUploadedImage(wizard.state.uploadedProductImage) ?? null,
  );
  const [uploadProcessing, setUploadProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resolved once per render for the "already uploaded" summary row below —
  // undefined when the token is set but the in-memory store lost it (reload).
  const uploadedImageDataUrl = resolveUploadedImage(wizard.state.uploadedProductImage);
  const uploadNeedsReupload = !!wizard.state.uploadedProductImage && !uploadedImageDataUrl;

  const uploadBrandOptions = useMemo(() => {
    const term = uploadBrandSearch.trim().toLowerCase();
    const list = term
      ? ALL_BRANDS.filter((b) => b.name.toLowerCase().includes(term))
      : ALL_BRANDS;
    return list.slice(0, 30);
  }, [uploadBrandSearch]);

  const handleUploadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadProcessing(true);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadProcessing(false);
      setUploadPreview(typeof reader.result === "string" ? reader.result : null);
    };
    reader.onerror = () => setUploadProcessing(false);
    reader.readAsDataURL(file);
  };

  const handleSaveUpload = () => {
    if (!uploadBrandId || !uploadPreview) return;
    // DEFECT FIX: never put the raw data: URL in wizard state — useUrlSync.ts
    // mirrors this field straight into `?productImage=`, and a base64 image
    // in a query string blows past URL length limits. Register it and keep
    // only the short token.
    wizard.patch({
      brandId: uploadBrandId,
      productId: null,
      categoryId: null,
      bulkProductIds: [],
      uploadedProductImage: registerUploadedImage(uploadPreview),
    });
    setUploadOpen(false);
    toast.success("Brand + image ready — no catalogue product needed");
    onAdvance();
  };

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

  /**
   * Brand id currently shown in the suggested band, so the grid can exclude
   * it. Without this, the suggested brand rendered TWICE — once in the band
   * with "Use this", and again as the first card 40px below. Two affordances
   * for one identical outcome makes a user scanning the screen doubt whether
   * they mean different things, and it quietly undercuts the point of Rule
   * 4's band (it is the suggestion; the grid is the alternatives).
   *
   * Only excluded while the band is actually on screen and unaccepted — once
   * accepted, the brand belongs in the grid as the normal selected card.
   */
  const bandBrandId =
    flowCtx && !flowCtx.preselect && flowCtx.highlight?.kind === "brand" && !wizard.state.brandId
      ? flowCtx.highlight.id
      : null;

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
    // Searching is the user going looking for something specific — if they
    // type the suggested brand's name they should find it, band or no band.
    if (bandBrandId && !q) list = list.filter((b) => b.id !== bandBrandId);
    return list.slice(0, 60);
  }, [industryFilter, search, bandBrandId]);

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
    // §9 — a bulk co-star set belongs to whichever tab built it; leaving
    // that tab clears it too, same as the XOR clearing below, so a stale
    // set can't silently re-attach if the user comes back later.
    if (t === "brand") {
      // Picking the brand tab clears product + category
      if (wizard.state.productId || wizard.state.categoryId || wizard.state.bulkProductIds.length) {
        wizard.patch({ productId: null, categoryId: null, bulkProductIds: [] });
      }
    }
    if (t === "product") {
      if (wizard.state.brandId || wizard.state.categoryId || wizard.state.bulkProductIds.length) {
        wizard.patch({ brandId: null, categoryId: null, bulkProductIds: [] });
      }
    }
    if (t === "category") {
      if (wizard.state.brandId || wizard.state.productId || wizard.state.bulkProductIds.length) {
        wizard.patch({ brandId: null, productId: null, bulkProductIds: [] });
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
          className="inline-flex max-w-full snap-x overflow-x-auto rounded-xl border border-border bg-muted/40 p-1 shadow-sm [scrollbar-width:none] md:snap-none md:overflow-x-visible [&::-webkit-scrollbar]:hidden"
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

            {/* §9 — bulk product selection toggle. Off = the fast single-pick
                path (click a card → advance), unchanged from before. On =
                clicking accumulates a set instead of advancing; the outcome
                bar below states in words what will be produced. */}
            <button
              type="button"
              onClick={() => setBulkMode((v) => !v)}
              aria-pressed={bulkMode}
              className={cn(
                "shrink-0 inline-flex h-9 items-center gap-1.5 rounded-lg border bg-card px-3 text-xs font-medium transition-colors",
                bulkMode
                  ? "border-primary/40 bg-primary/5 text-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
              )}
            >
              {bulkMode ? (
                <CheckSquare className="h-3.5 w-3.5" />
              ) : (
                <Square className="h-3.5 w-3.5" />
              )}
              Select multiple
            </button>

            {/* §21.2 — Product Shoot's third route: Brand → skip product →
                upload image. For a brand whose product isn't in the
                Catalogue yet, or a one-off. */}
            <Popover open={uploadOpen} onOpenChange={setUploadOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "shrink-0 inline-flex h-9 items-center gap-1.5 rounded-lg border bg-card px-3 text-xs font-medium transition-colors",
                    wizard.state.uploadedProductImage
                      ? "border-primary/40 bg-primary/5 text-foreground"
                      : "border-border text-foreground hover:border-foreground/30",
                  )}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload image
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 space-y-3 p-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    No catalogue product? Use a brand + one image
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground/80">
                    For a brand-new SKU or a one-off — this satisfies Step 2
                    on its own, no product id needed.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    Brand
                  </label>
                  <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5">
                    <Search className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <input
                      type="text"
                      value={uploadBrandSearch}
                      onChange={(e) => setUploadBrandSearch(e.target.value)}
                      placeholder="Search brand…"
                      className="w-full bg-transparent text-xs outline-none"
                    />
                  </div>
                  <div className="max-h-28 overflow-y-auto rounded-md border border-border/50">
                    {uploadBrandOptions.length === 0 ? (
                      <p className="px-2 py-2 text-[11px] text-muted-foreground">
                        No match.
                      </p>
                    ) : (
                      uploadBrandOptions.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setUploadBrandId(b.id)}
                          className={cn(
                            "flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs transition-colors",
                            uploadBrandId === b.id
                              ? "bg-primary/10 text-foreground"
                              : "text-foreground hover:bg-muted/40",
                          )}
                        >
                          {b.logo ? (
                            <img src={b.logo} alt="" className="h-3.5 w-3.5 rounded-sm shrink-0" />
                          ) : (
                            <Building2 className="h-3 w-3 shrink-0 text-muted-foreground" />
                          )}
                          <span className="flex-1 truncate">{b.name}</span>
                          {uploadBrandId === b.id && (
                            <Check className="h-3 w-3 shrink-0 text-primary" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    Product image
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadFileChange}
                    className="hidden"
                    aria-label="Choose a product image to upload"
                  />
                  {uploadPreview ? (
                    <div className="relative overflow-hidden rounded-md border border-border">
                      <img
                        src={uploadPreview}
                        alt="Uploaded product"
                        className="h-28 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setUploadPreview(null)}
                        aria-label="Remove image"
                        className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadProcessing}
                      className="flex h-20 w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                      {uploadProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImageIcon className="h-4 w-4" />
                      )}
                      <span className="text-[11px]">
                        {uploadProcessing ? "Reading…" : "Choose an image"}
                      </span>
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setUploadOpen(false)}
                    className="inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveUpload}
                    disabled={!uploadBrandId || !uploadPreview}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors",
                      !uploadBrandId || !uploadPreview
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary text-primary-foreground hover:opacity-90",
                    )}
                  >
                    Use this brand + image
                  </button>
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

      {/* Grid — brand / product / category. A-12.67 (Maalik): Brand and
          Product tabs wrapped in the same height-fit chassis as CategoryBranch
          so the page itself doesn't scroll — only the inner grid does. */}
      {tab === "brand" ? (
        <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border/40 bg-card/40 p-3">
          <p className="mb-2 shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Pick a brand
          </p>
          {flowBandForTab("brand")}
          <div className="min-h-0 flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/10 [&::-webkit-scrollbar]:w-1.5">
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
          </div>
        </div>
      ) : tab === "product" ? (
        <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border/40 bg-card/40 p-3">
          <p className="mb-2 shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Pick a product
          </p>
          {flowBandForTab("product")}

          {/* §21.2 — uploaded-image summary. Shown whenever a brand + image
              already satisfies Step 2 without a catalogue product id. */}
          {wizard.state.uploadedProductImage && (
            <div className="mb-2 flex shrink-0 items-center gap-3 rounded-xl border border-border/50 bg-card/60 p-2.5">
              {uploadedImageDataUrl ? (
                <img
                  src={uploadedImageDataUrl}
                  alt="Uploaded product"
                  className="h-10 w-10 shrink-0 rounded-lg object-cover"
                />
              ) : (
                // DEFECT FIX — degrade honestly: this session's in-memory
                // image store didn't survive a reload, so the token no
                // longer resolves. Never point <img src> at the token; show
                // that it needs re-uploading instead of a broken image.
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-warning-text/40 bg-muted text-muted-foreground">
                  <ImageOff className="h-4 w-4" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-foreground">
                  {uploadNeedsReupload ? "Image needs re-uploading" : "Uploaded image"}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {uploadNeedsReupload
                    ? "This session's upload didn't survive the reload — choose it again."
                    : `${ALL_BRANDS.find((b) => b.id === wizard.state.brandId)?.name ?? "No brand"} · no catalogue product needed`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUploadOpen(true)}
                className="shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => wizard.patch({ uploadedProductImage: null })}
                aria-label="Remove uploaded image"
                className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* §9 — bulk outcome, stated in words BEFORE the user commits. */}
          {bulkMode && (
            <div className="mb-2 flex shrink-0 flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2">
              <Users className="h-3.5 w-3.5 shrink-0 text-primary" />
              <p className="min-w-0 flex-1 text-[11px] font-medium text-foreground">
                {bulkSelectedIds.size === 0
                  ? "Select products to feature — they'll all be in ONE ad, not separate ads."
                  : bulkSelectedIds.size === 1
                    ? "1 product selected — the hero. Pick more, or continue with just this one."
                    : `One ad featuring all ${bulkSelectedIds.size} products — not ${bulkSelectedIds.size} separate ads.`}
              </p>
              <button
                type="button"
                onClick={onAdvance}
                disabled={bulkSelectedIds.size === 0}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  bulkSelectedIds.size === 0
                    ? "cursor-not-allowed bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground hover:opacity-90",
                )}
              >
                Continue
              </button>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/10 [&::-webkit-scrollbar]:w-1.5">
            <ProductGrid
              products={filteredProducts}
              selectedId={wizard.state.productId}
              multiSelect={bulkMode}
              selectedIds={bulkSelectedIds}
              heroId={wizard.state.productId}
              onPick={(id) => {
                if (bulkMode) {
                  toggleBulkProduct(id);
                  return;
                }
                wizard.patch({
                  productId: id,
                  categoryId: null,
                  brandId: null,
                  bulkProductIds: [],
                });
                onAdvance();
              }}
              search={search}
            />
          </div>
        </div>
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
            wizard.patch({
              categoryId: id,
              productId: null,
              brandId: null,
              bulkProductIds: [],
            })
          }
          search={search}
          products={categoryProducts}
          selectedProductIds={bulkSelectedIds}
          heroProductId={wizard.state.productId}
          onToggleProduct={toggleBulkProduct}
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
          highlightBand={flowBandForTab("category")}
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
        // Mobile: shrink-0 + nowrap so labels stay whole and the row scrolls
        // instead of clipping words; min-h-11 keeps the 44px tap target.
        // md+: min-h-0 / snap-align-none / gap-2 / px-4 / text-sm restore the
        // original desktop pill byte-for-byte.
        "inline-flex min-h-11 shrink-0 snap-start items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-medium transition-all sm:gap-1.5 sm:px-3 md:min-h-0 md:snap-align-none md:gap-2 md:px-4 md:text-sm",
        active
          ? "bg-foreground text-background shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{label}</span>
      <span
        className={cn(
          "shrink-0 rounded-full px-1 font-mono text-[9px] md:px-1.5 md:text-[10px]",
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
  /** §9 — bulk product selection. When true, `onPick` toggles membership in
   *  `selectedIds` instead of committing a single pick; cards show a
   *  checkbox-style badge instead of the single-select check-circle, and
   *  `heroId` (== wizard.state.productId) gets a small HERO pill — it's the
   *  product the ad is built around, the rest are co-stars. */
  multiSelect?: boolean;
  selectedIds?: Set<string>;
  heroId?: string | null;
}

function ProductGrid({
  products,
  selectedId,
  onPick,
  search,
  multiSelect = false,
  selectedIds,
  heroId,
}: ProductGridProps) {
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
        const isSelected = multiSelect ? (selectedIds?.has(p.id) ?? false) : selectedId === p.id;
        const isHero = multiSelect && heroId === p.id;
        const brand = ALL_BRANDS.find((b) => b.id === p.brandId);
        return (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onPick(p.id)}
              aria-pressed={multiSelect ? isSelected : undefined}
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
                {/* Selection badge top-right — circle check for single-select,
                    square check for multi-select (§9), so the two modes read
                    as visually distinct interaction models, not just a color. */}
                {isSelected && (
                  <span
                    className={cn(
                      "absolute top-2 right-2 inline-flex h-5 w-5 items-center justify-center bg-primary text-primary-foreground shadow-sm",
                      multiSelect ? "rounded-md" : "rounded-full",
                    )}
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
                {!isSelected && multiSelect && (
                  <span className="absolute top-2 right-2 inline-flex h-5 w-5 items-center justify-center rounded-md border-2 border-background/80 bg-background/40 shadow-sm" />
                )}
                {/* Hero pill (§9 / §4) — this is the co-star set's lead product. */}
                {isHero && (
                  <span className="absolute bottom-2 left-2 inline-flex items-center rounded-full bg-foreground/90 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-background">
                    Hero
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
                  <BrandLogoTile name={b.name} src={b.logo} />
                ) : (
                  /* Was a generic Building2 at text-muted-foreground/40 on
                     bg-muted — so faint that a logo-less card read as an empty
                     broken tile rather than a brand. Initials on a tinted
                     ground are recognisable, distinct per brand, and can never
                     look like a failed image (Recognition over Recall). */
                  <BrandInitials name={b.name} />
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
        const meta = CATEGORY_ICON[c.id] ?? DEFAULT_CATEGORY_META;
        const tone = CATEGORY_SCHEME[meta.tone];
        const Icon = meta.Icon;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onPick(c.id)}
            className={cn(
              "v3-glass-card group flex min-h-[72px] items-center gap-2.5 rounded-xl p-3 text-left transition-all",
              isSelected
                ? "ring-2 ring-primary/30"
                : "hover:border-foreground/20",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                isSelected
                  ? `${tone.bgSelected} ${tone.textSelected}`
                  : `${tone.bgRest} ${tone.textRest} ${tone.bgHover}`,
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
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
  /** §9 — all currently-selected product ids (hero + co-stars combined). */
  selectedProductIds: Set<string>;
  /** The hero — wizard.state.productId. §4: for a Category Ad, product is
   *  optional and a picked product becomes the hero of the ad. */
  heroProductId: string | null;
  onToggleProduct: (id: string) => void;
  onContinue: () => void;
  refineOpen: boolean;
  onRefineToggle: (next: boolean) => void;
  /** §6 Rule 4 flow band (suggested / pre-filled), rendered pinned at the
   *  top of the category picker. `null` outside a flow redirect. */
  highlightBand?: React.ReactNode;
}

function CategoryBranch({
  categories,
  selectedCategoryId,
  onPickCategory,
  search,
  products,
  selectedProductIds,
  heroProductId,
  onToggleProduct,
  onContinue,
  refineOpen,
  onRefineToggle,
  highlightBand,
}: CategoryBranchProps) {
  const selectedCategoryName =
    categories.find((c) => c.id === selectedCategoryId)?.name ?? null;
  const continueDisabled = !selectedCategoryId;
  const bulkCount = selectedProductIds.size;

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
        {highlightBand}
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

      {/* Products — only renders when refine ON. flex-[4] keeps the 60:40 ratio.
          §4: product is OPTIONAL for a Category Ad — a pick becomes the hero.
          §9: picking more than one is bulk selection — one ad featuring all
          of them, never auto-advances; the always-visible Continue button
          below is the only way forward from here. */}
      {refineOpen && (
        <div className="flex min-h-0 flex-[4] flex-col rounded-2xl border border-border/40 bg-card/40 p-3">
          <p className="mb-1 shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Products in {selectedCategoryName ?? "category"} · optional, first pick is the hero
          </p>
          {bulkCount > 1 && (
            <p className="mb-2 shrink-0 text-[11px] font-medium text-foreground">
              One ad featuring all {bulkCount} products — not {bulkCount} separate ads.
            </p>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/10 [&::-webkit-scrollbar]:w-1.5">
            {products.length === 0 ? (
              <p className="py-4 text-center text-[12px] italic text-muted-foreground">
                No products in this category — just continue.
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {products.map((p) => {
                  const isSelected = selectedProductIds.has(p.id);
                  const isHero = heroProductId === p.id;
                  const brand = ALL_BRANDS.find((b) => b.id === p.brandId);
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => onToggleProduct(p.id)}
                        aria-pressed={isSelected}
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
                            <span className="absolute right-1 top-1 inline-flex h-4 w-4 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
                              <Check className="h-2.5 w-2.5" strokeWidth={3} />
                            </span>
                          )}
                          {isHero && (
                            <span className="absolute bottom-1 right-1 inline-flex items-center rounded-full bg-foreground/90 px-1 py-0.5 font-mono text-[7px] font-bold uppercase tracking-wider text-background">
                              Hero
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
            ? bulkCount > 1
              ? `Continue — ${bulkCount} products, one ad`
              : `Continue with ${selectedCategoryName}`
            : "Pick a category to continue"}
          {!continueDisabled && <span aria-hidden>→</span>}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── *
 *  Flow-context bands (§6 Rule 4) — rendered pinned at the top
 *  of whichever tab `flowCtx.action.entityTab` opens.
 * ─────────────────────────────────────────────────────────── */

/** Resolves a highlight's kind/id into something displayable — degrades to
 *  the bare `{kind, id, name}` the URL carried if the id no longer resolves
 *  against the current mock data (§ edge case: "a detectedEntity id that no
 *  longer resolves" must never crash). */
function resolveHighlightDisplay(
  highlight: NonNullable<FlowContext["highlight"]>,
): { name: string; sub: string; logo?: string } {
  if (highlight.kind === "brand") {
    const b = ALL_BRANDS.find((x) => x.id === highlight.id);
    return { name: b?.name ?? highlight.name, sub: b?.category ?? "Brand", logo: b?.logo };
  }
  if (highlight.kind === "product") {
    const p = ALL_PRODUCTS.find((x) => x.id === highlight.id);
    const brand = p ? ALL_BRANDS.find((b) => b.id === p.brandId) : undefined;
    return { name: p?.name ?? highlight.name, sub: brand?.name ?? "Product", logo: p?.thumbnail };
  }
  const c = ALL_CATEGORIES.find((x) => x.id === highlight.id);
  return { name: c?.name ?? highlight.name, sub: "Category" };
}

/**
 * FlowHighlightBand — §6 Rule 4 base case. "The detected entity appears
 * highlighted at the top of the picker — highlighted, not selected. One
 * click to accept, or search for something else."
 *
 * This is deliberately styled NOTHING like the grid's "selected" treatment
 * (primary ring + circle check) — amber "Suggested" tag + an explicit
 * "Use this" button, so it reads as a proposal, not a commitment. Nothing
 * is written to wizard state until that button is clicked (Rule 3).
 */
function FlowHighlightBand({
  ctx,
  onAccept,
}: {
  ctx: FlowContext;
  onAccept: () => void;
}) {
  if (!ctx.highlight) return null;
  const display = resolveHighlightDisplay(ctx.highlight);
  // §7.2 — competitorOwned is module metadata used ONLY for this explanatory
  // note. It never changes what gets highlighted — that is, and must stay,
  // ctx.highlight alone (see the big comment on flowCtx above).
  const competitor = ctx.competitorOwned;
  const refTitle =
    ctx.ref.title.length > 60 ? `${ctx.ref.title.slice(0, 59)}…` : ctx.ref.title;

  return (
    <div className="mb-2 shrink-0 overflow-hidden rounded-xl border border-warning-text/30 bg-warning-text/10">
      <div className="flex items-start gap-3 p-3">
        {display.logo ? (
          <img
            src={display.logo}
            alt=""
            className="h-9 w-9 shrink-0 rounded-lg border border-warning-text/30 bg-card object-contain"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-warning-text/30 bg-card text-xs font-bold text-warning-text">
            {display.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-warning-text/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-warning-text">
              Suggested
            </span>
            <span className="truncate text-[10px] text-warning-text">
              not selected yet
            </span>
          </div>
          <p className="mt-0.5 truncate text-[13px] font-semibold text-foreground">
            {display.name}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">{display.sub}</p>
          {competitor && (
            <p className="mt-1 line-clamp-2 text-[10px] leading-tight text-muted-foreground">
              <span className="font-semibold text-foreground">This ad is for your brand</span> — the
              reference, "{refTitle}" by {ctx.ref.sourceBrandName}, belongs to a competitor and is used
              only as inspiration, not the brand you're making this for.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onAccept}
          className="shrink-0 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Use this
        </button>
      </div>
    </div>
  );
}

/**
 * FlowPreselectNote — §7.5's documented exception to Rule 4. The Campaign
 * URLs matched product is already pre-selected (shows with the grid's
 * normal "selected" ring below, exactly like any other pick) — this note
 * only makes the pre-fill VISIBLE and states plainly that it's editable.
 */
function FlowPreselectNote({ ctx }: { ctx: FlowContext }) {
  if (!ctx.preselect || !ctx.highlight) return null;
  return (
    <div className="mb-2 flex shrink-0 items-center gap-2 rounded-xl border border-border/50 bg-muted/40 px-3 py-2">
      <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <p className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
        Pre-filled from {ctx.module.label} — edit below if this isn't right.
      </p>
    </div>
  );
}

/** Up to two letters from a brand name — "boAt" → BO, "The Derma Co." → TD. */
function brandInitials(name: string): string {
  const words = name.replace(/[^A-Za-z0-9 ]/g, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2);
  return (words[0][0] ?? "") + (words[1][0] ?? "");
}

/**
 * Brand logo with a real fallback.
 *
 * `Brand.logo` points at `google.com/s2/favicons?domain=…` — a third-party
 * service. When it's blocked (ad-blocker, corporate network, offline demo) or
 * the domain doesn't resolve, the <img> either fails or returns a generic
 * globe, and the tile reads as an empty broken card. That is a bad way for a
 * client demo to fail, so an error swaps to initials instead: recognisable,
 * distinct per brand, and never mistakable for a loading bug.
 *
 * Not swapping the data source — the favicons look right when they load, and
 * `brands.ts` is shared with Catalogue. This just stops the failure mode.
 */
function BrandLogoTile({ name, src }: { name: string; src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <BrandInitials name={name} />;
  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-16 w-16 rounded-lg object-contain"
    />
  );
}

function BrandInitials({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 font-mono text-[20px] font-bold uppercase tracking-tight text-primary-text"
    >
      {brandInitials(name)}
    </span>
  );
}
