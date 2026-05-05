import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Globe, Tag } from "lucide-react";
import { categories as allCategories, brands as allBrands } from "@/mocks/shared";
import { PromptBar, type PromptBarReference, type PromptBarChip, type PromptBarModel } from "@/components/PromptBar";
import { cn } from "@/lib/utils";
import { FormSkeleton } from "../FormSkeleton";
import { ReferencesSection } from "../ReferencesSection";
import { IndustryInsightsAnchor } from "../IndustryInsightsAnchor";
import { CategoryPill } from "../fields/CategoryPill";
import { BrandPill } from "../fields/BrandPill";
import { ProductMultiPicker } from "../fields/ProductMultiPicker";
import { OutputChip } from "../fields/OutputChip";
import { FormatToggle, type FormatOption } from "../fields/FormatToggle";
import { PresetBadge } from "../fields/PresetBadge";
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
  AffiliateAdAdvancedFields,
  DEFAULT_AFFILIATE_AD_ADVANCED,
  type AffiliateAdAdvancedState,
} from "../sections/AffiliateAdAdvancedFields";
import type { OutputType, ImageFormat } from "../types";

/**
 * StudioAffiliateAdForm — Affiliate Ad form (A-11.12 redesign).
 * Spec: Genie_6.0_Form_Specs.md §3.
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

  const initialCategory = searchParams.get("category");
  const outputParam = searchParams.get("output") as OutputType | null;
  const presetMarker = searchParams.get("preset");

  const [categoryId, setCategoryId] = useState<string | null>(initialCategory);
  const [landingUrl, setLandingUrl] = useState<string>("");
  const [output, setOutput] = useState<OutputType | null>(outputParam);
  const [imageFormat, setImageFormat] = useState<ImageFormat>("static");
  const [alsoProductAd, setAlsoProductAd] = useState(false);
  const [productAdBrandId, setProductAdBrandId] = useState<string | null>(null);
  const [productAdProductIds, setProductAdProductIds] = useState<string[]>([]);

  const [references, setReferences] = useState<PromptBarReference[]>([]);
  const [advanced, setAdvanced] = useState<CommonAdvancedState>(DEFAULT_COMMON_ADVANCED);
  const [affiliateAdvanced, setAffiliateAdvanced] = useState<AffiliateAdAdvancedState>(
    DEFAULT_AFFILIATE_AD_ADVANCED,
  );

  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(4);

  const models = useMemo(() => {
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

  const category = categoryId ? allCategories.find((c) => c.id === categoryId) : undefined;
  const productAdBrand = productAdBrandId ? allBrands.find((b) => b.id === productAdBrandId) : undefined;
  const showVideoSection = output === "video";

  const onGenerate = (testFirst: boolean) => {
    const summary = {
      type: "affiliate-ad", category: category?.name, landingUrl, output,
      imageFormat: output === "image" ? imageFormat : undefined,
      alsoProductAd,
      productAdBrand: alsoProductAd ? productAdBrand?.name : undefined,
      productAdProducts: alsoProductAd ? productAdProductIds : undefined,
      count: testFirst ? Math.min(4, count) : count,
      model: modelId, prompt, advanced, affiliateAdvanced, refs: references.length,
    };
    // eslint-disable-next-line no-console
    console.log("[Affiliate Ad — mock generate]", summary);
    alert(`Mock generation queued.\n\n${JSON.stringify(summary, null, 2)}`);
  };

  const canGenerate = !!categoryId && !!output;

  const setAdvField = <K extends keyof CommonAdvancedState>(k: K, v: CommonAdvancedState[K]) =>
    setAdvanced({ ...advanced, [k]: v });

  return (
    <FormSkeleton
      eyebrow="Studio · Affiliate Ad"
      title="Performance ads anchored to a category"
      sub="Pick category + landing URL, choose output, generate. Toggle 'Also Product Ad' to pair with a Product Ad batch."
      body={
        <>
          <PickerCard title="Setup">
            <PickerRow
              label="Category"
              required
              accessory={presetMarker === "ugc-video" ? <PresetBadge preset="ugc-video" /> : null}
            >
              <CategoryPill value={categoryId} onChange={setCategoryId} required />
            </PickerRow>
            <PickerRow label="Landing URL" sub="optional · drives LP-derived format">
              <div className="inline-flex h-9 w-full max-w-md items-center gap-1.5 rounded-md border border-border bg-card px-2.5">
                <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <input
                  type="url"
                  value={landingUrl}
                  onChange={(e) => setLandingUrl(e.target.value)}
                  placeholder="https://example.com/lp/…"
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
            </PickerRow>
            <PickerRow label="Output" required>
              <OutputChip
                value={output}
                onChange={setOutput}
                options={["image", "video", "whole-adcopy"]}
                placeholder="Pick output"
              />
            </PickerRow>
            {output === "image" && (
              <PickerRow label="Format" sub="LP-derived auto-extracts hero">
                <FormatToggle
                  value={imageFormat}
                  onChange={setImageFormat}
                  options={IMAGE_FORMAT_OPTIONS}
                />
              </PickerRow>
            )}
            <PickerRow label="Also Product Ad" sub="generate paired Product Ad in the same batch">
              <button
                type="button"
                onClick={() => setAlsoProductAd((v) => !v)}
                aria-pressed={alsoProductAd}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition-colors",
                  alsoProductAd
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                {alsoProductAd ? "Enabled" : "Off"}
              </button>
            </PickerRow>
            {alsoProductAd && (
              <PickerRow label="Product pair" sub="brand + products for the paired generation">
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
              </PickerRow>
            )}
          </PickerCard>

          <AISuggestionsBanner
            contextLabel={category ? `from ${category.name} category` : "from Industry Insights"}
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
                    placeholder="e.g. weight-loss seekers"
                    className="block h-9 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none"
                  />
                </CompactField>
                <CompactField label="Compliance preset">
                  <CompliancePresetRow
                    value={affiliateAdvanced.compliancePreset}
                    onChange={(v) => setAffiliateAdvanced({ ...affiliateAdvanced, compliancePreset: v })}
                  />
                </CompactField>
                <CompactField label="Geo target" sub="comma-separated">
                  <input
                    type="text"
                    value={affiliateAdvanced.geoTarget}
                    onChange={(e) => setAffiliateAdvanced({ ...affiliateAdvanced, geoTarget: e.target.value })}
                    placeholder="India, UAE, EU-7"
                    className="block h-9 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none"
                  />
                </CompactField>
              </div>
            }
            more={
              <>
                <AdvancedFacet label="Industry context">
                  <IndustryInsightsAnchor
                    filter={category ? { kind: "category", categoryId: category.id } : undefined}
                  />
                </AdvancedFacet>
                <AdvancedFacet label="Tone & voice">
                  <CommonAdvancedFields state={advanced} onChange={setAdvanced} />
                </AdvancedFacet>
                <AdvancedFacet label="Affiliate specifics">
                  <AffiliateAdAdvancedFields state={affiliateAdvanced} onChange={setAffiliateAdvanced} />
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

function CompliancePresetRow({
  value, onChange,
}: {
  value: AffiliateAdAdvancedState["compliancePreset"];
  onChange: (v: AffiliateAdAdvancedState["compliancePreset"]) => void;
}) {
  const opts: AffiliateAdAdvancedState["compliancePreset"][] = ["none", "nutra", "sweepstakes", "finance"];
  const labels = { none: "None", nutra: "Nutra", sweepstakes: "Sweeps", finance: "Finance" } as const;
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
