import { useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2, ChevronDown, Pencil, Image } from "lucide-react";
import { toast } from "sonner";
import { useTargetingTemplates } from "@/hooks/use-targeting-templates";
import { BulkEditAdsetsModal } from "./BulkEditAdsetsModal";
import { type AdDraft } from "./CreateAdDrawer";
import type { ReportEntity } from "@/lib/reports-dummy-data";

const CTA_OPTIONS = ["Book Now", "Learn More", "Shop Now", "Sign Up", "Download", "Contact Us", "Get Offer", "Apply Now"];

const PERFORMANCE_GOALS = ["Maximize Conversions", "Maximize Link Clicks", "Maximize Impressions", "Maximize Reach", "Maximize Landing Page Views"];
const BID_STRATEGIES = ["Lowest Cost", "Cost Cap", "Bid Cap", "Target Cost"];
const DEVICE_OPTIONS = ["Desktop", "Mobile", "iOS"];
const PRESET_LOCATIONS = ["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "India", "Brazil"];
const PRESET_INTERESTS = ["Technology", "Sports", "Fashion", "Food & Dining", "Travel", "Fitness", "Gaming", "Music"];
const PRESET_LANGUAGES = ["English", "Spanish", "French", "German", "Portuguese", "Arabic", "Hindi", "Chinese"];

export interface AdsetDraft {
  id: string;
  name: string;
  templateId: string;
  performance_goal: string;
  budget_value: number | null;
  budget_period: string;
  bid_strategy: string;
  bid_amount: number | null;
  placements_mode: "automatic" | "manual";
  devices: string[];
  schedule_start: string;
  schedule_end: string;
  locations: string[];
  exclude_locations: string[];
  interests: string[];
  languages: string[];
  gender: string;
  age_min: number;
  age_max: number;
  ads: AdDraft[];
}

function createBlankAd(): AdDraft {
  return {
    id: crypto.randomUUID(),
    name: "",
    primary_text: "",
    headline: "",
    description: "",
    cta: "",
    destination_url: "",
    display_link: "",
    media_type: "",
  };
}

function createBlankAdset(): AdsetDraft {
  return {
    id: crypto.randomUUID(),
    name: "",
    templateId: "",
    performance_goal: "Maximize Conversions",
    budget_value: null,
    budget_period: "daily",
    bid_strategy: "Lowest Cost",
    bid_amount: null,
    placements_mode: "automatic",
    devices: ["Desktop", "Mobile"],
    schedule_start: "",
    schedule_end: "",
    locations: [],
    exclude_locations: [],
    interests: [],
    languages: [],
    gender: "All",
    age_min: 18,
    age_max: 65,
    ads: [createBlankAd()],
  };
}

interface CreateAdsetDrawerProps {
  campaign: ReportEntity | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function CreateAdsetDrawer({ campaign, open, onOpenChange }: CreateAdsetDrawerProps) {
  const [adsets, setAdsets] = useState<AdsetDraft[]>([createBlankAdset()]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set([adsets[0]?.id]));
  const [bulkOpen, setBulkOpen] = useState(false);

  const { data: templates = [] } = useTargetingTemplates();

  const updateAdset = (id: string, fields: Partial<AdsetDraft>) => {
    setAdsets((prev) => prev.map((a) => (a.id === id ? { ...a, ...fields } : a)));
  };

  const applyTemplate = (adsetId: string, templateId: string) => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    const p = tpl.template_payload || {};
    updateAdset(adsetId, {
      templateId,
      locations: p.locations || [],
      exclude_locations: p.exclude_locations || [],
      interests: p.interests || [],
      languages: p.languages || [],
      gender: p.gender || "All",
      age_min: p.age_min ?? 18,
      age_max: p.age_max ?? 65,
    });
  };

  const addAdset = () => {
    const a = createBlankAdset();
    setAdsets((prev) => [...prev, a]);
    setExpandedIds((prev) => new Set(prev).add(a.id));
  };

  const removeAdset = (id: string) => {
    setAdsets((prev) => prev.filter((a) => a.id !== id));
    setCheckedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  /* ── Ad-level helpers ── */
  const addAdToAdset = (adsetId: string) => {
    setAdsets((prev) => prev.map((a) =>
      a.id === adsetId ? { ...a, ads: [...a.ads, createBlankAd()] } : a
    ));
  };

  const removeAdFromAdset = (adsetId: string, adId: string) => {
    setAdsets((prev) => prev.map((a) =>
      a.id === adsetId ? { ...a, ads: a.ads.filter((ad) => ad.id !== adId) } : a
    ));
  };

  const updateAdInAdset = (adsetId: string, adId: string, fields: Partial<AdDraft>) => {
    setAdsets((prev) => prev.map((a) =>
      a.id === adsetId
        ? { ...a, ads: a.ads.map((ad) => (ad.id === adId ? { ...ad, ...fields } : ad)) }
        : a
    ));
  };

  const handleBulkApply = (fields: Partial<AdsetDraft>) => {
    setAdsets((prev) =>
      prev.map((a) => (checkedIds.has(a.id) ? { ...a, ...fields } : a))
    );
    setBulkOpen(false);
    toast.success(`Bulk edit applied to ${checkedIds.size} ad sets`);
  };

  const handleCreate = () => {
    toast.success(`${adsets.length} ad set(s) created for "${campaign?.name}"`);
    onOpenChange(false);
    setAdsets([createBlankAdset()]);
    setCheckedIds(new Set());
  };

  if (!campaign) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle className="text-base">Add Ad Sets to "{campaign.name}"</SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="px-6 py-4 space-y-4">
              {adsets.map((adset, idx) => (
                <Collapsible
                  key={adset.id}
                  open={expandedIds.has(adset.id)}
                  onOpenChange={() => toggleExpand(adset.id)}
                >
                  <div className="border border-border rounded-lg bg-card">
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-t-lg">
                      <Checkbox
                        checked={checkedIds.has(adset.id)}
                        onCheckedChange={() => toggleCheck(adset.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <CollapsibleTrigger asChild>
                        <button className="flex items-center gap-1 flex-1 text-left">
                          <ChevronDown className={`h-4 w-4 transition-transform ${expandedIds.has(adset.id) ? "" : "-rotate-90"}`} />
                          <span className="text-sm font-medium text-foreground">
                            {adset.name || `Ad Set ${idx + 1}`}
                          </span>
                        </button>
                      </CollapsibleTrigger>
                      {adsets.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeAdset(adset.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      )}
                    </div>

                    <CollapsibleContent>
                      <div className="p-4 space-y-4">
                        {/* Name */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">Ad Set Name</Label>
                          <Input value={adset.name} onChange={(e) => updateAdset(adset.id, { name: e.target.value })} placeholder="Enter ad set name" />
                        </div>

                        {/* Template */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">Targeting Template</Label>
                          <Select value={adset.templateId} onValueChange={(v) => applyTemplate(adset.id, v)}>
                            <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                            <SelectContent>
                              {templates.map((t) => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Auto-filled targeting */}
                        <div className="space-y-3 rounded-md border border-border bg-muted/20 p-3">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Targeting</span>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Locations</Label>
                              <SearchableMultiSelect options={PRESET_LOCATIONS} selected={adset.locations} onChange={(v) => updateAdset(adset.id, { locations: v })} placeholder="Search locations..." />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Exclude Locations</Label>
                              <SearchableMultiSelect options={PRESET_LOCATIONS} selected={adset.exclude_locations} onChange={(v) => updateAdset(adset.id, { exclude_locations: v })} placeholder="Exclude..." chipVariant="destructive" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Interests</Label>
                              <SearchableMultiSelect options={PRESET_INTERESTS} selected={adset.interests} onChange={(v) => updateAdset(adset.id, { interests: v })} placeholder="Search interests..." />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Languages</Label>
                              <SearchableMultiSelect options={PRESET_LANGUAGES} selected={adset.languages} onChange={(v) => updateAdset(adset.id, { languages: v })} placeholder="Search languages..." />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Gender</Label>
                              <RadioGroup value={adset.gender} onValueChange={(v) => updateAdset(adset.id, { gender: v })} className="flex gap-3">
                                {["All", "Male", "Female"].map((g) => (
                                  <div key={g} className="flex items-center gap-1"><RadioGroupItem value={g} id={`${adset.id}-g-${g}`} /><Label htmlFor={`${adset.id}-g-${g}`} className="text-xs">{g}</Label></div>
                                ))}
                              </RadioGroup>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Age: {adset.age_min} – {adset.age_max === 65 ? "65+" : adset.age_max}</Label>
                              <Slider min={13} max={65} step={1} value={[adset.age_min, adset.age_max]} onValueChange={([min, max]) => updateAdset(adset.id, { age_min: min, age_max: max })} />
                            </div>
                          </div>
                        </div>

                        {/* Performance & Budget */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Performance Goal</Label>
                            <Select value={adset.performance_goal} onValueChange={(v) => updateAdset(adset.id, { performance_goal: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>{PERFORMANCE_GOALS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Budget</Label>
                            <div className="flex gap-2">
                              <Select value={adset.budget_period} onValueChange={(v) => updateAdset(adset.id, { budget_period: v })}>
                                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="lifetime">Lifetime</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input type="number" min={0} placeholder="0.00" value={adset.budget_value ?? ""} onChange={(e) => updateAdset(adset.id, { budget_value: parseFloat(e.target.value) || null })} />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Bid Strategy</Label>
                            <Select value={adset.bid_strategy} onValueChange={(v) => updateAdset(adset.id, { bid_strategy: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>{BID_STRATEGIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Bid Amount</Label>
                            <Input type="number" min={0} placeholder="0.00" value={adset.bid_amount ?? ""} onChange={(e) => updateAdset(adset.id, { bid_amount: parseFloat(e.target.value) || null })} />
                          </div>
                        </div>

                        {/* Placements & Devices */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Placements</Label>
                            <RadioGroup value={adset.placements_mode} onValueChange={(v: "automatic" | "manual") => updateAdset(adset.id, { placements_mode: v })} className="flex gap-3">
                              <div className="flex items-center gap-1"><RadioGroupItem value="automatic" id={`${adset.id}-pa`} /><Label htmlFor={`${adset.id}-pa`} className="text-xs">Automatic</Label></div>
                              <div className="flex items-center gap-1"><RadioGroupItem value="manual" id={`${adset.id}-pm`} /><Label htmlFor={`${adset.id}-pm`} className="text-xs">Manual</Label></div>
                            </RadioGroup>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Devices</Label>
                            <div className="flex flex-wrap gap-2">
                              {DEVICE_OPTIONS.map((d) => {
                                const checked = adset.devices.includes(d);
                                return (
                                  <div key={d} className="flex items-center gap-1">
                                    <Checkbox id={`${adset.id}-d-${d}`} checked={checked} onCheckedChange={(v) => updateAdset(adset.id, { devices: v ? [...adset.devices, d] : adset.devices.filter((x) => x !== d) })} />
                                    <Label htmlFor={`${adset.id}-d-${d}`} className="text-xs">{d}</Label>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Schedule */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Schedule Start</Label>
                            <Input type="date" value={adset.schedule_start} onChange={(e) => updateAdset(adset.id, { schedule_start: e.target.value })} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Schedule End</Label>
                            <Input type="date" value={adset.schedule_end} onChange={(e) => updateAdset(adset.id, { schedule_end: e.target.value })} />
                          </div>
                        </div>

                        {/* Ads Section */}
                        <div className="space-y-3 rounded-md border border-border bg-muted/20 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                              <Image className="h-3.5 w-3.5" /> Ads ({adset.ads.length})
                            </span>
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => addAdToAdset(adset.id)}>
                              <Plus className="h-3 w-3 mr-1" /> Add Ad
                            </Button>
                          </div>

                          {adset.ads.map((ad, adIdx) => (
                            <Collapsible key={ad.id} defaultOpen={adIdx === 0}>
                              <div className="border border-border rounded-md bg-card">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-t-md">
                                  <CollapsibleTrigger asChild>
                                    <button className="flex items-center gap-1 flex-1 text-left">
                                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="text-xs font-medium text-foreground">
                                        {ad.name || `Ad ${adIdx + 1}`}
                                      </span>
                                    </button>
                                  </CollapsibleTrigger>
                                  {adset.ads.length > 1 && (
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAdFromAdset(adset.id, ad.id)}>
                                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                                    </Button>
                                  )}
                                </div>
                                <CollapsibleContent>
                                  <div className="p-3 space-y-3">
                                    <div className="space-y-1.5">
                                      <Label className="text-xs">Ad Name</Label>
                                      <Input className="h-8 text-xs" value={ad.name} onChange={(e) => updateAdInAdset(adset.id, ad.id, { name: e.target.value })} placeholder="Enter ad name" />
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label className="text-xs">Media Type</Label>
                                      <Select value={ad.media_type} onValueChange={(v) => updateAdInAdset(adset.id, ad.id, { media_type: v })}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select type" /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="image">Image</SelectItem>
                                          <SelectItem value="video">Video</SelectItem>
                                          <SelectItem value="carousel">Carousel</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="rounded-md border border-dashed border-border p-4 flex items-center justify-center">
                                      <span className="text-xs text-muted-foreground">Drag & drop media or click to upload</span>
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label className="text-xs">Primary Text</Label>
                                      <Textarea className="text-xs" value={ad.primary_text} onChange={(e) => updateAdInAdset(adset.id, ad.id, { primary_text: e.target.value })} rows={2} placeholder="Enter primary text..." />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1.5">
                                        <Label className="text-xs">Headline</Label>
                                        <Input className="h-8 text-xs" value={ad.headline} onChange={(e) => updateAdInAdset(adset.id, ad.id, { headline: e.target.value })} placeholder="Headline..." />
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label className="text-xs">Description</Label>
                                        <Input className="h-8 text-xs" value={ad.description} onChange={(e) => updateAdInAdset(adset.id, ad.id, { description: e.target.value })} placeholder="Description..." />
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label className="text-xs">CTA</Label>
                                        <Select value={ad.cta} onValueChange={(v) => updateAdInAdset(adset.id, ad.id, { cta: v })}>
                                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select CTA" /></SelectTrigger>
                                          <SelectContent>{CTA_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-1.5">
                                        <Label className="text-xs">Destination URL</Label>
                                        <Input className="h-8 text-xs" value={ad.destination_url} onChange={(e) => updateAdInAdset(adset.id, ad.id, { destination_url: e.target.value })} placeholder="https://" />
                                      </div>
                                      <div className="space-y-1.5 col-span-2">
                                        <Label className="text-xs">Display Link</Label>
                                        <Input className="h-8 text-xs" value={ad.display_link} onChange={(e) => updateAdInAdset(adset.id, ad.id, { display_link: e.target.value })} placeholder="example.com" />
                                      </div>
                                    </div>
                                  </div>
                                </CollapsibleContent>
                              </div>
                            </Collapsible>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}

              <Button variant="outline" size="sm" className="w-full" onClick={addAdset}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Another Ad Set
              </Button>
            </div>
          </ScrollArea>

          {/* Bulk bar */}
          {checkedIds.size >= 2 && (
            <div className="px-6 py-3 border-t border-border bg-muted/30 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{checkedIds.size} selected</span>
              <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1" /> Bulk Edit
              </Button>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create {adsets.length > 1 ? `${adsets.length} Ad Sets` : "Ad Set"}</Button>
          </div>
        </SheetContent>
      </Sheet>

      <BulkEditAdsetsModal
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        count={checkedIds.size}
        onApply={handleBulkApply}
      />
    </>
  );
}
