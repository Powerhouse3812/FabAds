import { useMemo, useState } from "react";
import {
  Image as ImageIcon,
  Building2,
  Settings as SettingsIcon,
  Sparkles,
  Paperclip,
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

import { ProductHorizontalPicker, type FetchedSnapshot } from "./components/ProductHorizontalPicker";
import { URLFetchEditModal } from "./components/URLFetchEditModal";
import { BrandIntensityChips, type BrandIntensity } from "./components/BrandIntensityChips";
import { type AspectRatio } from "./components/AspectRatioMulti";
import { type Tone } from "./components/UGCConfig";
import { CombinedOutputRow } from "./components/CombinedOutputRow";
import { AiModelCard } from "./components/AiModelCard";
import {
  ReferencesSectionV3,
  type ReferenceTab,
} from "./components/ReferencesSectionV3";
import { PinterestColumnDrawer } from "./components/PinterestColumnDrawer";
import {
  ProductImageryRow,
  deriveProductImagery,
} from "./components/ProductImageryRow";
import type { LocalUpload } from "./components/UploadsPanel";
import type { PinterestPin } from "@/genie6/generate-v3/mocks/pinterest";

/**
 * ProductShootForm — Studio v3 Brand → Product Shoot.
 *
 * Routed at /iq/genie6/generate-v3/brand/product-shoot.
 *
 * A-11.25 wireframe revision per Maalik:
 *   - Subtitles dropped from setup rows.
 *   - Brand identity + Auto-attach product imagery on ONE row.
 *   - Output row uses CombinedOutputRow (Output / Aspect / AI Model
 *     Photoshoot — only when video).
 *   - References INLINE (form section), not a drawer or column.
 *   - PromptBar's references popover is gone.
 *   - Header is minimal — back + breadcrumb + title only.
 */

const MOCK_MODELS_IMAGE: PromptBarModel[] = [
  { id: "shoot-staging", label: "Studio Pipeline", tag: "preset", costPerUnit: 2 },
  { id: "ideogram-2", label: "Ideogram 2", tag: "balanced", costPerUnit: 1 },
  { id: "flux-pro", label: "Flux Pro", tag: "high quality", costPerUnit: 2 },
];
const MOCK_MODELS_VIDEO: PromptBarModel[] = [
  { id: "kling-1.5", label: "Kling 1.5", tag: "balanced", costPerUnit: 6 },
  { id: "veo-2", label: "Veo 2", tag: "high quality", costPerUnit: 10 },
  { id: "luma", label: "Luma Dream", tag: "fast", costPerUnit: 4 },
];

const TRY_CHIPS: PromptBarChip[] = [
  { label: "Studio white", insert: "clean studio white background, soft diffused light" },
  { label: "Lifestyle", insert: "in a lifestyle setting with warm natural light" },
  { label: "Festive bg", insert: "festive Diwali backdrop with subtle bokeh" },
  { label: "Minimal", insert: "minimal pastel background, single subject" },
];

export function ProductShootForm() {
  // Picker
  const [productId, setProductId] = useState<string | null>(null);
  const [fetchedSnap, setFetchedSnap] = useState<FetchedSnapshot | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Picker settings
  const [intensity, setIntensity] = useState<BrandIntensity>("moderate");
  const [output, setOutput] = useState<"image" | "video">("image");
  const [aspectRatios, setAspectRatios] = useState<AspectRatio[]>(["1:1"]);

  // Use AI model
  const [useAiModel, setUseAiModel] = useState(false);
  const [aiModelId, setAiModelId] = useState<string | null>(null);
  const [tone, setTone] = useState<Tone>("Warm");

  // Product imagery
  const [productImageryEnabled, setProductImageryEnabled] = useState(true);
  const [productImageryDetached, setProductImageryDetached] = useState<string[]>([]);

  // References
  const [refTab, setRefTab] = useState<ReferenceTab>("uploads");
  const [uploads, setUploads] = useState<LocalUpload[]>([]);
  const [pinterestSelected, setPinterestSelected] = useState<PinterestPin[]>([]);
  const [pinterestColumnOpen, setPinterestColumnOpen] = useState(false);

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

  // Merged references for the generation payload (still used at submit time
  // even though PromptBar no longer surfaces them).
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
    console.log("[Product Shoot — fetched data saved]", edited);
    toast.success(`Saved ${edited.product.name} to your catalogue`, { duration: 4000 });
  };

  const onUploadsAdd = (next: LocalUpload[]) => setUploads((prev) => [...prev, ...next]);
  const onUploadsToggleSelect = (id: string) =>
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, selected: !u.selected } : u)));
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
      type: "product-shoot",
      product: product?.name,
      brand: brand?.name,
      intensity,
      output,
      aspectRatios,
      useAiModel: output === "video" ? useAiModel : undefined,
      aiModelId: output === "video" && useAiModel ? aiModelId : undefined,
      tone: output === "video" && useAiModel ? tone : undefined,
      productImageryEnabled,
      productImageryDetached,
      uploads: uploads.length,
      uploadsAttached: uploads.filter((u) => u.selected).length,
      pinterest: pinterestSelected.length,
      refsTotal: allReferences.length,
      count: testFirst ? Math.min(4, count) : count,
      model: modelId,
      prompt,
    };
    // eslint-disable-next-line no-console
    console.log("[Product Shoot — mock generate]", summary);
    toast.success(
      `Mock generation queued · ${summary.count} ${output === "video" ? "videos" : "shots"}`,
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
          subModeId: "product-shoot",
          title: "Product Shoot",
        }}
        backTo="/iq/genie6/generate-v3"
        backLabel="Picker"
        body={
          <>
            {/* Product — picker + horizontal product strip */}
            <SetupRow icon={ImageIcon} label="Product">
              <ProductHorizontalPicker
                value={productId}
                onChange={setProductId}
                onFetched={onFetched}
              />
            </SetupRow>

            {/* Brand identity + Auto-attach product imagery — ONE row. */}
            <SetupRow icon={Building2} label="Brand identity">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <BrandIntensityChips value={intensity} onChange={setIntensity} />
                <ProductImageryRow
                  productId={productId}
                  enabled={productImageryEnabled}
                  onToggle={setProductImageryEnabled}
                  detachedIds={productImageryDetached}
                  onToggleDetach={onProductImageryDetach}
                  variant="inline"
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

            {/* AI model integrated card — only when video + toggle on */}
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

            {/* References — INLINE form section. Pinterest tab opens
                the side column rather than rendering inline. */}
            <SetupRow icon={Paperclip} label="References" optional>
              <ReferencesSectionV3
                tab={refTab}
                onTabChange={(next) => {
                  setRefTab(next);
                  if (next === "pinterest") setPinterestColumnOpen(true);
                }}
                uploads={uploads}
                onUploadsAdd={onUploadsAdd}
                onUploadsToggleSelect={onUploadsToggleSelect}
                onUploadsRemove={onUploadsRemove}
                pinterestSelectedCount={pinterestSelected.length}
                onPinterestOpen={() => setPinterestColumnOpen(true)}
                label=""
              />
            </SetupRow>
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
          pinterestColumnOpen ? (
            <PinterestColumnDrawer
              open
              onClose={() => setPinterestColumnOpen(false)}
              query={{
                output,
                productId,
                brandId: product?.brandId ?? null,
                angleIds: [],
                conceptIds: [],
              }}
              selected={pinterestSelected}
              onToggleSelect={onPinterestToggleSelect}
              onReplaceSelection={setPinterestSelected}
              brandName={brand?.name ?? null}
              conceptCount={0}
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
