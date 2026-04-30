import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraft } from "../../stores/draftStore";
import { productsForBrand } from "../../mocks/products";

/**
 * ProductPicker — visual grid of product cards (iter-5 port from Genie 5).
 *
 * Was a vertical list of text rows with name + price. Now: a 2-col grid of
 * product cards with thumbnail + name + price + benefits/promo chip. Multi-
 * select supported (selected cards highlight + check mark overlay).
 *
 * Hidden until a brand is selected (per current behavior).
 */
export function ProductPicker() {
  const { draft, dispatch } = useDraft();
  const list = draft.brandId ? productsForBrand(draft.brandId) : [];

  if (!draft.brandId) {
    return (
      <div className="space-y-2">
        <label className="text-g6-sm font-medium text-g6-text">Product(s)</label>
        <p className="text-g6-sm text-g6-text-tertiary">Select a brand first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="text-g6-sm font-medium text-g6-text">
        Product(s){" "}
        {draft.productIds.length > 0 && (
          <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">
            ({draft.productIds.length} selected)
          </span>
        )}
      </label>
      <div className="grid grid-cols-2 gap-2">
        {list.map((p) => {
          const selected = draft.productIds.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => dispatch({ type: "TOGGLE_PRODUCT", productId: p.id })}
              className={cn(
                "g6-lift relative flex gap-3 rounded-g6-base p-3 text-left transition-all",
                selected
                  ? "border border-g6-primary bg-g6-primary-bg ring-1 ring-g6-primary/30"
                  : "border border-g6-border-secondary bg-g6-bg-container hover:border-g6-border"
              )}
            >
              {selected && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-g6-primary text-g6-text-on-accent">
                  <Check className="h-3 w-3" />
                </span>
              )}

              {/* Thumbnail */}
              {p.thumbnail ? (
                <img
                  src={p.thumbnail}
                  alt={p.name}
                  className="h-14 w-14 shrink-0 rounded bg-g6-bg-spotlight object-cover"
                />
              ) : (
                <div className="h-14 w-14 shrink-0 rounded bg-g6-bg-spotlight" />
              )}

              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-g6-sm font-semibold text-g6-text truncate">{p.name}</p>
                {p.price && (
                  <p className="font-g6-mono text-g6-xs text-g6-text-tertiary">{p.price}</p>
                )}
                {p.promo && (
                  <span className="inline-flex items-center rounded-g6-pill border border-g6-border-secondary bg-g6-bg-base px-1.5 py-0 text-[10px] font-medium text-g6-text-secondary">
                    {p.promo}
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {/* Add product CTA */}
        <button
          type="button"
          onClick={() => window.location.assign(`/iq/genie6/settings/brands/${draft.brandId}`)}
          className="flex items-center justify-center gap-1.5 rounded-g6-base border-2 border-dashed border-g6-border-secondary bg-transparent p-3 text-g6-text-tertiary hover:border-g6-border hover:text-g6-text transition-colors min-h-[80px]"
        >
          <Plus className="h-4 w-4" />
          <span className="text-g6-xs font-medium">Add product</span>
        </button>
      </div>
    </div>
  );
}
