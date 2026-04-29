import { useState, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search, RefreshCw, Rocket, Trash2, FolderPlus, Copy, ExternalLink, ShoppingBag, BookmarkPlus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGenieGenerations,
  useBatchGenerate,
  useDeleteGenieGeneration,
  type GenieGeneration,
  type GenieSettings,
} from "@/hooks/use-genie-generations";
import { GenieImageGrid } from "@/components/genie/GenieImageGrid";
import { GenieVariationModal } from "@/components/genie/GenieVariationModal";
import { GenieEditDrawer } from "@/components/genie/GenieEditDrawer";
import { AdgroupLaunchModal } from "@/components/creative-library/AdgroupLaunchModal";
import type { AdgroupLaunchItem } from "@/hooks/use-adgroup-launch";
import { DEMO_MODE } from "@/lib/demo-mode";
import { cn } from "@/lib/utils";

/* ─── Studio tab type ─── */
type StudioTab = "creatives" | "adgroups" | "product-assets";

/* ─── Helper: generate demo generation ─── */
function dg(i: number, prompt: string, seed: string, cat?: string, ts?: string[]): GenieGeneration {
  return {
    id: `demo-g${i}`, workspace_id: "", created_by: "", parent_id: null, prompt,
    reference_image_ids: [], reference_mode: "merge",
    output_url: `https://picsum.photos/seed/${seed}/400/400`, storage_path: "demo",
    settings: { ...(cat ? { category: cat } : {}), ...(ts ? { traffic_sources: ts } : {}) },
    status: "completed", created_at: new Date(Date.now() - 1000 * 60 * (i * 45 + 10)).toISOString(),
  };
}

const DEMO_GENERATIONS: GenieGeneration[] = [
  dg(1,"Nike Air Max 90 flash sale — 40% off limited edition","ecom-nike-airmax-sale","Product",["meta"]),
  dg(2,"GlowSkin Vitamin C serum product hero shot","ecom-glowskin-serum-hero","Product"),
  dg(3,"TechNova wireless headphones unboxing promo","ecom-technova-unbox","Product",["tiktok"]),
  dg(4,"VitaBoost protein powder jar with ingredients","ecom-vitaboost-protein","Product"),
  dg(5,"BrewCraft cold brew 3-pack bundle deal","ecom-brewcraft-bundle","Lifestyle",["newsbreak"]),
  dg(6,"StyleCo summer dress collection lookbook","ecom-styleco-dress","Lifestyle"),
  dg(7,"FitBand Pro smartwatch features carousel","ecom-fitband-carousel","Product"),
  dg(8,"LeafTea matcha set premium gift box","ecom-leaftea-giftbox","Product"),
  dg(9,"SunShield SPF 50 reef-safe sunscreen promo","ecom-sunshield-spf","Product",["meta"]),
  dg(10,"CozyHome soy candle trio holiday collection","ecom-cozyhome-candles","Lifestyle"),
  dg(11,"Nike running shoes on-model street style","ecom-nike-street","Lifestyle"),
  dg(12,"GlowSkin retinol night cream before-after","ecom-glowskin-retinol","Product"),
  dg(13,"PureBlend plant protein shake lifestyle","ecom-pureblend-shake","Lifestyle"),
  dg(14,"AquaFit smart water bottle product page","ecom-aquafit-bottle","Product",["meta"]),
  dg(15,"UrbanEdge leather backpack travel shot","ecom-urbanedge-backpack","Lifestyle"),
  dg(16,"ZenSkin face mask self-care routine","ecom-zenskin-mask","Lifestyle"),
  dg(17,"PeakGear camping tent adventure hero","ecom-peakgear-tent","Lifestyle"),
  dg(18,"Nike sneaker collection grid layout","ecom-nike-grid","Product"),
  dg(19,"GlowSkin skincare routine flat lay","ecom-glowskin-flatlay","Product"),
  dg(20,"TechNova earbuds neon product shot","ecom-technova-earbuds","Product"),
  dg(21,"VitaBoost supplement stack deal banner","ecom-vita-stack","Product"),
  dg(22,"BrewCraft espresso machine promo","ecom-brewcraft-machine","Product"),
  dg(23,"StyleCo linen shirt summer sale","ecom-styleco-linen","Lifestyle"),
  dg(24,"FitBand fitness tracker comparison ad","ecom-fitband-compare","Product"),
  dg(25,"LeafTea organic green tea sachets","ecom-leaftea-sachets","Product"),
  dg(26,"SunShield lip balm SPF bundle","ecom-sunshield-lip","Product"),
  dg(27,"CozyHome throw blanket cozy scene","ecom-cozyhome-blanket","Lifestyle"),
  dg(28,"PureBlend meal prep container set","ecom-pureblend-mealprep","Product"),
  dg(29,"AquaFit resistance bands home gym","ecom-aquafit-bands","Product"),
  dg(30,"UrbanEdge minimalist wallet RFID","ecom-urbanedge-wallet","Product"),
  dg(31,"ZenSkin eye cream peptide formula","ecom-zenskin-eyecream","Product"),
  dg(32,"PeakGear hiking boots waterproof","ecom-peakgear-boots","Product"),
  dg(33,"Nike Air Jordan retro drop promo","ecom-nike-jordan","Product"),
  dg(34,"GlowSkin collagen peptides jar","ecom-glowskin-collagen","Product"),
  dg(35,"TechNova gaming headset RGB promo","ecom-technova-gaming","Product"),
  dg(36,"VitaBoost greens powder superfood","ecom-vita-greens","Product"),
  dg(37,"BrewCraft craft beer variety pack","ecom-brewcraft-variety","Lifestyle"),
  dg(38,"StyleCo sustainable fashion brand hero","ecom-styleco-sustain","Lifestyle"),
  dg(39,"FitBand yoga mat eco-friendly promo","ecom-fitband-yoga","Product"),
  dg(40,"LeafTea ceramic teapot artisan","ecom-leaftea-teapot","Product"),
  dg(41,"SunShield after-sun lotion aloe vera","ecom-sunshield-aftersun","Product"),
  dg(42,"CozyHome essential oil diffuser set","ecom-cozyhome-diffuser","Lifestyle"),
  dg(43,"PureBlend organic snack bars box","ecom-pureblend-bars","Product"),
  dg(44,"AquaFit bluetooth speaker waterproof","ecom-aquafit-speaker","Product"),
  dg(45,"UrbanEdge sunglasses aviator collection","ecom-urbanedge-shades","Product"),
  dg(46,"ZenSkin face wash tea tree acne","ecom-zenskin-facewash","Product"),
  dg(47,"PeakGear action camera 4K promo","ecom-peakgear-camera","Product"),
  dg(48,"Nike training shorts quick-dry tech","ecom-nike-shorts","Product"),
  dg(49,"GlowSkin hyaluronic acid serum dropper","ecom-glowskin-ha","Product"),
  dg(50,"TechNova portable charger 20000mAh","ecom-technova-charger","Product"),
];

/* ─── Demo Adgroups ─── */
interface DemoAdgroup {
  id: string;
  pageName: string;
  pageAvatarSeed: string;
  adType: string;
  primaryText: string;
  headline: string;
  description: string;
  mediaUrl: string;
  displayLink: string;
  cta: string;
  brand: string;
  created_at: string;
}

const BRANDS = ["Nike","GlowSkin","TechNova","VitaBoost","BrewCraft","StyleCo","FitBand","LeafTea","SunShield","CozyHome","PureBlend","AquaFit","UrbanEdge","ZenSkin","PeakGear"];
const CTAS = ["Shop Now","Learn More","Sign Up","Order Now","Download","Book Now","Get Offer","Subscribe"];
const AD_TYPES = ["Static","Video","Carousel","Static","Static","Video","Static","Carousel"];

function makeAdgroup(i: number): DemoAdgroup {
  const brand = BRANDS[i % BRANDS.length];
  const cta = CTAS[i % CTAS.length];
  const adType = AD_TYPES[i % AD_TYPES.length];
  const copies: [string,string,string][] = [
    ["Transform your morning routine with our plant-based protein shake. 100% natural, zero compromise. 🌿💪","Fuel Your Day Naturally","Premium plant protein — 30g per serving, 5 delicious flavors"],
    ["Running just got personal. Adapts to your stride, mile after mile. Limited colorways dropping Friday.","Run Like Never Before","Free shipping on orders over $99 — Returns within 30 days"],
    ["Your skin deserves better. Dermatologist-tested serum repairs, hydrates & glows — all in one drop. ✨","Get 50% Off Your First Order","Clinically proven results in 14 days. Join 50K+ happy customers."],
    ["Noise-cancelling, 40hr battery, studio-quality sound. Designed for the obsessed. 🎧","Sound That Moves You","Free engraving + 2-year warranty on all orders"],
    ["Cold brew, craft-roasted, ready in seconds. Brings the café to your fridge. ☕","Your New Morning Ritual","Subscribe & save 20% — Cancel anytime"],
    ["Summer's here and so is our biggest sale. Up to 60% off everything. Don't wait. 🏖️","Summer Sale — Up to 60% Off","Limited stock, limited time. Free express shipping."],
    ["Track steps, sleep, heart rate — all from your wrist. Your 24/7 health companion.","Your Health, Your Way","Rated #1 fitness tracker 2025 — 7-day battery life"],
    ["Organic, single-origin, hand-picked. Every sip tells a story. 🍵","Taste the Difference","Free sampler pack with your first order"],
    ["SPF 50, lightweight, reef-safe. Protect without the white cast. ☀️","Sunscreen Reinvented","Dermatologist recommended — suitable for all skin types"],
    ["Handcrafted candles made from 100% soy wax. Set the mood, naturally. 🕯️","Luxury Scents for Less","Buy 2, get 1 free — over 20 fragrances"],
    ["Detox your body with our 7-day juice cleanse. Feel lighter, brighter, better. 🥤","Reset Your Body","Free nutrition guide included with every order"],
    ["Built for champions. Our new training shorts feature 4-way stretch & quick-dry tech. 🏋️","Train Without Limits","Athletes love us — 4.9★ rating from 12K reviews"],
    ["Discover the secret to ageless skin. Retinol + Hyaluronic Acid serum combo. 💎","Your Anti-Aging Routine","Visible results in just 7 days — 60-day guarantee"],
    ["Premium wireless earbuds with spatial audio. Hear every detail like never before.","Immersive Sound, Anywhere","24hr battery life — IPX5 water resistance"],
    ["Farm-to-table snack bars. No preservatives, no BS. Just real ingredients. 🌾","Snack Smarter","Subscribe & save 30% on your monthly box"],
    ["Your travel companion. Ultra-light backpack with anti-theft design. ✈️","Travel Light, Travel Smart","TSA-approved laptop compartment — lifetime warranty"],
    ["Wake up to smoother skin. Our overnight mask works while you sleep. 🌙","Beauty Sleep, Redefined","Join 100K+ women who transformed their skincare"],
    ["Step into comfort. Memory foam insoles that adapt to your feet.","Walk on Clouds","30-day comfort guarantee — free exchanges"],
    ["Brew cafe-quality espresso at home. No pods, no waste. ♻️","Your Kitchen, Your Café","Save $500/year vs daily coffee shop visits"],
    ["Smart home security made simple. 1080p, night vision, 2-way audio. 🔒","Peace of Mind, 24/7","Easy DIY install — no monthly fees"],
    ["Luxury towels made from organic Turkish cotton. Feel the difference. 🛁","Hotel-Quality at Home","Buy 3+ sets and get free monogramming"],
    ["Performance socks engineered for marathons. Moisture-wicking, blister-free. 🧦","Every Step Counts","Trusted by 5K+ marathon runners worldwide"],
    ["Meal prep containers that keep food fresh 3x longer. BPA-free. 🥗","Meal Prep Made Easy","Dishwasher & microwave safe — stackable design"],
    ["Next-gen gaming headset with 7.1 surround sound. Dominate every match. 🎮","Hear Your Victory","RGB lighting + detachable mic — USB-C"],
    ["Minimalist wallet, maximum style. RFID blocking, fits 12 cards. 💳","Slim Your Pocket","Genuine leather — available in 8 colors"],
    ["Our new yoga mat has arrived. Extra thick, non-slip, eco-friendly. 🧘","Find Your Flow","Includes free carry strap + cleaning spray"],
    ["High-protein ice cream that actually tastes amazing. Only 280 cal/pint. 🍦","Guilt-Free Indulgence","Available in 12 flavors — ships frozen"],
    ["The ultimate desk setup. Adjustable standing desk with cable management.","Elevate Your Workspace","Free shipping + 10-year warranty"],
    ["Rescue your dry lips. Our lip balm is packed with shea butter & vitamin E. 💋","Kiss Dry Lips Goodbye","Organic ingredients — cruelty-free certified"],
    ["Capture every moment. 4K action camera, waterproof to 30m. 📷","Adventure-Ready","Includes 32GB SD card + mounting kit"],
    ["Refresh your wardrobe with sustainable basics. Organic cotton, fair trade. 👕","Wear Your Values","Free returns — carbon-neutral shipping"],
    ["Smart water bottle that tracks hydration & reminds you to drink. 💧","Stay Hydrated, Stay Sharp","Syncs with Apple Health & Google Fit"],
    ["Our blue-light glasses reduce eye strain by 80%. Work comfortably all day. 👓","Protect Your Eyes","Prescription-ready — 30-day trial"],
    ["Premium dog food made with real chicken & sweet potato. Vet-approved. 🐕","Happy Dogs, Happy Life","Free breed-specific feeding guide"],
    ["Electric toothbrush with 5 modes & smart pressure sensor. Dentist recommended. 🦷","Smile Brighter","Replace heads every 3 months — auto-ship available"],
    ["Noise-cancelling sleep earbuds. Fall asleep to calming sounds. 😴","Sleep Like Never Before","30-night risk-free trial"],
    ["Our plant-based burger patties taste just like the real thing. 🍔","Taste the Future","Available at 5000+ stores nationwide"],
    ["Premium resistance bands set for home workouts. 5 levels of resistance. 💪","Home Gym Essentials","Includes workout poster + carrying bag"],
    ["Artisan chocolate truffles — handcrafted in small batches. 🍫","Indulge in Luxury","Gift box available — ships in 2 days"],
    ["Smart thermostat that learns your schedule and saves up to 25% on energy. 🏠","Comfort Meets Savings","Easy install — works with Alexa & Google"],
    ["Ultra-soft bamboo bed sheets. Hypoallergenic, temperature-regulating. 🛏️","Sleep in Luxury","Deep pocket design — fits mattresses up to 18\""],
    ["Professional-grade kitchen knife set. Japanese steel, ergonomic handles. 🔪","Cook Like a Chef","Lifetime sharpness guarantee"],
    ["Collagen peptides powder — unflavored, dissolves instantly in any drink.","Glow From Within","30-day supply — clinically studied formula"],
    ["All-terrain electric bike with 50mi range. Conquer any hill. 🚲","Ride Further","Financing available from $49/month"],
    ["Reusable silicone food storage bags. Replace 1000+ plastic bags. 🌍","Go Zero Waste","Dishwasher safe — 10 sizes available"],
    ["Premium noise-cancelling headphones for commuters. 35hr battery.","Block the Noise","Folds flat for easy storage"],
    ["Organic face wash with tea tree oil. Clears acne in 2 weeks. 🧴","Clear Skin, Clear Mind","Suitable for all skin types — sulfate free"],
    ["Handmade ceramic mug set — microwave & dishwasher safe. ☕","Sip in Style","Each mug is unique — artisan crafted"],
    ["LED strip lights with app control. 16M colors, music sync. 💡","Set the Vibe","Easy peel-and-stick install — 32ft"],
    ["Organic baby clothes made from GOTS-certified cotton. 👶","Gentle on Baby","Machine washable — no harsh chemicals"],
  ];
  const [pt, hl, desc] = copies[i % copies.length];
  return {
    id: `ag-${i+1}`,
    pageName: brand,
    pageAvatarSeed: `avatar-${brand.toLowerCase()}`,
    adType,
    primaryText: pt,
    headline: hl,
    description: desc,
    mediaUrl: `https://picsum.photos/seed/ad-ecom-product-${i+1}/400/300`,
    displayLink: `${brand.toLowerCase().replace(/\s/g,"")}.com`,
    cta,
    brand,
    created_at: new Date(Date.now() - 1000 * 60 * (i * 40 + 15)).toISOString(),
  };
}

const DEMO_ADGROUPS: DemoAdgroup[] = Array.from({ length: 50 }, (_, i) => makeAdgroup(i));

/* ─── Demo Product Assets ─── */
interface DemoProductAsset {
  id: string;
  productName: string;
  imageUrl: string;
  shotType: "Lifestyle" | "Flat Lay" | "Studio" | "On-Model" | "Close-Up";
  brand: string;
  created_at: string;
}

const SHOT_TYPES: DemoProductAsset["shotType"][] = ["Studio","Flat Lay","Lifestyle","On-Model","Close-Up"];
const PRODUCT_NAMES = [
  "Hydra Glow Serum 30ml","Euphoria Eau de Parfum","Rose Gold Lip Oil","Vitamin C Brightening Drops","Matcha Latte Powder Tin",
  "Cold Brew Coffee Bottle","Yerba Mate Organic Can","Retinol Night Repair Cream","Argan Hair Oil 50ml","Lavender Body Lotion",
  "Charcoal Face Wash","Jade Roller & Gua Sha Set","Peptide Eye Cream","Shea Butter Hand Cream","Tea Tree Spot Treatment",
  "Oat Milk Cleanser","Collagen Booster Serum","Rosehip Seed Oil","Hyaluronic Acid Mist","Niacinamide Toner 200ml",
  "Craft Beer Amber Ale","Sparkling Water — Citrus","Protein Shake — Vanilla","Green Juice — Detox","Kombucha — Ginger Lemon",
  "Perfume — Midnight Oud","Cologne — Ocean Breeze","Soy Candle — Cedar Wood","Reed Diffuser — Eucalyptus","Bath Salts — Rose Petal",
  "Sunscreen SPF 50 Mist","After-Sun Aloe Gel","BB Cream — Light","Setting Spray — Matte","Bronzer Palette — Sun-Kissed",
  "Silk Pillowcase — Ivory","Linen Robe — Sand","Cotton Scrunchie Set","Cashmere Beanie — Oat","Merino Wool Scarf",
  "Ceramic Vase — Terracotta","Stoneware Mug — Sage","Glass Carafe 1L","Bamboo Cutting Board","Cast Iron Skillet",
  "Wireless Earbuds — Bone","Smart Watch — Graphite","Phone Case — Clear","Laptop Sleeve — Tan","Portable Charger — White",
];

const PRODUCT_SEEDS = [
  "skincare-serum-stone","perfume-bottle-moss","lipgloss-rosegold","vitaminc-dropper-citrus","matcha-tin-green",
  "coldbrew-bottle-dark","yerba-mate-can-berry","retinol-cream-night","argan-oil-dropper","lavender-lotion-tube",
  "charcoal-wash-black","jade-roller-pink","peptide-eye-jar","shea-hand-cream","teatree-spot-bottle",
  "oatmilk-cleanser-soft","collagen-serum-gold","rosehip-oil-amber","hyaluronic-mist-blue","niacinamide-toner-clear",
  "craft-beer-amber","sparkling-citrus-can","protein-vanilla-shake","green-juice-detox","kombucha-ginger-glass",
  "perfume-oud-dark","cologne-ocean-blue","soy-candle-cedar","reed-diffuser-eucalyptus","bath-salts-rose",
  "sunscreen-spf-spray","aftersun-aloe-tube","bb-cream-light","setting-spray-matte","bronzer-palette-warm",
  "silk-pillowcase-ivory","linen-robe-sand","cotton-scrunchie-pastel","cashmere-beanie-oat","merino-scarf-grey",
  "ceramic-vase-terracotta","stoneware-mug-sage","glass-carafe-clear","bamboo-board-natural","cast-iron-skillet",
  "wireless-earbuds-bone","smartwatch-graphite","phonecase-clear-minimal","laptop-sleeve-tan","portable-charger-white",
];

const DEMO_PRODUCT_ASSETS: DemoProductAsset[] = Array.from({ length: 50 }, (_, i) => ({
  id: `pa-${i+1}`,
  productName: PRODUCT_NAMES[i % PRODUCT_NAMES.length],
  imageUrl: `https://picsum.photos/seed/${PRODUCT_SEEDS[i % PRODUCT_SEEDS.length]}/400/500`,
  shotType: SHOT_TYPES[i % SHOT_TYPES.length],
  brand: BRANDS[i % BRANDS.length],
  created_at: new Date(Date.now() - 1000 * 60 * (i * 50 + 20)).toISOString(),
}));

/* ─── Shot-type badge colors ─── */
const SHOT_TYPE_COLORS: Record<string, string> = {
  Studio: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  "Flat Lay": "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  Lifestyle: "bg-green-500/15 text-green-700 dark:text-green-300",
  "On-Model": "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  "Close-Up": "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

/* ─── Time ago helper ─── */
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ─── Adgroup Card (Meta Ad Preview) ─── */
function AdgroupCard({ ag, onLaunch }: { ag: DemoAdgroup; onLaunch: (ag: DemoAdgroup) => void }) {
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${ag.primaryText}\n\n${ag.headline}\n${ag.description}`);
    toast.success("Copied to clipboard");
  };

  return (
    <Card className="group relative hover:shadow-md transition-all cursor-pointer border-border/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 pb-1.5">
        <Avatar className="h-7 w-7">
          <AvatarImage src={`https://picsum.photos/seed/${ag.pageAvatarSeed}/40/40`} />
          <AvatarFallback className="text-[10px]">{ag.pageName[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-foreground truncate">{ag.pageName}</p>
          <p className="text-[9px] text-muted-foreground">Sponsored</p>
        </div>
        <Badge variant="secondary" className="text-[9px] px-1.5 h-4 shrink-0">{ag.adType}</Badge>
      </div>

      {/* Primary text */}
      <div className="px-3 pb-1.5">
        <p className="text-[11px] text-foreground line-clamp-2 leading-relaxed">{ag.primaryText}</p>
      </div>

      {/* Media */}
      <div className="bg-muted aspect-[4/3] overflow-hidden">
        <img src={ag.mediaUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
      </div>

      {/* Link strip */}
      <div className="px-3 py-1.5 bg-muted/40">
        <p className="text-[9px] text-muted-foreground truncate uppercase">{ag.displayLink}</p>
        <p className="text-[11px] font-semibold text-foreground truncate">{ag.headline}</p>
        <p className="text-[9px] text-muted-foreground truncate">{ag.description}</p>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-around py-1.5 border-t border-border/50">
        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); toast.success("Saved to library"); }}>
          <BookmarkPlus className="h-3 w-3 mr-1" />Save
        </Button>
        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); toast("Opening editor..."); }}>
          <Pencil className="h-3 w-3 mr-1" />Edit
        </Button>
        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); onLaunch(ag); }}>
          <Rocket className="h-3 w-3 mr-1" />Launch
        </Button>
      </div>
    </Card>
  );
}

/* ─── Product Asset Card ─── */
function ProductAssetCard({ asset }: { asset: DemoProductAsset }) {
  return (
    <Card className="group hover:shadow-md transition-all cursor-pointer overflow-hidden border-border/60">
      <div className="aspect-[4/5] relative overflow-hidden bg-muted rounded-t-lg">
        <img src={asset.imageUrl} alt={asset.productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        <div className="absolute top-2 right-2">
          <Badge className={cn("text-[10px] h-5 px-2 border-0 font-medium backdrop-blur-sm", SHOT_TYPE_COLORS[asset.shotType] || "bg-muted text-muted-foreground")}>{asset.shotType}</Badge>
        </div>
      </div>
      <CardContent className="p-3 space-y-1">
        <p className="text-xs font-semibold truncate text-foreground">{asset.productName}</p>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal">{asset.brand}</Badge>
          <span className="text-[10px] text-muted-foreground">{timeAgo(asset.created_at)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Main Component ─── */
export function GenieLibraryView() {
  const workspaceId = useWorkspace();
  const { user } = useAuth();

  const { data: dbGenerations = [], isLoading, refetch } = useGenieGenerations("my");
  const { generate: batchGenerate, activeBatches, dismissBatch } = useBatchGenerate();
  const deleteMutation = useDeleteGenieGeneration();

  const generations = DEMO_MODE && dbGenerations.length === 0 ? DEMO_GENERATIONS : dbGenerations;

  const [activeTab, setActiveTab] = useState<StudioTab>("creatives");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [variationModal, setVariationModal] = useState<{ gen: GenieGeneration; mode: "edit" | "variation" } | null>(null);
  const [launchItems, setLaunchItems] = useState<AdgroupLaunchItem[] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editDrawerGen, setEditDrawerGen] = useState<GenieGeneration | null>(null);

  const filtered = useMemo(() => {
    let list = generations;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((g) => g.prompt?.toLowerCase().includes(q));
    }
    if (statusFilter === "completed") list = list.filter((g) => g.status === "completed" && g.output_url);
    else if (statusFilter === "failed") list = list.filter((g) => g.status !== "completed" || !g.output_url);
    return list;
  }, [generations, search, statusFilter]);

  const filteredAdgroups = useMemo(() => {
    if (!search.trim()) return DEMO_ADGROUPS;
    const q = search.toLowerCase();
    return DEMO_ADGROUPS.filter((a) => a.headline.toLowerCase().includes(q) || a.primaryText.toLowerCase().includes(q) || a.brand.toLowerCase().includes(q));
  }, [search]);

  const filteredProductAssets = useMemo(() => {
    if (!search.trim()) return DEMO_PRODUCT_ASSETS;
    const q = search.toLowerCase();
    return DEMO_PRODUCT_ASSETS.filter((p) => p.productName.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
  }, [search]);

  const handleSelectChange = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => { const next = new Set(prev); if (checked) next.add(id); else next.delete(id); return next; });
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    await deleteMutation.mutateAsync(id);
    setDeletingId(null);
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }, [deleteMutation]);

  const handleSaveToLibrary = useCallback(async (gen: GenieGeneration) => {
    if (!workspaceId || !user) return;
    try {
      const { error } = await supabase.from("creative_assets").insert({
        workspace_id: workspaceId, uploaded_by: user.id,
        file_name: `genie-${gen.id.slice(0, 8)}.png`, file_type: "image/png",
        storage_path: gen.storage_path, url: gen.output_url,
      });
      if (error) throw error;
      toast.success("Saved to Creative Library");
    } catch { toast.error("Failed to save"); }
  }, [workspaceId, user]);

  const handleLaunch = useCallback((gen: GenieGeneration) => {
    setLaunchItems([{ id: gen.id, type: "media", mediaUrls: [gen.output_url] }]);
  }, []);

  const handleAdgroupLaunch = useCallback((ag: DemoAdgroup) => {
    setLaunchItems([{ id: ag.id, type: "media", mediaUrls: [ag.mediaUrl] }]);
  }, []);

  const handleBulkLaunch = useCallback(() => {
    const items: AdgroupLaunchItem[] = generations.filter((g) => selectedIds.has(g.id)).map((g) => ({ id: g.id, type: "media" as const, mediaUrls: [g.output_url] }));
    if (items.length) setLaunchItems(items);
  }, [generations, selectedIds]);

  const handleBulkDelete = useCallback(async () => {
    for (const id of selectedIds) await deleteMutation.mutateAsync(id);
    setSelectedIds(new Set());
  }, [selectedIds, deleteMutation]);

  const handleRetry = useCallback((gen: GenieGeneration) => {
    batchGenerate({ prompt: gen.prompt, settings: (gen.settings || {}) as GenieSettings, referenceImages: gen.reference_image_ids || [], referenceMode: (gen.reference_mode as "merge" | "separate") || "merge", parentId: gen.parent_id || undefined });
    deleteMutation.mutateAsync(gen.id);
  }, [batchGenerate, deleteMutation]);

  const handleClearFailed = useCallback(async () => {
    for (const g of generations.filter((g) => g.status !== "completed" || !g.output_url)) await deleteMutation.mutateAsync(g.id);
  }, [generations, deleteMutation]);

  const handleGenieGenerate = useCallback(
    (prompt: string, settings: GenieSettings, refImages: string[], refMode: "merge" | "separate", parentId?: string) => {
      batchGenerate({ prompt, settings, referenceImages: refImages, referenceMode: refMode, parentId });
    },
    [batchGenerate]
  );

  const itemCount = activeTab === "creatives" ? filtered.length : activeTab === "adgroups" ? filteredAdgroups.length : filteredProductAssets.length;

  const TABS: { key: StudioTab; label: string }[] = [
    { key: "creatives", label: "Creatives" },
    { key: "adgroups", label: "Adgroups" },
    { key: "product-assets", label: "Product Assets" },
  ];

  return (
    <>
      <ScrollArea className="flex-1">
        <div className="p-4 2xl:p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Studio</h1>
              <p className="text-sm text-muted-foreground mt-0.5">All your generated creatives, adgroups & product assets</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{itemCount} items</Badge>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetch()} disabled={isLoading}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* 3-Pill Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/60 w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSelectedIds(new Set()); }}
                className={cn(
                  "px-3.5 py-1.5 rounded-md text-xs font-medium transition-all",
                  activeTab === tab.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search + Filter */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder={activeTab === "creatives" ? "Search prompts..." : activeTab === "adgroups" ? "Search adgroups..." : "Search product assets..."} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
            </div>
            {activeTab === "creatives" && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Bulk toolbar (creatives only) */}
          {activeTab === "creatives" && selectedIds.size > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg border bg-muted/50">
              <Badge variant="secondary" className="text-xs">{selectedIds.size} selected</Badge>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleBulkLaunch}><Rocket className="h-3 w-3 mr-1" />Launch</Button>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => { generations.filter((g) => selectedIds.has(g.id)).forEach(handleSaveToLibrary); }}><FolderPlus className="h-3 w-3 mr-1" />Save</Button>
              <Button variant="outline" size="sm" className="text-xs h-7 text-destructive" onClick={handleBulkDelete}><Trash2 className="h-3 w-3 mr-1" />Delete</Button>
              <Button variant="ghost" size="sm" className="text-xs h-7 ml-auto" onClick={() => setSelectedIds(new Set())}>Clear</Button>
            </div>
          )}

          {/* Content */}
          {activeTab === "creatives" && (
            <GenieImageGrid
              generations={filtered} isLoading={isLoading} onRefresh={() => refetch()}
              selectedIds={selectedIds} onSelectChange={handleSelectChange}
              onEdit={(gen) => setVariationModal({ gen, mode: "edit" })}
              onVariation={(gen) => setVariationModal({ gen, mode: "variation" })}
              onLaunch={handleLaunch} onDelete={handleDelete} onSaveToLibrary={handleSaveToLibrary}
              onAIEdit={(gen) => setEditDrawerGen(gen)} deletingId={deletingId}
              activeBatches={activeBatches} onRetry={handleRetry} onClearFailed={handleClearFailed} onDismissBatch={dismissBatch}
            />
          )}

          {activeTab === "adgroups" && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredAdgroups.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Copy className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No adgroups found</p>
                </div>
              ) : filteredAdgroups.map((ag) => <AdgroupCard key={ag.id} ag={ag} onLaunch={handleAdgroupLaunch} />)}
            </div>
          )}

          {activeTab === "product-assets" && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProductAssets.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <ShoppingBag className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No product assets found</p>
                </div>
              ) : filteredProductAssets.map((asset) => <ProductAssetCard key={asset.id} asset={asset} />)}
            </div>
          )}
        </div>
      </ScrollArea>

      <GenieVariationModal open={!!variationModal} onOpenChange={(v) => !v && setVariationModal(null)} generation={variationModal?.gen || null} onGenerate={handleGenieGenerate} isGenerating={false} mode={variationModal?.mode || "variation"} />
      <AdgroupLaunchModal open={!!launchItems} onOpenChange={(v) => !v && setLaunchItems(null)} items={launchItems || []} />
      <GenieEditDrawer open={!!editDrawerGen} onOpenChange={(v) => !v && setEditDrawerGen(null)} generation={editDrawerGen} />
    </>
  );
}
