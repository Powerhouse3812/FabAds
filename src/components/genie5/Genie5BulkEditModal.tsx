import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaults: { pageName: string; cta: string; description: string; headline: string };
  onApply: (fields: { pageName?: string; cta?: string; description?: string; headline?: string }) => void;
}

export function Genie5BulkEditModal({ open, onOpenChange, defaults, onApply }: Props) {
  const [pageName, setPageName] = useState(defaults.pageName);
  const [cta, setCta] = useState(defaults.cta);
  const [description, setDescription] = useState(defaults.description);
  const [headline, setHeadline] = useState(defaults.headline);

  const handleApply = () => {
    onApply({
      pageName: pageName !== defaults.pageName ? pageName : undefined,
      cta: cta !== defaults.cta ? cta : undefined,
      description: description !== defaults.description ? description : undefined,
      headline: headline !== defaults.headline ? headline : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">Bulk Edit — All Cards</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Page Name</Label>
            <Input value={pageName} onChange={(e) => setPageName(e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Headline</Label>
            <Input value={headline} onChange={(e) => setHeadline(e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[50px] text-xs resize-none" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">CTA</Label>
            <Input value={cta} onChange={(e) => setCta(e.target.value)} className="h-8 text-xs" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleApply}>Apply to All</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
