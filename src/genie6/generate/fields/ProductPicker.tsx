import { cn } from "@/lib/utils";
import { useDraft } from "../../stores/draftStore";
import { productsForBrand } from "../../mocks/products";

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
          <span className="font-g6-mono text-g6-text-tertiary">
            ({draft.productIds.length} selected)
          </span>
        )}
      </label>
      <div className="flex flex-col gap-1.5">
        {list.map((p) => {
          const selected = draft.productIds.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => dispatch({ type: "TOGGLE_PRODUCT", productId: p.id })}
              className={cn(
                "flex items-center justify-between rounded-g6-base border px-3 py-2 text-left transition-colors",
                selected
                  ? "border-g6-primary bg-g6-primary-bg text-g6-text"
                  : "border-g6-border-secondary bg-g6-bg-container text-g6-text-secondary hover:border-g6-border hover:text-g6-text"
              )}
            >
              <span className="text-g6-sm font-medium">{p.name}</span>
              <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">{p.price}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
