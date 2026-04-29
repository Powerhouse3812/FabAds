import { useState } from "react";
import { Sparkles, ChevronRight, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { GenieAdvancedSettings } from "./GenieAdvancedSettings";
import { GenieReferenceMedia } from "./GenieReferenceMedia";
import { GenieLibraryPickerModal } from "./GenieLibraryPickerModal";
import type { GenieSettings } from "@/hooks/use-genie-generations";

interface Props {
  onGenerate: (prompt: string, settings: GenieSettings, refImages: string[], refMode: "merge" | "separate") => void;
  isGenerating: boolean;
  initialRefs?: string[];
}

const QUICK_SUGGESTIONS = [
  "I need a poster for online store's season sale.",
  "Create a bold fitness ad with workout imagery.",
  "Design a health supplement product showcase.",
  "Make an eye-catching thumbnail for a video ad.",
];

const TRAFFIC_SOURCES = [
  { value: "newsbreak", label: "NewsBreak" },
  { value: "meta", label: "Meta" },
  { value: "tiktok", label: "TikTok" },
];

const AI_MODELS = [
  { value: "auto", label: "Auto" },
  { value: "google/gemini-3.1-flash-image-preview", label: "Fast (Flash)" },
  { value: "google/gemini-3-pro-image-preview", label: "High Quality (Pro)" },
];

function InfoTip({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help inline-block ml-1" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function GenieGenerationArea({ onGenerate, isGenerating, initialRefs = [] }: Props) {
  const [prompt, setPrompt] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);
  const [refImages, setRefImages] = useState<string[]>(initialRefs);
  const [refMode, setRefMode] = useState<"merge" | "separate">("merge");
  const [settings, setSettings] = useState<GenieSettings>({
    sentiment: "auto",
    aspect_ratio: "auto",
    quality: "auto",
    background: "auto",
    model: "auto",
    category: "",
    traffic_sources: [],
    num_variations: 1,
    override_ai_metadata: false,
  });

  const handleGenerate = () => {
    if (!prompt.trim() && refImages.length === 0) return;
    onGenerate(prompt, settings, refImages, refMode);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const removeTrafficSource = (val: string) => {
    setSettings({ ...settings, traffic_sources: (settings.traffic_sources || []).filter((v) => v !== val) });
  };

  const addTrafficSource = (val: string) => {
    const curr = settings.traffic_sources || [];
    if (!curr.includes(val)) {
      setSettings({ ...settings, traffic_sources: [...curr, val] });
    }
  };

  const availableSources = TRAFFIC_SOURCES.filter(
    (ts) => !(settings.traffic_sources || []).includes(ts.value)
  );

  return (
    <div className="rounded-lg bg-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          Generate images with Genie <Sparkles className="h-4 w-4 text-primary" />
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground h-8 gap-1"
          onClick={() => setShowAdvanced(true)}
        >
          Advance settings <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Reference Media — always visible */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground flex items-center">
          Reference media <InfoTip text="Upload reference images to guide AI's visual style, layout or theme." />
        </Label>
        <GenieReferenceMedia
          images={refImages}
          onChange={setRefImages}
          referenceMode={refMode}
          onModeChange={setRefMode}
          onSelectFromLibrary={() => setShowLibraryPicker(true)}
        />
      </div>

      {/* Template */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground flex items-center">
          Template <InfoTip text="Use a predefined template for consistent ad generation." />
        </Label>
        <Select defaultValue="">
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Select template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none" className="text-sm">No template</SelectItem>
            <SelectItem value="product-showcase" className="text-sm">Product Showcase</SelectItem>
            <SelectItem value="discount-banner" className="text-sm">Discount Banner</SelectItem>
            <SelectItem value="lifestyle" className="text-sm">Lifestyle Ad</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category + Traffic Source — side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Category</Label>
          <Input
            value={settings.category || ""}
            onChange={(e) => setSettings({ ...settings, category: e.target.value })}
            placeholder="e.g. Medicare"
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center">
            Traffic source <InfoTip text="Select which ad platforms these images are intended for." />
          </Label>
          <div className="flex items-center gap-1.5 flex-wrap min-h-[36px] rounded-md border border-input bg-background px-2 py-1">
            {(settings.traffic_sources || []).map((val) => {
              const ts = TRAFFIC_SOURCES.find((t) => t.value === val);
              return (
                <span
                  key={val}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-muted text-foreground"
                >
                  {ts?.label || val}
                  <button onClick={() => removeTrafficSource(val)} className="text-muted-foreground hover:text-foreground">
                    ×
                  </button>
                </span>
              );
            })}
            {availableSources.length > 0 && (
              <Select onValueChange={addTrafficSource} value="">
                <SelectTrigger className="h-6 w-6 border-0 bg-transparent p-0 [&>svg]:h-3 [&>svg]:w-3">
                  <span className="sr-only">Add source</span>
                </SelectTrigger>
                <SelectContent>
                  {availableSources.map((ts) => (
                    <SelectItem key={ts.value} value={ts.value} className="text-xs">{ts.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Variations + AI Model — side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">No. of image variation</Label>
          <Input
            type="number"
            min={1}
            max={6}
            value={String(settings.num_variations || 1).padStart(2, "0")}
            onChange={(e) => setSettings({ ...settings, num_variations: Math.max(1, Math.min(6, +e.target.value)) })}
            className="h-9 text-sm w-full"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center">
            AI model <InfoTip text="Select which AI model to use for generation." />
          </Label>
          <Select value={settings.model || "auto"} onValueChange={(v) => setSettings({ ...settings, model: v })}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AI_MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value} className="text-sm">{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Element analysis checkbox */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="element-analysis"
          checked={settings.override_ai_metadata || false}
          onCheckedChange={(v) => setSettings({ ...settings, override_ai_metadata: !!v })}
        />
        <label htmlFor="element-analysis" className="text-xs text-foreground cursor-pointer flex items-center">
          Element analysis <InfoTip text="Analyzes reference image elements for better results." />
          <span className="text-muted-foreground ml-1">(Recommended for E-Commerce)</span>
        </label>
      </div>

      {/* Quick suggestion cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {QUICK_SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setPrompt(s)}
            className="text-left p-3 text-xs rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors leading-relaxed"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Prompt + Generate — at the bottom */}
      <div className="flex gap-2 items-end">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter prompt here, e.g. Create a bold poster announcing 40% OFF on Burn gym"
          className="flex-1 text-sm min-h-[44px] max-h-[120px] resize-none"
          rows={1}
          disabled={isGenerating}
        />
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || (!prompt.trim() && refImages.length === 0)}
          className="shrink-0 h-[44px] px-5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-1.5" />
              Generate
            </>
          )}
        </Button>
      </div>

      {/* Advanced Settings Sheet */}
      <Sheet open={showAdvanced} onOpenChange={setShowAdvanced}>
        <SheetContent className="w-[340px] sm:w-[380px]">
          <SheetHeader>
            <SheetTitle className="text-sm font-semibold">Advanced Settings</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <GenieAdvancedSettings settings={settings} onChange={setSettings} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Library Picker Modal */}
      <GenieLibraryPickerModal
        open={showLibraryPicker}
        onOpenChange={setShowLibraryPicker}
        onConfirm={(urls) => {
          const remaining = 20 - refImages.length;
          setRefImages([...refImages, ...urls.slice(0, remaining)]);
        }}
        maxSelectable={Math.max(0, 20 - refImages.length)}
      />
    </div>
  );
}
