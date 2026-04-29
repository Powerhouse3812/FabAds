import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { FieldError } from "./FieldError";
import type { CampaignFormData, AdsetFormData, AdsFormData } from "@/lib/step2-defaults";

const OBJECTIVES = ["Conversions", "Traffic", "Awareness", "Engagement", "Leads", "App Installs"];
const BID_STRATEGIES = ["Lowest Cost", "Cost Cap", "Bid Cap", "Target Cost"];
const DELIVERY_TYPES = ["Standard", "Accelerated"];
const SPECIAL_AD_CATEGORIES = ["Credit", "Employment", "Housing", "Social Issues"];
const PERFORMANCE_GOALS = ["Maximize Conversions", "Maximize Link Clicks", "Maximize Impressions", "Maximize Reach", "Maximize Landing Page Views"];
const PRESET_LOCATIONS = ["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "India", "Brazil"];
const PRESET_INTERESTS = ["Technology", "Sports", "Fashion", "Food & Dining", "Travel", "Fitness", "Gaming", "Music"];
const PRESET_LANGUAGES = ["English", "Spanish", "French", "German", "Portuguese", "Arabic", "Hindi", "Chinese"];
const CONVERSION_LOCATIONS = ["Website", "App", "Messaging", "Calls"];
const EPC_KEYS = ["EPC-1", "EPC-2", "EPC-3", "EPC-4"];
const CTA_OPTIONS = ["Learn more", "Shop now", "Sign up", "Book now", "Download", "Get offer", "Contact us"];

const PLACEMENT_TREE = [
  { platform: "Facebook", positions: ["Feed", "Stories", "Reels", "In-stream", "Search"] },
  { platform: "Instagram", positions: ["Feed", "Stories", "Reels", "Explore"] },
  { platform: "Messenger", positions: ["Inbox", "Stories"] },
  { platform: "Audience Network", positions: ["Native, Banner, Interstitial", "Rewarded Video"] },
];

const DEVICE_OPTIONS = ["Desktop", "Mobile", "iOS"];
const OS_OPTIONS = ["All", "Android", "iOS"];

export interface TargetingFormFieldsProps {
  campaignData: CampaignFormData;
  adsetData: AdsetFormData;
  adsData: AdsFormData;
  onCampaignChange: (fields: Partial<CampaignFormData>) => void;
  onAdsetChange: (fields: Partial<AdsetFormData>) => void;
  onAdsChange: (fields: Partial<AdsFormData>) => void;
  fieldErrors: Record<string, string>;
  /** Prefix for field error keys and data-field attributes. Defaults to empty (generic keys). */
  fieldKeyPrefix?: string;
  /** Hide the Ads section (EPC Key + CTA) — used when Offers manages ads separately */
  hideAdsSection?: boolean;
  /** Hide Flexible Creative toggle — moved to Ads level in Offers */
  hideFlexibleCreative?: boolean;
  /** Hide Advantage+ Creative toggle — removed from Offers */
  hideAdvantagePlus?: boolean;
}

export function TargetingFormFields({
  campaignData,
  adsetData,
  adsData,
  onCampaignChange,
  onAdsetChange,
  onAdsChange,
  fieldErrors,
  fieldKeyPrefix = "",
  hideAdsSection = false,
  hideFlexibleCreative = false,
  hideAdvantagePlus = false,
}: TargetingFormFieldsProps) {
  const [budgetOpen, setBudgetOpen] = useState(true);
  const [suggestOpen, setSuggestOpen] = useState(false);

  const p = fieldKeyPrefix; // shorthand
  const fk = (key: string) => `${p}${key}`;

  const isCBO = (campaignData.budget_type || "CBO") === "CBO";
  const targeting = adsetData.targeting;
  const placements = adsetData.placements;
  const schedulingEnabled = !!targeting.scheduling_enabled;

  const updateTargeting = (key: string, value: any) => {
    onAdsetChange({ targeting: { ...targeting, [key]: value } as any });
  };

  const updatePlacements = (fields: Record<string, any>) => {
    onAdsetChange({ placements: { ...placements, ...fields } as any });
  };

  const toggleTag = (key: string, tag: string) => {
    const current: string[] = (targeting as any)[key] || [];
    const updated = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
    updateTargeting(key, updated);
  };

  const togglePlacement = (p: string) => {
    const current: string[] = placements.selected || [];
    updatePlacements({ selected: current.includes(p) ? current.filter((x) => x !== p) : [...current, p] });
  };

  const ageMin = targeting.age_min ?? 18;
  const ageMax = targeting.age_max ?? 65;

  return (
    <div className="space-y-6">
      {/* ─── Campaign Section ─── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Campaign</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Objective */}
          <div className="space-y-1.5" data-field={fk("objective")} id={fk("objective")}>
            <Label className="text-xs">Campaign Objective <span className="text-destructive">*</span></Label>
            <Select value={campaignData.objective || ""} onValueChange={(v) => onCampaignChange({ objective: v })}>
              <SelectTrigger className={fieldErrors[fk("objective")] ? "border-destructive" : ""}>
                <SelectValue placeholder="Select objective" />
              </SelectTrigger>
              <SelectContent>{OBJECTIVES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
            <FieldError error={fieldErrors[fk("objective")]} />
          </div>

          {/* Budget Type */}
          <div className="space-y-1.5">
            <Label className="text-xs">Budget Optimization</Label>
            <RadioGroup value={campaignData.budget_type || "CBO"} onValueChange={(v) => onCampaignChange({ budget_type: v })} className="flex gap-4">
              <div className="flex items-center gap-1.5"><RadioGroupItem value="CBO" id={fk("cbo")} /><Label htmlFor={fk("cbo")} className="text-xs">CBO</Label></div>
              <div className="flex items-center gap-1.5"><RadioGroupItem value="ABO" id={fk("abo")} /><Label htmlFor={fk("abo")} className="text-xs">ABO</Label></div>
            </RadioGroup>
          </div>

          {/* Budget Period + Value (CBO only) */}
          {isCBO && (
            <div className="space-y-1.5" data-field={fk("budget")} id={fk("budget")}>
              <Label className="text-xs">Budget ($) <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <Select value={campaignData.budget_period || "daily"} onValueChange={(v) => onCampaignChange({ budget_period: v })}>
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
                  value={campaignData.budget_value ?? ""}
                  onChange={(e) => onCampaignChange({ budget_value: parseFloat(e.target.value) || null })}
                  className={fieldErrors[fk("budget")] ? "border-destructive" : ""}
                />
              </div>
              <FieldError error={fieldErrors[fk("budget")]} />
            </div>
          )}

          {/* Bid Strategy */}
          <div className="space-y-1.5">
            <Label className="text-xs">Campaign Bid Strategy</Label>
            <Select value={campaignData.bid_strategy || ""} onValueChange={(v) => onCampaignChange({ bid_strategy: v })}>
              <SelectTrigger><SelectValue placeholder="Select strategy" /></SelectTrigger>
              <SelectContent>{BID_STRATEGIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* Delivery Type */}
          <div className="space-y-1.5">
            <Label className="text-xs">Delivery Type</Label>
            <Select value={campaignData.delivery_type || ""} onValueChange={(v) => onCampaignChange({ delivery_type: v })}>
              <SelectTrigger><SelectValue placeholder="Select delivery" /></SelectTrigger>
              <SelectContent>{DELIVERY_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* Special Ad Category */}
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Special Ad Category</Label>
            <div className="flex flex-wrap gap-2">
              {SPECIAL_AD_CATEGORIES.map((cat) => {
                const selected = (campaignData.special_ad_category || []).includes(cat);
                return (
                  <Button
                    key={cat}
                    type="button"
                    variant={selected ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const current = campaignData.special_ad_category || [];
                      onCampaignChange({ special_ad_category: selected ? current.filter((c) => c !== cat) : [...current, cat] });
                    }}
                  >
                    {cat}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Adset Section ─── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Adset</h3>

        {/* Performance Goal */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Performance Goal</Label>
            <Select value={adsetData.performance_goal || ""} onValueChange={(v) => onAdsetChange({ performance_goal: v })}>
              <SelectTrigger><SelectValue placeholder="Select goal" /></SelectTrigger>
              <SelectContent>{PERFORMANCE_GOALS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Conversion Location</Label>
            <Select value={adsetData.conversion_location || ""} onValueChange={(v) => onAdsetChange({ conversion_location: v })}>
              <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
              <SelectContent>{CONVERSION_LOCATIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {/* Targeting fields */}
        <div className="space-y-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Targeting</span>
          <div className="grid grid-cols-2 gap-4">
            {/* Include locations */}
            <div className="space-y-1.5" data-field={fk("locations")} id={fk("locations")}>
              <Label className="text-xs">Include Location <span className="text-destructive">*</span></Label>
              <SearchableMultiSelect
                options={PRESET_LOCATIONS}
                selected={targeting.locations || []}
                onChange={(v) => updateTargeting("locations", v)}
                placeholder="Search locations..."
                className={fieldErrors[fk("locations")] ? "[&>div]:border-destructive" : ""}
              />
              <FieldError error={fieldErrors[fk("locations")]} />
            </div>

            {/* Exclude locations */}
            <div className="space-y-1.5">
              <Label className="text-xs">Exclude Location</Label>
              <SearchableMultiSelect
                options={PRESET_LOCATIONS}
                selected={targeting.exclude_locations || []}
                onChange={(v) => updateTargeting("exclude_locations", v)}
                placeholder="Search locations..."
                chipVariant="destructive"
              />
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <Label className="text-xs">Gender</Label>
              <RadioGroup value={targeting.gender || "All"} onValueChange={(v) => updateTargeting("gender", v)} className="flex gap-4">
                {["All", "Male", "Female"].map((g) => (
                  <div key={g} className="flex items-center gap-1.5">
                    <RadioGroupItem value={g} id={fk(`gender-${g}`)} />
                    <Label htmlFor={fk(`gender-${g}`)} className="text-xs">{g}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Age Range */}
            <div className="space-y-2">
              <Label className="text-xs">Age: {ageMin} - {ageMax === 65 ? "65+" : ageMax}</Label>
              <Slider
                min={13}
                max={65}
                step={1}
                value={[ageMin, ageMax]}
                onValueChange={([min, max]) => {
                  onAdsetChange({ targeting: { ...targeting, age_min: min, age_max: max } as any });
                }}
                className="py-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                {[13, 18, 25, 35, 45, 55, 65].map((v) => <span key={v}>{v}{v === 65 ? "+" : ""}</span>)}
              </div>
            </div>

            {/* Interests */}
            <div className="space-y-1.5">
              <Label className="text-xs">Interests</Label>
              <SearchableMultiSelect
                options={PRESET_INTERESTS}
                selected={targeting.interests || []}
                onChange={(v) => updateTargeting("interests", v)}
                placeholder="Search interests..."
              />
            </div>

            {/* Languages */}
            <div className="space-y-1.5">
              <Label className="text-xs">Languages</Label>
              <SearchableMultiSelect
                options={PRESET_LANGUAGES}
                selected={targeting.languages || []}
                onChange={(v) => updateTargeting("languages", v)}
                placeholder="Search languages..."
              />
            </div>
          </div>
        </div>

        {/* Placements */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Placements</Label>
          <RadioGroup value={placements.mode || "automatic"} onValueChange={(v) => updatePlacements({ mode: v })} className="flex gap-4">
            <div className="flex items-center gap-1.5"><RadioGroupItem value="automatic" id={fk("placement-auto")} /><Label htmlFor={fk("placement-auto")} className="text-xs">Automatic</Label></div>
            <div className="flex items-center gap-1.5"><RadioGroupItem value="manual" id={fk("placement-manual")} /><Label htmlFor={fk("placement-manual")} className="text-xs">Manual</Label></div>
          </RadioGroup>
          {placements.mode === "manual" && (
            <div className="space-y-3 pl-2 border-l-2 border-border">
              {PLACEMENT_TREE.map((group) => (
                <div key={group.platform} className="space-y-1.5">
                  <span className="text-xs font-medium text-foreground">{group.platform}</span>
                  <div className="flex flex-wrap gap-1.5 pl-2">
                    {group.positions.map((pos) => {
                      const val = `${group.platform} ${pos}`;
                      const sel = (placements.selected || []).includes(val);
                      return (
                        <Button key={val} type="button" variant={sel ? "default" : "outline"} size="sm" className="text-xs h-7" onClick={() => togglePlacement(val)}>
                          {pos}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Devices & OS */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Devices</Label>
            <div className="flex flex-wrap gap-3">
              {DEVICE_OPTIONS.map((d) => {
                const checked = (adsetData.devices || []).includes(d);
                return (
                  <div key={d} className="flex items-center gap-1.5">
                    <Checkbox
                      id={fk(`device-${d}`)}
                      checked={checked}
                      onCheckedChange={(v) => {
                        const current = adsetData.devices || [];
                        onAdsetChange({ devices: v ? [...current, d] : current.filter((x) => x !== d) });
                      }}
                    />
                    <Label htmlFor={fk(`device-${d}`)} className="text-xs">{d}</Label>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Operating System</Label>
            <div className="flex flex-wrap gap-3">
              {OS_OPTIONS.map((o) => {
                const checked = (adsetData.os || []).includes(o);
                return (
                  <div key={o} className="flex items-center gap-1.5">
                    <Checkbox
                      id={fk(`os-${o}`)}
                      checked={checked}
                      onCheckedChange={(v) => {
                        const current = adsetData.os || [];
                        onAdsetChange({ os: v ? [...current, o] : current.filter((x) => x !== o) });
                      }}
                    />
                    <Label htmlFor={fk(`os-${o}`)} className="text-xs">{o}</Label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-2 gap-4">
          {!hideFlexibleCreative && (
            <div className="flex items-center gap-2">
              <Switch checked={adsetData.flexible_creative} onCheckedChange={(v) => onAdsetChange({ flexible_creative: v })} />
              <Label className="text-xs">Flexible Creative</Label>
            </div>
          )}
          {!hideAdvantagePlus && (
            <div className="flex items-center gap-2">
              <Switch checked={adsetData.advantage_plus_creative} onCheckedChange={(v) => onAdsetChange({ advantage_plus_creative: v })} />
              <Label className="text-xs">Advantage+ Creative Optimization</Label>
            </div>
          )}
        </div>

        {/* Budget and Schedule (collapsible) */}
        <Collapsible open={budgetOpen} onOpenChange={setBudgetOpen}>
          <CollapsibleTrigger asChild>
            <button type="button" className="flex items-center gap-2 text-sm font-medium text-foreground w-full py-1">
              <ChevronDown className={`h-4 w-4 transition-transform ${budgetOpen ? "" : "-rotate-90"}`} />
              Budget and Schedule
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="grid grid-cols-2 gap-4">
              {!isCBO && (
                <>
                  <div className="space-y-1.5" data-field={fk("adset-budget")} id={fk("adset-budget")}>
                    <Label className="text-xs">Budget ($) <span className="text-destructive">*</span></Label>
                    <div className="flex gap-2">
                      <Select value={adsetData.budget_period || "daily"} onValueChange={(v) => onAdsetChange({ budget_period: v })}>
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
                        value={adsetData.budget_value ?? ""}
                        onChange={(e) => onAdsetChange({ budget_value: parseFloat(e.target.value) || null })}
                        className={fieldErrors[fk("adset-budget")] ? "border-destructive" : ""}
                      />
                    </div>
                    <FieldError error={fieldErrors[fk("adset-budget")]} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Adset Bid Strategy</Label>
                    <Select value={adsetData.bid_strategy || ""} onValueChange={(v) => onAdsetChange({ bid_strategy: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{BID_STRATEGIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Delivery Type</Label>
                    <Select value={adsetData.delivery_type || ""} onValueChange={(v) => onAdsetChange({ delivery_type: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{DELIVERY_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Bid Amount ($)</Label>
                    <Input type="number" min={0} placeholder="0.00" value={adsetData.bid_amount ?? ""} onChange={(e) => onAdsetChange({ bid_amount: parseFloat(e.target.value) || null })} />
                  </div>
                </>
              )}

              {/* Scheduling */}
              <div className="col-span-2 space-y-2">
                <div className="flex items-center gap-2">
                  <Switch checked={schedulingEnabled} onCheckedChange={(v) => updateTargeting("scheduling_enabled", v)} />
                  <Label className="text-xs">Adset Scheduling</Label>
                </div>
                {schedulingEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5" data-field={fk("schedule-start")} id={fk("schedule-start")}>
                      <Label className="text-xs">Start Date <span className="text-destructive">*</span></Label>
                      <Input
                        type="datetime-local"
                        value={adsetData.schedule_start?.slice(0, 16) || ""}
                        onChange={(e) => onAdsetChange({ schedule_start: e.target.value ? new Date(e.target.value).toISOString() : null })}
                        className={fieldErrors[fk("schedule-start")] ? "border-destructive" : ""}
                      />
                      <FieldError error={fieldErrors[fk("schedule-start")]} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">End Date (optional)</Label>
                      <Input type="datetime-local" value={adsetData.schedule_end?.slice(0, 16) || ""} onChange={(e) => onAdsetChange({ schedule_end: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Beneficiary / Payor */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Beneficiary</Label>
            <Input value={adsetData.beneficiary || ""} onChange={(e) => onAdsetChange({ beneficiary: e.target.value || null })} placeholder="Enter beneficiary" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Payor</Label>
            <Input value={adsetData.payor || ""} onChange={(e) => onAdsetChange({ payor: e.target.value || null })} placeholder="Enter payor" />
          </div>
        </div>

        {/* Suggest audience (collapsible) */}
        <Collapsible open={suggestOpen} onOpenChange={setSuggestOpen}>
          <CollapsibleTrigger asChild>
            <button type="button" className="flex items-center gap-2 text-sm font-medium text-foreground w-full py-1">
              <ChevronDown className={`h-4 w-4 transition-transform ${suggestOpen ? "" : "-rotate-90"}`} />
              Suggest audience
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <p className="text-xs text-muted-foreground">
              Audience suggestions will be available when AI-Powered targeting is enabled. Configure interests, behaviors, and demographics above.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* ─── Ads Section ─── */}
      {!hideAdsSection && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Ads</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">EPC Key</Label>
              <Select value={adsData.epc_key || ""} onValueChange={(v) => onAdsChange({ epc_key: v })}>
                <SelectTrigger><SelectValue placeholder="Select EPC key" /></SelectTrigger>
                <SelectContent>{EPC_KEYS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CTA</Label>
              <Select value={adsData.cta || "Learn more"} onValueChange={(v) => onAdsChange({ cta: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CTA_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
