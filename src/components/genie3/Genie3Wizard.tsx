import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { WIZARD_STEPS, type IntentType, type PurposeType, type EcomFocusType } from "@/lib/genie3-data";
import { Genie3Step1Intent } from "./Genie3Step1Intent";
import { Genie3Step2Context } from "./Genie3Step2Context";
import { Genie3Step3Refine } from "./Genie3Step3Refine";
import { CREDIT_PER_OUTPUT, type BrandProfile } from "@/lib/genie2-dummy-data";
import type { Brand } from "@/hooks/use-brands";

interface Props {
  activeBrand: Brand | null;
  onGenerated: (count: number) => void;
  hasGenerated: boolean;
  promptBarRef?: React.Ref<HTMLDivElement>;
}

export function Genie3Wizard({ activeBrand, onGenerated, hasGenerated, promptBarRef }: Props) {
  const [step, setStep] = useState(1);

  // Step 1 state
  const [intent, setIntent] = useState<IntentType>("creative-image");
  const [purpose, setPurpose] = useState<PurposeType>("ecommerce");
  const [ecomFocus, setEcomFocus] = useState<EcomFocusType>("product");

  // Step 2 state
  const [productUrl, setProductUrl] = useState("");
  const [detectedBrand, setDetectedBrand] = useState<BrandProfile | null>(null);
  const [category, setCategory] = useState("");
  const [angle, setAngle] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");

  // Step 3 state
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("auto");
  const [numOutputs, setNumOutputs] = useState(4);
  const [generating, setGenerating] = useState(false);

  const creditEstimate = (CREDIT_PER_OUTPUT[model] || 1) * numOutputs;

  const productCategory = purpose === "ecommerce"
    ? detectedBrand?.category || activeBrand?.category || "General"
    : category || "General";

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    const delay = 3000 + Math.random() * 2000;
    setTimeout(() => {
      setGenerating(false);
      onGenerated(numOutputs);
    }, delay);
  }, [numOutputs, onGenerated]);

  return (
    <div className="space-y-5">
      {/* Stepper */}
      <div className="flex items-center gap-1">
        {WIZARD_STEPS.map(({ step: s, label }) => (
          <div key={s} className="flex items-center gap-1">
            {s > 1 && <div className={cn("h-px w-6", step >= s ? "bg-primary" : "bg-border")} />}
            <button
              onClick={() => s < step && setStep(s)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all",
                step === s ? "bg-primary text-primary-foreground" :
                step > s ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20" :
                "bg-muted text-muted-foreground"
              )}
            >
              <span className="font-semibold">{s}</span>
              {label}
            </button>
          </div>
        ))}
      </div>

      {/* Steps */}
      {step === 1 && (
        <Genie3Step1Intent
          intent={intent}
          onIntentChange={setIntent}
          purpose={purpose}
          onPurposeChange={setPurpose}
          ecomFocus={ecomFocus}
          onEcomFocusChange={setEcomFocus}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <Genie3Step2Context
          intent={intent}
          purpose={purpose}
          ecomFocus={ecomFocus}
          activeBrand={activeBrand}
          productUrl={productUrl}
          onProductUrlChange={setProductUrl}
          detectedBrand={detectedBrand}
          onBrandDetected={setDetectedBrand}
          category={category}
          onCategoryChange={setCategory}
          angle={angle}
          onAngleChange={setAngle}
          aspectRatio={aspectRatio}
          onAspectRatioChange={setAspectRatio}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <Genie3Step3Refine
          intent={intent}
          purpose={purpose}
          productCategory={productCategory}
          hasGenerated={hasGenerated}
          prompt={prompt}
          onPromptChange={setPrompt}
          model={model}
          onModelChange={setModel}
          numOutputs={numOutputs}
          onNumOutputsChange={setNumOutputs}
          generating={generating}
          onGenerate={handleGenerate}
          creditEstimate={creditEstimate}
          promptBarRef={promptBarRef}
          onBack={() => setStep(2)}
        />
      )}
    </div>
  );
}
