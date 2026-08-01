/**
 * Sparkline — chrome-less recharts area/line for trend glances. No axes, grid,
 * or tooltip; just the shape. Colour is theme-aware via CSS vars.
 */
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  /** "up" = positive/lime, "down" = destructive, "neutral" = muted. */
  tone?: "up" | "down" | "neutral";
  width?: number | string;
  height?: number;
  className?: string;
}

const TONE_STROKE: Record<string, string> = {
  up: "hsl(var(--primary))",
  down: "hsl(var(--destructive))",
  neutral: "hsl(var(--muted-foreground))",
};

export function Sparkline({
  data,
  tone = "neutral",
  width = "100%",
  height = 32,
  className,
}: SparklineProps) {
  if (!data.length) return <div style={{ height }} className={className} aria-hidden />;
  const chartData = data.map((value, i) => ({ i, value }));
  const stroke = TONE_STROKE[tone];
  const gradId = `spark-${tone}`;

  return (
    <div className={cn("min-w-0", className)} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={1.5}
            fill={`url(#${gradId})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
