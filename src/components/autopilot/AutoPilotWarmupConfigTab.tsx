import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Plus, Star, Trash2, Flame, Image, Video, Link2, AlertCircle,
  Upload, FolderOpen, Layers, AlertTriangle, Wand2, ThumbsUp, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DUMMY_WARMUP_LINKS, DUMMY_FOLDERS_WITH_CREATIVES } from "./autopilot-dummy-data";

const MAX_LINKS = 10;

export interface WarmupCreativeItem {
  id: string;
  name: string;
  type: "image" | "video";
  source: "upload" | "folder";
}

export interface WarmupLinkEntry {
  id: string;
  linkId: string;
  creativeMode: "auto" | "manual";
  creative?: WarmupCreativeItem;
}

export interface WarmupConfig {
  id: string;
  name: string;
  isDefault: boolean;
  warmupDays: number;
  // Traffic settings
  trafficAdsCount: number;
  trafficBudgetPerAd: number;
  // Page Like settings
  pageLikeEnabled: boolean;
  pageLikeBudget: number;
  pageLikeCreativeMode: "ai" | "manual";
  pageLikeCreative?: WarmupCreativeItem;
  // Merged links + creatives
  links: WarmupLinkEntry[];
}

interface Props {
  configs: WarmupConfig[];
  selectedId: string;
  onSelect: (id: string) => void;
  onChange: (c: WarmupConfig) => void;
  onAdd: () => void;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  assignedCounts?: Record<string, number>;
}

export function AutoPilotWarmupConfigTab({ configs, selectedId, onSelect, onChange, onAdd, onSetDefault, onDelete, assignedCounts = {} }: Props) {
  const config = configs.find((c) => c.id === selectedId);
  const assignedCount = config ? (assignedCounts[config.id] ?? 0) : 0;
  const isAssigned = assignedCount > 0;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageLikeFileRef = useRef<HTMLInputElement>(null);
  const [uploadingForLinkId, setUploadingForLinkId] = useState<string | null>(null);
  const [folderSelectForLinkId, setFolderSelectForLinkId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");

  const set = <K extends keyof WarmupConfig>(key: K, val: WarmupConfig[K]) => {
    if (!config) return;
    onChange({ ...config, [key]: val });
  };

  const updateLink = (linkEntryId: string, patch: Partial<WarmupLinkEntry>) => {
    if (!config) return;
    set("links", config.links.map((l) => (l.id === linkEntryId ? { ...l, ...patch } : l)));
  };

  const addLink = (linkId: string) => {
    if (!config || config.links.length >= MAX_LINKS) return;
    if (config.links.some((l) => l.linkId === linkId)) return;
    const id = `wle-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set("links", [...config.links, { id, linkId, creativeMode: "auto" }]);
  };

  const removeLink = (entryId: string) => {
    if (!config) return;
    set("links", config.links.filter((l) => l.id !== entryId));
  };

  const handleCreativeUpload = (e: React.ChangeEvent<HTMLInputElement>, linkEntryId: string) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const isVideo = file.type.startsWith("video/");
    const creative: WarmupCreativeItem = {
      id: `upload-${Date.now()}`,
      name: file.name,
      type: isVideo ? "video" : "image",
      source: "upload",
    };
    updateLink(linkEntryId, { creativeMode: "manual", creative });
    e.target.value = "";
    setUploadingForLinkId(null);
  };

  const handlePageLikeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !config) return;
    const file = e.target.files[0];
    const isVideo = file.type.startsWith("video/");
    const creative: WarmupCreativeItem = {
      id: `pl-upload-${Date.now()}`,
      name: file.name,
      type: isVideo ? "video" : "image",
      source: "upload",
    };
    onChange({ ...config, pageLikeCreativeMode: "manual", pageLikeCreative: creative });
    e.target.value = "";
  };

  const assignFolderCreative = (linkEntryId: string, creativeId: string) => {
    const folder = DUMMY_FOLDERS_WITH_CREATIVES.find((f) => f.id === selectedFolderId);
    const fc = folder?.creatives.find((c) => c.id === creativeId);
    if (!fc) return;
    updateLink(linkEntryId, {
      creativeMode: "manual",
      creative: { id: fc.id, name: fc.name, type: fc.type, source: "folder" },
    });
    setFolderSelectForLinkId(null);
    setSelectedFolderId("");
  };

  const availableLinks = config
    ? DUMMY_WARMUP_LINKS.filter((l) => !config.links.some((le) => le.linkId === l.id))
    : [];

  const selectedFolder = DUMMY_FOLDERS_WITH_CREATIVES.find((f) => f.id === selectedFolderId);

  return (
    <div className="flex gap-6 p-1">
      {/* Config list panel */}
      <div className="w-64 shrink-0 space-y-2">
        <Button size="sm" className="w-full gap-1.5" onClick={onAdd}>
          <Plus className="h-4 w-4" /> New Warm-up Config
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
                <Flame className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate font-medium">{c.name || "Untitled"}</span>
                {c.isDefault && (
                  <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5">Default</Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Config detail */}
      {config ? (
        <div className="flex-1 space-y-6">
          {/* Assignment warning */}
          {isAssigned && (
            <Alert variant="destructive" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 text-foreground">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-sm">
                This warm-up config is assigned to <span className="font-semibold">{assignedCount} account{assignedCount > 1 ? "s" : ""}</span>. Changes will affect those accounts.
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
                <Star className="h-3 w-3" /> Default Config
              </Badge>
            )}
            {configs.length > 1 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-auto">
                    <Button variant="ghost" size="sm" className="gap-1.5 text-destructive" onClick={() => onDelete(config.id)} disabled={isAssigned}>
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

          {/* ─── General Settings ─── */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">General Settings</CardTitle>
              </div>
              <CardDescription>Name, warm-up duration, and launch parameters.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Config Name</Label>
                <Input placeholder="e.g. Standard 7-Day Warm-up" value={config.name} onChange={(e) => set("name", e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>Warm-up Days</Label>
                <Input type="number" min={1} value={config.warmupDays} onChange={(e) => set("warmupDays", +e.target.value || 1)} />
              </div>

              {/* Fixed structure */}
              <div className="sm:col-span-2 rounded-md border border-border bg-muted/50 p-3 flex items-center gap-3">
                <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Fixed Warm-up Structure</p>
                  <p className="text-xs text-muted-foreground">1 Campaign → 1 Ad Set → 1 Ad per link — this structure is used automatically during warm-up.</p>
                </div>
              </div>

              {/* Traffic section */}
              <div className="sm:col-span-2 space-y-3 rounded-md border border-border p-4">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">Traffic Campaign</p>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Info className="h-3 w-3 shrink-0" />
                  These ads will use the links added in the "Warm-up Links & Creatives" section below.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Ads to Launch</Label>
                    <Input type="number" min={1} max={MAX_LINKS} value={config.trafficAdsCount} onChange={(e) => set("trafficAdsCount", Math.min(+e.target.value || 1, MAX_LINKS))} />
                    <p className="text-[10px] text-muted-foreground">Number of ads to launch during warm-up (1 ad per link).</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Budget per Ad ($)</Label>
                    <Input type="number" min={0} step={0.5} value={config.trafficBudgetPerAd} onChange={(e) => set("trafficBudgetPerAd", +e.target.value || 0)} />
                    <p className="text-[10px] text-muted-foreground">Daily budget allocated to each traffic ad.</p>
                  </div>
                </div>
              </div>

              {/* Page Like section */}
              <div className="sm:col-span-2 space-y-3 rounded-md border border-border p-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`pl-enabled-${config.id}`}
                    checked={config.pageLikeEnabled}
                    onCheckedChange={(v) => set("pageLikeEnabled", !!v)}
                  />
                  <Label htmlFor={`pl-enabled-${config.id}`} className="flex items-center gap-1.5 cursor-pointer">
                    <ThumbsUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Launch Page Like Ad</span>
                  </Label>
                </div>

                {config.pageLikeEnabled && (
                  <div className="space-y-3 pl-6">
                    <div className="space-y-1.5 max-w-xs">
                      <Label>Page Like Budget ($)</Label>
                      <Input type="number" min={0} step={0.5} value={config.pageLikeBudget} onChange={(e) => set("pageLikeBudget", +e.target.value || 0)} />
                      <p className="text-[10px] text-muted-foreground">Daily budget for the page like campaign.</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Creative</Label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            onChange({ ...config, pageLikeCreativeMode: "ai", pageLikeCreative: undefined });
                          }}
                          className={cn(
                            "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors",
                            config.pageLikeCreativeMode === "ai"
                              ? "border-primary bg-primary/5 font-medium"
                              : "border-border hover:bg-muted"
                          )}
                        >
                          <Wand2 className="h-3 w-3" /> AI Generated
                        </button>
                        <button
                          onClick={() => set("pageLikeCreativeMode", "manual")}
                          className={cn(
                            "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors",
                            config.pageLikeCreativeMode === "manual"
                              ? "border-primary bg-primary/5 font-medium"
                              : "border-border hover:bg-muted"
                          )}
                        >
                          <Upload className="h-3 w-3" /> Custom
                        </button>
                      </div>

                      {config.pageLikeCreativeMode === "ai" && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Wand2 className="h-3 w-3 shrink-0" />
                          An AI-generated creative will be used for the page like ad.
                        </p>
                      )}

                      {config.pageLikeCreativeMode === "manual" && (
                        <div className="space-y-1.5">
                          {config.pageLikeCreative ? (
                            <div className="flex items-center gap-2">
                              {config.pageLikeCreative.type === "video" ? <Video className="h-3.5 w-3.5 text-muted-foreground" /> : <Image className="h-3.5 w-3.5 text-muted-foreground" />}
                              <span className="text-xs truncate">{config.pageLikeCreative.name}</span>
                              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onChange({ ...config, pageLikeCreative: undefined })}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <input ref={pageLikeFileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handlePageLikeUpload} />
                              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => pageLikeFileRef.current?.click()}>
                                <Upload className="h-3 w-3" /> Upload Creative
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ─── Warm-up Links & Creatives (Merged) ─── */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Warm-up Links & Creatives</CardTitle>
                </div>
                <span className="text-xs text-muted-foreground">{config.links.length} of {MAX_LINKS} max</span>
              </div>
              <CardDescription>Add destination URLs and assign a creative to each, or use Auto to pull the OG image & title.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Link entries */}
              <div className="space-y-2 max-h-[420px] overflow-y-auto">
                {config.links.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2">No links added yet. Add a link to get started.</p>
                )}
                {config.links.map((entry, idx) => {
                  const lk = DUMMY_WARMUP_LINKS.find((l) => l.id === entry.linkId);
                  if (!lk) return null;
                  return (
                    <div key={entry.id} className="rounded-md border border-border p-3 space-y-2">
                      {/* Link header */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">{idx + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium block truncate">{lk.label}</span>
                          <span className="text-[10px] text-muted-foreground truncate block">{lk.url}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeLink(entry.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>

                      {/* Creative assignment */}
                      <div className="flex items-center gap-2 pl-5">
                        <span className="text-xs text-muted-foreground shrink-0">Creative:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateLink(entry.id, { creativeMode: "auto", creative: undefined })}
                            className={cn(
                              "rounded border px-2 py-0.5 text-[11px] transition-colors",
                              entry.creativeMode === "auto"
                                ? "border-primary bg-primary/5 font-medium"
                                : "border-border hover:bg-muted"
                            )}
                          >
                            Auto (OG)
                          </button>
                          <button
                            onClick={() => updateLink(entry.id, { creativeMode: "manual" })}
                            className={cn(
                              "rounded border px-2 py-0.5 text-[11px] transition-colors",
                              entry.creativeMode === "manual"
                                ? "border-primary bg-primary/5 font-medium"
                                : "border-border hover:bg-muted"
                            )}
                          >
                            Manual
                          </button>
                        </div>
                      </div>

                      {entry.creativeMode === "auto" && (
                        <div className="pl-5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Wand2 className="h-3 w-3 shrink-0" />
                          Will use the OG image & title from the link for launching.
                        </div>
                      )}

                      {entry.creativeMode === "manual" && (
                        <div className="pl-5 space-y-1.5">
                          {entry.creative ? (
                            <div className="flex items-center gap-2">
                              {entry.creative.type === "video" ? <Video className="h-3 w-3 text-muted-foreground" /> : <Image className="h-3 w-3 text-muted-foreground" />}
                              <span className="text-xs truncate">{entry.creative.name}</span>
                              <Badge variant="outline" className="text-[10px] px-1 py-0">{entry.creative.type}</Badge>
                              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => updateLink(entry.id, { creative: undefined })}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <input
                                ref={uploadingForLinkId === entry.id ? fileInputRef : undefined}
                                type="file"
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={(e) => handleCreativeUpload(e, entry.id)}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 text-[11px] h-7"
                                onClick={() => {
                                  setUploadingForLinkId(entry.id);
                                  setTimeout(() => fileInputRef.current?.click(), 0);
                                }}
                              >
                                <Upload className="h-3 w-3" /> Upload
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 text-[11px] h-7"
                                onClick={() => {
                                  setFolderSelectForLinkId(folderSelectForLinkId === entry.id ? null : entry.id);
                                  setSelectedFolderId("");
                                }}
                              >
                                <FolderOpen className="h-3 w-3" /> From Folder
                              </Button>
                            </div>
                          )}

                          {/* Inline folder picker */}
                          {folderSelectForLinkId === entry.id && !entry.creative && (
                            <div className="flex items-center gap-2 mt-1">
                              <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                                <SelectTrigger className="h-7 text-[11px] w-36">
                                  <SelectValue placeholder="Folder…" />
                                </SelectTrigger>
                                <SelectContent>
                                  {DUMMY_FOLDERS_WITH_CREATIVES.map((f) => (
                                    <SelectItem key={f.id} value={f.id} className="text-xs">{f.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {selectedFolder && (
                                <Select onValueChange={(id) => assignFolderCreative(entry.id, id)}>
                                  <SelectTrigger className="h-7 text-[11px] w-40">
                                    <SelectValue placeholder="Creative…" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {selectedFolder.creatives.map((fc) => (
                                      <SelectItem key={fc.id} value={fc.id} className="text-xs">
                                        <div className="flex items-center gap-1.5">
                                          {fc.type === "video" ? <Video className="h-3 w-3" /> : <Image className="h-3 w-3" />}
                                          {fc.name}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add link */}
              {availableLinks.length > 0 && config.links.length < MAX_LINKS && (
                <Select onValueChange={addLink}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Add a warm-up link…" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLinks.map((lk) => (
                      <SelectItem key={lk.id} value={lk.id}>
                        <div className="flex items-center gap-2">
                          <Link2 className="h-3 w-3" />
                          <span>{lk.label}</span>
                          <span className="text-muted-foreground text-[10px] truncate max-w-[140px]">{lk.url}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>These links and creatives will be used during the warm-up phase before the account transitions to full AutoPilot launching.</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Select or create a warm-up config to get started.
        </div>
      )}
    </div>
  );
}
