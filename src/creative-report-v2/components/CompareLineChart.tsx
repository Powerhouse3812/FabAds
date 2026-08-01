/**
 * CompareLineChart — multi-series revenue-over-time overlay for Compare's
 * chart view (handoff §5.4 addendum). One <Line> per compared column
 * (creative or platform), each plotted straight from that column's own
 * folded daily series — never summed across columns (different attribution
 * windows in "contexts" mode; different creatives in "creatives" mode).
 *
 * Columns may not share the same date set (e.g. two platforms with
 * different start dates) — dates are unioned and missing points are left as
 * a gap (connectNulls={false}), never interpolated or force-aligned.
 */
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fmtCompactCurrency, fmtDate, truncate } from "@/creative-report-v2/lib/format";
import { WhyDot } from "@/creative-report-v2/components/WhyDot";

export interface CompareSeriesColumn {
  key: string;
  title: string;
  points: { date: string; value: number }[];
}

/**
 * Small fixed categorical palette, one color per compared column (max 4 —
 * MAX_COMPARE). The repo's semantic tokens only reliably give 1–2 themed
 * colors (primary/muted-foreground), not enough for 3–4 distinct
 * comparison lines, so this is a deliberate literal-hex exception. Picked
 * mid-tone/saturated so they hold contrast against both the light (#fff)
 * and dark (#121212) card backgrounds — calm, not neon. Shared with
 * CompareBarChart so a column keeps the same color across chart-view
 * toggles.
 */
export const COMPARE_CHART_COLORS = ["#3B82F6", "#F59E0B", "#10B981", "#EC4899"];

const LEGEND_NAME_MAX = 24;

function buildUnionData(columns: CompareSeriesColumn[]): Record<string, number | string>[] {
  const byDate = new Map<string, Record<string, number | string>>();
  for (const col of columns) {
    for (const p of col.points) {
      let row = byDate.get(p.date);
      if (!row) {
        row = { date: p.date };
        byDate.set(p.date, row);
      }
      row[col.key] = p.value;
    }
  }
  return [...byDate.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([, row]) => row);
}

function LineTooltip({
  active,
  payload,
  label,
  columns,
}: {
  active?: boolean;
  payload?: { dataKey?: string | number; value?: number }[];
  label?: string;
  columns: CompareSeriesColumn[];
}) {
  if (!active || !payload?.length) return null;
  const entries = payload.filter((p) => p.value !== undefined && p.value !== null);
  if (entries.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">{fmtDate(label ?? "")}</p>
      {entries.map((entry) => {
        const col = columns.find((c) => c.key === entry.dataKey);
        if (!col) return null;
        const { text } = truncate(col.title, LEGEND_NAME_MAX);
        return (
          <p key={String(entry.dataKey)} className="text-xs">
            <span className="text-muted-foreground">{text}: </span>
            <span className="font-medium text-foreground">
              {fmtCompactCurrency(entry.value as number)}
            </span>
          </p>
        );
      })}
    </div>
  );
}

/** Revenue-over-time overlay — one line per column, plotted honestly (no
 *  cross-column sums, no interpolation across gaps). */
export function CompareLineChart({ columns }: { columns: CompareSeriesColumn[] }) {
  const data = buildUnionData(columns);

  if (columns.length === 0 || data.length === 0) {
    return <p className="text-sm text-muted-foreground">Not enough daily data to chart yet.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {columns.map((col, i) => {
          const { text, truncated } = truncate(col.title, LEGEND_NAME_MAX);
          return (
            <span
              key={col.key}
              className="flex items-center gap-1.5"
              title={truncated ? col.title : undefined}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: COMPARE_CHART_COLORS[i % COMPARE_CHART_COLORS.length] }}
                aria-hidden
              />
              {text}
            </span>
          );
        })}
        <span className="flex items-center gap-0.5">
          · Revenue / day
          <WhyDot id="compare.chart.line" />
        </span>
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) => fmtDate(d)}
              interval="preserveStartEnd"
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
            />
            <YAxis hide />
            <Tooltip content={<LineTooltip columns={columns} />} />
            {columns.map((col, i) => (
              <Line
                key={col.key}
                type="monotone"
                dataKey={col.key}
                name={col.title}
                stroke={COMPARE_CHART_COLORS[i % COMPARE_CHART_COLORS.length]}
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
