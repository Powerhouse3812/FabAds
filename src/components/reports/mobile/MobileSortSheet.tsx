import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { METRIC_COLUMNS } from "@/lib/reports-dummy-data";

// ── Mobile Reports sort + metric picker ───────────────────────────────
// Card rows have room for 3 metrics; the desktop table can show all of
// METRIC_COLUMNS at once so it never needed this. On mobile, "sort by" is a
// radio list in a sheet rather than inline chips — METRIC_COLUMNS currently
// has 8 entries, and 8 inline options is exactly the kind of choice overload
// Hick's law warns about. A sheet also leaves room for direction and the
// third-metric picker without the row itself getting crowded.

export type SortDirection = "asc" | "desc";

export interface MobileSortSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sortColumn: string;
  onSortColumnChange: (v: string) => void;
  sortDirection: SortDirection;
  onSortDirectionChange: (v: SortDirection) => void;
  /** Which metric occupies the 3rd metric slot on each mobile card. */
  thirdMetricKey: string;
  onThirdMetricKeyChange: (v: string) => void;
}

/**
 * Pure helper so a parent's trigger button can show current sort state
 * (e.g. "Spend ↓") without duplicating the METRIC_COLUMNS lookup.
 */
export function getMobileSortTriggerLabel(sortColumn: string, sortDirection: SortDirection): string {
  const col = METRIC_COLUMNS.find((c) => c.key === sortColumn);
  const label = col?.label ?? sortColumn;
  return `${label} ${sortDirection === "desc" ? "↓" : "↑"}`;
}

const DIRECTIONS: { value: SortDirection; label: string }[] = [
  { value: "desc", label: "Highest first" },
  { value: "asc", label: "Lowest first" },
];

function MetricRadioList({
  namePrefix,
  value,
  onValueChange,
}: {
  namePrefix: string;
  value: string;
  onValueChange: (v: string) => void;
}) {
  return (
    <RadioGroup value={value} onValueChange={onValueChange} className="gap-0.5">
      {METRIC_COLUMNS.map((col) => (
        <div key={col.key} className="flex min-h-11 items-center gap-3 rounded-md px-1">
          <RadioGroupItem value={col.key} id={`${namePrefix}-${col.key}`} />
          <Label htmlFor={`${namePrefix}-${col.key}`} className="flex-1 cursor-pointer font-normal">
            {col.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}

export function MobileSortSheet({
  open,
  onOpenChange,
  sortColumn,
  onSortColumnChange,
  sortDirection,
  onSortDirectionChange,
  thirdMetricKey,
  onThirdMetricKeyChange,
}: MobileSortSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* Built-in X suppressed — the footer's explicit Done/Close is the single
          close control. */}
      <SheetContent side="bottom" className="flex max-h-[85vh] flex-col gap-0 p-0 [&>button]:hidden">
        <SheetHeader className="border-b border-border px-4 py-3 text-left">
          <SheetTitle>Sort &amp; metrics</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
          <div>
            <h3 className="mb-2 text-sm font-medium text-foreground">Direction</h3>
            <RadioGroup
              value={sortDirection}
              onValueChange={(v) => onSortDirectionChange(v as SortDirection)}
              className="grid grid-cols-2 gap-2"
            >
              {DIRECTIONS.map((d) => (
                <label
                  key={d.value}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 text-sm transition-colors",
                    sortDirection === d.value
                      // Active state carries weight + border, not just fill colour.
                      ? "border-primary bg-primary/10 font-semibold text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  <RadioGroupItem value={d.value} className="sr-only" />
                  {d.label}
                </label>
              ))}
            </RadioGroup>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-foreground">Sort by</h3>
            <MetricRadioList namePrefix="sort" value={sortColumn} onValueChange={onSortColumnChange} />
          </div>

          <div>
            <h3 className="mb-1 text-sm font-medium text-foreground">Third metric</h3>
            <p className="mb-2 text-xs text-muted-foreground">
              Pick which metric fills the third slot on each card, so a margin-focused read isn't
              stuck with whatever ships as the default.
            </p>
            <MetricRadioList namePrefix="third" value={thirdMetricKey} onValueChange={onThirdMetricKeyChange} />
          </div>
        </div>

        <SheetFooter className="border-t border-border px-4 py-3 sm:justify-stretch">
          <SheetClose asChild>
            <Button className="min-h-11 w-full">Done</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
