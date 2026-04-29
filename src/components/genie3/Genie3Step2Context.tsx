import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Link2, Loader2, Check, Package, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { IntentType, PurposeType, EcomFocusType } from "@/lib/genie3-data";
import { ASPECT_RATIOS, EXISTING_PRODUCTS, detectBrandFromUrl, type BrandProfile } from "@/lib/genie2-dummy-data";
import { Genie2AffiliateInputs } from "@/components/genie2/Genie2AffiliateInputs";
import type { Brand } from "@/hooks/use-brands";

interface Props {
  intent: IntentType;
  purpose: PurposeType;
  ecomFocus: EcomFocusType;
  activeBrand: Brand | null;
  productUrl: string;
  onProductUrlChange: (v: string) => void;
  detectedBrand: BrandProfile | null;
  onBrandDetected: (b: BrandProfile) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  angle: string;
  onAngleChange: (v: string) => void;
  aspectRatio: string;
  onAspectRatioChange: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function Genie3Step2Context({
  intent, purpose, ecomFocus, activeBrand,
  productUrl, onProductUrlChange, detectedBrand, onBrandDetected,
  category, onCategoryChange, angle, onAngleChange,
  aspectRatio, onAspectRatioChange,
  onBack, onNext,
}: Props) {
  const [detecting, setDetecting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const handleDetect = useCallback((url: string) => {
    onProductUrlChange(url);
    if (!url || url.length < 8) return;
    setDetecting(true);
    setTimeout(() => {
      const profile = detectBrandFromUrl(url);
      onBrandDetected(profile);
      setDetecting(false);
    }, 2000);
  }, [onProductUrlChange, onBrandDetected]);

  const handleSelectExisting = (id: string) => {
    const product = EXISTING_PRODUCTS.find((p) => p.id === id);
    if (product) {
      setSelectedProduct(id);
      setPickerOpen(false);
      onProductUrlChange(product.url);
      handleDetect(product.url);
    }
  };

  const selected = EXISTING_PRODUCTS.find((p) => p.id === selectedProduct);

  return (
    <div className="space-y-5">
      {/* Active brand context */}
      {activeBrand && (
        <div className="flex items-center gap-2 rounded-lg border bg-accent/30 px-3 py-2">
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
            style={{ backgroundColor: activeBrand.colors?.[0] || "#6366F1" }}
          >
            {activeBrand.name.charAt(0)}
          </div>
          <span className="text-xs font-medium text-foreground">{activeBrand.name}</span>
          {activeBrand.category && (
            <Badge variant="outline" className="text-[10px]">{activeBrand.category}</Badge>
          )}
        </div>
      )}

      {/* E-commerce product input */}
      {purpose === "ecommerce" && ecomFocus === "product" && (
        <div className="space-y-3">
          <Label className="text-xs font-medium">Product Link</Label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Paste product URL..."
                value={productUrl}
                onChange={(e) => onProductUrlChange(e.target.value)}
                onBlur={() => productUrl.length > 8 && !detectedBrand && handleDetect(productUrl)}
                className="pl-9 h-9"
              />
              {detecting && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />}
              {detectedBrand && !detecting && <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />}
            </div>
            <span className="text-xs text-muted-foreground">or</span>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 rounded-md border bg-background px-3 h-9 text-sm hover:bg-accent/40 transition-colors shrink-0">
                  {selected ? (
                    <>
                      <img src={selected.image} alt="" className="h-6 w-6 rounded object-cover border" />
                      <span className="text-xs font-medium max-w-[100px] truncate">{selected.name}</span>
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Pick existing</span>
                    </>
                  )}
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-1" align="end">
                <div className="max-h-64 overflow-y-auto">
                  {EXISTING_PRODUCTS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectExisting(p.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-accent/60 transition-colors",
                        selectedProduct === p.id && "bg-accent"
                      )}
                    >
                      <img src={p.image} alt="" className="h-10 w-10 rounded-md object-cover border" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.brand}</p>
                      </div>
                      <span className="text-xs font-medium shrink-0">{p.price}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Detected brand mini-card */}
          {detectedBrand && (
            <div className="flex items-center gap-2 rounded-lg border bg-accent/20 px-3 py-2">
              <div className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold text-white"
                style={{ backgroundColor: detectedBrand.colors[0] }}
              >
                {detectedBrand.logoPlaceholder}
              </div>
              <span className="text-xs font-medium">{detectedBrand.name}</span>
              <span className="text-[11px] text-muted-foreground">• {detectedBrand.category}</span>
              <div className="flex gap-1 ml-2">
                {detectedBrand.colors.map((c) => (
                  <div key={c} className="h-3.5 w-3.5 rounded-sm border" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Affiliate inputs */}
      {purpose === "affiliate" && (
        <Genie2AffiliateInputs
          category={category}
          onCategoryChange={onCategoryChange}
          angle={angle}
          onAngleChange={onAngleChange}
        />
      )}

      {/* Aspect ratio */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Aspect Ratio</Label>
        <div className="flex gap-2">
          {ASPECT_RATIOS.map((ar) => (
            <button
              key={ar.value}
              onClick={() => onAspectRatioChange(ar.value)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                aspectRatio === ar.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              {ar.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={onBack}>Back</Button>
        <Button size="sm" onClick={onNext}>Next</Button>
      </div>
    </div>
  );
}
