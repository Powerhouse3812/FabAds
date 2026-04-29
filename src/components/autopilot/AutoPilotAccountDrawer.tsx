import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import type { AccountState } from "./AutoPilotAccountsTab";
import type { LaunchStrategy } from "./AutoPilotConfigTab";
import type { WarmupConfig } from "./AutoPilotWarmupConfigTab";
import { DUMMY_PAGES, DUMMY_ACCOUNT_CATALOGUES, CATALOGUE_DYNAMIC_TAGS, CATALOGUE_CTA_OPTIONS } from "./autopilot-dummy-data";
import { DUMMY_CATALOGUES, DUMMY_PRODUCT_SETS } from "@/lib/catalogue-dummy-data";

const DUMMY_CAMPAIGN_URLS = [
  { id: "cu-1", name: "Weight Loss – US", folders: ["Folder A", "Folder B"], template: "US Broad 18-65" },
  { id: "cu-2", name: "Skincare – EU", folders: ["Folder C"], template: "EU Lookalike" },
];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  account: AccountState | null;
  onUpdate: (a: AccountState) => void;
  configs: LaunchStrategy[];
  warmupConfigs: WarmupConfig[];
}

export function AutoPilotAccountDrawer({ open, onOpenChange, account, onUpdate, configs, warmupConfigs }: Props) {
  const [focusedField, setFocusedField] = useState<"primaryText" | "headline" | null>(null);

  if (!account) return null;

  const set = <K extends keyof AccountState>(key: K, val: AccountState[K]) =>
    onUpdate({ ...account, [key]: val });

  const setCatalogueField = (field: string, value: string) => {
    const current = account.catalogueConfig || { catalogueId: "", productSetId: "", primaryText: "", headline: "", cta: "Shop now" };
    onUpdate({ ...account, catalogueConfig: { ...current, [field]: value } });
  };

  const insertTag = (tag: string) => {
    const current = account.catalogueConfig || { catalogueId: "", productSetId: "", primaryText: "", headline: "", cta: "Shop now" };
    if (focusedField === "primaryText") {
      onUpdate({ ...account, catalogueConfig: { ...current, primaryText: current.primaryText + tag } });
    } else if (focusedField === "headline") {
      onUpdate({ ...account, catalogueConfig: { ...current, headline: current.headline + tag } });
    }
  };

  const addPage = (id: string) => {
    if (!account.pageIds.includes(id)) set("pageIds", [...account.pageIds, id]);
  };
  const removePage = (id: string) => set("pageIds", account.pageIds.filter((p) => p !== id));
  const availablePages = DUMMY_PAGES.filter((p) => !account.pageIds.includes(p.id));

  const defaultConfig = configs.find((c) => c.isDefault);
  const defaultWarmup = warmupConfigs.find((c) => c.isDefault);

  const resolvedStrategy = configs.find((c) => c.id === (account.assignedConfigId ?? defaultConfig?.id));
  const isCatalogue = resolvedStrategy?.adType === "catalogue";

  const warmupConfig = warmupConfigs.find((c) => c.id === (account.assignedWarmupConfigId ?? defaultWarmup?.id));
  const warmupDays = warmupConfig?.warmupDays ?? 7;

  const warmupStatus = !account.warmupEnabled
    ? "Off"
    : account.warmupCurrentDay >= warmupDays
      ? "Ready"
      : "Warming";

  // Catalogue data
  const accountCatalogues = DUMMY_ACCOUNT_CATALOGUES[account.id] || [];
  const availableCatalogues = DUMMY_CATALOGUES.filter((c) => accountCatalogues.includes(c.id));
  const selectedCatalogueId = account.catalogueConfig?.catalogueId || "";
  const productSets = selectedCatalogueId ? (DUMMY_PRODUCT_SETS[selectedCatalogueId] || []) : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{account.name}</SheetTitle>
          <SheetDescription>Configure AutoPilot settings for this ad account.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* AutoPilot toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">AutoPilot Enabled</Label>
            <Switch checked={account.autopilotOn} onCheckedChange={(v) => set("autopilotOn", v)} />
          </div>

          <Separator />

          {/* Launch Strategy override */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Launch Strategy</Label>
            <Select
              value={account.assignedConfigId ?? "__default__"}
              onValueChange={(v) => set("assignedConfigId", v === "__default__" ? null : v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {defaultConfig && (
                  <SelectItem value="__default__">{defaultConfig.name || "Untitled"} (Default)</SelectItem>
                )}
                {configs.filter((c) => !c.isDefault).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name || "Untitled"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {resolvedStrategy && (
              <p className="text-[10px] text-muted-foreground">
                Ad type: <Badge variant="outline" className="text-[10px] px-1 py-0">{resolvedStrategy.adType === "catalogue" ? "Catalogue" : "Standard"}</Badge>
              </p>
            )}
          </div>

          <Separator />

          {/* Catalogue Config — only when strategy is catalogue type */}
          {isCatalogue && (
            <>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Catalogue Configuration</Label>

                <div className="space-y-1.5">
                  <Label className="text-xs">Catalogue</Label>
                  {availableCatalogues.length === 0 ? (
                    <p className="text-xs text-destructive">This account has no catalogue access.</p>
                  ) : (
                    <Select
                      value={selectedCatalogueId || "__none__"}
                      onValueChange={(v) => {
                        setCatalogueField("catalogueId", v === "__none__" ? "" : v);
                        setCatalogueField("productSetId", "");
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select catalogue" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {availableCatalogues.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {selectedCatalogueId && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Product Set</Label>
                    <Select
                      value={account.catalogueConfig?.productSetId || "__all__"}
                      onValueChange={(v) => setCatalogueField("productSetId", v === "__all__" ? "" : v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All products" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All products</SelectItem>
                        {productSets.filter((ps) => ps.name !== "All products").map((ps) => (
                          <SelectItem key={ps.id} value={ps.id}>{ps.name} ({ps.items} items)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Ad Copy */}
                <Separator />
                <Label className="text-xs font-medium">Ad Copy</Label>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground">Primary Text</Label>
                  <Input
                    className="h-8 text-xs"
                    placeholder="e.g. Shop {{product.name}} at {{product.price}}"
                    value={account.catalogueConfig?.primaryText || ""}
                    onChange={(e) => setCatalogueField("primaryText", e.target.value)}
                    onFocus={() => setFocusedField("primaryText")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground">Headline</Label>
                  <Input
                    className="h-8 text-xs"
                    placeholder="e.g. {{product.name}} — Limited Offer"
                    value={account.catalogueConfig?.headline || ""}
                    onChange={(e) => setCatalogueField("headline", e.target.value)}
                    onFocus={() => setFocusedField("headline")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground">CTA</Label>
                  <Select
                    value={account.catalogueConfig?.cta || "Shop now"}
                    onValueChange={(v) => setCatalogueField("cta", v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATALOGUE_CTA_OPTIONS.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dynamic Tags */}
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Insert dynamic tag:</Label>
                  <div className="flex gap-1 flex-wrap">
                    {CATALOGUE_DYNAMIC_TAGS.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-[10px] cursor-pointer hover:bg-muted"
                        onClick={() => insertTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Campaign URL & Folder — only when standard */}
          {!isCatalogue && (
            <>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Campaign URL</Label>
                  <Select
                    value={account.campaignUrlId || "__none__"}
                    onValueChange={(v) => {
                      set("campaignUrlId", v === "__none__" ? "" : v);
                      if (v !== account.campaignUrlId) set("folder", "");
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select Campaign URL" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {DUMMY_CAMPAIGN_URLS.map((cu) => (
                        <SelectItem key={cu.id} value={cu.id}>{cu.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(() => {
                  const cu = DUMMY_CAMPAIGN_URLS.find((c) => c.id === account.campaignUrlId);
                  if (!cu) return null;
                  return (
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Folder</Label>
                      <Select
                        value={account.folder || "__none__"}
                        onValueChange={(v) => set("folder", v === "__none__" ? "" : v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select folder" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {cu.folders.map((f) => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground">AutoPilot will use ad groups from this folder to create ads.</p>
                    </div>
                  );
                })()}
              </div>

              <Separator />
            </>
          )}

          {/* Warm-up Config override */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Warm-up Config</Label>
              <Select
                value={account.assignedWarmupConfigId ?? "__default__"}
                onValueChange={(v) => set("assignedWarmupConfigId", v === "__default__" ? null : v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {defaultWarmup && (
                    <SelectItem value="__default__">{defaultWarmup.name || "Untitled"} (Default)</SelectItem>
                  )}
                  {warmupConfigs.filter((c) => !c.isDefault).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name || "Untitled"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">Enable Warm-up</Label>
              <Switch checked={account.warmupEnabled} onCheckedChange={(v) => set("warmupEnabled", v)} />
            </div>

            {account.warmupEnabled && (
              <div className="rounded-md border p-3 bg-muted/50">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={warmupStatus === "Ready" ? "default" : warmupStatus === "Warming" ? "secondary" : "outline"} className="text-xs">
                    {warmupStatus}
                  </Badge>
                  {warmupConfig && <span className="text-[10px] text-muted-foreground">Using: {warmupConfig.name}</span>}
                </div>
                {warmupStatus === "Warming" && (
                  <p className="text-xs text-muted-foreground">Day {account.warmupCurrentDay} of {warmupDays} · {warmupConfig?.links.length ?? 0} links</p>
                )}
                {warmupStatus === "Ready" && (
                  <p className="text-xs text-muted-foreground">Warm-up complete. Account is ready for auto-launch.</p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Pixel ID */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Pixel ID</Label>
            <Input
              className="h-8 text-xs font-mono"
              placeholder="Enter pixel ID"
              value={account.pixelId}
              onChange={(e) => set("pixelId", e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">Facebook pixel used for tracking conversions on this account.</p>
          </div>

          <Separator />

          {/* Ads Launched */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Total Ads Launched</Label>
            <span className="text-lg font-semibold tabular-nums">{account.adsLaunched.toLocaleString()}</span>
          </div>

          <Separator />

          {/* Pages */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Pages</Label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {account.pageIds.length === 0 && <p className="text-xs text-muted-foreground">No pages assigned.</p>}
              {account.pageIds.map((id) => {
                const pg = DUMMY_PAGES.find((p) => p.id === id);
                if (!pg) return null;
                return (
                  <div key={id} className="flex items-center gap-2 group">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-foreground truncate block">{pg.name}</span>
                      <span className="text-[10px] text-muted-foreground">{pg.activeAds} active · {pg.rejectedAds} rejected · {pg.totalAds} total</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100" onClick={() => removePage(id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
            {availablePages.length > 0 && (
              <Select onValueChange={addPage}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Add a page…" />
                </SelectTrigger>
                <SelectContent>
                  {availablePages.map((pg) => (
                    <SelectItem key={pg.id} value={pg.id}>
                      <div className="flex items-center gap-2">
                        <span>{pg.name}</span>
                        <span className="text-muted-foreground text-[10px]">{pg.activeAds} active · {pg.rejectedAds} rej</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Separator />

          {/* Override rules */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Override Launch Rules</Label>
            <p className="text-xs text-muted-foreground">Optionally override global config for this account.</p>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Skip if ads in review</Label>
              <Switch checked={account.overrideSkipReview ?? false} onCheckedChange={(v) => set("overrideSkipReview", v)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Custom launch interval (min)</Label>
              <Input type="number" min={0} placeholder="Use global" value={account.overrideInterval ?? ""} onChange={(e) => set("overrideInterval", e.target.value ? +e.target.value : undefined)} className="h-8" />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
