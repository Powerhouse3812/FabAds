import { useEffect, useMemo } from "react";
import { useParams, useSearchParams, useNavigate, Navigate } from "react-router-dom";
import { useGenie6Theme } from "../hooks/useGenie6Theme";
import { StudioGenerateForm } from "../variants/studio/StudioGenerateForm";
import { CanvasGenerateForm } from "../variants/canvas/CanvasGenerateForm";
import { CommandGenerateForm } from "../variants/command/CommandGenerateForm";
import { ModularGenerateForm } from "../variants/modular/ModularGenerateForm";
import { products as allProducts, brands as allBrands } from "@/mocks/shared";
import { smartModeDefault } from "./utils/smartModeDefault";
import { modeConfigs } from "./modeConfigs";
import type { ModeId } from "../types/output";
import { MicroMotif } from "../components/MicroMotif";
import { cn } from "@/lib/utils";
import { ArrowLeft, Sparkles } from "lucide-react";

/**
 * FormScaffold — A-10.1 single-picker entry.
 *
 * Reads `:productId` from URL params, derives brand via product.brandId.
 * Reads `mode` from `?mode=` search param; defaults to `smartModeDefault(brand, product)`.
 * Renders an inline mode-switcher chip strip at the top so users can swap mode
 * without leaving the form.
 *
 * Variant-aware: routes the actual form rendering to the matching Genie variant
 * implementation (Studio/Canvas/Command/Modular). Each variant form accepts
 * `mode` and `product` as props (pre-A-10.1 they read mode from `:mode` URL param).
 */
export function FormScaffold() {
  const { variant } = useGenie6Theme();
  const { productId } = useParams<{ productId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const product = useMemo(
    () => (productId ? allProducts.find((p) => p.id === productId) : undefined),
    [productId]
  );
  const brand = useMemo(
    () => (product ? allBrands.find((b) => b.id === product.brandId) : undefined),
    [product]
  );

  // Mode resolution: ?mode= param > smart default > "brand-ad" final fallback.
  const modeParam = searchParams.get("mode") as ModeId | null;
  const defaultedMode = useMemo<ModeId>(
    () => (product ? smartModeDefault(brand, product) : "brand-ad"),
    [brand, product]
  );
  const mode: ModeId = modeParam ?? defaultedMode;
  const isSmartDefault = !modeParam; // user hasn't overridden yet
  // Phase E: Esc-to-back keyboard shortcut. Standard "back to context"
  // pattern (Linear, Notion, Figma) — Esc on a leaf returns to its parent.
  useEffect(() => {
    if (!product) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.altKey && !e.ctrlKey && !e.metaKey) {
        // Don't hijack Esc when an input/textarea/contenteditable has focus.
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target?.isContentEditable
        ) return;
        navigate(`/iq/genie6/generate?brand=${product.brandId}`);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [product, navigate]);

  // Bad URL: no product or product not found → bounce back to picker
  if (!productId || !product) {
    return <Navigate to="/iq/genie6/generate" replace />;
  }

  const onChangeMode = (next: ModeId) => {
    const sp = new URLSearchParams(searchParams);
    sp.set("mode", next);
    setSearchParams(sp, { replace: true });
  };

  const onBackToPicker = () => {
    navigate(`/iq/genie6/generate?brand=${product.brandId}`);
  };

  const onClickBrandChip = () => {
    // Brand chip → picker pre-filtered to this brand (drops the search if any).
    navigate(`/iq/genie6/generate?brand=${product.brandId}`);
  };

  const onClickProductChip = () => {
    // Product chip → picker (no filter pre-applied so the user can pick a
    // different product easily). Uses the brand filter so context is preserved.
    navigate(`/iq/genie6/generate?brand=${product.brandId}`);
  };

  const activeModeLabel = modeConfigs.find((c) => c.id === mode)?.label ?? mode;

  return (
    <div className="flex h-full flex-col">
      {/* Top strip: back link + brand/product chips + mode switcher.
          Phase E (A-10.22) polish:
          - Brand + product chips are now clickable buttons that route back
            to the picker with brand context preserved.
          - Smart-default mode shows a Sparkles badge so the user understands
            why a specific mode is highlighted (and that they can change it).
          - Esc keyboard shortcut → back to picker (skipped when an input is
            focused so it doesn't hijack form typing).
          - aria-labels on every interactive element. */}
      <header className="shrink-0 flex items-center gap-3 border-b border-g6-border-secondary bg-g6-bg-base px-4 py-2">
        <button
          type="button"
          onClick={onBackToPicker}
          aria-label="Back to product picker (Esc)"
          title="Back to product picker · Esc"
          className="inline-flex items-center gap-1 text-g6-xs text-g6-text-tertiary hover:text-g6-text transition-colors outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:rounded"
        >
          <ArrowLeft className="h-3 w-3" /> Back
        </button>
        <div className="flex items-center gap-1 text-g6-xs">
          <button
            type="button"
            onClick={onClickBrandChip}
            aria-label={`Switch brand from ${brand?.name ?? "this"}`}
            title={`Switch brand from ${brand?.name ?? "this"}`}
            className="inline-flex items-center gap-1.5 rounded-g6-base px-1.5 py-0.5 hover:bg-g6-bg-spotlight transition-colors outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
          >
            {brand?.logo && <img src={brand.logo} alt="" className="h-4 w-4 rounded-sm" />}
            <span className="text-g6-text-secondary">{brand?.name}</span>
          </button>
          <span className="text-g6-text-tertiary">/</span>
          <button
            type="button"
            onClick={onClickProductChip}
            aria-label={`Change product from ${product.name}`}
            title={`Change product · current: ${product.name}`}
            className="inline-flex items-center rounded-g6-base px-1.5 py-0.5 hover:bg-g6-bg-spotlight transition-colors outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
          >
            <span className="text-g6-text font-medium truncate max-w-[260px]">{product.name}</span>
          </button>
        </div>
        {isSmartDefault && (
          <span
            title={`Smart default — picked based on this product. Click another mode to override.`}
            className="inline-flex items-center gap-1 rounded-full border border-g6-border-secondary bg-g6-bg-container px-2 py-0.5 text-[10px] font-medium text-g6-text-secondary"
          >
            <Sparkles className="h-2.5 w-2.5" />
            <span className="font-g6-mono uppercase tracking-wider">Smart: {activeModeLabel}</span>
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
