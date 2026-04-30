import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraft } from "../../stores/draftStore";
import { brands } from "../../mocks/brands";

/**
 * BrandPicker — visual grid of brand cards (iter-5 port from Genie 5).
 *
 * Was a vanilla <select> dropdown — boring, text-only, no visual identity.
 * Now: a 3-col grid of brand cards with logo + name + industry + color
 * swatches. Click to select. Selected card gets primary border + check
 * mark overlay. Hover lifts slightly.
 *
 * Brand identity (logo, fonts, colors, voice) is core to ad generation.
 * Surfacing it visually here primes the user that THIS brand's visual
 * system will drive the generation.
 */
export function BrandPicker() {
  const { draft, dispatch } = useDraft();

  return (
    <div className="space-y-3">
      <label className="text-g6-sm font-medium text-g6-text">Brand</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {brands.map((b) => {
          const selected = draft.brandId === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => dispatch({ type: "SET_BRAND", brandId: b.id })}
              className={cn(
                "g6-lift relative flex flex-col items-start gap-2 rounded-g6-base p-3 text-left transition-all",
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

              {/* Logo + colors row */}
              <div className="flex w-full items-start justify-between gap-2">
                {b.logo ? (
                  <img
                    src={b.logo}
                    alt={b.name}
                    className="h-8 w-8 rounded bg-g6-bg-spotlight object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-g6-bg-spotlight font-g6-mono text-g6-sm font-bold text-g6-text-secondary">
                    {b.name[0]}
                  </div>
                )}
                {b.colors && b.colors.length > 0 && (
                  <div className="flex gap-0.5">
                    {b.colors.slice(0, 3).map((c, i) => (
                      <span
                        key={`${b.id}-c-${i}`}
                        className="h-3 w-3 rounded-sm border border-g6-border-secondary"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Name + category */}
              <div className="space-y-0.5 w-full">
                <p className="text-g6-sm font-semibold text-g6-text truncate">{b.name}</p>
                {b.category && (
                  <p className="text-g6-xs text-g6-text-tertiary truncate">{b.category}</p>
                )}
              </div>
            </button>
          );
        })}

        {/* Add brand CTA */}
        <button
          type="button"
          onClick={() => window.location.assign("/iq/genie6/settings/brands")}
          className="flex flex-col items-center justify-center gap-1.5 rounded-g6-base border-2 border-dashed border-g6-border-secondary bg-transparent p-3 text-g6-text-tertiary hover:border-g6-border hover:text-g6-text transition-colors min-h-[88px]"
        >
          <Plus className="h-4 w-4" />
          <span className="text-g6-xs font-medium">Add brand</span>
        </button>
      </div>
    </div>
  );
}
