import { useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarDays, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

interface InsightsV2PageHeaderProps {
  sectionLabel: string;
  metaOnly: boolean;
  onMetaOnlyChange: (next: boolean) => void;
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function InsightsV2PageHeader({
  sectionLabel,
  metaOnly,
  onMetaOnlyChange,
  dateRange,
  onDateRangeChange,
  className,
}: InsightsV2PageHeaderProps) {
  const [open, setOpen] = useState(false);
  const hasDateRange = Boolean(dateRange?.from);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-1.5 border-b border-border/40",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">{sectionLabel}</span>
        <Toggle
          pressed={metaOnly}
          onPressedChange={onMetaOnlyChange}
          size="sm"
          aria-label="Show Meta ads only"
          className={cn(
            "h-6 rounded-full px-2.5 text-[11px] font-medium gap-1.5",
            metaOnly
              ? "bg-primary/15 text-primary border border-primary/40 hover:bg-primary/20 hover:text-primary data-[state=on]:bg-primary/15 data-[state=on]:text-primary"
              : "border border-border/60 text-muted-foreground hover:bg-muted",
          )}
        >
          <span
            className={cn(
              "inline-flex h-3 w-3 rounded-full",
              metaOnly ? "bg-primary" : "bg-muted-foreground/40",
            )}
            aria-hidden
          />
          <span>Meta only</span>
        </Toggle>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-7 gap-2 text-[12px] font-normal",
              hasDateRange ? "border-primary/40 text-foreground" : "text-muted-foreground",
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {dateRange?.from && dateRange.to ? (
              <span>
                {format(dateRange.from, "yyyy-MM-dd")} → {format(dateRange.to, "yyyy-MM-dd")}
              </span>
            ) : dateRange?.from ? (
              <span>{format(dateRange.from, "yyyy-MM-dd")}</span>
            ) : (
              <span className="text-muted-foreground">Date range</span>
            )}
            {hasDateRange && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear date range"
                onClick={(e) => {
                  e.stopPropagation();
                  onDateRangeChange(undefined);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onDateRangeChange(undefined);
                  }
                }}
                className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-sm hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-0">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={2}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
