/**
 * CardMetricPicker — flat "pick up to 6" checkbox list controlling which
 * metrics show on the grid's CreativeCard stat row. Grid-layout counterpart
 * to ColumnPickerPopover (table layout) — no preset system here, just a
 * direct toggle against the card-metrics store.
 */
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COLUMN_DEFS } from "@/creative-report-v2/lib/columns";
import { MAX_CARD_METRICS, useCardMetrics } from "@/creative-report-v2/lib/cardMetrics";

export function CardMetricPicker() {
  const { active, toggle } = useCardMetrics();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[13px]">
          Card metrics ({active.length}/{MAX_CARD_METRICS})
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3">
        <div className="space-y-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Metrics on card ({active.length}/{MAX_CARD_METRICS})
          </span>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {COLUMN_DEFS.map((c) => (
              <label key={c.key} className="flex items-center gap-2 text-[13px] text-foreground">
                <Checkbox checked={active.includes(c.key)} onCheckedChange={() => toggle(c.key)} />
                {c.label}
              </label>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
