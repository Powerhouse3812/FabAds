import { AlertTriangle, BarChart3, Shield, Settings, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HealthConfig, HealthSnapshot } from "@/hooks/use-account-health";

interface Props {
  snapshots: HealthSnapshot[];
  configs: HealthConfig[];
}

// Fallback dummy stats when no real data exists
const DUMMY_STATS = {
  totalAds: 3920,
  totalRejected: 24,
  totalApproved: 3896,
  globalRatio: 0.61,
  atRisk: 1,
  safe: 3,
  total: 4,
  autoMaintainCount: 3,
  configCount: 4,
};

export function RRMOverviewCards({ snapshots, configs }: Props) {
  const withData = snapshots.filter((s) => s.rejection_ratio !== null);
  const hasRealData = withData.length > 0;

  const totalAds = hasRealData ? withData.reduce((sum, s) => sum + (s.total_ads ?? 0), 0) : DUMMY_STATS.totalAds;
  const totalRejected = hasRealData ? withData.reduce((sum, s) => sum + (s.rejected_ads ?? 0), 0) : DUMMY_STATS.totalRejected;
  const totalApproved = hasRealData ? withData.reduce((sum, s) => sum + (s.approved_ads ?? 0), 0) : DUMMY_STATS.totalApproved;
  const globalRatio = hasRealData ? (totalAds > 0 ? (totalRejected / totalAds) * 100 : 0) : DUMMY_STATS.globalRatio;

  const atRisk = hasRealData ? withData.filter((s) => s.health_state === "risk").length : DUMMY_STATS.atRisk;
  const safe = hasRealData ? withData.filter((s) => s.health_state === "safe").length : DUMMY_STATS.safe;
  const accountsTotal = hasRealData ? withData.length : DUMMY_STATS.total;
  const autoMaintainCount = configs.length > 0 ? configs.filter((c) => c.guardrail_mode === "auto_maintain").length : DUMMY_STATS.autoMaintainCount;
  const configCount = configs.length > 0 ? configs.length : DUMMY_STATS.configCount;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Global Rejection %</CardTitle>
          {globalRatio >= 1 ? (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          ) : (
            <Shield className="h-4 w-4 text-muted-foreground" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{globalRatio.toFixed(2)}%</div>
          <p className="text-xs text-muted-foreground">
            {totalRejected} rejected / {totalAds.toLocaleString()} total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Ads</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAds.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {totalApproved.toLocaleString()} approved · {totalRejected} rejected
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-destructive flex items-center gap-1">
              <TrendingUp className="h-4 w-4" /> {atRisk} At Risk
            </span>
            <span className="text-lg font-bold text-foreground flex items-center gap-1">
              <TrendingDown className="h-4 w-4" /> {safe} Safe
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {accountsTotal} accounts with health data
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Auto-Maintain Active</CardTitle>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{autoMaintainCount}</div>
          <p className="text-xs text-muted-foreground">
            of {configCount} configured accounts
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
