import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, ImagePlus, Loader2, X, Paperclip } from "lucide-react";
import type { GenieGeneration, GenieSettings } from "@/hooks/use-genie-generations";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  generation: GenieGeneration | null;
  onGenerate: (prompt: string, settings: GenieSettings, refImages: string[], refMode: string, parentId?: string) => void;
  isGenerating: boolean;
  mode: "edit" | "variation";
}

const MODELS = [
  { value: "auto", label: "Auto" },
  { value: "google/gemini-3.1-flash-image-preview", label: "Fast" },
  { value: "google/gemini-3-pro-image-preview", label: "Pro" },
];

export function GenieVariationModal({ open, onOpenChange, generation, onGenerate, isGenerating, mode }: Props) {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("auto");
  const [numVariations, setNumVariations] = useState(1);
  const [additionalRefs, setAdditionalRefs] = useState<string[]>([]);

  if (!generation) return null;

  const settings = generation.settings || {};
  const title = mode === "edit"
    ? `Edit image — ${generation.prompt.slice(0, 40)}...`
    : `Generate variations — ${generation.prompt.slice(0, 40)}...`;

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    const refImages = [generation.output_url, ...additionalRefs];
    const genSettings: GenieSettings = {
      ...settings,
      model,
      num_variations: numVariations,
    };
    onGenerate(prompt, genSettings, refImages, "merge", generation.id);
    setPrompt("");
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) setAdditionalRefs((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>

        {/* Top — Configuration display */}
        <div className="grid grid-cols-[180px_1fr] gap-4">
          {/* Image preview */}
          <div className="rounded-lg overflow-hidden border border-border">
            <img src={generation.output_url} alt="" className="w-full aspect-square object-cover" />
          </div>

          {/* Metadata */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
              <MetaRow label="Category" value={settings.category || "—"} />
              <MetaRow label="Traffic Source" value={(settings.traffic_sources || []).join(", ") || "—"} />
              <MetaRow label="Aspect Ratio" value={settings.aspect_ratio || "Auto"} />
              <MetaRow label="AI Model" value={settings.model || "Auto"} />
              <MetaRow label="Quality" value={settings.quality || "Auto"} />
              <MetaRow label="Created" value={format(new Date(generation.created_at), "MMM d, yyyy · h:mm a")} />
            </div>

            {/* Reference images used */}
            {generation.reference_image_ids.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Reference images used</Label>
                <div className="flex gap-1.5">
                  {generation.reference_image_ids.slice(0, 4).map((ref, i) => (
                    <div key={i} className="w-10 h-10 rounded border border-border overflow-hidden">
                      <img src={ref} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {generation.reference_image_ids.length > 4 && (
                    <Badge variant="outline" className="text-[10px]">+{generation.reference_image_ids.length - 4}</Badge>
                  )}
                </div>
              </div>
            )}

            {/* Previous prompt */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Previous prompt</Label>
              <p className="text-xs text-foreground bg-muted/50 rounded-md p-2">{generation.prompt}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Bottom — Input area */}
        <div className="space-y-3">
          {/* Additional reference images */}
          {additionalRefs.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {additionalRefs.map((ref, i) => (
                <div key={i} className="relative w-12 h-12 rounded border border-border overflow-hidden group">
                  <img src={ref} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setAdditionalRefs((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-0 right-0 bg-background/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Prompt row */}
          <div className="flex gap-2 items-end">
            <label className="shrink-0">
              <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                <span><Paperclip className="h-4 w-4" /></span>
              </Button>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileAdd} />
            </label>

            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              placeholder={mode === "edit" ? "Describe the change (e.g. change background to blue)" : "Enter prompt for variations..."}
              className="flex-1 text-sm"
              disabled={isGenerating}
            />

            {/* Model */}
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-24 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Variations count */}
            <Input
              type="number"
              min={1}
              max={6}
              value={numVariations}
              onChange={(e) => setNumVariations(Math.max(1, Math.min(6, +e.target.value)))}
              className="w-14 h-9 text-xs text-center"
            />

            <Button onClick={handleSubmit} disabled={isGenerating || !prompt.trim()} size="icon" className="h-9 w-9 shrink-0">
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}:</span>{" "}
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}
