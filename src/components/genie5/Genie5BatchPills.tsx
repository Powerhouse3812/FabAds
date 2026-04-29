import { Badge } from "@/components/ui/badge";
import { Loader2, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Batch } from "./genie5-batch-types";

interface Props {
  batches: Batch[];
  activeBatchId: string | null;
  onSelectBatch: (id: string) => void;
}

export function Genie5BatchPills({ batches, activeBatchId, onSelectBatch }: Props) {
  if (batches.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide px-3 py-2 border-b border-border/40">
      {batches.map((batch) => {
        const completed = batch.results.filter(r => r.status === "completed").length;
        const isActive = activeBatchId === batch.id;

        return (
          <button
            key={batch.id}
            onClick={() => onSelectBatch(batch.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all duration-200 whitespace-nowrap shrink-0",
              isActive
                ? "bg-primary/10 text-primary border border-primary/30 shadow-sm"
                : "bg-muted/40 text-muted-foreground border border-border/50 hover:bg-muted/60 hover:text-foreground"
            )}
          >
            {batch.status === "generating" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : batch.status === "partial" ? (
              <AlertTriangle className="h-3 w-3 text-amber-500" />
            ) : (
              <Check className="h-3 w-3 text-emerald-500" />
            )}
            <span>{completed}/{batch.totalExpected}</span>
            <span className="text-muted-foreground">·</span>
            <span className="truncate max-w-[100px]">{batch.strategy}</span>
          </button>
        );
      })}
    </div>
  );
}
