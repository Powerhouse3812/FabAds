import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Check, Sparkles, ExternalLink, Info, FileDown } from "lucide-react";
import { FieldError } from "@/components/launch/FieldError";
import { DUMMY_CATALOGUES, DUMMY_PRODUCT_SETS, DUMMY_PRODUCT_IMAGES, PROMOTED_PRODUCT_PREFERENCES, DUMMY_ACCOUNT_DEFAULTS } from "@/lib/catalogue-dummy-data";
import { cn } from "@/lib/utils";
import type { LaunchAdAccount } from "@/hooks/use-launch-data";

const CTA_OPTIONS = ["Learn more", "Shop now", "Sign up", "Book now", "Download", "Get offer", "Contact us"];

interface Props {
  account: LaunchAdAccount;
  onFieldChange: (field: string, value: any) => void;
  fieldErrors: Record<string, string>;
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 flex-1">
      <div className="w-2 h-2 rounded-full bg-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">{title}</p>
          {action}
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function TagInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [inputVal, setInputVal] = useState("");
  const tags = value ? value.split("|||").filter(Boolean) : [];

  const addTag = () => {
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    const updated = [...tags, trimmed].join("|||");
    onChange(updated);
    setInputVal("");
  };

  const removeTag = (idx: number) => {
    const updated = tags.filter((_, i) => i !== idx).join("|||");
    onChange(updated);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 min-h-[36px]">
      {tags.map((tag, i) => (
        <Badge key={i} variant="secondary" className="text-xs gap-1 py-0.5 px-2">
          {tag}
          <button className="hover:text-destructive ml-0.5" onClick={() => removeTag(i)}>×</button>
        </Badge>
      ))}
      <input
        className="flex-1 min-w-[80px] text-xs bg-transparent outline-none placeholder:text-muted-foreground"
        placeholder={tags.length === 0 ? placeholder : "Type and press Enter"}
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
        onBlur={addTag}
      />
    </div>
  );
}

export function CatalogueAccountForm({ account, onFieldChange, fieldErrors }: Props) {
  const config = (account.setup_config || {}) as Record<string, any>;
  const catDefaults = config.catalogue_ads_defaults || {};
  const initialized = useRef(false);

  // Auto-fill dummy data if config is empty
  useEffect(() => {
    if (initialized.current) return;
    const hasData = config.website_url || config.page || catDefaults.catalogue_id;
    if (!hasData) {
      initialized.current = true;
      onFieldChange("setup_config", { ...DUMMY_ACCOUNT_DEFAULTS });
    } else {
      initialized.current = true;
    }
  }, []);

  const updateConfig = (key: string, value: any) => {
    onFieldChange("setup_config", { ...config, [key]: value });
  };

  const updateCatDefaults = (key: string, value: any) => {
    const updated = { ...catDefaults, [key]: value };
    onFieldChange("setup_config", { ...config, catalogue_ads_defaults: updated });
  };

  const [trackingOpen, setTrackingOpen] = useState(true);
  const [targetingOpen, setTargetingOpen] = useState(true);
  const [creativeOpen, setCreativeOpen] = useState(true);

  const isUrlValid = !!(config.website_url && config.website_url.startsWith("http"));

  // Resolve product set info for display
  const selectedCatId = catDefaults.catalogue_id || "";
  const productSets = DUMMY_PRODUCT_SETS[selectedCatId] || [];
  const selectedCat = DUMMY_CATALOGUES.find((c) => c.id === selectedCatId);

  return (
    <div className="space-y-5">
      {/* Section 1: Tracking & Structure */}
      <Collapsible open={trackingOpen} onOpenChange={setTrackingOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full">
          <SectionHeader
            title="Tracking and Structure"
            subtitle="Set on which traffic source, asset."
            action={
              <Button variant="outline" size="sm" className="text-xs shrink-0 h-7" onClick={(e) => e.stopPropagation()}>
                <FileDown className="h-3.5 w-3.5 mr-1" />
                Import from template
              </Button>
            }
          />
          <ChevronDown className={cn("h-4 w-4 transition-transform text-muted-foreground shrink-0 ml-2", trackingOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-4 pl-5">
          {/* Page + Pixel side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1" data-field="page">
              <Label className="text-xs">Page</Label>
              <Select value={config.page || ""} onValueChange={(v) => updateConfig("page", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select page" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="page-1">My Business Page</SelectItem>
                  <SelectItem value="page-2">Brand Page</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Pixel <span className="text-muted-foreground">(optional)</span></Label>
              <Select value={config.pixel || ""} onValueChange={(v) => updateConfig("pixel", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select pixel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pixel-1">Main Pixel</SelectItem>
                  <SelectItem value="pixel-2">Test Pixel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Website URL */}
          <div className="space-y-1" data-field="website_url" id="website_url">
            <Label className="text-xs">Website URL <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Input
                className={cn("h-8 text-xs pr-8", fieldErrors.website_url && "border-destructive")}
                placeholder="https://example.com"
                value={config.website_url || ""}
                onChange={(e) => updateConfig("website_url", e.target.value)}
              />
              {isUrlValid && (
                <Check className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
            </div>
            <FieldError error={fieldErrors.website_url} />
          </div>

          {/* URL Tags + Display Link */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">URL Tags <span className="text-muted-foreground">(optional)</span></Label>
              <Input className="h-8 text-xs" placeholder="utm_source=..." value={config.url_tags || ""} onChange={(e) => updateConfig("url_tags", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Display Link <span className="text-muted-foreground">(optional)</span></Label>
              <Input className="h-8 text-xs" placeholder="example.com" value={config.display_link || ""} onChange={(e) => updateConfig("display_link", e.target.value)} />
            </div>
          </div>

          {/* Strategy Structure */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1">
              <Label className="text-xs">Strategy structure</Label>
              <Info className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Input className="h-8 text-xs w-14 text-center" type="number" min={1} value={config.strategy_campaigns || 1} onChange={(e) => updateConfig("strategy_campaigns", parseInt(e.target.value) || 1)} />
                <span className="text-xs text-muted-foreground whitespace-nowrap">Campaign</span>
              </div>
              <span className="text-muted-foreground text-xs">:</span>
              <div className="flex items-center gap-1.5">
                <Input className="h-8 text-xs w-14 text-center" type="number" min={1} value={config.strategy_adsets || 1} onChange={(e) => updateConfig("strategy_adsets", parseInt(e.target.value) || 1)} />
                <span className="text-xs text-muted-foreground whitespace-nowrap">Adset</span>
              </div>
              <span className="text-muted-foreground text-xs">:</span>
              <div className="flex items-center gap-1.5">
                <Input className="h-8 text-xs w-14 text-center" type="number" min={1} value={config.strategy_ads || 1} onChange={(e) => updateConfig("strategy_ads", parseInt(e.target.value) || 1)} />
                <span className="text-xs text-muted-foreground whitespace-nowrap">Ad</span>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Section 2: Targeting */}
      <Collapsible open={targetingOpen} onOpenChange={setTargetingOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full">
          <SectionHeader title="Targeting" subtitle="Set on which traffic source, asset." />
          <ChevronDown className={cn("h-4 w-4 transition-transform text-muted-foreground shrink-0 ml-2", targetingOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-4 pl-5">
          <div className="space-y-1">
            <Label className="text-xs">Saved Templates</Label>
            <Select value={config.targeting_template_id || ""} onValueChange={(v) => updateConfig("targeting_template_id", v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select template" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="template-1">US Broad Targeting</SelectItem>
                <SelectItem value="template-2">EU Interest-based</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" className="text-xs w-full border-dashed">
            Create custom targeting settings
          </Button>
        </CollapsibleContent>
      </Collapsible>

      {/* Section 3: Creative & Configuration */}
      <Collapsible open={creativeOpen} onOpenChange={setCreativeOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full">
          <SectionHeader title="Creative and Configuration" subtitle="Set on which traffic source, asset." />
          <ChevronDown className={cn("h-4 w-4 transition-transform text-muted-foreground shrink-0 ml-2", creativeOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4 pl-5">
          {/* Advantage+ box */}
          <div className="rounded-md border border-border bg-muted/20 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-semibold">Advantage+ catalogue ads</p>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Products from your catalogue will be shown to people most likely to be interested in them.
            </p>
            <a href="#" className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5 mt-1">
              About Advantage+ catalogue ads <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>

          {/* Catalogue dropdown */}
          <div className="space-y-1">
            <Label className="text-xs">Catalogue <span className="text-destructive">*</span></Label>
            <Select value={selectedCatId} onValueChange={(v) => {
              updateCatDefaults("catalogue_id", v);
              // Reset product set when catalogue changes
              updateCatDefaults("product_set_id", "");
            }}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select catalogue" /></SelectTrigger>
              <SelectContent>
                {DUMMY_CATALOGUES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.catalogue_id && <FieldError error={fieldErrors.catalogue_id} />}
          </div>

          {/* Show product-related fields only when catalogue is selected */}
          {selectedCatId && (
            <>
              {/* Promoted product preference */}
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Label className="text-xs">Promoted product preference</Label>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </div>
                <Select value={catDefaults.promoted_preference || ""} onValueChange={(v) => updateCatDefaults("promoted_preference", v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={`Show all products (${productSets[0]?.items || 0} items and ${productSets[0]?.variants || 0} variants)`} />
                  </SelectTrigger>
                  <SelectContent>
                    {PROMOTED_PRODUCT_PREFERENCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Product set suggestion */}
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Label className="text-xs">Product set suggestion</Label>
                  <Info className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">(optional)</span>
                </div>
                <Select value={catDefaults.product_set_id || ""} onValueChange={(v) => updateCatDefaults("product_set_id", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select product set" /></SelectTrigger>
                  <SelectContent>
                    {productSets.map((ps: any) => (
                      <SelectItem key={ps.id} value={ps.id}>{ps.name} ({ps.items} items)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Include other products checkbox */}
              <div className="flex items-start gap-2">
                <Checkbox
                  checked={catDefaults.include_other_products || false}
                  onCheckedChange={(v) => updateCatDefaults("include_other_products", !!v)}
                  className="mt-0.5 h-4 w-4"
                />
                <div>
                  <Label className="text-xs">Include other products from your catalogue</Label>
                  <div className="flex items-center gap-1 mt-0.5">
                    <p className="text-[10px] text-muted-foreground">You could get 11% lower cost per result by including other products</p>
                    <Info className="h-3 w-3 text-muted-foreground shrink-0" />
                  </div>
                </div>
              </div>

              {/* Product media thumbnails */}
              <div className="space-y-1">
                <Label className="text-xs">Product media</Label>
                <div className="flex gap-2">
                  {DUMMY_PRODUCT_IMAGES.slice(0, 3).map((img, i) => (
                    <div key={i} className="w-12 h-12 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
                      <img src={img} alt={`Product ${i + 1}`} className="w-8 h-8 object-contain opacity-50" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Ad copy fields */}
          <div className="space-y-3 border-t border-border pt-3">
            <div className="space-y-1">
              <Label className="text-xs">Primary text</Label>
              <Input className="h-8 text-xs" placeholder="Enter primary text..." value={catDefaults.primary_text || ""} onChange={(e) => updateCatDefaults("primary_text", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Headline</Label>
              <TagInput value={catDefaults.headline || ""} onChange={(v) => updateCatDefaults("headline", v)} placeholder="Type headline and press Enter" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description <span className="text-muted-foreground">(Optional)</span></Label>
              <TagInput value={catDefaults.description || ""} onChange={(v) => updateCatDefaults("description", v)} placeholder="Type description and press Enter" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">CTA</Label>
              <Select value={catDefaults.cta || ""} onValueChange={(v) => updateCatDefaults("cta", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select CTA" /></SelectTrigger>
                <SelectContent>
                  {CTA_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
