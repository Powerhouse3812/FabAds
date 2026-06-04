import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MediaUploader } from "./MediaUploader";
import { AdStatusControl } from "./AdStatusControl";
import { AdSchedulePicker } from "./AdSchedulePicker";
import { FieldError } from "./FieldError";
import { toAdStatus } from "@/lib/ad-status";
import { valueToEntry, type AdScheduleEntry, type ScheduleValue } from "@/lib/ad-schedule";
import { cn } from "@/lib/utils";
import type { LaunchAd } from "@/hooks/use-launch-data";

const CTA_OPTIONS = ["Book Now", "Learn More", "Shop Now", "Sign Up", "Download", "Contact Us", "Get Offer", "Apply Now"];

interface AdEditPanelProps {
  ad: LaunchAd;
  launchId: string;
  /** Effective timezone of the launch's owning account (already resolved). */
  defaultTimezone: string;
  /** Current schedule for this ad (date/time/timezone), if any. */
  schedule?: ScheduleValue;
  /**
   * Persist. `scheduleEntry` is the resolved launch_config entry when status is
   * "scheduled" (null when status is not scheduled, so the caller can clear it).
   */
  onSave: (fields: Partial<LaunchAd>, scheduleEntry: AdScheduleEntry | null) => void;
  onCancel: () => void;
  saving?: boolean;
  /** Per-field validation errors keyed by `<field>-<adId>` (from validateStep3). */
  fieldErrors?: Record<string, string>;
}

export function AdEditPanel({ ad, launchId, defaultTimezone, schedule, onSave, onCancel, saving, fieldErrors = {} }: AdEditPanelProps) {
  const errClass = (key: string) => (fieldErrors[key] ? "border-destructive focus-visible:ring-destructive" : "");
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
  const [scheduleValue, setScheduleValue] = useState<ScheduleValue>(
    schedule ?? { timezone: defaultTimezone },
  );
  const [scheduleError, setScheduleError] = useState(false);

  const update = (k: string, v: any) => setFields((p) => ({ ...p, [k]: v }));

  const isScheduled = fields.status === "scheduled";

  const handleSave = () => {
    if (isScheduled) {
      const entry = valueToEntry(scheduleValue);
      if (!entry) {
        setScheduleError(true);
        return;
      }
      onSave(fields, entry);
    } else {
      onSave(fields, null);
    }
  };

  return (
    <div className="border border-border rounded-md p-4 bg-muted/30 space-y-4">
      <div data-field={`media-${ad.id}`} id={`media-${ad.id}`}>
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
        <FieldError error={fieldErrors[`media-${ad.id}`]} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5" data-field={`primary-text-${ad.id}`} id={`primary-text-${ad.id}`}>
          <Label className="text-xs">Primary Text *</Label>
          <Textarea value={fields.primary_text} onChange={(e) => update("primary_text", e.target.value)} rows={3} className={cn(errClass(`primary-text-${ad.id}`))} />
          <FieldError error={fieldErrors[`primary-text-${ad.id}`]} />
        </div>
        <div className="space-y-1.5" data-field={`headline-${ad.id}`} id={`headline-${ad.id}`}>
          <Label className="text-xs">Headline *</Label>
          <Input value={fields.headline} onChange={(e) => update("headline", e.target.value)} className={cn(errClass(`headline-${ad.id}`))} />
          <FieldError error={fieldErrors[`headline-${ad.id}`]} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Description</Label>
          <Input value={fields.description} onChange={(e) => update("description", e.target.value)} />
        </div>
        <div className="space-y-1.5" data-field={`cta-${ad.id}`} id={`cta-${ad.id}`}>
          <Label className="text-xs">CTA *</Label>
          <Select value={fields.cta} onValueChange={(v) => update("cta", v)}>
            <SelectTrigger className={cn(errClass(`cta-${ad.id}`))}><SelectValue placeholder="Select CTA" /></SelectTrigger>
            <SelectContent>{CTA_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <FieldError error={fieldErrors[`cta-${ad.id}`]} />
        </div>
        <div className="space-y-1.5" data-field={`destination-url-${ad.id}`} id={`destination-url-${ad.id}`}>
          <Label className="text-xs">Destination URL *</Label>
          <Input value={fields.destination_url} onChange={(e) => update("destination_url", e.target.value)} placeholder="https://" className={cn(errClass(`destination-url-${ad.id}`))} />
          <FieldError error={fieldErrors[`destination-url-${ad.id}`]} />
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
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs">Status</Label>
          <AdStatusControl
            value={toAdStatus(fields.status)}
            onChange={(s) => {
              update("status", s);
              if (s !== "scheduled") setScheduleError(false);
            }}
          />
        </div>

        {isScheduled && (
          <div className="col-span-2" data-field={`schedule-${ad.id}`} id={`schedule-${ad.id}`}>
            <AdSchedulePicker
              value={scheduleValue}
              defaultTimezone={defaultTimezone}
              onChange={(v) => {
                setScheduleValue(v);
                setScheduleError(false);
              }}
              showError={scheduleError || !!fieldErrors[`schedule-${ad.id}`]}
            />
            <FieldError error={fieldErrors[`schedule-${ad.id}`]} />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
      </div>
    </div>
  );
}
