import { Link } from "react-router-dom";
import {
  ChevronDown,
  Image as ImageIcon,
  Search,
  TrendingUp,
  Video,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

/**
 * IndustryInsightsCard — the rich Industry Insights card from the finalised
 * Growth dashboard Figma (node 6060-8953). Vertical card for the right
 * column of the dashboard masonry.
 *
 * Sections (top → bottom), matching the Figma 1:1:
 *   1. Header: title + "3 days" range dropdown affordance
 *   2. Fast growing industries (based on new ads) — ranked list with +ads
 *   3. Creative distribution — donut (total creatives in center) + Image /
 *      Video split legend
 *   4. My Feed — Total ads / Creatives / Competitor inline totals
 *   5. Trending Keywords (AI suggested) — hashtag chips
 *
 * Demo data mirrors the Figma values so the rendered card matches the
 * finalised design. Swap for live selectors when the Insights feed API
 * lands.
 */

const FAST_GROWING = [
  { rank: 1, name: "Health & Fitness", ads: 214 },
  { rank: 2, name: "Finance", ads: 180 },
  { rank: 3, name: "Beauty", ads: 165 },
];

const IMAGE_PCT = 71;
const VIDEO_PCT = 25;
const IMAGE_COUNT = 529;
const VIDEO_COUNT = 623;
const TOTAL_CREATIVES = 800;
const IMAGE_COLOR = "#138585";
const VIDEO_COLOR = "#A02669";
const DONUT_DATA = [
  { name: "Image", value: IMAGE_PCT, color: IMAGE_COLOR },
  { name: "Video", value: VIDEO_PCT, color: VIDEO_COLOR },
];

const MY_FEED = [
  { label: "Ads", value: "24,851" },
  { label: "Creatives", value: "1,420" },
  { label: "Competitor", value: "3,232" },
];

const TRENDING = ["#ChicVibes", "#StyleInspo", "#FashionForward"];

export function IndustryInsightsCard() {
  return (
    <section
      data-fabads-dash-widget="industry-insights-rich"
      aria-label="Industry Insights"
      className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-4"
    >
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <h3 className="text-[14px] font-semibold tracking-tight text-foreground">
          Industry Insights
        </h3>
        <Link
          to="/insights-v2/feed"
          className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          3 days
          <ChevronDown className="h-3 w-3" />
        </Link>
      </header>

      {/* Fast growing industries */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-primary" aria-hidden />
          <span className="text-[12.5px] font-semibold text-foreground">
            Fast growing industries
          </span>
          <span className="text-[11px] text-muted-foreground">
            Based on new Ads
          </span>
        </div>
        <ul className="flex flex-col gap-1.5">
          {FAST_GROWING.map((ind) => (
            <li
              key={ind.name}
              className="flex items-center justify-between gap-2 text-[12.5px]"
            >
              <span className="flex min-w-0 items-center gap-2 text-foreground">
                <span className="font-mono text-muted-foreground tabular-nums">
                  {ind.rank}.
                </span>
                <span className="truncate">{ind.name}</span>
              </span>
              <span className="shrink-0 font-mono font-semibold tabular-nums text-foreground">
                +{ind.ads} ads
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Creative distribution — donut + legend */}
      <section className="flex items-center gap-4 border-t border-border/60 pt-3">
        <div className="relative h-[88px] w-[88px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={DONUT_DATA}
                dataKey="value"
                innerRadius={28}
                outerRadius={44}
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
            <span className="text-[16px] font-bold leading-none text-foreground tabular-nums">
              {TOTAL_CREATIVES}
            </span>
            <span className="mt-0.5 font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
              Creatives
            </span>
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Creative distribution
          </span>
          <DistRow
            icon={ImageIcon}
            color={IMAGE_COLOR}
            label="Image"
            pct={IMAGE_PCT}
            count={IMAGE_COUNT}
          />
          <DistRow
            icon={Video}
            color={VIDEO_COLOR}
            label="Video"
            pct={VIDEO_PCT}
            count={VIDEO_COUNT}
          />
        </div>
      </section>

      {/* My Feed totals */}
      <section className="flex flex-col gap-1.5 border-t border-border/60 pt-3">
        <span className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          My Feed
        </span>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[12.5px]">
          {MY_FEED.map((m, i) => (
            <span key={m.label} className="inline-flex items-baseline gap-1">
              {i > 0 && (
                <span aria-hidden className="mr-1 text-muted-foreground/50">
                  ·
                </span>
              )}
              <span className="font-mono font-semibold tabular-nums text-foreground">
                {m.value}
              </span>
              <span className="text-muted-foreground">{m.label}</span>
            </span>
          ))}
        </div>
      </section>

      {/* Trending keywords */}
      <section className="flex flex-col gap-1.5 border-t border-border/60 pt-3">
        <span className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Trending keywords · AI suggested
        </span>
        <div className="flex flex-wrap gap-1.5">
          {TRENDING.map((kw) => (
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
      </section>
    </section>
  );
}

function DistRow({
  icon: Icon,
  color,
  label,
  pct,
  count,
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  label: string;
  pct: number;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} aria-hidden />
      <span className="flex-1 text-foreground">{label}</span>
      <span className="font-mono tabular-nums text-muted-foreground">({pct}%)</span>
      <span className="w-10 text-right font-mono font-semibold tabular-nums text-foreground">
        {count}
      </span>
    </div>
  );
}
