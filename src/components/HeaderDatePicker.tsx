import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from "date-fns";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DateRange = { from: Date; to: Date };

interface Preset {
  label: string;
  getValue: () => DateRange;
}

const PRESETS: Preset[] = [
  { label: "Today", getValue: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { label: "Yesterday", getValue: () => ({ from: startOfDay(subDays(new Date(), 1)), to: endOfDay(subDays(new Date(), 1)) }) },
  { label: "Last 7 Days", getValue: () => ({ from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) }) },
  { label: "Last 30 Days", getValue: () => ({ from: startOfDay(subDays(new Date(), 29)), to: endOfDay(new Date()) }) },
  { label: "This Month", getValue: () => ({ from: startOfMonth(new Date()), to: endOfDay(new Date()) }) },
  { label: "Last Month", getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
];

export function HeaderDatePicker() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"presets" | "custom">("presets");
  const [activePreset, setActivePreset] = useState("Last 30 Days");

  const dateRange = useMemo(() => {
    const from = searchParams.get("dateFrom");
    const to = searchParams.get("dateTo");
    if (from && to) return { from: new Date(from), to: new Date(to) };
    return PRESETS[3].getValue(); // Last 30 Days default
  }, [searchParams]);

  const [customFrom, setCustomFrom] = useState<Date | undefined>(dateRange.from);
  const [customTo, setCustomTo] = useState<Date | undefined>(dateRange.to);

  const applyRange = useCallback((range: DateRange, presetLabel?: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("dateFrom", range.from.toISOString().slice(0, 10));
    next.set("dateTo", range.to.toISOString().slice(0, 10));
    setSearchParams(next, { replace: true });
    if (presetLabel) setActivePreset(presetLabel);
    setOpen(false);
  }, [searchParams, setSearchParams]);

  const handlePreset = (preset: Preset) => {
    applyRange(preset.getValue(), preset.label);
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      applyRange({ from: customFrom, to: customTo }, "Custom");
    }
  };

  const displayLabel = activePreset === "Custom"
    ? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d, yyyy")}`
    : activePreset;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1.5 text-xs font-normal",
            !activePreset && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          {displayLabel}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end" sideOffset={8}>
        <div className="flex">
          {/* Presets sidebar */}
          <div className="border-r border-border p-2 space-y-0.5 min-w-[140px]">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                className={cn(
                  "w-full text-left text-xs px-3 py-1.5 rounded-md transition-colors",
                  activePreset === p.label
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
                onClick={() => {
                  handlePreset(p);
                  setMode("presets");
                }}
              >
                {p.label}
              </button>
            ))}
            <button
              className={cn(
                "w-full text-left text-xs px-3 py-1.5 rounded-md transition-colors",
                mode === "custom"
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
              onClick={() => setMode("custom")}
            >
              Custom Range
            </button>
          </div>

          {/* Calendar area */}
          {mode === "custom" && (
            <div className="p-3 space-y-3">
              <div className="flex gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">From</span>
                  <Calendar
                    mode="single"
                    selected={customFrom}
                    onSelect={setCustomFrom}
                    className="p-0 pointer-events-auto"
                    disabled={(date) => date > new Date()}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">To</span>
                  <Calendar
                    mode="single"
                    selected={customTo}
                    onSelect={setCustomTo}
                    className="p-0 pointer-events-auto"
                    disabled={(date) => date > new Date() || (customFrom ? date < customFrom : false)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setMode("presets")}>
                  Cancel
                </Button>
                <Button size="sm" className="h-7 text-xs" onClick={handleCustomApply} disabled={!customFrom || !customTo}>
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
