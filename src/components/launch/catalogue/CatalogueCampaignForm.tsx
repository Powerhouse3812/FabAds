import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/launch/FieldError";
import { CatalogueProductSelector } from "./CatalogueProductSelector";
import type { LaunchCampaign } from "@/hooks/use-launch-data";

const OBJECTIVES = ["Conversions", "Traffic", "Awareness", "Engagement", "Leads", "App Installs"];
const BID_STRATEGIES = ["Lowest Cost", "Cost Cap", "Bid Cap", "Target Cost"];
const DELIVERY_TYPES = ["Standard", "Accelerated"];
const SPECIAL_AD_CATEGORIES = ["Credit", "Employment", "Housing", "Social Issues"];

interface Props {
  campaign: LaunchCampaign;
  onFieldChange: (field: string, value: any) => void;
  fieldErrors: Record<string, string>;
}

export function CatalogueCampaignForm({ campaign, onFieldChange, fieldErrors }: Props) {
  const override = ((campaign as any).catalogue_ads_override || {}) as Record<string, any>;
  const overrideEnabled = override.enabled || false;
  const isCBO = (campaign.budget_type || "CBO") === "CBO";

  const updateOverride = (key: string, value: any) => {
    onFieldChange("catalogue_ads_override", { ...override, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Objective */}
        <div className="space-y-1" data-field="objective" id="objective">
          <Label className="text-xs">Objective <span className="text-destructive">*</span></Label>
          <Select value={campaign.objective || ""} onValueChange={(v) => onFieldChange("objective", v)}>
            <SelectTrigger className={`h-8 text-xs ${fieldErrors.objective ? "border-destructive" : ""}`}>
              <SelectValue placeholder="Select objective" />
            </SelectTrigger>
            <SelectContent>{OBJECTIVES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
          <FieldError error={fieldErrors.objective} />
        </div>

        {/* Budget Type */}
        <div className="space-y-1">
          <Label className="text-xs">Budget Optimization</Label>
          <RadioGroup value={campaign.budget_type || "CBO"} onValueChange={(v) => onFieldChange("budget_type", v)} className="flex gap-4 pt-1">
            <div className="flex items-center gap-1.5"><RadioGroupItem value="CBO" id="camp-cbo" /><Label htmlFor="camp-cbo" className="text-xs">CBO</Label></div>
            <div className="flex items-center gap-1.5"><RadioGroupItem value="ABO" id="camp-abo" /><Label htmlFor="camp-abo" className="text-xs">ABO</Label></div>
          </RadioGroup>
        </div>

        {/* Budget */}
        {isCBO && (
          <div className="space-y-1">
            <Label className="text-xs">Budget ($)</Label>
            <div className="flex gap-2">
              <Select value={campaign.budget_period || "daily"} onValueChange={(v) => onFieldChange("budget_period", v)}>
                <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
              <Input className="h-8 text-xs" type="number" min={0} placeholder="0.00" value={campaign.budget_value ?? ""} onChange={(e) => onFieldChange("budget_value", parseFloat(e.target.value) || null)} />
            </div>
          </div>
        )}

        {/* Bid Strategy */}
        <div className="space-y-1">
          <Label className="text-xs">Bid Strategy</Label>
          <Select value={campaign.bid_strategy || ""} onValueChange={(v) => onFieldChange("bid_strategy", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select strategy" /></SelectTrigger>
            <SelectContent>{BID_STRATEGIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {/* Delivery Type */}
        <div className="space-y-1">
          <Label className="text-xs">Delivery Type</Label>
          <Select value={campaign.delivery_type || ""} onValueChange={(v) => onFieldChange("delivery_type", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select delivery" /></SelectTrigger>
            <SelectContent>{DELIVERY_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {/* Special Ad Category */}
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Special Ad Category</Label>
          <div className="flex flex-wrap gap-1.5">
            {SPECIAL_AD_CATEGORIES.map((cat) => {
              const selected = (campaign.special_ad_category || []).includes(cat);
              return (
                <Button key={cat} type="button" variant={selected ? "default" : "outline"} size="sm" className="h-7 text-xs"
                  onClick={() => {
                    const current = campaign.special_ad_category || [];
                    onFieldChange("special_ad_category", selected ? current.filter((c: string) => c !== cat) : [...current, cat]);
                  }}
                >
                  {cat}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Catalogue Override */}
      <div className="space-y-3 rounded-md border border-border p-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Catalogue Override</Label>
          <Switch checked={overrideEnabled} onCheckedChange={(v) => updateOverride("enabled", v)} />
        </div>
        {overrideEnabled && (
          <div className="space-y-3">
            <CatalogueProductSelector
              selectedCatalogueId={override.catalogue_id || ""}
              selectedProductSetId=""
              onCatalogueChange={(v) => updateOverride("catalogue_id", v)}
              onProductSetChange={() => {}}
            />
            {fieldErrors.catalogue_override_id && <FieldError error={fieldErrors.catalogue_override_id} />}
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={override.include_other_products || false} onChange={(e) => updateOverride("include_other_products", e.target.checked)} className="h-3.5 w-3.5 rounded border-input" />
              <Label className="text-xs">Include other products from catalogue</Label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
