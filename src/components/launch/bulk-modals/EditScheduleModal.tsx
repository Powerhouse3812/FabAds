import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  totalCount: number;
  onSave: (data: any, applyToAll: boolean) => void;
}

export function EditScheduleModal({ open, onOpenChange, selectedCount, totalCount, onSave }: Props) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSave = (applyToAll: boolean) => {
    const data: Record<string, any> = {};
    if (startDate) data.schedule_start = new Date(startDate).toISOString();
    if (endDate) data.schedule_end = new Date(endDate).toISOString();
    onSave(data, applyToAll);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Schedule</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Start Date & Time</Label>
              <Input
                type="datetime-local" value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                autoComplete="off" data-1p-ignore data-lpignore="true"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">End Date & Time</Label>
              <Input
                type="datetime-local" value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                autoComplete="off" data-1p-ignore data-lpignore="true"
              />
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
