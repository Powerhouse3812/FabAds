import { useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageIcon, FileText, ShoppingBag, Megaphone, Video, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IntentType, PurposeType, EcomFocusType } from "@/lib/genie3-data";
import { Genie2EcomInputs } from "@/components/genie2/Genie2EcomInputs";
import { Genie2AffiliateInputs } from "@/components/genie2/Genie2AffiliateInputs";
import { Genie2PromptBar } from "@/components/genie2/Genie2PromptBar";
import { Genie2SuggestionChips } from "@/components/genie2/Genie2SuggestionChips";
import { Genie2TuneControls } from "@/components/genie2/Genie2TuneControls";
import { CREDIT_PER_OUTPUT, detectBrandFromUrl, type BrandProfile } from "@/lib/genie2-dummy-data";
import type { Brand } from "@/hooks/use-brands";

export interface Genie4FormHandle {
  setPrompt: (v: string) => void;
}

interface Props {
  activeBrand: Brand | null;
  onGenerated: (count: number) => void;
  hasGenerated: boolean;
  promptBarRef?: React.Ref<HTMLDivElement>;
}

const intentLabel: Record<IntentType, { label: string; icon: typeof ImageIcon }> = {
  "creative-image": { label: "Image", icon: ImageIcon },
  "creative-video": { label: "Video", icon: Video },
  "adcopy": { label: "Ad Copy", icon: FileText },
};

export const Genie4Form = forwardRef<Genie4FormHandle, Props>(function Genie4Form(
  { activeBrand, onGenerated, hasGenerated, promptBarRef },
  ref
) {
  // Intent inline
  const [intent, setIntent] = useState<IntentType>("creative-image");
  const [purpose, setPurpose] = useState<PurposeType>("ecommerce");
  const [ecomFocus, setEcomFocus] = useState<EcomFocusType>("product");

  const [prompt, setPrompt] = useState("");
  const [numOutputs, setNumOutputs] = useState(4);
  const [generating, setGenerating] = useState(false);
  const [model, setModel] = useState("auto");

  // Ecom
  const [productUrl, setProductUrl] = useState("");
  const [detectedBrand, setDetectedBrand] = useState<BrandProfile | null>(null);

  // Affiliate
  const [category, setCategory] = useState("");
  const [angle, setAngle] = useState("");

  // Tune
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("");
  const [style, setStyle] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [removeMetadata, setRemoveMetadata] = useState(true);

  const creditEstimate = (CREDIT_PER_OUTPUT[model] || 1) * numOutputs;

  useImperativeHandle(ref, () => ({ setPrompt }), []);

  const productCategory = purpose === "ecommerce"
    ? detectedBrand?.category || activeBrand?.category || "General"
    : category || "General";

  const hasProduct = purpose === "ecommerce" ? !!detectedBrand : !!category;

  const handleChipClick = useCallback((snippet: string) => {
    setPrompt((prev) => prev ? `${prev}. ${snippet}` : snippet);
  }, []);

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    const delay = 3000 + Math.random() * 2000;
    setTimeout(() => {
      setGenerating(false);
      onGenerated(numOutputs);
    }, delay);
  }, [numOutputs, onGenerated]);

  const il = intentLabel[intent];
  const IntentIcon = il.icon;
  const productName = purpose === "ecommerce" && detectedBrand ? detectedBrand.name
    : purpose === "affiliate" && category ? category : null;

  return (
    <div className="space-y-4">
      {/* Intent + Purpose pills (all inline) */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Intent */}
        {(["creative-image", "creative-video", "adcopy"] as IntentType[]).map((v) => {
          const info = intentLabel[v];
          const Icon = info.icon;
          return (
            <button
              key={v}
              onClick={() => setIntent(v)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                intent === v ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              <Icon className="h-3 w-3" />
              {info.label}
            </button>
          );
        })}

        <div className="h-4 w-px bg-border mx-1" />

        {/* Purpose */}
        {([
          { value: "ecommerce" as PurposeType, label: "E-com", Icon: ShoppingBag },
          { value: "affiliate" as PurposeType, label: "Affiliate", Icon: Megaphone },
        ]).map(({ value, label, Icon }) => (
          <button
            key={value}
            onClick={() => setPurpose(value)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              purpose === value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}

        {/* E-com focus */}
        {purpose === "ecommerce" && (
          <>
            <div className="h-4 w-px bg-border mx-1" />
            {(["product", "brand"] as EcomFocusType[]).map((v) => (
              <button
                key={v}
                onClick={() => setEcomFocus(v)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
                  ecomFocus === v ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {v === "product" ? "Product" : "Brand"} focused
              </button>
            ))}
          </>
        )}

        {/* Product micro-feedback */}
        {productName && (
          <Badge variant="secondary" className="gap-1 text-xs ml-auto animate-in fade-in-0 duration-300">
            <Check className="h-3 w-3 text-primary" />
            Using: {productName}
          </Badge>
        )}
      </div>

      {/* Active brand context */}
      {activeBrand && (
        <div className="flex items-center gap-2 rounded-lg border bg-accent/20 px-3 py-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold text-white"
            style={{ backgroundColor: activeBrand.colors?.[0] || "#6366F1" }}
          >
            {activeBrand.name.charAt(0)}
          </div>
          <span className="text-xs font-medium">{activeBrand.name}</span>
          {activeBrand.category && <span className="text-[11px] text-muted-foreground">• {activeBrand.category}</span>}
        </div>
      )}

      {/* Product/Affiliate inputs */}
      {purpose === "ecommerce" ? (
        <Genie2EcomInputs
          productUrl={productUrl}
          onProductUrlChange={setProductUrl}
          detectedBrand={detectedBrand}
          onBrandDetected={setDetectedBrand}
        />
      ) : (
        <Genie2AffiliateInputs
          category={category}
          onCategoryChange={setCategory}
          angle={angle}
          onAngleChange={setAngle}
        />
      )}

      {/* Suggestions */}
      {hasProduct && (
        <Genie2SuggestionChips category={productCategory} hasGenerated={hasGenerated} onChipClick={handleChipClick} />
      )}

      {/* Prompt bar */}
      <Genie2PromptBar
        ref={promptBarRef}
        prompt={prompt}
        onPromptChange={setPrompt}
        model={model}
        onModelChange={setModel}
        numOutputs={numOutputs}
        onNumOutputsChange={setNumOutputs}
        generating={generating}
        onGenerate={handleGenerate}
        creditEstimate={creditEstimate}
        placeholder={intent === "adcopy" ? "Describe the ad you want..." : "What do you want to create today?"}
      />

      {/* Tune output */}
      <Genie2TuneControls
        audience={audience} onAudienceChange={setAudience}
        tone={tone} onToneChange={setTone}
        style={style} onStyleChange={setStyle}
        aspectRatio={aspectRatio} onAspectRatioChange={setAspectRatio}
        removeMetadata={removeMetadata} onRemoveMetadataChange={setRemoveMetadata}
      />
    </div>
  );
});
