import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { validateStep4 } from "@/lib/launch-validation";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarIcon, Loader2, AlertTriangle } from "lucide-react";
import type { LaunchFull } from "@/hooks/use-launch-data";

interface LaunchPreviewModalProps {
  open: boolean;
  onClose: () => void;
  launchData: LaunchFull;
}

export function LaunchPreviewModal({ open, onClose, launchData }: LaunchPreviewModalProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [launching, setLaunching] = useState(false);
  const [initialStatus, setInitialStatus] = useState<"active" | "paused">("active");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [timezone, setTimezone] = useState("ad_account");

  const validation = validateStep4(launchData);
  const isValid = validation.valid && launchData.campaigns.length > 0;

  // Compute summary stats
  const uniqueBMs = new Set(launchData.ad_accounts.map(a => (a as any).fb_business_manager_id).filter(Boolean));
  const totalBudget = launchData.campaigns.reduce((s, c) => s + (c.budget_value || 0), 0) +
    launchData.adsets.reduce((s, a) => s + (a.budget_value || 0), 0);
  const mediaCount = launchData.ads.reduce((s, a) => s + (a.media_urls?.length || 0), 0);
  const headlineCount = launchData.ads.filter(a => a.headline).length;
  const textCount = launchData.ads.filter(a => a.primary_text).length;
  const descCount = launchData.ads.filter(a => a.description).length;

  const statsRow1 = [
    { label: "BM", value: uniqueBMs.size || launchData.ad_accounts.length },
    { label: "Ad accounts", value: launchData.ad_accounts.length },
    { label: "Campaigns", value: launchData.campaigns.length },
    { label: "Ad groups", value: launchData.adsets.length },
    { label: "Ads", value: launchData.ads.length },
  ];
  const statsRow2 = [
    { label: "Budget", value: `$${totalBudget.toLocaleString()}` },
    { label: "Media", value: mediaCount },
    { label: "Headlines", value: headlineCount },
    { label: "Text", value: textCount },
    { label: "Description", value: descCount },
  ];

  const handleLaunch = async () => {
    setLaunching(true);
    try {
      await (supabase as any).from("launches").update({
        launch_config: {
          initial_status: initialStatus,
          scheduled_at: scheduleEnabled && startDate ? startDate.toISOString() : null,
          schedule_end: scheduleEnabled && endDate ? endDate.toISOString() : null,
          timezone: scheduleEnabled ? timezone : null,
        },
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
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Launch Preview</DialogTitle>
          <DialogDescription>Review your launch configuration before going live.</DialogDescription>
        </DialogHeader>

        {/* Summary Stats Row 1 */}
        <div className="grid grid-cols-5 gap-2">
          {statsRow1.map((s) => (
            <div key={s.label} className="border border-border rounded-md p-3 text-center">
              <div className="text-xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Summary Stats Row 2 */}
        <div className="grid grid-cols-5 gap-2">
          {statsRow2.map((s) => (
            <div key={s.label} className="border border-border rounded-md p-3 text-center">
              <div className="text-xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Campaign Status */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Campaign Status</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={initialStatus === "active" ? "default" : "outline"}
              onClick={() => setInitialStatus("active")}
            >
              Active
            </Button>
            <Button
              type="button"
              size="sm"
              variant={initialStatus === "paused" ? "default" : "outline"}
              onClick={() => setInitialStatus("paused")}
            >
              Inactive
            </Button>
          </div>
        </div>

        {/* Schedule Launch */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Schedule launch</Label>
            <Switch checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} />
          </div>

          {scheduleEnabled && (
            <div className="space-y-3 pl-1">
              <div className="flex items-start gap-2 p-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>Scheduling uses the selected timezone. Ensure it matches your ad account settings.</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Start Date */}
                <div className="space-y-1">
                  <Label className="text-xs">Start date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-xs", !startDate && "text-muted-foreground")}>
                        <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                        {startDate ? format(startDate, "PPP") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* End Date */}
                <div className="space-y-1">
                  <Label className="text-xs">End date (optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-xs", !endDate && "text-muted-foreground")}>
                        <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                        {endDate ? format(endDate, "PPP") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Timezone */}
                <div className="space-y-1">
                  <Label className="text-xs">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ad_account">Ad account's timezone</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Validation Errors */}
        {!isValid && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive font-medium">{validation.errors.length} issue(s) must be fixed before launching:</p>
            <ul className="text-xs text-destructive/80 mt-1 space-y-0.5">
              {validation.errors.slice(0, 10).map((e, i) => <li key={i}>• {e}</li>)}
              {validation.errors.length > 10 && <li>...and {validation.errors.length - 10} more</li>}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between pt-2 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Back to editing
          </Button>
          <Button onClick={handleLaunch} disabled={!isValid || launching}>
            {launching && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {launching ? "Launching..." : "Launch"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
