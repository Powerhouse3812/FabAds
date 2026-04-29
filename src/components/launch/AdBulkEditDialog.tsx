import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Image, Copy, Trash2, Plus, Upload, Library, Loader2 } from "lucide-react";
import type { LaunchAd } from "@/hooks/use-launch-data";

const CTA_OPTIONS = ["Book Now", "Learn More", "Shop Now", "Sign Up", "Download", "Contact Us", "Get Offer", "Apply Now"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ads: LaunchAd[];
  onApply: (fields: Record<string, any>) => void;
  onDuplicate?: (adId: string) => void;
  onDelete?: (adId: string) => void;
  onAddAd?: () => void;
  applying?: boolean;
}

export function AdBulkEditDialog({ open, onOpenChange, ads, onApply, onDuplicate, onDelete, onAddAd, applying }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(ads.map(a => a.id)));
  const [fields, setFields] = useState({
    primary_text: "",
    headline: "",
    description: "",
    cta: "",
    display_link: "",
    destination_url: "",
  });

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(ads.map(a => a.id)));
      setFields({ primary_text: "", headline: "", description: "", cta: "", display_link: "", destination_url: "" });
    }
  }, [open, ads]);

  const allSelected = ads.length > 0 && selectedIds.size === ads.length;

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(ads.map(a => a.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const handleSave = () => {
    const cleanFields: Record<string, any> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (v !== "" && v !== null && v !== undefined) cleanFields[k] = v;
    }
    onApply(cleanFields);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Editing {selectedIds.size} Ad{selectedIds.size !== 1 ? "s" : ""}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 min-h-0 border-t border-border">
          {/* Left panel - Ad list */}
          <div className="w-[300px] border-r border-border flex flex-col">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                <span className="text-xs text-muted-foreground">Select all</span>
              </div>
              {onAddAd && (
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onAddAd}>
                  <Plus className="h-3 w-3 mr-1" /> Add Ad
                </Button>
              )}
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {ads.map((ad) => (
                  <div
                    key={ad.id}
                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                      selectedIds.has(ad.id) ? "bg-accent" : "hover:bg-muted"
                    }`}
                    onClick={() => toggleOne(ad.id)}
                  >
                    <Checkbox
                      checked={selectedIds.has(ad.id)}
                      onCheckedChange={() => toggleOne(ad.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="h-10 w-10 rounded bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden">
                      {ad.media_urls && ad.media_urls.length > 0 ? (
                        <img src={ad.media_urls[0]} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Image className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{ad.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{ad.primary_text || "No text"}</p>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      {onDuplicate && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDuplicate(ad.id); }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDelete(ad.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right panel - Edit form */}
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-5">
              <p className="text-sm text-muted-foreground">
                Only non-empty fields will be applied to the {selectedIds.size} selected ad{selectedIds.size !== 1 ? "s" : ""}. Leave a field blank to skip it.
              </p>

              {/* Media section */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Product Media</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    <Upload className="h-3 w-3 mr-1" /> Upload
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Library className="h-3 w-3 mr-1" /> Select from Library
                  </Button>
                </div>
              </div>

              {/* Primary text */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Primary Text</Label>
                <Textarea
                  value={fields.primary_text}
                  onChange={(e) => setFields(p => ({ ...p, primary_text: e.target.value }))}
                  placeholder="Enter primary text for selected ads..."
                  rows={3}
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                />
              </div>

              {/* Headline */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Headline</Label>
                <Input
                  value={fields.headline}
                  onChange={(e) => setFields(p => ({ ...p, headline: e.target.value }))}
                  placeholder="Enter headline..."
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Description</Label>
                <Input
                  value={fields.description}
                  onChange={(e) => setFields(p => ({ ...p, description: e.target.value }))}
                  placeholder="Enter description..."
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                />
              </div>

              {/* CTA */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Call to Action</Label>
                <Select value={fields.cta} onValueChange={(v) => setFields(p => ({ ...p, cta: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="— skip —" />
                  </SelectTrigger>
                  <SelectContent>
                    {CTA_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Display link */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Display Link</Label>
                <Input
                  value={fields.display_link}
                  onChange={(e) => setFields(p => ({ ...p, display_link: e.target.value }))}
                  placeholder="example.com"
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                />
              </div>

              {/* Website URL */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Website URL</Label>
                <Input
                  value={fields.destination_url}
                  onChange={(e) => setFields(p => ({ ...p, destination_url: e.target.value }))}
                  placeholder="https://"
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                />
              </div>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={applying || selectedIds.size === 0}>
            {applying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save and Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
