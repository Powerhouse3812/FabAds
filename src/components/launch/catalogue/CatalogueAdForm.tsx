import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldError } from "@/components/launch/FieldError";
import { Info } from "lucide-react";
import type { LaunchAd } from "@/hooks/use-launch-data";

const CTA_OPTIONS = ["Learn more", "Shop now", "Sign up", "Book now", "Download", "Get offer", "Contact us"];

interface Props {
  ad: LaunchAd;
  onFieldChange: (field: string, value: any) => void;
  fieldErrors: Record<string, string>;
}

export function CatalogueAdForm({ ad, onFieldChange, fieldErrors }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md border border-border bg-muted/20 px-3 py-2">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">Product media is managed by your catalogue. Only text fields and CTA can be edited here.</p>
      </div>

      <div className="space-y-1" data-field="primary_text" id="primary_text">
        <Label className="text-xs">Primary Text <span className="text-destructive">*</span></Label>
        <Textarea
          className={`text-xs min-h-[60px] ${fieldErrors.primary_text ? "border-destructive" : ""}`}
          placeholder="Enter primary text..."
          value={ad.primary_text || ""}
          onChange={(e) => onFieldChange("primary_text", e.target.value)}
        />
        <FieldError error={fieldErrors.primary_text} />
      </div>

      <div className="space-y-1" data-field="headline" id="headline">
        <Label className="text-xs">Headline <span className="text-destructive">*</span></Label>
        <Input
          className={`h-8 text-xs ${fieldErrors.headline ? "border-destructive" : ""}`}
          placeholder="Enter headline..."
          value={ad.headline || ""}
          onChange={(e) => onFieldChange("headline", e.target.value)}
        />
        <FieldError error={fieldErrors.headline} />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Description</Label>
        <Input className="h-8 text-xs" placeholder="Optional description..." value={ad.description || ""} onChange={(e) => onFieldChange("description", e.target.value)} />
      </div>

      <div className="space-y-1" data-field="cta" id="cta">
        <Label className="text-xs">CTA <span className="text-destructive">*</span></Label>
        <Select value={ad.cta || ""} onValueChange={(v) => onFieldChange("cta", v)}>
          <SelectTrigger className={`h-8 text-xs ${fieldErrors.cta ? "border-destructive" : ""}`}>
            <SelectValue placeholder="Select CTA" />
          </SelectTrigger>
          <SelectContent>{CTA_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <FieldError error={fieldErrors.cta} />
      </div>

      <div className="space-y-1" data-field="destination_url" id="destination_url">
        <Label className="text-xs">Destination URL <span className="text-destructive">*</span></Label>
        <Input
          className={`h-8 text-xs ${fieldErrors.destination_url ? "border-destructive" : ""}`}
          placeholder="https://example.com/product"
          value={ad.destination_url || ""}
          onChange={(e) => onFieldChange("destination_url", e.target.value)}
        />
        <FieldError error={fieldErrors.destination_url} />
      </div>
    </div>
  );
}
