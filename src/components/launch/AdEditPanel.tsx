import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MediaUploader } from "./MediaUploader";
import type { LaunchAd } from "@/hooks/use-launch-data";

const CTA_OPTIONS = ["Book Now", "Learn More", "Shop Now", "Sign Up", "Download", "Contact Us", "Get Offer", "Apply Now"];

interface AdEditPanelProps {
  ad: LaunchAd;
  launchId: string;
  onSave: (fields: Partial<LaunchAd>) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function AdEditPanel({ ad, launchId, onSave, onCancel, saving }: AdEditPanelProps) {
  const [fields, setFields] = useState({
    primary_text: ad.primary_text || "",
    headline: ad.headline || "",
    description: ad.description || "",
    cta: ad.cta || "",
    destination_url: ad.destination_url || "",
    display_link: ad.display_link || "",
    media_urls: ad.media_urls || [],
    media_type: ad.media_type || "",
    status: ad.status,
  });

  const update = (k: string, v: any) => setFields((p) => ({ ...p, [k]: v }));

  return (
    <div className="border border-border rounded-md p-4 bg-muted/30 space-y-4">
      <MediaUploader
        launchId={launchId}
        adId={ad.id}
        currentUrls={fields.media_urls as string[]}
        onUploaded={(urls) => {
          update("media_urls", [...(fields.media_urls || []), ...urls]);
          if (urls.length === 1 && !fields.media_type) {
            const ext = urls[0].split(".").pop()?.toLowerCase() || "";
            update("media_type", ["mp4", "mov", "webm"].includes(ext) ? "video" : "image");
          }
        }}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs">Primary Text *</Label>
          <Textarea value={fields.primary_text} onChange={(e) => update("primary_text", e.target.value)} rows={3} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Headline *</Label>
          <Input value={fields.headline} onChange={(e) => update("headline", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Description</Label>
          <Input value={fields.description} onChange={(e) => update("description", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">CTA *</Label>
          <Select value={fields.cta} onValueChange={(v) => update("cta", v)}>
            <SelectTrigger><SelectValue placeholder="Select CTA" /></SelectTrigger>
            <SelectContent>{CTA_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Destination URL *</Label>
          <Input value={fields.destination_url} onChange={(e) => update("destination_url", e.target.value)} placeholder="https://" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Display Link</Label>
          <Input value={fields.display_link} onChange={(e) => update("display_link", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Media Type</Label>
          <Select value={fields.media_type} onValueChange={(v) => update("media_type", v)}>
            <SelectTrigger><SelectValue placeholder="Auto-detect" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="carousel">Carousel</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 pt-5">
          <span className="text-xs text-muted-foreground">{fields.status === "active" ? "Active" : "Paused"}</span>
          <Switch checked={fields.status === "active"} onCheckedChange={(v) => update("status", v ? "active" : "paused")} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={() => onSave(fields)} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
      </div>
    </div>
  );
}
