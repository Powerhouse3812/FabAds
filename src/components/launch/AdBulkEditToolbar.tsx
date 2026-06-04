import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, CalendarClock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AdBulkEditDialog } from "./AdBulkEditDialog";
import { AdSchedulePicker } from "./AdSchedulePicker";
import { valueToEntry, type AdScheduleEntry, type ScheduleValue } from "@/lib/ad-schedule";
import type { LaunchAd } from "@/hooks/use-launch-data";

interface AdBulkEditToolbarProps {
  selectedCount: number;
  ads: LaunchAd[];
  /** Effective timezone of the launch's owning account (already resolved). */
  defaultTimezone: string;
  onApply: (fields: Record<string, any>) => void;
  /**
   * Apply a schedule to all selected ads: sets status="scheduled" on each (via
   * the normal bulk-update path) and writes the launch_config.adSchedules entry
   * per ad id. The parent owns both persistence calls.
   */
  onSchedule?: (adIds: string[], entry: AdScheduleEntry) => void;
  onDuplicate?: (adId: string) => void;
  onDelete?: (adId: string) => void;
  onAddAd?: () => void;
  onClear?: () => void;
  applying?: boolean;
}

export function AdBulkEditToolbar({
  selectedCount,
  ads,
  defaultTimezone,
  onApply,
  onSchedule,
  onDuplicate,
  onDelete,
  onAddAd,
  onClear,
  applying,
}: AdBulkEditToolbarProps) {
  const [open, setOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleValue, setScheduleValue] = useState<ScheduleValue>({ timezone: defaultTimezone });
  const [scheduleError, setScheduleError] = useState(false);

  const applySchedule = () => {
    const entry = valueToEntry(scheduleValue);
    if (!entry) {
      setScheduleError(true);
      return;
    }
    onSchedule?.(ads.map((a) => a.id), entry);
    setScheduleOpen(false);
    setScheduleValue({ timezone: defaultTimezone });
    setScheduleError(false);
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-muted rounded-md border border-border">
      <span className="text-sm font-medium">{selectedCount} ad(s) selected</span>
      <Button size="sm" onClick={() => setOpen(true)}>Bulk Edit</Button>
      {onSchedule && (
        <Button size="sm" variant="outline" onClick={() => setScheduleOpen(true)}>
          <CalendarClock className="h-4 w-4 mr-1.5" />
          Schedule
        </Button>
      )}
      {onClear && (
        <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      )}

      <AdBulkEditDialog
        open={open}
        onOpenChange={setOpen}
        ads={ads}
        onApply={onApply}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onAddAd={onAddAd}
        applying={applying}
      />

      {/* Bulk schedule */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule {selectedCount} ad(s)</DialogTitle>
            <DialogDescription>
              Sets status to Scheduled and applies this date, time, and timezone to all selected ads.
            </DialogDescription>
          </DialogHeader>
          <AdSchedulePicker
            value={scheduleValue}
            defaultTimezone={defaultTimezone}
            onChange={(v) => {
              setScheduleValue(v);
              setScheduleError(false);
            }}
            showError={scheduleError}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button onClick={applySchedule}>Apply schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
