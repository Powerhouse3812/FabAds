/**
 * ClassicDarkDashboard — "Classic Dark Analytics" variant.
 *
 * A COINTALKER-style crypto-dashboard skin: full-bleed dark canvas, a single
 * green accent for everything positive/primary, mono numerals everywhere,
 * a borderless hero line chart, and a dense transactions-style activity
 * table. This is a fully self-contained, literal-styled variant — it does
 * NOT use the Fabfunnel design system tokens (--g6-*, shadcn `card`, etc).
 * Every color/spacing value below is intentionally hardcoded to this
 * variant's own dark palette.
 *
 * Zones (top to bottom / left to right):
 *   1. Header bar        — wordmark, fake nav, greeting, primary CTA
 *   2. Left rail (~340px)— genie KPIs, industry KPIs, credits card,
 *                          creative distribution bars, trending keywords,
 *                          6-tile quick-action grid (modes)
 *   3. Main column       — time-range chips, borderless hero LineChart,
 *                          full-width "Recent activity" table (round-robin
 *                          merge of activity + recentWork + newAdsFetched,
 *                          truncated to 10 rows so every source shows up)
 */
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getDashboardVariantData,
  type VariantActivity,
  type VariantDonutSlice,
  type VariantKpi,
  type VariantListItem,
  type VariantModeAction,
} from "./variantData";
import VariantSwitcher from "./VariantSwitcher";

// ─────────────────────────────────────────────────────────────────────────
// Palette (literal — this variant does not use design-system tokens)
// ─────────────────────────────────────────────────────────────────────────
const BG = "#17181A";
const CARD_BG = "#1F2124";
const CARD_BORDER = "#2A2C30";
const ROW_BORDER = "#26282B";
const TEXT = "#E8E9EA";
const TEXT_MUTED = "#9CA0A6";
const TEXT_DIM = "#6B6F76";
const GREEN = "#4ADE80";
const RED = "#F87171";
const GREEN_BTN_FG = "#0B0F0C";

const RANGE_CHIPS = ["Day", "Week", "Month", "Quarter", "Year", "All"] as const;
const ACTIVITY_TABS = ["Week", "Month"] as const;

// ─────────────────────────────────────────────────────────────────────────
// Local output type — the merged "Recent activity" table row. Row-level
// source types (VariantKpi / VariantListItem / VariantActivity / ...) are
// imported directly from variantData.ts above.
// ─────────────────────────────────────────────────────────────────────────
interface MergedRow {
  id: string;
  time: string;
  type: string;
  item: string;
  detail: string;
  status: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

/** Mix GREEN → TEXT_DIM across `count` steps (used for distribution bars). */
function greenToGray(index: number, count: number): string {
  const t = count <= 1 ? 0 : index / (count - 1);
  const from = { r: 0x4a, g: 0xde, b: 0x80 };
  const to = { r: 0x6b, g: 0x6f, b: 0x76 };
  const r = Math.round(from.r + (to.r - from.r) * t);
  const g = Math.round(from.g + (to.g - from.g) * t);
  const b = Math.round(from.b + (to.b - from.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

/** Positive / negative / neutral pill styling for the activity table. */
function statusPillClass(status: string): string {
  const s = status.toLowerCase();
  const negative = ["destructive", "failed", "error", "removed", "declined"];
  if (negative.some((p) => s.includes(p))) {
    return "bg-[#F87171]/15 text-[#F87171]";
  }
  const positive = ["active", "done", "success", "completed", "live", "delivered"];
  if (positive.some((p) => s.includes(p))) {
    return "bg-[#4ADE80]/15 text-[#4ADE80]";
  }
  return "bg-[#9CA0A6]/12 text-[#9CA0A6]";
}

/** Tiny inline sparkline for KPI rows — plain SVG, no recharts. */
function MiniSpark({ points, positive }: { points: number[]; positive: boolean }) {
  if (!points || points.length < 2) return null;
  const w = 44;
  const h = 16;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = w / (points.length - 1);
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - ((p - min) / range) * h).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <path d={d} fill="none" stroke={positive ? GREEN : RED} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Normalizes a KPI delta into a signed display label + up/down flag.
 * `delta` on VariantKpi is already a formatted string (e.g. "+4.5%", "+2"),
 * but this stays defensive of a raw number too so the row renderer doesn't
 * care which shape it gets.
 */
function fmtDelta(delta?: string | number, deltaDir?: "up" | "down") {
  if (delta === undefined || delta === null || delta === "") return null;
  if (typeof delta === "string") {
    const isDown = deltaDir ? deltaDir === "down" : delta.trim().startsWith("-");
    const stripped = delta.trim().replace(/^[+-]/, "");
    return { isDown, label: `${isDown ? "-" : "+"}${stripped}` };
  }
  const isDown = deltaDir ? deltaDir === "down" : delta < 0;
  const magnitude = Math.abs(delta);
  return { isDown, label: `${isDown ? "-" : "+"}${magnitude}%` };
}

// ─────────────────────────────────────────────────────────────────────────
// Panel primitives
// ─────────────────────────────────────────────────────────────────────────

function Panel({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-xl p-4", className)}
      style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
    >
      {title && (
        <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: TEXT_DIM }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

function KpiRow({ item }: { item: VariantKpi }) {
  const delta = fmtDelta(item.delta, item.deltaDir);
  return (
    <div
      className="flex items-center justify-between gap-3 py-2.5 last:pb-0 first:pt-0"
      style={{ borderBottom: `1px solid ${ROW_BORDER}` }}
    >
      <span className="font-mono text-[11px] uppercase tracking-wide" style={{ color: TEXT_MUTED }}>
        {item.label}
      </span>
      <div className="flex items-center gap-2">
        {item.spark && <MiniSpark points={item.spark} positive={!delta || !delta.isDown} />}
        <span className="font-mono text-[13px] font-semibold tabular-nums" style={{ color: TEXT }}>
          {item.value}
        </span>
        {delta && (
          <span
            className="min-w-[46px] text-right font-mono text-[10px] font-medium tabular-nums"
            style={{ color: delta.isDown ? RED : GREEN }}
          >
            {delta.label}
          </span>
        )}
      </div>
    </div>
  );
}

function KpiPanel({ title, items }: { title: string; items: VariantKpi[] }) {
  return (
    <Panel title={title}>
      <div className="flex flex-col">
        {items.map((it) => (
          <KpiRow key={it.key} item={it} />
        ))}
      </div>
    </Panel>
  );
}

function CreditsCard({
  used,
  total,
  pct,
  burnPerDay,
  daysLeft,
}: {
  used: number;
  total: number;
  pct: number;
  burnPerDay: number;
  daysLeft: number;
}) {
  const remaining = Math.max(total - used, 0);
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
      <div className="mb-2 flex items-center gap-1.5">
        <Zap className="h-3 w-3" style={{ color: GREEN }} strokeWidth={2.5} />
        <span className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: TEXT_DIM }}>
          Estimated credits left
        </span>
      </div>
      <div className="mb-3 flex items-baseline gap-1.5">
        <span className="font-mono text-[26px] font-bold tabular-nums" style={{ color: TEXT }}>
          {remaining}
        </span>
        <span className="font-mono text-[12px] tabular-nums" style={{ color: TEXT_DIM }}>
          ({used}/{total})
        </span>
      </div>
      <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: ROW_BORDER }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(Math.max(pct, 0), 100)}%`, backgroundColor: GREEN }}
        />
      </div>
      <p className="mb-3 font-mono text-[10px] tabular-nums" style={{ color: TEXT_MUTED }}>
        ~{burnPerDay}/day burn · {daysLeft}d left
      </p>
      <button
        type="button"
        className="w-full rounded-md py-2 text-[12px] font-semibold"
        style={{ backgroundColor: GREEN, color: GREEN_BTN_FG }}
      >
        Add Credits
      </button>
    </div>
  );
}

function DistributionBars({ data }: { data: VariantDonutSlice[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  return (
    <Panel title="Creative distribution">
      <div className="flex flex-col gap-2.5">
        {data.map((d, i) => {
          const pct = Math.round((d.value / total) * 100);
          return (
            <div key={d.name} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px]" style={{ color: TEXT_MUTED }}>
                  {d.name}
                </span>
                <span className="font-mono text-[11px] tabular-nums" style={{ color: TEXT }}>
                  {pct}%
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full" style={{ backgroundColor: ROW_BORDER }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: greenToGray(i, data.length) }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function KeywordChips({ keywords }: { keywords: string[] }) {
  return (
    <Panel title="Trending keywords">
      <div className="flex flex-wrap gap-1.5">
        {keywords.map((k) => (
          <span
            key={k}
            className="rounded-full px-2.5 py-1 text-[11px]"
            style={{ border: `1px solid ${CARD_BORDER}`, color: TEXT_MUTED }}
          >
            {k}
          </span>
        ))}
      </div>
    </Panel>
  );
}

function ModesGrid({ modes }: { modes: VariantModeAction[] }) {
  return (
    <Panel title="Quick actions">
      <div className="grid grid-cols-2 gap-2">
        {modes.map((m) => (
          <button
            key={m.key}
            type="button"
            className="flex flex-col items-start gap-0.5 rounded-lg p-2.5 text-left transition-colors hover:bg-white/[0.03]"
            style={{ border: `1px solid ${ROW_BORDER}` }}
          >
            <span className="text-[11px] font-semibold" style={{ color: TEXT }}>
              {m.label}
            </span>
            <span className="text-[11px] leading-tight" style={{ color: TEXT_DIM }}>
              {m.desc}
            </span>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function TimeRangeChips() {
  const [active, setActive] = useState<(typeof RANGE_CHIPS)[number]>("Week");
  return (
    <div className="flex items-center gap-5">
      {RANGE_CHIPS.map((chip) => (
        <button
          key={chip}
          type="button"
          onClick={() => setActive(chip)}
          className="pb-1.5 text-[11px] uppercase tracking-wide transition-colors"
          style={{
            color: active === chip ? TEXT : TEXT_DIM,
            borderBottom: active === chip ? `2px solid ${GREEN}` : "2px solid transparent",
          }}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="rounded-md px-2.5 py-1.5 font-mono text-[11px]"
      style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}`, color: TEXT }}
    >
      <div style={{ color: TEXT_DIM }}>{label}</div>
      <div className="font-semibold tabular-nums" style={{ color: GREEN }}>
        {payload[0].value}
      </div>
    </div>
  );
}

function HeroChart({ sparkSeries }: { sparkSeries: number[] }) {
  const data = useMemo(() => {
    const series = sparkSeries && sparkSeries.length ? sparkSeries : [0, 0];
    const n = series.length;
    return series.map((value, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (n - 1 - i));
      return {
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value,
      };
    });
  }, [sparkSeries]);

  const last = data[data.length - 1];
  const min = Math.min(...data.map((d) => d.value));
  const max = Math.max(...data.map((d) => d.value));
  const range = max - min || 1;
  const topPct = 100 - ((last.value - min) / range) * 100;

  return (
    <div>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="font-mono text-[22px] font-bold tabular-nums" style={{ color: TEXT }}>
          {last.value}
        </span>
        <span className="text-[11px]" style={{ color: TEXT_DIM }}>
          current
        </span>
      </div>
      <div className="relative" style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={ROW_BORDER} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontFamily: "Geist Mono, monospace", fontSize: 10, fill: TEXT_DIM }}
              axisLine={{ stroke: ROW_BORDER }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontFamily: "Geist Mono, monospace", fontSize: 10, fill: TEXT_DIM }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: ROW_BORDER, strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={GREEN}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: GREEN, stroke: BG, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
        {/* Highlighted last-point dot + floating value badge, positioned via CSS
            (kept out of the SVG coordinate system for a clean, dependency-free
            "floating tooltip" look per the COINTALKER reference). */}
        <div
          className="pointer-events-none absolute right-2 flex -translate-y-1/2 flex-col items-end gap-1"
          style={{ top: `${Math.min(Math.max(topPct, 6), 88)}%` }}
        >
          <div
            className="rounded-md px-2 py-1 font-mono text-[10px] font-semibold tabular-nums"
            style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}`, color: GREEN }}
          >
            {last.value}
          </div>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: GREEN, boxShadow: `0 0 0 3px ${GREEN}33` }} />
        </div>
      </div>
    </div>
  );
}

/** Round-robins N row lists so all sources are represented once truncated. */
function interleave(...lists: MergedRow[][]): MergedRow[] {
  const maxLen = Math.max(0, ...lists.map((l) => l.length));
  const out: MergedRow[] = [];
  for (let i = 0; i < maxLen; i++) {
    for (const l of lists) {
      if (l[i]) out.push(l[i]);
    }
  }
  return out;
}

function buildActivityRows(
  activity: VariantActivity[],
  recentWork: VariantListItem[],
  newAdsFetched: VariantListItem[],
): MergedRow[] {
  // Audit-log style entries — `kind` ("info" / "destructive") reads
  // naturally as the row's status/severity tag.
  const fromActivity: MergedRow[] = activity.map((a) => ({
    id: `act-${a.id}`,
    time: a.time,
    type: "Log",
    item: a.text,
    detail: "—",
    status: a.kind,
  }));
  const fromWork: MergedRow[] = recentWork.map((w) => ({
    id: `work-${w.id}`,
    time: w.time ?? "—",
    type: "Work",
    item: w.title,
    detail: w.sub,
    status: w.status ?? "done",
  }));
  const fromFetched: MergedRow[] = newAdsFetched.map((f) => ({
    id: `fetch-${f.id}`,
    time: f.time ?? "—",
    type: "New ad",
    item: f.title,
    detail: f.sub,
    status: f.status ?? "fetched",
  }));
  return interleave(fromActivity, fromWork, fromFetched).slice(0, 10);
}

function ActivityTable({ rows }: { rows: MergedRow[] }) {
  const [tab, setTab] = useState<(typeof ACTIVITY_TABS)[number]>("Week");
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[20px] font-bold" style={{ color: TEXT }}>
          Recent activity
        </h2>
        <div className="flex items-center gap-4">
          {ACTIVITY_TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="text-[11px] font-medium uppercase tracking-wide"
              style={{ color: tab === t ? TEXT : TEXT_DIM }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Time", "Type", "Item", "Detail", "Status"].map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-3 py-2 text-left font-mono text-[10px] font-normal uppercase tracking-wide"
                  style={{ color: TEXT_DIM, borderBottom: `1px solid ${ROW_BORDER}` }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-white/[0.02]" style={{ borderBottom: `1px solid ${ROW_BORDER}` }}>
                <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[13px] tabular-nums" style={{ color: TEXT_MUTED }}>
                  {r.time}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-[13px]" style={{ color: TEXT_MUTED }}>
                  {r.type}
                </td>
                <td className="px-3 py-2.5 text-[13px] font-medium" style={{ color: TEXT }}>
                  {r.item}
                </td>
                <td className="px-3 py-2.5 text-[13px]" style={{ color: TEXT_DIM }}>
                  {r.detail}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <span
                    className={cn("rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide", statusPillClass(r.status))}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HeaderBar({ userName }: { userName: string }) {
  const navItems = ["Dashboard", "Reports", "Launches", "Insights"];
  return (
    <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${ROW_BORDER}` }}>
      <span className="text-[15px] font-bold tracking-tight" style={{ color: TEXT }}>
        FABADS
      </span>
      <nav className="hidden items-center gap-6 md:flex">
        {navItems.map((item, i) => (
          <span
            key={item}
            className="font-mono text-[11px] uppercase tracking-widest"
            style={{ color: i === 0 ? TEXT : TEXT_MUTED }}
          >
            {item}
          </span>
        ))}
      </nav>
      <div className="flex items-center gap-4">
        <span className="text-[13px]" style={{ color: TEXT_MUTED }}>
          Hi, <span style={{ color: TEXT }}>{userName}</span>
        </span>
        <button
          type="button"
          className="rounded-md px-4 py-2 text-[12px] font-semibold"
          style={{ backgroundColor: GREEN, color: GREEN_BTN_FG }}
        >
          New Launch
        </button>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────

export default function ClassicDarkDashboard() {
  const data = getDashboardVariantData();
  const {
    userName,
    genieKpis,
    industryKpis,
    credits,
    creativeDistribution,
    trendingKeywords,
    modes,
    sparkSeries,
    activity,
    recentWork,
    newAdsFetched,
  } = data;

  const activityRows = useMemo(
    () => buildActivityRows(activity, recentWork, newAdsFetched),
    [activity, recentWork, newAdsFetched],
  );

  return (
    <div className="min-h-screen w-full font-sans" style={{ backgroundColor: BG, color: TEXT }}>
      <VariantSwitcher current="classic" />
      <HeaderBar userName={userName} />

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[340px_1fr]">
        <aside className="flex flex-col gap-4">
          <KpiPanel title="Genie" items={genieKpis} />
          <KpiPanel title="Industry" items={industryKpis} />
          <CreditsCard
            used={credits.used}
            total={credits.total}
            pct={credits.pct}
            burnPerDay={credits.burnPerDay}
            daysLeft={credits.daysLeft}
          />
          <DistributionBars data={creativeDistribution} />
          <KeywordChips keywords={trendingKeywords} />
          <ModesGrid modes={modes} />
        </aside>

        <main className="flex flex-col gap-8">
          <TimeRangeChips />
          <HeroChart sparkSeries={sparkSeries} />
          <ActivityTable rows={activityRows} />
        </main>
      </div>
    </div>
  );
}
