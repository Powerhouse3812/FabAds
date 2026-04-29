import { Link } from "react-router-dom";
import { ArrowRight, Shield, Rocket, Plug, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const LOG_ENTRIES = [
  { type: "RRM", icon: Shield, text: "Auto-pause triggered on Acme Corp US", time: "10 min ago", variant: "destructive" as const },
  { type: "Launch", icon: Rocket, text: "Campaign 'Summer Sale Q2' launched successfully", time: "1h ago", variant: "default" as const },
  { type: "Integration", icon: Plug, text: "Facebook sync completed - 5 accounts updated", time: "2h ago", variant: "secondary" as const },
  { type: "Rule", icon: Zap, text: "Budget rule executed: increased spend by 15%", time: "3h ago", variant: "outline" as const },
  { type: "RRM", icon: Shield, text: "Recovery action completed for BrandX Global", time: "5h ago", variant: "default" as const },
];

export function ActivityLogsWidget() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Activity Logs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[320px] overflow-y-auto">
        {LOG_ENTRIES.map((entry, i) => (
          <div key={i} className="flex items-start gap-2 py-1.5">
            <entry.icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Badge variant={entry.variant} className="text-[9px] px-1.5 py-0">{entry.type}</Badge>
                <span className="text-[10px] text-muted-foreground">{entry.time}</span>
              </div>
              <p className="text-xs mt-0.5">{entry.text}</p>
            </div>
          </div>
        ))}
        <Link
          to="/activity-logs"
          className="text-xs font-medium text-foreground hover:underline inline-flex items-center gap-1 pt-1"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
