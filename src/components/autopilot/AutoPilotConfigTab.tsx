import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Rocket, Settings2, ShieldCheck, Plus, Star, Trash2, Info, HelpCircle, Tag, Copy, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { StrategyInsightsCard } from "./StrategyInsightsCard";
import { StrategyChangeLog } from "./StrategyChangeLog";

const NOMENCLATURE_TOKENS = [
  "{ad-account-alias}",
  "{launch-user}",
  "{date}",
  "{device}",
  "{location}",
  "{gender}",
  "{creative}",
];

export interface LaunchStrategy {
  id: string;
  name: string;
  alias: string;
  isDefault: boolean;
  adType: "standard" | "catalogue";
  campaignsCount: number;
  adSetsCount: number;
  adsCount: number;
  nomenclature: string;
  skipIfInReview: boolean;
  launchIntervalMinutes: number;
  maxLaunchesPerDay: number;
  pauseRejectionPercent: number;
  cooldownMinutes: number;
  createdAt?: string;
  lastModifiedAt?: string;
}

/** @deprecated Use LaunchStrategy instead */
export type LaunchConfig = LaunchStrategy;

interface Props {
  configs: LaunchStrategy[];
  selectedId: string;
  onSelect: (id: string) => void;
  onChange: (c: LaunchStrategy) => void;
  onAdd: () => void;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  onClone?: (id: string) => void;
  /** Number of accounts assigned to each strategy id */
  assignedCounts?: Record<string, number>;
}

function buildNomenclaturePreview(template: string, alias: string) {
  const vars: Record<string, string> = {
    "{ad-account-alias}": "US-Main",
    "{launch-user}": "john",
    "{date}": "2026-03-03",
    "{device}": "Mobile",
    "{location}": "US",
    "{gender}": "All",
    "{creative}": "Hero_V1",
  };
  let result = template;
  for (const [key, val] of Object.entries(vars)) {
    result = result.split(key).join(val);
  }
  const suffix = alias || "my-strategy";
  return result ? `${result}_{${suffix}}` : `{${suffix}}`;
}

export function AutoPilotConfigTab({ configs, selectedId, onSelect, onChange, onAdd, onSetDefault, onDelete, onClone, assignedCounts = {} }: Props) {
  const config = configs.find((c) => c.id === selectedId);
  const assignedCount = config ? (assignedCounts[config.id] ?? 0) : 0;
  const isAssigned = assignedCount > 0;

  const set = <K extends keyof LaunchStrategy>(key: K, val: LaunchStrategy[K]) => {
    if (!config) return;
    onChange({ ...config, [key]: val });
  };

  return (
    <div className="flex gap-6 p-1">
      {/* Strategy list panel */}
      <div className="w-64 shrink-0 space-y-2">
        <Button size="sm" className="w-full gap-1.5" onClick={onAdd}>
          <Plus className="h-4 w-4" /> New Strategy
        </Button>
        <div className="space-y-1">
          {configs.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={cn(
                "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                c.id === selectedId
                  ? "border-primary bg-primary/5"
                  : "border-transparent hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{c.name || "Untitled"}</span>
                {c.isDefault && (
                  <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5">Default</Badge>
                )}
              </div>
              {c.alias && (
                <span className="text-[10px] text-muted-foreground truncate block">{c.alias}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Strategy detail */}
      {config ? (
        <div className="flex-1 space-y-6">
          {/* Assignment warning */}
          {isAssigned && (
            <Alert variant="destructive" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 text-foreground">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-sm">
                This strategy is assigned to <span className="font-semibold">{assignedCount} account{assignedCount > 1 ? "s" : ""}</span>. Changes will affect all future launches from those accounts.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions bar */}
          <div className="flex items-center gap-2">
            {!config.isDefault && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onSetDefault(config.id)}>
                <Star className="h-3.5 w-3.5" /> Set as Default
              </Button>
            )}
            {config.isDefault && (
              <Badge className="gap-1">
                <Star className="h-3 w-3" /> Default Strategy
              </Badge>
            )}
            {onClone && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onClone(config.id)}>
                <Copy className="h-3.5 w-3.5" /> Clone
              </Button>
            )}
            {configs.length > 1 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-destructive"
                      onClick={() => onDelete(config.id)}
                      disabled={isAssigned}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </span>
                </TooltipTrigger>
                {isAssigned && (
                  <TooltipContent className="text-xs">Unassign from all accounts before deleting</TooltipContent>
                )}
              </Tooltip>
            )}
          </div>

          {/* Ad Type */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Ad Type</CardTitle>
              </div>
              <CardDescription>Choose whether this strategy launches standard creative ads or catalogue product ads.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={() => set("adType", "standard")}
                  className={cn(
                    "flex-1 rounded-md border px-4 py-3 text-left text-sm transition-colors",
                    config.adType === "standard" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted"
                  )}
                >
                  <span className="font-medium">Standard Ads</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Launch using creative folders</p>
                </button>
                <button
                  onClick={() => set("adType", "catalogue")}
                  className={cn(
                    "flex-1 rounded-md border px-4 py-3 text-left text-sm transition-colors",
                    config.adType === "catalogue" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted"
                  )}
                >
                  <span className="font-medium">Catalogue Ads</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Launch using product catalogues</p>
                </button>
              </div>
              {config.adType === "catalogue" && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Catalogue and product set are configured per ad account based on their access. Use the bulk assign tool in the Accounts tab to map catalogues efficiently.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* General */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">General</CardTitle>
              </div>
              <CardDescription>Name your strategy and set an alias for tracking.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Strategy Name</Label>
                <Input placeholder="e.g. US Weight Loss Scale" value={config.name} onChange={(e) => set("name", e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label>Alias</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                      A short identifier appended to all campaign names created by this strategy. Helps identify which strategy launched a campaign.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="e.g. us-wl-scale" value={config.alias} onChange={(e) => set("alias", e.target.value)} className="pl-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Structure + Nomenclature */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Campaign Structure</CardTitle>
              </div>
              <CardDescription>Define how many entities to create per launch cycle and naming convention.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Campaigns</Label>
                  <Input type="number" min={1} value={config.campaignsCount} onChange={(e) => set("campaignsCount", +e.target.value || 1)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Ad Sets</Label>
                  <Input type="number" min={1} value={config.adSetsCount} onChange={(e) => set("adSetsCount", +e.target.value || 1)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Ads</Label>
                  <Input type="number" min={1} value={config.adsCount} onChange={(e) => set("adsCount", +e.target.value || 1)} />
                </div>
              </div>

              <Separator />

              {/* Nomenclature */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Label>Custom Nomenclature (optional)</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                      Build a naming template using tokens. The strategy alias is automatically appended as a suffix.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  placeholder="e.g. {ad-account-alias}_{date}_{location}"
                  value={config.nomenclature}
                  onChange={(e) => set("nomenclature", e.target.value)}
                />
                <div className="flex gap-1.5 flex-wrap">
                  {NOMENCLATURE_TOKENS.map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="text-xs cursor-pointer hover:bg-muted"
                      onClick={() => set("nomenclature", (config.nomenclature ? config.nomenclature + "_" : "") + t)}
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
                <div className="rounded-md border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30 px-3 py-2">
                  <p className="text-xs text-foreground">
                    <span className="font-medium">Example preview: </span>
                    {buildNomenclaturePreview(config.nomenclature, config.alias)}
                  </p>
                </div>
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Info className="h-3 w-3 shrink-0" />
                  The strategy alias <Badge variant="secondary" className="text-[10px] px-1 py-0 mx-0.5">{`{${config.alias || "strategy-alias"}}`}</Badge> is always appended as a suffix.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Launch Rules */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Launch Rules</CardTitle>
              </div>
              <CardDescription>Safety guardrails and timing controls for automated launches.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Skip if ads are in review</Label>
                  <p className="text-xs text-muted-foreground">Pause launching when pending reviews exist</p>
                </div>
                <Switch checked={config.skipIfInReview} onCheckedChange={(v) => set("skipIfInReview", v)} />
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Launch every (minutes)</Label>
                  <Input type="number" min={5} value={config.launchIntervalMinutes} onChange={(e) => set("launchIntervalMinutes", +e.target.value || 5)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Max launches per day</Label>
                  <Input type="number" min={1} value={config.maxLaunchesPerDay} onChange={(e) => set("maxLaunchesPerDay", +e.target.value || 1)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Pause if rejection ratio exceeds (%)</Label>
                  <Input type="number" min={1} max={100} value={config.pauseRejectionPercent} onChange={(e) => set("pauseRejectionPercent", +e.target.value || 1)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Cool-down after launch (minutes)</Label>
                  <Input type="number" min={0} value={config.cooldownMinutes} onChange={(e) => set("cooldownMinutes", +e.target.value || 0)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategy Insights */}
          <StrategyInsightsCard alias={config.alias} />

          {/* Change History */}
          <StrategyChangeLog strategyId={config.id} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Select or create a strategy to get started.
        </div>
      )}
    </div>
  );
}
