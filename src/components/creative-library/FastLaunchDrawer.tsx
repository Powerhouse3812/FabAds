import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AdAccountMultiSelect } from "@/components/launch/AdAccountMultiSelect";
import { useFolderLinkedCampaignUrls, useClFolderItems } from "@/hooks/use-cl-folders";
import { useFbConnection } from "@/hooks/use-fb-connection";
import { useTargetingTemplates } from "@/hooks/use-targeting-templates";
import { useCampaignUrlTargetingLinks } from "@/hooks/use-campaign-url-targeting";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Rocket, Package, Target, Image, Layers, AlertCircle, Loader2,
  Users, FileText, Link2, ChevronDown, ChevronUp, Plus, X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { AccountSetupConfig } from "@/components/launch/AccountSetupCard";

interface FastLaunchDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  folderName: string;
}

type LaunchMode = "adgroups" | "individual_media";

export function FastLaunchDrawer({ open, onOpenChange, folderId, folderName }: FastLaunchDrawerProps) {
  const navigate = useNavigate();
  const workspaceId = useWorkspace();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [selectedCuIds, setSelectedCuIds] = useState<string[]>([]);
  const [selectedAdAccountIds, setSelectedAdAccountIds] = useState<string[]>([]);
  const [launching, setLaunching] = useState(false);
  const [launchMode, setLaunchMode] = useState<LaunchMode>("individual_media");
  const [headlines, setHeadlines] = useState<string[]>([""]);
  const [primaryTexts, setPrimaryTexts] = useState<string[]>([""]);
  const [descriptions, setDescriptions] = useState<string[]>([""]);
  const [setupConfigs, setSetupConfigs] = useState<Record<string, AccountSetupConfig>>({});
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({});
  const [numCampaigns, setNumCampaigns] = useState(1);
  const [numAdsets, setNumAdsets] = useState(1);

  const { data: linkedCUs = [], isLoading: cusLoading } = useFolderLinkedCampaignUrls(folderId);
  const { data: folderItems = [] } = useClFolderItems(folderId);
  const { adAccounts, businessManagers } = useFbConnection();
  const { data: allTemplates = [] } = useTargetingTemplates();

  const mediaCount = useMemo(() => folderItems.filter((fi) => fi.item_type === "media").length, [folderItems]);
  const adgroupCount = useMemo(() => folderItems.filter((fi) => fi.item_type === "adgroup").length, [folderItems]);

  // Auto-select launch mode based on folder contents
  const showModeSelection = mediaCount > 0 && adgroupCount > 0;
  useEffect(() => {
    if (adgroupCount > 0 && mediaCount === 0) setLaunchMode("adgroups");
    else if (mediaCount > 0 && adgroupCount === 0) setLaunchMode("individual_media");
  }, [adgroupCount, mediaCount]);

  const toggleCu = (cuId: string) => {
    setSelectedCuIds((prev) =>
      prev.includes(cuId) ? prev.filter((id) => id !== cuId) : [...prev, cuId]
    );
  };

  const updateSetupConfig = (accId: string, key: keyof AccountSetupConfig, value: string) => {
    setSetupConfigs((prev) => ({
      ...prev,
      [accId]: { ...(prev[accId] || {}), [key]: value },
    }));
  };

  const toggleAccountExpand = (accId: string) => {
    setExpandedAccounts((prev) => ({ ...prev, [accId]: !prev[accId] }));
  };

  const canLaunch = selectedCuIds.length > 0 && selectedAdAccountIds.length > 0;

  const handleLaunch = async () => {
    if (!workspaceId || !user || !canLaunch) return;
    setLaunching(true);

    try {
      for (const cuId of selectedCuIds) {
        const cu = linkedCUs.find((l) => l.campaign_url_id === cuId);
        if (!cu) continue;

        const { data: targetingLinks } = await (supabase as any)
          .from("campaign_url_targeting_links")
          .select("*")
          .eq("campaign_url_id", cuId)
          .eq("is_default", true)
          .limit(1);

        let templatePayload: Record<string, any> = {};
        if (targetingLinks?.[0]) {
          const template = allTemplates.find((t) => t.id === targetingLinks[0].targeting_template_id);
          if (template) templatePayload = template.template_payload || {};
        }

        const { data: launch, error: launchErr } = await (supabase as any)
          .from("launches")
          .insert({
            workspace_id: workspaceId,
            name: `Fast Launch - ${cu.campaign_url.name}`,
            status: "launched",
            platform: "facebook",
            created_by: user.id,
            completed_step: 3,
          })
          .select()
          .single();
        if (launchErr) throw launchErr;

        const accRows = selectedAdAccountIds.map((accId) => ({
          launch_id: launch.id,
          fb_ad_account_id: accId,
          workspace_id: workspaceId,
          setup_config: setupConfigs[accId] || {},
        }));
        await (supabase as any).from("launch_ad_accounts").insert(accRows);

        const relevantItems = launchMode === "adgroups"
          ? folderItems.filter((fi) => fi.item_type === "adgroup")
          : folderItems.filter((fi) => fi.item_type === "media");

        for (let c = 0; c < numCampaigns; c++) {
          const { data: camp } = await (supabase as any)
            .from("launch_campaigns")
            .insert({
              launch_id: launch.id,
              workspace_id: workspaceId,
              name: numCampaigns === 1 ? cu.campaign_url.name : `${cu.campaign_url.name} ${c + 1}`,
              sort_order: c,
              objective: templatePayload.objective || "OUTCOME_SALES",
              budget_type: templatePayload.budget_type || "adset_budget",
            })
            .select()
            .single();

          for (let s = 0; s < numAdsets; s++) {
            const { data: adset } = await (supabase as any)
              .from("launch_adsets")
              .insert({
                launch_id: launch.id,
                campaign_id: camp.id,
                workspace_id: workspaceId,
                name: `Adset ${s + 1}`,
                sort_order: s,
                targeting: templatePayload,
                budget_period: templatePayload.budget_period || "daily",
                budget_value: templatePayload.budget_value || null,
                bid_strategy: templatePayload.bid_strategy || null,
              })
              .select()
              .single();

            // Each adset gets identical items starting from index 0
            const adsCount = relevantItems.length || 1;
            const adRows = relevantItems.length > 0
              ? Array.from({ length: adsCount }, (_, slot) => {
                  const fi = relevantItems[slot % relevantItems.length];
                  return {
                    launch_id: launch.id,
                    adset_id: adset.id,
                    workspace_id: workspaceId,
                    name: `Ad ${slot + 1}`,
                    sort_order: slot,
                    status: "active",
                    ...(launchMode === "individual_media" ? {
                      headline: headlines.filter(h => h.trim()).join("\n") || null,
                      primary_text: primaryTexts.filter(p => p.trim()).join("\n") || null,
                      description: descriptions.filter(d => d.trim()).join("\n") || null,
                    } : {}),
                  };
                })
              : [{
                  launch_id: launch.id,
                  adset_id: adset.id,
                  workspace_id: workspaceId,
                  name: "Ad 1",
                  sort_order: 0,
                  status: "active",
                }];

            await (supabase as any).from("launch_ads").insert(adRows);
          }
        }

        await (supabase as any).from("activity_logs").insert({
          workspace_id: workspaceId,
          user_id: user.id,
          action: "fast_launch_created",
          target_email: user.email || "",
          metadata: { launch_id: launch.id, folder_id: folderId, campaign_url_id: cuId, launch_mode: launchMode },
        });
      }

      qc.invalidateQueries({ queryKey: ["launches"] });
      toast({ title: `${selectedCuIds.length} launch(es) created successfully` });
      onOpenChange(false);
      navigate("/launch");
    } catch (err: any) {
      toast({ title: "Launch failed", description: err.message, variant: "destructive" });
    } finally {
      setLaunching(false);
    }
  };

  const bmMap = Object.fromEntries(businessManagers.map((bm) => [bm.id, bm.name]));

  const addHeadline = () => setHeadlines((prev) => [...prev, ""]);
  const removeHeadline = (i: number) => setHeadlines((prev) => prev.filter((_, idx) => idx !== i));
  const updateHeadline = (i: number, v: string) => setHeadlines((prev) => prev.map((h, idx) => (idx === i ? v : h)));

  const addPrimaryText = () => setPrimaryTexts((prev) => [...prev, ""]);
  const removePrimaryText = (i: number) => setPrimaryTexts((prev) => prev.filter((_, idx) => idx !== i));
  const updatePrimaryText = (i: number, v: string) => setPrimaryTexts((prev) => prev.map((p, idx) => (idx === i ? v : p)));

  const addDescription = () => setDescriptions((prev) => [...prev, ""]);
  const removeDescription = (i: number) => setDescriptions((prev) => prev.filter((_, idx) => idx !== i));
  const updateDescription = (i: number, v: string) => setDescriptions((prev) => prev.map((d, idx) => (idx === i ? v : d)));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[90vw] sm:max-w-[90vw] flex flex-col p-0 overflow-hidden">
        <SheetHeader className="px-6 pt-4 pb-3 border-b border-border shrink-0">
          <SheetTitle className="text-sm flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            Fast Launch — {folderName}
          </SheetTitle>
          <SheetDescription className="text-xs">
            Configure and launch instantly. Select Campaign URLs, structure, ad copy, and accounts.
          </SheetDescription>
        </SheetHeader>

        {/* Two-column layout — no scroll */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* LEFT COLUMN — Campaign URLs, Structure, Ad Accounts */}
          <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto border-r border-border">
            {/* Campaign URLs */}
            <section>
              <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                Campaign URLs
              </h3>
              {cusLoading ? (
                <p className="text-xs text-muted-foreground">Loading…</p>
              ) : linkedCUs.length === 0 ? (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30">
                  <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">No Campaign URLs linked.</p>
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary"
                      onClick={() => { onOpenChange(false); navigate("/offers"); }}>
                      <Link2 className="h-3 w-3 mr-1" /> Link a Campaign URL
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {linkedCUs.map((link) => {
                    const isSelected = selectedCuIds.includes(link.campaign_url_id);
                    return (
                      <div key={link.id} className="space-y-1">
                        <label className="flex items-center gap-3 p-2 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors">
                          <Checkbox checked={isSelected} onCheckedChange={() => toggleCu(link.campaign_url_id)} />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-medium text-foreground">{link.campaign_url.name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <CuDefaultTemplate campaignUrlId={link.campaign_url_id} allTemplates={allTemplates} />
                            </div>
                          </div>
                        </label>
                        {isSelected && (
                          <TemplateSummaryCard campaignUrlId={link.campaign_url_id} allTemplates={allTemplates} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <Separator />

            {/* Structure Selection — always show, adgroups = coming soon */}
            <section>
              <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                Launch Structure
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Card
                  className="cursor-not-allowed opacity-60 border-border"
                >
                  <CardContent className="flex flex-col items-center text-center gap-1 p-2.5 relative">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Adgroups</span>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">Coming Soon</Badge>
                  </CardContent>
                </Card>
                <Card
                  className={`cursor-pointer transition-all border-primary ring-1 ring-primary/30`}
                  onClick={() => setLaunchMode("individual_media")}
                >
                  <CardContent className="flex flex-col items-center text-center gap-1 p-2.5">
                    <Image className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-foreground">Individual Media</span>
                    <Badge variant="secondary" className="text-[10px]">{mediaCount}</Badge>
                  </CardContent>
                </Card>
              </div>
            </section>

            <Separator />

            {/* Campaign Structure */}
            <section>
              <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                Campaign Structure
              </h3>
              <div className="flex items-end gap-2">
                <div className="space-y-1 flex-1">
                  <Label className="text-[10px] text-muted-foreground">Campaigns</Label>
                  <Input type="number" min={1} max={20} value={numCampaigns}
                    onChange={(e) => setNumCampaigns(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                    className="h-8 text-xs" />
                </div>
                <span className="pb-1.5 text-muted-foreground font-bold text-xs">×</span>
                <div className="space-y-1 flex-1">
                  <Label className="text-[10px] text-muted-foreground">Ad Sets</Label>
                  <Input type="number" min={1} max={20} value={numAdsets}
                    onChange={(e) => setNumAdsets(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                    className="h-8 text-xs" />
                </div>
                <span className="pb-1.5 text-muted-foreground font-bold text-xs">×</span>
                <div className="space-y-1 flex-1">
                  <Label className="text-[10px] text-muted-foreground">Ads</Label>
                  <div className="h-8 flex items-center px-2 rounded-md border border-input bg-muted/50 text-xs text-muted-foreground">
                    {mediaCount || 1}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Total: {numCampaigns * numAdsets * (mediaCount || 1)} ads
              </p>
            </section>

            <Separator />

            {/* Ad Accounts — common for all modes */}
            <section>
              <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                Ad Accounts
              </h3>
              <AdAccountMultiSelect
                adAccounts={adAccounts}
                businessManagers={businessManagers}
                selectedIds={selectedAdAccountIds}
                onChange={setSelectedAdAccountIds}
              />
              {selectedAdAccountIds.length > 0 && (
                <div className="mt-3 space-y-2">
                  {selectedAdAccountIds.map((accId) => {
                    const acc = adAccounts.find((a) => a.id === accId);
                    if (!acc) return null;
                    const isExpanded = expandedAccounts[accId] ?? false;
                    const cfg = setupConfigs[accId] || {};
                    return (
                      <Card key={accId} className="border border-border">
                        <div className="flex items-center justify-between px-3 py-2 cursor-pointer" onClick={() => toggleAccountExpand(accId)}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-medium text-foreground truncate">{acc.name}</span>
                            {acc.fb_business_manager_id && bmMap[acc.fb_business_manager_id] && (
                              <span className="text-[10px] text-muted-foreground">· {bmMap[acc.fb_business_manager_id]}</span>
                            )}
                          </div>
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                        </div>
                        {isExpanded && (
                          <CardContent className="pt-0 pb-3 px-3 space-y-2.5">
                            <Separator />
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Page</Label>
                                <Select value={cfg.page || ""} onValueChange={(v) => updateSetupConfig(accId, "page", v)}>
                                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select page" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="page-1">Sample Page 1</SelectItem>
                                    <SelectItem value="page-2">Sample Page 2</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Pixel</Label>
                                <Select value={cfg.pixel || ""} onValueChange={(v) => updateSetupConfig(accId, "pixel", v)}>
                                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select pixel" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pixel-1">Pixel - Main</SelectItem>
                                    <SelectItem value="pixel-2">Pixel - Retargeting</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Display Link</Label>
                                <Input placeholder="example.com" value={cfg.display_link || ""}
                                  onChange={(e) => updateSetupConfig(accId, "display_link", e.target.value)} className="h-8 text-xs" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">URL Tags</Label>
                                <Input placeholder="utm_source=fb&..." value={cfg.url_tags || ""}
                                  onChange={(e) => updateSetupConfig(accId, "url_tags", e.target.value)} className="h-8 text-xs" />
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>

            <Separator />

            {/* Folder Contents */}
            <section>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">{mediaCount} Media</Badge>
                <Badge variant="secondary" className="text-xs">{adgroupCount} Adgroups</Badge>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN — Ad Copy (individual media) */}
          <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
            {launchMode === "individual_media" && (
              <section>
                <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  Ad Copy <span className="text-muted-foreground font-normal">(optional)</span>
                </h3>
                <div className="space-y-3">
                  {/* Headlines */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Headlines</Label>
                    {headlines.map((h, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <Input placeholder={`Headline ${i + 1}`} value={h}
                          onChange={(e) => updateHeadline(i, e.target.value)} className="text-xs h-8" />
                        {headlines.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeHeadline(i)}>
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-primary px-2" onClick={addHeadline}>
                      <Plus className="h-3 w-3 mr-1" /> Add Headline
                    </Button>
                  </div>

                  {/* Primary Texts */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Primary Texts</Label>
                    {primaryTexts.map((p, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <Textarea placeholder={`Primary text ${i + 1}`} value={p}
                          onChange={(e) => updatePrimaryText(i, e.target.value)} className="text-xs min-h-[48px]" />
                        {primaryTexts.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 mt-0.5" onClick={() => removePrimaryText(i)}>
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-primary px-2" onClick={addPrimaryText}>
                      <Plus className="h-3 w-3 mr-1" /> Add Primary Text
                    </Button>
                  </div>

                  {/* Descriptions */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Descriptions</Label>
                    {descriptions.map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <Input placeholder={`Description ${i + 1}`} value={d}
                          onChange={(e) => updateDescription(i, e.target.value)} className="text-xs h-8" />
                        {descriptions.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeDescription(i)}>
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-primary px-2" onClick={addDescription}>
                      <Plus className="h-3 w-3 mr-1" /> Add Description
                    </Button>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        <SheetFooter className="px-6 py-3 border-t border-border flex-row justify-end gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" disabled={!canLaunch || launching} onClick={handleLaunch}>
            {launching ? (
              <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Launching…</>
            ) : (
              <><Rocket className="h-3.5 w-3.5 mr-1.5" />Launch ({selectedCuIds.length})</>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Template summary sub-components ────────────────────────────────────────────

function CuDefaultTemplate({
  campaignUrlId,
  allTemplates,
}: {
  campaignUrlId: string;
  allTemplates: { id: string; name: string }[];
}) {
  const { data: links = [] } = useCampaignUrlTargetingLinks(campaignUrlId);
  const defaultLink = links.find((l) => l.is_default);
  const templateName = defaultLink
    ? allTemplates.find((t) => t.id === defaultLink.targeting_template_id)?.name || "Unknown"
    : "No default template";

  return (
    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
      <Target className="h-2.5 w-2.5" />
      {templateName}
    </span>
  );
}

function TemplateSummaryCard({
  campaignUrlId,
  allTemplates,
}: {
  campaignUrlId: string;
  allTemplates: { id: string; name: string; template_payload?: Record<string, any> }[];
}) {
  const { data: links = [] } = useCampaignUrlTargetingLinks(campaignUrlId);
  const defaultLink = links.find((l) => l.is_default);

  if (!defaultLink) return null;

  const template = allTemplates.find((t) => t.id === defaultLink.targeting_template_id);
  if (!template) return null;

  const payload = (template as any).template_payload || {};

  return (
    <div className="ml-8 p-2.5 rounded-md bg-muted/40 border border-border/50 space-y-1">
      <div className="flex items-center gap-1.5">
        <Target className="h-3 w-3 text-primary" />
        <span className="text-[11px] font-medium text-foreground">{template.name}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {payload.objective && (
          <Badge variant="secondary" className="text-[10px] h-5">
            {String(payload.objective).replace("OUTCOME_", "")}
          </Badge>
        )}
        {payload.budget_period && payload.budget_value && (
          <Badge variant="outline" className="text-[10px] h-5">
            {payload.budget_period}: ${payload.budget_value}
          </Badge>
        )}
        {payload.bid_strategy && (
          <Badge variant="outline" className="text-[10px] h-5">
            {String(payload.bid_strategy).replace(/_/g, " ")}
          </Badge>
        )}
        {payload.countries && (
          <Badge variant="outline" className="text-[10px] h-5">
            {Array.isArray(payload.countries) ? payload.countries.join(", ") : payload.countries}
          </Badge>
        )}
      </div>
    </div>
  );
}
