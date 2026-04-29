import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/launch/FieldError";
import { CatalogueProductSelector } from "./CatalogueProductSelector";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import type { LaunchAdset } from "@/hooks/use-launch-data";

const PERFORMANCE_GOALS = ["Maximize Conversions", "Maximize Link Clicks", "Maximize Impressions", "Maximize Reach"];
const CONVERSION_LOCATIONS = ["Website", "App", "Messaging", "Calls"];
const PRESET_LOCATIONS = ["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "India", "Brazil"];
const PRESET_INTERESTS = ["Technology", "Sports", "Fashion", "Food & Dining", "Travel", "Fitness", "Gaming", "Music"];
const PRESET_LANGUAGES = ["English", "Spanish", "French", "German", "Portuguese", "Arabic", "Hindi", "Chinese"];
const DEVICE_OPTIONS = ["Desktop", "Mobile", "iOS"];
const PLACEMENT_TREE = [
  { platform: "Facebook", positions: ["Feed", "Stories", "Reels", "In-stream", "Search"] },
  { platform: "Instagram", positions: ["Feed", "Stories", "Reels", "Explore"] },
  { platform: "Messenger", positions: ["Inbox", "Stories"] },
  { platform: "Audience Network", positions: ["Native, Banner, Interstitial", "Rewarded Video"] },
];

interface Props {
  adset: LaunchAdset;
  catalogueId: string; // resolved catalogue for this adset
  onFieldChange: (field: string, value: any) => void;
  fieldErrors: Record<string, string>;
}

export function CatalogueAdsetForm({ adset, catalogueId, onFieldChange, fieldErrors }: Props) {
  const targeting = (adset.targeting || {}) as Record<string, any>;
  const placements = (adset.placements || {}) as Record<string, any>;

  const updateTargeting = (key: string, value: any) => {
    onFieldChange("targeting", { ...targeting, [key]: value });
  };

  const ageMin = targeting.age_min ?? 18;
  const ageMax = targeting.age_max ?? 65;

  return (
    <div className="space-y-4">
      {/* Product Set */}
      <div data-field="product_set_id" id="product_set_id">
        <CatalogueProductSelector
          selectedCatalogueId={catalogueId}
          selectedProductSetId={targeting.product_set_id || ""}
          onCatalogueChange={() => {}} // catalogue is set at campaign/account level
          onProductSetChange={(v) => updateTargeting("product_set_id", v)}
        />
        <FieldError error={fieldErrors.product_set_id} />
      </div>

      {/* Performance goal */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Performance Goal</Label>
          <Select value={adset.performance_goal || ""} onValueChange={(v) => onFieldChange("performance_goal", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select goal" /></SelectTrigger>
            <SelectContent>{PERFORMANCE_GOALS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Conversion Location</Label>
          <Select value={targeting.conversion_location || ""} onValueChange={(v) => updateTargeting("conversion_location", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{CONVERSION_LOCATIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {/* Targeting */}
      <div className="space-y-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Targeting</span>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1" data-field="locations" id="locations">
            <Label className="text-xs">Locations <span className="text-destructive">*</span></Label>
            <SearchableMultiSelect
              options={PRESET_LOCATIONS}
              selected={targeting.locations || []}
              onChange={(v) => updateTargeting("locations", v)}
              placeholder="Search locations..."
              className={fieldErrors.locations ? "[&>div]:border-destructive" : ""}
            />
            <FieldError error={fieldErrors.locations} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Gender</Label>
            <RadioGroup value={targeting.gender || "All"} onValueChange={(v) => updateTargeting("gender", v)} className="flex gap-3 pt-1">
              {["All", "Male", "Female"].map((g) => (
                <div key={g} className="flex items-center gap-1"><RadioGroupItem value={g} id={`g-${g}`} /><Label htmlFor={`g-${g}`} className="text-xs">{g}</Label></div>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Age: {ageMin} - {ageMax === 65 ? "65+" : ageMax}</Label>
            <Slider min={13} max={65} step={1} value={[ageMin, ageMax]} onValueChange={([min, max]) => { updateTargeting("age_min", min); updateTargeting("age_max", max); }} className="py-1" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Interests</Label>
            <SearchableMultiSelect options={PRESET_INTERESTS} selected={targeting.interests || []} onChange={(v) => updateTargeting("interests", v)} placeholder="Search..." />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Languages</Label>
            <SearchableMultiSelect options={PRESET_LANGUAGES} selected={targeting.languages || []} onChange={(v) => updateTargeting("languages", v)} placeholder="Search..." />
          </div>
        </div>
      </div>

      {/* Placements */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Placements</Label>
        <RadioGroup value={placements.mode || "automatic"} onValueChange={(v) => onFieldChange("placements", { ...placements, mode: v })} className="flex gap-3">
          <div className="flex items-center gap-1"><RadioGroupItem value="automatic" id="p-auto" /><Label htmlFor="p-auto" className="text-xs">Automatic</Label></div>
          <div className="flex items-center gap-1"><RadioGroupItem value="manual" id="p-manual" /><Label htmlFor="p-manual" className="text-xs">Manual</Label></div>
        </RadioGroup>
        {placements.mode === "manual" && (
          <div className="space-y-2 pl-2 border-l-2 border-border">
            {PLACEMENT_TREE.map((group) => (
              <div key={group.platform} className="space-y-1">
                <span className="text-xs font-medium">{group.platform}</span>
                <div className="flex flex-wrap gap-1 pl-2">
                  {group.positions.map((pos) => {
                    const val = `${group.platform} ${pos}`;
                    const sel = (placements.selected || []).includes(val);
                    return (
                      <Button key={val} type="button" variant={sel ? "default" : "outline"} size="sm" className="text-xs h-6"
                        onClick={() => {
                          const current = placements.selected || [];
                          onFieldChange("placements", { ...placements, selected: sel ? current.filter((x: string) => x !== val) : [...current, val] });
                        }}
                      >{pos}</Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Devices */}
      <div className="space-y-1">
        <Label className="text-xs">Devices</Label>
        <div className="flex flex-wrap gap-3">
          {DEVICE_OPTIONS.map((d) => {
            const checked = (targeting.devices || []).includes(d);
            return (
              <div key={d} className="flex items-center gap-1.5">
                <Checkbox checked={checked} onCheckedChange={(v) => { const cur = targeting.devices || []; updateTargeting("devices", v ? [...cur, d] : cur.filter((x: string) => x !== d)); }} />
                <Label className="text-xs">{d}</Label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Schedule Start</Label>
          <Input className="h-8 text-xs" type="date" value={adset.schedule_start || ""} onChange={(e) => onFieldChange("schedule_start", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Schedule End</Label>
          <Input className="h-8 text-xs" type="date" value={adset.schedule_end || ""} onChange={(e) => onFieldChange("schedule_end", e.target.value)} />
        </div>
      </div>
    </div>
  );
}
