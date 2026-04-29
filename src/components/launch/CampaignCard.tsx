import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TargetingFormFields } from "./TargetingFormFields";
import { STEP2_DEFAULTS } from "@/lib/step2-defaults";
import type { LaunchCampaign } from "@/hooks/use-launch-data";
import type { CampaignFormData, AdsetFormData, AdsFormData } from "@/lib/step2-defaults";

interface CampaignCardProps {
  campaign: LaunchCampaign;
  onChange: (fields: Partial<LaunchCampaign>) => void;
  fieldErrors?: Record<string, string>;
}

/** Maps LaunchCampaign DB entity to CampaignFormData for the shared fields component */
function toCampaignFormData(c: LaunchCampaign): CampaignFormData {
  return {
    objective: c.objective ?? null,
    budget_type: c.budget_type || "CBO",
    budget_period: c.budget_period || "daily",
    budget_value: c.budget_value ?? null,
    bid_strategy: c.bid_strategy || "Lowest Cost",
    delivery_type: c.delivery_type || "Standard",
    special_ad_category: c.special_ad_category || [],
  };
}

/** Remaps generic field error keys to entity-specific keys for the shared component */
function remapErrors(fieldErrors: Record<string, string>, campaignId: string): Record<string, string> {
  const prefix = `objective-${campaignId}`;
  const remapped: Record<string, string> = {};
  // Map entity-keyed errors to generic keys the shared component expects
  for (const [key, val] of Object.entries(fieldErrors)) {
    if (key === `objective-${campaignId}`) remapped["objective"] = val;
    else if (key === `budget-${campaignId}`) remapped["budget"] = val;
  }
  return remapped;
}

export function CampaignCard({ campaign, onChange, fieldErrors = {} }: CampaignCardProps) {
  const campaignFormData = toCampaignFormData(campaign);
  const remappedErrors = remapErrors(fieldErrors, campaign.id);

  // We only render the campaign section header + fields via a partial render approach
  // The shared TargetingFormFields renders ALL sections, but CampaignCard only needs campaign.
  // For now we render campaign fields inline to keep the Card chrome (name, status).
  // The shared component is used by the template drawer for the full form.

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Campaign</CardTitle>
            <CardDescription className="text-xs">
              Manage campaign objectives, budget strategy, and bidding method.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{campaign.status === "active" ? "Active" : "Paused"}</span>
            <Switch checked={campaign.status === "active"} onCheckedChange={(v) => onChange({ status: v ? "active" : "paused" })} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CampaignFieldsOnly
          data={campaignFormData}
          onChange={(fields) => onChange(fields as Partial<LaunchCampaign>)}
          fieldErrors={remappedErrors}
          nameInput={
            <div className="space-y-1.5">
              <Label className="text-xs">Campaign Name</Label>
              <Input value={campaign.name} onChange={(e) => onChange({ name: e.target.value })} />
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}

// Inline campaign fields that match the shared component's campaign section
// This avoids rendering the full TargetingFormFields (which includes adset+ads)
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FieldError } from "./FieldError";

const OBJECTIVES = ["Conversions", "Traffic", "Awareness", "Engagement", "Leads", "App Installs"];
const BID_STRATEGIES = ["Lowest Cost", "Cost Cap", "Bid Cap", "Target Cost"];
const DELIVERY_TYPES = ["Standard", "Accelerated"];
const SPECIAL_AD_CATEGORIES = ["Credit", "Employment", "Housing", "Social Issues"];

function CampaignFieldsOnly({
  data,
  onChange,
  fieldErrors,
  nameInput,
}: {
  data: CampaignFormData;
  onChange: (fields: Partial<CampaignFormData>) => void;
  fieldErrors: Record<string, string>;
  nameInput: React.ReactNode;
}) {
  const isCBO = (data.budget_type || "CBO") === "CBO";

  return (
    <div className="grid grid-cols-2 gap-4">
      {nameInput}

      <div className="space-y-1.5" data-field="objective" id="objective">
        <Label className="text-xs">Campaign Objective <span className="text-destructive">*</span></Label>
        <Select value={data.objective || ""} onValueChange={(v) => onChange({ objective: v })}>
          <SelectTrigger className={fieldErrors["objective"] ? "border-destructive" : ""}>
            <SelectValue placeholder="Select objective" />
          </SelectTrigger>
          <SelectContent>{OBJECTIVES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
        <FieldError error={fieldErrors["objective"]} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Budget Optimization</Label>
        <RadioGroup value={data.budget_type || "CBO"} onValueChange={(v) => onChange({ budget_type: v })} className="flex gap-4">
          <div className="flex items-center gap-1.5"><RadioGroupItem value="CBO" id="cbo" /><Label htmlFor="cbo" className="text-xs">CBO</Label></div>
          <div className="flex items-center gap-1.5"><RadioGroupItem value="ABO" id="abo" /><Label htmlFor="abo" className="text-xs">ABO</Label></div>
        </RadioGroup>
      </div>

      {isCBO && (
        <div className="space-y-1.5" data-field="budget" id="budget">
          <Label className="text-xs">Budget ($) <span className="text-destructive">*</span></Label>
          <div className="flex gap-2">
            <Select value={data.budget_period || "daily"} onValueChange={(v) => onChange({ budget_period: v })}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="lifetime">Lifetime</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              min={0}
              placeholder="0.00"
              value={data.budget_value ?? ""}
              onChange={(e) => onChange({ budget_value: parseFloat(e.target.value) || null })}
              className={fieldErrors["budget"] ? "border-destructive" : ""}
            />
          </div>
          <FieldError error={fieldErrors["budget"]} />
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs">Campaign Bid Strategy</Label>
        <Select value={data.bid_strategy || ""} onValueChange={(v) => onChange({ bid_strategy: v })}>
          <SelectTrigger><SelectValue placeholder="Select strategy" /></SelectTrigger>
          <SelectContent>{BID_STRATEGIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Delivery Type</Label>
        <Select value={data.delivery_type || ""} onValueChange={(v) => onChange({ delivery_type: v })}>
          <SelectTrigger><SelectValue placeholder="Select delivery" /></SelectTrigger>
          <SelectContent>{DELIVERY_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="col-span-2 space-y-1.5">
        <Label className="text-xs">Special Ad Category</Label>
        <div className="flex flex-wrap gap-2">
          {SPECIAL_AD_CATEGORIES.map((cat) => {
            const selected = (data.special_ad_category || []).includes(cat);
            return (
              <Button
                key={cat}
                type="button"
                variant={selected ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const current = data.special_ad_category || [];
                  onChange({ special_ad_category: selected ? current.filter((c) => c !== cat) : [...current, cat] });
                }}
              >
                {cat}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
