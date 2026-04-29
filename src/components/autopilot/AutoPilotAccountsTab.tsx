import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Settings, Package, X, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AutoPilotMoneyPagesPopover } from "./AutoPilotMoneyPagesPopover";
import { AutoPilotAccountDrawer } from "./AutoPilotAccountDrawer";
import { BulkCatalogueAssignModal } from "./BulkCatalogueAssignModal";
import { AutoPilotRRMDrawer } from "./AutoPilotRRMDrawer";
import { DUMMY_ACCOUNT_CATALOGUES } from "./autopilot-dummy-data";
import { DUMMY_CATALOGUES, DUMMY_PRODUCT_SETS } from "@/lib/catalogue-dummy-data";
import type { LaunchStrategy } from "./AutoPilotConfigTab";
import type { WarmupConfig } from "./AutoPilotWarmupConfigTab";

export interface AccountCatalogueConfig {
  catalogueId: string;
  productSetId: string;
  primaryText: string;
  headline: string;
  cta: string;
}

export interface AccountRRMState {
  dilutionEnabled: boolean;
  replacementEnabled: boolean;
  guardrailMode: string;
  healthState: string;
}

export interface AccountState {
  id: string;
  name: string;
  bmName: string;
  status: string;
  autopilotOn: boolean;
  pageIds: string[];
  warmupEnabled: boolean;
  warmupCurrentDay: number;
  assignedConfigId: string | null;
  assignedWarmupConfigId: string | null;
  campaignUrlId: string;
  folder: string;
  adsLaunched: number;
  pixelId: string;
  overrideSkipReview?: boolean;
  overrideInterval?: number;
  catalogueConfig?: AccountCatalogueConfig;
  rrm: AccountRRMState;
}

const DUMMY_CAMPAIGN_URLS = [
  { id: "cu-1", name: "Weight Loss – US", folders: ["Folder A", "Folder B"], template: "US Broad 18-65" },
  { id: "cu-2", name: "Skincare – EU", folders: ["Folder C"], template: "EU Lookalike" },
];

const INITIAL_ACCOUNTS: AccountState[] = [
  {
    id: "acc-1", name: "US – Main", bmName: "BM Alpha", status: "Active",
    autopilotOn: true, pageIds: ["pg-1", "pg-3"],
    warmupEnabled: false, warmupCurrentDay: 0,
    assignedConfigId: null, assignedWarmupConfigId: null,
    campaignUrlId: "cu-1", folder: "Folder A",
    adsLaunched: 142, pixelId: "120938471625384",
    rrm: { dilutionEnabled: true, replacementEnabled: true, guardrailMode: "auto_maintain", healthState: "safe" },
  },
  {
    id: "acc-2", name: "EU – Scale", bmName: "BM Alpha", status: "Active",
    autopilotOn: true, pageIds: ["pg-2"],
    warmupEnabled: false, warmupCurrentDay: 0,
    assignedConfigId: null, assignedWarmupConfigId: null,
    campaignUrlId: "cu-2", folder: "Folder C",
    adsLaunched: 87, pixelId: "998877665544332",
    rrm: { dilutionEnabled: true, replacementEnabled: false, guardrailMode: "auto_maintain", healthState: "warning" },
  },
  {
    id: "acc-3", name: "US – Warm-up Test", bmName: "BM Beta", status: "Active",
    autopilotOn: false, pageIds: [],
    warmupEnabled: true, warmupCurrentDay: 3,
    assignedConfigId: null, assignedWarmupConfigId: "wu-2",
    campaignUrlId: "", folder: "",
    adsLaunched: 12, pixelId: "",
    rrm: { dilutionEnabled: false, replacementEnabled: false, guardrailMode: "off", healthState: "safe" },
  },
  {
    id: "acc-4", name: "UK – Inactive", bmName: "BM Beta", status: "Disabled",
    autopilotOn: false, pageIds: [],
    warmupEnabled: false, warmupCurrentDay: 0,
    assignedConfigId: null, assignedWarmupConfigId: null,
    campaignUrlId: "", folder: "",
    adsLaunched: 0, pixelId: "",
    rrm: { dilutionEnabled: false, replacementEnabled: false, guardrailMode: "off", healthState: "blocked" },
  },
];

interface Props {
  configs: LaunchStrategy[];
  warmupConfigs: WarmupConfig[];
}

export function AutoPilotAccountsTab({ configs, warmupConfigs }: Props) {
  const [accounts, setAccounts] = useState<AccountState[]>(INITIAL_ACCOUNTS);
  const [drawerAccount, setDrawerAccount] = useState<AccountState | null>(null);
  const [bulkCatalogueOpen, setBulkCatalogueOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rrmDrawerAccount, setRrmDrawerAccount] = useState<AccountState | null>(null);

  const defaultConfig = configs.find((c) => c.isDefault);
  const defaultWarmup = warmupConfigs.find((c) => c.isDefault);

  const resolveStrategy = (a: AccountState) => {
    const id = a.assignedConfigId ?? defaultConfig?.id;
    return configs.find((c) => c.id === id);
  };

  // Always show catalogue columns & bulk tools (catalogue config is account-level)
  const hasCatalogueStrategy = true;

  const updateAccount = (updated: AccountState) => {
    setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    if (drawerAccount?.id === updated.id) setDrawerAccount(updated);
  };

  const toggle = (id: string, val: boolean) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, autopilotOn: val } : a)));
  };

  const updatePages = (id: string, pageIds: string[]) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, pageIds } : a)));
  };

  const updateConfigAssignment = (id: string, configId: string | null) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, assignedConfigId: configId } : a)));
  };

  const updateWarmupAssignment = (id: string, warmupId: string | null) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, assignedWarmupConfigId: warmupId } : a)));
  };

  const updateCampaignUrl = (id: string, cuId: string) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, campaignUrlId: cuId, folder: "" } : a)));
  };

  const updateFolder = (id: string, folder: string) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, folder } : a)));
  };

  const handleBulkCatalogueApply = (accountIds: string[], config: AccountCatalogueConfig) => {
    setAccounts((prev) => prev.map((a) =>
      accountIds.includes(a.id) ? { ...a, catalogueConfig: config } : a
    ));
  };

  const warmupBadge = (a: AccountState) => {
    if (!a.warmupEnabled) return <Badge variant="outline" className="text-xs">Off</Badge>;
    const wc = warmupConfigs.find((c) => c.id === (a.assignedWarmupConfigId ?? defaultWarmup?.id));
    const days = wc?.warmupDays ?? 7;
    if (a.warmupCurrentDay >= days) return <Badge className="text-xs">Ready</Badge>;
    return <Badge variant="secondary" className="text-xs">Day {a.warmupCurrentDay}/{days}</Badge>;
  };

  const getCatalogueName = (a: AccountState) => {
    if (!a.catalogueConfig?.catalogueId) return null;
    return DUMMY_CATALOGUES.find((c) => c.id === a.catalogueConfig!.catalogueId)?.name;
  };

  const getProductSetName = (a: AccountState) => {
    if (!a.catalogueConfig?.catalogueId || !a.catalogueConfig?.productSetId) return null;
    const sets = DUMMY_PRODUCT_SETS[a.catalogueConfig.catalogueId] || [];
    return sets.find((s) => s.id === a.catalogueConfig!.productSetId)?.name;
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => prev.length === accounts.length ? [] : accounts.map((a) => a.id));
  };

  return (
    <>
      {/* Selection-based bulk toolbar */}
      {selectedIds.length >= 2 && hasCatalogueStrategy && (
        <div className="flex items-center gap-3 mb-3 rounded-md border bg-muted/50 px-3 py-2">
          <span className="text-xs font-medium">{selectedIds.length} account{selectedIds.length !== 1 ? "s" : ""} selected</span>
          <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => setBulkCatalogueOpen(true)}>
            <Package className="h-3.5 w-3.5" /> Bulk Assign Catalogue
          </Button>
          <Button variant="ghost" size="sm" className="h-7 ml-auto" onClick={() => setSelectedIds([])}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={selectedIds.length === accounts.length && accounts.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Account</TableHead>
              <TableHead>BM</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pixel ID</TableHead>
              <TableHead>Launch Strategy</TableHead>
              <TableHead>Campaign URL</TableHead>
              <TableHead>Folder</TableHead>
              {hasCatalogueStrategy && <TableHead>Catalogue</TableHead>}
              {hasCatalogueStrategy && <TableHead>Product Set</TableHead>}
              <TableHead>Warm-up Config</TableHead>
              <TableHead className="text-center">Dilution</TableHead>
              <TableHead className="text-center">Replacement</TableHead>
              <TableHead className="text-center">AutoPilot</TableHead>
              <TableHead className="text-center">Pages</TableHead>
              <TableHead className="text-center">Warm-up</TableHead>
              <TableHead className="text-right">Ads Launched</TableHead>
              <TableHead className="text-center w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((a) => {
              const strategy = resolveStrategy(a);
              const isCatalogue = strategy?.adType === "catalogue";

              return (
                <TableRow key={a.id} data-state={selectedIds.includes(a.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(a.id)}
                      onCheckedChange={() => toggleSelect(a.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{a.bmName}</TableCell>
                  <TableCell>
                    <Badge variant={a.status === "Active" ? "default" : "outline"} className="text-xs">{a.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8 w-36 text-xs font-mono"
                      placeholder="Enter pixel ID"
                      value={a.pixelId}
                      onChange={(e) => setAccounts((prev) => prev.map((acc) => acc.id === a.id ? { ...acc, pixelId: e.target.value } : acc))}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={a.assignedConfigId ?? "__default__"}
                      onValueChange={(v) => updateConfigAssignment(a.id, v === "__default__" ? null : v)}
                    >
                      <SelectTrigger className="h-8 w-44 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {defaultConfig && (
                          <SelectItem value="__default__">
                            {defaultConfig.name || "Untitled"} (Default)
                          </SelectItem>
                        )}
                        {configs.filter((c) => !c.isDefault).map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name || "Untitled"}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={a.campaignUrlId || "__none__"} onValueChange={(v) => updateCampaignUrl(a.id, v === "__none__" ? "" : v)}>
                      <SelectTrigger className="h-8 w-44 text-xs">
                        <SelectValue placeholder="Select URL" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {DUMMY_CAMPAIGN_URLS.map((cu) => (
                          <SelectItem key={cu.id} value={cu.id}>{cu.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {isCatalogue ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (() => {
                      const cu = DUMMY_CAMPAIGN_URLS.find((c) => c.id === a.campaignUrlId);
                      if (!cu) return <span className="text-xs text-muted-foreground">—</span>;
                      return (
                        <Select value={a.folder || "__none__"} onValueChange={(v) => updateFolder(a.id, v === "__none__" ? "" : v)}>
                          <SelectTrigger className="h-8 w-36 text-xs">
                            <SelectValue placeholder="Select folder" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">None</SelectItem>
                            {cu.folders.map((f) => (
                              <SelectItem key={f} value={f}>{f}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    })()}
                  </TableCell>
                  {hasCatalogueStrategy && (
                    <TableCell>
                      {isCatalogue ? (
                        getCatalogueName(a) ? (
                          <Badge variant="secondary" className="text-xs">{getCatalogueName(a)}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-destructive">Not set</Badge>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                  {hasCatalogueStrategy && (
                    <TableCell>
                      {isCatalogue && a.catalogueConfig?.productSetId ? (
                        <span className="text-xs">{getProductSetName(a) || "All"}</span>
                      ) : isCatalogue ? (
                        <span className="text-xs text-muted-foreground">All</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <Select
                      value={a.assignedWarmupConfigId ?? "__default__"}
                      onValueChange={(v) => updateWarmupAssignment(a.id, v === "__default__" ? null : v)}
                    >
                      <SelectTrigger className="h-8 w-44 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {defaultWarmup && (
                          <SelectItem value="__default__">
                            {defaultWarmup.name || "Untitled"} (Default)
                          </SelectItem>
                        )}
                        {warmupConfigs.filter((c) => !c.isDefault).map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name || "Untitled"}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={a.rrm.dilutionEnabled ? "default" : "outline"}
                      className="text-xs"
                    >
                      {a.rrm.dilutionEnabled ? "On" : "Off"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={a.rrm.replacementEnabled ? "default" : "outline"}
                      className="text-xs"
                    >
                      {a.rrm.replacementEnabled ? "On" : "Off"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch checked={a.autopilotOn} onCheckedChange={(v) => toggle(a.id, v)} />
                  </TableCell>
                  <TableCell className="text-center">
                    <AutoPilotMoneyPagesPopover pageIds={a.pageIds} onChange={(p) => updatePages(a.id, p)} />
                  </TableCell>
                  <TableCell className="text-center">{warmupBadge(a)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{a.adsLaunched.toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRrmDrawerAccount(a)}>
                            <ShieldCheck className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>RRM Settings</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDrawerAccount(a)}>
                            <Settings className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Account Settings</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AutoPilotAccountDrawer
        open={!!drawerAccount}
        onOpenChange={(o) => !o && setDrawerAccount(null)}
        account={drawerAccount}
        onUpdate={updateAccount}
        configs={configs}
        warmupConfigs={warmupConfigs}
      />

      <BulkCatalogueAssignModal
        open={bulkCatalogueOpen}
        onOpenChange={setBulkCatalogueOpen}
        accounts={accounts.filter((a) => selectedIds.includes(a.id))}
        onApply={(accountIds, config) => {
          handleBulkCatalogueApply(accountIds, config);
          setSelectedIds([]);
        }}
      />

      <AutoPilotRRMDrawer
        open={!!rrmDrawerAccount}
        onOpenChange={(o) => !o && setRrmDrawerAccount(null)}
        account={rrmDrawerAccount}
        onUpdate={(updated) => {
          setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
          if (rrmDrawerAccount?.id === updated.id) setRrmDrawerAccount(updated);
        }}
      />
    </>
  );
}
