import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Settings2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import type { LaunchFull } from "@/hooks/use-launch-data";
import { AdvancedMappingModal, type CustomMapping } from "@/components/creative-library/AdvancedMappingModal";
import type { AdgroupLaunchItem } from "@/hooks/use-adgroup-launch";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  launchData: LaunchFull;
}

export function EditStructureModal({ open, onOpenChange, launchData }: Props) {
  const workspaceId = useWorkspace();
  const qc = useQueryClient();

  const [campaigns, setCampaigns] = useState(launchData.campaigns.length);
  const [adsets, setAdsets] = useState(
    launchData.campaigns.length > 0
      ? Math.round(launchData.adsets.length / launchData.campaigns.length)
      : 1
  );
  const [ads, setAds] = useState(
    launchData.adsets.length > 0
      ? Math.round(launchData.ads.length / launchData.adsets.length)
      : 1
  );
  const [saving, setSaving] = useState(false);
  const [customMapping, setCustomMapping] = useState<CustomMapping | null>(null);
  const [showMapping, setShowMapping] = useState(false);

  // Build items from existing ads for the mapping modal
  const mappingItems: AdgroupLaunchItem[] = launchData.ads.map((ad) => ({
    id: ad.id,
    type: "adgroup" as const,
    primaryText: ad.primary_text || undefined,
    headline: ad.headline || undefined,
    description: ad.description || undefined,
    cta: ad.cta || undefined,
    destinationUrl: ad.destination_url || undefined,
    displayLink: ad.display_link || undefined,
    mediaUrls: ad.media_urls || [],
    mediaType: ad.media_type || undefined,
  }));

  const handleSave = async () => {
    if (!workspaceId) return;
    setSaving(true);
    try {
      const launchId = launchData.id;

      // Preserve existing ad content for redistribution
      const preservedAds = launchData.ads.map((ad) => ({
        primary_text: ad.primary_text,
        headline: ad.headline,
        description: ad.description,
        cta: ad.cta,
        destination_url: ad.destination_url,
        display_link: ad.display_link,
        media_urls: ad.media_urls,
        media_type: ad.media_type,
      }));

      const newTotalAds = campaigns * adsets * ads;
      const droppedCount = preservedAds.length > newTotalAds ? preservedAds.length - newTotalAds : 0;

      // Delete all existing structure
      await (supabase as any).from("launch_ads").delete().eq("launch_id", launchId);
      await (supabase as any).from("launch_adsets").delete().eq("launch_id", launchId);
      await (supabase as any).from("launch_campaigns").delete().eq("launch_id", launchId);

      if (customMapping) {
        // Custom mapping mode
        const { assignments, campaigns: campCount, adsetCounts } = customMapping;
        let globalSort = 0;

        for (let c = 0; c < campCount; c++) {
          const { data: camp } = await (supabase as any)
            .from("launch_campaigns")
            .insert({ launch_id: launchId, workspace_id: workspaceId, name: `Campaign ${c + 1}`, sort_order: c })
            .select().single();

          const adsetCount = adsetCounts[c] || 1;
          for (let s = 0; s < adsetCount; s++) {
            const key = `${c}-${s}`;
            const itemIds = assignments[key] || [];

            const { data: adset } = await (supabase as any)
              .from("launch_adsets")
              .insert({ launch_id: launchId, campaign_id: camp.id, workspace_id: workspaceId, name: `Adset ${s + 1}`, sort_order: s })
              .select().single();

            if (itemIds.length > 0) {
              // Map item IDs to preserved ad content
              const adRows = itemIds.map((itemId) => {
                const preserved = preservedAds.find((_, idx) => launchData.ads[idx]?.id === itemId) || {};
                return {
                  launch_id: launchId,
                  adset_id: adset.id,
                  workspace_id: workspaceId,
                  name: `Ad ${globalSort + 1}`,
                  sort_order: globalSort++,
                  ...preserved,
                };
              });
              await (supabase as any).from("launch_ads").insert(adRows);
            }
          }
        }
      } else {
        // Default mode — each adset gets identical items starting from index 0
        for (let c = 0; c < campaigns; c++) {
          const { data: camp } = await (supabase as any)
            .from("launch_campaigns")
            .insert({ launch_id: launchId, workspace_id: workspaceId, name: `Campaign ${c + 1}`, sort_order: c })
            .select().single();

          for (let s = 0; s < adsets; s++) {
            const { data: adset } = await (supabase as any)
              .from("launch_adsets")
              .insert({ launch_id: launchId, campaign_id: camp.id, workspace_id: workspaceId, name: `Adset ${s + 1}`, sort_order: s })
              .select().single();

            const adRows = Array.from({ length: ads }, (_, slot) => {
              const preserved = preservedAds.length > 0
                ? preservedAds[slot % preservedAds.length]
                : {};
              return {
                launch_id: launchId,
                adset_id: adset.id,
                workspace_id: workspaceId,
                name: `Ad ${slot + 1}`,
                sort_order: slot,
                ...preserved,
              };
            });
            await (supabase as any).from("launch_ads").insert(adRows);
          }
        }
      }

      qc.invalidateQueries({ queryKey: ["launch-full", launchId] });

      if (droppedCount > 0) {
        toast({ title: "Structure updated", description: `${droppedCount} ad(s) content was dropped due to reduced structure.` });
      } else {
        toast({ title: "Structure updated" });
      }
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Failed to update structure", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Campaign Structure</DialogTitle>
        </DialogHeader>

        <div className="flex items-end gap-3 py-4">
          <div className="space-y-1.5 flex-1">
            <Label className="text-xs">Campaigns</Label>
            <Input type="number" min={1} max={20} value={campaigns} onChange={(e) => setCampaigns(Math.max(1, parseInt(e.target.value) || 1))} />
          </div>
          <span className="pb-2.5 text-muted-foreground font-bold">:</span>
          <div className="space-y-1.5 flex-1">
            <Label className="text-xs">Ad sets</Label>
            <Input type="number" min={1} max={20} value={adsets} onChange={(e) => setAdsets(Math.max(1, parseInt(e.target.value) || 1))} />
          </div>
          <span className="pb-2.5 text-muted-foreground font-bold">:</span>
          <div className="space-y-1.5 flex-1">
            <Label className="text-xs">Ads / Adset</Label>
            <Input type="number" min={1} max={20} value={ads} onChange={(e) => setAds(Math.max(1, parseInt(e.target.value) || 1))} />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Total: {campaigns} campaign(s) × {adsets} ad set(s) × {ads} ad(s) = {campaigns * adsets * ads} ads
        </p>

        {/* Advanced Mapping */}
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 text-xs"
          onClick={() => setShowMapping(true)}
        >
          <Settings2 className="h-3.5 w-3.5" />
          {customMapping ? "Edit Custom Mapping" : "Advanced Mapping"}
        </Button>

        {customMapping && (
          <p className="text-xs flex items-center gap-1.5 text-primary">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            Custom mapping applied — {Object.values(customMapping.assignments).flat().length} total ads
          </p>
        )}

        <AdvancedMappingModal
          open={showMapping}
          onOpenChange={setShowMapping}
          items={mappingItems}
          campaigns={campaigns}
          adsetsPerCampaign={adsets}
          adsPerAdset={ads}
          onApply={(mapping) => {
            setCustomMapping(mapping);
            setCampaigns(mapping.campaigns);
            setAdsets(Math.max(...mapping.adsetCounts, 1));
          }}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Apply Structure
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
