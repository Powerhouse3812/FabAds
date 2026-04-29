import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdDraft } from "./CreateAdDrawer";

const CTA_OPTIONS = ["Book Now", "Learn More", "Shop Now", "Sign Up", "Download", "Contact Us", "Get Offer", "Apply Now"];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  count: number;
  onApply: (fields: Partial<AdDraft>) => void;
}

export function BulkEditAdsModal({ open, onOpenChange, count, onApply }: Props) {
  const [fields, setFields] = useState({
    primary_text: "",
    headline: "",
    description: "",
    cta: "",
    destination_url: "",
    display_link: "",
  });

  useEffect(() => {
    if (open) setFields({ primary_text: "", headline: "", description: "", cta: "", destination_url: "", display_link: "" });
  }, [open]);

  const handleApply = () => {
    const result: Partial<AdDraft> = {};
    if (fields.primary_text) result.primary_text = fields.primary_text;
    if (fields.headline) result.headline = fields.headline;
    if (fields.description) result.description = fields.description;
    if (fields.cta) result.cta = fields.cta;
    if (fields.destination_url) result.destination_url = fields.destination_url;
    if (fields.display_link) result.display_link = fields.display_link;
    onApply(result);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Edit {count} Ads</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">Only non-empty fields will be applied to the selected ads.</p>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Primary Text</Label>
            <Textarea value={fields.primary_text} onChange={(e) => setFields((p) => ({ ...p, primary_text: e.target.value }))} placeholder="— skip —" rows={3} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Headline</Label>
            <Input value={fields.headline} onChange={(e) => setFields((p) => ({ ...p, headline: e.target.value }))} placeholder="— skip —" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Input value={fields.description} onChange={(e) => setFields((p) => ({ ...p, description: e.target.value }))} placeholder="— skip —" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">CTA</Label>
            <Select value={fields.cta} onValueChange={(v) => setFields((p) => ({ ...p, cta: v }))}>
              <SelectTrigger><SelectValue placeholder="— skip —" /></SelectTrigger>
              <SelectContent>{CTA_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Destination URL</Label>
            <Input value={fields.destination_url} onChange={(e) => setFields((p) => ({ ...p, destination_url: e.target.value }))} placeholder="— skip —" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Display Link</Label>
            <Input value={fields.display_link} onChange={(e) => setFields((p) => ({ ...p, display_link: e.target.value }))} placeholder="— skip —" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleApply}>Apply to {count} Ads</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
