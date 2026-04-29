import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { RRMAdForm, emptyAd, type RRMAdData } from "./RRMAdForm";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  onCreated?: (offerId: string) => void;
}

export function RRMCreateOfferModal({ open, onOpenChange, workspaceId, onCreated }: Props) {
  const [name, setName] = useState("");
  const [offerType, setOfferType] = useState<"rrm_dilution" | "rrm_replacement">("rrm_dilution");
  const [folderName, setFolderName] = useState("Default");
  const [ads, setAds] = useState<RRMAdData[]>([emptyAd()]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const label = offerType === "rrm_dilution" ? "Dilution" : "Replacement";

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    const validAds = ads.filter((a) => a.destination_url.trim());
    if (validAds.length === 0) {
      toast({ title: "At least one ad with a destination URL is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: offer, error: offerErr } = await (supabase as any)
        .from("campaign_urls")
        .insert({
          workspace_id: workspaceId,
          name: name.trim(),
          campaign_url_type: offerType,
          created_by: user.id,
          status: "active",
        })
        .select("id")
        .single();
      if (offerErr) throw offerErr;

      // Create a cl_folder and link it to the campaign URL
      const { data: clFolder } = await (supabase as any)
        .from("cl_folders")
        .insert({
          workspace_id: workspaceId,
          name: folderName.trim() || "Default",
          created_by: user.id,
        })
        .select("id")
        .single();
      if (clFolder) {
        await (supabase as any)
          .from("campaign_url_cl_folder_links")
          .insert({
            workspace_id: workspaceId,
            campaign_url_id: offer.id,
            cl_folder_id: clFolder.id,
          });
      }

      const adRows = validAds.map((ad, idx) => ({
        campaign_url_id: offer.id,
        workspace_id: workspaceId,
        name: ad.name || `Ad ${idx + 1}`,
        headline: ad.headline || null,
        primary_text: ad.primary_text || null,
        description: ad.description || null,
        destination_url: ad.destination_url,
        display_link: ad.display_link || null,
        cta: ad.cta || "Learn More",
        media_urls: ad.media_urls,
        media_type: ad.media_urls.length > 0 ? "image" : null,
        sort_order: idx,
      }));

      const { error: adErr } = await (supabase as any).from("campaign_url_ads").insert(adRows);
      if (adErr) throw adErr;

      toast({ title: `${label} campaign URL created` });
      qc.invalidateQueries({ queryKey: ["rrm-offers"] });
      qc.invalidateQueries({ queryKey: ["offers"] });
      onCreated?.(offer.id);
      onOpenChange(false);

      setName("");
      setOfferType("rrm_dilution");
      setFolderName("Default");
      setAds([emptyAd()]);
    } catch (err: any) {
      toast({ title: "Failed to create", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create RRM Campaign URL</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My RRM Campaign URL" />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={offerType} onValueChange={(v) => setOfferType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rrm_dilution">Dilution</SelectItem>
                  <SelectItem value="rrm_replacement">Replacement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Folder Name</Label>
              <Input value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="Default" />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Ads</Label>
            <RRMAdForm ads={ads} onChange={setAds} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Campaign URL
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
