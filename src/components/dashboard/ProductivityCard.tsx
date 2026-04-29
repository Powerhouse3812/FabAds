import { Clock, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProductivityCard() {
  const stats = [
    { icon: Clock, label: "Time Saved", value: "97 hours", change: "+22%", isPositive: true },
    { icon: DollarSign, label: "Cost Saved", value: "$12,350", change: "+28%", isPositive: true },
  ];

  const overall = [
    { label: "Overall Time", value: "867 hours" },
    { label: "Overall Cost", value: "$98,320" },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Productivity & Time Saved</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
              <s.icon className="h-4 w-4 text-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold">{s.value}</span>
                <span className="text-xs text-emerald-500 font-medium">{s.change}</span>
              </div>
            </div>
          </div>
        ))}
        <div className="border-t border-border pt-3 grid grid-cols-2 gap-3">
          {overall.map((o) => (
            <div key={o.label}>
              <p className="text-[10px] text-muted-foreground">{o.label}</p>
              <p className="text-sm font-semibold">{o.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
