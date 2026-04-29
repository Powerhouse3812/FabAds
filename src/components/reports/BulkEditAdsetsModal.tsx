import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { AdsetDraft } from "./CreateAdsetDrawer";

const PERFORMANCE_GOALS = ["Maximize Conversions", "Maximize Link Clicks", "Maximize Impressions", "Maximize Reach", "Maximize Landing Page Views"];
const BID_STRATEGIES = ["Lowest Cost", "Cost Cap", "Bid Cap", "Target Cost"];
const DEVICE_OPTIONS = ["Desktop", "Mobile", "iOS"];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  count: number;
  onApply: (fields: Partial<AdsetDraft>) => void;
}

export function BulkEditAdsetsModal({ open, onOpenChange, count, onApply }: Props) {
  const [fields, setFields] = useState({
    performance_goal: "",
    budget_value: "" as string,
    budget_period: "",
    bid_strategy: "",
    bid_amount: "" as string,
    placements_mode: "" as "" | "automatic" | "manual",
    devices: null as string[] | null,
    schedule_start: "",
    schedule_end: "",
  });

  useEffect(() => {
    if (open) setFields({ performance_goal: "", budget_value: "", budget_period: "", bid_strategy: "", bid_amount: "", placements_mode: "", devices: null, schedule_start: "", schedule_end: "" });
  }, [open]);

  const handleApply = () => {
    const result: Partial<AdsetDraft> = {};
    if (fields.performance_goal) result.performance_goal = fields.performance_goal;
    if (fields.budget_value) result.budget_value = parseFloat(fields.budget_value) || null;
    if (fields.budget_period) result.budget_period = fields.budget_period;
    if (fields.bid_strategy) result.bid_strategy = fields.bid_strategy;
    if (fields.bid_amount) result.bid_amount = parseFloat(fields.bid_amount) || null;
    if (fields.placements_mode) result.placements_mode = fields.placements_mode;
    if (fields.devices) result.devices = fields.devices;
    if (fields.schedule_start) result.schedule_start = fields.schedule_start;
    if (fields.schedule_end) result.schedule_end = fields.schedule_end;
    onApply(result);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Edit {count} Ad Sets</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">Only non-empty fields will be applied to the selected ad sets.</p>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Performance Goal</Label>
            <Select value={fields.performance_goal} onValueChange={(v) => setFields((p) => ({ ...p, performance_goal: v }))}>
              <SelectTrigger><SelectValue placeholder="— skip —" /></SelectTrigger>
              <SelectContent>{PERFORMANCE_GOALS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Budget Period</Label>
              <Select value={fields.budget_period} onValueChange={(v) => setFields((p) => ({ ...p, budget_period: v }))}>
                <SelectTrigger><SelectValue placeholder="— skip —" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Budget Value</Label>
              <Input type="number" min={0} placeholder="— skip —" value={fields.budget_value} onChange={(e) => setFields((p) => ({ ...p, budget_value: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Bid Strategy</Label>
              <Select value={fields.bid_strategy} onValueChange={(v) => setFields((p) => ({ ...p, bid_strategy: v }))}>
                <SelectTrigger><SelectValue placeholder="— skip —" /></SelectTrigger>
                <SelectContent>{BID_STRATEGIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Bid Amount</Label>
              <Input type="number" min={0} placeholder="— skip —" value={fields.bid_amount} onChange={(e) => setFields((p) => ({ ...p, bid_amount: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Placements</Label>
            <RadioGroup value={fields.placements_mode} onValueChange={(v: "" | "automatic" | "manual") => setFields((p) => ({ ...p, placements_mode: v }))} className="flex gap-3">
              <div className="flex items-center gap-1"><RadioGroupItem value="automatic" id="be-pa" /><Label htmlFor="be-pa" className="text-xs">Automatic</Label></div>
              <div className="flex items-center gap-1"><RadioGroupItem value="manual" id="be-pm" /><Label htmlFor="be-pm" className="text-xs">Manual</Label></div>
            </RadioGroup>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Devices</Label>
            <div className="flex flex-wrap gap-2">
              {DEVICE_OPTIONS.map((d) => {
                const checked = fields.devices?.includes(d) ?? false;
                return (
                  <div key={d} className="flex items-center gap-1">
                    <Checkbox id={`be-d-${d}`} checked={checked} onCheckedChange={(v) => {
                      const current = fields.devices || [];
                      setFields((p) => ({ ...p, devices: v ? [...current, d] : current.filter((x) => x !== d) }));
                    }} />
                    <Label htmlFor={`be-d-${d}`} className="text-xs">{d}</Label>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Schedule Start</Label>
              <Input type="date" value={fields.schedule_start} onChange={(e) => setFields((p) => ({ ...p, schedule_start: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Schedule End</Label>
              <Input type="date" value={fields.schedule_end} onChange={(e) => setFields((p) => ({ ...p, schedule_end: e.target.value }))} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleApply}>Apply to {count} Ad Sets</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
