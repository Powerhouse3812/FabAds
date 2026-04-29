import { useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2, ChevronDown, Pencil } from "lucide-react";
import { toast } from "sonner";
import { BulkEditAdsModal } from "./BulkEditAdsModal";
import type { ReportEntity } from "@/lib/reports-dummy-data";

const CTA_OPTIONS = ["Book Now", "Learn More", "Shop Now", "Sign Up", "Download", "Contact Us", "Get Offer", "Apply Now"];

export interface AdDraft {
  id: string;
  name: string;
  primary_text: string;
  headline: string;
  description: string;
  cta: string;
  destination_url: string;
  display_link: string;
  media_type: string;
}

function createBlankAd(): AdDraft {
  return {
    id: crypto.randomUUID(),
    name: "",
    primary_text: "",
    headline: "",
    description: "",
    cta: "",
    destination_url: "",
    display_link: "",
    media_type: "",
  };
}

interface CreateAdDrawerProps {
  adset: ReportEntity | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function CreateAdDrawer({ adset, open, onOpenChange }: CreateAdDrawerProps) {
  const [ads, setAds] = useState<AdDraft[]>([createBlankAd()]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set([ads[0]?.id]));
  const [bulkOpen, setBulkOpen] = useState(false);

  const updateAd = (id: string, fields: Partial<AdDraft>) => {
    setAds((prev) => prev.map((a) => (a.id === id ? { ...a, ...fields } : a)));
  };

  const addAd = () => {
    const a = createBlankAd();
    setAds((prev) => [...prev, a]);
    setExpandedIds((prev) => new Set(prev).add(a.id));
  };

  const removeAd = (id: string) => {
    setAds((prev) => prev.filter((a) => a.id !== id));
    setCheckedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleBulkApply = (fields: Partial<AdDraft>) => {
    setAds((prev) =>
      prev.map((a) => (checkedIds.has(a.id) ? { ...a, ...fields } : a))
    );
    setBulkOpen(false);
    toast.success(`Bulk edit applied to ${checkedIds.size} ads`);
  };

  const handleCreate = () => {
    toast.success(`${ads.length} ad(s) created for "${adset?.name}"`);
    onOpenChange(false);
    setAds([createBlankAd()]);
    setCheckedIds(new Set());
  };

  if (!adset) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle className="text-base">Add Ads to "{adset.name}"</SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="px-6 py-4 space-y-4">
              {ads.map((ad, idx) => (
                <Collapsible
                  key={ad.id}
                  open={expandedIds.has(ad.id)}
                  onOpenChange={() => toggleExpand(ad.id)}
                >
                  <div className="border border-border rounded-lg bg-card">
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-t-lg">
                      <Checkbox
                        checked={checkedIds.has(ad.id)}
                        onCheckedChange={() => toggleCheck(ad.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <CollapsibleTrigger asChild>
                        <button className="flex items-center gap-1 flex-1 text-left">
                          <ChevronDown className={`h-4 w-4 transition-transform ${expandedIds.has(ad.id) ? "" : "-rotate-90"}`} />
                          <span className="text-sm font-medium text-foreground">
                            {ad.name || `Ad ${idx + 1}`}
                          </span>
                        </button>
                      </CollapsibleTrigger>
                      {ads.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeAd(ad.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      )}
                    </div>

                    <CollapsibleContent>
                      <div className="p-4 space-y-4">
                        {/* Name */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">Ad Name</Label>
                          <Input value={ad.name} onChange={(e) => updateAd(ad.id, { name: e.target.value })} placeholder="Enter ad name" />
                        </div>

                        {/* Media */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">Media Type</Label>
                          <Select value={ad.media_type} onValueChange={(v) => updateAd(ad.id, { media_type: v })}>
                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="image">Image</SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                              <SelectItem value="carousel">Carousel</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="rounded-md border border-dashed border-border p-6 flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">Drag & drop media or click to upload</span>
                        </div>

                        {/* Ad copy */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">Primary Text</Label>
                          <Textarea value={ad.primary_text} onChange={(e) => updateAd(ad.id, { primary_text: e.target.value })} rows={3} placeholder="Enter primary text..." />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Headline</Label>
                            <Input value={ad.headline} onChange={(e) => updateAd(ad.id, { headline: e.target.value })} placeholder="Enter headline..." />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Description</Label>
                            <Input value={ad.description} onChange={(e) => updateAd(ad.id, { description: e.target.value })} placeholder="Enter description..." />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">CTA</Label>
                            <Select value={ad.cta} onValueChange={(v) => updateAd(ad.id, { cta: v })}>
                              <SelectTrigger><SelectValue placeholder="Select CTA" /></SelectTrigger>
                              <SelectContent>{CTA_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Destination URL</Label>
                            <Input value={ad.destination_url} onChange={(e) => updateAd(ad.id, { destination_url: e.target.value })} placeholder="https://" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Display Link</Label>
                            <Input value={ad.display_link} onChange={(e) => updateAd(ad.id, { display_link: e.target.value })} placeholder="example.com" />
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}

              <Button variant="outline" size="sm" className="w-full" onClick={addAd}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Another Ad
              </Button>
            </div>
          </ScrollArea>

          {/* Bulk bar */}
          {checkedIds.size >= 2 && (
            <div className="px-6 py-3 border-t border-border bg-muted/30 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{checkedIds.size} selected</span>
              <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1" /> Bulk Edit
              </Button>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create {ads.length > 1 ? `${ads.length} Ads` : "Ad"}</Button>
          </div>
        </SheetContent>
      </Sheet>

      <BulkEditAdsModal
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        count={checkedIds.size}
        onApply={handleBulkApply}
      />
    </>
  );
}
