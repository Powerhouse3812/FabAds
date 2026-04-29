import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { TONE_OPTIONS, STYLE_OPTIONS, ASPECT_RATIOS } from "@/lib/genie2-dummy-data";

interface AssetModeProps {
  sceneIdea: string;
  onSceneIdeaChange: (v: string) => void;
  backgroundType: string;
  onBackgroundTypeChange: (v: string) => void;
  moodLighting: string;
  onMoodLightingChange: (v: string) => void;
  withModel: boolean;
  onWithModelChange: (v: boolean) => void;
}

interface Props {
  audience: string;
  onAudienceChange: (v: string) => void;
  tone: string;
  onToneChange: (v: string) => void;
  style: string;
  onStyleChange: (v: string) => void;
  aspectRatio: string;
  onAspectRatioChange: (v: string) => void;
  removeMetadata: boolean;
  onRemoveMetadataChange: (v: boolean) => void;
  isAssetMode?: boolean;
  assetProps?: AssetModeProps;
}

export function Genie2TuneControls({
  audience, onAudienceChange,
  tone, onToneChange,
  style, onStyleChange,
  aspectRatio, onAspectRatioChange,
  removeMetadata, onRemoveMetadataChange,
  isAssetMode, assetProps,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-all duration-200 py-1 group">
        <SlidersHorizontal className={cn("h-3.5 w-3.5 transition-transform duration-300", open && "rotate-90")} />
        <span className="font-medium">Tune output</span>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[420px] space-y-4 p-4">
        {isAssetMode && assetProps ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Scene Idea</Label>
              <Input placeholder="e.g. Morning vanity with fresh flowers" value={assetProps.sceneIdea} onChange={(e) => assetProps.onSceneIdeaChange(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Background Type</Label>
              <Input placeholder="e.g. White marble surface" value={assetProps.backgroundType} onChange={(e) => assetProps.onBackgroundTypeChange(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Mood / Lighting</Label>
              <Input placeholder="e.g. Warm golden hour, soft fill" value={assetProps.moodLighting} onChange={(e) => assetProps.onMoodLightingChange(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">With Model</Label>
              <Switch checked={assetProps.withModel} onCheckedChange={assetProps.onWithModelChange} />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Audience</Label>
              <Input placeholder="e.g. Women 25-45" value={audience} onChange={(e) => onAudienceChange(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tone</Label>
              <Select value={tone} onValueChange={onToneChange}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{TONE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Style</Label>
              <div className="flex gap-1.5 flex-wrap">
                {STYLE_OPTIONS.map((s) => (
                  <button key={s} onClick={() => onStyleChange(s === style ? "" : s)}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs font-medium transition-all duration-200",
                      style === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-primary/40"
                    )}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="border-t pt-3 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Aspect Ratio</Label>
            <div className="flex gap-2">
              {ASPECT_RATIOS.map((ar) => (
                <button key={ar.value} onClick={() => onAspectRatioChange(ar.value)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                    aspectRatio === ar.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-primary/40"
                  )}>{ar.label}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Remove Metadata</Label>
            <Switch checked={removeMetadata} onCheckedChange={onRemoveMetadataChange} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
