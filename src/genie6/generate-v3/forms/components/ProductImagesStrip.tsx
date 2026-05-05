import { Sparkles, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { products as allProducts } from "@/mocks/shared";

/**
 * ProductImagesStrip — auto-attached existing product imagery (A-11.19).
 *
 * Per Maalik's spec: "Product images will be attached with a toggle to
 * deattach or deselect some of them, same product ke other product shoot
 * images/videos select hokr aajayengi, jo humne fetch kri hai URL se."
 *
 * On product selection, auto-fills with the product's existing thumbnails
 * + variant images (mock data — real backend wires the full asset library
 * in iter-8+). Each thumbnail is "attached" by default; user can detach
 * individual ones via the X button on hover.
 *
 * Mock variants: we synthesize 3 variants per product by reusing the
 * product thumbnail with different style hints. Real shoot-asset-library
 * integration lands later.
 */

export interface AttachedImage {
  id: string;
  label: string;
  thumbnail?: string;
}

export interface ProductImagesStripProps {
  productId: string | null;
  /** IDs the user has detached (won't include them in the generation context). */
  detachedIds: string[];
  onToggleDetach: (id: string) => void;
}

/**
 * Synthesize attached images from product mocks. In real backend, this
 * comes from the asset library + URL-fetch results.
 */
function deriveAttachedImages(productId: string | null): AttachedImage[] {
  if (!productId) return [];
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return [];
  // Mock: 1 main thumbnail + 2 synthesized "variant" entries
  const items: AttachedImage[] = [];
  if (product.thumbnail) {
    items.push({
      id: `${product.id}-main`,
      label: "Main",
      thumbnail: product.thumbnail,
    });
  }
  items.push({
    id: `${product.id}-lifestyle`,
    label: "Lifestyle",
    thumbnail: product.thumbnail,
  });
  items.push({
    id: `${product.id}-detail`,
    label: "Detail shot",
    thumbnail: product.thumbnail,
  });
  return items;
}

export function ProductImagesStrip({
  productId,
  detachedIds,
  onToggleDetach,
}: ProductImagesStripProps) {
  const images = deriveAttachedImages(productId);

  if (!productId) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card/40 px-4 py-5 text-center">
        <p className="text-xs text-muted-foreground">
          Pick a product above to auto-attach its existing imagery.
        </p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card/40 px-4 py-5 text-center">
        <ImageIcon className="mx-auto h-5 w-5 text-muted-foreground/60" />
        <p className="mt-1 text-xs text-muted-foreground">
          No existing images for this product. Generation will start from your prompt + references.
        </p>
      </div>
    );
  }

  const attachedCount = images.filter((i) => !detachedIds.includes(i.id)).length;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {attachedCount} of {images.length} attached · click X to detach
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {images.map((img) => {
          const detached = detachedIds.includes(img.id);
          return (
            <div
              key={img.id}
              className={cn(
                "shrink-0 group relative w-[100px] overflow-hidden rounded-lg border bg-card transition-all",
                detached
                  ? "border-dashed border-border opacity-50"
                  : "border-primary/30",
              )}
            >
              <div className="relative aspect-square w-full bg-muted">
                {img.thumbnail ? (
                  <img
                    src={img.thumbnail}
                    alt=""
                    loading="lazy"
                    className={cn(
                      "h-full w-full object-cover transition-all",
                      detached && "grayscale",
                    )}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Sparkles className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onToggleDetach(img.id)}
                  aria-label={detached ? `Re-attach ${img.label}` : `Detach ${img.label}`}
                  title={detached ? "Re-attach" : "Detach"}
                  className={cn(
                    "absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full text-card transition-all",
                    detached
                      ? "bg-foreground/40 hover:bg-foreground/60"
                      : "bg-foreground/70 hover:bg-foreground opacity-0 group-hover:opacity-100",
                  )}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <p className="truncate px-1.5 py-1 text-[10px] text-muted-foreground">
                {img.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
