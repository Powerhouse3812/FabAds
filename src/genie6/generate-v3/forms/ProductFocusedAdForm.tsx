import { useMemo, useState } from "react";
import {
  Image as ImageIcon,
  Settings as SettingsIcon,
  Users,
  Wand2,
  FileText,
  Lightbulb,
  Paperclip,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { brands as allBrands, products as allProducts } from "@/mocks/shared";
import {
  PromptBar,
  type PromptBarReference,
  type PromptBarChip,
  type PromptBarModel,
} from "@/components/PromptBar";
import { FormSkeleton } from "@/genie6/generate-new/FormSkeleton";

import {
  ProductHorizontalPicker,
  type FetchedSnapshot,
} from "./components/ProductHorizontalPicker";
import { URLFetchEditModal } from "./components/URLFetchEditModal";
import { type AspectRatio } from "./components/AspectRatioMulti";
import { type OutputFormat } from "./components/OutputFormatToggle";
import { type Tone } from "./components/UGCConfig";
import { CombinedOutputRow } from "./components/CombinedOutputRow";
import { AiModelCard } from "./components/AiModelCard";
import { SummaryTriggerRow } from "./components/SummaryTriggerRow";
import { AudienceCreateModal } from "./components/AudienceCreateModal";
import { AudienceDrawer } from "./components/AudienceDrawer";
import { AngleDrawer } from "./components/AngleDrawer";
import { ConceptsDrawer } from "./components/ConceptsDrawer";
import {
  ReferencesSectionV3,
  type ReferenceTab,
} from "./components/ReferencesSectionV3";
import { PinterestColumnDrawer } from "./components/PinterestColumnDrawer";
import { ANGLES } from "./components/AnglePicker";
import { type ConceptSource } from "./components/ConceptsStrip";
import { ScriptInput, type ScriptMode } from "./components/ScriptInput";
import { VideoAdvancedSection } from "./components/VideoAdvancedSection";
import type { VideoAdvancedValues } from "./components/VideoAdvancedFields";
import {
  ProductImageryRow,
  deriveProductImagery,
} from "./components/ProductImageryRow";
import type { LocalUpload } from "./components/UploadsPanel";
import type { PinterestPin } from "@/genie6/generate-v3/mocks/pinterest";
import {
  audiences as systemAudiences,
  type Audience,
} from "@/genie6/generate-v3/mocks/audiences";
import {
  savedConcepts,
  newConcepts,
} from "@/genie6/generate-v3/mocks/concepts";

/**
 * ProductFocusedAdForm — Studio v3 Brand → Product-focused.
 *
 * A-11.25 wireframe revision per Maalik:
 *   - Subtitles dropped from setup rows.
 *   - References INLINE (form section), no longer in the column.
 *   - Audience / Angle / Concepts still use the right-side flat column
 *     (PickerColumn) — they're complex pickers that benefit from the
 *     wider workspace.
 *   - Header stripped to back + breadcrumb + title only (no sub, no
 *     switch sub-mode dropdown).
 *   - PromptBar's references popover is gone.
 */

type DrawerKind = "audience" | "angle" | "concepts" | "pinterest" | null;

const MOCK_MODELS_IMAGE: PromptBarModel[] = [
  { id: "ideogram-2", label: "Ideogram 2", tag: "balanced", costPerUnit: 1 },
  { id: "flux-pro", label: "Flux Pro", tag: "high quality", costPerUnit: 2 },
];
const MOCK_MODELS_VIDEO: PromptBarModel[] = [
  { id: "kling-1.5", label: "Kling 1.5", tag: "balanced", costPerUnit: 6 },
  { id: "veo-2", label: "Veo 2", tag: "high quality", costPerUnit: 10 },
  { id: "luma", label: "Luma Dream", tag: "fast", costPerUnit: 4 },
];

const TRY_CHIPS: PromptBarChip[] = [
  { label: "Punchy hook", insert: "lead with a 3-word hook tied to the audience pain" },
  { label: "Founder voice", insert: "in the founder's voice, conversational and warm" },
  { label: "Festive bias", insert: "festive Diwali backdrop with subtle bokeh and warm tones" },
  { label: "Performance bias", insert: "hard-CTA at end, clear price, urgency hook" },
];

const DEFAULT_ADVANCED: VideoAdvancedValues = {
  visualDirection: null,
  bgScene: null,
  pov: null,
  cameraAngle: null,
  motion: null,
  speed: null,
  subtitles: true,
};

export function ProductFocusedAdForm() {
  // Setup
  const [productId, setProductId] = useState<string | null>(null);
  const [fetchedSnap, setFetchedSnap] = useState<FetchedSnapshot | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [output, setOutput] = useState<OutputFormat>("image");
  const [aspectRatios, setAspectRatios] = useState<AspectRatio[]>(["1:1"]);

  // Use AI model
  const [useAiModel, setUseAiModel] = useState(false);
  const [aiModelId, setAiModelId] = useState<string | null>(null);
  const [tone, setTone] = useState<Tone>("Warm");

  // Script
  const [scriptMode, setScriptMode] = useState<ScriptMode>("ai");
  const [scriptText, setScriptText] = useState("");
  const [scriptFileName, setScriptFileName] = useState<string | null>(null);
  const [savedScriptId, setSavedScriptId] = useState<string | null>(null);

  // Audience
  const [customAudiences, setCustomAudiences] = useState<Audience[]>([]);
  const [selectedAudienceIds, setSelectedAudienceIds] = useState<string[]>([]);
  const [audienceModalOpen, setAudienceModalOpen] = useState(false);

  // Angle
  const [selectedAngleIds, setSelectedAngleIds] = useState<string[]>([]);

  // Concepts
  const [conceptSource, setConceptSource] = useState<ConceptSource>("saved");
  const [selectedConceptIds, setSelectedConceptIds] = useState<string[]>([]);

  // Product imagery
  const [productImageryEnabled, setProductImageryEnabled] = useState(true);
  const [productImageryDetached, setProductImageryDetached] = useState<string[]>([]);

  // References
  const [refTab, setRefTab] = useState<ReferenceTab>("uploads");
  const [uploads, setUploads] = useState<LocalUpload[]>([]);
  const [pinterestSelected, setPinterestSelected] = useState<PinterestPin[]>([]);

  // Advanced (video only)
  const [advanced, setAdvanced] = useState<VideoAdvancedValues>(DEFAULT_ADVANCED);

  // Right-side column drawer (audience / angle / concepts only — references
  // is INLINE in the form now per Maalik's A-11.25 feedback).
  const [drawer, setDrawer] = useState<DrawerKind>(null);
  const closeDrawer = () => setDrawer(null);

  // Prompt bar
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(4);
  const models = output === "video" ? MOCK_MODELS_VIDEO : MOCK_MODELS_IMAGE;
  const [modelId, setModelId] = useState<string>(MOCK_MODELS_IMAGE[0].id);

  if (!models.find((m) => m.id === modelId)) {
    Promise.resolve().then(() => setModelId(models[0].id));
  }

  const product = productId ? allProducts.find((p) => p.id === productId) : undefined;
  const brand = product ? allBrands.find((b) => b.id === product.brandId) : undefined;

  const toneSource = product
    ? `from ${brand?.name ?? "brand"} guidelines`
    : "default";

  const allAudiences = [...systemAudiences, ...customAudiences];

  const audiencePills = selectedAudienceIds.map((id) => {
    const a = allAudiences.find((x) => x.id === id);
    return a?.name ?? id;
  });
  const anglePills = selectedAngleIds.map((id) => {
    const a = ANGLES.find((x) => x.id === id);
    return a?.label ?? id;
  });
  const conceptPills = selectedConceptIds.map((id) => {
    const all = [...savedConcepts, ...newConcepts];
    const c = all.find((x) => x.id === id);
    return c?.name ?? id;
  });

  // Merged references for the generation payload
  const allReferences = useMemo<PromptBarReference[]>(() => {
    const refs: PromptBarReference[] = [];
    if (productImageryEnabled && productId) {
      const imagery = deriveProductImagery(productId);
      imagery
        .filter((i) => !productImageryDetached.includes(i.id))
        .forEach((img) => {
          refs.push({
            label: `${product?.name ?? "Product"} · ${img.label}`,
            value: `auto-product:${img.id}`,
            kind: "product",
          });
        });
    }
    uploads
      .filter((u) => u.selected)
      .forEach((u) => {
        refs.push({ label: u.name, value: u.id, kind: "upload" });
      });
    pinterestSelected.forEach((pin) => {
      refs.push({ label: pin.title, value: pin.id, kind: "pinterest" });
    });
    return refs;
  }, [
    productImageryEnabled,
    productId,
    productImageryDetached,
    uploads,
    pinterestSelected,
    product?.name,
  ]);

  const onFetched = (snap: FetchedSnapshot) => {
    setFetchedSnap(snap);
    toast.success(`Fetched: ${snap.product.name}`, {
      description: `Brand: ${snap.brand.name}${snap.otherProducts?.length ? ` · ${snap.otherProducts.length} other products imported` : ""}`,
      action: { label: "Edit & save", onClick: () => setEditModalOpen(true) },
      duration: 8000,
    });
  };

  const onSaveFetched = (edited: FetchedSnapshot) => {
    // eslint-disable-next-line no-console
    console.log("[Product-focused — fetched data saved]", edited);
    toast.success(`Saved ${edited.product.name} to your catalogue`, { duration: 4000 });
  };

  const onAudienceCreated = (a: Audience) => {
    setCustomAudiences((prev) => [...prev, a]);
    setSelectedAudienceIds((prev) => [...prev, a.id]);
    toast.success(`Audience saved: ${a.name}`, { duration: 3000 });
  };

  const toggleArrayItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    id: string,
  ) => {
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const onUploadsAdd = (next: LocalUpload[]) =>
    setUploads((prev) => [...prev, ...next]);
  const onUploadsToggleSelect = (id: string) =>
    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, selected: !u.selected } : u)),
    );
  const onUploadsRemove = (id: string) =>
    setUploads((prev) => prev.filter((u) => u.id !== id));
  const onPinterestToggleSelect = (pin: PinterestPin) =>
    setPinterestSelected((prev) =>
      prev.find((p) => p.id === pin.id)
        ? prev.filter((p) => p.id !== pin.id)
        : [...prev, pin],
    );
  const onProductImageryDetach = (id: string) =>
    setProductImageryDetached((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const onGenerate = (testFirst: boolean) => {
    const summary = {
      type: "product-focused-brand-ad",
      brand: brand?.name,
      product: product?.name,
      output,
      aspectRatios,
      audiences: selectedAudienceIds,
      angles: selectedAngleIds,
      useAiModel: output === "video" ? useAiModel : undefined,
      aiModelId: output === "video" && useAiModel ? aiModelId : undefined,
      tone: output === "video" && useAiModel ? tone : undefined,
      script:
        output === "video"
          ? {
              mode: scriptMode,
              text: scriptMode === "manual" ? scriptText : undefined,
              fileName: scriptMode === "upload" ? scriptFileName : undefined,
              savedId: scriptMode === "saved" ? savedScriptId : undefined,
            }
          : undefined,
      concepts: { source: conceptSource, ids: selectedConceptIds },
      productImageryEnabled,
      productImageryDetached,
      uploads: uploads.length,
      uploadsAttached: uploads.filter((u) => u.selected).length,
      pinterest: pinterestSelected.length,
      refsTotal: allReferences.length,
      advanced: output === "video" ? advanced : undefined,
      count: testFirst ? Math.min(4, count) : count,
      model: modelId,
      prompt,
    };
    // eslint-disable-next-line no-console
    console.log("[Product-focused — mock generate]", summary);
    toast.success(
      `Mock generation queued · ${summary.count} ${output === "video" ? "videos" : "ads"}`,
      {
        description: `${product?.name ?? "(no product)"} · ${aspectRatios.join(", ")}`,
        duration: 4000,
      },
    );
  };

  const canGenerate = !!productId && aspectRatios.length > 0;
  const isVideo = output === "video";

  return (
    <>
      <FormSkeleton
        v3={{
          categoryId: "brand",
          subModeId: "product-focused",
          title: "Product-focused asset",
        }}
        backTo="/iq/genie6/generate-v3"
        backLabel="Picker"
        body={
          <>
            {/* Product — picker + auto-attach toggle (now under product strip,
                inline-styled rather than card). */}
            <SetupRow icon={ImageIcon} label="Product">
              <div className="space-y-2">
                <ProductHorizontalPicker
                  value={productId}
                  onChange={setProductId}
                  onFetched={onFetched}
                />
                <ProductImageryRow
                  productId={productId}
                  enabled={productImageryEnabled}
                  onToggle={setProductImageryEnabled}
                  detachedIds={productImageryDetached}
                  onToggleDetach={onProductImageryDetach}
                />
              </div>
            </SetupRow>

            {/* Output / Aspect / AI Model Photoshoot — combined row. */}
            <SetupRow icon={SettingsIcon} label="Output">
              <CombinedOutputRow
                output={output}
                onOutputChange={setOutput}
                aspectRatios={aspectRatios}
                onAspectRatiosChange={setAspectRatios}
                useAiModel={useAiModel}
                onUseAiModelChange={setUseAiModel}
              />
            </SetupRow>

            {/* AI model integrated card */}
            {isVideo && useAiModel && (
              <SetupRow icon={Sparkles} label="AI model" optional>
                <AiModelCard
                  modelId={aiModelId}
                  onModelChange={setAiModelId}
                  tone={tone}
                  onToneChange={setTone}
                  toneSource={toneSource}
                />
              </SetupRow>
            )}

            {/* Script (video only) */}
            {isVideo && (
              <SetupRow icon={FileText} label="Script" optional>
                <ScriptInput
                  mode={scriptMode}
                  onModeChange={setScriptMode}
                  text={scriptText}
                  onTextChange={setScriptText}
                  fileName={scriptFileName}
                  onFileNameChange={setScriptFileName}
                  savedScriptId={savedScriptId}
                  onSavedScriptChange={setSavedScriptId}
                />
              </SetupRow>
            )}

            {/* Audience — summary trigger → drawer column. */}
            <SetupRow icon={Users} label="Audience" optional>
              <SummaryTriggerRow
                pills={audiencePills}
                onClick={() => setDrawer("audience")}
                active={drawer === "audience"}
                emptyHint="Pick audiences →"
              />
            </SetupRow>

            {/* Angle — summary trigger → drawer column. */}
            <SetupRow icon={Wand2} label="Angle" optional>
              <SummaryTriggerRow
                pills={anglePills}
                onClick={() => setDrawer("angle")}
                active={drawer === "angle"}
                emptyHint="Pick angles →"
              />
            </SetupRow>

            {/* Concepts — summary trigger → drawer column. */}
            <SetupRow icon={Lightbulb} label="Concepts" optional>
              <SummaryTriggerRow
                pills={conceptPills}
                onClick={() => setDrawer("concepts")}
                active={drawer === "concepts"}
                emptyHint="Browse concepts →"
              />
            </SetupRow>

            {/* References — INLINE form section. Pinterest tab opens
                a side column with search + filters + grid.
                Winner Ads toggle removed for Asset (Brand) sub-modes —
                concept doesn't apply to non-ad assets per Maalik. Lives
                in Ad sub-modes only when those forms ship. */}
            <SetupRow icon={Paperclip} label="References" optional>
              <ReferencesSectionV3
                tab={refTab}
                onTabChange={(next) => {
                  setRefTab(next);
                  if (next === "pinterest") setDrawer("pinterest");
                }}
                uploads={uploads}
                onUploadsAdd={onUploadsAdd}
                onUploadsToggleSelect={onUploadsToggleSelect}
                onUploadsRemove={onUploadsRemove}
                pinterestSelectedCount={pinterestSelected.length}
                onPinterestOpen={() => setDrawer("pinterest")}
                label=""
              />
            </SetupRow>

            {/* Advanced (video only) */}
            {isVideo && (
              <VideoAdvancedSection
                values={advanced}
                onChange={(next) => setAdvanced({ ...advanced, ...next })}
              />
            )}
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
            onGenerate={onGenerate}
            disabled={!canGenerate}
            generateLabel="Generate"
          />
        }
        drawer={
          drawer === "audience" ? (
            <AudienceDrawer
              open
              onClose={closeDrawer}
              audiences={allAudiences}
              selectedIds={selectedAudienceIds}
              onToggle={(id) => toggleArrayItem(setSelectedAudienceIds, id)}
              onCreate={() => setAudienceModalOpen(true)}
            />
          ) : drawer === "angle" ? (
            <AngleDrawer
              open
              onClose={closeDrawer}
              selectedIds={selectedAngleIds}
              onToggle={(id) => toggleArrayItem(setSelectedAngleIds, id)}
            />
          ) : drawer === "concepts" ? (
            <ConceptsDrawer
              open
              onClose={closeDrawer}
              source={conceptSource}
              onSourceChange={setConceptSource}
              selectedIds={selectedConceptIds}
              onToggle={(id) => toggleArrayItem(setSelectedConceptIds, id)}
            />
          ) : drawer === "pinterest" ? (
            <PinterestColumnDrawer
              open
              onClose={closeDrawer}
              query={{
                output,
                productId,
                brandId: product?.brandId ?? null,
                angleIds: selectedAngleIds,
                conceptIds: selectedConceptIds,
              }}
              selected={pinterestSelected}
              onToggleSelect={onPinterestToggleSelect}
              onReplaceSelection={setPinterestSelected}
              brandName={brand?.name ?? null}
              conceptCount={selectedConceptIds.length}
            />
          ) : null
        }
      />
      <URLFetchEditModal
        snapshot={fetchedSnap}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSave={onSaveFetched}
      />
      <AudienceCreateModal
        open={audienceModalOpen}
        onOpenChange={setAudienceModalOpen}
        onSave={onAudienceCreated}
      />
    </>
  );
}

/* ─────────────────────────────────────────────────────── */

function SetupRow({
  icon: Icon,
  label,
  optional,
  children,
}: {
  icon: typeof ImageIcon;
  label: string;
  /** Mark a row as optional. Required is the implicit default — no marker. */
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] sm:items-start gap-2 sm:gap-5">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <p className="flex items-center gap-1 text-xs font-medium text-foreground">
          {label}
          {optional && (
            <span
              aria-label="Optional field"
              className="text-[10px] font-normal text-muted-foreground"
            >
              (optional)
            </span>
          )}
        </p>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
