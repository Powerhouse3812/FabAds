import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2, Package, BookOpen, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FetchedSnapshot } from "./ProductHorizontalPicker";

/**
 * URLFetchEditModal — review + edit fetched data before saving (A-11.19).
 *
 * Spec: after URL fetch succeeds, ProductShootForm shows a small toast
 * with "Edit & save" — clicking opens this modal. User reviews the
 * fetched fields (brand, product, guidelines, other products), edits
 * any inline, then saves to their catalogue (mocked for now — wire to
 * real backend in iter-8+).
 *
 * Editable fields:
 *   - Brand name
 *   - Product name + price
 *   - Guidelines (line-by-line)
 *   - Other products (read-only list — they'll auto-import)
 */

export interface URLFetchEditModalProps {
  snapshot: FetchedSnapshot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (edited: FetchedSnapshot) => void;
}

export function URLFetchEditModal({
  snapshot,
  open,
  onOpenChange,
  onSave,
}: URLFetchEditModalProps) {
  const [brandName, setBrandName] = useState("");
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [guidelinesText, setGuidelinesText] = useState("");

  // Re-seed when a new snapshot arrives
  useEffect(() => {
    if (!snapshot) return;
    setBrandName(snapshot.brand.name);
    setProductName(snapshot.product.name);
    setProductPrice(snapshot.product.price ?? "");
    setGuidelinesText((snapshot.guidelines ?? []).join("\n"));
  }, [snapshot]);

  if (!snapshot) return null;

  const handleSave = () => {
    const edited: FetchedSnapshot = {
      ...snapshot,
      brand: { ...snapshot.brand, name: brandName.trim() || snapshot.brand.name },
      product: {
        ...snapshot.product,
        name: productName.trim() || snapshot.product.name,
        price: productPrice.trim() || snapshot.product.price,
      },
      guidelines: guidelinesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    onSave?.(edited);
    onOpenChange(false);
  };

  const otherProductsCount = snapshot.otherProducts?.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Review fetched data</DialogTitle>
          <DialogDescription className="break-all text-xs">
            Source: {snapshot.sourceUrl}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Brand */}
          <FieldGroup icon={Building2} label="Brand">
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="block h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm text-foreground focus:border-primary/40 focus:outline-none"
            />
          </FieldGroup>

          {/* Product */}
          <FieldGroup icon={Package} label="Product">
            <div className="grid grid-cols-[1fr_120px] gap-2">
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Product name"
                className="block h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm text-foreground focus:border-primary/40 focus:outline-none"
              />
              <input
                type="text"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                placeholder="Price"
                className="block h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm text-foreground focus:border-primary/40 focus:outline-none"
              />
            </div>
          </FieldGroup>

          {/* Guidelines */}
          <FieldGroup icon={BookOpen} label="Brand guidelines" sub="One per line">
            <textarea
              value={guidelinesText}
              onChange={(e) => setGuidelinesText(e.target.value)}
              rows={4}
              className="block w-full resize-y rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none"
            />
          </FieldGroup>

          {/* Other products — read-only summary */}
          {otherProductsCount > 0 && (
            <FieldGroup icon={ShoppingBag} label="Other products" sub="Auto-imported with this brand">
              <div className="flex flex-wrap gap-1.5">
                {snapshot.otherProducts!.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-foreground"
                  >
                    <Package className="h-2.5 w-2.5 text-muted-foreground" />
                    {p.name}
                  </span>
                ))}
              </div>
            </FieldGroup>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save to catalogue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────── */

function FieldGroup({
  icon: Icon,
  label,
  sub,
  children,
}: {
  icon: typeof Building2;
  label: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline gap-1.5">
        <Icon className="h-3 w-3 text-muted-foreground translate-y-0.5" />
        <p className={cn("text-[11px] font-medium text-foreground")}>{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground">· {sub}</p>}
      </div>
      {children}
    </div>
  );
}
