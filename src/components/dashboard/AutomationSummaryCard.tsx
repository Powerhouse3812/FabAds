import { Bot, Zap, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function AutomationSummaryCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Automation Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
            <Bot className="h-4 w-4 text-foreground" />
          </div>
          <div>
            <p className="text-xl font-bold">388</p>
            <p className="text-xs text-muted-foreground">Active Rules</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Meta Ratio</span>
            <span className="font-medium">00:05</span>
          </div>
          <Progress value={35} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-chart-1" />
            <div>
              <p className="text-sm font-bold">2,372</p>
              <p className="text-[10px] text-muted-foreground">Executions today</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-chart-2" />
            <div>
              <p className="text-sm font-bold">97</p>
              <p className="text-[10px] text-muted-foreground">Actions taken</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
