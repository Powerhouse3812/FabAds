import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sparkles, Loader2, Plus, Minus, Coins, ChevronRight, Paperclip, Upload, Link2, X } from "lucide-react";
import { toast } from "sonner";
import { MODEL_OPTIONS, CREDIT_PER_OUTPUT, PRODUCT_SUGGESTIONS, POST_GEN_SUGGESTIONS } from "@/lib/genie2-dummy-data";
import { cn } from "@/lib/utils";

interface ReferenceFile {
  id: string;
  name: string;
  type: "local" | "gdrive";
  previewUrl?: string;
  driveUrl?: string;
}

interface Props {
  model: string;
  onModelChange: (v: string) => void;
  numOutputs: number;
  onNumOutputsChange: (v: number) => void;
  generating: boolean;
  onGenerate: () => void;
  creditEstimate: number;
  barClass?: string;
  purpose?: string;
  ecomFocus?: string;
  intent?: string;
  prompt: string;
  onPromptChange: (v: string) => void;
  category: string;
  hasGenerated: boolean;
  onChipClick: (snippet: string) => void;
}

export function Genie5BottomBar({
  model, onModelChange, numOutputs, onNumOutputsChange,
  generating, onGenerate, creditEstimate,
  barClass = "",
  purpose, ecomFocus, intent,
  prompt, onPromptChange,
  category, hasGenerated, onChipClick,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [references, setReferences] = useState<ReferenceFile[]>([]);
  const [driveUrl, setDriveUrl] = useState("");
  const [refPopoverOpen, setRefPopoverOpen] = useState(false);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  }, [prompt]);

  const summaryItems = [
    purpose === "ecommerce" ? "E-com" : purpose === "affiliate" ? "Affiliate" : null,
    ecomFocus ? `${ecomFocus.charAt(0).toUpperCase() + ecomFocus.slice(1)} focused` : null,
    intent === "creative-image" ? "Image" : intent === "creative-video" ? "Video" : intent === "adcopy" ? "Ad Copy" : null,
    `${numOutputs} outputs`,
  ].filter(Boolean);

  const baseSuggestions = PRODUCT_SUGGESTIONS[category] || PRODUCT_SUGGESTIONS["General"];
  const chips = baseSuggestions.slice(0, 5);
  const refineChips = hasGenerated ? POST_GEN_SUGGESTIONS.slice(0, 3) : [];

  const handleLocalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setReferences((prev) => [...prev, {
      id: `local-${Date.now()}`,
      name: file.name,
      type: "local",
      previewUrl: url,
    }]);
    setRefPopoverOpen(false);
    toast.success("Reference file added");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddDriveUrl = () => {
    const url = driveUrl.trim();
    if (!url) return;
    if (!url.includes("drive.google.com") && !url.includes("docs.google.com")) {
      toast.error("Please paste a valid Google Drive link");
      return;
    }
    setReferences((prev) => [...prev, {
      id: `gdrive-${Date.now()}`,
      name: url.split("/").pop()?.substring(0, 30) || "Drive file",
      type: "gdrive",
      driveUrl: url,
    }]);
    setDriveUrl("");
    setRefPopoverOpen(false);
    toast.success("Google Drive link added");
  };

  const removeReference = (id: string) => {
    setReferences((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="sticky bottom-0 z-30 px-4 pb-3 pt-2">
      <div className={cn(
        "rounded-2xl border px-4 py-3 transition-all duration-300 space-y-2",
        barClass || "bg-card/80 backdrop-blur-lg border-border/60 shadow-lg"
      )}>
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Row 1: Reference + Suggestion Chips */}
          <div className="flex items-center gap-2 min-w-0 overflow-hidden">
            <Popover open={refPopoverOpen} onOpenChange={setRefPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-dashed text-muted-foreground hover:border-primary/40 hover:text-primary transition-all duration-200 hover:scale-105",
                    references.length > 0 && "border-primary/40 text-primary"
                  )}
                >
                  <Paperclip className="h-3 w-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3 space-y-3" align="start" side="top">
                <p className="text-xs font-medium">Add Reference</p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs gap-1.5 justify-start"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" /> Upload from device
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleLocalUpload} />
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Link2 className="h-3 w-3" /> Google Drive link
                    </div>
                    <div className="flex gap-1">
                      <Input
                        value={driveUrl}
                        onChange={(e) => setDriveUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddDriveUrl()}
                        placeholder="Paste Drive share URL…"
                        className="h-7 text-xs"
                      />
                      <Button variant="secondary" size="sm" className="h-7 text-xs px-2" onClick={handleAddDriveUrl}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Reference thumbnails */}
            {references.length > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                {references.map((ref) => (
                  <div key={ref.id} className="relative group">
                    {ref.previewUrl ? (
                      <img src={ref.previewUrl} alt="" className="h-6 w-6 rounded object-cover border border-primary/30" />
                    ) : (
                      <div className="h-6 w-6 rounded border border-primary/30 bg-primary/5 flex items-center justify-center">
                        <Link2 className="h-3 w-3 text-primary" />
                      </div>
                    )}
                    <button
                      onClick={() => removeReference(ref.id)}
                      className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-2 w-2" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto scrollbar-none">
              <span className="text-[10px] text-muted-foreground shrink-0">Try:</span>
              {chips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => onChipClick(chip.promptSnippet)}
                  className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:border-border transition-colors shrink-0 whitespace-nowrap"
                >
                  {chip.label}
                </button>
              ))}
              {refineChips.length > 0 && (
                <>
                  <span className="text-[10px] text-muted-foreground shrink-0 ml-1">Refine:</span>
                  {refineChips.map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => onChipClick(chip.promptSnippet)}
                      className="rounded-full border border-primary/20 px-2 py-0.5 text-[10px] text-primary/80 hover:text-primary hover:border-primary/40 transition-colors shrink-0 whitespace-nowrap"
                    >
                      {chip.label}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Row 2: Prompt Textarea */}
          <textarea
            ref={textareaRef}
            placeholder={intent === "adcopy" ? "Describe the ad you want... (optional)" : "Describe what you want to create (optional)"}
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            rows={1}
            className="w-full min-h-[32px] resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none leading-relaxed border-b border-border/30 pb-2"
          />

          {/* Row 3: Controls */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <Select value={model} onValueChange={onModelChange}>
                <SelectTrigger className="h-7 w-[90px] text-[11px] border-border/50 bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-0.5 rounded-lg border border-border/50 h-7 px-1">
                <button
                  className="px-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                  disabled={numOutputs <= 1}
                  onClick={() => onNumOutputsChange(Math.max(1, numOutputs - 1))}
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="text-[11px] font-medium w-4 text-center">{numOutputs}</span>
                <button
                  className="px-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                  disabled={numOutputs >= 6}
                  onClick={() => onNumOutputsChange(Math.min(6, numOutputs + 1))}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              <div className="h-4 w-px bg-border/40 mx-1 hidden sm:block" />

              <div className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground min-w-0 overflow-hidden">
                {summaryItems.map((item, i) => (
                  <span key={i} className="flex items-center gap-1 shrink-0">
                    {i > 0 && <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/40" />}
                    <span className="truncate">{item}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="secondary" className="h-7 gap-1 text-[11px] font-normal px-2.5">
                <Coins className="h-3 w-3" />
                ~{creditEstimate}
              </Badge>

              <Button
                size="sm"
                className={cn(
                  "h-8 px-5 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-all duration-300",
                  "hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02]",
                  generating && "pointer-events-none"
                )}
                onClick={onGenerate}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Generate
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
