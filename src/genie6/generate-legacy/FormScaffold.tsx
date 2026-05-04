import { useEffect, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useGenie6Theme } from "../hooks/useGenie6Theme";
import { StudioGenerateForm } from "../variants/studio/StudioGenerateForm";
import { CanvasGenerateForm } from "../variants/canvas/CanvasGenerateForm";
import { CommandGenerateForm } from "../variants/command/CommandGenerateForm";
import { ModularGenerateForm } from "../variants/modular/ModularGenerateForm";
import { products as allProducts, brands as allBrands } from "@/mocks/shared";
import { smartModeDefault } from "./utils/smartModeDefault";
import { modeConfigs } from "./modeConfigs";
import { useDraft } from "../stores/draftStore";
import type { ModeId } from "../types/output";
import { MicroMotif } from "../components/MicroMotif";
import { cn } from "@/lib/utils";
import { Sparkles, X } from "lucide-react";

/**
 * FormScaffold — Generate flow entry (A-10.23).
 *
 * History:
 *   A-10.1 — required productId via URL; landed on form only after a separate
 *            ProductPicker screen. Bad URL bounced back to picker.
 *   A-10.22 — added Esc-to-back, smart-default badge, clickable brand+product
 *             chips that returned to the picker.
 *   A-10.23 — picker screen REMOVED (per Maalik). /iq/genie6/generate now
 *             lands directly on the form. Productless rendering supported —
 *             the form's own brand-picker / product-picker FIELDS handle
 *             selection inline. Catalogue's "Generate" CTA still deep-links
 *             via /generate/product/:productId; on those entries the brand +
 *             product chips render in the header for context, with × buttons
 *             to clear the deep-link selection.
 *
 * Mode resolution:
 *   ?mode= search param  →  used as-is (user override)
 *   else if product set  →  smartModeDefault(brand, product)
 *   else                 →  "brand-ad" fallback
 *
 * When a product comes via deep-link, FormScaffold seeds the draft store
 * (SET_BRAND) so the variant form's brand-picker field shows the active
 * brand without having to read URL params separately.
 */
export function FormScaffold() {
  const { variant } = useGenie6Theme();
  const { productId } = useParams<{ productId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { dispatch } = useDraft();

  const product = useMemo(
    () => (productId ? allProducts.find((p) => p.id === productId) : undefined),
    [productId]
  );
  const brand = useMemo(
    () => (product ? allBrands.find((b) => b.id === product.brandId) : undefined),
    [product]
  );

  // Seed draft store when a deep-link sets the product. Lets the form's
  // inline brand-picker / product-picker fields show the pre-selected
  // brand+product without re-reading URL params themselves.
  useEffect(() => {
    if (!product) return;
    dispatch({ type: "SET_BRAND", brandId: product.brandId });
    dispatch({ type: "TOGGLE_PRODUCT", productId: product.id });
    // We intentionally only seed once on URL change — toggle behaviour after
    // mount is owned by the inline fields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  // Mode resolution: ?mode= param > smart default > "brand-ad" final fallback.
  const modeParam = searchParams.get("mode") as ModeId | null;
  const defaultedMode = useMemo<ModeId>(
    () => (product ? smartModeDefault(brand, product) : "brand-ad"),
    [brand, product]
  );
  const mode: ModeId = modeParam ?? defaultedMode;
  const isSmartDefault = !modeParam && !!product; // smart-default only meaningful when product is set

  const onChangeMode = (next: ModeId) => {
    const sp = new URLSearchParams(searchParams);
    sp.set("mode", next);
    setSearchParams(sp, { replace: true });
  };

  const clearProductDeepLink = () => {
    // Drops the URL productId, lands on the productless form. The form's
    // inline pickers take over.
    navigate("/iq/genie6/generate", { replace: true });
  };

  const activeModeLabel = modeConfigs.find((c) => c.id === mode)?.label ?? mode;

  return (
    <div className="flex h-full flex-col">
      {/* Top strip: deep-link chips (only when product is pre-selected) + mode switcher.
          A-10.23: with the picker screen gone, the chips serve as a "this came
          from a deep-link, click × to free the form" affordance — not as a
          back-button. When no product is set, the chips disappear entirely
          and the user picks brand+product inside the form fields. */}
      <header className="shrink-0 flex items-center gap-3 border-b border-g6-border-secondary bg-g6-bg-base px-4 py-2">
        {product && (
          <>
            <div className="flex items-center gap-1 text-g6-xs">
              <span className="inline-flex items-center gap-1.5 rounded-g6-base px-1.5 py-0.5 bg-g6-bg-spotlight">
                {brand?.logo && <img src={brand.logo} alt="" className="h-4 w-4 rounded-sm" />}
                <span className="text-g6-text-secondary">{brand?.name}</span>
              </span>
              <span className="text-g6-text-tertiary">/</span>
              <span className="inline-flex items-center rounded-g6-base px-1.5 py-0.5 bg-g6-bg-spotlight">
                <span className="text-g6-text font-medium truncate max-w-[260px]">{product.name}</span>
              </span>
              <button
                type="button"
                onClick={clearProductDeepLink}
                aria-label="Clear pre-selected product"
                title="Clear pre-selected product · the form will let you pick again"
                className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-g6-base text-g6-text-tertiary hover:text-g6-text hover:bg-g6-bg-spotlight transition-colors outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            {isSmartDefault && (
              <span
                title="Smart default — picked based on this product. Click another mode to override."
                className="inline-flex items-center gap-1 rounded-full border border-g6-border-secondary bg-g6-bg-container px-2 py-0.5 text-[10px] font-medium text-g6-text-secondary"
              >
                <Sparkles className="h-2.5 w-2.5" />
                <span className="font-g6-mono uppercase tracking-wider">Smart: {activeModeLabel}</span>
              </span>
            )}
          </>
        )}
        {!product && (
          <span className="text-g6-xs text-g6-text-tertiary">
            Pick a brand + product below to start.
          </span>
        )}
        <div className="flex-1" />
        <ModeSwitcherChips mode={mode} onChange={onChangeMode} />
      </header>

      {/* Variant-specific form body */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {variant === "canvas" && <CanvasGenerateForm mode={mode} />}
        {variant === "command" && <CommandGenerateForm mode={mode} />}
        {variant === "modular" && <ModularGenerateForm mode={mode} />}
        {(variant === "studio" || (variant !== "canvas" && variant !== "command" && variant !== "modular")) && (
          <StudioGenerateForm mode={mode} />
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 *  ModeSwitcherChips — inline mode picker at top of form.
 *  Compact, scrollable on narrow viewports.
 *
 *  A-10.16:
 *    - Active state used to be color-only (bg-g6-primary fill). Audit P0-3
 *      flagged WCAG 1.4.1 (Use of Color) — colorblind / glare-condition users
 *      couldn't tell which mode was selected, would generate the wrong
 *      pipeline + waste a credit.
 *    - Now: two-tone pill ("bullseye"). Lime fill + 1.5px lime ring with a
 *      2px white gap = distinct SHAPE, not just color. Active label also
 *      bolds (font-medium) — second non-color cue.
 *    - Focus-visible ring is foreground/40 with 1px offset so keyboard focus
 *      is visible on inactive chips without competing with the active ring.
 *    - Tokens rolling-unified: g6-primary → primary, g6-text-on-accent →
 *      primary-foreground, g6-bg-spotlight/text-text-secondary → accent /
 *      muted-foreground, rounded-g6-pill → rounded-full, text-g6-xs → text-xs.
 * ───────────────────────────────────────────────────────── */
function ModeSwitcherChips({
  mode,
  onChange,
}: {
  mode: ModeId;
  onChange: (next: ModeId) => void;
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {modeConfigs.map((cfg) => {
        const active = cfg.id === mode;
        return (
          <button
            key={cfg.id}
            type="button"
            onClick={() => onChange(cfg.id)}
            title={cfg.description ?? cfg.label}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs whitespace-nowrap transition-all",
              "outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              active
                ? "bg-primary text-primary-foreground ring-[1.5px] ring-primary ring-offset-2 ring-offset-background shadow-sm font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <MicroMotif mode={cfg.id} size={12} />
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}
