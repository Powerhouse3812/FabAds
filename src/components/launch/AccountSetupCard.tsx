import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { FieldError } from "./FieldError";

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
}: Props) {
  const updateConfig = (key: keyof AccountSetupConfig, value: string) => {
    onConfigChange({ ...config, [key]: value });
  };

  const updateStrategy = (key: keyof AccountStrategy, value: number) => {
    onStrategyChange({ ...strategy, [key]: Math.max(1, value) });
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
          {/* Row 1: Page, Pixel, Strategy structure */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Page</Label>
              <Select value={config.page || ""} onValueChange={(v) => updateConfig("page", v)}>
                <SelectTrigger><SelectValue placeholder="Select page" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="page-1">Sample Page 1</SelectItem>
                  <SelectItem value="page-2">Sample Page 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
