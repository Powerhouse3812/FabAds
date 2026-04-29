import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  totalCount: number;
  onSave: (data: any, applyToAll: boolean) => void;
}

export function EditDeviceModal({ open, onOpenChange, selectedCount, totalCount, onSave }: Props) {
  const [os, setOs] = useState<string[]>(["all"]);
  const [network, setNetwork] = useState<string[]>(["all"]);

  const toggleItem = (list: string[], item: string) => {
    if (item === "all") return ["all"];
    const filtered = list.filter(i => i !== "all");
    return filtered.includes(item) ? filtered.filter(i => i !== item) : [...filtered, item];
  };

  const handleSave = (applyToAll: boolean) => {
    onSave({
      device_platforms: os,
      network_connections: network,
    }, applyToAll);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Device Targeting</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Operating System</Label>
            <div className="flex flex-wrap gap-3">
              {[{ v: "all", l: "All" }, { v: "ios", l: "iOS" }, { v: "android", l: "Android" }].map(({ v, l }) => (
                <div key={v} className="flex items-center gap-1.5">
                  <Checkbox checked={os.includes(v)} onCheckedChange={() => setOs(toggleItem(os, v))} id={`os-${v}`} />
                  <Label htmlFor={`os-${v}`} className="text-sm">{l}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Network Connection</Label>
            <div className="flex flex-wrap gap-3">
              {[{ v: "all", l: "All" }, { v: "wifi", l: "WiFi" }, { v: "4g", l: "4G" }, { v: "5g", l: "5G" }].map(({ v, l }) => (
                <div key={v} className="flex items-center gap-1.5">
                  <Checkbox checked={network.includes(v)} onCheckedChange={() => setNetwork(toggleItem(network, v))} id={`net-${v}`} />
                  <Label htmlFor={`net-${v}`} className="text-sm">{l}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="outline" onClick={() => handleSave(false)}>Save to selected ({selectedCount})</Button>
          <Button onClick={() => handleSave(true)}>Save to all ({totalCount})</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
