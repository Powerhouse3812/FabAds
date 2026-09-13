import { useMemo, useState } from "react";
import { Check, Package, Pencil, RotateCcw, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBrand } from "@/mocks/shared/brands";
import { getProduct, products } from "@/mocks/shared/products";
import type { Brand, Product } from "../../types/entities";

/**
 * ProductSheet — the owner's handwritten ask, read against this file's actual
 * code: "instead of script only, we will give a Product sheet button/card in
 * which product selection is based … Product show logo. Details to show: Brand
 * name, Product image, name. Variation by default."
 *
 * REUSE, NOT REBUILD: the product roster, `getProduct`/`getBrand`, and the
 * clearing pair (`productId` ⇒ `brandId: null`, `categoryId` follows the
 * product's own) are the exact ones `EntityControl.selectProduct` already
 * established in this same folder — re-expressed here, not re-derived, same
 * as that file's own header comment does for `entitySelectionPatch()`. What is
 * NOT reused verbatim is `EntityControl` itself: it is a general Brand OR
 * Category+Product control, g6-toned to match this screen's chrome, and the
 * owner asked for a narrower, product-only affordance. This file is styled in
 * the app's standard tokens instead (`bg-primary/10`, `border-primary/40`,
 * `text-primary-text`, `fab-focus`) — the same palette `Step3Approach` and
 * `PromptReferenceBar` already bring into this very card (both standard-toned,
 * zero `g6-*` usage), so the card was already mixed before this file existed.
 *
 * "Variation by default" is read as: the product tie-in must be a resting-state
 * affordance, not something buried behind "Edit details" → a rail → a
 * not-found banner. So `ProductSheet` renders in the card's ALWAYS-VISIBLE
 * header, collapsed or not — the same place the format toggle and digest chips
 * already live — rather than only inside the expanded section. Nothing here
 * invents a default PRODUCT (no catalogue id is privileged over another); the
 * default is that the AFFORDANCE itself is never opt-in to discover.
 */

export interface ProductSheetProps {
  /** The card's current product, or null — Auto/none is a first-class state. */
  productId: string | null;
  onOpen: () => void;
  onRemove: () => void;
  className?: string;
}

const THUMB_BOX = "h-9 w-9";

function initialsOf(name: string): string {
  const trimmed = name.trim();
  return (trimmed ? trimmed.slice(0, 2) : "PR").toUpperCase();
}

/**
 * Product image first; a missing thumbnail falls back to the BRAND's logo
 * rather than a blank tile — "Product show logo" read as: the logo is what
 * carries the tile when the product itself has no photograph, and otherwise
 * rides along as a small badge so the brand is legible at a glance even when
 * the product image is present.
 */
function ProductThumb({ product, brand }: { product: Product; brand?: Brand }) {
  const hasPhoto = !!product.thumbnail;
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-md border border-border bg-muted/30",
        THUMB_BOX,
      )}
    >
      {hasPhoto ? (
        <img src={product.thumbnail} alt="" className="h-full w-full object-cover" />
      ) : brand?.logo ? (
        <img src={brand.logo} alt="" className="h-full w-full object-contain p-1" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[10px] font-bold uppercase text-muted-foreground">
          {initialsOf(product.name)}
        </span>
      )}
      {/* Brand-logo badge — only when it would ADD information, i.e. the main
          tile is already the product photo. Otherwise the fallback above is
          the logo itself and a badge would just repeat it. */}
      {hasPhoto && brand?.logo ? (
        <img
          src={brand.logo}
          alt=""
          title={brand.name}
          className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border border-background bg-background object-contain p-0.5"
        />
      ) : null}
    </div>
  );
}

/**
 * ProductSheet — the resting-state control. Nothing attached: a dashed CTA
 * carrying the accent AT REST (never only on hover — CLAUDE.md token traps
 * §1). Attached: brand name, product image (+ logo), product name, Change and
 * Remove — the three details the owner asked to see, one compact row so it
 * survives sitting on every one of up to 20 cards.
 */
export function ProductSheet({ productId, onOpen, onRemove, className }: ProductSheetProps) {
  const product = productId ? getProduct(productId) : undefined;
  const brand = product ? getBrand(product.brandId) : undefined;

  if (!product) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "fab-focus flex w-full items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/10 px-3 py-2 text-left transition-colors hover:bg-primary/15",
          className,
        )}
      >
        <Package className="h-4 w-4 shrink-0 text-primary-text" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] font-semibold leading-4 text-primary-text">
            Attach a product
          </span>
          <span className="block truncate text-[11px] leading-4 text-muted-foreground">
            Brand, image and name show here — this variation stays product-tied.
          </span>
        </span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-2",
        className,
      )}
    >
      <ProductThumb product={product} brand={brand} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-semibold uppercase leading-4 tracking-wide text-muted-foreground">
          {brand?.name ?? "Unknown brand"}
        </p>
        {/* 60+ char names truncate, never reflow the row; full text on hover. */}
        <p title={product.name} className="truncate text-[13px] font-semibold leading-tight text-foreground">
          {product.name}
        </p>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="fab-focus inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold leading-4 text-primary-text hover:underline"
      >
        <Pencil className="h-3 w-3" aria-hidden />
        Change
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${product.name}`}
        className="fab-focus inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-background p-1 text-muted-foreground hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── the picker panel */

/**
 * ProductPickerPanel — mounted inside the card's existing rail switchboard
 * (`railMode === "product"`), same shell the entity/aspect-ratio/language
 * panels already use (no outside-click dismiss — that shell's backdrop has no
 * onClick, matching the app-wide rule). Product-only, flat search over the
 * whole catalogue — no brand/category branch, because that generality is
 * `EntityControl`'s job and this is deliberately the narrower thing the owner
 * asked for.
 */
export function ProductPickerPanel({
  value,
  onPick,
  onClose,
}: {
  value: string | null;
  onPick: (id: string | null) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const brand = getBrand(p.brandId);
      return (
        p.name.toLowerCase().includes(q) ||
        (brand?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [query]);

  const CAP = 60;
  const capped = rows.slice(0, CAP);

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
        <h3 className="text-[13px] font-semibold leading-5 text-foreground">Attach a product</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="fab-focus ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </header>

      <div className="shrink-0 border-b border-border px-4 py-2.5">
        <label className="fab-focus flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products"
            placeholder={`Search ${products.length} products by name or brand`}
            className="w-full bg-transparent text-[12px] leading-5 text-foreground outline-none placeholder:text-muted-foreground"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {value ? (
          <button
            type="button"
            onClick={() => onPick(null)}
            className="fab-focus mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] leading-5 text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Back to Auto — remove the attached product
          </button>
        ) : null}

        {capped.length === 0 ? (
          <p className="px-2 py-6 text-center text-[12px] leading-5 text-muted-foreground">
            No product matches &ldquo;{query}&rdquo;.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {capped.map((p) => {
              const brand = getBrand(p.brandId);
              const selected = value === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onPick(p.id)}
                  aria-pressed={selected}
                  className={cn(
                    "fab-focus flex w-full items-center gap-2.5 rounded-md border px-2.5 py-1.5 text-left transition-colors",
                    selected
                      ? "border-primary/40 bg-primary/10"
                      : "border-transparent hover:bg-muted/30",
                  )}
                >
                  <ProductThumb product={p} brand={brand} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[10px] font-semibold uppercase leading-4 tracking-wide text-muted-foreground">
                      {brand?.name ?? "No brand"}
                    </span>
                    <span title={p.name} className="block truncate text-[12px] leading-5 text-foreground">
                      {p.name}
                    </span>
                  </span>
                  {selected ? (
                    <Check className="h-4 w-4 shrink-0 text-primary-text" aria-hidden />
                  ) : null}
                </button>
              );
            })}
          </div>
        )}

        {rows.length > capped.length ? (
          <p className="px-2 pt-2 text-[11px] leading-4 text-muted-foreground">
            Showing {capped.length} of {rows.length} — search to narrow it down.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default ProductSheet;
