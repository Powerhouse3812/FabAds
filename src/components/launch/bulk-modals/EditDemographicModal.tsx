import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  totalCount: number;
  onSave: (data: any, applyToAll: boolean) => void;
}

const AGE_OPTIONS = Array.from({ length: 48 }, (_, i) => String(18 + i));

export function EditDemographicModal({ open, onOpenChange, selectedCount, totalCount, onSave }: Props) {
  const [gender, setGender] = useState("all");
  const [ageMin, setAgeMin] = useState("18");
  const [ageMax, setAgeMax] = useState("65");

  const handleSave = (applyToAll: boolean) => {
    onSave({
      gender,
      age_min: Number(ageMin),
      age_max: Number(ageMax),
    }, applyToAll);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Demographic</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Gender</Label>
            <ToggleGroup type="single" value={gender} onValueChange={(v) => v && setGender(v)} className="justify-start">
              <ToggleGroupItem value="all">All</ToggleGroupItem>
              <ToggleGroupItem value="male">Male</ToggleGroupItem>
              <ToggleGroupItem value="female">Female</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Min Age</Label>
              <Select value={ageMin} onValueChange={setAgeMin}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{AGE_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Max Age</Label>
              <Select value={ageMax} onValueChange={setAgeMax}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{AGE_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="outline" onClick={() => handleSave(false)}>Apply to selected ({selectedCount})</Button>
          <Button onClick={() => handleSave(true)}>Apply to all ({totalCount})</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
