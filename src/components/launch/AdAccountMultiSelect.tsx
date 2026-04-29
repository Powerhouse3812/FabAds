import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown, X } from "lucide-react";
import type { FbAdAccount, FbBusinessManager } from "@/hooks/use-fb-connection";

interface Props {
  adAccounts: FbAdAccount[];
  businessManagers: FbBusinessManager[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

const MAX_VISIBLE_CHIPS = 2;

export function AdAccountMultiSelect({ adAccounts, businessManagers, selectedIds, onChange }: Props) {
  const bmMap = Object.fromEntries(businessManagers.map((bm) => [bm.id, bm.name]));

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((s) => s !== id)
        : [...selectedIds, id]
    );
  };

  const removeChip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter((s) => s !== id));
  };

  const visibleChips = selectedIds.slice(0, MAX_VISIBLE_CHIPS);
  const overflowCount = selectedIds.length - MAX_VISIBLE_CHIPS;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between h-auto min-h-10 py-2">
          <span className="flex flex-wrap items-center gap-1.5">
            {selectedIds.length === 0 && (
              <span className="text-muted-foreground">Select ad accounts...</span>
            )}
            {visibleChips.map((id) => {
              const acc = adAccounts.find((a) => a.id === id);
              return acc ? (
                <Badge key={id} variant="secondary" className="text-xs gap-1 pr-1">
                  {acc.name}
                  <button
                    type="button"
                    className="ml-0.5 hover:text-destructive"
                    onClick={(e) => removeChip(id, e)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null;
            })}
            {overflowCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                +{overflowCount} more...
              </Badge>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-2 max-h-60 overflow-y-auto" align="start">
        {adAccounts.length === 0 ? (
          <p className="text-sm text-muted-foreground p-2">No ad accounts found. Connect Facebook first.</p>
        ) : (
          adAccounts.map((acc) => (
            <label
              key={acc.id}
              className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer"
            >
              <Checkbox
                checked={selectedIds.includes(acc.id)}
                onCheckedChange={() => toggle(acc.id)}
              />
              <div className="text-sm">
                <span className="font-medium">{acc.name}</span>
                {acc.fb_business_manager_id && bmMap[acc.fb_business_manager_id] && (
                  <span className="text-muted-foreground ml-1.5">
                    · {bmMap[acc.fb_business_manager_id]}
                  </span>
                )}
              </div>
            </label>
          ))
        )}
      </PopoverContent>
    </Popover>
  );
}
