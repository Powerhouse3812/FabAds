import { useState } from "react";
import { Camera, Image as ImageIcon, Video } from "lucide-react";
import { toast } from "sonner";
import { brands as allBrands, products as allProducts } from "@/mocks/shared";
import { PromptBar, type PromptBarReference, type PromptBarChip, type PromptBarModel } from "@/components/PromptBar";
import { cn } from "@/lib/utils";
import { FormSkeleton } from "@/genie6/generate-new/FormSkeleton";
import { PickerCard, PickerRow } from "@/genie6/generate-new/sections/PickerCard";
import { SavedTemplatesStrip } from "@/genie6/generate-new/sections/SavedTemplatesStrip";
import { ReferencesSection } from "@/genie6/generate-new/ReferencesSection";

import { ProductHorizontalPicker, type FetchedSnapshot } from "./components/ProductHorizontalPicker";
import { URLFetchEditModal } from "./components/URLFetchEditModal";
import { BrandIntensityChips, type BrandIntensity } from "./components/BrandIntensityChips";
import { AspectRatioMulti, type AspectRatio } from "./components/AspectRatioMulti";
import { UGCConfig, type Tone } from "./components/UGCConfig";
import { ProductImagesStrip } from "./components/ProductImagesStrip";

/**
 * ProductShootForm — Studio v3 first real sub-mode form (A-11.19).
 *
 * Routed at /iq/genie6/generate-v3/brand/product-shoot. Replaces the
 * SubModePlaceholder for that specific path.
 *
 * Spec from Maalik this round:
 *   - Single product picker, horizontal strip + brand filter + URL fetch
 *   - URL fetch always-visible; on success → toast with Edit/Save modal
 *   - Brand identity intensity: Hide / Minimum / Moderate / Strong
 *   - Output: Image / Video toggle
 *   - When Video: UGC toggle reveals optional avatar + tone (KB-prefilled)
 *   - Aspect ratios (multi-select)
 *   - Product images auto-attach with detach toggle
 *   - Saved Templates strip
 *   - References (local + URL)
 *   - Floating glass PromptBar with credit chip + count + AI model + Generate
 *
 * Reuses chassis from generate-new/ (FormSkeleton, PromptBar, PickerCard,
 * ReferencesSection, SavedTemplatesStrip) — those files unchanged per
 * Maalik's "Studio v3 only" lock.
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

  // URL fetch flow
  const [fetchedSnap, setFetchedSnap] = useState<FetchedSnapshot | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Picker settings
  const [intensity, setIntensity] = useState<BrandIntensity>("moderate");
  const [output, setOutput] = useState<"image" | "video">("image");
  const [aspectRatios, setAspectRatios] = useState<AspectRatio[]>(["1:1"]);

  // UGC config (only when Output=Video)
  const [ugcOn, setUgcOn] = useState(false);
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [tone, setTone] = useState<Tone>("Warm");

  // Product images — detach state
  const [detachedImageIds, setDetachedImageIds] = useState<string[]>([]);

  // PromptBar state
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(4);
  const models = output === "video" ? MOCK_MODELS_VIDEO : MOCK_MODELS_IMAGE;
  const [modelId, setModelId] = useState<string>(MOCK_MODELS_IMAGE[0].id);

  // References
  const [references, setReferences] = useState<PromptBarReference[]>([]);

  // Re-pin model when output changes
  if (!models.find((m) => m.id === modelId)) {
    Promise.resolve().then(() => setModelId(models[0].id));
  }

  const product = productId ? allProducts.find((p) => p.id === productId) : undefined;
  const brand = product ? allBrands.find((b) => b.id === product.brandId) : undefined;

  // Tone source label — pre-filled from KB if available, fallback to Brand defaults
  const toneSource = product
    ? `from ${brand?.name ?? "brand"} guidelines`
    : "default";

  const onFetched = (snap: FetchedSnapshot) => {
    setFetchedSnap(snap);
    toast.success(
      `Fetched: ${snap.product.name}`,
      {
        description: `Brand: ${snap.brand.name}${snap.otherProducts?.length ? ` · ${snap.otherProducts.length} other products imported` : ""}`,
        action: {
          label: "Edit & save",
          onClick: () => setEditModalOpen(true),
        },
        duration: 8000,
      },
    );
  };

  const onSaveFetched = (edited: FetchedSnapshot) => {
    // TODO (iter-8+): persist to user's catalogue via real backend.
    // eslint-disable-next-line no-console
    console.log("[Product Shoot — fetched data saved]", edited);
    toast.success(
      `Saved ${edited.product.name} to your catalogue`,
      { duration: 4000 },
    );
  };

  const onGenerate = (testFirst: boolean) => {
    const summary = {
      type: "product-shoot",
      product: product?.name,
      brand: brand?.name,
      intensity,
      output,
      aspectRatios,
      ugc: ugcOn,
      avatarId: ugcOn ? avatarId : undefined,
      tone: ugcOn ? tone : undefined,
      attachedImages: "auto-derived; detached IDs:" + detachedImageIds.join(","),
      count: testFirst ? Math.min(4, count) : count,
      model: modelId,
      prompt,
      refs: references.length,
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

  return (
    <>
    <FormSkeleton
      eyebrow="Studio v3 · Brand · Product Shoot"
      title="Studio-quality product photography"
      sub="Pick a product, dial brand intensity, choose ratios, generate. Asset for use later — not a finished ad."
      backTo="/iq/genie6/generate-v3"
      backLabel="Picker"
      body={
        <>
          {/* 1. Picker — first body section */}
          <PickerCard title="Setup">
            <PickerRow label="Product" required sub="Single select · or paste URL to fetch a new one">
              <ProductHorizontalPicker
                value={productId}
                onChange={(id) => {
                  setProductId(id);
                  setDetachedImageIds([]); // reset on product change
                }}
                onFetched={onFetched}
              />
            </PickerRow>
            <PickerRow label="Brand identity" sub="how strongly the brand shows up">
              <BrandIntensityChips value={intensity} onChange={setIntensity} />
            </PickerRow>
            <PickerRow label="Output" required>
              <OutputToggle value={output} onChange={setOutput} />
            </PickerRow>
            <PickerRow label="Aspect ratios" required sub="multi-select for parallel render">
              <AspectRatioMulti value={aspectRatios} onChange={setAspectRatios} />
            </PickerRow>
            {output === "video" && (
              <PickerRow label="UGC config" sub="reveals avatar + tone">
                <UGCConfig
                  enabled={ugcOn}
                  onToggle={setUgcOn}
                  avatarId={avatarId}
                  onAvatarChange={setAvatarId}
                  tone={tone}
                  onToneChange={setTone}
                  toneSource={toneSource}
                />
              </PickerRow>
            )}
          </PickerCard>

          {/* 2. Product images — auto-attach + detach toggle */}
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Existing product imagery
              </h2>
            </div>
            <ProductImagesStrip
              productId={productId}
              detachedIds={detachedImageIds}
              onToggleDetach={(id) =>
                setDetachedImageIds((prev) =>
                  prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
                )
              }
            />
          </section>

          {/* 3. Saved templates — shoot-specific presets */}
          <SavedTemplatesStrip label="Saved shoot templates" />

          {/* 4. References */}
          <ReferencesSection
            references={references}
            onAddReference={(r) => setReferences([...references, r])}
            onRemoveReference={(i) => setReferences(references.filter((_, idx) => idx !== i))}
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
    {/* Edit-modal lives outside FormSkeleton's slots — sibling render so it
        portal-attaches to body. Triggered by the toast's "Edit & save"
        action after a successful URL fetch. */}
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

function OutputToggle({
  value,
  onChange,
}: {
  value: "image" | "video";
  onChange: (next: "image" | "video") => void;
}) {
  return (
    <div role="radiogroup" aria-label="Output type" className="inline-flex rounded-md border border-border bg-card p-0.5">
      <button
        type="button"
        role="radio"
        aria-checked={value === "image"}
        onClick={() => onChange("image")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium transition-colors",
          value === "image"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Camera className="h-3 w-3" />
        Image
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === "video"}
        onClick={() => onChange("video")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium transition-colors",
          value === "video"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Video className="h-3 w-3" />
        Video
      </button>
    </div>
  );
}
