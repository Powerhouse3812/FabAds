import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AdAccountMultiSelect } from "@/components/launch/AdAccountMultiSelect";
import { useFolderLinkedCampaignUrls, useClFolderItems } from "@/hooks/use-cl-folders";
import { useFbConnection } from "@/hooks/use-fb-connection";
import { useTargetingTemplates } from "@/hooks/use-targeting-templates";
import { useCampaignUrlTargetingLinks } from "@/hooks/use-campaign-url-targeting";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Rocket, Package, Target, Image, Layers, AlertCircle, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface FastLaunchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  folderName: string;
}

export function FastLaunchModal({ open, onOpenChange, folderId, folderName }: FastLaunchModalProps) {
  const navigate = useNavigate();
  const workspaceId = useWorkspace();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [selectedCuIds, setSelectedCuIds] = useState<string[]>([]);
  const [selectedAdAccountIds, setSelectedAdAccountIds] = useState<string[]>([]);
  const [launching, setLaunching] = useState(false);

  const { data: linkedCUs = [], isLoading: cusLoading } = useFolderLinkedCampaignUrls(folderId);
  const { data: folderItems = [] } = useClFolderItems(folderId);
  const { adAccounts, businessManagers } = useFbConnection();
  const { data: allTemplates = [] } = useTargetingTemplates();

  const mediaCount = useMemo(() => folderItems.filter((fi) => fi.item_type === "media").length, [folderItems]);
  const adgroupCount = useMemo(() => folderItems.filter((fi) => fi.item_type === "adgroup").length, [folderItems]);

  const toggleCu = (cuId: string) => {
    setSelectedCuIds((prev) =>
      prev.includes(cuId) ? prev.filter((id) => id !== cuId) : [...prev, cuId]
    );
  };

  const canLaunch = selectedCuIds.length > 0 && selectedAdAccountIds.length > 0;

  const handleLaunch = async () => {
    if (!workspaceId || !user || !canLaunch) return;
    setLaunching(true);

    try {
      // For each selected Campaign URL, fetch default targeting template and create a launch
      for (const cuId of selectedCuIds) {
        const cu = linkedCUs.find((l) => l.campaign_url_id === cuId);
        if (!cu) continue;

        // Get default targeting link for this CU
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

        // 1. Create launch
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

        // 2. Create launch_ad_accounts
        const accRows = selectedAdAccountIds.map((accId) => ({
          launch_id: launch.id,
          fb_ad_account_id: accId,
          workspace_id: workspaceId,
          setup_config: {},
        }));
        await (supabase as any).from("launch_ad_accounts").insert(accRows);

        // 3. Create campaign
        const { data: camp } = await (supabase as any)
          .from("launch_campaigns")
          .insert({
            launch_id: launch.id,
            workspace_id: workspaceId,
            name: cu.campaign_url.name,
            sort_order: 0,
            objective: templatePayload.objective || "OUTCOME_SALES",
            budget_type: templatePayload.budget_type || "adset_budget",
          })
          .select()
          .single();

        // 4. Create adset with targeting
        const { data: adset } = await (supabase as any)
          .from("launch_adsets")
          .insert({
            launch_id: launch.id,
            campaign_id: camp.id,
            workspace_id: workspaceId,
            name: "Adset 1",
            sort_order: 0,
            targeting: templatePayload,
            budget_period: templatePayload.budget_period || "daily",
            budget_value: templatePayload.budget_value || null,
            bid_strategy: templatePayload.bid_strategy || null,
          })
          .select()
          .single();

        // 5. Create ads from folder items (1:1 mapping)
        const adRows = folderItems.map((fi, i) => ({
          launch_id: launch.id,
          adset_id: adset.id,
          workspace_id: workspaceId,
          name: `Ad ${i + 1}`,
          sort_order: i,
          status: "active",
        }));
        if (adRows.length > 0) {
          await (supabase as any).from("launch_ads").insert(adRows);
        } else {
          // At least one ad
          await (supabase as any).from("launch_ads").insert({
            launch_id: launch.id,
            adset_id: adset.id,
            workspace_id: workspaceId,
            name: "Ad 1",
            sort_order: 0,
          });
        }

        // 6. Activity log
        await (supabase as any).from("activity_logs").insert({
          workspace_id: workspaceId,
          user_id: user.id,
          action: "fast_launch_created",
          target_email: user.email || "",
          metadata: { launch_id: launch.id, folder_id: folderId, campaign_url_id: cuId },
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            Fast Launch — {folderName}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Select Campaign URLs and Ad Accounts to launch instantly with default targeting.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 pb-2">
            {/* Section 1: Campaign URLs */}
            <div>
              <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                Campaign URLs
              </h3>
              {cusLoading ? (
                <p className="text-xs text-muted-foreground">Loading…</p>
              ) : linkedCUs.length === 0 ? (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30">
                  <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    No Campaign URLs linked to this folder. Link one from the folder settings first.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {linkedCUs.map((link) => {
                    const isSelected = selectedCuIds.includes(link.campaign_url_id);
                    return (
                      <label
                        key={link.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleCu(link.campaign_url_id)}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-foreground">{link.campaign_url.name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <CuDefaultTemplate
                              campaignUrlId={link.campaign_url_id}
                              allTemplates={allTemplates}
                            />
                            {link.ad_accounts.length > 0 && (
                              <span className="text-[10px] text-muted-foreground">
                                {link.ad_accounts.length} ad account{link.ad_accounts.length > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* Section 2: Ad Accounts */}
            <div>
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
            </div>

            <Separator />

            {/* Section 3: Summary */}
            <div>
              <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Image className="h-3.5 w-3.5 text-muted-foreground" />
                Folder Contents
              </h3>
              <div className="flex gap-3">
                <Badge variant="secondary" className="text-xs">
                  {mediaCount} Media
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {adgroupCount} Adgroups
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {folderItems.length} Total Items → {folderItems.length || 1} Ads
                </Badge>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" disabled={!canLaunch || launching} onClick={handleLaunch}>
            {launching ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Launching…
              </>
            ) : (
              <>
                <Rocket className="h-3.5 w-3.5 mr-1.5" />
                Launch ({selectedCuIds.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Small sub-component to display the default template name for a Campaign URL
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
