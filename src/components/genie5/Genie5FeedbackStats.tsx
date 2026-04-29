import { ThumbsUp, ThumbsDown, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useFeedbackStats } from "@/hooks/use-genie-feedback";
import { cn } from "@/lib/utils";

export function Genie5FeedbackStats() {
  const { data: stats = [], isLoading } = useFeedbackStats();

  if (isLoading || stats.length === 0) return null;

  const totalLikes = stats.reduce((s, r) => s + r.likes, 0);
  const totalDislikes = stats.reduce((s, r) => s + r.dislikes, 0);

  return (
    <Collapsible defaultOpen={false}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group">
        <BarChart3 className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium text-foreground">Feedback Summary</span>
        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
          {totalLikes + totalDislikes} total
        </Badge>
        <span className="text-[10px] text-muted-foreground ml-auto group-data-[state=open]:hidden">Show ▸</span>
        <span className="text-[10px] text-muted-foreground ml-auto group-data-[state=closed]:hidden">Hide ▾</span>
      </CollapsibleTrigger>

      <CollapsibleContent className="pt-2">
        <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
          {stats.map((s) => {
            const total = s.likes + s.dislikes;
            const pctLike = total > 0 ? Math.round((s.likes / total) * 100) : 0;
            return (
              <div key={s.strategy_angle} className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-foreground w-28 truncate" title={s.strategy_angle}>
                  {s.strategy_angle}
                </span>
                <div className="flex-1 h-3 rounded-full bg-muted/60 overflow-hidden relative">
                  <div
                    className="h-full rounded-full bg-primary/70 transition-all"
                    style={{ width: `${pctLike}%` }}
                  />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] min-w-[70px] justify-end">
                  <span className={cn("flex items-center gap-0.5", s.likes > 0 && "text-primary")}>
                    <ThumbsUp className="h-2.5 w-2.5" /> {s.likes}
                  </span>
                  <span className={cn("flex items-center gap-0.5", s.dislikes > 0 && "text-destructive")}>
                    <ThumbsDown className="h-2.5 w-2.5" /> {s.dislikes}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
