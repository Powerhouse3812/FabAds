import { useDraft } from "../../stores/draftStore";
import { brands } from "../../mocks/brands";

export function BrandPicker() {
  const { draft, dispatch } = useDraft();

  return (
    <div className="space-y-2">
      <label htmlFor="brand-picker" className="text-g6-sm font-medium text-g6-text">
        Brand
      </label>
      <select
        id="brand-picker"
        value={draft.brandId ?? ""}
        onChange={(e) =>
          dispatch({ type: "SET_BRAND", brandId: e.target.value || null })
        }
        className="h-g6-lg w-full rounded-g6-base border border-g6-border bg-g6-bg-container px-3 text-g6-base text-g6-text focus:border-g6-primary focus:outline-none focus:ring-2 focus:ring-g6-primary/20"
      >
        <option value="">Select brand…</option>
        {brands.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </div>
  );
}
