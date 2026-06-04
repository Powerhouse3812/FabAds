import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { AdStatusControl } from "./AdStatusControl";
import { toAdStatus } from "@/lib/ad-status";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { FieldError } from "./FieldError";
import type { LaunchAdset } from "@/hooks/use-launch-data";

const PERFORMANCE_GOALS = ["Maximize Conversions", "Maximize Link Clicks", "Maximize Impressions", "Maximize Reach", "Maximize Landing Page Views"];
const BID_STRATEGIES = ["Lowest Cost", "Cost Cap", "Bid Cap", "Target Cost"];
const DELIVERY_TYPES = ["Standard", "Accelerated"];
const CONVERSION_LOCATIONS = ["Website", "App", "Messaging", "Calls"];

const PRESET_LOCATIONS = ["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "India", "Brazil"];
const PRESET_INTERESTS = ["Technology", "Sports", "Fashion", "Food & Dining", "Travel", "Fitness", "Gaming", "Music"];
const PRESET_LANGUAGES = ["English", "Spanish", "French", "German", "Portuguese", "Arabic", "Hindi", "Chinese"];

const PLACEMENT_TREE = [
  { platform: "Facebook", positions: ["Feed", "Stories", "Reels", "In-stream", "Search"] },
  { platform: "Instagram", positions: ["Feed", "Stories", "Reels", "Explore"] },
  { platform: "Messenger", positions: ["Inbox", "Stories"] },
  { platform: "Audience Network", positions: ["Native, Banner, Interstitial", "Rewarded Video"] },
];

const DEVICE_OPTIONS = ["Desktop", "Mobile", "iOS"];
const OS_OPTIONS = ["All", "Android", "iOS"];

interface AdsetCardProps {
  adset: LaunchAdset;
  budgetType: string | null;
  onChange: (fields: Partial<LaunchAdset>) => void;
  fieldErrors?: Record<string, string>;
}

export function AdsetCard({ adset, budgetType, onChange, fieldErrors = {} }: AdsetCardProps) {
  const [budgetOpen, setBudgetOpen] = useState(true);
  const [suggestOpen, setSuggestOpen] = useState(false);

  const targeting = (adset.targeting || {}) as Record<string, any>;
  const placements = (adset.placements || { mode: "automatic" }) as Record<string, any>;
  const schedulingEnabled = !!targeting.scheduling_enabled;

  const updateTargeting = (key: string, value: any) => {
    onChange({ targeting: { ...targeting, [key]: value } as any });
  };

  const updatePlacements = (fields: Record<string, any>) => {
    onChange({ placements: { ...placements, ...fields } as any });
  };

  const toggleTag = (key: string, tag: string) => {
    const current: string[] = targeting[key] || [];
    const updated = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
    updateTargeting(key, updated);
  };

  const togglePlacement = (val: string) => {
    const current: string[] = placements.selected || [];
    updatePlacements({ selected: current.includes(val) ? current.filter((x) => x !== val) : [...current, val] });
  };

  const ageMin = targeting.age_min ?? 18;
  const ageMax = targeting.age_max ?? 65;

  const devices: string[] = targeting.devices || ["Desktop", "Mobile"];
  const os: string[] = targeting.os || ["All"];

  return (
    <Card className="border-l-2 border-l-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">{adset.name || "Adset"}</CardTitle>
            <CardDescription className="text-xs">
              Set audience targeting, placements, scheduling, and budget allocation.
            </CardDescription>
          </div>
          <AdStatusControl
            value={toAdStatus(adset.status)}
            onChange={(s) => onChange({ status: s })}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Adset Name + Performance Goal + Conversion Location */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Adset Name</Label>
            <Input value={adset.name} onChange={(e) => onChange({ name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Performance Goal</Label>
            <Select value={adset.performance_goal || ""} onValueChange={(v) => onChange({ performance_goal: v })}>
              <SelectTrigger><SelectValue placeholder="Select goal" /></SelectTrigger>
              <SelectContent>{PERFORMANCE_GOALS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </div>
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
              {budgetType === "ABO" && (
                <>
                  <div className="space-y-1.5" data-field={`adset-budget-${adset.id}`} id={`adset-budget-${adset.id}`}>
                    <Label className="text-xs">Budget ($) <span className="text-destructive">*</span></Label>
                    <div className="flex gap-2">
                      <Select value={adset.budget_period || "daily"} onValueChange={(v) => onChange({ budget_period: v })}>
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
                        value={adset.budget_value ?? ""}
                        onChange={(e) => onChange({ budget_value: parseFloat(e.target.value) || null })}
                        className={fieldErrors[`adset-budget-${adset.id}`] ? "border-destructive" : ""}
                      />
                    </div>
                    <FieldError error={fieldErrors[`adset-budget-${adset.id}`]} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Adset Bid Strategy</Label>
                    <Select value={adset.bid_strategy || ""} onValueChange={(v) => onChange({ bid_strategy: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{BID_STRATEGIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Delivery Type</Label>
                    <Select value={adset.delivery_type || ""} onValueChange={(v) => onChange({ delivery_type: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{DELIVERY_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Bid Amount ($)</Label>
                    <Input type="number" min={0} placeholder="0.00" value={adset.bid_amount ?? ""} onChange={(e) => onChange({ bid_amount: parseFloat(e.target.value) || null })} />
                  </div>
                </>
              )}

              {/* Scheduling toggle */}
              <div className="col-span-2 space-y-2">
                <div className="flex items-center gap-2">
                  <Switch checked={schedulingEnabled} onCheckedChange={(v) => updateTargeting("scheduling_enabled", v)} />
                  <Label className="text-xs">Adset Scheduling</Label>
                </div>
                {schedulingEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5" data-field={`schedule-start-${adset.id}`} id={`schedule-start-${adset.id}`}>
                      <Label className="text-xs">Start Date <span className="text-destructive">*</span></Label>
                      <Input
                        type="datetime-local"
                        value={adset.schedule_start?.slice(0, 16) || ""}
                        onChange={(e) => onChange({ schedule_start: e.target.value ? new Date(e.target.value).toISOString() : null })}
                        className={fieldErrors[`schedule-start-${adset.id}`] ? "border-destructive" : ""}
                      />
                      <FieldError error={fieldErrors[`schedule-start-${adset.id}`]} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">End Date (optional)</Label>
                      <Input type="datetime-local" value={adset.schedule_end?.slice(0, 16) || ""} onChange={(e) => onChange({ schedule_end: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Targeting fields */}
        <div className="space-y-3">
          <span className="text-sm font-medium text-foreground">Targeting</span>
          <div className="grid grid-cols-2 gap-4">
            {/* Include locations */}
            <div className="space-y-1.5" data-field={`locations-${adset.id}`} id={`locations-${adset.id}`}>
              <Label className="text-xs">Include Location <span className="text-destructive">*</span></Label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_LOCATIONS.map((loc) => (
                  <Button key={loc} type="button" variant={(targeting.locations || []).includes(loc) ? "default" : "outline"} size="sm" className="text-xs h-7" onClick={() => toggleTag("locations", loc)}>
                    {loc}
                  </Button>
                ))}
              </div>
              <FieldError error={fieldErrors[`locations-${adset.id}`]} />
            </div>

            {/* Exclude locations */}
            <div className="space-y-1.5">
              <Label className="text-xs">Exclude Location</Label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_LOCATIONS.map((loc) => (
                  <Button key={loc} type="button" variant={(targeting.exclude_locations || []).includes(loc) ? "destructive" : "outline"} size="sm" className="text-xs h-7" onClick={() => toggleTag("exclude_locations", loc)}>
                    {loc}
                  </Button>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <Label className="text-xs">Gender</Label>
              <RadioGroup value={targeting.gender || "All"} onValueChange={(v) => updateTargeting("gender", v)} className="flex gap-4">
                {["All", "Male", "Female"].map((g) => (
                  <div key={g} className="flex items-center gap-1.5">
                    <RadioGroupItem value={g} id={`gender-${g}-${adset.id}`} />
                    <Label htmlFor={`gender-${g}-${adset.id}`} className="text-xs">{g}</Label>
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
                  updateTargeting("age_min", min);
                  updateTargeting("age_max", max);
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
              <div className="flex flex-wrap gap-1.5">
                {PRESET_INTERESTS.map((i) => (
                  <Button key={i} type="button" variant={(targeting.interests || []).includes(i) ? "default" : "outline"} size="sm" className="text-xs h-7" onClick={() => toggleTag("interests", i)}>
                    {i}
                  </Button>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="space-y-1.5">
              <Label className="text-xs">Languages</Label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_LANGUAGES.map((l) => (
                  <Button key={l} type="button" variant={(targeting.languages || []).includes(l) ? "default" : "outline"} size="sm" className="text-xs h-7" onClick={() => toggleTag("languages", l)}>
                    {l}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Placements with tree */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Placements</Label>
          <RadioGroup value={placements.mode || "automatic"} onValueChange={(v) => updatePlacements({ mode: v })} className="flex gap-4">
            <div className="flex items-center gap-1.5"><RadioGroupItem value="automatic" id={`auto-${adset.id}`} /><Label htmlFor={`auto-${adset.id}`} className="text-xs">Automatic</Label></div>
            <div className="flex items-center gap-1.5"><RadioGroupItem value="manual" id={`manual-${adset.id}`} /><Label htmlFor={`manual-${adset.id}`} className="text-xs">Manual</Label></div>
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
                const checked = devices.includes(d);
                return (
                  <div key={d} className="flex items-center gap-1.5">
                    <Checkbox
                      id={`device-${d}-${adset.id}`}
                      checked={checked}
                      onCheckedChange={(v) => {
                        const updated = v ? [...devices, d] : devices.filter((x) => x !== d);
                        updateTargeting("devices", updated);
                      }}
                    />
                    <Label htmlFor={`device-${d}-${adset.id}`} className="text-xs">{d}</Label>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Operating System</Label>
            <div className="flex flex-wrap gap-3">
              {OS_OPTIONS.map((o) => {
                const checked = os.includes(o);
                return (
                  <div key={o} className="flex items-center gap-1.5">
                    <Checkbox
                      id={`os-${o}-${adset.id}`}
                      checked={checked}
                      onCheckedChange={(v) => {
                        const updated = v ? [...os, o] : os.filter((x) => x !== o);
                        updateTargeting("os", updated);
                      }}
                    />
                    <Label htmlFor={`os-${o}-${adset.id}`} className="text-xs">{o}</Label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={!!targeting.flexible_creative} onCheckedChange={(v) => updateTargeting("flexible_creative", v)} />
            <Label className="text-xs">Flexible Creative</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={!!targeting.advantage_plus_creative} onCheckedChange={(v) => updateTargeting("advantage_plus_creative", v)} />
            <Label className="text-xs">Advantage+ Creative Optimization</Label>
          </div>
        </div>

        {/* Beneficiary / Payor */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Beneficiary</Label>
            <Input value={targeting.beneficiary || ""} onChange={(e) => updateTargeting("beneficiary", e.target.value || null)} placeholder="Enter beneficiary" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Payor</Label>
            <Input value={targeting.payor || ""} onChange={(e) => updateTargeting("payor", e.target.value || null)} placeholder="Enter payor" />
          </div>
        </div>

        {/* Conversion Location */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Conversion Location</Label>
            <Select value={targeting.conversion_location || ""} onValueChange={(v) => updateTargeting("conversion_location", v)}>
              <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
              <SelectContent>{CONVERSION_LOCATIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
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
      </CardContent>
    </Card>
  );
}
