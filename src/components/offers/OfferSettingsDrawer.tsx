import { useState, useEffect } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useCreateOffer, useUpdateOffer, useOffer } from "@/hooks/use-offers";
import { useTargetingTemplates, useCreateTargetingTemplate, useUpdateTargetingTemplate } from "@/hooks/use-targeting-templates";
import {
  useCampaignUrlTargetingLinks,
  useAddCampaignUrlTargetingLink,
  useRemoveCampaignUrlTargetingLink,
  useSetDefaultTargetingLink,
} from "@/hooks/use-campaign-url-targeting";
import { useWorkspace } from "@/hooks/use-workspace";
import { useOfferFolders, useCreateAndLinkFolder, useUnlinkFolderFromOffer, useLinkFolderToOffer } from "@/hooks/use-offer-folders";
import { useClFolders } from "@/hooks/use-cl-folders";
import { useOfferReplacementLinks, useAddOfferReplacementLink, useDeleteOfferReplacementLink } from "@/hooks/use-offer-replacement-links";
import { TargetingFormFields } from "@/components/launch/TargetingFormFields";
import { STEP2_DEFAULTS } from "@/lib/step2-defaults";
import type { CampaignFormData, AdsetFormData, AdsFormData } from "@/lib/step2-defaults";
import ManageFolderDrawer from "./ManageFolderDrawer";
import LaunchFromCampaignUrlModal from "./LaunchFromCampaignUrlModal";
import { toast } from "@/hooks/use-toast";
import {
  Loader2, Plus, Trash2, FolderOpen, Image, Video, Info, Link2, X, Rocket, Layers, Circle,
} from "lucide-react";
import { DUMMY_CAMPAIGN_URL_AUTOPILOT_USAGE, DUMMY_STRATEGY_INSIGHTS } from "@/components/autopilot/autopilot-dummy-data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  editOfferId?: string | null;
}

export default function OfferSettingsDrawer({ open, onOpenChange, workspaceId, editOfferId }: Props) {
  const createOffer = useCreateOffer();
  const updateOffer = useUpdateOffer();
  const { data: editData } = useOffer(editOfferId || null);
  const { data: templates } = useTargetingTemplates();

  // Multi-targeting
  const { data: targetingLinks } = useCampaignUrlTargetingLinks(editOfferId || null);
  const addTargetingLink = useAddCampaignUrlTargetingLink();
  const removeTargetingLink = useRemoveCampaignUrlTargetingLink();
  const setDefaultLink = useSetDefaultTargetingLink();
  const createTemplate = useCreateTargetingTemplate();
  const updateTemplate = useUpdateTargetingTemplate();

  const [selectedLinkTemplateId, setSelectedLinkTemplateId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [defaultConfirmLinkId, setDefaultConfirmLinkId] = useState<string | null>(null);

  // Template form state for right panel
  const [tplCampaignData, setTplCampaignData] = useState<CampaignFormData>({ ...STEP2_DEFAULTS.campaign });
  const [tplAdsetData, setTplAdsetData] = useState<AdsetFormData>({ ...STEP2_DEFAULTS.adset });
  const [tplAdsData, setTplAdsData] = useState<AdsFormData>({ ...STEP2_DEFAULTS.ads });

  // ── Pending state for Create mode (local until save) ──
  interface PendingNewTemplate {
    tempId: string;
    name: string;
    payload: { campaign: CampaignFormData; adset: AdsetFormData; ads: AdsFormData };
  }
  const [pendingLinkIds, setPendingLinkIds] = useState<string[]>([]);
  const [pendingNewTemplates, setPendingNewTemplates] = useState<PendingNewTemplate[]>([]);
  const [selectedPendingTempId, setSelectedPendingTempId] = useState<string | null>(null);

  // Folders
  const { data: folders } = useOfferFolders(editOfferId || null);
  const createAndLinkFolder = useCreateAndLinkFolder();
  const linkFolder = useLinkFolderToOffer();
  const unlinkFolder = useUnlinkFolderFromOffer();
  const { data: allClFolders } = useClFolders();
  const [manageFolderId, setManageFolderId] = useState<string | null>(null);
  const [manageFolderName, setManageFolderName] = useState("");
  const [manageFolderDesc, setManageFolderDesc] = useState("");

  // Replacement links
  const { data: replacementLinks } = useOfferReplacementLinks(editOfferId || null);
  const addReplacementLink = useAddOfferReplacementLink();
  const deleteReplacementLink = useDeleteOfferReplacementLink();
  const [newLinkUrl, setNewLinkUrl] = useState("");

  // Create/link folder modal
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [folderMode, setFolderMode] = useState<"link" | "create">("link");
  const [selectedClFolderId, setSelectedClFolderId] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDesc, setNewFolderDesc] = useState("");
  const [folderNameError, setFolderNameError] = useState("");

  // Launch modal
  const [launchModalOpen, setLaunchModalOpen] = useState(false);

  // Basic info
  const [name, setName] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [pixelId, setPixelId] = useState("");
  const [targetingTemplateId, setTargetingTemplateId] = useState<string>("");
  const [nameError, setNameError] = useState("");

  // (campaignData/adsetData/adsData removed – targeting is managed via linked templates)

  const isEditing = !!editOfferId;

  // When a linked template is selected, load its data into the right panel
  useEffect(() => {
    if (selectedLinkTemplateId && templates) {
      const tmpl = templates.find((t) => t.id === selectedLinkTemplateId);
      if (tmpl?.template_payload) {
        const payload = tmpl.template_payload as any;
        setTplCampaignData({ ...STEP2_DEFAULTS.campaign, ...(payload.campaign || {}) });
        setTplAdsetData({ ...STEP2_DEFAULTS.adset, ...(payload.adset || {}) });
        setTplAdsData({ ...STEP2_DEFAULTS.ads, ...(payload.ads || {}) });
      }
    }
  }, [selectedLinkTemplateId, templates]);

  // Auto-select first linked template
  useEffect(() => {
    if (targetingLinks?.length && !selectedLinkTemplateId && !isCreatingNew) {
      const defaultLink = targetingLinks.find((l) => l.is_default);
      setSelectedLinkTemplateId(defaultLink?.targeting_template_id || targetingLinks[0].targeting_template_id);
    }
  }, [targetingLinks]);

  // handleTemplateSelect removed – targeting managed via linked templates

  useEffect(() => {
    if (editData && isEditing) {
      setName(editData.name || "");
      setTrackingUrl(editData.tracking_url || "");
      setPixelId(editData.pixel_id || "");
      setTargetingTemplateId(editData.targeting_template_id || "");
    } else if (!isEditing && open) {
      resetForm();
    }
  }, [editData, isEditing, open]);

  const resetForm = () => {
    setName(""); setTrackingUrl(""); setPixelId(""); setTargetingTemplateId(""); setNameError("");
    setSelectedLinkTemplateId(null);
    setIsCreatingNew(false);
    setPendingLinkIds([]);
    setPendingNewTemplates([]);
    setSelectedPendingTempId(null);
  };

  const handleAddFolder = async () => {
    if (!editOfferId) return;

    if (folderMode === "link") {
      if (!selectedClFolderId) return;
      try {
        await linkFolder.mutateAsync({
          workspace_id: workspaceId,
          campaign_url_id: editOfferId,
          cl_folder_id: selectedClFolderId,
        });
        setCreateFolderOpen(false);
        setSelectedClFolderId("");
        toast({ title: "Folder linked" });
      } catch (err: any) {
        toast({ title: "Failed to link folder", description: err.message, variant: "destructive" });
      }
    } else {
      const trimmed = newFolderName.trim();
      if (!trimmed) { setFolderNameError("Name is required"); return; }
      setFolderNameError("");
      try {
        const folder = await createAndLinkFolder.mutateAsync({
          workspace_id: workspaceId,
          campaign_url_id: editOfferId,
          name: trimmed,
          description: newFolderDesc.trim() || undefined,
        });
        setCreateFolderOpen(false);
        setNewFolderName("");
        setNewFolderDesc("");
        toast({ title: "Folder created & linked" });
        setManageFolderId(folder.id);
        setManageFolderName(folder.name);
        setManageFolderDesc(folder.description || "");
      } catch (err: any) {
        toast({ title: "Failed to create folder", description: err.message, variant: "destructive" });
      }
    }
  };

  const handleUnlinkFolder = async (linkId: string) => {
    if (!editOfferId) return;
    try {
      await unlinkFolder.mutateAsync({ link_id: linkId, campaign_url_id: editOfferId });
      toast({ title: "Folder unlinked" });
    } catch (err: any) {
      toast({ title: "Failed to unlink folder", description: err.message, variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { setNameError("Name is required"); return; }
    setNameError("");

    const payload = {
      workspace_id: workspaceId,
      name: name.trim(),
      tracking_url: trackingUrl || null,
      pixel_id: pixelId || null,
      targeting_template_id: targetingTemplateId || null,
    };

    try {
      if (isEditing) {
        await updateOffer.mutateAsync({ ...payload, id: editOfferId! });
        toast({ title: "Campaign URL updated" });
      } else {
        const created = await createOffer.mutateAsync(payload);
        const newId = (created as any)?.id;

        // Persist pending templates for Create mode
        if (newId) {
          let firstLinkId: string | null = null;

          // Link existing templates
          for (const tplId of pendingLinkIds) {
            const link = await addTargetingLink.mutateAsync({
              campaign_url_id: newId,
              targeting_template_id: tplId,
              workspace_id: workspaceId,
            });
            if (!firstLinkId) firstLinkId = link.id;
          }

          // Create and link new templates
          for (const pending of pendingNewTemplates) {
            const createdTpl = await createTemplate.mutateAsync({
              name: pending.name,
              payload: {
                campaign: pending.payload.campaign,
                adset: pending.payload.adset,
                ads: pending.payload.ads,
              },
            });
            const link = await addTargetingLink.mutateAsync({
              campaign_url_id: newId,
              targeting_template_id: createdTpl.id,
              workspace_id: workspaceId,
            });
            if (!firstLinkId) firstLinkId = link.id;
          }

          // Set first as default
          if (firstLinkId) {
            await setDefaultLink.mutateAsync({ campaign_url_id: newId, link_id: firstLinkId });
          }
        }

        toast({ title: "Campaign URL created" });
      }
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    }
  };

  // ── Multi-targeting handlers ──

  const linkedTemplateIds = new Set([
    ...(targetingLinks || []).map((l) => l.targeting_template_id),
    ...pendingLinkIds,
  ]);
  const unlinkableTemplates = (templates || []).filter((t) => !linkedTemplateIds.has(t.id));
  const [linkDropdownValue, setLinkDropdownValue] = useState("");

  const handleLinkTemplate = async () => {
    if (!linkDropdownValue) return;

    // Create mode: store locally
    if (!isEditing) {
      setPendingLinkIds((prev) => [...prev, linkDropdownValue]);
      setSelectedLinkTemplateId(linkDropdownValue);
      setIsCreatingNew(false);
      setSelectedPendingTempId(null);
      setLinkDropdownValue("");
      toast({ title: "Template linked (pending save)" });
      return;
    }

    if (!editOfferId) return;
    try {
      const newLink = await addTargetingLink.mutateAsync({
        campaign_url_id: editOfferId,
        targeting_template_id: linkDropdownValue,
        workspace_id: workspaceId,
      });
      // Auto-set as default if it's the first template
      if (!(targetingLinks || []).length) {
        await setDefaultLink.mutateAsync({ campaign_url_id: editOfferId, link_id: newLink.id });
      }
      setSelectedLinkTemplateId(linkDropdownValue);
      setLinkDropdownValue("");
      toast({ title: "Template linked" });
    } catch (err: any) {
      toast({ title: "Failed to link template", description: err.message, variant: "destructive" });
    }
  };

  const handleUnlinkTemplate = async (linkId: string, templateId: string) => {
    // Create mode: remove from pending
    if (!isEditing) {
      setPendingLinkIds((prev) => prev.filter((id) => id !== templateId));
      if (selectedLinkTemplateId === templateId) setSelectedLinkTemplateId(null);
      toast({ title: "Template removed" });
      return;
    }
    if (!editOfferId) return;
    try {
      await removeTargetingLink.mutateAsync({ id: linkId, campaign_url_id: editOfferId });
      if (selectedLinkTemplateId === templateId) setSelectedLinkTemplateId(null);
      toast({ title: "Template unlinked" });
    } catch (err: any) {
      toast({ title: "Failed to unlink", description: err.message, variant: "destructive" });
    }
  };

  const handleUnlinkPendingNew = (tempId: string) => {
    setPendingNewTemplates((prev) => prev.filter((t) => t.tempId !== tempId));
    if (selectedPendingTempId === tempId) {
      setSelectedPendingTempId(null);
      setIsCreatingNew(false);
    }
    toast({ title: "Template removed" });
  };

  const handleSetDefault = async (linkId: string) => {
    if (!editOfferId) return;
    try {
      await setDefaultLink.mutateAsync({ campaign_url_id: editOfferId, link_id: linkId });
    } catch (err: any) {
      toast({ title: "Failed to set default", description: err.message, variant: "destructive" });
    }
  };

  const handleCreateNewTemplate = () => {
    if (!isEditing) {
      // In Create mode, prompt for name immediately then store locally
      setIsCreatingNew(true);
      setSelectedLinkTemplateId(null);
      setSelectedPendingTempId(null);
      setTplCampaignData({ ...STEP2_DEFAULTS.campaign });
      setTplAdsetData({ ...STEP2_DEFAULTS.adset });
      setTplAdsData({ ...STEP2_DEFAULTS.ads });
      setNewTemplateName("");
      setShowNamePrompt(true);
      return;
    }
    setIsCreatingNew(true);
    setSelectedLinkTemplateId(null);
    setSelectedPendingTempId(null);
    setTplCampaignData({ ...STEP2_DEFAULTS.campaign });
    setTplAdsetData({ ...STEP2_DEFAULTS.adset });
    setTplAdsData({ ...STEP2_DEFAULTS.ads });
    setNewTemplateName("");
  };

  const handleSaveTemplate = async () => {
    // Save a pending new template locally (Create mode)
    if (!isEditing && selectedPendingTempId) {
      setPendingNewTemplates((prev) =>
        prev.map((t) =>
          t.tempId === selectedPendingTempId
            ? { ...t, payload: { campaign: tplCampaignData, adset: tplAdsetData, ads: tplAdsData } }
            : t
        )
      );
      toast({ title: "Template updated (pending save)" });
      return;
    }

    if (isCreatingNew) {
      setShowNamePrompt(true);
      return;
    }
    if (!selectedLinkTemplateId) return;
    try {
      const tmpl = (templates || []).find((t) => t.id === selectedLinkTemplateId);
      await updateTemplate.mutateAsync({
        id: selectedLinkTemplateId,
        name: tmpl?.name || "Untitled",
        payload: {
          campaign: tplCampaignData,
          adset: tplAdsetData,
          ads: tplAdsData,
        },
      });
      toast({ title: "Template saved" });
    } catch (err: any) {
      toast({ title: "Failed to save template", description: err.message, variant: "destructive" });
    }
  };

  const handleConfirmCreateTemplate = async () => {
    if (!newTemplateName.trim()) return;

    // Create mode: store locally
    if (!isEditing) {
      const tempId = crypto.randomUUID();
      setPendingNewTemplates((prev) => [
        ...prev,
        {
          tempId,
          name: newTemplateName.trim(),
          payload: { campaign: { ...STEP2_DEFAULTS.campaign }, adset: { ...STEP2_DEFAULTS.adset }, ads: { ...STEP2_DEFAULTS.ads } },
        },
      ]);
      setIsCreatingNew(false);
      setSelectedPendingTempId(tempId);
      setSelectedLinkTemplateId(null);
      setShowNamePrompt(false);
      setNewTemplateName("");
      // Load defaults into right panel
      setTplCampaignData({ ...STEP2_DEFAULTS.campaign });
      setTplAdsetData({ ...STEP2_DEFAULTS.adset });
      setTplAdsData({ ...STEP2_DEFAULTS.ads });
      toast({ title: "Template added (pending save)" });
      return;
    }

    if (!editOfferId) return;
    try {
      const created = await createTemplate.mutateAsync({
        name: newTemplateName.trim(),
        payload: {
          campaign: tplCampaignData,
          adset: tplAdsetData,
          ads: tplAdsData,
        },
      });
      const newLink = await addTargetingLink.mutateAsync({
        campaign_url_id: editOfferId,
        targeting_template_id: created.id,
        workspace_id: workspaceId,
      });
      if (!(targetingLinks || []).length) {
        await setDefaultLink.mutateAsync({ campaign_url_id: editOfferId, link_id: newLink.id });
      }
      setIsCreatingNew(false);
      setSelectedLinkTemplateId(created.id);
      setShowNamePrompt(false);
      setNewTemplateName("");
      toast({ title: "Template created and linked" });
    } catch (err: any) {
      toast({ title: "Failed to create template", description: err.message, variant: "destructive" });
    }
  };

  const isSaving = createOffer.isPending || updateOffer.isPending;
  const folderCount = folders?.length || 0;
  const totalAssets = (folders || []).reduce((sum, f) => sum + (f.total_items || 0), 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col overflow-hidden">
        <SheetHeader className="space-y-0 pr-10">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold truncate">
              {isEditing ? `Edit Campaign URL - ${name || "Untitled"}` : "New Campaign URL"}
            </SheetTitle>
            {isEditing && (
              <Button size="sm" className="shrink-0 mr-4" onClick={() => setLaunchModalOpen(true)}>
                <Rocket className="h-4 w-4" />
                Launch
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto mt-4 -mx-6 px-6 flex flex-col">
        <Tabs defaultValue="basic" className="flex flex-col flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="targeting">Targeting</TabsTrigger>
            <TabsTrigger value="folders">Folders ({folderCount})</TabsTrigger>
            <TabsTrigger value="replacement">Replacement</TabsTrigger>
          </TabsList>

          {/* ─── Tab 1: Basic ─── */}
          <TabsContent value="basic" className="space-y-4 pt-4">
            <div className="space-y-1">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className={nameError ? "border-destructive" : ""} placeholder="e.g. Summer Scale Campaign" />
              {nameError && <p className="text-sm text-destructive">{nameError}</p>}
            </div>
            <div className="space-y-1">
              <Label>Tracking URL</Label>
              <Input value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} placeholder="https://track.example.com?click_id={{click_id}}" />
              <p className="text-xs text-muted-foreground">Supports macro placeholders like {"{{click_id}}"}</p>
            </div>
            <div className="space-y-1">
              <Label>Pixel ID</Label>
              <Input value={pixelId} onChange={(e) => setPixelId(e.target.value)} placeholder="e.g. 123456789" />
            </div>

            {/* AutoPilot Launch Strategies usage */}
            {isEditing && (() => {
              const usage = DUMMY_CAMPAIGN_URL_AUTOPILOT_USAGE[editOfferId!] || [];
              if (usage.length === 0) return null;

              // Pull insights per strategy
              const insightsData = DUMMY_STRATEGY_INSIGHTS;

              return (
                <div className="rounded-lg border border-border p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Rocket className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">Used in Launch Strategies</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{usage.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {usage.map((u, i) => {
                      const metrics = insightsData[u.strategyAlias];
                      return (
                        <div key={i} className="rounded-md border border-border bg-muted/30 p-2.5 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-foreground truncate flex-1">{u.strategyName}</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{u.strategyAlias}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 text-[10px] px-1.5 shrink-0"
                              onClick={() => window.open("/launch/autopilot", "_blank")}
                            >
                              Open
                            </Button>
                          </div>
                          {metrics && (
                            <div className="grid grid-cols-4 gap-2">
                              <div className="text-center">
                                <p className="text-[10px] text-muted-foreground">Ads Launched</p>
                                <p className="text-xs font-semibold text-foreground">{metrics.totalAdsLaunched}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] text-muted-foreground">Spend</p>
                                <p className="text-xs font-semibold text-foreground">${metrics.totalSpend.toLocaleString()}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] text-muted-foreground">ROAS</p>
                                <p className="text-xs font-semibold text-foreground">{metrics.roas}x</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] text-muted-foreground">Accounts</p>
                                <p className="text-xs font-semibold text-foreground">{u.accountCount}</p>
                              </div>
                            </div>
                          )}
                          {metrics && (
                            <div className="flex items-center gap-3 text-[10px]">
                              <span className="text-primary inline-flex items-center gap-1"><Circle className="h-1.5 w-1.5 fill-current" strokeWidth={0} /> {metrics.activeAds} active</span>
                              <span className="text-destructive inline-flex items-center gap-1"><Circle className="h-1.5 w-1.5 fill-current" strokeWidth={0} /> {metrics.rejectedAds} rejected</span>
                              <span className="text-muted-foreground inline-flex items-center gap-1"><Circle className="h-1.5 w-1.5 fill-current" strokeWidth={0} /> {metrics.inReviewAds} in review</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </TabsContent>

          {/* ─── Tab 2: Targeting (Split Panel) ─── */}
          <TabsContent value="targeting" className="pt-4 data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col">
            {/* Split-view for both Create and Edit */}
            {(
              <div className="flex gap-4 flex-1">
                {/* Left Panel */}
                <div className="w-[40%] flex flex-col gap-3 border-r border-border pr-4 overflow-hidden">
                  <>
                    <div className="shrink-0 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          Linked Templates ({isEditing ? (targetingLinks || []).length : pendingLinkIds.length + pendingNewTemplates.length})
                        </Label>
                        <Button size="sm" variant="outline" onClick={handleCreateNewTemplate}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Create New
                        </Button>
                      </div>

                      {/* Link existing */}
                      <div className="flex items-center gap-1.5">
                        <Select value={linkDropdownValue} onValueChange={setLinkDropdownValue}>
                          <SelectTrigger className="text-xs h-8">
                            <SelectValue placeholder={unlinkableTemplates.length > 0 ? "Link existing..." : "All templates added"} />
                          </SelectTrigger>
                          <SelectContent>
                            {unlinkableTemplates.length > 0 ? (
                              unlinkableTemplates.map((t) => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                              ))
                            ) : (
                              <SelectItem value="__none__" disabled>
                                All templates are added. Create a new template to add more.
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <Button size="sm" className="h-8 text-xs" disabled={!linkDropdownValue || (isEditing && addTargetingLink.isPending) || unlinkableTemplates.length === 0} onClick={handleLinkTemplate}>
                          Add
                        </Button>
                      </div>

                      <Separator />
                    </div>

                    {/* Template list */}
                    <ScrollArea className="flex-1 overflow-hidden">
                      <div className="space-y-1.5 pr-2">
                        {/* Edit mode: DB-linked templates */}
                        {isEditing && (
                          <>
                            {!(targetingLinks || []).length && !isCreatingNew && (
                              <p className="text-xs text-muted-foreground text-center py-4">No templates linked yet.</p>
                            )}
                            {(targetingLinks || []).map((link) => {
                              const tmpl = (templates || []).find((t) => t.id === link.targeting_template_id);
                              if (!tmpl) return null;
                              const isSelected = selectedLinkTemplateId === link.targeting_template_id && !isCreatingNew && !selectedPendingTempId;
                              return (
                                <div
                                  key={link.id}
                                  className={`flex items-center gap-2 rounded-md border p-2 cursor-pointer transition-colors ${
                                    isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                                  }`}
                                  onClick={() => { setSelectedLinkTemplateId(link.targeting_template_id); setIsCreatingNew(false); setSelectedPendingTempId(null); }}
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{tmpl.name}</p>
                                    {link.is_default && (
                                      <Badge variant="secondary" className="text-[10px] mt-0.5">Default</Badge>
                                    )}
                                  </div>
                                  {!link.is_default && (
                                    <Button
                                      variant="outline" size="sm" className="h-6 text-[10px] px-2 shrink-0"
                                      onClick={(e) => { e.stopPropagation(); setDefaultConfirmLinkId(link.id); }}
                                    >
                                      Set as default
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive"
                                    onClick={(e) => { e.stopPropagation(); handleUnlinkTemplate(link.id, link.targeting_template_id); }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              );
                            })}
                          </>
                        )}

                        {/* Create mode: pending linked existing templates */}
                        {!isEditing && pendingLinkIds.map((tplId) => {
                          const tmpl = (templates || []).find((t) => t.id === tplId);
                          if (!tmpl) return null;
                          const isSelected = selectedLinkTemplateId === tplId && !isCreatingNew && !selectedPendingTempId;
                          return (
                            <div
                              key={tplId}
                              className={`flex items-center gap-2 rounded-md border p-2 cursor-pointer transition-colors ${
                                isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                              }`}
                              onClick={() => { setSelectedLinkTemplateId(tplId); setIsCreatingNew(false); setSelectedPendingTempId(null); }}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{tmpl.name}</p>
                              </div>
                              <Button
                                variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={(e) => { e.stopPropagation(); handleUnlinkTemplate("", tplId); }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          );
                        })}

                        {/* Create mode: pending new templates */}
                        {!isEditing && pendingNewTemplates.map((pending) => {
                          const isSelected = selectedPendingTempId === pending.tempId && !isCreatingNew;
                          return (
                            <div
                              key={pending.tempId}
                              className={`flex items-center gap-2 rounded-md border p-2 cursor-pointer transition-colors ${
                                isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                              }`}
                              onClick={() => {
                                setSelectedPendingTempId(pending.tempId);
                                setSelectedLinkTemplateId(null);
                                setIsCreatingNew(false);
                                setTplCampaignData({ ...STEP2_DEFAULTS.campaign, ...pending.payload.campaign });
                                setTplAdsetData({ ...STEP2_DEFAULTS.adset, ...pending.payload.adset });
                                setTplAdsData({ ...STEP2_DEFAULTS.ads, ...pending.payload.ads });
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{pending.name}</p>
                                <p className="text-[10px] text-muted-foreground">New · Unsaved</p>
                              </div>
                              <Button
                                variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={(e) => { e.stopPropagation(); handleUnlinkPendingNew(pending.tempId); }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          );
                        })}

                        {/* Create mode: empty state */}
                        {!isEditing && !pendingLinkIds.length && !pendingNewTemplates.length && !isCreatingNew && (
                          <p className="text-xs text-muted-foreground text-center py-4">No templates linked yet.</p>
                        )}

                        {isCreatingNew && (
                          <div className="flex items-center gap-2 rounded-md border border-primary bg-primary/5 p-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-primary">New Template</p>
                              <p className="text-[10px] text-muted-foreground">Unsaved</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </>
                </div>

                {/* Right Panel */}
                <div className="w-[60%] flex flex-col gap-4">
                  {(!selectedLinkTemplateId && !isCreatingNew && !selectedPendingTempId) ? (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                      Select a template from the left panel to edit.
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          {isCreatingNew
                            ? "New Template"
                            : selectedPendingTempId
                              ? pendingNewTemplates.find((t) => t.tempId === selectedPendingTempId)?.name || "Template"
                              : (templates || []).find((t) => t.id === selectedLinkTemplateId)?.name || "Template"}
                        </Label>
                        <Button size="sm" onClick={handleSaveTemplate} disabled={updateTemplate.isPending || createTemplate.isPending}>
                          {(updateTemplate.isPending || createTemplate.isPending) && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                          Save Template
                        </Button>
                      </div>
                      <ScrollArea className="flex-1">
                        <TargetingFormFields
                          campaignData={tplCampaignData}
                          adsetData={tplAdsetData}
                          adsData={tplAdsData}
                          onCampaignChange={(f) => setTplCampaignData((p) => ({ ...p, ...f }))}
                          onAdsetChange={(f) => setTplAdsetData((p) => ({ ...p, ...f }))}
                          onAdsChange={(f) => setTplAdsData((p) => ({ ...p, ...f }))}
                          fieldErrors={{}}
                          fieldKeyPrefix="tpl-"
                          hideAdsSection
                          hideFlexibleCreative
                          hideAdvantagePlus
                        />
                      </ScrollArea>
                    </>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ─── Tab 3: Folders ─── */}
          <TabsContent value="folders" className="pt-4 space-y-4 data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col">
            {!isEditing ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <FolderOpen className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Save the campaign URL first to start adding folders.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Asset Folders</Label>
                    <p className="text-xs text-muted-foreground">
                      {folderCount} folder{folderCount !== 1 ? "s" : ""} · {totalAssets} total assets
                    </p>
                  </div>
                  <Button size="sm" onClick={() => { setFolderMode("link"); setCreateFolderOpen(true); }}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Folder
                  </Button>
                </div>

                {!folders?.length ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <FolderOpen className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No folders yet.</p>
                    <p className="text-xs text-muted-foreground">Add a folder to start organizing assets for automation.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {folders.map((folder) => (
                      <div key={folder.id} className="flex items-center gap-3 rounded-md border border-border p-3 hover:bg-muted/30 transition-colors">
                        <FolderOpen className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{folder.name}</p>
                          {folder.description && (
                            <p className="text-xs text-muted-foreground truncate">{folder.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            {(folder.total_items || 0) === 0 ? (
                              <span className="text-muted-foreground/60 italic">Empty folder</span>
                            ) : (
                              <>
                                <span className="flex items-center gap-0.5"><Image className="h-3 w-3" /> {folder.image_count || 0}</span>
                                <span className="flex items-center gap-0.5"><Video className="h-3 w-3" /> {folder.video_count || 0}</span>
                                <span className="flex items-center gap-0.5"><Layers className="h-3 w-3" /> {folder.adgroup_count || 0}</span>
                              </>
                            )}
                            <span>·</span>
                            <span>Updated {new Date(folder.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => {
                            setManageFolderId(folder.id);
                            setManageFolderName(folder.name);
                            setManageFolderDesc(folder.description || "");
                          }}
                        >
                          Manage
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleUnlinkFolder(folder.link_id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Separator />
                <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Auto-launched ads will be tagged: <span className="font-medium text-foreground">Auto: Dilution</span> + <span className="font-medium text-foreground">Campaign URL: {name || "—"}</span> + <span className="font-medium text-foreground">Folder: {"<name>"}</span></p>
                      <p>Automation pulls latest assets from linked folders, avoiding recently used assets (7-day exclusion window).</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* ─── Tab 4: Replacement ─── */}
          <TabsContent value="replacement" className="pt-4 space-y-4 data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col">
            {!isEditing ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Link2 className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Save the campaign URL first to add replacement links.</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      These links will be used as replacement URLs in the <span className="font-medium text-foreground">RRM section</span> when this campaign URL is selected for an ad account. Ads generated will use the <span className="font-medium text-foreground">OG image</span> from these URLs. Ad copies will be <span className="font-medium text-foreground">AI-generated</span>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    placeholder="https://example.com/landing-page"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newLinkUrl.trim()) {
                        addReplacementLink.mutate(
                          { offer_id: editOfferId!, workspace_id: workspaceId, url: newLinkUrl.trim() },
                          { onSuccess: () => setNewLinkUrl("") }
                        );
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    disabled={!newLinkUrl.trim() || addReplacementLink.isPending}
                    onClick={() => {
                      addReplacementLink.mutate(
                        { offer_id: editOfferId!, workspace_id: workspaceId, url: newLinkUrl.trim() },
                        { onSuccess: () => setNewLinkUrl("") }
                      );
                    }}
                  >
                    {addReplacementLink.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                    Add
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  {(replacementLinks || []).length} link{(replacementLinks || []).length !== 1 ? "s" : ""}
                </p>

                {!(replacementLinks || []).length ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Link2 className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No replacement links yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(replacementLinks || []).map((link) => (
                      <div key={link.id} className="flex items-center gap-2 rounded-md border border-border p-2.5">
                        <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate flex-1">{link.url}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteReplacementLink.mutate({ id: link.id, offer_id: editOfferId! })}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
        </div>

        <SheetFooter className="border-t border-border pt-4 -mx-6 px-6 pb-2 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {isEditing ? "Update" : "Create"}
          </Button>
        </SheetFooter>
      </SheetContent>

      {/* ─── Create Folder Modal ─── */}
      <Dialog open={createFolderOpen} onOpenChange={(o) => { if (!o) { setCreateFolderOpen(false); setNewFolderName(""); setNewFolderDesc(""); setFolderNameError(""); setSelectedClFolderId(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Tabs value={folderMode} onValueChange={(v) => setFolderMode(v as "link" | "create")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="link">Link Existing</TabsTrigger>
                <TabsTrigger value="create">Create New</TabsTrigger>
              </TabsList>

              <TabsContent value="link" className="pt-3 space-y-2">
                <Label>Select a Creative Library Folder</Label>
                <Select value={selectedClFolderId} onValueChange={setSelectedClFolderId}>
                  <SelectTrigger><SelectValue placeholder="Choose a folder..." /></SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const linkedIds = new Set((folders || []).map((f) => f.id));
                      const available = (allClFolders || []).filter((f) => !linkedIds.has(f.id));
                      return available.length > 0 ? available.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      )) : (
                        <SelectItem value="__none__" disabled>All folders already linked</SelectItem>
                      );
                    })()}
                  </SelectContent>
                </Select>
              </TabsContent>

              <TabsContent value="create" className="pt-3 space-y-3">
                <div className="space-y-1">
                  <Label>Folder Name <span className="text-destructive">*</span></Label>
                  <Input
                    value={newFolderName}
                    onChange={(e) => { setNewFolderName(e.target.value); setFolderNameError(""); }}
                    placeholder="e.g. Dilution Creatives"
                    className={folderNameError ? "border-destructive" : ""}
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleAddFolder()}
                  />
                  {folderNameError && <p className="text-sm text-destructive">{folderNameError}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea
                    value={newFolderDesc}
                    onChange={(e) => setNewFolderDesc(e.target.value)}
                    placeholder="Optional — describe the purpose of this folder"
                    className="min-h-[60px]"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateFolderOpen(false); setNewFolderName(""); setNewFolderDesc(""); setFolderNameError(""); setSelectedClFolderId(""); }}>
              Cancel
            </Button>
            <Button
              onClick={handleAddFolder}
              disabled={folderMode === "link" ? !selectedClFolderId || linkFolder.isPending : !newFolderName.trim() || createAndLinkFolder.isPending}
            >
              {(linkFolder.isPending || createAndLinkFolder.isPending) && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {folderMode === "link" ? "Link Folder" : "Create & Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Template Name Prompt ─── */}
      <Dialog open={showNamePrompt} onOpenChange={setShowNamePrompt}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Name your template</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Template Name <span className="text-destructive">*</span></Label>
            <Input
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="e.g. US Broad Targeting"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleConfirmCreateTemplate()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNamePrompt(false)}>Cancel</Button>
            <Button onClick={handleConfirmCreateTemplate} disabled={!newTemplateName.trim() || createTemplate.isPending}>
              {createTemplate.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Create & Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Manage Folder Drawer ─── */}
      <ManageFolderDrawer
        open={!!manageFolderId}
        onOpenChange={(o) => { if (!o) setManageFolderId(null); }}
        folderId={manageFolderId}
        folderName={manageFolderName}
        folderDescription={manageFolderDesc}
        offerId={editOfferId || ""}
        offerName={name}
        workspaceId={workspaceId}
      />

      {/* ─── Set Default Confirmation ─── */}
      <AlertDialog open={!!defaultConfirmLinkId} onOpenChange={(o) => { if (!o) setDefaultConfirmLinkId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set as default template?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to set this as the default targeting template for {name || "this Campaign URL"}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (defaultConfirmLinkId) { handleSetDefault(defaultConfirmLinkId); setDefaultConfirmLinkId(null); } }}>
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Launch Modal ─── */}
      {editOfferId && (
        <LaunchFromCampaignUrlModal
          open={launchModalOpen}
          onOpenChange={setLaunchModalOpen}
          campaignUrlId={editOfferId}
          campaignUrlName={name}
        />
      )}
    </Sheet>
  );
}
