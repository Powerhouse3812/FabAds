import { Box, Check, ChevronDown, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { products as allProducts } from "@/mocks/shared";

/**
 * ProductImageryRow — A-11.23.
 *
 * Per Maalik: "Include product imagery ko Product selection ke saath hi
 * fit krenge, because us se related field hai ye." Lives directly under
 * the product strip in setup, NOT inside References.
 *
 * UX:
 *   - Compact toggle row · "Auto-attach product imagery · 3 attached · Manage ▾"
 *   - Click "Manage" → popover with thumbnails of the auto-attached photos.
 *     User can detach individual ones. Detach state is keyed by image id
 *     and persists per product (parent owns).
 */

export interface AutoProductImage {
  id: string;
  label: string;
  thumbnail?: string;
}

export interface ProductImageryRowProps {
  productId: string | null;
  enabled: boolean;
  onToggle: (next: boolean) => void;
  /** IDs of detached images (won't be sent to generation). Parent state. */
  detachedIds: string[];
  onToggleDetach: (id: string) => void;
  /**
   * Visual variant.
   *   - "card" (default) — full-width bordered row with bg-tint. Use when
   *     the row sits as its own block.
   *   - "inline" — border-less, padding-less, fits next to other inline
   *     controls (e.g. on the Brand identity row).
   */
  variant?: "card" | "inline";
}

/**
 * Synthesize the auto-attached image set for a given product. In the real
 * backend this comes from the brand asset library + URL-fetch results.
 */
export function deriveProductImagery(productId: string | null): AutoProductImage[] {
  if (!productId) return [];
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return [];
  return [
    { id: `${product.id}-main`, label: "Main", thumbnail: product.thumbnail },
    { id: `${product.id}-lifestyle`, label: "Lifestyle", thumbnail: product.thumbnail },
    { id: `${product.id}-detail`, label: "Detail shot", thumbnail: product.thumbnail },
  ];
}

export function ProductImageryRow({
  productId,
  enabled,
  onToggle,
  detachedIds,
  onToggleDetach,
  variant = "card",
}: ProductImageryRowProps) {
  const imagery = deriveProductImagery(productId);
  const attachedCount = imagery.filter((i) => !detachedIds.includes(i.id)).length;
  const hasProduct = !!productId;
  const inline = variant === "inline";

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 transition-colors",
        inline
          ? "px-0 py-0"
          : cn(
              "rounded-lg border px-3 py-2",
              enabled && hasProduct
                ? "border-primary/30 bg-primary/5"
                : "border-border/60 bg-muted/30",
            ),
      )}
    >
      {/* Toggle */}
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onToggle(!enabled)}
        disabled={!hasProduct}
        className={cn(
          "relative shrink-0 h-5 w-9 rounded-full transition-colors",
          "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          enabled && hasProduct ? "bg-primary" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-card shadow transition-transform",
            enabled && hasProduct && "translate-x-4",
          )}
        />
      </button>

      <div className="min-w-0 flex-1 flex items-baseline gap-2">
        <Box className="h-3 w-3 text-muted-foreground shrink-0" />
        <p className="text-xs font-medium text-foreground">
          Auto-attach product imagery
        </p>
        {hasProduct && enabled && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            · {attachedCount}/{imagery.length} attached
          </span>
        )}
        {!hasProduct && (
          <span className="text-[10px] text-muted-foreground/80 italic">
            · pick a product first
          </span>
        )}
      </div>

      {/* Manage popover — only visible when toggle ON + has imagery */}
      {hasProduct && enabled && imagery.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "shrink-0 inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground transition-colors",
                "hover:border-primary/40 hover:text-foreground",
              )}
            >
              Manage
              <ChevronDown className="h-3 w-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" className="w-72 p-2">
            <p className="px-1 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              {attachedCount}/{imagery.length} attached · click X to detach
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {imagery.map((img) => {
                const detached = detachedIds.includes(img.id);
                return (
                  <div
                    key={img.id}
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-md border bg-card transition-all",
                      detached
                        ? "border-dashed border-border opacity-50"
                        : "border-primary/40",
                    )}
                  >
                    {img.thumbnail ? (
                      <img
                        src={img.thumbnail}
                        alt=""
                        loading="lazy"
                        className={cn(
                          "h-full w-full object-cover",
                          detached && "grayscale",
                        )}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <ImageIcon className="h-3.5 w-3.5 text-muted-foreground/50" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => onToggleDetach(img.id)}
                      aria-label={detached ? `Re-attach ${img.label}` : `Detach ${img.label}`}
                      title={detached ? "Re-attach" : "Detach"}
                      className={cn(
                        "absolute top-0.5 right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full transition-all",
                        detached
                          ? "bg-foreground/40 text-background hover:bg-primary"
                          : "bg-foreground/70 text-background hover:bg-foreground",
                      )}
                    >
                      {detached ? (
                        <Check className="h-2.5 w-2.5" />
                      ) : (
                        <X className="h-2.5 w-2.5" />
                      )}
                    </button>
                    <p className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-1 pb-0.5 pt-3 text-[8px] font-medium text-white/95">
                      {img.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
