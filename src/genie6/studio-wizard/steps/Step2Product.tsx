import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductHorizontalPicker } from "@/genie6/generate-v3/forms/components/ProductHorizontalPicker";
import { brands as allBrands, products as allProducts } from "@/mocks/shared";
import { StepShell } from "../components/StepShell";

/**
 * Step 2 — Pick a product.
 *
 * Reuses the v3 ProductHorizontalPicker as-is. Wizard-flavoured polish
 * (richer card art, "auto-attach product imagery" promotion) is queued
 * for a later iteration — for v1 we stick with the proven control.
 *
 * The picker also has a "Fetch URL" path which sets brandId via the
 * onFetched snapshot. We bridge that back to the wizard form so the
 * right column can reflect the freshly attached brand.
 */

export interface Step2ProductProps {
  productId: string | null;
  onProductChange: (id: string | null) => void;
  onBrandChange: (id: string | null) => void;
}

export function Step2Product({
  productId,
  onProductChange,
  onBrandChange,
}: Step2ProductProps) {
  const [autoAttach, setAutoAttach] = useState(true);

  const handleChange = (nextId: string | null) => {
    onProductChange(nextId);
    if (!nextId) {
      onBrandChange(null);
      return;
    }
    const next = allProducts.find((p) => p.id === nextId);
    onBrandChange(next?.brandId ?? null);
  };

  const selectedProduct = productId
    ? allProducts.find((p) => p.id === productId) ?? null
    : null;
  const selectedBrand = selectedProduct
    ? allBrands.find((b) => b.id === selectedProduct.brandId) ?? null
    : null;

  return (
    <StepShell>
      <div className="space-y-5">
        <header className="space-y-1.5">
          <h1 className="text-xl font-semibold text-foreground">
            Pick a product
          </h1>
          <p className="text-sm text-muted-foreground">
            Search your catalog, filter by brand, or paste a URL to fetch a
            new product on the fly.
          </p>
        </header>

        <ProductHorizontalPicker
          value={productId}
          onChange={handleChange}
          onFetched={(snap) => {
            onProductChange(snap.product.id);
            onBrandChange(snap.brand.id);
          }}
        />

        {selectedProduct && (
          <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2.5">
            {selectedProduct.thumbnail ? (
              <img
                src={selectedProduct.thumbnail}
                alt=""
                className="h-10 w-10 shrink-0 rounded-md border border-border object-cover"
              />
            ) : (
              <div className="h-10 w-10 shrink-0 rounded-md border border-border bg-muted" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {selectedProduct.name}
              </p>
              {selectedBrand && (
                <p className="truncate text-[11px] text-muted-foreground">
                  {selectedBrand.name}
                </p>
              )}
            </div>
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-3 w-3" />
            </span>
          </div>
        )}

        <label
          className={cn(
            "flex items-start gap-2.5 rounded-lg border border-border bg-card/40 px-3 py-2.5 cursor-pointer",
            "hover:border-primary/40 transition-colors",
          )}
        >
          <input
            type="checkbox"
            checked={autoAttach}
            onChange={(e) => setAutoAttach(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 accent-primary"
          />
          <div>
            <p className="text-[12px] font-medium text-foreground">
              Auto-attach product imagery
            </p>
            <p className="text-[11px] text-muted-foreground leading-snug">
              We&apos;ll pull existing shoots of this product as references
              so the render stays on-brand.
            </p>
          </div>
        </label>
      </div>
    </StepShell>
  );
}
