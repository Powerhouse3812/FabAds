import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, Trash2, Plus, RefreshCw, Package, Sparkles, ImageIcon, Globe,
  ExternalLink, Clock,
} from "lucide-react";
import { BRAND_CATEGORIES, BRAND_INDUSTRIES } from "@/lib/genie3-data";
import { useUpdateBrand, useDeleteBrand, type Brand } from "@/hooks/use-brands";
import { useBrandProducts, useSyncBrandProducts, type BrandProduct } from "@/hooks/use-brand-products";
import { AddProductModal } from "./AddProductModal";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  brand: Brand | null;
}

/* ── Demo creative/adcopy stats ──────────────────────────────── */
const DEMO_CREATIVE_STATS: Record<string, { adCopies: number; creatives: number }> = {
  "demo-b1": { adCopies: 14, creatives: 23 },
  "demo-b2": { adCopies: 8, creatives: 12 },
  "demo-b3": { adCopies: 6, creatives: 18 },
  "demo-b4": { adCopies: 4, creatives: 7 },
  "demo-b5": { adCopies: 5, creatives: 9 },
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

export function BrandDetailDrawer({ open, onOpenChange, brand }: Props) {
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();
  const syncProducts = useSyncBrandProducts();
  const { data: products = [] } = useBrandProducts(brand?.id);

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [category, setCategory] = useState("");
  const [industry, setIndustry] = useState("");
  const [tone, setTone] = useState("");
  const [guidelines, setGuidelines] = useState("");
  const [addProductOpen, setAddProductOpen] = useState(false);

  // Sync form state when brand changes
  useEffect(() => {
    if (brand) {
      setName(brand.name);
      setWebsite(brand.website || "");
      setCategory(brand.category || "");
      setIndustry(brand.industry || "");
      setTone(brand.tone || "");
      setGuidelines(brand.guidelines || "");
    }
  }, [brand?.id]);

  if (!brand) return null;

  const isDemo = brand.id.startsWith("demo-");
  const stats = isDemo ? (DEMO_CREATIVE_STATS[brand.id] || { adCopies: 0, creatives: 0 }) : { adCopies: 0, creatives: 0 };
  const lastSynced = isDemo ? new Date(Date.now() - 1000 * 60 * 45).toISOString() : null;

  const handleSave = () => {
    if (isDemo) { onOpenChange(false); return; }
    updateBrand.mutate({
      id: brand.id,
      name, website, category, industry, tone, guidelines,
    }, { onSuccess: () => onOpenChange(false) });
  };

  const handleDelete = () => {
    if (isDemo) { onOpenChange(false); return; }
    deleteBrand.mutate(brand.id, { onSuccess: () => onOpenChange(false) });
  };

  const handleSync = () => {
    syncProducts.mutate(brand.id);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[420px] sm:w-[460px] p-0 flex flex-col">
          <SheetHeader className="px-5 pt-5 pb-3">
            <SheetTitle className="flex items-center gap-2">
              {brand.colors && brand.colors.length > 0 && (
                <div className="flex gap-1">
                  {brand.colors.map((c) => (
                    <div key={c} className="h-4 w-4 rounded-sm border" style={{ backgroundColor: c }} />
                  ))}
                </div>
              )}
              {brand.name}
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="px-5 pb-5 space-y-5">

              {/* ── Overview / Editable fields ─────────────────────── */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Brand Details</h4>
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {BRAND_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
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
              </div>

              <Separator />

              {/* ── Stats row ────────────────────────────────────────── */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stats</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border bg-card p-3 text-center">
                    <Package className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-bold">{products.length}</p>
                    <p className="text-[10px] text-muted-foreground">Products</p>
                  </div>
                  <div className="rounded-lg border bg-card p-3 text-center">
                    <Sparkles className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-bold">{stats.adCopies}</p>
                    <p className="text-[10px] text-muted-foreground">Ad Copies</p>
                  </div>
                  <div className="rounded-lg border bg-card p-3 text-center">
                    <ImageIcon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-bold">{stats.creatives}</p>
                    <p className="text-[10px] text-muted-foreground">Creatives</p>
                  </div>
                </div>
                {lastSynced && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last synced {format(new Date(lastSynced), "MMM d, h:mm a")}
                  </p>
                )}
              </div>

              <Separator />

              {/* ── Products ─────────────────────────────────────────── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Products</h4>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={handleSync} disabled={syncProducts.isPending}>
                      {syncProducts.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                      Sync
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setAddProductOpen(true)}>
                      <Plus className="h-3 w-3 mr-1" />Add
                    </Button>
                  </div>
                </div>
                {products.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No products yet. Add manually or sync.</p>
                ) : (
                  <div className="space-y-1.5">
                    {products.map((p) => (
                      <div key={p.id} className="flex items-center gap-2.5 rounded-lg border p-2 hover:bg-accent/30 transition-colors">
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

              <Separator />

              {/* ── Ad Copies ───────────────────────────────────────── */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Ad Copies
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">{stats.adCopies}</Badge>
                </h4>
                <div className="space-y-1.5">
                  {DEMO_AD_COPIES.slice(0, 4).map((copy) => (
                    <div key={copy.id} className="rounded-lg border p-2.5">
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

              {/* ── Creatives ──────────────────────────────────────── */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Creatives
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">{stats.creatives}</Badge>
                </h4>
                <div className="grid grid-cols-3 gap-1.5">
                  {DEMO_CREATIVES.map((cr) => (
                    <div key={cr.id} className="group relative rounded-lg overflow-hidden border aspect-square">
                      <img src={cr.url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                        <p className="text-[9px] text-white leading-tight truncate">{cr.prompt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Actions ──────────────────────────────────────── */}
              <div className="flex items-center justify-between pt-2 border-t">
                <Button variant="ghost" size="sm" className="text-destructive h-8 text-xs" onClick={handleDelete} disabled={deleteBrand.isPending}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" />Delete
                </Button>
                <Button size="sm" className="h-8 text-xs" onClick={handleSave} disabled={updateBrand.isPending || !name.trim()}>
                  {updateBrand.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AddProductModal open={addProductOpen} onOpenChange={setAddProductOpen} brandId={brand.id} />
    </>
  );
}
