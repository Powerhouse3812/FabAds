import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Globe, Tag } from "lucide-react";
import { categories as allCategories, brands as allBrands } from "@/mocks/shared";
import { PromptBar, type PromptBarReference, type PromptBarChip, type PromptBarModel, type PromptBarContextChip } from "@/components/PromptBar";
import { cn } from "@/lib/utils";
import { FormSkeleton } from "../FormSkeleton";
import { AdvancedDrawer } from "../AdvancedDrawer";
import { AISuggestionsDrawer } from "../AISuggestionsDrawer";
import { ReferencesSection } from "../ReferencesSection";
import { IndustryInsightsAnchor } from "../IndustryInsightsAnchor";
import { CategoryPill } from "../fields/CategoryPill";
import { BrandPill } from "../fields/BrandPill";
import { ProductMultiPicker } from "../fields/ProductMultiPicker";
import { OutputChip } from "../fields/OutputChip";
import { FormatToggle, type FormatOption } from "../fields/FormatToggle";
import { PresetBadge } from "../fields/PresetBadge";
import { SavedTemplatesStrip } from "../sections/SavedTemplatesStrip";
import { VideoProductionSection } from "../sections/VideoProductionSection";
import {
  CommonAdvancedFields,
  DEFAULT_COMMON_ADVANCED,
  type CommonAdvancedState,
} from "../sections/CommonAdvancedFields";
import {
  AffiliateAdAdvancedFields,
  DEFAULT_AFFILIATE_AD_ADVANCED,
  type AffiliateAdAdvancedState,
} from "../sections/AffiliateAdAdvancedFields";
import type { OutputType, ImageFormat } from "../types";

/**
 * StudioAffiliateAdForm — third New Studio Type form (A-11.6).
 *
 * Spec source: Genie_6.0_Form_Specs.md §3.
 *
 * Distinct from Brand / Product Ad in:
 *   - Top sticky leads with REQUIRED Category picker (not Brand) — KB anchor
 *     for Affiliate, parallel to Brand for Brand Ad.
 *   - Optional Landing URL input + Saved offers picker.
 *   - Optional "Also generate as Product Ad" toggle that reveals Brand pill +
 *     Product picker inline.
 *   - Format toggle adds LP-derived (auto-extracts hero from landing page).
 *   - Form body adds "Category KB references" strip (Category-specific
 *     winners/refs, parallel to Product visuals from Brand profile).
 *   - Advanced drawer adds Affiliate-specific: Funnel emphasis / Compliance
 *     presets / LP-emphasis / Geo-target.
 *
 * Pre-fill matrix (Form Specs §3):
 *   - Default → Type=Affiliate Ad, Output=Whole Adcopy. Category + URL
 *     selected inside the form (NOT on the gate).
 *   - From Workspace > Category detail → Category pre-filled.
 */

const IMAGE_FORMAT_OPTIONS: FormatOption[] = [
  { id: "static", label: "Static" },
  { id: "carousel", label: "Carousel" },
  { id: "collection", label: "Collection" },
  { id: "motion", label: "Motion" },
  { id: "lp-derived", label: "LP-derived" },
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

const TRY_CHIPS: PromptBarChip[] = [
  { label: "Hard-sell hook", insert: "open with a hard-sell stat in 3 seconds" },
  { label: "Curiosity gap", insert: "lead with a curiosity-gap question" },
  { label: "Soft-CTA close", insert: "soft-CTA outro, no hard sell" },
];

export function StudioAffiliateAdForm() {
  const [searchParams] = useSearchParams();

  // ───────────── Pre-fill from URL ─────────────
  const initialCategory = searchParams.get("category");
  const initialOutput = (searchParams.get("output") as OutputType) || "whole-adcopy";
  const presetMarker = searchParams.get("preset"); // "ugc-video" when from UGC preset

  // ───────────── Top sticky state ─────────────
  const [categoryId, setCategoryId] = useState<string | null>(initialCategory);
  const [landingUrl, setLandingUrl] = useState<string>("");
  const [output, setOutput] = useState<OutputType>(initialOutput);
  const [imageFormat, setImageFormat] = useState<ImageFormat>("static");
  const [alsoProductAd, setAlsoProductAd] = useState(false);
  const [productAdBrandId, setProductAdBrandId] = useState<string | null>(null);
  const [productAdProductIds, setProductAdProductIds] = useState<string[]>([]);

  // ───────────── Body state ─────────────
  const [references, setReferences] = useState<PromptBarReference[]>([]);
  const [advanced, setAdvanced] = useState<CommonAdvancedState>(DEFAULT_COMMON_ADVANCED);
  const [affiliateAdvanced, setAffiliateAdvanced] = useState<AffiliateAdAdvancedState>(
    DEFAULT_AFFILIATE_AD_ADVANCED,
  );

  // ───────────── PromptBar state ─────────────
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(4);

  const models = useMemo(() => {
    switch (output) {
      case "image":
        return MOCK_MODELS_IMAGE;
      case "video":
        return MOCK_MODELS_VIDEO;
      case "whole-adcopy":
      default:
        return MOCK_MODELS_TEXT;
    }
  }, [output]);

  const [modelId, setModelId] = useState<string>(models[0].id);
  useEffect(() => {
    if (!models.find((m) => m.id === modelId)) setModelId(models[0].id);
  }, [models, modelId]);

  // ───────────── Derived ─────────────
  const category = categoryId ? allCategories.find((c) => c.id === categoryId) : undefined;
  const productAdBrand = productAdBrandId ? allBrands.find((b) => b.id === productAdBrandId) : undefined;
  const showVideoSection = output === "video";

  const contextChips: PromptBarContextChip[] = [
    { label: "Affiliate Ad", tone: "active" as const },
    ...(category
      ? [{ label: category.name, onClear: () => setCategoryId(null) }]
      : []),
    ...(alsoProductAd && productAdBrand
      ? [{ label: `+ ${productAdBrand.name}`, logo: productAdBrand.logo }]
      : []),
  ];

  const onGenerate = (testFirst: boolean) => {
    const summary = {
      type: "affiliate-ad",
      category: category?.name ?? "(none)",
      landingUrl,
      output,
      imageFormat: output === "image" ? imageFormat : undefined,
      alsoProductAd,
      productAdBrand: alsoProductAd ? productAdBrand?.name : undefined,
      productAdProducts: alsoProductAd ? productAdProductIds : undefined,
      count: testFirst ? Math.min(4, count) : count,
      model: modelId,
      prompt,
      advanced,
      affiliateAdvanced,
      refs: references.length,
    };
    // eslint-disable-next-line no-console
    console.log("[Affiliate Ad — mock generate]", summary);
    alert(`Mock generation queued.\n\n${JSON.stringify(summary, null, 2)}`);
  };

  const canGenerate = !!categoryId;

  return (
    <FormSkeleton
      top={
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryPill value={categoryId} onChange={setCategoryId} required />
            <span className="text-muted-foreground/40">·</span>
            <div className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 min-w-[200px]">
              <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                type="url"
                value={landingUrl}
                onChange={(e) => setLandingUrl(e.target.value)}
                placeholder="Landing URL (optional)"
                aria-label="Landing URL"
                className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground/70 outline-none w-full"
              />
            </div>
            <button
              type="button"
              onClick={() => alert("Saved offers picker — coming with the offers backend (TODO).")}
              className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border bg-card px-2 py-1 text-[11px] text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            >
              <Tag className="h-3 w-3" />
              Saved offers
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OutputChip
              value={output}
              onChange={setOutput}
              options={["image", "video", "whole-adcopy"]}
            />
            {output === "image" && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <FormatToggle
                  value={imageFormat}
                  onChange={setImageFormat}
                  options={IMAGE_FORMAT_OPTIONS}
                />
              </>
            )}
            <button
              type="button"
              onClick={() => setAlsoProductAd((v) => !v)}
              aria-pressed={alsoProductAd}
              className={cn(
                "ml-auto inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition-colors",
                "outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-1",
                alsoProductAd
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
              )}
            >
              <span className="text-base leading-none">⚙</span>
              Also generate as Product Ad
            </button>
            {presetMarker === "ugc-video" && <PresetBadge preset="ugc-video" />}
          </div>
          {alsoProductAd && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/20 bg-primary/5 p-2">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Product Ad pair
              </p>
              <BrandPill
                value={productAdBrandId}
                onChange={(b) => {
                  setProductAdBrandId(b);
                  if (b !== productAdBrandId) setProductAdProductIds([]);
                }}
                required={false}
              />
              <ProductMultiPicker
                value={productAdProductIds}
                onChange={setProductAdProductIds}
                brandIdFilter={productAdBrandId}
              />
            </div>
          )}
        </div>
      }
      body={
        <>
          <SavedTemplatesStrip />
          <CategoryKBStrip categoryId={categoryId} />
          {showVideoSection && <VideoProductionSection />}
          <ReferencesSection
            references={references}
            onAddReference={(r) => setReferences([...references, r])}
            onRemoveReference={(i) => setReferences(references.filter((_, idx) => idx !== i))}
          />
          <AdvancedDrawer label="Advanced settings">
            <IndustryInsightsAnchor
              filter={category ? { kind: "category", categoryId: category.id } : undefined}
            />
            <CommonAdvancedFields state={advanced} onChange={setAdvanced} />
            <div className="mt-2 border-t border-border pt-3">
              <p className="mb-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Affiliate Ad-specific
              </p>
              <AffiliateAdAdvancedFields
                state={affiliateAdvanced}
                onChange={setAffiliateAdvanced}
              />
            </div>
          </AdvancedDrawer>
          <AISuggestionsDrawer
            contextLabel={category ? `from Industry Insights · ${category.name}` : "from Industry Insights"}
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
 * CategoryKBStrip — Affiliate-specific strip per Form Specs §3.
 * "winners/refs from Category profile, parallel to Product visuals from
 * Brand profile on Product Ad."
 *
 * Phase B build: stub showing 3 mocked KB references. Real Category KB
 * editor + storage land in iter-8+ Settings layer.
 */
function CategoryKBStrip({ categoryId }: { categoryId: string | null }) {
  if (!categoryId) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Category KB references
      </h2>
      <p className="text-[10px] text-muted-foreground/80">
        Top winners + KB notes from this category's profile. Wired from Settings &gt; Categories &gt; KB editor (iter-8+).
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="shrink-0 w-32 rounded-md border border-border bg-card p-2"
          >
            <div className="aspect-square w-full rounded-sm bg-muted/40 flex items-center justify-center">
              <span className="text-[9px] font-mono uppercase text-muted-foreground/60">
                KB ref #{i}
              </span>
            </div>
            <p className="mt-1 truncate text-[10px] text-muted-foreground">
              Mock category winner {i}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
