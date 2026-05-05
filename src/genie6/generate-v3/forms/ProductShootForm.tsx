import { useEffect, useState } from "react";
import { Camera, Image as ImageIcon, Video, Building2, Settings as SettingsIcon, Layers } from "lucide-react";
import { toast } from "sonner";
import { brands as allBrands, products as allProducts } from "@/mocks/shared";
import { PromptBar, type PromptBarReference, type PromptBarChip, type PromptBarModel } from "@/components/PromptBar";
import { cn } from "@/lib/utils";
import { FormSkeleton } from "@/genie6/generate-new/FormSkeleton";
import { SavedTemplatesStrip } from "@/genie6/generate-new/sections/SavedTemplatesStrip";
import { ReferencesSection } from "@/genie6/generate-new/ReferencesSection";

import { ProductHorizontalPicker, type FetchedSnapshot } from "./components/ProductHorizontalPicker";
import { URLFetchEditModal } from "./components/URLFetchEditModal";
import { BrandIntensityChips, type BrandIntensity } from "./components/BrandIntensityChips";
import { AspectRatioMulti, type AspectRatio } from "./components/AspectRatioMulti";
import { UGCConfig, type Tone } from "./components/UGCConfig";

/**
 * ProductShootForm — Studio v3 first real sub-mode form.
 *
 * Routed at /iq/genie6/generate-v3/brand/product-shoot.
 *
 * A-11.20 redesign per Maalik:
 *   - Setup section is now BARE (no PickerCard frame). Just an eyebrow +
 *     a stack of labeled rows. Matches the unframed pattern of Templates /
 *     References sections.
 *   - Existing product imagery is GONE as a standalone block. Now a toggle
 *     inside References ("Include product imagery"). Toggle ON →
 *     auto-attaches product assets as references; user can remove
 *     individually. Dynamic — re-toggling re-syncs the list.
 *   - Floating prompt bar now sticks via flex (no overlap with References
 *     anymore — fixed in FormSkeleton).
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

/** Prefix used to identify auto-attached product-imagery references in
 *  the unified references array. Allows clean filtering on toggle changes. */
const AUTO_PRODUCT_PREFIX = "auto-product:";

/**
 * Derive the auto-attached product imagery refs for a given product.
 * Mock for now — 3 synthesized variants. Real backend asset library
 * lands in iter-8+.
 */
function deriveProductImageryRefs(productId: string | null): PromptBarReference[] {
  if (!productId) return [];
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return [];
  const refs: PromptBarReference[] = [];
  refs.push({
    label: `${product.name} · Main`,
    value: `${AUTO_PRODUCT_PREFIX}${product.id}-main`,
  });
  refs.push({
    label: `${product.name} · Lifestyle`,
    value: `${AUTO_PRODUCT_PREFIX}${product.id}-lifestyle`,
  });
  refs.push({
    label: `${product.name} · Detail shot`,
    value: `${AUTO_PRODUCT_PREFIX}${product.id}-detail`,
  });
  return refs;
}

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

  // References — unified array of auto-product + manual references.
  // Auto-attached items carry the AUTO_PRODUCT_PREFIX in their `value`.
  const [productImageryEnabled, setProductImageryEnabled] = useState(true);
  const [references, setReferences] = useState<PromptBarReference[]>([]);

  // PromptBar state
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(4);
  const models = output === "video" ? MOCK_MODELS_VIDEO : MOCK_MODELS_IMAGE;
  const [modelId, setModelId] = useState<string>(MOCK_MODELS_IMAGE[0].id);

  // Re-pin model when output changes
  if (!models.find((m) => m.id === modelId)) {
    Promise.resolve().then(() => setModelId(models[0].id));
  }

  /**
   * Sync product-imagery refs into the unified references array whenever
   * the toggle flips OR the selected product changes. Manual references
   * (without the AUTO_PRODUCT_PREFIX) are preserved.
   */
  useEffect(() => {
    setReferences((prev) => {
      const manual = prev.filter((r) => !r.value.startsWith(AUTO_PRODUCT_PREFIX));
      const auto = productImageryEnabled
        ? deriveProductImageryRefs(productId)
        : [];
      return [...auto, ...manual];
    });
  }, [productImageryEnabled, productId]);

  const product = productId ? allProducts.find((p) => p.id === productId) : undefined;
  const brand = product ? allBrands.find((b) => b.id === product.brandId) : undefined;

  const toneSource = product
    ? `from ${brand?.name ?? "brand"} guidelines`
    : "default";

  const onFetched = (snap: FetchedSnapshot) => {
    setFetchedSnap(snap);
    toast.success(`Fetched: ${snap.product.name}`, {
      description: `Brand: ${snap.brand.name}${snap.otherProducts?.length ? ` · ${snap.otherProducts.length} other products imported` : ""}`,
      action: {
        label: "Edit & save",
        onClick: () => setEditModalOpen(true),
      },
      duration: 8000,
    });
  };

  const onSaveFetched = (edited: FetchedSnapshot) => {
    // eslint-disable-next-line no-console
    console.log("[Product Shoot — fetched data saved]", edited);
    toast.success(`Saved ${edited.product.name} to your catalogue`, { duration: 4000 });
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
      productImageryEnabled,
      references: references.length,
      autoProductRefs: references.filter((r) => r.value.startsWith(AUTO_PRODUCT_PREFIX)).length,
      manualRefs: references.filter((r) => !r.value.startsWith(AUTO_PRODUCT_PREFIX)).length,
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
            {/* 1. Setup — BARE (no card frame), eyebrow + labeled rows */}
            <SetupSection>
              <SetupRow icon={ImageIcon} label="Product" required sub="Single select · or paste URL to fetch a new one">
                <ProductHorizontalPicker
                  value={productId}
                  onChange={setProductId}
                  onFetched={onFetched}
                />
              </SetupRow>
              <SetupRow icon={Building2} label="Brand identity" sub="how strongly the brand shows up">
                <BrandIntensityChips value={intensity} onChange={setIntensity} />
              </SetupRow>
              <SetupRow icon={SettingsIcon} label="Output" required>
                <OutputToggle value={output} onChange={setOutput} />
              </SetupRow>
              <SetupRow icon={Layers} label="Aspect ratios" required sub="multi-select for parallel render">
                <AspectRatioMulti value={aspectRatios} onChange={setAspectRatios} />
              </SetupRow>
              {output === "video" && (
                <SetupRow icon={Video} label="UGC config" sub="reveals avatar + tone">
                  <UGCConfig
                    enabled={ugcOn}
                    onToggle={setUgcOn}
                    avatarId={avatarId}
                    onAvatarChange={setAvatarId}
                    tone={tone}
                    onToneChange={setTone}
                    toneSource={toneSource}
                  />
                </SetupRow>
              )}
            </SetupSection>

            {/* 2. Saved templates — shoot-specific */}
            <SavedTemplatesStrip label="Saved shoot templates" />

            {/* 3. References — with product-imagery toggle as `extras` */}
            <ReferencesSection
              references={references}
              onAddReference={(r) => setReferences([...references, r])}
              onRemoveReference={(i) =>
                setReferences(references.filter((_, idx) => idx !== i))
              }
              extras={
                <ProductImageryToggle
                  enabled={productImageryEnabled}
                  onToggle={setProductImageryEnabled}
                  productName={product?.name}
                />
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
            onRemoveReference={(i) =>
              setReferences(references.filter((_, idx) => idx !== i))
            }
            onGenerate={onGenerate}
            disabled={!canGenerate}
            generateLabel="Generate"
          />
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

/* ─────────────────────────────────────────────────────── *
 *  Bare Setup section — no card frame.
 *  Eyebrow + vertical stack of labeled rows.
 * ───────────────────────────────────────────────────────── */
function SetupSection({ children }: { children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline gap-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
          Setup
        </h2>
        <p className="text-[11px] text-muted-foreground">
          Inputs and render settings.
        </p>
      </div>
      <div className="space-y-4 divide-y divide-border/40">
        {children}
      </div>
    </section>
  );
}

function SetupRow({
  icon: Icon,
  label,
  sub,
  required,
  children,
}: {
  icon: typeof ImageIcon;
  label: string;
  sub?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] sm:items-start gap-2 sm:gap-5 pt-4 first:pt-0">
      <div className="flex items-start gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground mt-0.5">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="space-y-0.5 min-w-0">
          <p className="flex items-center gap-1 text-xs font-medium text-foreground">
            {label}
            {required && <span className="text-destructive" aria-label="required">·</span>}
          </p>
          {sub && <p className="text-[10px] text-muted-foreground leading-snug">{sub}</p>}
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── *
 *  ProductImageryToggle — sits inside References as `extras`.
 *  Per Maalik: "include product imagery" toggle. ON →
 *  auto-attaches product assets as refs. Dynamic.
 * ───────────────────────────────────────────────────────── */
function ProductImageryToggle({
  enabled,
  onToggle,
  productName,
}: {
  enabled: boolean;
  onToggle: (next: boolean) => void;
  productName: string | undefined;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 flex items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onToggle(!enabled)}
        className={cn(
          "relative shrink-0 mt-0.5 h-5 w-9 rounded-full transition-colors",
          "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          enabled ? "bg-primary" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-card shadow transition-transform",
            enabled && "translate-x-4",
          )}
        />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground">
          Include product imagery
        </p>
        <p className="text-[11px] text-muted-foreground leading-snug">
          {productName
            ? `Auto-attaches existing photos of ${productName}. You can remove individual ones below or add other refs.`
            : "When a product is selected, its existing photos auto-attach as references."}
        </p>
      </div>
    </div>
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
