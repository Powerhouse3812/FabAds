import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import type { LaunchFull } from "@/hooks/use-launch-data";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  launchData: LaunchFull;
}

const CAMPAIGN_TOKENS = ["{launch_name}", "{number}"];
const ADSET_TOKENS = ["{campaign_name}", "{number}"];
const AD_TOKENS = ["{adset_name}", "{number}", "{ad_name}"];

export function EditNomenclatureModal({ open, onOpenChange, launchData }: Props) {
  const qc = useQueryClient();
  const config = (launchData.launch_config as any)?.nomenclature || {};

  const [campTemplate, setCampTemplate] = useState(config.campaign || "{launch_name}_Campaign_{number}");
  const [adsetTemplate, setAdsetTemplate] = useState(config.adset || "{campaign_name}_Adset_{number}");
  const [adTemplate, setAdTemplate] = useState(config.ad || "Ad_{number}");
  const [saving, setSaving] = useState(false);

  const applyTemplate = (template: string, vars: Record<string, string>) => {
    let result = template;
    for (const [key, val] of Object.entries(vars)) {
      result = result.split(key).join(val);
    }
    return result;
  };

  const handleApply = async () => {
    setSaving(true);
    try {
      const launchId = launchData.id;

      // Save nomenclature config
      const newConfig = {
        ...(launchData.launch_config || {}),
        nomenclature: { campaign: campTemplate, adset: adsetTemplate, ad: adTemplate },
      };
      await (supabase as any).from("launches").update({ launch_config: newConfig }).eq("id", launchId);

      // Rename all campaigns
      for (let i = 0; i < launchData.campaigns.length; i++) {
        const camp = launchData.campaigns[i];
        const name = applyTemplate(campTemplate, { "{launch_name}": launchData.name, "{number}": String(i + 1) });
        await (supabase as any).from("launch_campaigns").update({ name }).eq("id", camp.id);
      }

      // Rename all adsets
      for (const camp of launchData.campaigns) {
        const campAdsets = launchData.adsets.filter((a) => a.campaign_id === camp.id);
        for (let i = 0; i < campAdsets.length; i++) {
          const adset = campAdsets[i];
          const name = applyTemplate(adsetTemplate, { "{campaign_name}": camp.name, "{number}": String(i + 1) });
          await (supabase as any).from("launch_adsets").update({ name }).eq("id", adset.id);
        }
      }

      // Rename all ads
      for (const adset of launchData.adsets) {
        const adsetAds = launchData.ads.filter((a) => a.adset_id === adset.id);
        for (let i = 0; i < adsetAds.length; i++) {
          const ad = adsetAds[i];
          const name = applyTemplate(adTemplate, { "{adset_name}": adset.name, "{number}": String(i + 1), "{ad_name}": ad.name });
          await (supabase as any).from("launch_ads").update({ name }).eq("id", ad.id);
        }
      }

      qc.invalidateQueries({ queryKey: ["launch-full", launchId] });
      toast({ title: "Nomenclature applied" });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Nomenclature</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Campaign name template</Label>
            <Input value={campTemplate} onChange={(e) => setCampTemplate(e.target.value)} />
            <div className="flex gap-1.5 flex-wrap">
              {CAMPAIGN_TOKENS.map((t) => (
                <Badge key={t} variant="outline" className="text-xs cursor-pointer" onClick={() => setCampTemplate((p) => p + t)}>{t}</Badge>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Ad set name template</Label>
            <Input value={adsetTemplate} onChange={(e) => setAdsetTemplate(e.target.value)} />
            <div className="flex gap-1.5 flex-wrap">
              {ADSET_TOKENS.map((t) => (
                <Badge key={t} variant="outline" className="text-xs cursor-pointer" onClick={() => setAdsetTemplate((p) => p + t)}>{t}</Badge>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Ad name template</Label>
            <Input value={adTemplate} onChange={(e) => setAdTemplate(e.target.value)} />
            <div className="flex gap-1.5 flex-wrap">
              {AD_TOKENS.map((t) => (
                <Badge key={t} variant="outline" className="text-xs cursor-pointer" onClick={() => setAdTemplate((p) => p + t)}>{t}</Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleApply} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Apply Nomenclature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
