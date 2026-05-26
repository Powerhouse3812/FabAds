/**
 * AnalyticsHero — the DOMINANT hero of the AI-plan Dashboard.
 *
 * Strategic context (Maalik's pivot, locked):
 *   The previous Suno-style mosaic of past generations was visually rich
 *   but gave zero actionable signal — "seeing my brand at the top doesn't
 *   tell me what to DO." Reposition: analytics IS the hero. Numbers +
 *   trend graphs + deltas, each clickable so the user can drill into the
 *   metric. Reference vibes: Vercel Analytics, Linear Insights, Stripe
 *   Dashboard, Plaid console.
 *
 * Layout (asymmetric, ~340-380px tall):
 *   65% LEFT  — area chart (generations per day, last 7/30/90d)
 *   35% RIGHT — 4 stacked KPI tiles (each clickable, drill-in deep links)
 *
 * Mock-data note: 30 daily generation counts deterministically generated
 * at module level (no per-render randomness). When the real entity lands,
 * swap DAILY_GENS_30 for the live selector.
 */
import { useEffect, useMemo, useState } from "react";
import {
  motion,
  animate,
  useMotionValue,
} from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { brands } from "@/mocks/shared/brands";

interface AnalyticsHeroProps {
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic mock data — seeded at module level (NOT in render)
// ─────────────────────────────────────────────────────────────────────────────
type DayPoint = { day: number; gens: number; label: string };

function buildDaily(count: number): DayPoint[] {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const dayOfWeek = i % 7;
    const weekendDip = dayOfWeek === 0 || dayOfWeek === 6 ? -2 : 0;
    const trend = Math.floor(i / 10); // gentle upward trend
    const noise = ((i * 17) % 5) - 2; // deterministic noise
    const gens = Math.max(0, 6 + trend + noise + weekendDip);
    const d = new Date(today);
    d.setDate(d.getDate() - (count - 1 - i));
    return {
      day: i + 1,
      gens,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
  });
}

const DAILY_GENS_30 = buildDaily(30);
const DAILY_GENS_7 = buildDaily(7);
const DAILY_GENS_90 = buildDaily(90);

// Last-7-day quality scores (78-92 range) — deterministic
const QUALITY_SPARK = Array.from({ length: 7 }, (_, i) => ({
  i,
  v: 78 + ((i * 13) % 15),
}));

// Credits used last 14 days — deterministic creep upward
const CREDITS_SPARK = Array.from({ length: 14 }, (_, i) => ({
  i,
  v: 45 + i * 2 + ((i * 7) % 4),
}));

// Insights pinned cumulative count
const INSIGHTS_SPARK = Array.from({ length: 14 }, (_, i) => ({
  i,
  v: 4 + Math.floor(i * 0.75) + ((i * 11) % 3),
}));

// Brands active sparkline (flat-ish, 3-4)
const BRANDS_SPARK = Array.from({ length: 14 }, (_, i) => ({
  i,
  v: 3 + ((i * 5) % 2),
}));

// Range totals
const RANGE_TOTAL: Record<"7d" | "30d" | "90d", number> = {
  "7d": DAILY_GENS_7.reduce((a, b) => a + b.gens, 0),
  "30d": DAILY_GENS_30.reduce((a, b) => a + b.gens, 0),
  "90d": DAILY_GENS_90.reduce((a, b) => a + b.gens, 0),
};

const RANGE_DELTA: Record<"7d" | "30d" | "90d", number> = {
  "7d": 18,
  "30d": 28,
  "90d": 41,
};

const RANGE_DATA: Record<"7d" | "30d" | "90d", DayPoint[]> = {
  "7d": DAILY_GENS_7,
  "30d": DAILY_GENS_30,
  "90d": DAILY_GENS_90,
};

// ─────────────────────────────────────────────────────────────────────────────
// Count-up number — framer-motion useMotionValue + animate
// ─────────────────────────────────────────────────────────────────────────────
function CountUp({
  value,
  duration = 1,
  className,
  delay = 0,
}: {
  value: number;
  duration?: number;
  className?: string;
  delay?: number;
}) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    mv.set(0);
    const controls = animate(mv, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  }, [value, duration, delay, mv]);

  return (
    <span
      className={cn("font-mono font-bold", className)}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {display}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Delta chip — ▲/▼ + percent
// ─────────────────────────────────────────────────────────────────────────────
function DeltaChip({
  value,
  suffix = "%",
  prefix,
  size = "sm",
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  size?: "sm" | "md";
}) {
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md font-mono font-semibold",
        positive
          ? "bg-primary/15 text-primary"
          : "bg-destructive/15 text-destructive",
        size === "md" ? "px-2 py-0.5 text-[11px]" : "px-1.5 py-0.5 text-[10px]"
      )}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      <Icon className={size === "md" ? "h-3 w-3" : "h-2.5 w-2.5"} />
      {prefix ?? ""}
      {Math.abs(value)}
      {suffix}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chart tooltip — shadcn-style
// ─────────────────────────────────────────────────────────────────────────────
function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: DayPoint }>;
}) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      <div
        className="font-mono text-[11px] text-foreground"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        <span className="text-muted-foreground">{p.label}</span>
        <span className="mx-1.5 text-muted-foreground">·</span>
        <span className="font-semibold">{p.gens}</span>
        <span className="ml-1 text-muted-foreground">gens</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Range toggle pill (7d / 30d / 90d)
// ─────────────────────────────────────────────────────────────────────────────
type Range = "7d" | "30d" | "90d";
const RANGES: Range[] = ["7d", "30d", "90d"];

function RangeToggle({
  value,
  onChange,
}: {
  value: Range;
  onChange: (r: Range) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1">
      {RANGES.map((r) => {
        const active = r === value;
        return (
          <button
            key={r}
            type="button"
            onClick={() => onChange(r)}
            className={cn(
              "rounded-full px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {r}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI tile — clickable, hover lift, count-up + sparkline
// ─────────────────────────────────────────────────────────────────────────────
interface KpiTileProps {
  eyebrow: string;
  value: number;
  valueSuffix?: string;
  delta?: { v: number; suffix?: string; prefix?: string } | null;
  spark?: { i: number; v: number }[];
  sparkPositive?: boolean;
  brandDots?: string[];
  onClick: () => void;
  delay: number;
}

function KpiTile({
  eyebrow,
  value,
  valueSuffix,
  delta,
  spark,
  sparkPositive = true,
  brandDots,
  onClick,
  delay,
}: KpiTileProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className={cn(
        "group relative flex w-full flex-col gap-1 rounded-xl border border-border bg-card p-3 text-left transition-colors",
        "hover:border-foreground/20 cursor-pointer"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
          {eyebrow}
        </span>
        <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div className="flex items-end justify-between gap-1.5">
        <div className="flex items-baseline gap-0.5">
          <CountUp
            value={value}
            duration={1}
            delay={delay + 0.1}
            className="text-[19px] leading-none text-foreground"
          />
          {valueSuffix ? (
            <span
              className="font-mono text-[11px] font-semibold text-muted-foreground"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {valueSuffix}
            </span>
          ) : null}
        </div>
        {delta ? (
          <DeltaChip
            value={delta.v}
            suffix={delta.suffix ?? "%"}
            prefix={delta.prefix}
          />
        ) : (
          <span className="font-mono text-[10px] text-muted-foreground">—</span>
        )}
      </div>

      {/* Sparkline OR brand dots */}
      {brandDots && brandDots.length ? (
        <div className="flex items-center gap-1.5">
          {brandDots.map((c, i) => (
            <span
              key={i}
              className="block h-1.5 w-1.5 rounded-full ring-1 ring-border"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      ) : spark && spark.length ? (
        <div className="h-4 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={spark}
              margin={{ top: 1, right: 0, left: 0, bottom: 1 }}
            >
              <Line
                type="monotone"
                dataKey="v"
                stroke={
                  sparkPositive
                    ? "hsl(var(--primary))"
                    : "hsl(var(--destructive))"
                }
                strokeWidth={1.5}
                dot={false}
                isAnimationActive
                animationDuration={900}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export function AnalyticsHero({ className }: AnalyticsHeroProps) {
  const navigate = useNavigate();
  const [range, setRange] = useState<Range>("30d");

  const chartData = RANGE_DATA[range];
  const total = RANGE_TOTAL[range];
  const delta = RANGE_DELTA[range];

  // First 4 brand colors for the "brands active" tile dots
  const brandDots = useMemo(
    () =>
      brands
        .slice(0, 4)
        .map((b) => (b.colors[0] ? b.colors[0] : "hsl(var(--muted))")),
    []
  );

  const rangeLabel =
    range === "7d"
      ? "LAST 7 DAYS"
      : range === "30d"
        ? "LAST 30 DAYS"
        : "LAST 90 DAYS";

  return (
    <section className={cn("grid grid-cols-1 lg:grid-cols-12 gap-3", className)}>
      {/* A-12.187: single-row layout — chart left, 2×2 KPI grid right.
            Was: KPI strip on top + full-width chart below (two rows).
            Maalik flagged that the screen real estate was wasted; one
            horizontal row gives the chart a tighter canvas and clusters
            the metrics into a scannable corner block. Stacks to single
            column below `lg`. */}

      {/* ── LEFT — chart card (col-span-7) ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl border border-border bg-card p-4 lg:col-span-7"
      >
        {/* Header row — number + eyebrow + delta inline, toggle right */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-baseline gap-2.5 min-w-0">
            <CountUp
              value={total}
              duration={1.1}
              delay={0.1}
              className="text-[22px] leading-none text-foreground"
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground whitespace-nowrap">
              gens · {rangeLabel.toLowerCase()}
            </span>
            <DeltaChip value={delta} size="sm" suffix="%" />
          </div>
          <RangeToggle value={range} onChange={setRange} />
        </div>

        {/* Chart — gets full horizontal canvas now */}
        <div className="mt-2 h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              key={range}
              data={chartData}
              margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
            >
              <defs>
                <linearGradient id="genArea" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.28}
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.04}
                  />
                </linearGradient>
              </defs>
              <Tooltip
                content={<ChartTooltip />}
                cursor={{
                  stroke: "hsl(var(--border))",
                  strokeWidth: 1,
                  strokeDasharray: "3 3",
                }}
              />
              <Area
                type="monotone"
                dataKey="gens"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#genArea)"
                fillOpacity={1}
                isAnimationActive
                animationDuration={800}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ── RIGHT — 2×2 KPI grid (col-span-5) ── */}
      <div className="grid grid-cols-2 gap-2 lg:col-span-5">
        <KpiTile
          eyebrow="CREDITS USED"
          value={73}
          valueSuffix="/100"
          delta={{ v: 12, suffix: " vs last mo", prefix: "" }}
          spark={CREDITS_SPARK}
          onClick={() => navigate("/plans-v2")}
          delay={0.08}
        />
        <KpiTile
          eyebrow="INSIGHTS PINNED"
          value={14}
          delta={{ v: 5, suffix: " vs prev 30d", prefix: "" }}
          spark={INSIGHTS_SPARK}
          onClick={() => navigate("/insights-v2/feed")}
          delay={0.16}
        />
        <KpiTile
          eyebrow="AVG QUALITY"
          value={84}
          delta={{ v: 3, suffix: " pts", prefix: "" }}
          spark={QUALITY_SPARK}
          onClick={() => navigate("/iq/genie6/library")}
          delay={0.24}
        />
        <KpiTile
          eyebrow="BRANDS ACTIVE"
          value={4}
          delta={null}
          spark={BRANDS_SPARK}
          brandDots={brandDots}
          onClick={() => navigate("/catalogue/brands")}
          delay={0.32}
        />
      </div>

    </section>
  );
}

export default AnalyticsHero;
