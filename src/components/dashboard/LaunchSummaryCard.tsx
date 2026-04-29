import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { launchCreationStats } from "@/lib/dashboard-selectors";

interface LaunchSummaryCardProps {
  dateSeed: number;
}

export function LaunchSummaryCard({ dateSeed }: LaunchSummaryCardProps) {
  const stats = launchCreationStats(dateSeed);

  const donutData = [
    { name: "New", value: stats.newPercent, color: "hsl(var(--chart-1))" },
    { name: "Relaunch", value: stats.relaunchPercent, color: "hsl(var(--chart-2))" },
  ];

  const items = [
    { label: "Campaigns", value: stats.campaigns },
    { label: "Ad Sets", value: stats.adsets },
    { label: "Ads", value: stats.ads },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Launch Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={64} height={64}>
            <PieChart>
              <Pie data={donutData} innerRadius={18} outerRadius={28} dataKey="value" strokeWidth={0}>
                {donutData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1">
            {donutData.map((d) => (
              <p key={d.name} className="text-xs">
                <span className="font-medium">{d.name}</span>
                <span className="text-muted-foreground ml-1">{d.value}%</span>
              </p>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-base font-bold">{item.value}</p>
              <p className="text-[10px] text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Media uploads</span>
            <span className="font-medium">{stats.mediaUploads}/{stats.mediaCapacity}</span>
          </div>
          <Progress value={(stats.mediaUploads / stats.mediaCapacity) * 100} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
