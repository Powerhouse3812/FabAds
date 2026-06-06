import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { brands as allBrands } from "@/mocks/shared";
import { PromptBar, type PromptBarReference, type PromptBarChip, type PromptBarModel } from "@/components/PromptBar";
import { FormSkeleton } from "../FormSkeleton";
import { ReferencesSection } from "../ReferencesSection";
import { IndustryInsightsAnchor } from "../IndustryInsightsAnchor";
import { BrandPill } from "../fields/BrandPill";
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
  type AspectOption,
} from "../sections/CommonAdvancedFields";
import type { OutputType, ImageFormat } from "../types";

/**
 * StudioBrandAdForm — Brand Ad form (A-11.12 redesign).
 *
 * Spec: Genie_6.0_Form_Specs.md §1.
 *
 * A-11.12 layout (per Maalik feedback):
 *   - Slim header: back + eyebrow + title (FormSkeleton).
 *   - Form body, single-column scroll:
 *       1. PickerCard — Brand + Output + Format. NOT sticky. First section.
 *       2. AISuggestionsBanner — minimized italic info, non-clickable.
 *       3. SavedTemplatesStrip — visual cards.
 *       4. (when Output=Video) VideoProductionSection.
 *       5. ReferencesSection — visible drop-zone affordance.
 *       6. AdvancedSection — 3 essentials visible + "More controls" reveals
 *          the rest grouped by facet.
 *   - Floating glass PromptBar at the bottom (FormSkeleton).
 */

const IMAGE_FORMAT_OPTIONS: FormatOption[] = [
  { id: "static", label: "Static" },
  { id: "carousel", label: "Carousel" },
  { id: "collection", label: "Collection", disabled: true, disabledReason: "Add 2+ products to enable" },
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

  const initialBrand = searchParams.get("brand");
  const [brandId, setBrandId] = useState<string | null>(initialBrand);
  const outputParam = searchParams.get("output") as OutputType | null;
  const [output, setOutput] = useState<OutputType | null>(outputParam);
  const [imageFormat, setImageFormat] = useState<ImageFormat>("static");
  const presetMarker = searchParams.get("preset");

  const [references, setReferences] = useState<PromptBarReference[]>([]);
  const [advanced, setAdvanced] = useState<CommonAdvancedState>(DEFAULT_COMMON_ADVANCED);

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
  if (models.length > 0 && (!modelId || !models.find((m) => m.id === modelId))) {
    Promise.resolve().then(() => setModelId(models[0].id));
  }

  const brand = brandId ? allBrands.find((b) => b.id === brandId) : undefined;
  const showVideoSection = output === "video";

  const onGenerate = (testFirst: boolean) => {
    const summary = {
      type: "brand-ad", brand: brand?.name, output,
      imageFormat: output === "image" ? imageFormat : undefined,
      count: testFirst ? Math.min(4, count) : count,
      model: modelId, prompt, advanced, refs: references.length,
    };
    // eslint-disable-next-line no-console
    console.log("[Brand Ad — mock generate]", summary);
    alert(`Mock generation queued.\n\n${JSON.stringify(summary, null, 2)}`);
  };

  const canGenerate = !!brandId && !!output;

  // Subset for "essentials" — 3 highest-impact fields visible in Advanced.
  const setAdvField = <K extends keyof CommonAdvancedState>(k: K, v: CommonAdvancedState[K]) =>
    setAdvanced({ ...advanced, [k]: v });

  return (
    <FormSkeleton
      eyebrow="Studio · Brand Ad"
      title="Hero ads anchored to a brand profile"
      sub="Pick a brand, choose your output, generate. Override smart defaults below."
      body={
        <>
          {/* 1. Picker — first body section, NOT sticky */}
          <PickerCard title="Setup">
            <PickerRow
              label="Brand"
              required
              accessory={presetMarker === "ugc-video" ? <PresetBadge preset="ugc-video" /> : null}
            >
              <BrandPill value={brandId} onChange={setBrandId} required />
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
              <PickerRow label="Format" sub="Static / Carousel / Motion">
                <FormatToggle
                  value={imageFormat}
                  onChange={setImageFormat}
                  options={IMAGE_FORMAT_OPTIONS}
                />
              </PickerRow>
            )}
          </PickerCard>

          {/* 2. AI insight — minimized info banner */}
          <AISuggestionsBanner
            contextLabel={brand ? `from ${brand.name}'s category` : "from Industry Insights"}
          />

          {/* 3. Templates */}
          <SavedTemplatesStrip />

          {/* 4. Video Production (when Output=Video) */}
          {showVideoSection && <VideoProductionSection />}

          {/* 5. References */}
          <ReferencesSection
            references={references}
            onAddReference={(r) => setReferences([...references, r])}
            onRemoveReference={(i) => setReferences(references.filter((_, idx) => idx !== i))}
          />

          {/* 6. Advanced — 3 essentials + collapsible "More controls" */}
          <AdvancedSection
            essentials={
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <CompactField label="Audience">
                  <input
                    type="text"
                    value={advanced.audience ?? ""}
                    onChange={(e) => setAdvField("audience", e.target.value)}
                    placeholder="e.g. Mums 28-40, post-natal"
                    className="block h-9 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none"
                  />
                </CompactField>
                <CompactField label="Aspect ratios" sub="multi-select">
                  <AspectMulti
                    value={advanced.aspectRatios}
                    onChange={(v) => setAdvField("aspectRatios", v)}
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
  label,
  sub,
  children,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
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

function AspectMulti({
  value,
  onChange,
}: {
  value: AspectOption[];
  onChange: (next: AspectOption[]) => void;
}) {
  const opts: AspectOption[] = ["1:1", "4:5", "9:16", "16:9", "1.91:1"];
  const toggle = (a: AspectOption) =>
    onChange(value.includes(a) ? value.filter((x) => x !== a) : [...value, a]);
  return (
    <div className="flex flex-wrap gap-1">
      {opts.map((a) => {
        const active = value.includes(a);
        return (
          <button
            key={a}
            type="button"
            onClick={() => toggle(a)}
            aria-pressed={active}
            className={
              "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-mono transition-colors " +
              (active
                ? "border-primary/40 bg-primary/10 text-foreground font-bold"
                : "border-border bg-card text-muted-foreground hover:border-foreground/30")
            }
          >
            {a}
          </button>
        );
      })}
    </div>
  );
}
