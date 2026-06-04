import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TIMEZONES } from "@/lib/timezones";
import { formatSchedulePreview, type ScheduleValue } from "@/lib/ad-schedule";

interface AdSchedulePickerProps {
  value: ScheduleValue;
  /** Effective timezone of the owning ad account (already resolved). */
  defaultTimezone: string;
  onChange: (value: ScheduleValue) => void;
  /** Surface the "date + time required" inline error (e.g. after a save attempt). */
  showError?: boolean;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function AdSchedulePicker({ value, defaultTimezone, onChange, showError }: AdSchedulePickerProps) {
  const [calOpen, setCalOpen] = useState(false);

  const tz = value.timezone || defaultTimezone;
  const selectedDate = value.date ? new Date(`${value.date}T00:00:00`) : undefined;
  const preview = formatSchedulePreview({ ...value, timezone: tz });
  const incomplete = !value.date || !value.time;

  return (
    <div className="space-y-3 rounded-md border border-border bg-background p-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Date */}
        <div className="space-y-1.5">
          <Label className="text-xs">
            Date <span className="text-destructive">*</span>
          </Label>
          <Popover open={calOpen} onOpenChange={setCalOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-9 w-full justify-start gap-2 text-left text-sm font-normal",
                  !value.date && "text-muted-foreground",
                  showError && !value.date && "border-destructive",
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                {selectedDate ? format(selectedDate, "d MMM yyyy") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => {
                  if (d) onChange({ ...value, timezone: tz, date: format(d, "yyyy-MM-dd") });
                  setCalOpen(false);
                }}
                disabled={(date) => date < startOfToday()}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time */}
        <div className="space-y-1.5">
          <Label className="text-xs">
            Time <span className="text-destructive">*</span>
          </Label>
          <Input
            type="time"
            value={value.time || ""}
            onChange={(e) => onChange({ ...value, timezone: tz, time: e.target.value || undefined })}
            className={cn("h-9 text-sm", showError && !value.time && "border-destructive")}
          />
        </div>
      </div>

      {/* Timezone */}
      <div className="space-y-1.5">
        <Label className="text-xs">Timezone</Label>
        <Select value={tz} onValueChange={(v) => onChange({ ...value, timezone: v })}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Preview / inline validation */}
      {preview ? (
        <p className="text-xs text-muted-foreground">{preview}</p>
      ) : showError && incomplete ? (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          Pick both a date and a time to schedule this ad.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Pick a date and time to schedule.</p>
      )}
    </div>
  );
}
