import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const ASSET_TYPES = [
  { value: "studio_shot", label: "Studio Shot" },
  { value: "model_shot", label: "Model Shot" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "flat_lay", label: "Flat Lay" },
  { value: "in_use", label: "In-Use" },
  { value: "packshot", label: "Packshot" },
  { value: "premium_hero", label: "Premium Hero" },
  { value: "packaging_closeup", label: "Packaging Close-up" },
  { value: "seasonal_scene", label: "Seasonal Scene" },
  { value: "social_organic", label: "Social Organic" },
];

interface Props {
  assetType: string;
  onAssetTypeChange: (v: string) => void;
}

export function Genie5ProductAssetInputs({ assetType, onAssetTypeChange }: Props) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground">Asset Type</Label>
      <div className="flex gap-1.5 flex-wrap">
        {ASSET_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => onAssetTypeChange(t.value)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
              assetType === t.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/40"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
