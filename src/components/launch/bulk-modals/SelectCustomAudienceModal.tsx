import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  totalCount: number;
  onSave: (data: any, applyToAll: boolean) => void;
}

export function SelectCustomAudienceModal({ open, onOpenChange, selectedCount, totalCount, onSave }: Props) {
  const [audienceName, setAudienceName] = useState("");
  const [platform, setPlatform] = useState("facebook");

  const handleSave = (applyToAll: boolean) => {
    onSave({
      custom_audiences: audienceName ? [{ name: audienceName, platform }] : [],
    }, applyToAll);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Custom Audience</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Audience Name</Label>
            <Input
              value={audienceName}
              onChange={(e) => setAudienceName(e.target.value)}
              placeholder="Enter audience name"
              autoComplete="off" data-1p-ignore data-lpignore="true"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
              </SelectContent>
            </Select>
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
