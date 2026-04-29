import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  totalCount: number;
  onSave: (data: any, applyToAll: boolean) => void;
}

export function EditLocationModal({ open, onOpenChange, selectedCount, totalCount, onSave }: Props) {
  const [locationType, setLocationType] = useState("usa");
  const [includeLocations, setIncludeLocations] = useState("");
  const [excludeLocations, setExcludeLocations] = useState("");
  const [limitToPeople, setLimitToPeople] = useState(false);

  const handleSave = (applyToAll: boolean) => {
    onSave({
      location_type: locationType,
      include_locations: includeLocations.split(",").map(s => s.trim()).filter(Boolean),
      exclude_locations: excludeLocations.split(",").map(s => s.trim()).filter(Boolean),
      limit_to_people_in_location: limitToPeople,
    }, applyToAll);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Location</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Tabs value={locationType} onValueChange={setLocationType}>
            <TabsList className="w-full">
              <TabsTrigger value="usa" className="flex-1">USA</TabsTrigger>
              <TabsTrigger value="overseas" className="flex-1">Overseas</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-1.5">
            <Label className="text-sm">Include Locations</Label>
            <Input
              value={includeLocations}
              onChange={(e) => setIncludeLocations(e.target.value)}
              placeholder="e.g. New York, California"
              autoComplete="off" data-1p-ignore data-lpignore="true"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Exclude Locations</Label>
            <Input
              value={excludeLocations}
              onChange={(e) => setExcludeLocations(e.target.value)}
              placeholder="e.g. Alaska"
              autoComplete="off" data-1p-ignore data-lpignore="true"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox checked={limitToPeople} onCheckedChange={(c) => setLimitToPeople(!!c)} id="limit-people" />
            <Label htmlFor="limit-people" className="text-sm">Limit to people in this location</Label>
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
