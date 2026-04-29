import { Link } from "react-router-dom";
import { ArrowRight, Zap, Pause, RefreshCw, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AlertsSummary() {
  // Dummy event counts — would come from health events hook in production
  const events = [
    { label: "Rules Triggered", count: 24, icon: Zap, color: "text-chart-1" },
    { label: "Auto-Pauses", count: 8, icon: Pause, color: "text-amber-500" },
    { label: "Recovery Actions", count: 5, icon: RefreshCw, color: "text-emerald-500" },
    { label: "Failures", count: 2, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Alerts Summary</CardTitle>
        <p className="text-[10px] text-muted-foreground">Last 24 hours</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {events.map((e) => (
          <div key={e.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <e.icon className={`h-4 w-4 ${e.color}`} />
              <span className="text-sm text-muted-foreground">{e.label}</span>
            </div>
            <span className="text-sm font-semibold">{e.count}</span>
          </div>
        ))}
        <Link
          to="/activity-logs"
          className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 pt-1"
        >
          View Activity Logs <ArrowRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
