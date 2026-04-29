import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { TONE_OPTIONS, STYLE_OPTIONS } from "@/lib/genie2-dummy-data";
import { ECOM_SCENE_CHIPS, ECOM_MOOD_CHIPS } from "@/lib/genie3-data";
import { Genie2PromptBar } from "@/components/genie2/Genie2PromptBar";
import { Genie2SuggestionChips } from "@/components/genie2/Genie2SuggestionChips";
import type { IntentType, PurposeType } from "@/lib/genie3-data";
import type { BrandProfile } from "@/lib/genie2-dummy-data";

interface Props {
  intent: IntentType;
  purpose: PurposeType;
  productCategory: string;
  hasGenerated: boolean;
  prompt: string;
  onPromptChange: (v: string) => void;
  model: string;
  onModelChange: (v: string) => void;
  numOutputs: number;
  onNumOutputsChange: (v: number) => void;
  generating: boolean;
  onGenerate: () => void;
  creditEstimate: number;
  promptBarRef?: React.Ref<HTMLDivElement>;
  onBack: () => void;
}

export function Genie3Step3Refine({
  intent, purpose, productCategory, hasGenerated,
  prompt, onPromptChange,
  model, onModelChange,
  numOutputs, onNumOutputsChange,
  generating, onGenerate, creditEstimate,
  promptBarRef, onBack,
}: Props) {
  const [tuneOpen, setTuneOpen] = useState(false);
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("");
  const [style, setStyle] = useState("");
  const [scene, setScene] = useState("");
  const [mood, setMood] = useState("");

  const handleChipClick = useCallback((snippet: string) => {
    onPromptChange(prompt ? `${prompt}. ${snippet}` : snippet);
  }, [prompt, onPromptChange]);

  return (
    <div className="space-y-4">
      {/* Suggestion chips */}
      <Genie2SuggestionChips
        category={productCategory}
        hasGenerated={hasGenerated}
        onChipClick={handleChipClick}
      />

      {/* E-commerce scene/mood chips */}
      {purpose === "ecommerce" && (
        <div className="flex flex-wrap gap-2">
          {ECOM_SCENE_CHIPS.map((s) => (
            <button
              key={s}
              onClick={() => { setScene(s === scene ? "" : s); handleChipClick(`Scene: ${s}`); }}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                scene === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Prompt bar */}
      <Genie2PromptBar
        ref={promptBarRef}
        prompt={prompt}
        onPromptChange={onPromptChange}
        model={model}
        onModelChange={onModelChange}
        numOutputs={numOutputs}
        onNumOutputsChange={onNumOutputsChange}
        generating={generating}
        onGenerate={onGenerate}
        creditEstimate={creditEstimate}
        placeholder={
          intent === "adcopy"
            ? "Describe the ad you want — angle, tone, audience..."
            : "What do you want to create today?"
        }
      />

      {/* Tune output — collapsible */}
      <Collapsible open={tuneOpen} onOpenChange={setTuneOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="font-medium">Tune output</span>
          <ChevronDown className={cn("h-3 w-3 transition-transform", tuneOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-4 rounded-lg border bg-card p-4 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-[140px] space-y-1.5">
              <Label className="text-xs text-muted-foreground">Audience</Label>
              <Input placeholder="e.g. Women 25-45" value={audience} onChange={(e) => setAudience(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="w-[120px] space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <Label className="text-xs text-muted-foreground">Style</Label>
              <div className="flex gap-1.5 flex-wrap">
                {STYLE_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStyle(s === style ? "" : s)}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                      style === s ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex justify-start pt-1">
        <Button variant="ghost" size="sm" onClick={onBack}>Back</Button>
      </div>
    </div>
  );
}
