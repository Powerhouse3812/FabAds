import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Check, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCategoryWinners, type CategoryWinner } from "@/hooks/use-category-winners";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Props {
  categoryId: string | null;
  selectedWinnerIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
}

export function Genie5WinnersSection({ categoryId, selectedWinnerIds, onSelectionChange }: Props) {
  const { data: winners = [] } = useCategoryWinners(categoryId);
  const [open, setOpen] = useState(false);

  // Auto-open and select all when category changes and winners load
  useEffect(() => {
    if (winners.length > 0 && selectedWinnerIds.size === 0) {
      setOpen(true);
      onSelectionChange(new Set(winners.map((w) => w.id)));
    }
    if (winners.length === 0) {
      setOpen(false);
      onSelectionChange(new Set());
    }
  }, [winners.length, categoryId]);

  const handleToggleAll = (checked: boolean) => {
    if (checked && winners.length > 0) {
      onSelectionChange(new Set(winners.map((w) => w.id)));
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleDeselect = (id: string) => {
    const next = new Set(selectedWinnerIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  if (!categoryId) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="animate-in fade-in-0 slide-in-from-top-2 duration-200">
      <CollapsibleTrigger className="flex w-full items-center gap-2 py-1.5 group cursor-pointer">
        <ChevronDown className={cn(
          "h-3.5 w-3.5 text-muted-foreground/70 transition-transform duration-200 shrink-0",
          open && "rotate-180"
        )} />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Winner Ads
        </span>
        {winners.length > 0 ? (
          <>
            <Checkbox
              id="include-winners"
              checked={selectedWinnerIds.size > 0}
              onCheckedChange={(v) => { handleToggleAll(!!v); }}
              onClick={(e) => e.stopPropagation()}
              className="h-3.5 w-3.5"
            />
            {selectedWinnerIds.size > 0 && (
              <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                {selectedWinnerIds.size} selected
              </Badge>
            )}
          </>
        ) : (
          <span className="text-[10px] text-muted-foreground">No winners saved</span>
        )}
      </CollapsibleTrigger>

      <CollapsibleContent className="animate-in fade-in-0 slide-in-from-top-1 duration-200">
        {winners.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 pt-2 scrollbar-thin">
            {winners.map((w) => {
              const selected = selectedWinnerIds.has(w.id);
              return (
                <button
                  key={w.id}
                  onClick={() => handleDeselect(w.id)}
                  className={cn(
                    "relative shrink-0 rounded-lg overflow-hidden transition-all group",
                    "h-16 w-16",
                    selected
                      ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                      : "opacity-40 border border-border/50"
                  )}
                >
                  <img
                    src={w.image_url}
                    alt="Winner ad"
                    className="h-full w-full object-cover"
                  />
                  {selected && (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                      <div className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                  {!selected && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
