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
import { useIsMobile } from "@/hooks/use-mobile";

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

interface DateRangeWithPresetsProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  /** Trigger height — defaults to h-9 (IdentityRow), can be h-8 (Toolbar). */
  size?: "sm" | "md";
  /**
   * Optional controlled popover state. When both `open` and `onOpenChange`
   * are supplied, the Popover runs in controlled mode so the parent can
   * URL-back the open/close — e.g. `?calendar=open` so copy/paste of the
   * URL while the popover is open reconstructs that state. When omitted,
   * the Popover stays uncontrolled (Radix manages its own state).
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Collapse to a 44px icon-only square below `md`. See note in the body. */
  iconOnly?: boolean;
}

/**
 * Date-range picker with quick presets (Today / 3d / 7d / 15d / 30d) merged
 * into the popover. Used in Row 1 IdentityRow at h-9 and in Row 2 Toolbar
 * at h-8 when scrolled. Optional controlled `open`/`onOpenChange` so the
 * parent can URL-back the open/closed state.
 */
export function DateRangeWithPresets({
  value,
  onChange,
  size = "md",
  open,
  onOpenChange,
  iconOnly = false,
}: DateRangeWithPresetsProps) {
  const triggerHeight = size === "sm" ? "h-8" : "h-9";
  /**
   * `iconOnly` collapses the trigger to a 44px square showing just the calendar
   * glyph. Used by the mobile Insights toolbar, which puts date + search +
   * filters + sort + settings on ONE row — the range text does not fit at
   * 375px. The selected range stays available to assistive tech via the
   * trigger's aria-label, and the "range is set" state is still signalled
   * visually by the primary-tinted border (see `value?.from &&` below).
   */
  // Two-up month calendar (numberOfMonths=2) is wider than a 375px viewport.
  // Single month below `md`, restored to 2 at `md`+ — matches the app's
  // mobile breakpoint (see MOBILE_BREAKPOINT in use-mobile.tsx).
  const isMobile = useIsMobile();

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-1.5 text-[12px] font-normal shrink-0",
            // NOTE: no template interpolation in these class strings —
            // Tailwind's JIT scans source text, so a dynamic `md:${...}`
            // never gets generated. Literals only.
            iconOnly
              // 44px square below md (WCAG 2.5.5); full labelled trigger at md+.
              ? cn(
                  "h-11 w-11 justify-center p-0 md:w-auto md:justify-start md:px-3 md:min-w-[140px]",
                  size === "sm" ? "md:h-8" : "md:h-9",
                )
              : cn(triggerHeight, "min-w-[140px] justify-start"),
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
            value?.from && "bg-primary/5 border-primary/40 text-foreground",
          )}
          aria-label={`Date range${value?.from ? " — a range is applied" : ": all-time"}`}
        >
          <CalendarDays className={cn("text-muted-foreground", iconOnly ? "h-[18px] w-[18px] md:h-3.5 md:w-3.5" : "h-3.5 w-3.5")} />
          <span className={cn(iconOnly && "sr-only md:not-sr-only")}>{(() => {
            const r = value;
            // Empty state: explicitly label "All-time" so the user knows
            // they're seeing the full window. Maalik's spec — never let
            // the trigger feel ambiguous or "broken" when no range is
            // picked. The data layer already short-circuits the filter
            // when r?.from is falsy (see InsightsV2Feed line 174).
            if (!r?.from)
              return <span className="text-muted-foreground">All-time</span>;
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
          })()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto max-w-[calc(100vw-1.5rem)] p-0">
        {value?.from && (
          <div className="flex items-center gap-2 bg-muted/40 border-b border-border/60 px-3 py-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Selected
            </span>
            <span className="text-[12px] font-medium text-foreground">
              {format(value.from, "MMM d, yyyy")}
              {value.to && (
                <>
                  {" — "}
                  {format(value.to, "MMM d, yyyy")}
                </>
              )}
            </span>
            {value.to && (
              <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                {Math.round(
                  (startOfDay(value.to).getTime() -
                    startOfDay(value.from).getTime()) /
                    86400000,
                ) + 1}{" "}
                days
              </span>
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border/60 p-3">
          {/* "All-time" preset — explicit way to clear the filter to the
              full window. Sits first so it reads as the baseline before
              the user narrows. Active when no range is set (mirrors the
              trigger placeholder). */}
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              !value?.from
                ? "bg-primary text-primary-foreground border-primary font-semibold"
                : "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
            )}
            aria-pressed={!value?.from}
          >
            All-time
          </button>
          {DATE_PRESETS.map((p) => {
            const r = value;
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
                  onChange({ from, to });
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
          {value?.from && (
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="ml-auto inline-flex items-center gap-1 rounded-full px-2 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
        <Calendar
          mode="range"
          selected={value}
          onSelect={(r) => onChange(r ?? undefined)}
          defaultMonth={value?.from ?? new Date()}
          numberOfMonths={isMobile ? 1 : 2}
        />
      </PopoverContent>
    </Popover>
  );
}
