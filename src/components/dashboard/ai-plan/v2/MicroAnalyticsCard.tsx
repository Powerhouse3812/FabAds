/**
 * MicroAnalyticsCard — V2 ultra-compact analytics tile.
 *
 * Strategic context (Maalik's V2 critique, locked):
 *   V1's AnalyticsHero is ~350px tall (KPI strip + chart card stacked).
 *   Maalik called V2 out for "too much big cards, too much space wastage,
 *   beginner and generic UI." This component crushes the analytics surface
 *   down to ~120-140px so it slots horizontally into a bento next to other
 *   dense tiles. Reference vibes: Linear's bottom status bar, Plausible's
 *   dashboard rows, Vercel deployment-row density.
 *
 * Layout:
 *   ┌──────────────────────────────────────┐
 *   │ GENERATIONS · 30D       7D 30D 90D   │  ~22px eyebrow + range
 *   │ 192  ▲ 28%                           │  ~26px number row
 *   │ ─── chart 70px tall ──────           │  ~70px area chart
 *   └──────────────────────────────────────┘
 *
 * No hover lift, no glow, no shine — restraint is the design.
 */
import { useEffect, useState } from "react";
import { animate, useMotionValue } from "framer-motion";
import {
  AreaChart,
  Area,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

interface MicroAnalyticsCardProps {
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic mock data — seeded at module level (no per-render randomness)
// ─────────────────────────────────────────────────────────────────────────────
type DayPoint = { day: number; gens: number; label: string };

function buildDaily(count: number): DayPoint[] {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const dayOfWeek = i % 7;
    const weekendDip = dayOfWeek === 0 || dayOfWeek === 6 ? -2 : 0;
    const trend = Math.floor(i / 10);
    const noise = ((i * 17) % 5) - 2;
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

const DAILY_7 = buildDaily(7);
const DAILY_30 = buildDaily(30);
const DAILY_90 = buildDaily(90);

type Range = "7D" | "30D" | "90D";
const RANGES: Range[] = ["7D", "30D", "90D"];

const RANGE_DATA: Record<Range, DayPoint[]> = {
  "7D": DAILY_7,
  "30D": DAILY_30,
  "90D": DAILY_90,
};

const RANGE_TOTAL: Record<Range, number> = {
  "7D": DAILY_7.reduce((s, p) => s + p.gens, 0),
  "30D": DAILY_30.reduce((s, p) => s + p.gens, 0),
  "90D": DAILY_90.reduce((s, p) => s + p.gens, 0),
};

const RANGE_DELTA: Record<Range, number> = {
  "7D": 12,
  "30D": 28,
  "90D": 18,
};

// ─────────────────────────────────────────────────────────────────────────────
// Count-up — framer-motion useMotionValue + animate, 1s ease-out on mount
// ─────────────────────────────────────────────────────────────────────────────
function CountUp({ value, className }: { value: number; className?: string }) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    mv.set(0);
    const controls = animate(mv, value, {
      duration: 1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  }, [value, mv]);

  return (
    <span
      className={cn("font-bold leading-none", className)}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {display}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tiny dark tooltip pill — date · count
// ─────────────────────────────────────────────────────────────────────────────
function MicroTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: DayPoint }>;
}) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md bg-foreground px-2 py-1 shadow-md">
      <div
        className="font-mono text-[9.5px] text-background"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        <span className="opacity-70">{p.label}</span>
        <span className="mx-1 opacity-50">·</span>
        <span className="font-semibold">{p.gens}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export function MicroAnalyticsCard({ className }: MicroAnalyticsCardProps) {
  const [range, setRange] = useState<Range>("30D");

  const chartData = RANGE_DATA[range];
  const total = RANGE_TOTAL[range];
  const delta = RANGE_DELTA[range];
  const positive = delta >= 0;

  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card p-3 flex flex-col gap-1.5",
        className,
      )}
    >
      {/* Header row — eyebrow + range pills */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
          Generations · Last {range}
        </span>
        <div className="inline-flex items-center gap-0.5">
          {RANGES.map((r) => {
            const active = r === range;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={cn(
                  "rounded px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] transition-colors",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>

      {/* Number row — value + delta chip */}
      <div className="flex items-baseline gap-2">
        <CountUp
          value={total}
          className="text-[20px] text-foreground"
        />
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded px-1 py-0.5 font-mono text-[9.5px] font-semibold",
            positive
              ? "bg-primary/15 text-primary"
              : "bg-destructive/15 text-destructive",
          )}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          <span aria-hidden>{positive ? "▲" : "▼"}</span>
          {Math.abs(delta)}%
        </span>
      </div>

      {/* Chart — 70px tall, bare minimum chrome */}
      <div className="h-[70px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            key={range}
            data={chartData}
            margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="microGenArea" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.18}
                />
                <stop
                  offset="100%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.04}
                />
              </linearGradient>
            </defs>
            <Tooltip content={<MicroTooltip />} cursor={false} />
            <Area
              type="monotone"
              dataKey="gens"
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
              fill="url(#microGenArea)"
              fillOpacity={1}
              isAnimationActive
              animationDuration={800}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default MicroAnalyticsCard;
