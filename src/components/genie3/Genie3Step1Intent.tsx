import { ImageIcon, FileText, ShoppingBag, Megaphone, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { IntentType, PurposeType, EcomFocusType } from "@/lib/genie3-data";

const ICONS = { ImageIcon, FileText, Video, ShoppingBag, Megaphone };

interface Props {
  intent: IntentType;
  onIntentChange: (v: IntentType) => void;
  purpose: PurposeType;
  onPurposeChange: (v: PurposeType) => void;
  ecomFocus: EcomFocusType;
  onEcomFocusChange: (v: EcomFocusType) => void;
  onNext: () => void;
}

type BaseIntent = "creative" | "adcopy";

export function Genie3Step1Intent({
  intent, onIntentChange, purpose, onPurposeChange, ecomFocus, onEcomFocusChange, onNext,
}: Props) {
  const baseIntent: BaseIntent = intent === "adcopy" ? "adcopy" : "creative";
  const creativeSubType = intent === "creative-video" ? "creative-video" : "creative-image";

  const setBaseIntent = (v: BaseIntent) => {
    if (v === "adcopy") onIntentChange("adcopy");
    else onIntentChange(creativeSubType);
  };

  return (
    <div className="space-y-6">
      {/* What are you creating? */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">What are you creating?</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            { value: "creative" as BaseIntent, label: "Creative (Image/Video)", desc: "Generate ad images or videos", Icon: ImageIcon },
            { value: "adcopy" as BaseIntent, label: "Ad Copy", desc: "Full ad copy package", Icon: FileText },
          ]).map(({ value, label, desc, Icon }) => (
            <button
              key={value}
              onClick={() => setBaseIntent(value)}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-4 text-left transition-all hover:border-primary/60",
                baseIntent === value && "border-primary bg-primary/5 ring-1 ring-primary/30"
              )}
            >
              <div className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                baseIntent === value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Creative sub-type chips */}
        {baseIntent === "creative" && (
          <div className="flex gap-2 ml-1">
            {([
              { value: "creative-image" as IntentType, label: "Image", Icon: ImageIcon },
              { value: "creative-video" as IntentType, label: "Video", Icon: Video },
            ]).map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => onIntentChange(value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  intent === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Creating for */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Creating for</h3>
        <div className="flex gap-2">
          {([
            { value: "ecommerce" as PurposeType, label: "E-commerce", Icon: ShoppingBag },
            { value: "affiliate" as PurposeType, label: "Affiliate", Icon: Megaphone },
          ]).map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => onPurposeChange(value)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all",
                purpose === value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* E-commerce focus toggle */}
        {purpose === "ecommerce" && (
          <div className="flex gap-2 ml-1">
            {([
              { value: "product" as EcomFocusType, label: "Product focused" },
              { value: "brand" as EcomFocusType, label: "Brand focused" },
            ]).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onEcomFocusChange(value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  ecomFocus === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button size="sm" onClick={onNext}>Next</Button>
      </div>
    </div>
  );
}
