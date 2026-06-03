import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { FieldError } from "./FieldError";
import { getMockPagesForAccount } from "./distribution/mock-pages";
import { getMockCapacities } from "./distribution/mock-page-capacity";
import { MAX_ADS_PER_PAGE } from "@/lib/launch-distribution";
import type { TargetPair } from "@/lib/launch-distribution";

export interface AccountSetupConfig {
  page?: string;
  pixel?: string;
  website_url?: string;
  display_link?: string;
  url_tags?: string;
  advantage_plus_enabled?: boolean;
  catalogue?: string;
  promoted_product_preference?: string;
  product_set_suggestion?: string;
}

export interface AccountStrategy {
  campaigns: number;
  adsets: number;
  ads: number;
}

interface Props {
  accountId: string;
  accountName: string;
  bmName?: string;
  config: AccountSetupConfig;
  strategy: AccountStrategy;
  isExpanded: boolean;
  isChecked: boolean;
  onToggleExpand: () => void;
  onToggleCheck: () => void;
  onConfigChange: (config: AccountSetupConfig) => void;
  onStrategyChange: (strategy: AccountStrategy) => void;
  onRemove: () => void;
  fieldErrors?: Record<string, string>;
  healthState?: "safe" | "risk" | "unknown";
  capacityHint?: string | null;
  adsLocked?: boolean;
  /**
   * Launch-level target pairs (single source of truth across ALL accounts).
   * This card reads/writes only the subset whose ad_account_id === accountId.
   */
  targetPairs: TargetPair[];
  onTargetPairsChange: (pairs: TargetPair[]) => void;
}

export function AccountSetupCard({
  accountId,
  accountName,
  bmName,
  config,
  strategy,
  isExpanded,
  isChecked,
  onToggleExpand,
  onToggleCheck,
  onConfigChange,
  onStrategyChange,
  onRemove,
  fieldErrors = {},
  healthState,
  capacityHint,
  adsLocked,
  targetPairs,
  onTargetPairsChange,
}: Props) {
  const updateConfig = (key: keyof AccountSetupConfig, value: string) => {
    onConfigChange({ ...config, [key]: value });
  };

  const updateStrategy = (key: keyof AccountStrategy, value: number) => {
    onStrategyChange({ ...strategy, [key]: Math.max(1, value) });
  };

  // ── Page selection -> launch-level target_pairs ──────────────────────────────
  const accountPages = getMockPagesForAccount(accountId, accountName);
  // Capacity is keyed on fb_page_id (shared bucket across accounts).
  const capacities = getMockCapacities(accountPages.map((p) => p.fb_page_id));
  const capacityByFbId = new Map(capacities.map((c) => [c.fb_page_id, c.currentActive]));
  // Internal page_ids selected for THIS account (subset of target_pairs).
  const selectedPageIds = new Set(
    targetPairs.filter((p) => p.ad_account_id === accountId).map((p) => p.page_id),
  );

  const togglePage = (pageId: string) => {
    const page = accountPages.find((p) => p.page_id === pageId);
    if (!page) return;
    const isSelected = selectedPageIds.has(pageId);
    if (isSelected) {
      // Remove only this account's pair for that page_id.
      onTargetPairsChange(
        targetPairs.filter((p) => !(p.ad_account_id === accountId && p.page_id === pageId)),
      );
    } else {
      const newPair: TargetPair = {
        ad_account_id: accountId,
        account_name: accountName,
        page_id: page.page_id,
        fb_page_id: page.fb_page_id,
        page_name: page.page_name,
      };
      onTargetPairsChange([...targetPairs, newPair]);
    }
  };

  return (
    <Card className="border border-border">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Checkbox
          checked={isChecked}
          onCheckedChange={onToggleCheck}
        />
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{accountName}</span>
          {bmName && (
            <span className="text-sm text-muted-foreground">({bmName})</span>
          )}
          {healthState && (
            <Badge variant={healthState === "safe" ? "default" : healthState === "risk" ? "destructive" : "secondary"}>
              {healthState === "safe" ? "Safe" : healthState === "risk" ? "Risk" : "Unknown"}
            </Badge>
          )}
          {capacityHint && (
            <span className="text-xs text-muted-foreground">{capacityHint}</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-sm text-muted-foreground gap-1"
          onClick={onToggleExpand}
        >
          {isExpanded ? "Collapse" : "Expand"}
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <CardContent className="pt-4 pb-4 space-y-4">
          {/* Pages (multi-select) — each selection becomes a launch target pair */}
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Pages</Label>
            {selectedPageIds.size === 0 && (
              <p className="text-xs text-muted-foreground">Select pages to distribute ads into.</p>
            )}
            <div className="space-y-2">
              {accountPages.map((page) => {
                const isSelected = selectedPageIds.has(page.page_id);
                const currentActive = capacityByFbId.get(page.fb_page_id) ?? 0;
                const available = Math.max(0, MAX_ADS_PER_PAGE - currentActive);
                const isFull = currentActive >= MAX_ADS_PER_PAGE;
                const pct = Math.min(100, Math.round((currentActive / MAX_ADS_PER_PAGE) * 100));
                return (
                  <label
                    key={page.page_id}
                    className={`flex flex-col gap-2 cursor-pointer rounded-md border p-3 transition-colors hover:bg-muted/50 ${isSelected ? "border-primary/50 bg-primary/5" : "border-border"}`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox checked={isSelected} onCheckedChange={() => togglePage(page.page_id)} />
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">{page.page_name}</span>
                        {isFull && <Badge variant="destructive" className="text-[10px] shrink-0">Full</Badge>}
                      </div>
                    </div>
                    {/* Capacity row — shown for selected pages */}
                    {isSelected && (
                      <div className="pl-7 space-y-1">
                        <Progress value={pct} className="h-1.5" />
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Current active: {currentActive} / {MAX_ADS_PER_PAGE}</span>
                          <span>{available} slot{available === 1 ? "" : "s"} available</span>
                        </div>
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Row: Pixel, Strategy structure */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Pixel <span className="text-muted-foreground">(optional)</span></Label>
              <Select value={config.pixel || ""} onValueChange={(v) => updateConfig("pixel", v)}>
                <SelectTrigger><SelectValue placeholder="Select pixel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pixel-1">Pixel - Main</SelectItem>
                  <SelectItem value="pixel-2">Pixel - Retargeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Strategy structure</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={strategy.campaigns}
                  onChange={(e) => updateStrategy("campaigns", parseInt(e.target.value) || 1)}
                  className="w-16 text-center"
                />
                <span className="text-muted-foreground">:</span>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={strategy.adsets}
                  onChange={(e) => updateStrategy("adsets", parseInt(e.target.value) || 1)}
                  className="w-16 text-center"
                />
                <span className="text-muted-foreground">:</span>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={strategy.ads}
                  onChange={(e) => updateStrategy("ads", parseInt(e.target.value) || 1)}
                  className="w-16 text-center"
                  disabled={adsLocked}
                  title={adsLocked ? "Ad count is set by folder contents" : undefined}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Can't change this setup here.{" "}
                <button className="text-primary underline text-xs" type="button">more</button>
              </p>
            </div>
          </div>

          {/* Row 2: Website URL, Display link, URL tags */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5" data-field={`website-url-${accountId}`} id={`website-url-${accountId}`}>
              <Label className="text-sm text-muted-foreground">
                Website URL <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="https://example.com"
                value={config.website_url || ""}
                onChange={(e) => updateConfig("website_url", e.target.value)}
                className={fieldErrors[`website-url-${accountId}`] ? "border-destructive" : ""}
              />
              <FieldError error={fieldErrors[`website-url-${accountId}`]} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">
                Display link <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                placeholder="Enter Display link"
                value={config.display_link || ""}
                onChange={(e) => updateConfig("display_link", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">
                URL tags <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                placeholder="Enter tags"
                value={config.url_tags || ""}
                onChange={(e) => updateConfig("url_tags", e.target.value)}
              />
            </div>
          </div>

          {/* Advantage+ Catalogue Ads */}
          <div className="rounded-lg border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-foreground">Advantage+ catalogue ads</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically show relevant products from your catalogue to people
                </p>
              </div>
              <Switch
                checked={config.advantage_plus_enabled === true || config.advantage_plus_enabled as unknown === "true"}
                onCheckedChange={(checked) => onConfigChange({ ...config, advantage_plus_enabled: checked })}
              />
            </div>

            {config.advantage_plus_enabled && (
              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border">
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Catalogue</Label>
                  <Select value={config.catalogue || ""} onValueChange={(v) => updateConfig("catalogue", v)}>
                    <SelectTrigger><SelectValue placeholder="Select catalogue" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="catalogue-1">Product Catalogue 1</SelectItem>
                      <SelectItem value="catalogue-2">Product Catalogue 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Promoted product preference</Label>
                  <Select value={config.promoted_product_preference || ""} onValueChange={(v) => updateConfig("promoted_product_preference", v)}>
                    <SelectTrigger><SelectValue placeholder="Select preference" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All products</SelectItem>
                      <SelectItem value="specific">Specific products</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Product set suggestion</Label>
                  <Select value={config.product_set_suggestion || ""} onValueChange={(v) => updateConfig("product_set_suggestion", v)}>
                    <SelectTrigger><SelectValue placeholder="Select product set" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Automatic</SelectItem>
                      <SelectItem value="manual">Manual selection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
