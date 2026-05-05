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
import { PresetBadge } from "../fields/PresetBadge";
import { StatusReadout, type StatusItem } from "../fields/StatusReadout";
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

  // A-11.10: Output stays UNSET on in-Studio entry. The user picks on the form.
  // Pre-fills only come from outside-Studio entry points (Catalogue / Workspace /
  // Dashboard CTAs) via the ?output= URL param.
  const outputParam = searchParams.get("output") as OutputType | null;
  const [output, setOutput] = useState<OutputType | null>(outputParam);
  const [imageFormat, setImageFormat] = useState<ImageFormat>("static");
  const presetMarker = searchParams.get("preset"); // "ugc-video" when from UGC preset

  // ───────────── Body state ─────────────
  const [references, setReferences] = useState<PromptBarReference[]>([]);
  const [advanced, setAdvanced] = useState<CommonAdvancedState>(DEFAULT_COMMON_ADVANCED);

  // ───────────── PromptBar state ─────────────
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(4);

  // Models depend on Output. When Output is unset (in-Studio entry without
  // pre-fill), no models render — user picks Output first.
  const models = useMemo(() => {
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

  // Auto-pin the model when Output changes (or first set) so the picker has
  // a sensible default once Output exists.
  if (models.length > 0 && (!modelId || !models.find((m) => m.id === modelId))) {
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

  const canGenerate = !!brandId && !!output;

  // ───────────── Render ─────────────
  // Status read-out for the strip below the top zone.
  const statusItems: StatusItem[] = [
    { label: brand ? `Brand · ${brand.name}` : "Brand · pick", state: brand ? "ok" : "missing" },
    { label: output ? `Output · ${output}` : "Output · pick", state: output ? "ok" : "missing" },
    ...(output === "image" ? [{ label: `Format · ${imageFormat}`, state: "info" as const }] : []),
    { label: `${count} variant${count === 1 ? "" : "s"}`, state: "info" },
  ];

  return (
    <FormSkeleton
      eyebrow="Studio · Brand Ad"
      title="Hero ads anchored to a brand profile"
      sub="Pick a brand, choose your output, generate. Override the smart defaults in the Advanced drawer."
      top={
        <div className="space-y-2">
          {/* Tier 1 — REQUIRED brand */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Brand ·
            </span>
            <BrandPill value={brandId} onChange={setBrandId} required />
            {presetMarker === "ugc-video" && (
              <PresetBadge preset="ugc-video" className="ml-auto" />
            )}
          </div>
          {/* Tier 2 — Output + Format */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Output ·
            </span>
            <OutputChip
              value={output}
              onChange={setOutput}
              options={["image", "video", "whole-adcopy"]}
              placeholder="Pick output"
            />
            {output === "image" && (
              <>
                <span className="text-muted-foreground/40 mx-0.5">·</span>
                <FormatToggle
                  value={imageFormat}
                  onChange={setImageFormat}
                  options={IMAGE_FORMAT_OPTIONS}
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
          disabled={!canGenerate}
          generateLabel="Generate"
        />
      }
    />
  );
}
