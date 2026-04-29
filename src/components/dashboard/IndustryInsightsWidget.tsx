import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Eye, Globe, Sparkles, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const FEED_ITEMS = [
  { icon: Sparkles, text: "3 new winning ads detected in Beauty category", time: "2h ago" },
  { icon: TrendingUp, text: "Competitor 'BrandX' increased spend by 40%", time: "5h ago" },
  { icon: Globe, text: "New domain trend: short-form UGC outperforming studio content", time: "8h ago" },
  { icon: Eye, text: "Creative pattern shift: vertical video CTR up 18%", time: "12h ago" },
  { icon: BarChart3, text: "Category momentum: Fitness ads +25% in last 7 days", time: "1d ago" },
];

const DONUT_DATA = [
  { name: "Image", value: 71, color: "hsl(var(--chart-1))" },
  { name: "Video", value: 29, color: "hsl(var(--chart-2))" },
];

export function IndustryInsightsWidget() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Industry Insights</CardTitle>
        <p className="text-[10px] text-muted-foreground">Latest feed • Independent of date filter</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Feed list (primary) */}
        <div className="space-y-2">
          {FEED_ITEMS.map((item, i) => (
            <div key={i} className="flex items-start gap-2 py-1.5">
              <item.icon className="h-3.5 w-3.5 mt-0.5 text-chart-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-snug">{item.text}</p>
                <p className="text-[10px] text-muted-foreground">{item.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Donut chart (secondary) */}
        <div className="border-t border-border pt-3 flex items-center gap-4">
          <ResponsiveContainer width={64} height={64}>
            <PieChart>
              <Pie data={DONUT_DATA} innerRadius={18} outerRadius={28} dataKey="value" strokeWidth={0}>
                {DONUT_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1">
            <p className="text-xs font-medium">800 Creatives</p>
            {DONUT_DATA.map((d) => (
              <p key={d.name} className="text-[10px] text-muted-foreground">
                {d.name}: {d.value}%
              </p>
            ))}
          </div>
        </div>

        <Link
          to="/insights/intelligence"
          className="text-xs font-medium text-foreground hover:underline inline-flex items-center gap-1"
        >
          Explore Insights <ArrowRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
