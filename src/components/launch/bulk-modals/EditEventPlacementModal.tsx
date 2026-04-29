import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  totalCount: number;
  onSave: (data: any, applyToAll: boolean) => void;
}

export function EditEventPlacementModal({ open, onOpenChange, selectedCount, totalCount, onSave }: Props) {
  const [placement, setPlacement] = useState("automatic");

  const handleSave = (applyToAll: boolean) => {
    onSave({ placements: { type: placement } }, applyToAll);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Event & Placement</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Placement</Label>
            <Select value={placement} onValueChange={setPlacement}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="automatic">Automatic (Advantage+)</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
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
