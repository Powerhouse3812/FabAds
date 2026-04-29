import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Trash2, Plus, RefreshCw, Package, Sparkles, ImageIcon, Globe,
  ExternalLink, Clock, ArrowLeft, Type, MessageSquare, Palette, CheckCircle2, Bookmark,
} from "lucide-react";
import { BRAND_INDUSTRIES } from "@/lib/genie3-data";
import { useUpdateBrand, useDeleteBrand, type Brand } from "@/hooks/use-brands";
import { useBrandProducts, useSyncBrandProducts } from "@/hooks/use-brand-products";
import { AddProductModal } from "./AddProductModal";
import { format, formatDistanceToNow } from "date-fns";
import { Genie5ActivityLog } from "@/components/genie5/Genie5ActivityLog";
import { useSavedStrategies, useDeleteSavedStrategy, type SavedStrategy } from "@/hooks/use-saved-strategies";

const DEMO_SAVED_STRATEGIES: SavedStrategy[] = [
  { id: "demo-bs1", workspace_id: "", created_by: "", brand_id: null, title: "Before/After Transformation", angle: "Comparison", hook: "See the difference in just 7 days", layout: "Split screen", visual_direction: "Clean, high-contrast comparison", is_custom: false, custom_prompt: null, tags: ["conversion", "proof"], created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "demo-bs2", workspace_id: "", created_by: "", brand_id: null, title: "Social Proof Authority", angle: "Trust", hook: "Join 50K+ satisfied customers", layout: "Testimonial centered", visual_direction: "Real customer photos, warm tones", is_custom: false, custom_prompt: null, tags: ["trust", "UGC"], created_at: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: "demo-bs3", workspace_id: "", created_by: "", brand_id: null, title: "Urgency Flash Sale", angle: "FOMO", hook: "Only 24 hours left — don't miss out", layout: "Bold countdown overlay", visual_direction: "Red accents, timer visuals", is_custom: true, custom_prompt: "Create urgency-driven strategy", tags: ["sale", "urgency"], created_at: new Date(Date.now() - 86400000 * 7).toISOString() },
];

interface Props {
  brand: Brand;
  onBack: () => void;
  onGenerateForBrand?: (brand: Brand) => void;
}

const DEMO_CREATIVE_STATS: Record<string, { adCopies: number; creatives: number; productAssets: number }> = {
  "demo-b1": { adCopies: 14, creatives: 23, productAssets: 8 },
  "demo-b2": { adCopies: 8, creatives: 12, productAssets: 5 },
  "demo-b3": { adCopies: 6, creatives: 18, productAssets: 4 },
  "demo-b4": { adCopies: 4, creatives: 7, productAssets: 3 },
  "demo-b5": { adCopies: 5, creatives: 9, productAssets: 6 },
};

const DEMO_AD_COPIES = [
  { id: "ac-1", text: "Transform your workout with ultimate comfort and style. Just Do It.", type: "primary_text", created: "2h ago" },
  { id: "ac-2", text: "Limited drop — grab yours before they're gone 🔥", type: "headline", created: "5h ago" },
  { id: "ac-3", text: "Built for performance. Designed for you.", type: "description", created: "1d ago" },
  { id: "ac-4", text: "New season, new energy. Shop the latest collection now →", type: "primary_text", created: "2d ago" },
];

const DEMO_CREATIVES = [
  { id: "cr-1", url: "https://picsum.photos/seed/cr-brand-1/300/300", prompt: "Product shot on gradient", created: "1h ago" },
  { id: "cr-2", url: "https://picsum.photos/seed/cr-brand-2/300/300", prompt: "Lifestyle outdoor scene", created: "4h ago" },
  { id: "cr-3", url: "https://picsum.photos/seed/cr-brand-3/300/300", prompt: "Flat lay with props", created: "1d ago" },
  { id: "cr-4", url: "https://picsum.photos/seed/cr-brand-4/300/300", prompt: "Hero banner creative", created: "2d ago" },
  { id: "cr-5", url: "https://picsum.photos/seed/cr-brand-5/300/300", prompt: "Model lifestyle shot", created: "3d ago" },
  { id: "cr-6", url: "https://picsum.photos/seed/cr-brand-6/300/300", prompt: "UGC style creative", created: "3d ago" },
];

const SHOT_TYPE_COLORS: Record<string, string> = {
  Studio: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  "Flat Lay": "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  Lifestyle: "bg-green-500/15 text-green-700 dark:text-green-300",
  "On-Model": "bg-purple-500/15 text-purple-700 dark:text-purple-300",
};

const DEMO_PRODUCT_ASSETS = [
  { id: "bpa-1", name: "Air Max 90 — Infrared", imageUrl: "https://picsum.photos/seed/bpa-shoe/300/300", shotType: "Studio" },
  { id: "bpa-2", name: "React Element 55", imageUrl: "https://picsum.photos/seed/bpa-react/300/300", shotType: "Lifestyle" },
  { id: "bpa-3", name: "Dri-FIT Training Tee", imageUrl: "https://picsum.photos/seed/bpa-tee/300/300", shotType: "On-Model" },
  { id: "bpa-4", name: "Pro Leggings — Black", imageUrl: "https://picsum.photos/seed/bpa-legs/300/300", shotType: "Flat Lay" },
];

export function BrandDetailPage({ brand, onBack, onGenerateForBrand }: Props) {
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();
  const syncProducts = useSyncBrandProducts();
  const { data: products = [] } = useBrandProducts(brand?.id);
  const { data: dbSavedStrategies = [] } = useSavedStrategies(brand?.id);
  const savedStrategies = dbSavedStrategies.length > 0 ? dbSavedStrategies : DEMO_SAVED_STRATEGIES;
  const deleteStrategy = useDeleteSavedStrategy();

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [tone, setTone] = useState("");
  const [guidelines, setGuidelines] = useState("");
  const [addProductOpen, setAddProductOpen] = useState(false);

  useEffect(() => {
    if (brand) {
      setName(brand.name);
      setWebsite(brand.website || "");
      setIndustry(brand.industry || "");
      setTone(brand.tone || "");
      setGuidelines(brand.guidelines || "");
    }
  }, [brand?.id]);

  const isDemo = brand.id.startsWith("demo-");
  const stats = isDemo ? (DEMO_CREATIVE_STATS[brand.id] || { adCopies: 0, creatives: 0, productAssets: 0 }) : { adCopies: 0, creatives: 0, productAssets: 0 };
  const lastSynced = isDemo ? new Date(Date.now() - 1000 * 60 * 45) : null;
  const firstColor = brand.colors?.[0] || "#6366F1";

  const handleSave = () => {
    if (isDemo) return;
    updateBrand.mutate({ id: brand.id, name, website, industry, tone, guidelines });
  };

  const handleDelete = () => {
    if (isDemo) { onBack(); return; }
    deleteBrand.mutate(brand.id, { onSuccess: () => onBack() });
  };

  const handleSync = () => {
    syncProducts.mutate(brand.id);
  };

  return (
    <>
      <ScrollArea className="flex-1">
        <div className="p-4 2xl:p-6 space-y-6 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: firstColor }}
            >
              {brand.logo_url ? (
                <img src={brand.logo_url} alt={brand.name} className="h-full w-full rounded-lg object-cover" />
              ) : brand.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold text-foreground">{brand.name}</h1>
              <p className="text-xs text-muted-foreground">{brand.industry || "No industry set"}</p>
            </div>
            {brand.colors && brand.colors.length > 0 && (
              <div className="flex gap-1">
                {brand.colors.map((c) => (
                  <div key={c} className="h-5 w-5 rounded border border-border" style={{ backgroundColor: c }} />
                ))}
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="strategies">Strategies</TabsTrigger>
              <TabsTrigger value="library">Library</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Website</span>
                    </div>
                    <p className="text-sm font-medium truncate">{brand.website || "Not set"}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle2 className="h-3 w-3 text-primary" />
                      <span className="text-[10px] text-muted-foreground">Connected</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Products</span>
                    </div>
                    <p className="text-sm font-medium">{products.length}</p>
                    <span className="text-[10px] text-muted-foreground">Synced items</span>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Last Synced</span>
                    </div>
                    <p className="text-sm font-medium">{lastSynced ? formatDistanceToNow(lastSynced, { addSuffix: true }) : "Never"}</p>
                    <span className="text-[10px] text-muted-foreground">Auto-sync enabled</span>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Assets Created</span>
                    </div>
                    <p className="text-sm font-medium">{stats.adCopies + stats.creatives}</p>
                    <span className="text-[10px] text-muted-foreground">+{Math.floor(Math.random() * 5 + 2)} this week</span>
                  </CardContent>
                </Card>
              </div>

              {/* Brand Identity Row */}
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <Palette className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Brand Colors</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {(brand.colors || []).map((c) => (
                        <div key={c} className="flex items-center gap-1.5">
                          <div className="h-5 w-5 rounded border border-border" style={{ backgroundColor: c }} />
                          <span className="text-[10px] text-muted-foreground font-mono">{c}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <Type className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Typography</span>
                    </div>
                    <p className="text-sm font-medium">{brand.typography || "Default"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Brand Tone</span>
                    </div>
                    <p className="text-sm font-medium">{brand.tone || "Not set"}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button className="text-xs h-8" onClick={() => onGenerateForBrand?.(brand)}>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />Generate Ad Creative
                </Button>
                <Button variant="outline" className="text-xs h-8" onClick={() => onGenerateForBrand?.(brand)}>
                  <ImageIcon className="h-3.5 w-3.5 mr-1.5" />Generate Product Assets
                </Button>
              </div>

              <Separator />

              {/* Editable Fields */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Edit Brand Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Domain / Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="h-8 text-sm pl-8" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Industry</Label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {BRAND_INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tone</Label>
                  <Input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="e.g. Bold & Motivational" className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Guidelines</Label>
                  <Textarea value={guidelines} onChange={(e) => setGuidelines(e.target.value)} rows={3} placeholder="Brand guidelines, voice..." className="text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="h-8 text-xs" onClick={handleSave} disabled={updateBrand.isPending || !name.trim()}>
                    {updateBrand.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                    Save Changes
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive h-8 text-xs" onClick={handleDelete} disabled={deleteBrand.isPending}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" />Delete Brand
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Products */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5" />
                    Product Catalog
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">{products.length}</Badge>
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5" onClick={handleSync} disabled={syncProducts.isPending}>
                      {syncProducts.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                      Sync Now
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5" onClick={() => setAddProductOpen(true)}>
                      <Plus className="h-3 w-3 mr-1" />Add Product
                    </Button>
                  </div>
                </div>
                {products.length === 0 ? (
                  <div className="text-center py-8 border rounded-lg bg-muted/20">
                    <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No products yet</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Add manually or sync from your store</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {products.map((p) => (
                      <div key={p.id} className="flex items-center gap-2.5 rounded-lg border p-2.5 hover:bg-accent/30 transition-colors">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="h-10 w-10 rounded object-cover border shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{p.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            {p.price && <span>{p.price}</span>}
                            {p.sku && <span>· {p.sku}</span>}
                          </div>
                        </div>
                        {p.url && (
                          <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="strategies" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-primary" />
                  Saved Strategies
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{savedStrategies.length}</Badge>
                </h3>
              </div>
              {savedStrategies.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center">
                  <Bookmark className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No strategies saved for this brand yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Save strategies from the generation form to see them here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {savedStrategies.map((s) => (
                    <div key={s.id} className="rounded-lg border p-3 space-y-2 hover:bg-accent/20 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{s.title}</p>
                          {s.hook && <p className="text-xs text-muted-foreground mt-0.5">"{s.hook}"</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive shrink-0"
                          onClick={() => deleteStrategy.mutate(s.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {s.angle && <Badge variant="outline" className="text-[9px] h-4 px-1.5">{s.angle}</Badge>}
                        {s.layout && <Badge variant="outline" className="text-[9px] h-4 px-1.5">{s.layout}</Badge>}
                        {s.is_custom && <Badge variant="secondary" className="text-[9px] h-4 px-1.5">Custom</Badge>}
                        {(s.tags || []).map(t => <Badge key={t} variant="secondary" className="text-[9px] h-4 px-1.5">{t}</Badge>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="library" className="mt-4 space-y-6">
              {/* Ad Copies */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Ad Copies
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">{stats.adCopies}</Badge>
                </h3>
                <div className="space-y-1.5">
                  {DEMO_AD_COPIES.map((copy) => (
                    <div key={copy.id} className="rounded-lg border p-3 hover:bg-accent/20 transition-colors cursor-pointer">
                      <p className="text-xs leading-relaxed">{copy.text}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5">{copy.type.replace("_", " ")}</Badge>
                        <span className="text-[10px] text-muted-foreground">{copy.created}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Creatives */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Creatives
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">{stats.creatives}</Badge>
                </h3>
                <div className="grid grid-cols-3 lg:grid-cols-4 gap-2">
                  {DEMO_CREATIVES.map((cr) => (
                    <div key={cr.id} className="group relative rounded-lg overflow-hidden border aspect-square cursor-pointer">
                      <img src={cr.url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                        <p className="text-[10px] text-white leading-tight truncate">{cr.prompt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Product Assets */}
              <div className="space-y-3 pb-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5" />
                  Product Assets
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">{stats.productAssets}</Badge>
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {DEMO_PRODUCT_ASSETS.map((pa) => (
                    <div key={pa.id} className="group rounded-lg overflow-hidden border cursor-pointer hover:shadow-md transition-all">
                      <div className="aspect-square relative overflow-hidden bg-muted">
                        <img src={pa.imageUrl} alt={pa.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute top-2 right-2">
                          <Badge className={`text-[10px] h-5 px-2 border-0 font-medium backdrop-blur-sm ${SHOT_TYPE_COLORS[pa.shotType] || "bg-muted text-muted-foreground"}`}>{pa.shotType}</Badge>
                        </div>
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-medium truncate">{pa.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="logs" className="mt-4">
              <Genie5ActivityLog entityType="brand" entityId={brand.id} />
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      <AddProductModal open={addProductOpen} onOpenChange={setAddProductOpen} brandId={brand.id} />
    </>
  );
}
