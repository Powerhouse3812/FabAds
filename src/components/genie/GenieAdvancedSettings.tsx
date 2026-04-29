import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { GenieSettings } from "@/hooks/use-genie-generations";

interface Props {
  settings: GenieSettings;
  onChange: (s: GenieSettings) => void;
}

const SENTIMENTS = ["auto", "Excited", "Calm", "Urgent", "Luxurious", "Playful", "Professional", "Bold"];
const ASPECT_RATIOS = ["auto", "1:1", "9:16", "16:9", "4:5", "3:2"];
const QUALITIES = ["auto", "high", "medium", "low"];
const BACKGROUNDS = ["auto", "transparent", "opaque"];

export function GenieAdvancedSettings({ settings, onChange }: Props) {
  const update = (key: keyof GenieSettings, value: any) =>
    onChange({ ...settings, [key]: value });

  return (
    <div className="space-y-5">
      {/* Sentiment */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Sentiment</Label>
        <Select value={settings.sentiment || "auto"} onValueChange={(v) => update("sentiment", v)}>
          <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {SENTIMENTS.map((s) => (
              <SelectItem key={s} value={s} className="text-sm">{s === "auto" ? "Auto" : s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Aspect Ratio */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Aspect Ratio</Label>
        <div className="flex flex-wrap gap-1.5">
          {ASPECT_RATIOS.map((ar) => (
            <button
              key={ar}
              type="button"
              onClick={() => update("aspect_ratio", ar)}
              className={`px-2.5 py-1.5 text-xs rounded-md border transition-colors ${
                (settings.aspect_ratio || "auto") === ar
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-accent"
              }`}
            >
              {ar === "auto" ? "Auto" : ar}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Quality */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Quality</Label>
        <div className="flex flex-wrap gap-1.5">
          {QUALITIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => update("quality", q)}
              className={`px-2.5 py-1.5 text-xs rounded-md border transition-colors capitalize ${
                (settings.quality || "auto") === q
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-accent"
              }`}
            >
              {q === "auto" ? "Auto" : q}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Background */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Background</Label>
        <div className="flex flex-wrap gap-1.5">
          {BACKGROUNDS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => update("background", b)}
              className={`px-2.5 py-1.5 text-xs rounded-md border transition-colors capitalize ${
                (settings.background || "auto") === b
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-accent"
              }`}
            >
              {b === "auto" ? "Auto" : b}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
