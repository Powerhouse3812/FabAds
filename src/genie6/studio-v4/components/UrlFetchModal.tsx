import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product, Brand } from "@/genie6/types/entities";
import { products as ALL_PRODUCTS } from "@/mocks/shared";

interface UrlFetchModalProps {
  product: Product;
  brand?: Brand;
  onSave: (productId: string) => void;
  onCancel: () => void;
}

function Divider({ label }: { label: string }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
      {label}
    </p>
  );
}

/**
 * UrlFetchModal — confirmation dialog shown after scraping a product URL.
 * Shows brand + product data for user to review, then save.
 */
export function UrlFetchModal({ product, brand, onSave, onCancel }: UrlFetchModalProps) {
  const brandProducts = brand
    ? ALL_PRODUCTS.filter((p) => p.brandId === brand.id).slice(0, 8)
    : [];

  const landingPage = product.landingPages?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl max-h-[85vh]">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
          <span className="text-sm font-semibold text-foreground">
            Product found — review and save
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto space-y-5 px-5 py-4">

          {/* Brand section */}
          {brand && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {brand.logo && (
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="h-8 w-8 rounded-full object-contain"
                  />
                )}
                <span className="text-sm font-semibold text-foreground">
                  {brand.name}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-foreground">
                  {brand.category}
                </span>
              </div>
              {brand.colors.length > 0 && (
                <div className="flex items-center gap-0.5">
                  {brand.colors.slice(0, 4).map((color) => (
                    <span
                      key={color}
                      className="mx-0.5 inline-block h-5 w-5 rounded-full border border-border/40"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Brand products list */}
          {brandProducts.length > 0 && (
            <div className="space-y-1.5">
              <Divider label="Products from this brand" />
              <div className="space-y-0.5">
                {brandProducts.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px]",
                      p.id === product.id
                        ? "bg-primary/10 border border-primary/30 font-semibold text-foreground"
                        : "bg-muted/40 text-foreground/80",
                    )}
                  >
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                      {p.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product details */}
          <div className="space-y-2">
            <Divider label="Product details" />
            <p className="text-sm font-bold text-foreground">{product.name}</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-foreground">
                {product.price}
              </span>
              {product.categoryId && (
                <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-foreground">
                  {product.categoryId}
                </span>
              )}
            </div>
            {product.benefits.length > 0 && (
              <ul className="space-y-0.5">
                {product.benefits.slice(0, 5).map((b) => (
                  <li key={b} className="text-[12px] text-foreground/80">
                    · {b}
                  </li>
                ))}
              </ul>
            )}
            {product.promo && (
              <p className="text-[12px] italic text-primary/80">
                {product.promo}
              </p>
            )}
            {landingPage && (
              <span className="inline-block rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-foreground/70 max-w-full truncate">
                {landingPage.slice(0, 40)}
                {landingPage.length > 40 ? "…" : ""}
              </span>
            )}
          </div>

          {/* Knowledge Base stub */}
          <div className="space-y-2">
            <Divider label="Knowledge Base (stub)" />
            {(
              [
                "Target Audience",
                "What to say",
                "What to avoid",
                "Problem → Solution",
              ] as const
            ).map((label) => (
              <div
                key={label}
                className="flex justify-between text-[11px]"
              >
                <span className="text-muted-foreground">{label}</span>
                <span className="italic text-foreground/50">—</span>
              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(product.id)}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Save &amp; continue →
          </button>
        </div>

      </div>
    </div>
  );
}
