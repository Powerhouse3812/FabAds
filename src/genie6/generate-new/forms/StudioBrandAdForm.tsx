import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { brands as allBrands } from "@/mocks/shared";
import { PromptBar, type PromptBarReference, type PromptBarChip, type PromptBarModel, type PromptBarContextChip } from "@/components/PromptBar";
import { FormSkeleton } from "../FormSkeleton";
import { AdvancedDrawer } from "../AdvancedDrawer";
import { AISuggestionsDrawer } from "../AISuggestionsDrawer";
import { ReferencesSection } from "../ReferencesSection";
import { IndustryInsightsAnchor } from "../IndustryInsightsAnchor";
import { BrandPill } from "../fields/BrandPill";
import { OutputChip } from "../fields/OutputChip";
import { FormatToggle, type FormatOption } from "../fields/FormatToggle";
import { SavedTemplatesStrip } from "../sections/SavedTemplatesStrip";
import { VideoProductionSection } from "../sections/VideoProductionSection";
import {
  CommonAdvancedFields,
  DEFAULT_COMMON_ADVANCED,
  type CommonAdvancedState,
} from "../sections/CommonAdvancedFields";
import type { OutputType, ImageFormat } from "../types";

/**
 * StudioBrandAdForm — first New Studio Type form (A-11.4).
 *
 * Spec source: Genie_6.0_Form_Specs.md §1.
 * Architectural rules baked in: top sticky / scrollable body / floating
 * PromptBar (FormSkeleton). Tokens: global Geist (per scope=A "keep Geist
 * for entire FabAds project" lock).
 *
 * Studio-prefixed naming so when Canvas/Command/Modular variants are added
 * later, a thin variant-router slots in without renames.
 *
 * Pre-fill matrix (Form Specs §1):
 *   - Default entry → Type=Brand Ad, Output=Whole Adcopy, Advanced blank
 *   - ?brand=:id from URL → Brand pre-filled
 *
 * When Output=Video → VideoProductionSection appears between Saved Templates
 * and References (per spec).
 */

// Format options when Output=Image (Form Specs §1)
const IMAGE_FORMAT_OPTIONS: FormatOption[] = [
  { id: "static", label: "Static" },
  { id: "carousel", label: "Carousel" },
  { id: "collection", label: "Collection", disabled: true, disabledReason: "Add 2+ products to enable" },
  { id: "motion", label: "Motion" },
];

// Mock model list — caller-driven so each Type can offer different models.
// TODO: backport real per-output-type model picker from Genie 6 aiModels.ts
const MOCK_MODELS_IMAGE: PromptBarModel[] = [
  { id: "ideogram-2", label: "Ideogram 2", tag: "balanced", costPerUnit: 1 },
  { id: "flux-pro", label: "Flux Pro", tag: "high quality", costPerUnit: 2 },
  { id: "sd-xl-fast", label: "SD-XL Fast", tag: "fast", costPerUnit: 1 },
];
const MOCK_MODELS_VIDEO: PromptBarModel[] = [
  { id: "kling-1.5", label: "Kling 1.5", tag: "balanced", costPerUnit: 6 },
  { id: "veo-2", label: "Veo 2", tag: "high quality", costPerUnit: 10 },
  { id: "luma", label: "Luma Dream", tag: "fast", costPerUnit: 4 },
];
const MOCK_MODELS_TEXT: PromptBarModel[] = [
  { id: "claude-sonnet", label: "Claude Sonnet", tag: "balanced", costPerUnit: 1 },
  { id: "gpt-4o", label: "GPT-4o", tag: "balanced", costPerUnit: 1 },
];

const TRY_CHIPS: PromptBarChip[] = [
  { label: "Premium tone", insert: "with a premium, aspirational tone" },
  { label: "Hindi voice-over", insert: "Hindi voice-over, casual" },
  { label: "Lifestyle scene", insert: "in a lifestyle setting, natural light" },
];

export function StudioBrandAdForm() {
  const [searchParams] = useSearchParams();

  // ───────────── Top sticky state ─────────────
  const initialBrand = searchParams.get("brand");
  const [brandId, setBrandId] = useState<string | null>(initialBrand);

  const initialOutput = (searchParams.get("output") as OutputType) || "whole-adcopy";
  const [output, setOutput] = useState<OutputType>(initialOutput);
  const [imageFormat, setImageFormat] = useState<ImageFormat>("static");

  // ───────────── Body state ─────────────
  const [references, setReferences] = useState<PromptBarReference[]>([]);
  const [advanced, setAdvanced] = useState<CommonAdvancedState>(DEFAULT_COMMON_ADVANCED);

  // ───────────── PromptBar state ─────────────
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(4);

  // Models depend on Output
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

  // Auto-flip the model when Output changes (otherwise we'd be on a stale model id)
  const modelInList = models.find((m) => m.id === modelId);
  if (!modelInList) {
    // Use a microtask to set state — avoids re-render warning
    Promise.resolve().then(() => setModelId(models[0].id));
  }

  // ───────────── Derived ─────────────
  const brand = brandId ? allBrands.find((b) => b.id === brandId) : undefined;
  const showVideoSection = output === "video";

  const contextChips: PromptBarContextChip[] = [
    { label: "Brand Ad", tone: "active" as const },
    ...(brand
      ? [{
          label: brand.name,
          logo: brand.logo,
          onClear: () => setBrandId(null),
        }]
      : []),
  ];

  const onGenerate = (testFirst: boolean) => {
    // TODO (iter-8+): wire to real generation pipeline.
    const summary = {
      type: "brand-ad",
      brand: brand?.name ?? "(none)",
      output,
      imageFormat: output === "image" ? imageFormat : undefined,
      count: testFirst ? Math.min(4, count) : count,
      model: modelId,
      prompt,
      advanced,
      refs: references.length,
    };
    // eslint-disable-next-line no-console
    console.log("[Brand Ad — mock generate]", summary);
    alert(
      `Mock generation queued. Real pipeline wiring lands later.\n\n${JSON.stringify(summary, null, 2)}`,
    );
  };

  // ───────────── Render ─────────────
  return (
    <FormSkeleton
      top={
        <div className="flex flex-wrap items-center gap-2">
          <BrandPill value={brandId} onChange={setBrandId} required />
          <span className="text-muted-foreground/40">·</span>
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
        </div>
      }
      body={
        <>
          <SavedTemplatesStrip />
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
          disabled={!brandId}
          generateLabel="Generate"
        />
      }
    />
  );
}
