import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, Check, Link2, Sparkles, Package, Search, Plus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { detectBrandFromUrl, type BrandProfile } from "@/lib/genie2-dummy-data";
import { useBrands, useCreateBrand, type Brand } from "@/hooks/use-brands";
import { useBrandProducts, type BrandProduct } from "@/hooks/use-brand-products";
import { BrandFetchModal } from "@/components/genie5/BrandFetchModal";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Props {
  productUrl: string;
  onProductUrlChange: (v: string) => void;
  detectedBrand: BrandProfile | null;
  onBrandDetected: (b: BrandProfile) => void;
  variant?: "compact" | "cards";
  showProducts?: boolean;
}

type FetchStep = "idle" | "brand" | "products" | "done";

const URL_PATTERN = /^https?:\/\/|[a-zA-Z0-9-]+\.(com|co|io|net|org|shop|store|app)/;

export function Genie2EcomInputs({ productUrl, onProductUrlChange, detectedBrand, onBrandDetected, variant = "compact", showProducts = true }: Props) {
  const [fetchStep, setFetchStep] = useState<FetchStep>("idle");
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [fetchedProducts, setFetchedProducts] = useState<{ name: string; price?: string; image?: string }[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [confirmBrand, setConfirmBrand] = useState<Brand | null>(null);
  const [lastSavedBrandId, setLastSavedBrandId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: brands = [] } = useBrands();
  const { data: brandProducts = [] } = useBrandProducts(selectedBrandId);
  const createBrand = useCreateBrand();

  const selectedBrand = brands.find((b) => b.id === selectedBrandId);
  const brandColor = selectedBrand?.colors?.[0] || detectedBrand?.colors?.[0] || null;
  const isCards = variant === "cards";

  const isUrl = URL_PATTERN.test(inputValue);
  const filteredBrands = isUrl ? [] : brands.filter((b) => b.name.toLowerCase().includes(inputValue.toLowerCase()));

  // Sort brands: last saved first
  const sortedBrands = (() => {
    if (!lastSavedBrandId) return brands;
    const saved = brands.find((b) => b.id === lastSavedBrandId);
    if (!saved) return brands;
    return [saved, ...brands.filter((b) => b.id !== lastSavedBrandId)];
  })();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDetect = (url: string) => {
    onProductUrlChange(url);
    if (!url || url.length < 8) return;
    setFetchStep("brand");
    setDropdownOpen(false);
    setTimeout(() => {
      const profile = detectBrandFromUrl(url);
      onBrandDetected(profile);
      setFetchStep("products");
      setTimeout(() => {
        setFetchedProducts([
          { name: `${profile.name} Product 1`, price: "$29.99", image: `https://picsum.photos/seed/${profile.name}1/80/80` },
          { name: `${profile.name} Product 2`, price: "$49.99", image: `https://picsum.photos/seed/${profile.name}2/80/80` },
          { name: `${profile.name} Best Seller`, price: "$39.99", image: `https://picsum.photos/seed/${profile.name}3/80/80` },
        ]);
        setFetchStep("done");
      }, 1500);
    }, 1500);
  };

  const doSelectBrand = (brand: Brand) => {
    setSelectedBrandId(brand.id);
    setSelectedProductId(null);
    setInputValue(brand.name);
    setDropdownOpen(false);
    setFetchStep("idle");
    onBrandDetected({
      name: brand.name,
      colors: brand.colors || ["#6366F1"],
      tone: brand.tone || "Modern",
      category: brand.category || "General",
      logoPlaceholder: brand.name.charAt(0),
    });
  };

  const handleSelectBrand = (brand: Brand) => {
    if (detectedBrand && fetchStep === "done") {
      setConfirmBrand(brand);
      return;
    }
    doSelectBrand(brand);
  };

  const handleSelectProduct = (product: BrandProduct) => {
    setSelectedProductId(product.id);
    if (product.url) onProductUrlChange(product.url);
  };

  const handleSaveBrand = (editedBrand?: { name: string; category: string; tone: string; colors: string[] }) => {
    const brandData = editedBrand || detectedBrand;
    if (!brandData) return;
    createBrand.mutate({
      name: brandData.name,
      category: brandData.category,
      tone: brandData.tone,
      colors: brandData.colors,
      website: productUrl,
    }, {
      onSuccess: (newBrand) => {
        setModalOpen(false);
        if (newBrand?.id) setLastSavedBrandId(newBrand.id);
      },
    });
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    if (!isUrl) setDropdownOpen(true);
    if (URL_PATTERN.test(val)) {
      onProductUrlChange(val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isUrl && inputValue.length > 8 && fetchStep === "idle") {
      handleDetect(inputValue);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (isUrl && inputValue.length > 8 && !detectedBrand && fetchStep === "idle") {
        handleDetect(inputValue);
      }
    }, 200);
  };

  /* ── Fetch status dots ── */
  const FetchStatusBar = () => {
    if (fetchStep === "idle") return null;
    const steps = [
      { key: "brand", label: "Brand" },
      { key: "products", label: "Products" },
    ];
    const currentIdx = fetchStep === "brand" ? 0 : fetchStep === "products" ? 1 : 2;
    return (
      <div className="flex items-center gap-1.5 py-1.5 animate-in fade-in-0 slide-in-from-top-1 duration-200">
        {steps.map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx && fetchStep !== "done";
          return (
            <div key={s.key} className="flex items-center gap-1.5">
              {i > 0 && <div className={cn("h-px w-4", done ? "bg-primary" : "bg-border")} />}
              <div className="flex items-center gap-1">
                {done ? (
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                ) : active ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-border" />
                )}
                <span className={cn("text-[10px] font-medium", active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground")}>{s.label}</span>
              </div>
            </div>
          );
        })}
        {fetchStep === "done" && (
          <>
            <div className="h-px w-4 bg-primary" />
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
              <Check className="h-2.5 w-2.5 text-primary-foreground" />
            </div>
            <span className="text-[10px] font-medium text-primary">Ready</span>
          </>
        )}
      </div>
    );
  };

  /* ── Detected brand mini-card ── */
  const DetectedBrandCard = () => {
    if (!detectedBrand || fetchStep !== "done") return null;
    return (
      <div
        className={cn("flex items-center gap-3 rounded-lg border border-border/50 p-2.5 cursor-pointer hover:bg-accent/30 transition-colors animate-in fade-in-0 duration-300", isCards && "bg-muted/20")}
        onClick={() => setModalOpen(true)}
      >
        <BrandLogo name={detectedBrand.name} logoUrl={null} website={productUrl} color={detectedBrand.colors[0]} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{detectedBrand.name}</span>
            <span className="text-[10px] text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5">{detectedBrand.category}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            {detectedBrand.colors.map((c) => (
              <div key={c} className="h-2.5 w-2.5 rounded-sm border border-border/30" style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-primary shrink-0">
          <Sparkles className="h-3 w-3" />
          Save & Details
        </div>
      </div>
    );
  };

  return (
    <div className={cn("space-y-3", isCards && "rounded-lg bg-muted/15 p-3")}>
      {/* Labeled search row */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Brand / URL</p>
        <div ref={containerRef} className="relative">
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full" style={{ backgroundColor: brandColor || "hsl(var(--primary) / 0.6)" }} />
            <Search className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              placeholder="Search brand or paste product URL..."
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => { if (!isUrl) setDropdownOpen(true); }}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="pl-8 pr-8 h-8 text-xs border-border/50"
            />
            {fetchStep === "brand" && <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-primary" />}
            {fetchStep === "done" && <Check className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-emerald-500" />}
            {fetchStep === "idle" && !isUrl && (
              <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            )}
          </div>

          {/* Dropdown */}
          {dropdownOpen && !isUrl && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md animate-in fade-in-0 zoom-in-95 duration-150">
              <div className="max-h-[180px] overflow-y-auto py-1">
                {filteredBrands.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground text-center">No brands found</p>
                ) : (
                  filteredBrands.map((b) => (
                    <button
                      key={b.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectBrand(b)}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-accent/50 transition-colors",
                        selectedBrandId === b.id && "bg-accent/30"
                      )}
                    >
                      <BrandLogo name={b.name} logoUrl={b.logo_url} website={b.website} color={b.colors?.[0]} size="sm" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium truncate">{b.name}</span>
                        {b.category && <span className="ml-2 text-xs text-muted-foreground">· {b.category}</span>}
                      </div>
                      {selectedBrandId === b.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </button>
                  ))
                )}
              </div>
              <div className="border-t">
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { setDropdownOpen(false); setModalOpen(true); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-primary hover:bg-accent/30 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add new brand
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick-pick pills row */}
      {(sortedBrands.length > 0 || (detectedBrand && fetchStep === "done" && !selectedBrandId)) && (
        <div className="flex gap-2 overflow-x-auto flex-nowrap pb-0.5 scrollbar-thin items-center">
          {/* Detected brand as auto-selected pill */}
          {detectedBrand && fetchStep === "done" && !selectedBrandId && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 shrink-0 rounded-lg px-2.5 py-1 transition-all h-7 text-xs shadow-sm"
              style={{
                backgroundColor: `${detectedBrand.colors[0]}12`,
                borderWidth: 1, borderStyle: "solid",
                borderColor: `${detectedBrand.colors[0]}66`,
              }}
            >
              <BrandLogo name={detectedBrand.name} logoUrl={null} website={productUrl} color={detectedBrand.colors[0]} size="sm" />
              <span className="text-xs font-medium truncate max-w-[80px]">{detectedBrand.name}</span>
              <Check className="h-3 w-3 shrink-0 ml-0.5" style={{ color: detectedBrand.colors[0] }} />
              <span className="text-[9px] font-semibold text-primary bg-primary/10 rounded px-1 py-px">NEW</span>
            </button>
          )}
          {sortedBrands.map((b) => {
            const active = selectedBrandId === b.id;
            const isNew = b.id === lastSavedBrandId;
            return (
              <button
                key={b.id}
                onClick={() => handleSelectBrand(b)}
                className={cn(
                  "flex items-center gap-1.5 shrink-0 rounded-lg px-2.5 py-1 transition-all h-7 text-xs",
                  active ? "shadow-sm" : "border border-border/40 hover:bg-accent/30",
                  isNew && !active && "border-primary/30 bg-primary/5",
                )}
                style={active ? {
                  backgroundColor: `${b.colors?.[0] || "hsl(var(--primary))"}12`,
                  borderWidth: 1, borderStyle: "solid",
                  borderColor: `${b.colors?.[0] || "hsl(var(--primary))"}66`,
                } : undefined}
              >
                <BrandLogo name={b.name} logoUrl={b.logo_url} website={b.website} color={b.colors?.[0]} size="sm" />
                <span className="text-xs font-medium truncate max-w-[80px]">{b.name}</span>
                {active && <Check className="h-3 w-3 shrink-0 ml-0.5" style={{ color: b.colors?.[0] || "hsl(var(--primary))" }} />}
              </button>
            );
          })}
        </div>
      )}

      {/* Fetch status + detected brand (URL mode) */}
      <FetchStatusBar />
      <DetectedBrandCard />

      {/* Product grid */}
      {selectedBrandId && showProducts && (
        <div className="space-y-1.5 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Product</p>
            <span className="text-[10px] text-muted-foreground">{brandProducts.length} available</span>
          </div>
          {brandProducts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 text-center">No products for this brand.</p>
          ) : (
            <div className={cn("grid gap-2", isCards ? "grid-cols-3" : "grid-cols-2")}>
              {brandProducts.slice(0, isCards ? 6 : 4).map((p) => {
                const active = selectedProductId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProduct(p)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg p-2 text-left transition-all",
                      active ? "ring-1" : "border border-border/30 hover:bg-accent/30"
                    )}
                    style={active && brandColor ? {
                      backgroundColor: `${brandColor}12`,
                      borderWidth: 1, borderStyle: "solid",
                      borderColor: `${brandColor}66`,
                      boxShadow: `0 0 0 1px ${brandColor}33`,
                    } : active ? {
                      backgroundColor: "hsl(var(--primary) / 0.1)",
                      borderWidth: 1, borderStyle: "solid",
                      borderColor: "hsl(var(--primary) / 0.4)",
                    } : undefined}
                  >
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="h-8 w-8 rounded-md object-cover border border-border/20 shrink-0" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/40 shrink-0">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{p.name}</p>
                      {p.price && <p className="text-[10px] text-muted-foreground">{p.price}</p>}
                    </div>
                    {active && <Check className="h-3 w-3 shrink-0" style={{ color: brandColor || "hsl(var(--primary))" }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Brand Details Modal */}
      <BrandFetchModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        brand={detectedBrand}
        products={fetchedProducts}
        url={productUrl}
        onSave={handleSaveBrand}
        onDismiss={() => setModalOpen(false)}
        saving={createBrand.isPending}
      />

      {/* Confirm brand switch dialog */}
      <AlertDialog open={!!confirmBrand} onOpenChange={(open) => { if (!open) setConfirmBrand(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace detected brand?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace the detected brand "{detectedBrand?.name}" with "{confirmBrand?.name}". The URL-detected data will be cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmBrand) doSelectBrand(confirmBrand); setConfirmBrand(null); }}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
