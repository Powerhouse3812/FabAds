import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { brands as allBrands, products as allProducts } from "@/mocks/shared";
import { PromptBar, type PromptBarReference, type PromptBarChip, type PromptBarModel } from "@/components/PromptBar";
import { cn } from "@/lib/utils";
import { FormSkeleton } from "../FormSkeleton";
import { ReferencesSection } from "../ReferencesSection";
import { IndustryInsightsAnchor } from "../IndustryInsightsAnchor";
import { BrandPill } from "../fields/BrandPill";
import { ProductMultiPicker } from "../fields/ProductMultiPicker";
import { OutputChip } from "../fields/OutputChip";
import { FormatToggle, type FormatOption } from "../fields/FormatToggle";
import { PresetBadge, type PresetMarker } from "../fields/PresetBadge";
import { PickerCard, PickerRow } from "../sections/PickerCard";
import { SavedTemplatesStrip } from "../sections/SavedTemplatesStrip";
import { VideoProductionSection } from "../sections/VideoProductionSection";
import { AISuggestionsBanner } from "../sections/AISuggestionsBanner";
import { AdvancedSection, AdvancedFacet } from "../sections/AdvancedSection";
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
 * StudioProductAdForm — Product Ad form (A-11.12 redesign).
 *
 * Spec: Genie_6.0_Form_Specs.md §2.
 * Same A-11.12 layout as Brand Ad: slim header + body sections + glass
 * floating PromptBar.
 *
 * Drop from earlier iteration: ProductVisualsStrip (Maalik feedback —
 * "not needed in form itself").
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
];
const MOCK_MODELS_VIDEO: PromptBarModel[] = [
  { id: "kling-1.5", label: "Kling 1.5", tag: "balanced", costPerUnit: 6 },
  { id: "veo-2", label: "Veo 2", tag: "high quality", costPerUnit: 10 },
];
const MOCK_MODELS_TEXT: PromptBarModel[] = [
  { id: "claude-sonnet", label: "Claude Sonnet", tag: "balanced", costPerUnit: 1 },
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

  const initialProductId = searchParams.get("product");
  const initialProduct = initialProductId
    ? allProducts.find((p) => p.id === initialProductId)
    : undefined;
  const initialBrandId = initialProduct?.brandId ?? searchParams.get("brand");
  const outputParam = searchParams.get("output") as OutputType | null;
  const presetParam = searchParams.get("preset");
  const isShootPreset = presetParam === "shoot";
  const isUgcPreset = presetParam === "ugc-video";
  const presetMarker: PresetMarker | null = isShootPreset ? "shoot" : isUgcPreset ? "ugc-video" : null;

  const [brandId, setBrandId] = useState<string | null>(initialBrandId ?? null);
  const [productIds, setProductIds] = useState<string[]>(
    initialProduct ? [initialProduct.id] : [],
  );
  const [output, setOutput] = useState<OutputType | null>(outputParam);
  const [imageFormat, setImageFormat] = useState<ImageFormat>("static");
  const [hideBrandIdentity, setHideBrandIdentity] = useState(false);

  const [references, setReferences] = useState<PromptBarReference[]>([]);
  const [advanced, setAdvanced] = useState<CommonAdvancedState>(DEFAULT_COMMON_ADVANCED);
  const [productAdvanced, setProductAdvanced] = useState<ProductAdAdvancedState>(
    isShootPreset
      ? { ...DEFAULT_PRODUCT_AD_ADVANCED, priceEmphasis: "hide", promoOverlay: [] }
      : DEFAULT_PRODUCT_AD_ADVANCED,
  );

  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(4);

  const models = useMemo(() => {
    if (output === "product-shoot") return MOCK_MODELS_SHOOT;
    switch (output) {
      case "image": return MOCK_MODELS_IMAGE;
      case "video": return MOCK_MODELS_VIDEO;
      case "whole-adcopy": return MOCK_MODELS_TEXT;
      default: return [] as PromptBarModel[];
    }
  }, [output]);

  const [modelId, setModelId] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (models.length > 0 && (!modelId || !models.find((m) => m.id === modelId))) {
      setModelId(models[0].id);
    }
  }, [models, modelId]);

  const brand = brandId ? allBrands.find((b) => b.id === brandId) : undefined;
  const showVideoSection = output === "video";

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

  const onGenerate = (testFirst: boolean) => {
    const summary = {
      type: "product-ad", brand: brand?.name, products: productIds, output,
      imageFormat: output === "image" ? imageFormat : undefined,
      hideBrandIdentity, shootPreset: isShootPreset,
      count: testFirst ? Math.min(4, count) : count,
      model: modelId, prompt, advanced, productAdvanced, refs: references.length,
    };
    // eslint-disable-next-line no-console
    console.log("[Product Ad — mock generate]", summary);
    alert(`Mock generation queued.\n\n${JSON.stringify(summary, null, 2)}`);
  };

  const canGenerate = !!brandId && productIds.length > 0 && !!output;

  const setAdvField = <K extends keyof CommonAdvancedState>(k: K, v: CommonAdvancedState[K]) =>
    setAdvanced({ ...advanced, [k]: v });

  return (
    <FormSkeleton
      eyebrow="Studio · Product Ad"
      title="Sell a specific product with brand context"
      sub="Pick brand + products, choose output, generate. Catalogue/Collection unlock with 2+ products."
      body={
        <>
          {/* 1. Picker — first body section */}
          <PickerCard title="Setup">
            <PickerRow
              label="Brand"
              required
              accessory={presetMarker ? <PresetBadge preset={presetMarker} /> : null}
            >
              <BrandPill value={brandId} onChange={(b) => {
                setBrandId(b);
                if (b !== brandId) setProductIds([]);
              }} required />
            </PickerRow>
            <PickerRow label="Products" required sub={brand ? `from ${brand.name}` : "pick a brand first"}>
              <ProductMultiPicker
                value={productIds}
                onChange={setProductIds}
                brandIdFilter={brandId}
              />
            </PickerRow>
            <PickerRow label="Output" required>
              <OutputChip
                value={output}
                onChange={setOutput}
                options={["image", "video", "whole-adcopy", "product-shoot"]}
                placeholder="Pick output"
              />
            </PickerRow>
            {output === "image" && (
              <PickerRow label="Format" sub="Catalogue/Collection need 2+ products">
                <FormatToggle
                  value={imageFormat}
                  onChange={setImageFormat}
                  options={formatOptions}
                />
              </PickerRow>
            )}
            <PickerRow label="Brand identity" sub="Affiliate-style anonymous">
              <button
                type="button"
                onClick={() => setHideBrandIdentity((v) => !v)}
                aria-pressed={hideBrandIdentity}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition-colors",
                  hideBrandIdentity
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                {hideBrandIdentity ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {hideBrandIdentity ? "Hidden" : "Show brand"}
              </button>
            </PickerRow>
          </PickerCard>

          <AISuggestionsBanner
            contextLabel={brand ? `from ${brand.name}'s category` : "from Industry Insights"}
          />

          <SavedTemplatesStrip />

          {showVideoSection && <VideoProductionSection />}

          <ReferencesSection
            references={references}
            onAddReference={(r) => setReferences([...references, r])}
            onRemoveReference={(i) => setReferences(references.filter((_, idx) => idx !== i))}
          />

          <AdvancedSection
            essentials={
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <CompactField label="Audience">
                  <input
                    type="text"
                    value={advanced.audience ?? ""}
                    onChange={(e) => setAdvField("audience", e.target.value)}
                    placeholder="e.g. Mums 28-40"
                    className="block h-9 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none"
                  />
                </CompactField>
                <CompactField label="Price emphasis">
                  <PriceEmphasisRow
                    value={productAdvanced.priceEmphasis}
                    onChange={(v) => setProductAdvanced({ ...productAdvanced, priceEmphasis: v })}
                  />
                </CompactField>
                <CompactField label="Compliance" sub="EU/CA/India auto-on">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={advanced.complianceOn}
                      onChange={(e) => setAdvField("complianceOn", e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-xs text-foreground">
                      {advanced.complianceOn ? "On" : "Off"}
                    </span>
                  </label>
                </CompactField>
              </div>
            }
            more={
              <>
                <AdvancedFacet label="Industry context">
                  <IndustryInsightsAnchor
                    filter={brand ? { kind: "brand", brandId: brand.id } : undefined}
                  />
                </AdvancedFacet>
                <AdvancedFacet label="Tone & voice">
                  <CommonAdvancedFields state={advanced} onChange={setAdvanced} />
                </AdvancedFacet>
                <AdvancedFacet label="Product specifics">
                  <ProductAdAdvancedFields
                    state={productAdvanced}
                    onChange={setProductAdvanced}
                    brandUsps={brand?.usps}
                  />
                </AdvancedFacet>
              </>
            }
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
          chipPrefix="Try"
          chipInsertMode="append"
          models={models}
          selectedModelId={modelId}
          onModelChange={setModelId}
          references={references}
          onAddReference={(r) => setReferences([...references, r])}
          onRemoveReference={(i) => setReferences(references.filter((_, idx) => idx !== i))}
          onGenerate={onGenerate}
          disabled={!canGenerate}
          generateLabel="Generate"
        />
      }
    />
  );
}

/* ─────────────────────────────────────────────────────── */

function CompactField({
  label, sub, children,
}: {
  label: string; sub?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="flex items-baseline gap-1 text-[11px] font-medium text-foreground">
        {label}
        {sub && <span className="text-[10px] font-normal text-muted-foreground">· {sub}</span>}
      </p>
      {children}
    </div>
  );
}

function PriceEmphasisRow({
  value, onChange,
}: {
  value: ProductAdAdvancedState["priceEmphasis"];
  onChange: (v: ProductAdAdvancedState["priceEmphasis"]) => void;
}) {
  const opts: ProductAdAdvancedState["priceEmphasis"][] = ["show", "hide", "fomo-badge"];
  const labels = { show: "Show", hide: "Hide", "fomo-badge": "FOMO" } as const;
  return (
    <div className="flex flex-wrap gap-1">
      {opts.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          aria-pressed={value === o}
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] transition-colors",
            value === o
              ? "bg-primary text-primary-foreground font-medium"
              : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
          )}
        >
          {labels[o]}
        </button>
      ))}
    </div>
  );
}
