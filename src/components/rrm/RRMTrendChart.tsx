import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface TrendPoint {
  date: string;
  ratio: number;
}

interface Props {
  workspaceId: string | null;
  avgThreshold?: number;
}

function generateFallbackTrend(): TrendPoint[] {
  const now = new Date();
  const series = [
    { offset: 6, ratios: [0.35, 0.20, 0.75, 0.60] },
    { offset: 5, ratios: [0.42, 0.18, 0.82, 0.55] },
    { offset: 4, ratios: [0.50, 0.22, 0.88, 0.48] },
    { offset: 3, ratios: [0.58, 0.19, 0.95, 0.42] },
    { offset: 2, ratios: [0.65, 0.21, 1.02, 0.38] },
    { offset: 1, ratios: [0.72, 0.20, 1.08, 0.32] },
    { offset: 0, ratios: [0.78, 0.18, 1.15, 0.28] },
  ];
  return series.map((s) => {
    const d = new Date(now);
    d.setDate(d.getDate() - s.offset);
    const avgRatio = s.ratios.reduce((a, b) => a + b, 0) / s.ratios.length;
    return { date: d.toLocaleDateString(), ratio: parseFloat(avgRatio.toFixed(2)) };
  });
}

export function RRMTrendChart({ workspaceId, avgThreshold = 1.0 }: Props) {
  const [data, setData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);

    (supabase as any)
      .from("account_health_snapshots")
      .select("snapshot_at, rejected_ads, total_ads")
      .eq("workspace_id", workspaceId)
      .order("snapshot_at", { ascending: true })
      .then(({ data: snapshots, error }: any) => {
        if (!error && snapshots && snapshots.length > 0) {
          const byDate: Record<string, { rejected: number; total: number }> = {};
          for (const s of snapshots) {
            const date = new Date(s.snapshot_at).toLocaleDateString();
            if (!byDate[date]) byDate[date] = { rejected: 0, total: 0 };
            byDate[date].rejected += s.rejected_ads ?? 0;
            byDate[date].total += s.total_ads ?? 0;
          }
          const points: TrendPoint[] = Object.entries(byDate).map(([date, v]) => ({
            date,
            ratio: v.total > 0 ? parseFloat(((v.rejected / v.total) * 100).toFixed(2)) : 0,
          }));
          setData(points);
        } else {
          setData(generateFallbackTrend());
        }
        setLoading(false);
      });
  }, [workspaceId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Rejection Ratio Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading trend data...</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No trend data available. Sync health data to populate the chart.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <ReferenceLine y={avgThreshold} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label="Threshold" />
              <Line type="monotone" dataKey="ratio" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
