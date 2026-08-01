/**
 * Creative Report 2.0 — advanced-filter popover.
 * Lists the module's 6 advanced-filter groups (geo/device/objective/age/
 * gender/placement); drilling into a group shows its options as checkable
 * rows. Selections write straight to the URL — no apply button.
 */
import * as React from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ADVANCED_FILTERS, AdvancedFilterDef, P } from "@/creative-report-v2/lib/paramSchema";
import { useReportParams } from "@/creative-report-v2/hooks/useReportParams";

export function AddFilterPopover() {
  const { filters, toggleCsvValue } = useReportParams();
  const [open, setOpen] = React.useState(false);
  const [activeGroup, setActiveGroup] = React.useState<AdvancedFilterDef | null>(null);

  const valuesFor = (key: string): string[] =>
    (filters as unknown as Record<string, string[]>)[key] ?? [];

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setActiveGroup(null);
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-[13px] font-medium">
          <Plus className="h-4 w-4" />
          Add filter
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <Command>
          {activeGroup ? (
            <>
              <button
                type="button"
                onClick={() => setActiveGroup(null)}
                className="flex w-full items-center gap-1 border-b border-border px-2 py-1.5 text-[13px] text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
                {activeGroup.label}
              </button>
              <CommandList>
                <CommandEmpty>No options.</CommandEmpty>
                <CommandGroup>
                  {activeGroup.options.map((option) => {
                    const selected = valuesFor(activeGroup.key).includes(option);
                    return (
                      <CommandItem
                        key={option}
                        onSelect={() =>
                          toggleCsvValue(P[activeGroup.key as keyof typeof P], option)
                        }
                        className="gap-2"
                      >
                        <Checkbox checked={selected} className="pointer-events-none" />
                        <span className="text-[13px]">{option}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </>
          ) : (
            <CommandList>
              <CommandGroup heading="Advanced filters">
                {ADVANCED_FILTERS.map((def) => {
                  const count = valuesFor(def.key).length;
                  return (
                    <CommandItem
                      key={def.key}
                      onSelect={() => setActiveGroup(def)}
                      className="justify-between"
                    >
                      <span className="text-[13px]">{def.label}</span>
                      <span className="flex items-center gap-1">
                        {count > 0 && (
                          <span className="text-[13px] text-primary-text">{count}</span>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
