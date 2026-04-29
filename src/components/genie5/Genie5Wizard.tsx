import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { IntentType, PurposeType, EcomFocusType } from "@/lib/genie3-data";
import { Genie3Step1Intent } from "@/components/genie3/Genie3Step1Intent";
import { Genie3Step2Context } from "@/components/genie3/Genie3Step2Context";
import { Genie3Step3Refine } from "@/components/genie3/Genie3Step3Refine";
import { Genie5StrategyCards } from "./Genie5StrategyCards";
import { Genie5ApproachPicker } from "./Genie5ApproachPicker";
import { Genie5SelectionSummary } from "./Genie5SelectionSummary";
import { CREDIT_PER_OUTPUT, type BrandProfile } from "@/lib/genie2-dummy-data";
import type { Brand } from "@/hooks/use-brands";
import type { GenieCategory } from "@/hooks/use-genie-categories";

const WIZARD_STEPS = [
  { step: 1, label: "Intent" },
  { step: 2, label: "Strategies" },
  { step: 3, label: "Approach" },
  { step: 4, label: "Context" },
  { step: 5, label: "Generate" },
];

interface Props {
  activeBrand: Brand | null;
  activeCategory: GenieCategory | null;
  onGenerated: (count: number) => void;
  hasGenerated: boolean;
  promptBarRef?: React.Ref<HTMLDivElement>;
}

export function Genie5Wizard({ activeBrand, activeCategory, onGenerated, hasGenerated, promptBarRef }: Props) {
  const [step, setStep] = useState(1);

  const [intent, setIntent] = useState<IntentType>("creative-image");
  const [purpose, setPurpose] = useState<PurposeType>("ecommerce");
  const [ecomFocus, setEcomFocus] = useState<EcomFocusType>("product");

  const [productUrl, setProductUrl] = useState("");
  const [detectedBrand, setDetectedBrand] = useState<BrandProfile | null>(null);
  const [category, setCategory] = useState("");
  const [angle, setAngle] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");

  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("auto");
  const [numOutputs, setNumOutputs] = useState(4);
  const [generating, setGenerating] = useState(false);

  const [selectedStrategies, setSelectedStrategies] = useState<Set<string>>(new Set());
  const [approach, setApproach] = useState<"templates" | "fresh">("fresh");
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());

  const creditEstimate = (CREDIT_PER_OUTPUT[model] || 1) * numOutputs;

  const productCategory = purpose === "ecommerce"
    ? detectedBrand?.category || activeBrand?.category || "General"
    : category || activeCategory?.niche || "General";

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); onGenerated(numOutputs); }, 3000 + Math.random() * 2000);
  }, [numOutputs, onGenerated]);

  // Selection summary
  const intentLabel = intent === "creative-image" ? "Image" : intent === "creative-video" ? "Video" : "Ad Copy";
  const purposeLabel = purpose === "ecommerce" ? "E-commerce" : "Affiliate";
  const summaryItems = [
    { label: "Intent", value: intentLabel },
    { label: "Purpose", value: purposeLabel },
    step > 2 && selectedStrategies.size > 0 && { label: "Strategies", value: `${selectedStrategies.size} selected` },
    step > 3 && { label: "Approach", value: approach === "templates" ? "Templates" : "Fresh AI" },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="space-y-5">
      {/* Segmented progress bar */}
      <div className="flex gap-1">
        {WIZARD_STEPS.map(({ step: s, label }) => (
          <div key={s} className="flex-1">
            <div className={cn("h-1 rounded-full transition-all duration-500", step >= s ? "bg-primary" : "bg-muted")} />
            <p className={cn("text-[9px] mt-1.5 font-medium tracking-wide", step >= s ? "text-primary" : "text-muted-foreground/50")}>{label}</p>
          </div>
        ))}
      </div>

      {/* Selection summary */}
      {step > 1 && summaryItems.length > 0 && <Genie5SelectionSummary items={summaryItems} />}

      {step === 1 && (
        <Genie3Step1Intent
          intent={intent} onIntentChange={setIntent}
          purpose={purpose} onPurposeChange={setPurpose}
          ecomFocus={ecomFocus} onEcomFocusChange={setEcomFocus}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Genie5StrategyCards selectedIds={selectedStrategies} onSelectionChange={setSelectedStrategies} defaultCollapsed={false} />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={() => setStep(3)}>
              {selectedStrategies.size > 0 ? `Continue with ${selectedStrategies.size} strategies` : "Skip"}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <Genie5ApproachPicker
            approach={approach}
            onApproachChange={setApproach}
            selectedTemplateIds={selectedTemplateIds}
            onSelectedTemplateIdsChange={setSelectedTemplateIds}
            variant="cards"
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button onClick={() => setStep(4)}>
              {approach === "templates" && selectedTemplateIds.size > 0
                ? `Continue with ${selectedTemplateIds.size} templates`
                : "Continue"}
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <Genie3Step2Context
          intent={intent} purpose={purpose} ecomFocus={ecomFocus} activeBrand={activeBrand}
          productUrl={productUrl} onProductUrlChange={setProductUrl}
          detectedBrand={detectedBrand} onBrandDetected={setDetectedBrand}
          category={category} onCategoryChange={setCategory}
          angle={angle} onAngleChange={setAngle}
          aspectRatio={aspectRatio} onAspectRatioChange={setAspectRatio}
          onBack={() => setStep(3)} onNext={() => setStep(5)}
        />
      )}

      {step === 5 && (
        <Genie3Step3Refine
          intent={intent} purpose={purpose}
          productCategory={productCategory} hasGenerated={hasGenerated}
          prompt={prompt} onPromptChange={setPrompt}
          model={model} onModelChange={setModel}
          numOutputs={numOutputs} onNumOutputsChange={setNumOutputs}
          generating={generating} onGenerate={handleGenerate}
          creditEstimate={creditEstimate} promptBarRef={promptBarRef}
          onBack={() => setStep(4)}
        />
      )}
    </div>
  );
}
