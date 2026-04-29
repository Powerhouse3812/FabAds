import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, History } from "lucide-react";
import { useState } from "react";
import { DUMMY_STRATEGY_CHANGE_LOG, type StrategyChangeLogEntry } from "./autopilot-dummy-data";

interface Props {
  strategyId: string;
}

export function StrategyChangeLog({ strategyId }: Props) {
  const [open, setOpen] = useState(false);
  const entries: StrategyChangeLogEntry[] = DUMMY_STRATEGY_CHANGE_LOG[strategyId] || [];

  if (entries.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border border-border">
      <CollapsibleTrigger className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/50 transition-colors">
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
        <History className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Change History</span>
        <Badge variant="secondary" className="text-[10px] px-1.5">{entries.length}</Badge>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="px-4 pb-3 space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 py-2 border-t border-border first:border-t-0">
              <div className="text-[10px] text-muted-foreground whitespace-nowrap pt-0.5">{entry.timestamp}</div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-xs text-foreground">
                  <span className="font-medium capitalize">{entry.field}</span>
                  {entry.oldValue !== "—" ? (
                    <>
                      {" "}changed from <span className="text-muted-foreground">{entry.oldValue}</span> → <span className="font-medium">{entry.newValue}</span>
                    </>
                  ) : (
                    <> — {entry.newValue}</>
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground">{entry.user}</p>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
