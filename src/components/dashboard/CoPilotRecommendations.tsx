import { Lightbulb, TrendingUp, Target, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const RECOMMENDATIONS = [
  { icon: TrendingUp, title: "Optimize performance", desc: "3 campaigns below ROAS target", badge: "High" },
  { icon: Target, title: "Adjust strategy", desc: "Budget reallocation suggested", badge: "Medium" },
  { icon: Lightbulb, title: "CPVs low", desc: "Consider increasing bids on 2 ad sets", badge: "Low" },
  { icon: Users, title: "Audience targeting", desc: "Expand lookalike audiences", badge: "Medium" },
];

export function CoPilotRecommendations() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Co-Pilot Recommendations</CardTitle>
          <Badge variant="secondary" className="text-[10px]">06 New</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {RECOMMENDATIONS.map((rec) => (
          <div key={rec.title} className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
            <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <rec.icon className="h-4 w-4 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{rec.title}</p>
                <Badge
                  variant={rec.badge === "High" ? "destructive" : "outline"}
                  className="text-[9px] px-1.5"
                >
                  {rec.badge}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{rec.desc}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
