import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";

export interface RRMAdData {
  name: string;
  headline: string;
  primary_text: string;
  description: string;
  destination_url: string;
  display_link: string;
  cta: string;
  media_urls: string[];
}

interface Props {
  ads: RRMAdData[];
  onChange: (ads: RRMAdData[]) => void;
}

const emptyAd = (): RRMAdData => ({
  name: "",
  headline: "",
  primary_text: "",
  description: "",
  destination_url: "",
  display_link: "",
  cta: "Learn More",
  media_urls: [],
});

export function RRMAdForm({ ads, onChange }: Props) {
  const updateAd = (index: number, field: keyof RRMAdData, value: string) => {
    const next = [...ads];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const addAd = () => {
    onChange([...ads, emptyAd()]);
  };

  const removeAd = (index: number) => {
    const next = ads.filter((_, i) => i !== index);
    onChange(next.length === 0 ? [emptyAd()] : next);
  };

  const updateMediaUrl = (index: number, url: string) => {
    const next = [...ads];
    next[index] = { ...next[index], media_urls: url ? [url] : [] };
    onChange(next);
  };

  return (
    <div className="space-y-6">
      {ads.map((ad, idx) => (
        <div key={idx} className="space-y-3 p-4 rounded-md border border-border">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Ad {idx + 1}</p>
            {ads.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => removeAd(idx)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Ad Name</Label>
              <Input
                value={ad.name}
                onChange={(e) => updateAd(idx, "name", e.target.value)}
                placeholder="Ad name..."
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">CTA</Label>
              <Input
                value={ad.cta}
                onChange={(e) => updateAd(idx, "cta", e.target.value)}
                placeholder="Learn More"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Headline</Label>
            <Input
              value={ad.headline}
              onChange={(e) => updateAd(idx, "headline", e.target.value)}
              placeholder="Ad headline..."
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Primary Text</Label>
            <Textarea
              value={ad.primary_text}
              onChange={(e) => updateAd(idx, "primary_text", e.target.value)}
              placeholder="Primary ad text..."
              rows={2}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Input
              value={ad.description}
              onChange={(e) => updateAd(idx, "description", e.target.value)}
              placeholder="Description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Destination URL *</Label>
              <Input
                value={ad.destination_url}
                onChange={(e) => updateAd(idx, "destination_url", e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Display Link</Label>
              <Input
                value={ad.display_link}
                onChange={(e) => updateAd(idx, "display_link", e.target.value)}
                placeholder="example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Media URL (image or video)</Label>
            <Input
              value={ad.media_urls[0] ?? ""}
              onChange={(e) => updateMediaUrl(idx, e.target.value)}
              placeholder="https://... (paste image/video URL)"
            />
          </div>
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={addAd} className="w-full">
        + Add Another Ad
      </Button>
    </div>
  );
}

export { emptyAd };
