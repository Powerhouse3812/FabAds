import { Component, useState, useEffect, useMemo, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/contexts/PlanContext";
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
import { LaunchSummaryCard } from "@/components/dashboard/LaunchSummaryCard";
import { ActivityLogsWidget } from "@/components/dashboard/ActivityLogsWidget";
import { UserLeaderboard } from "@/components/dashboard/UserLeaderboard";
import { CountryInsightsMap } from "@/components/dashboard/CountryInsightsMap";
import { AiPlanDashboard } from "@/components/dashboard/ai-plan/AiPlanDashboard";
// A-12.197 (finalised-Figma reference): compact 2-row analytics strip
// (GENIE + INDUSTRY INSIGHTS) up top + the rich Industry Insights card
// in the body. Replaces the over-sized GenieSection/IndustryInsightsSection.
import { ModuleAnalyticsStrip } from "@/components/dashboard/growth/ModuleAnalyticsStrip";
import { IndustryInsightsCard } from "@/components/dashboard/growth/IndustryInsightsCard";
import { aggregateKpis } from "@/lib/dashboard-selectors";

/**
 * Dashboard — plan-aware top-level page.
 *
 *   AI plan   → AiPlanDashboard (the single best-of-both layout — A-12.185
 *               consolidated V1 + V2 into one composition with 3 net-new
 *               tiles: NewAdsFetchedTile, CreditUsageCard, IndustryInsightsTile)
 *   Full plan → existing ad-ops dashboard (KPI row, performance trend,
 *               ad accounts, RRM, risk heatmap, launches, automation)
 *
 * Maalik: on AI plan, locked modules have NO DATA — pulling ad-performance
 * tiles would render empty/noisy. So the AI-plan path forks entirely into
 * its own composition. Growth-plan path stays exactly as before.
 *
 * A-12.185: V1/V2 toggle removed. AiPlanDashboardV2 + DashboardVariantToggle
 * deleted along with the dropped subcomponents (SpotlightRow,
 * AiSuggestionsCoach, VideoSageRecentTile, MicroAnalyticsCard,
 * CommandPaletteButton, SignalsAndCoachList).
 */
export default function Dashboard() {
  const { plan } = usePlan();
  if (plan === "ai") {
    // ErrorBoundary catches any runtime crash on the AI-plan dashboard so
    // the user sees a recovery card instead of a blank page.
    return (
      <DashboardErrorBoundary>
        <AiPlanDashboard />
      </DashboardErrorBoundary>
    );
  }
  return <FullPlanDashboard />;
}

/* ── Error boundary around the AI-plan dashboard ──
      If something inside the dashboard throws on render, this catches it
      and shows a recovery card with a reload button. */
interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
class DashboardErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: { componentStack: string }) {
    // eslint-disable-next-line no-console
    console.error(
      `[Dashboard AI-plan] crashed:`,
      error,
      info.componentStack,
    );
  }
  render() {
    if (this.state.hasError) {
      return <DashboardCrashFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

function DashboardCrashFallback({ error }: { error: Error | null }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-destructive/30 bg-destructive/[0.04] p-6">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-destructive" strokeWidth={2.25} />
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-destructive">
            Dashboard crashed
          </p>
        </div>
        <h2 className="text-[18px] font-bold text-foreground tracking-tight leading-tight">
          Couldn't render the dashboard.
        </h2>
        <p className="text-[12.5px] text-muted-foreground mt-2 leading-snug">
          A component threw an error. The console has the stack trace.
        </p>
        {error?.message && (
          <pre className="mt-3 p-2 rounded-md bg-muted/40 font-mono text-[10.5px] text-muted-foreground overflow-x-auto">
            {error.message}
          </pre>
        )}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-[12px] text-foreground hover:border-foreground/20 transition-colors"
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  );
}

function FullPlanDashboard() {
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

      {/* Zone 3.5 (A-12.197): compact 2-row analytics strip — GENIE +
          INDUSTRY INSIGHTS numbers in one card, lime module labels +
          inline metrics + hairline dividers, no sparklines / no
          per-metric cards. Mirrors the AI dashboard's strip language at
          its minimal density. The rich Industry Insights card lives in
          the masonry right column below. */}
      <ModuleAnalyticsStrip />

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
        {/* Right column -- 40%.
            A-12.197: the rich Industry Insights card (finalised Figma —
            fast-growing industries + creative-distribution donut + My
            Feed totals + trending hashtags) restored here. The compact
            strip up top carries the at-a-glance numbers; this carries
            the depth. */}
        <div className="lg:col-span-2 space-y-3">
          <IndustryInsightsCard />
          <RrmSnapshotCard />
          <RiskHeatmap />
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
