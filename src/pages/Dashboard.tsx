import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { RefreshCw, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { KpiRow } from "@/components/dashboard/KpiRow";
import { PerformanceTrend } from "@/components/dashboard/PerformanceTrend";
import { MarketingSummary } from "@/components/dashboard/MarketingSummary";
import { AdAccountBreakdown } from "@/components/dashboard/AdAccountBreakdown";
import { RrmSnapshotCard } from "@/components/dashboard/RrmSnapshotCard";
import { RiskHeatmap } from "@/components/dashboard/RiskHeatmap";
import { AlertsSummary } from "@/components/dashboard/AlertsSummary";
import { AutomationSummaryCard } from "@/components/dashboard/AutomationSummaryCard";
import { CoPilotRecommendations } from "@/components/dashboard/CoPilotRecommendations";
import { ProductivityCard } from "@/components/dashboard/ProductivityCard";
import { IndustryInsightsWidget } from "@/components/dashboard/IndustryInsightsWidget";
import { LaunchSummaryCard } from "@/components/dashboard/LaunchSummaryCard";
import { ActivityLogsWidget } from "@/components/dashboard/ActivityLogsWidget";
import { UserLeaderboard } from "@/components/dashboard/UserLeaderboard";
import { CountryInsightsMap } from "@/components/dashboard/CountryInsightsMap";
import { aggregateKpis } from "@/lib/dashboard-selectors";

export default function Dashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [showGraph, setShowGraph] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Compute dateSeed from URL date params (same as reports)
  const dateSeed = useMemo(() => {
    const from = searchParams.get("dateFrom");
    const to = searchParams.get("dateTo");
    if (from && to) {
      return new Date(from).getTime() % 10000;
    }
    return 0;
  }, [searchParams]);

  // Simulated initial load
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(t);
  }, []);

  // Simulated refresh on date change
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    if (refreshKey === 0) return;
    setIsLoading(true);
    const t = setTimeout(() => setIsLoading(false), 2000 + Math.random() * 1000);
    return () => clearTimeout(t);
  }, [refreshKey, dateSeed]);

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  const kpis = useMemo(() => aggregateKpis(dateSeed), [dateSeed]);

  const rawName = user?.email?.split("@")[0] || "User";
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  if (isLoading) {
    return (
      <DashboardSkeleton />
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Zone 1: Header Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Welcome, {firstName} 👋</h1>
          <p className="text-sm text-muted-foreground">Here's your ad performance overview</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {showGraph ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
            <span className="text-xs text-muted-foreground">Graph</span>
            <Switch checked={showGraph} onCheckedChange={setShowGraph} />
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Zone 2: KPI Row */}
      <KpiRow kpis={kpis} />

      {/* Zone 3: Performance Trend */}
      {showGraph && <PerformanceTrend dateSeed={dateSeed} />}

      {/* Masonry: two independent column stacks */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-start">
        {/* Left column -- 60% */}
        <div className="lg:col-span-3 space-y-3">
          <MarketingSummary dateSeed={dateSeed} />
          <AdAccountBreakdown dateSeed={dateSeed} />
          <AutomationSummaryCard />
          <CoPilotRecommendations />
          <ProductivityCard />
          <LaunchSummaryCard dateSeed={dateSeed} />
        </div>
        {/* Right column -- 40% */}
        <div className="lg:col-span-2 space-y-3">
          <RrmSnapshotCard />
          <RiskHeatmap />
          <IndustryInsightsWidget />
          <ActivityLogsWidget />
        </div>
      </div>

      {/* Zone 9: User Leaderboard + Alerts & Country Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
        <UserLeaderboard dateSeed={dateSeed} />
        <div className="space-y-3">
          <AlertsSummary />
          <CountryInsightsMap dateSeed={dateSeed} />
        </div>
      </div>
    </div>
  );
}
