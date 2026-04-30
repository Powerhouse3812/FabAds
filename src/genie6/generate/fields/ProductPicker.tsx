import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraft } from "../../stores/draftStore";
import { productsForBrand } from "../../mocks/products";

/**
 * ProductPicker — horizontal-scroll strip of product cards (iter-5 O-5).
 *
 * Was: 2-col grid that grew vertically. Now: snap-to-card row that stays a
 * fixed height regardless of product count. Multi-select supported (selected
 * cards highlight + check overlay).
 *
 * Hidden until a brand is selected.
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
    <div className="space-y-2">
      <label className="text-g6-sm font-medium text-g6-text">
        Product(s){" "}
        {draft.productIds.length > 0 && (
          <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">
            ({draft.productIds.length} selected)
          </span>
        )}
      </label>
      <div className="scrollbar-none -mx-1 flex w-full snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1">
        {list.map((p) => {
          const selected = draft.productIds.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => dispatch({ type: "TOGGLE_PRODUCT", productId: p.id })}
              className={cn(
                "g6-lift relative flex w-[156px] shrink-0 snap-start gap-2 rounded-g6-base p-2.5 text-left transition-all",
                selected
                  ? "border border-g6-primary bg-g6-primary-bg ring-1 ring-g6-primary/30"
                  : "border border-g6-border-secondary bg-g6-bg-container hover:border-g6-border"
              )}
            >
              {selected && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-g6-primary text-g6-text-on-accent">
                  <Check className="h-2.5 w-2.5" />
                </span>
              )}

              {p.thumbnail ? (
                <img
                  src={p.thumbnail}
                  alt={p.name}
                  className="h-12 w-12 shrink-0 rounded bg-g6-bg-spotlight object-cover"
                />
              ) : (
                <div className="h-12 w-12 shrink-0 rounded bg-g6-bg-spotlight" />
              )}

              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="truncate text-g6-sm font-semibold text-g6-text">
                  {p.name}
                </p>
                {p.price && (
                  <p className="font-g6-mono text-[10px] text-g6-text-tertiary">
                    {p.price}
                  </p>
                )}
                {p.promo && (
                  <span className="inline-flex items-center rounded-g6-pill border border-g6-border-secondary bg-g6-bg-base px-1.5 py-0 text-[9px] font-medium text-g6-text-secondary">
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
          onClick={() =>
            window.location.assign(`/iq/genie6/settings/brands/${draft.brandId}`)
          }
          className="flex w-[88px] shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-g6-base border-2 border-dashed border-g6-border-secondary bg-transparent p-2.5 text-g6-text-tertiary transition-colors hover:border-g6-border hover:text-g6-text"
        >
          <Plus className="h-4 w-4" />
          <span className="text-g6-xs font-medium">Add</span>
        </button>
      </div>
    </div>
  );
}
