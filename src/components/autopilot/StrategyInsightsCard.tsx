import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, TrendingUp, Image } from "lucide-react";
import { DUMMY_STRATEGY_INSIGHTS, type StrategyInsightMetrics } from "./autopilot-dummy-data";

interface Props {
  alias: string;
}

function MetricBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-1">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function StrategyInsightsCard({ alias }: Props) {
  const insights: StrategyInsightMetrics | undefined = DUMMY_STRATEGY_INSIGHTS[alias];

  if (!insights) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Strategy Insights</CardTitle>
          </div>
          <CardDescription>No performance data yet. Insights will appear once this strategy has launched ads.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Strategy Insights</CardTitle>
        </div>
        <CardDescription>Performance metrics for ads launched under alias <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mx-0.5">{alias}</Badge></CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* KPI row */}
        <div className="grid gap-3 sm:grid-cols-4">
          <MetricBox label="Ads Launched" value={insights.totalAdsLaunched.toLocaleString()} />
          <MetricBox label="Total Spend" value={`$${insights.totalSpend.toLocaleString()}`} />
          <MetricBox label="Revenue" value={`$${insights.revenue.toLocaleString()}`} />
          <MetricBox label="ROAS" value={`${insights.roas.toFixed(1)}x`} sub={insights.roas >= 3 ? "Performing well" : "Below target"} />
        </div>

        {/* Ad status breakdown */}
        <div className="flex items-center gap-3">
          <Badge variant="default" className="text-xs gap-1">{insights.activeAds} Active</Badge>
          <Badge variant="destructive" className="text-xs gap-1">{insights.rejectedAds} Rejected</Badge>
          <Badge variant="secondary" className="text-xs gap-1">{insights.inReviewAds} In Review</Badge>
        </div>

        {/* Top creatives */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Image className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-foreground">Top Creatives</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {insights.topCreatives.map((cr, i) => (
              <div key={i} className="rounded-md border border-border p-2.5 space-y-1">
                <p className="text-xs font-medium text-foreground truncate">{cr.name}</p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>${cr.spend.toLocaleString()} spent</span>
                  <span className="flex items-center gap-0.5">
                    <TrendingUp className="h-2.5 w-2.5" /> {cr.roas.toFixed(1)}x
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Launch history */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">Recent Launches</p>
          <div className="rounded-md border max-h-48 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Account</TableHead>
                  <TableHead className="text-xs text-right">Ads</TableHead>
                  <TableHead className="text-xs text-right">Spend</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insights.launchHistory.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs">{row.date}</TableCell>
                    <TableCell className="text-xs">{row.account}</TableCell>
                    <TableCell className="text-xs text-right">{row.adsLaunched}</TableCell>
                    <TableCell className="text-xs text-right">${row.spend}</TableCell>
                    <TableCell>
                      <Badge variant={row.status === "Active" ? "default" : "secondary"} className="text-[10px]">
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
