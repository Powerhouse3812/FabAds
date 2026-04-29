import { useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageIcon, FileText, ShoppingBag, Megaphone, Video, Check } from "lucide-react";
import type { IntentType, PurposeType } from "./Genie2IntentModal";
import { Genie2EcomInputs } from "./Genie2EcomInputs";
import { Genie2AffiliateInputs } from "./Genie2AffiliateInputs";
import { Genie2PromptBar } from "./Genie2PromptBar";
import { Genie2SuggestionChips } from "./Genie2SuggestionChips";
import { Genie2TuneControls } from "./Genie2TuneControls";
import { CREDIT_PER_OUTPUT, detectBrandFromUrl, type BrandProfile } from "@/lib/genie2-dummy-data";

interface Props {
  intent: IntentType;
  purpose: PurposeType;
  onChangeIntent: () => void;
  onGenerated: (count: number) => void;
  hasGenerated: boolean;
  promptBarRef?: React.Ref<HTMLDivElement>;
}

export interface Genie2FormHandle {
  setPrompt: (v: string) => void;
  setProductUrl: (v: string) => void;
  triggerDetect: (url: string) => void;
}

const intentLabel: Record<IntentType, { label: string; icon: typeof ImageIcon }> = {
  "creative-image": { label: "Image", icon: ImageIcon },
  "creative-video": { label: "Video", icon: Video },
  "adcopy": { label: "Ad Copy", icon: FileText },
};

export const Genie2Form = forwardRef<Genie2FormHandle, Props>(function Genie2Form(
  { intent, purpose, onChangeIntent, onGenerated, hasGenerated, promptBarRef },
  ref
) {
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

  const triggerDetect = useCallback((url: string) => {
    setTimeout(() => {
      const profile = detectBrandFromUrl(url);
      setDetectedBrand(profile);
    }, 2000);
  }, []);

  // Expose imperative methods to parent
  useImperativeHandle(ref, () => ({
    setPrompt,
    setProductUrl,
    triggerDetect,
  }), [triggerDetect]);

  // Determine product category for suggestions
  const productCategory = purpose === "ecommerce"
    ? detectedBrand?.category || "General"
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

  // Product name for micro-feedback
  const productName = purpose === "ecommerce" && detectedBrand
    ? detectedBrand.name
    : purpose === "affiliate" && category
      ? category
      : null;

  return (
    <div className="space-y-4">
      {/* Header badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="gap-1 text-xs">
          <IntentIcon className="h-3 w-3" />
          {il.label}
        </Badge>
        <Badge variant="outline" className="gap-1 text-xs">
          {purpose === "ecommerce" ? <ShoppingBag className="h-3 w-3" /> : <Megaphone className="h-3 w-3" />}
          {purpose === "ecommerce" ? "E-commerce" : "Affiliate"}
        </Badge>
        <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={onChangeIntent}>
          Change
        </Button>

        {/* Product micro-feedback */}
        {productName && (
          <Badge variant="secondary" className="gap-1 text-xs ml-auto animate-in fade-in-0 duration-300">
            <Check className="h-3 w-3 text-primary" />
            Using: {productName}
          </Badge>
        )}
      </div>

      {/* Purpose-specific inputs — compact row */}
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

      {/* Suggestion chips (visible after product/category selected) */}
      {hasProduct && (
        <Genie2SuggestionChips
          category={productCategory}
          hasGenerated={hasGenerated}
          onChipClick={handleChipClick}
        />
      )}

      {/* Prompt Bar — primary, prominent */}
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
        placeholder={
          intent === "adcopy"
            ? "Describe the ad you want — angle, tone, audience..."
            : "What do you want to create today?"
        }
      />

      {/* Tune Output — collapsible */}
      <Genie2TuneControls
        audience={audience}
        onAudienceChange={setAudience}
        tone={tone}
        onToneChange={setTone}
        style={style}
        onStyleChange={setStyle}
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        removeMetadata={removeMetadata}
        onRemoveMetadataChange={setRemoveMetadata}
      />
    </div>
  );
});
