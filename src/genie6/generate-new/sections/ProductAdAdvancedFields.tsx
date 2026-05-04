import { cn } from "@/lib/utils";

/**
 * ProductAdAdvancedFields — Product-Ad-specific Advanced fields per
 * Form Specs §2.
 *
 * Sits below CommonAdvancedFields in the Advanced drawer. Adds:
 *   - Price emphasis (Show / Hide / FOMO badge)
 *   - Promo overlay (Sale % / Free shipping / Limited stock — multi-select)
 *   - USP focus picker (single-select from Brand profile USPs)
 */

const PRICE_EMPHASIS_OPTIONS = [
  { id: "show", label: "Show" },
  { id: "hide", label: "Hide" },
  { id: "fomo-badge", label: "FOMO badge" },
] as const;
const PROMO_OVERLAY_OPTIONS = [
  { id: "sale-pct", label: "Sale %" },
  { id: "free-shipping", label: "Free shipping" },
  { id: "limited-stock", label: "Limited stock" },
] as const;

export type PriceEmphasis = typeof PRICE_EMPHASIS_OPTIONS[number]["id"];
export type PromoOverlay = typeof PROMO_OVERLAY_OPTIONS[number]["id"];

export interface ProductAdAdvancedState {
  priceEmphasis: PriceEmphasis;
  promoOverlay: PromoOverlay[];
  uspFocus?: string;
}

export interface ProductAdAdvancedFieldsProps {
  state: ProductAdAdvancedState;
  onChange: (next: ProductAdAdvancedState) => void;
  /** USPs sourced from Brand profile (e.g. ["onion oil", "no SLS", "vegan"]). */
  brandUsps?: string[];
}

export function ProductAdAdvancedFields({
  state,
  onChange,
  brandUsps = [],
}: ProductAdAdvancedFieldsProps) {
  const set = <K extends keyof ProductAdAdvancedState>(k: K, v: ProductAdAdvancedState[K]) => {
    onChange({ ...state, [k]: v });
  };

  const togglePromo = (id: PromoOverlay) => {
    set(
      "promoOverlay",
      state.promoOverlay.includes(id)
        ? state.promoOverlay.filter((x) => x !== id)
        : [...state.promoOverlay, id],
    );
  };

  return (
    <div className="space-y-3">
      {/* Price emphasis — single select */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium text-foreground">Price emphasis</p>
        <div className="flex flex-wrap items-center gap-1">
          {PRICE_EMPHASIS_OPTIONS.map((o) => {
            const active = state.priceEmphasis === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => set("priceEmphasis", o.id)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] transition-colors",
                  active
                    ? "bg-primary text-primary-foreground font-medium"
                    : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Promo overlay — multi-select */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium text-foreground">Promo overlay</p>
        <p className="text-[10px] text-muted-foreground">Select all that apply</p>
        <div className="flex flex-wrap items-center gap-1">
          {PROMO_OVERLAY_OPTIONS.map((o) => {
            const active = state.promoOverlay.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => togglePromo(o.id)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] transition-colors",
                  active
                    ? "border-primary/40 bg-primary/10 text-foreground font-medium"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* USP focus picker — sourced from Brand profile if available */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium text-foreground">USP focus</p>
        <p className="text-[10px] text-muted-foreground">
          {brandUsps.length > 0
            ? "Pick from this brand's USPs (one per generation)."
            : "Pick a brand to see its USPs, or type a custom one."}
        </p>
        {brandUsps.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1">
            {brandUsps.map((u) => {
              const active = state.uspFocus === u;
              return (
                <button
                  key={u}
                  type="button"
                  onClick={() => set("uspFocus", active ? undefined : u)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] transition-colors",
                    active
                      ? "bg-primary text-primary-foreground font-medium"
                      : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {u}
                </button>
              );
            })}
          </div>
        ) : (
          <input
            type="text"
            value={state.uspFocus ?? ""}
            onChange={(e) => set("uspFocus", e.target.value || undefined)}
            placeholder="e.g. clinically tested · made in India · sulphate-free"
            className="block h-9 w-full rounded-md border border-border bg-card px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none"
          />
        )}
      </div>
    </div>
  );
}

export const DEFAULT_PRODUCT_AD_ADVANCED: ProductAdAdvancedState = {
  priceEmphasis: "show",
  promoOverlay: [],
  uspFocus: undefined,
};
