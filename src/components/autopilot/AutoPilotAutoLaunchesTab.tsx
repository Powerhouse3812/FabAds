import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, Layers, Server } from "lucide-react";
import { CreateAutoLaunchModal } from "./CreateAutoLaunchModal";
import type { LaunchStrategy } from "./AutoPilotConfigTab";
import type { WarmupConfig } from "./AutoPilotWarmupConfigTab";
import type { AccountCatalogueConfig } from "./AutoPilotAccountsTab";

export interface AutoLaunch {
  id: string;
  name: string;
  mode: "multi-strategy" | "multi-account";
  enabled: boolean;
  creativeSource: "folder" | "catalogue";
  campaignUrlId?: string;
  folder?: string;
  catalogueConfig?: AccountCatalogueConfig;
  accountIds: string[];
  strategyIds: string[];
  warmupConfigId?: string;
  pixelId: string;
  pageIds: string[];
  dilutionEnabled: boolean;
  replacementEnabled: boolean;
  createdAt: string;
}

// Resolve names from dummy data
const ACCOUNT_NAMES: Record<string, string> = {
  "acc-1": "US – Main",
  "acc-2": "EU – Scale",
  "acc-3": "US – Warm-up Test",
  "acc-4": "UK – Inactive",
};

const CAMPAIGN_URL_NAMES: Record<string, string> = {
  "cu-1": "Weight Loss – US",
  "cu-2": "Skincare – EU",
};

const INITIAL_AUTO_LAUNCHES: AutoLaunch[] = [
  {
    id: "al-1",
    name: "US Weight Loss Multi-Strategy",
    mode: "multi-strategy",
    enabled: true,
    creativeSource: "folder",
    campaignUrlId: "cu-1",
    folder: "Folder A",
    accountIds: ["acc-1"],
    strategyIds: ["cfg-1", "cfg-2"],
    warmupConfigId: "wu-1",
    pixelId: "120938471625384",
    pageIds: ["pg-1", "pg-3"],
    dilutionEnabled: true,
    replacementEnabled: true,
    createdAt: "2026-03-04",
  },
  {
    id: "al-2",
    name: "EU Catalogue Scale",
    mode: "multi-account",
    enabled: true,
    creativeSource: "catalogue",
    catalogueConfig: {
      catalogueId: "cat-2",
      productSetId: "all-2",
      primaryText: "Shop {{product.name}} today!",
      headline: "{{product.name}} – {{product.price}}",
      cta: "Shop now",
    },
    accountIds: ["acc-1", "acc-2"],
    strategyIds: ["cfg-2"],
    pixelId: "998877665544332",
    pageIds: ["pg-2"],
    dilutionEnabled: true,
    replacementEnabled: false,
    createdAt: "2026-03-05",
  },
];

interface Props {
  strategies: LaunchStrategy[];
  warmupConfigs: WarmupConfig[];
}

export function AutoPilotAutoLaunchesTab({ strategies, warmupConfigs }: Props) {
  const [autoLaunches, setAutoLaunches] = useState<AutoLaunch[]>(INITIAL_AUTO_LAUNCHES);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLaunch, setEditingLaunch] = useState<AutoLaunch | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreate = () => {
    setEditingLaunch(null);
    setModalOpen(true);
  };

  const handleEdit = (al: AutoLaunch) => {
    setEditingLaunch(al);
    setModalOpen(true);
  };

  const handleSubmit = (al: AutoLaunch) => {
    setAutoLaunches((prev) => {
      const existing = prev.find((x) => x.id === al.id);
      if (existing) return prev.map((x) => (x.id === al.id ? al : x));
      return [...prev, al];
    });
  };

  const handleDelete = (id: string) => {
    setAutoLaunches((prev) => prev.filter((x) => x.id !== id));
  };

  const handleToggle = (id: string, enabled: boolean) => {
    setAutoLaunches((prev) => prev.map((x) => (x.id === id ? { ...x, enabled } : x)));
  };

  const resolveStrategyName = (id: string) => strategies.find((s) => s.id === id)?.name || "(Unknown)";
  const resolveWarmupName = (id?: string) => {
    if (!id) return "—";
    return warmupConfigs.find((w) => w.id === id)?.name || "—";
  };

  // Generate sub-rows for an auto launch
  const getSubRows = (al: AutoLaunch) => {
    if (al.mode === "multi-strategy") {
      return al.strategyIds.map((sid) => ({
        key: `${al.id}-${sid}`,
        accountName: ACCOUNT_NAMES[al.accountIds[0]] ?? al.accountIds[0],
        strategyName: resolveStrategyName(sid),
      }));
    } else {
      return al.accountIds.map((aid) => ({
        key: `${al.id}-${aid}`,
        accountName: ACCOUNT_NAMES[aid] ?? aid,
        strategyName: resolveStrategyName(al.strategyIds[0]),
      }));
    }
  };

  const rowCount = (al: AutoLaunch) =>
    al.mode === "multi-strategy" ? al.strategyIds.length : al.accountIds.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Create automated launch configurations that generate multiple rows based on strategy and account combinations.
        </p>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> Create Auto Launch
        </Button>
      </div>

      {autoLaunches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <Layers className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No auto launches yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Auto Launch</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Creative Source</TableHead>
                <TableHead>Campaign URL / Catalogue</TableHead>
                <TableHead>Folder / Product Set</TableHead>
                <TableHead>Warmup</TableHead>
                <TableHead>Dilution</TableHead>
                <TableHead>Replacement</TableHead>
                <TableHead className="text-center">Rows</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {autoLaunches.map((al) => {
                const isExpanded = expandedIds.has(al.id);
                const subRows = getSubRows(al);

                return (
                  <Collapsible key={al.id} open={isExpanded} onOpenChange={() => toggleExpanded(al.id)} asChild>
                    <>
                      {/* Parent row */}
                      <TableRow className="bg-muted/30">
                        <TableCell className="px-2">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell className="font-medium">{al.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {al.mode === "multi-strategy" ? (
                              <><Layers className="mr-1 h-3 w-3" />Multi-Strategy</>
                            ) : (
                              <><Server className="mr-1 h-3 w-3" />Multi-Account</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs capitalize">{al.creativeSource}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {al.creativeSource === "folder"
                            ? CAMPAIGN_URL_NAMES[al.campaignUrlId ?? ""] ?? "—"
                            : al.catalogueConfig?.catalogueId
                              ? `Catalogue ${al.catalogueConfig.catalogueId}`
                              : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {al.creativeSource === "folder"
                            ? al.folder || "—"
                            : al.catalogueConfig?.productSetId || "—"}
                        </TableCell>
                        <TableCell className="text-sm">{resolveWarmupName(al.warmupConfigId)}</TableCell>
                        <TableCell>
                          <Badge variant={al.dilutionEnabled ? "default" : "outline"} className="text-xs">
                            {al.dilutionEnabled ? "On" : "Off"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={al.replacementEnabled ? "default" : "outline"} className="text-xs">
                            {al.replacementEnabled ? "On" : "Off"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-xs">{rowCount(al)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Switch checked={al.enabled} onCheckedChange={(v) => handleToggle(al.id, v)} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(al)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(al.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded sub-rows */}
                      <CollapsibleContent asChild>
                        <>
                          {subRows.map((row) => (
                            <TableRow key={row.key} className="bg-background">
                              <TableCell />
                              <TableCell className="pl-10 text-sm text-muted-foreground">
                                {al.mode === "multi-strategy" ? row.strategyName : row.accountName}
                              </TableCell>
                              <TableCell />
                              <TableCell />
                              <TableCell className="text-sm text-muted-foreground">
                                {al.mode === "multi-strategy" ? row.accountName : row.strategyName}
                              </TableCell>
                              <TableCell />
                              <TableCell />
                              <TableCell />
                              <TableCell />
                              <TableCell />
                              <TableCell />
                              <TableCell />
                            </TableRow>
                          ))}
                        </>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateAutoLaunchModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        strategies={strategies}
        warmupConfigs={warmupConfigs}
        onSubmit={handleSubmit}
        editingAutoLaunch={editingLaunch}
      />
    </div>
  );
}
