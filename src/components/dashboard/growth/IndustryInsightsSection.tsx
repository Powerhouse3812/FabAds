import { Link } from "react-router-dom";
import { ArrowUpRight, Search, Telescope } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { DashboardStatStrip, type StatItem } from "./DashboardStatStrip";

/**
 * IndustryInsightsSection — single compact card for the Growth dashboard.
 *
 * Maalik A-12.196: collapsed from a 4-card KPI grid + NewAdsFetchedTile +
 * IndustryInsightsTile + pinned-boards card into ONE card. Inside, two
 * stacked blocks under a quiet header:
 *   1. DashboardStatStrip — 4 Industry KPIs as an inline strip.
 *   2. Breakdown row — compact donut (Creatives vs Videos) + trending
 *      keyword chips, inline below a hairline.
 *
 * Same flat hierarchy + sibling header treatment as GenieSection.
 * Demo data matches the AI-plan AnalyticsHero + IndustryInsightsTile
 * constants for numeric consistency.
 */

const INSIGHTS_STATS: StatItem[] = [
  { label: "Brands followed", value: "8", delta: { value: 1, unit: "" } },
  { label: "Competitors", value: "15 / 20", delta: { value: 4.5 } },
  { label: "Total ads", value: "24,851", delta: { value: 12 } },
  { label: "Categories tracked", value: "9", delta: { value: 2, unit: "" } },
];

const CREATIVES = 57;
const VIDEOS = 61;
const CREATIVES_COLOR = "#138585";
const VIDEOS_COLOR = "#A02669";
const DONUT_DATA = [
  { name: "Creatives", value: CREATIVES, color: CREATIVES_COLOR },
  { name: "Videos", value: VIDEOS, color: VIDEOS_COLOR },
];
const DONUT_TOTAL = CREATIVES + VIDEOS;

const TRENDING_KEYWORDS = ["skincare routine", "summer sale", "Vitamin C benefits"];

export function IndustryInsightsSection() {
  return (
    <section
      data-fabads-dash-section="industry-insights"
      aria-label="Industry Insights"
      className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4"
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Telescope className="h-3.5 w-3.5 text-foreground" aria-hidden />
          <h2 className="text-[13px] font-semibold tracking-tight text-foreground">
            Industry Insights
          </h2>
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
            · market
          </span>
        </div>
        <Link
          to="/insights-v2/feed"
          className="inline-flex shrink-0 items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          Open feed
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </header>

      <DashboardStatStrip stats={INSIGHTS_STATS} />

      {/* Breakdown row — donut + legend on the left, trending keywords on
          the right. One compact line below a hairline; wraps on narrow. */}
      <div className="flex flex-col gap-3 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:gap-5">
        {/* Donut + legend */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="relative h-12 w-12 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DONUT_DATA}
                  dataKey="value"
                  innerRadius={15}
                  outerRadius={24}
                  paddingAngle={2}
                  strokeWidth={0}
                  startAngle={90}
                  endAngle={-270}
                  isAnimationActive={false}
                >
                  {DONUT_DATA.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-[11px] font-bold leading-none text-foreground tabular-nums">
                {DONUT_TOTAL}
              </span>
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <LegendRow color={CREATIVES_COLOR} label="Creatives" value={CREATIVES} />
            <LegendRow color={VIDEOS_COLOR} label="Videos" value={VIDEOS} />
          </div>
        </div>

        {/* Vertical divider on sm+ */}
        <span aria-hidden className="hidden h-10 w-px bg-border/60 sm:block" />

        {/* Trending keywords */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Trending keywords · AI suggested
          </span>
          <div className="flex flex-wrap gap-1.5">
            {TRENDING_KEYWORDS.map((kw) => (
              <span
                key={kw}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2 py-0.5",
                  "text-[11px] text-foreground/80",
                )}
              >
                <Search className="h-2.5 w-2.5 shrink-0 text-muted-foreground" aria-hidden />
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LegendRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden
        className="inline-block h-2 w-2 shrink-0 rounded-[2px]"
        style={{ backgroundColor: color }}
      />
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="font-mono text-[11px] font-semibold text-foreground tabular-nums">
        {value}
      </span>
    </div>
  );
}
