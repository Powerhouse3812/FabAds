import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ReviewSummaryCard } from "./ReviewSummaryCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { validateStep4 } from "@/lib/launch-validation";
import type { LaunchFull } from "@/hooks/use-launch-data";
import { Loader2, ChevronDown, ChevronRight, ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface StepReviewProps {
  launchData: LaunchFull;
  onBack: () => void;
}

export function StepReview({ launchData, onBack }: StepReviewProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [launching, setLaunching] = useState(false);
  const [initialStatus, setInitialStatus] = useState("active");
  const [scheduledAt, setScheduledAt] = useState("");
  const [expandedCamps, setExpandedCamps] = useState<Set<string>>(new Set());

  // Full validation
  const validation = validateStep4(launchData);
  const isValid = validation.valid && launchData.campaigns.length > 0;

  const totalBudget = launchData.campaigns.reduce((sum, c) => sum + (c.budget_value || 0), 0) +
    launchData.adsets.reduce((sum, a) => sum + (a.budget_value || 0), 0);

  const mediaCount = launchData.ads.reduce((sum, a) => sum + (a.media_urls?.length || 0), 0);

  const handleLaunch = async () => {
    setLaunching(true);
    try {
      // Save launch config
      await (supabase as any).from("launches").update({
        launch_config: { initial_status: initialStatus, scheduled_at: scheduledAt || null },
      }).eq("id", launchData.id);

      const { data, error } = await supabase.functions.invoke("launch-execute", {
        body: { launch_id: launchData.id },
      });

      if (error) throw error;
      if (data?.status === "failed") {
        toast({ title: "Launch failed", description: "Simulation returned failure.", variant: "destructive" });
        qc.invalidateQueries({ queryKey: ["launch-full", launchData.id] });
      } else {
        toast({ title: "Launch successful!" });
        navigate("/launch");
      }
    } catch (err: any) {
      toast({ title: "Launch error", description: err.message, variant: "destructive" });
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Ad Accounts */}
      <ReviewSummaryCard title="Ad Accounts">
        {launchData.ad_accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No ad accounts selected.</p>
        ) : (
          <ul className="space-y-1">
            {launchData.ad_accounts.map((acc) => (
              <li key={acc.id} className="text-sm">{acc.fb_ad_account_id}</li>
            ))}
          </ul>
        )}
      </ReviewSummaryCard>

      {/* Structure Summary */}
      <ReviewSummaryCard title="Structure Summary">
        <div className="grid grid-cols-5 gap-4 text-center">
          <div><div className="text-2xl font-bold">{launchData.campaigns.length}</div><div className="text-xs text-muted-foreground">Campaigns</div></div>
          <div><div className="text-2xl font-bold">{launchData.adsets.length}</div><div className="text-xs text-muted-foreground">Adsets</div></div>
          <div><div className="text-2xl font-bold">{launchData.ads.length}</div><div className="text-xs text-muted-foreground">Ads</div></div>
          <div><div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div><div className="text-xs text-muted-foreground">Total Budget</div></div>
          <div><div className="text-2xl font-bold">{mediaCount}</div><div className="text-xs text-muted-foreground">Media Files</div></div>
        </div>
      </ReviewSummaryCard>

      {/* Hierarchy */}
      <ReviewSummaryCard title="Hierarchy Preview">
        <div className="space-y-1">
          {launchData.campaigns.map((camp) => {
            const expanded = expandedCamps.has(camp.id);
            const campAdsets = launchData.adsets.filter((a) => a.campaign_id === camp.id);
            return (
              <div key={camp.id}>
                <button type="button" className="flex items-center gap-1.5 text-sm" onClick={() => { const s = new Set(expandedCamps); s.has(camp.id) ? s.delete(camp.id) : s.add(camp.id); setExpandedCamps(s); }}>
                  {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  <span className="font-medium">{camp.name}</span>
                  <Badge variant={camp.status === "active" ? "default" : "secondary"} className="text-xs ml-1">{camp.status}</Badge>
                </button>
                {expanded && campAdsets.map((adset) => (
                  <div key={adset.id} className="ml-5">
                    <div className="flex items-center gap-1.5 text-sm py-0.5">
                      <span>{adset.name}</span>
                      <Badge variant="secondary" className="text-xs">{adset.status}</Badge>
                    </div>
                    {launchData.ads.filter((a) => a.adset_id === adset.id).map((ad) => (
                      <div key={ad.id} className="ml-5 text-sm text-muted-foreground py-0.5 flex items-center gap-1.5">
                        <span>{ad.name}</span>
                        <Badge variant={ad.status === "active" ? "outline" : "secondary"} className="text-xs">{ad.status}</Badge>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </ReviewSummaryCard>

      {/* Launch Options */}
      <ReviewSummaryCard title="Launch Options">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Initial Status</Label>
            <RadioGroup value={initialStatus} onValueChange={setInitialStatus} className="flex gap-4">
              <div className="flex items-center gap-1.5"><RadioGroupItem value="active" id="launch-active" /><Label htmlFor="launch-active" className="text-xs">Active</Label></div>
              <div className="flex items-center gap-1.5"><RadioGroupItem value="paused" id="launch-paused" /><Label htmlFor="launch-paused" className="text-xs">Paused</Label></div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Schedule (optional)</Label>
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </div>
        </div>
      </ReviewSummaryCard>

      {/* Validation */}
      {!isValid && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive font-medium">{validation.errors.length} issue(s) must be fixed before launching:</p>
          <ul className="text-xs text-destructive/80 mt-1 space-y-0.5">
            {validation.errors.slice(0, 10).map((e, i) => <li key={i}>• {e}</li>)}
            {validation.errors.length > 10 && <li>...and {validation.errors.length - 10} more</li>}
          </ul>
        </div>
      )}

      {/* Navigation + Launch */}
      <div className="flex justify-between pt-4 border-t border-border">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Button>
        <Button onClick={handleLaunch} disabled={!isValid || launching} size="lg">
          {launching && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {launching ? "Launching..." : "Launch"}
        </Button>
      </div>
    </div>
  );
}
