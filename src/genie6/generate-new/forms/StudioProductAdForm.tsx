import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { brands as allBrands, products as allProducts } from "@/mocks/shared";
import { PromptBar, type PromptBarReference, type PromptBarChip, type PromptBarModel, type PromptBarContextChip } from "@/components/PromptBar";
import { cn } from "@/lib/utils";
import { FormSkeleton } from "../FormSkeleton";
import { AdvancedDrawer } from "../AdvancedDrawer";
import { AISuggestionsDrawer } from "../AISuggestionsDrawer";
import { ReferencesSection } from "../ReferencesSection";
import { IndustryInsightsAnchor } from "../IndustryInsightsAnchor";
import { BrandPill } from "../fields/BrandPill";
import { ProductMultiPicker } from "../fields/ProductMultiPicker";
import { OutputChip } from "../fields/OutputChip";
import { FormatToggle, type FormatOption } from "../fields/FormatToggle";
import { PresetBadge, type PresetMarker } from "../fields/PresetBadge";
import { StatusReadout, type StatusItem } from "../fields/StatusReadout";
import { SavedTemplatesStrip } from "../sections/SavedTemplatesStrip";
import { VideoProductionSection } from "../sections/VideoProductionSection";
import {
  CommonAdvancedFields,
  DEFAULT_COMMON_ADVANCED,
  type CommonAdvancedState,
} from "../sections/CommonAdvancedFields";
import {
  ProductAdAdvancedFields,
  DEFAULT_PRODUCT_AD_ADVANCED,
  type ProductAdAdvancedState,
} from "../sections/ProductAdAdvancedFields";
import type { OutputType, ImageFormat } from "../types";

/**
 * StudioProductAdForm — second New Studio Type form (A-11.5).
 *
 * Spec source: Genie_6.0_Form_Specs.md §2.
 *
 * Differences from Brand Ad:
 *   - Top sticky adds Product picker (multi-select) + "Hide brand identity"
 *     toggle for affiliate-style anonymous Product Ads.
 *   - Output chip adds 4th option: Product Shoot/Staging.
 *   - Format toggle: adds Catalogue (greyed if <2 products) + Collection
 *     (greyed if <2 products); LP-derived NOT exposed here (Affiliate Ad
 *     only).
 *   - Form body adds "Product visuals from Brand profile" strip (between
 *     Saved Templates and References) — placeholder block for now.
 *   - Advanced drawer adds Product-specific: Price emphasis / Promo overlay /
 *     USP focus.
 *
 * Pre-fill matrix (Form Specs §2):
 *   - Default → Type=Product Ad, Output=Whole Adcopy, last-used product
 *     pre-filled (recency, NOT top-seller).
 *   - From Catalogue's "Generate ad" CTA → ?product=:id pre-fills both
 *     Product and Brand (derived via product.brandId).
 *   - From Product Shoot preset → ?output=product-shoot&preset=shoot
 *     auto-applies the staging preset.
 */

const IMAGE_FORMAT_OPTIONS_BASE: FormatOption[] = [
  { id: "static", label: "Static" },
  { id: "carousel", label: "Carousel" },
  { id: "catalogue", label: "Catalogue" },
  { id: "collection", label: "Collection" },
  { id: "motion", label: "Motion" },
];

const MOCK_MODELS_IMAGE: PromptBarModel[] = [
  { id: "ideogram-2", label: "Ideogram 2", tag: "balanced", costPerUnit: 1 },
  { id: "flux-pro", label: "Flux Pro", tag: "high quality", costPerUnit: 2 },
  { id: "sd-xl-fast", label: "SD-XL Fast", tag: "fast", costPerUnit: 1 },
];
const MOCK_MODELS_VIDEO: PromptBarModel[] = [
  { id: "kling-1.5", label: "Kling 1.5", tag: "balanced", costPerUnit: 6 },
  { id: "veo-2", label: "Veo 2", tag: "high quality", costPerUnit: 10 },
];
const MOCK_MODELS_TEXT: PromptBarModel[] = [
  { id: "claude-sonnet", label: "Claude Sonnet", tag: "balanced", costPerUnit: 1 },
  { id: "gpt-4o", label: "GPT-4o", tag: "balanced", costPerUnit: 1 },
];
const MOCK_MODELS_SHOOT: PromptBarModel[] = [
  { id: "shoot-staging", label: "Staging Pipeline", tag: "preset", costPerUnit: 2 },
  { id: "ideogram-2", label: "Ideogram 2", tag: "fallback", costPerUnit: 1 },
];

const TRY_CHIPS: PromptBarChip[] = [
  { label: "Lifestyle scene", insert: "in a lifestyle setting, natural light" },
  { label: "Hero shot", insert: "hero shot, clean studio background" },
  { label: "FOMO offer", insert: "with a Limited-stock FOMO badge overlay" },
];

export function StudioProductAdForm() {
  const [searchParams] = useSearchParams();

  // ───────────── Pre-fill from URL ─────────────
  const initialProductId = searchParams.get("product");
  const initialProduct = initialProductId
    ? allProducts.find((p) => p.id === initialProductId)
    : undefined;
  const initialBrandId = initialProduct?.brandId ?? searchParams.get("brand");
  // A-11.10: Output unset by default — only pre-filled when an outside-Studio
  // entry point (Catalogue / Workspace / Dashboard / Gate preset) supplied it.
  const outputParam = searchParams.get("output") as OutputType | null;
  const presetParam = searchParams.get("preset");
  const isShootPreset = presetParam === "shoot";
  const isUgcPreset = presetParam === "ugc-video";
  const presetMarker: PresetMarker | null = isShootPreset ? "shoot" : isUgcPreset ? "ugc-video" : null;

  // ───────────── Top sticky state ─────────────
  const [brandId, setBrandId] = useState<string | null>(initialBrandId ?? null);
  const [productIds, setProductIds] = useState<string[]>(
    initialProduct ? [initialProduct.id] : [],
  );
  const [output, setOutput] = useState<OutputType | null>(outputParam);
  const [imageFormat, setImageFormat] = useState<ImageFormat>("static");
  const [hideBrandIdentity, setHideBrandIdentity] = useState(false);

  // ───────────── Body state ─────────────
  const [references, setReferences] = useState<PromptBarReference[]>([]);
  const [advanced, setAdvanced] = useState<CommonAdvancedState>(DEFAULT_COMMON_ADVANCED);
  const [productAdvanced, setProductAdvanced] = useState<ProductAdAdvancedState>(
    isShootPreset
      ? {
          ...DEFAULT_PRODUCT_AD_ADVANCED,
          // Studio shoot defaults: lifestyle bg, no overlay text, clean staging
          priceEmphasis: "hide",
          promoOverlay: [],
        }
      : DEFAULT_PRODUCT_AD_ADVANCED,
  );

  // ───────────── PromptBar state ─────────────
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(4);

  const models = useMemo(() => {
    if (output === "product-shoot") return MOCK_MODELS_SHOOT;
    switch (output) {
      case "image":
        return MOCK_MODELS_IMAGE;
      case "video":
        return MOCK_MODELS_VIDEO;
      case "whole-adcopy":
        return MOCK_MODELS_TEXT;
      default:
        return [] as PromptBarModel[];
    }
  }, [output]);

  const [modelId, setModelId] = useState<string | undefined>(undefined);
  // Pin a default model when Output is set / changes.
  useEffect(() => {
    if (models.length > 0 && (!modelId || !models.find((m) => m.id === modelId))) {
      setModelId(models[0].id);
    }
  }, [models, modelId]);

  // ───────────── Derived ─────────────
  const brand = brandId ? allBrands.find((b) => b.id === brandId) : undefined;
  const showVideoSection = output === "video";

  // Format options — Catalogue/Collection greyed if <2 products selected
  const formatOptions: FormatOption[] = IMAGE_FORMAT_OPTIONS_BASE.map((opt) => {
    if (opt.id === "catalogue" || opt.id === "collection") {
      return {
        ...opt,
        disabled: productIds.length < 2,
        disabledReason: "Add 2+ products to enable",
      };
    }
    return opt;
  });

  const contextChips: PromptBarContextChip[] = [
    { label: "Product Ad", tone: "active" as const },
    ...(brand
      ? [{
          label: brand.name,
          logo: brand.logo,
          onClear: () => {
            setBrandId(null);
            setProductIds([]);
          },
        }]
      : []),
    ...(productIds.length > 0
      ? [{
          label: `${productIds.length} product${productIds.length === 1 ? "" : "s"}`,
        }]
      : []),
  ];

  const onGenerate = (testFirst: boolean) => {
    const summary = {
      type: "product-ad",
      brand: brand?.name ?? "(none)",
      products: productIds,
      output,
      imageFormat: output === "image" ? imageFormat : undefined,
      hideBrandIdentity,
      shootPreset: isShootPreset,
      count: testFirst ? Math.min(4, count) : count,
      model: modelId,
      prompt,
      advanced,
      productAdvanced,
      refs: references.length,
    };
    // eslint-disable-next-line no-console
    console.log("[Product Ad — mock generate]", summary);
    alert(
      `Mock generation queued.\n\n${JSON.stringify(summary, null, 2)}`,
    );
  };

  const canGenerate = !!brandId && productIds.length > 0 && !!output;

  // ───────────── Render ─────────────
  const statusItems: StatusItem[] = [
    { label: brand ? `Brand · ${brand.name}` : "Brand · pick", state: brand ? "ok" : "missing" },
    {
      label: productIds.length > 0
        ? `${productIds.length} product${productIds.length === 1 ? "" : "s"}`
        : "Products · pick",
      state: productIds.length > 0 ? "ok" : "missing",
    },
    { label: output ? `Output · ${output}` : "Output · pick", state: output ? "ok" : "missing" },
    ...(output === "image" ? [{ label: `Format · ${imageFormat}`, state: "info" as const }] : []),
    { label: `${count} variant${count === 1 ? "" : "s"}`, state: "info" },
  ];

  return (
    <FormSkeleton
      eyebrow="Studio · Product Ad"
      title="Sell a specific product with brand context"
      sub="Pick brand + products, choose output, generate. Catalogue/Collection unlock when 2+ products are selected."
      top={
        <div className="space-y-2">
          {/* Tier 1 — Brand + Product (REQUIRED) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Brand ·
            </span>
            <BrandPill value={brandId} onChange={(b) => {
              setBrandId(b);
              if (b !== brandId) setProductIds([]);
            }} required />
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Products ·
            </span>
            <ProductMultiPicker
              value={productIds}
              onChange={setProductIds}
              brandIdFilter={brandId}
            />
            <button
              type="button"
              onClick={() => setHideBrandIdentity((v) => !v)}
              aria-pressed={hideBrandIdentity}
              title="For affiliate-style anonymous Product Ads"
              className={cn(
                "ml-auto inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition-colors",
                "outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-1",
                hideBrandIdentity
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
              )}
            >
              {hideBrandIdentity ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              Hide brand identity
            </button>
            {presetMarker && <PresetBadge preset={presetMarker} />}
          </div>
          {/* Tier 2 — Output + Format */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Output ·
            </span>
            <OutputChip
              value={output}
              onChange={setOutput}
              options={["image", "video", "whole-adcopy", "product-shoot"]}
              placeholder="Pick output"
            />
            {output === "image" && (
              <>
                <span className="text-muted-foreground/40 mx-0.5">·</span>
                <FormatToggle
                  value={imageFormat}
                  onChange={setImageFormat}
                  options={formatOptions}
                />
              </>
            )}
          </div>
        </div>
      }
      status={<StatusReadout items={statusItems} />}
      body={
        <>
          <SavedTemplatesStrip />
          <ProductVisualsStrip productIds={productIds} />
          {showVideoSection && <VideoProductionSection />}
          <ReferencesSection
            references={references}
            onAddReference={(r) => setReferences([...references, r])}
            onRemoveReference={(i) => setReferences(references.filter((_, idx) => idx !== i))}
          />
          <AdvancedDrawer label="Advanced settings">
            <IndustryInsightsAnchor
              filter={brand ? { kind: "brand", brandId: brand.id } : undefined}
            />
            <CommonAdvancedFields state={advanced} onChange={setAdvanced} />
            <div className="mt-2 border-t border-border pt-3">
              <p className="mb-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Product Ad-specific
              </p>
              <ProductAdAdvancedFields
                state={productAdvanced}
                onChange={setProductAdvanced}
                brandUsps={brand?.usps}
              />
            </div>
          </AdvancedDrawer>
          <AISuggestionsDrawer
            contextLabel={brand ? `from Industry Insights · ${brand.name}` : "from Industry Insights"}
          />
        </>
      }
      promptBar={
        <PromptBar
          prompt={prompt}
          onPromptChange={setPrompt}
          count={count}
          onCountChange={setCount}
          chips={TRY_CHIPS}
          chipPrefix="Try:"
          chipInsertMode="append"
          models={models}
          selectedModelId={modelId}
          onModelChange={setModelId}
          references={references}
          onAddReference={(r) => setReferences([...references, r])}
          onRemoveReference={(i) => setReferences(references.filter((_, idx) => idx !== i))}
          contextChips={contextChips}
          onGenerate={onGenerate}
          disabled={!canGenerate}
          generateLabel="Generate"
        />
      }
    />
  );
}

/* ─────────────────────────────────────────────────────── */

/**
 * ProductVisualsStrip — Product-Ad-specific strip showing existing product
 * photos as base for generation. Per Form Specs §2 — sits between Saved
 * Templates and References.
 *
 * For Phase B build: pulls product.thumbnail if present; otherwise renders
 * a placeholder. Real Brand-profile photo bank wired in iter-8+.
 */
function ProductVisualsStrip({ productIds }: { productIds: string[] }) {
  if (productIds.length === 0) return null;
  const products = productIds
    .map((id) => allProducts.find((p) => p.id === id))
    .filter(Boolean);

  return (
    <section className="space-y-2">
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Product visuals
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {products.map((p) => (
          <div
            key={p!.id}
            className="shrink-0 w-24 rounded-md border border-border bg-card p-2 text-center"
          >
            {p!.thumbnail ? (
              <img
                src={p!.thumbnail}
                alt={p!.name}
                className="aspect-square w-full rounded-sm object-cover"
              />
            ) : (
              <div className="aspect-square w-full rounded-sm bg-muted flex items-center justify-center">
                <span className="text-[9px] font-mono uppercase text-muted-foreground">no img</span>
              </div>
            )}
            <p className="mt-1 truncate text-[10px] text-foreground">{p!.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
