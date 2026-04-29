import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LaunchStrategy } from "./AutoPilotConfigTab";
import type { WarmupConfig } from "./AutoPilotWarmupConfigTab";
import type { AutoLaunch } from "./AutoPilotAutoLaunchesTab";
import type { AccountCatalogueConfig } from "./AutoPilotAccountsTab";
import { DUMMY_CATALOGUES, DUMMY_PRODUCT_SETS } from "@/lib/catalogue-dummy-data";
import { CATALOGUE_DYNAMIC_TAGS, CATALOGUE_CTA_OPTIONS } from "./autopilot-dummy-data";

// Dummy accounts for selection
const DUMMY_AD_ACCOUNTS = [
  { id: "acc-1", name: "US – Main", bmName: "BM Alpha" },
  { id: "acc-2", name: "EU – Scale", bmName: "BM Alpha" },
  { id: "acc-3", name: "US – Warm-up Test", bmName: "BM Beta" },
  { id: "acc-4", name: "UK – Inactive", bmName: "BM Beta" },
];

const DUMMY_CAMPAIGN_URLS = [
  { id: "cu-1", name: "Weight Loss – US", folders: ["Folder A", "Folder B"] },
  { id: "cu-2", name: "Skincare – EU", folders: ["Folder C"] },
];

const DUMMY_PAGES = [
  { id: "pg-1", name: "Weight Loss LP – US" },
  { id: "pg-2", name: "Skincare Offer – EU" },
  { id: "pg-3", name: "Keto Diet – CA" },
  { id: "pg-4", name: "Beauty Promo – UK" },
];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  strategies: LaunchStrategy[];
  warmupConfigs: WarmupConfig[];
  onSubmit: (autoLaunch: AutoLaunch) => void;
  editingAutoLaunch?: AutoLaunch | null;
}

export function CreateAutoLaunchModal({ open, onOpenChange, strategies, warmupConfigs, onSubmit, editingAutoLaunch }: Props) {
  const isEditing = !!editingAutoLaunch;

  const [name, setName] = useState(editingAutoLaunch?.name ?? "");
  const [mode, setMode] = useState<"multi-strategy" | "multi-account">(editingAutoLaunch?.mode ?? "multi-strategy");
  const [creativeSource, setCreativeSource] = useState<"folder" | "catalogue">(editingAutoLaunch?.creativeSource ?? "folder");

  // Selections
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(editingAutoLaunch?.accountIds ?? []);
  const [selectedStrategyIds, setSelectedStrategyIds] = useState<string[]>(editingAutoLaunch?.strategyIds ?? []);

  // Folder fields
  const [campaignUrlId, setCampaignUrlId] = useState(editingAutoLaunch?.campaignUrlId ?? "");
  const [folder, setFolder] = useState(editingAutoLaunch?.folder ?? "");

  // Catalogue fields
  const [catalogueId, setCatalogueId] = useState(editingAutoLaunch?.catalogueConfig?.catalogueId ?? "");
  const [productSetId, setProductSetId] = useState(editingAutoLaunch?.catalogueConfig?.productSetId ?? "");
  const [primaryText, setPrimaryText] = useState(editingAutoLaunch?.catalogueConfig?.primaryText ?? "");
  const [headline, setHeadline] = useState(editingAutoLaunch?.catalogueConfig?.headline ?? "");
  const [cta, setCta] = useState(editingAutoLaunch?.catalogueConfig?.cta ?? "Shop now");

  // Common fields
  const [warmupConfigId, setWarmupConfigId] = useState(editingAutoLaunch?.warmupConfigId ?? "");
  const [pixelId, setPixelId] = useState(editingAutoLaunch?.pixelId ?? "");
  const [pageIds, setPageIds] = useState<string[]>(editingAutoLaunch?.pageIds ?? []);
  const [dilutionEnabled, setDilutionEnabled] = useState(editingAutoLaunch?.dilutionEnabled ?? false);
  const [replacementEnabled, setReplacementEnabled] = useState(editingAutoLaunch?.replacementEnabled ?? false);

  const selectedCampaignUrl = DUMMY_CAMPAIGN_URLS.find((c) => c.id === campaignUrlId);
  const productSets = catalogueId ? (DUMMY_PRODUCT_SETS[catalogueId] ?? []) : [];

  const toggleAccount = (id: string) => {
    setSelectedAccountIds((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
  };
  const toggleStrategy = (id: string) => {
    setSelectedStrategyIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };
  const togglePage = (id: string) => {
    setPageIds((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };

  const insertTag = (setter: React.Dispatch<React.SetStateAction<string>>, tag: string) => {
    setter((prev) => prev + tag);
  };

  const canSubmit = () => {
    if (!name.trim()) return false;
    if (mode === "multi-strategy") {
      if (selectedAccountIds.length !== 1 || selectedStrategyIds.length === 0) return false;
    } else {
      if (selectedAccountIds.length === 0 || selectedStrategyIds.length !== 1) return false;
    }
    if (creativeSource === "folder" && (!campaignUrlId || !folder)) return false;
    if (creativeSource === "catalogue" && (!catalogueId || !productSetId)) return false;
    return true;
  };

  const handleSubmit = () => {
    const catalogueConfig: AccountCatalogueConfig | undefined =
      creativeSource === "catalogue"
        ? { catalogueId, productSetId, primaryText, headline, cta }
        : undefined;

    const autoLaunch: AutoLaunch = {
      id: editingAutoLaunch?.id ?? `al-${Date.now()}`,
      name,
      mode,
      enabled: editingAutoLaunch?.enabled ?? true,
      creativeSource,
      campaignUrlId: creativeSource === "folder" ? campaignUrlId : undefined,
      folder: creativeSource === "folder" ? folder : undefined,
      catalogueConfig,
      accountIds: selectedAccountIds,
      strategyIds: selectedStrategyIds,
      warmupConfigId: warmupConfigId || undefined,
      pixelId,
      pageIds,
      dilutionEnabled,
      replacementEnabled,
      createdAt: editingAutoLaunch?.createdAt ?? new Date().toISOString().slice(0, 10),
    };

    onSubmit(autoLaunch);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Auto Launch" : "Create Auto Launch"}</DialogTitle>
          <DialogDescription>
            Configure an automated launch that generates rows based on your strategy and account selections.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-5 pb-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. US Weight Loss Scale" />
            </div>

            <Separator />

            {/* Mode */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Mode</Label>
              <RadioGroup value={mode} onValueChange={(v) => {
                setMode(v as "multi-strategy" | "multi-account");
                setSelectedAccountIds([]);
                setSelectedStrategyIds([]);
              }}>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="multi-strategy" id="mode-ms" />
                  <Label htmlFor="mode-ms" className="text-sm cursor-pointer">Multi-Strategy, Single Account</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="multi-account" id="mode-ma" />
                  <Label htmlFor="mode-ma" className="text-sm cursor-pointer">Multi-Account, Single Strategy</Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* Account / Strategy Selection */}
            <div className="grid grid-cols-2 gap-4">
              {/* Accounts */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Ad Account{mode === "multi-account" ? "s" : ""}
                </Label>
                {mode === "multi-strategy" ? (
                  <Select value={selectedAccountIds[0] ?? ""} onValueChange={(v) => setSelectedAccountIds([v])}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent>
                      {DUMMY_AD_ACCOUNTS.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-1.5 rounded-md border p-2 max-h-32 overflow-y-auto">
                    {DUMMY_AD_ACCOUNTS.map((a) => (
                      <div key={a.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedAccountIds.includes(a.id)}
                          onCheckedChange={() => toggleAccount(a.id)}
                        />
                        <span className="text-sm">{a.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Strategies */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Strateg{mode === "multi-strategy" ? "ies" : "y"}
                </Label>
                {mode === "multi-account" ? (
                  <Select value={selectedStrategyIds[0] ?? ""} onValueChange={(v) => setSelectedStrategyIds([v])}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select strategy" /></SelectTrigger>
                    <SelectContent>
                      {strategies.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name || "(Unnamed)"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-1.5 rounded-md border p-2 max-h-32 overflow-y-auto">
                    {strategies.map((s) => (
                      <div key={s.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedStrategyIds.includes(s.id)}
                          onCheckedChange={() => toggleStrategy(s.id)}
                        />
                        <span className="text-sm">{s.name || "(Unnamed)"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Creative Source */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Creative Source</Label>
              <RadioGroup value={creativeSource} onValueChange={(v) => setCreativeSource(v as "folder" | "catalogue")}>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="folder" id="src-folder" />
                    <Label htmlFor="src-folder" className="text-sm cursor-pointer">Folder</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="catalogue" id="src-catalogue" />
                    <Label htmlFor="src-catalogue" className="text-sm cursor-pointer">Catalogue</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {creativeSource === "folder" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Campaign URL</Label>
                  <Select value={campaignUrlId} onValueChange={(v) => { setCampaignUrlId(v); setFolder(""); }}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {DUMMY_CAMPAIGN_URLS.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Folder</Label>
                  <Select value={folder} onValueChange={setFolder} disabled={!campaignUrlId}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {(selectedCampaignUrl?.folders ?? []).map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Catalogue</Label>
                    <Select value={catalogueId} onValueChange={(v) => { setCatalogueId(v); setProductSetId(""); }}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {DUMMY_CATALOGUES.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Product Set</Label>
                    <Select value={productSetId} onValueChange={setProductSetId} disabled={!catalogueId}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {productSets.map((ps) => (
                          <SelectItem key={ps.id} value={ps.id}>{ps.name} ({ps.items} items)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Ad Copy */}
                <div className="space-y-2">
                  <Label className="text-sm">Primary Text</Label>
                  <Input value={primaryText} onChange={(e) => setPrimaryText(e.target.value)} placeholder="Check out {{product.name}}..." className="h-9 text-sm" />
                  <div className="flex flex-wrap gap-1">
                    {CATALOGUE_DYNAMIC_TAGS.map((tag) => (
                      <Badge key={tag} variant="outline" className="cursor-pointer text-xs hover:bg-accent" onClick={() => insertTag(setPrimaryText, tag)}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Headline</Label>
                  <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="{{product.name}} on sale" className="h-9 text-sm" />
                  <div className="flex flex-wrap gap-1">
                    {CATALOGUE_DYNAMIC_TAGS.map((tag) => (
                      <Badge key={tag} variant="outline" className="cursor-pointer text-xs hover:bg-accent" onClick={() => insertTag(setHeadline, tag)}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">CTA</Label>
                  <Select value={cta} onValueChange={setCta}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATALOGUE_CTA_OPTIONS.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <Separator />

            {/* Common fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Warmup Config</Label>
                <Select value={warmupConfigId} onValueChange={setWarmupConfigId}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {warmupConfigs.map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.name || "(Unnamed)"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Pixel ID</Label>
                <Input value={pixelId} onChange={(e) => setPixelId(e.target.value)} placeholder="120938471625384" className="h-9 text-sm" />
              </div>
            </div>

            {/* Pages */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Pages</Label>
              <div className="flex flex-wrap gap-2 rounded-md border p-2">
                {DUMMY_PAGES.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5">
                    <Checkbox checked={pageIds.includes(p.id)} onCheckedChange={() => togglePage(p.id)} />
                    <span className="text-sm">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RRM */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">RRM Settings</Label>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Dilution</Label>
                  <p className="text-xs text-muted-foreground">Auto-launch clean ads to lower rejection ratio.</p>
                </div>
                <Switch checked={dilutionEnabled} onCheckedChange={setDilutionEnabled} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Replacement</Label>
                  <p className="text-xs text-muted-foreground">Replace rejected ads with approved creative.</p>
                </div>
                <Switch checked={replacementEnabled} onCheckedChange={setReplacementEnabled} />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit()}>
            {isEditing ? "Save Changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
