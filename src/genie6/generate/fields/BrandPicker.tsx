import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraft } from "../../stores/draftStore";
import { brands } from "../../mocks/brands";
import { useUserBrands } from "../../stores/userBrandsStore";
import { BrandLogo } from "../../components/BrandLogo";
import { BrandFetchModal } from "../../components/BrandFetchModal";

/**
 * BrandPicker — horizontal-scroll strip of brand cards (iter-5 O-5+P-1).
 *
 * Snap-to-card row that stays a fixed height regardless of brand count. The
 * "Add" tile now opens the BrandFetchModal inline (URL paste → auto-detect
 * → review → save) instead of navigating away to settings — matches the G5
 * killer UX. New brands auto-select on save.
 *
 * Logo fallback handled by <BrandLogo> (Google s2 favicon → letter mark).
 */
export function BrandPicker() {
  const { draft, dispatch } = useDraft();
  const userBrands = useUserBrands();
  const all = [...userBrands, ...brands];
  const [fetchOpen, setFetchOpen] = useState(false);

  return (
    <div className="space-y-2">
      <label className="text-g6-sm font-medium text-g6-text">Brand</label>
      <div className="scrollbar-none -mx-1 flex w-full snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1">
        {all.map((b) => {
          const selected = draft.brandId === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => dispatch({ type: "SET_BRAND", brandId: b.id })}
              className={cn(
                "g6-lift relative flex w-[132px] shrink-0 snap-start flex-col items-start gap-2 rounded-g6-base p-2.5 text-left transition-all",
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

              <div className="flex w-full items-center justify-between gap-2">
                <BrandLogo
                  name={b.name}
                  src={b.logo}
                  tint={b.colors?.[0]}
                  size="h-8 w-8"
                />
                {b.colors && b.colors.length > 0 && (
                  <div className="flex gap-0.5">
                    {b.colors.slice(0, 3).map((c, i) => (
                      <span
                        key={`${b.id}-c-${i}`}
                        className="h-2.5 w-2.5 rounded-sm border border-g6-border-secondary"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="w-full space-y-0.5">
                <p className="truncate text-g6-sm font-semibold text-g6-text">
                  {b.name}
                </p>
                {b.category && (
                  <p className="truncate text-g6-xs text-g6-text-tertiary">
                    {b.category}
                  </p>
                )}
              </div>
            </button>
          );
        })}

        {/* Add brand → opens BrandFetchModal */}
        <button
          type="button"
          onClick={() => setFetchOpen(true)}
          className="flex w-[88px] shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-g6-base border-2 border-dashed border-g6-border-secondary bg-transparent p-2.5 text-g6-text-tertiary transition-colors hover:border-g6-primary-border hover:text-g6-text"
        >
          <Plus className="h-4 w-4" />
          <span className="text-g6-xs font-medium">Add</span>
          <span className="text-[9px] text-g6-text-tertiary leading-tight text-center">
            paste URL
          </span>
        </button>
      </div>

      <BrandFetchModal
        open={fetchOpen}
        onOpenChange={setFetchOpen}
        onSaved={(brandId) => dispatch({ type: "SET_BRAND", brandId })}
      />
    </div>
  );
}
