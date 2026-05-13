import { CalendarDays, X } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const DATE_PRESETS = [
  { label: "Today", days: 1 },
  { label: "3 days", days: 3 },
  { label: "7 days", days: 7 },
  { label: "15 days", days: 15 },
  { label: "30 days", days: 30 },
] as const;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

interface InsightsV2IdentityRowProps {
  sectionLabel: string;
  adCount: number;
  brandsFollowed: number;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

/**
 * ROW 1 — Identity row. Foreplay-style page-identity band:
 *   [Section label]  [Ad count chip]   ........   [Date range picker]
 *
 * Sits ABOVE the toolbar. Always visible — does NOT collapse on scroll. The
 * row is short (py-2.5) and breathy. Search lives in Row 2 (Toolbar) now;
 * date picker lives here.
 */
export function InsightsV2IdentityRow({
  sectionLabel,
  adCount,
  brandsFollowed,
  dateRange,
  onDateRangeChange,
  className,
}: InsightsV2IdentityRowProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 gap-y-2 px-5 py-2.5 border-b border-border/40 bg-background",
        className,
      )}
    >
      {/* Left: section label + ad count chip + brands-followed chip */}
      <div className="flex items-center gap-2 min-w-0 flex-wrap">
        <span className="text-sm font-medium text-foreground truncate">
          {sectionLabel}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
          <span className="font-mono text-foreground font-semibold">
            {adCount.toLocaleString()}
          </span>{" "}
          ads
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
          <span className="font-mono text-foreground font-semibold">
            {brandsFollowed.toLocaleString()}
          </span>{" "}
          {brandsFollowed === 1 ? "brand followed" : "brands followed"}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1 min-w-[1rem]" />

      {/* Right: date range picker with merged quick presets + calendar.
          shrink-0 + min-w to ensure the trigger is always visible even at
          narrow viewports. */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 gap-1.5 text-[12px] font-normal shrink-0 min-w-[140px] justify-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              dateRange?.from && "bg-primary/5 border-primary/40 text-foreground",
            )}
            aria-label="Date range"
          >
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            {(() => {
              const r = dateRange;
              if (!r?.from)
                return <span className="text-muted-foreground">Date range</span>;
              const today = startOfDay(new Date());
              const from = startOfDay(r.from);
              const diffDays =
                Math.round((today.getTime() - from.getTime()) / 86400000) + 1;
              const matchedPreset = DATE_PRESETS.find(
                (p) =>
                  p.days === diffDays &&
                  r.to &&
                  startOfDay(r.to).getTime() === today.getTime(),
              );
              if (matchedPreset) {
                return (
                  <span>
                    {matchedPreset.label === "Today"
                      ? "Today"
                      : `Last ${matchedPreset.label}`}
                  </span>
                );
              }
              if (r.to) {
                return (
                  <span>
                    {format(r.from, "MMM d")} – {format(r.to, "MMM d")}
                  </span>
                );
              }
              return <span>{format(r.from, "MMM d, yyyy")}</span>;
            })()}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-0">
          {/* Selected range banner — explicit, always visible so the user can
              see at a glance which dates are bound. */}
          {dateRange?.from && (
            <div className="flex items-center gap-2 bg-muted/40 border-b border-border/60 px-3 py-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Selected
              </span>
              <span className="text-[12px] font-medium text-foreground">
                {format(dateRange.from, "MMM d, yyyy")}
                {dateRange.to && (
                  <>
                    {" — "}
                    {format(dateRange.to, "MMM d, yyyy")}
                  </>
                )}
              </span>
              {dateRange.to && (
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                  {Math.round(
                    (startOfDay(dateRange.to).getTime() -
                      startOfDay(dateRange.from).getTime()) /
                      86400000,
                  ) + 1}{" "}
                  days
                </span>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-border/60 p-3">
            {DATE_PRESETS.map((p) => {
              const r = dateRange;
              let active = false;
              if (r?.from && r?.to) {
                const today = startOfDay(new Date());
                const from = startOfDay(r.from);
                const diff =
                  Math.round((today.getTime() - from.getTime()) / 86400000) + 1;
                active =
                  diff === p.days &&
                  startOfDay(r.to).getTime() === today.getTime();
              }
              return (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => {
                    const to = startOfDay(new Date());
                    const from = new Date(to);
                    from.setDate(from.getDate() - (p.days - 1));
                    onDateRangeChange({ from, to });
                  }}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                    active
                      ? "bg-primary text-primary-foreground border-primary font-semibold"
                      : "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
                  )}
                  aria-pressed={active}
                >
                  {p.label === "Today" ? "Today" : `Last ${p.label}`}
                </button>
              );
            })}
            {dateRange?.from && (
              <button
                type="button"
                onClick={() => onDateRangeChange(undefined)}
                className="ml-auto inline-flex items-center gap-1 rounded-full px-2 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={(r) => onDateRangeChange(r ?? undefined)}
            defaultMonth={dateRange?.from ?? new Date()}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
