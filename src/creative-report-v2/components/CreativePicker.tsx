/**
 * CreativePicker — searchable popover for adding a creative to Compare.
 * Search over name + product; excludes already-selected ids; disabled at the
 * 4-creative cap (handoff §5.4).
 */
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CreativeThumb } from "@/creative-report-v2/components/CreativeThumb";
import { BucketChip } from "@/creative-report-v2/components/BucketChip";
import { truncate, NAME_MAX } from "@/creative-report-v2/lib/format";
import type { CreativeRollup } from "@/creative-report-v2/lib/selectors";

export function CreativePicker({
  rollups,
  selectedIds,
  onAdd,
  disabled,
}: {
  rollups: CreativeRollup[];
  selectedIds: string[];
  onAdd: (id: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const available = rollups.filter((r) => !selectedIds.includes(r.creative.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-[13px] font-medium"
          disabled={disabled}
        >
          <Plus className="h-4 w-4" />
          Add creative
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <Command>
          <CommandInput placeholder="Search creatives or products…" />
          <CommandList>
            <CommandEmpty>No creatives match.</CommandEmpty>
            {available.map((r) => {
              const { text } = truncate(r.creative.name, NAME_MAX);
              return (
                <CommandItem
                  key={r.creative.id}
                  value={`${r.creative.name} ${r.creative.product}`}
                  onSelect={() => {
                    onAdd(r.creative.id);
                    setOpen(false);
                  }}
                  className="gap-2"
                >
                  <CreativeThumb creative={r.creative} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-foreground">
                      {text}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.creative.product}
                    </p>
                  </div>
                  {r.bucket && <BucketChip bucket={r.bucket} size="xs" />}
                </CommandItem>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
