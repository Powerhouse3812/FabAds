/**
 * ClassicDarkDashboard — "Classic Dark Analytics" variant.
 *
 * A COINTALKER-style crypto-dashboard skin: full-bleed dark canvas, a single
 * lime accent for everything positive/primary, mono numerals everywhere,
 * a borderless hero line chart, and a dense transactions-style activity
 * table. This is a self-contained variant that renders literal hex/rgba
 * values (matching FabFunnel DS v1.2's dark-mode token values) rather than
 * semantic Tailwind classes — consistent with the other 3 dashboard-variant
 * pages and with VariantSwitcher, none of which read ancestor `.dark` state.
 * Recharts SVG props always take literal hexes regardless.
 *
 * Zones (top to bottom / left to right):
 *   1. Header bar        — wordmark (page h1), greeting, single primary CTA
 *      ("New Launch" → /launchv2/new)
 *   2. Left rail (~340px)— genie KPIs, industry KPIs, credits card
 *      ("Add Credits" → /plans-v2, the real upgrade/billing route), creative
 *      distribution bars, trending keywords (decorative chips), 6-tile
 *      quick-action grid (modes, each a real Link into
 *      /iq/genie6/studio-alpha?mode=…, mirroring ModeLauncherBar)
 *   3. Main column       — functional 7D / 14D / 22D time-range chips that
 *      re-slice the hero series, borderless hero LineChart pinned to a fixed
 *      snapshot date, full-width "Recent activity" table (round-robin merge
 *      of activity + recentWork + newAdsFetched, truncated to 10 rows so
 *      every source shows up)
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import { ArrowDownRight, ArrowUpRight, Zap } from "lucide-react";
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
// Palette (literal — FabFunnel DS v1.2 dark-mode token values, hardcoded)
// ─────────────────────────────────────────────────────────────────────────
const BG = "#121212"; // --background
const CARD_BG = "#1c1c1c"; // --card
const CARD_BORDER = "#2a2a2a";
const ROW_BORDER = "#1f1f1f"; // row/section dividers, axis + grid lines
const SPOTLIGHT = "#1B1B1F"; // progress-bar wells / table thead bg
const TEXT = "rgba(255,255,255,.92)";
const TEXT_MUTED = "rgba(255,255,255,.62)";
const TEXT_DIM = "rgba(255,255,255,.55)"; // tertiary
const LIME = "#90BA24"; // accent FILL/stroke (chart line, progress fills, icons)
const LIME_TEXT = "#C3E165"; // lime-as-TEXT (chart tooltip/floating badge values)
const SUCCESS_TEXT = "#49aa19"; // positive delta text
const ERROR_TEXT = "#f37370"; // negative delta text / negative minispark stroke
const WARNING_TEXT = "#d89614"; // pending/queued status text
const BTN_FG = "#121212"; // primary button text-on-lime

const SNAPSHOT_DATE = new Date("2026-07-10");

const RANGE_CHIPS = ["7D", "14D", "22D"] as const;
type RangeKey = (typeof RANGE_CHIPS)[number];
const RANGE_TO_DAYS: Record<RangeKey, number> = { "7D": 7, "14D": 14, "22D": 22 };

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
  /** Entity TYPE (Brand/Competitor/Category) — never a status; rendered as
   *  a separate neutral chip in the Detail column. See buildActivityRows. */
  typeTag?: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

/** Mix LIME → dim-gray across `count` steps (used for distribution bars). */
function greenToGray(index: number, count: number): string {
  const t = count <= 1 ? 0 : index / (count - 1);
  const from = { r: 0x90, g: 0xba, b: 0x24 };
  const to = { r: 0x6b, g: 0x6f, b: 0x76 };
  const r = Math.round(from.r + (to.r - from.r) * t);
  const g = Math.round(from.g + (to.g - from.g) * t);
  const b = Math.round(from.b + (to.b - from.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

type PillVariant = "success" | "error" | "warning" | "info" | "neutral";

const PILL_VARIANT_CLASS: Record<PillVariant, string> = {
  success: "border-[#49aa19]/30 bg-[#49aa19]/10 text-[#49aa19]",
  error: "border-[#f37370]/30 bg-[#f37370]/10 text-[#f37370]",
  warning: "border-[#d89614]/30 bg-[#d89614]/10 text-[#d89614]",
  info: "border-white/15 bg-white/[0.08] text-white/70",
  neutral: "border-white/15 bg-white/[0.08] text-white/60",
};

/**
 * Closed status→(label, pill variant) lookup for the activity table — a
 * fixed set of 5 variants, not a fuzzy substring match. "destructive" (a
 * routine profile-removal audit log) intentionally maps to NEUTRAL, not
 * error: red is reserved for genuine failures.
 */
const STATUS_META: Record<string, { label: string; variant: PillVariant }> = {
  destructive: { label: "Removed", variant: "neutral" },
  failed: { label: "Failed", variant: "error" },
  error: { label: "Failed", variant: "error" },
  declined: { label: "Declined", variant: "error" },
  "in-progress": { label: "In progress", variant: "info" },
  queued: { label: "Queued", variant: "warning" },
  success: { label: "Done", variant: "success" },
  done: { label: "Done", variant: "success" },
  completed: { label: "Done", variant: "success" },
  active: { label: "Active", variant: "success" },
  live: { label: "Live", variant: "success" },
  delivered: { label: "Delivered", variant: "success" },
  info: { label: "Info", variant: "info" },
  fetched: { label: "Fetched", variant: "neutral" },
};

function statusMeta(status: string): { label: string; variant: PillVariant } {
  return STATUS_META[status.toLowerCase()] ?? { label: status, variant: "neutral" };
}

/** DS pill recipe: 10% alpha status fill + 30% alpha border + -text token text. */
function statusPillClass(variant: PillVariant): string {
  return cn(
    "rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide",
    PILL_VARIANT_CLASS[variant],
  );
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
      <path
        d={d}
        fill="none"
        stroke={positive ? LIME : ERROR_TEXT}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
      className={cn("rounded-2xl p-4", className)}
      style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
    >
      {title && (
        <h3
          className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.05em]"
          style={{ color: TEXT_DIM }}
        >
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
            className="inline-flex min-w-[46px] items-center justify-end gap-0.5 font-mono text-[10px] font-medium tabular-nums"
            style={{ color: delta.isDown ? ERROR_TEXT : SUCCESS_TEXT }}
          >
            {delta.isDown ? (
              <ArrowDownRight className="h-3 w-3 shrink-0" aria-hidden />
            ) : (
              <ArrowUpRight className="h-3 w-3 shrink-0" aria-hidden />
            )}
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
    <div className="rounded-2xl p-4" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
      <div className="mb-2 flex items-center gap-1.5">
        <Zap className="h-3 w-3" style={{ color: LIME }} strokeWidth={2.5} aria-hidden />
        <span
          className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em]"
          style={{ color: TEXT_DIM }}
        >
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
      <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: SPOTLIGHT }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(Math.max(pct, 0), 100)}%`, backgroundColor: LIME }}
        />
      </div>
      <p className="mb-3 font-mono text-[10px] tabular-nums" style={{ color: TEXT_MUTED }}>
        est. burn ≈{burnPerDay}/day · ~{daysLeft}d left
      </p>
      {/* Real upgrade/billing route — mirrors UpsellCornerPill.tsx's CTA,
          demoted to secondary since "New Launch" is the single primary CTA. */}
      <Link
        to="/plans-v2?tier=growth&view=trial"
        className="fab-focus flex w-full items-center justify-center rounded-full border bg-transparent py-2 text-[12px] font-medium transition-colors hover:bg-[#C3E165]/10"
        style={{ borderColor: `${LIME_TEXT}66`, color: LIME_TEXT }}
      >
        Add Credits
      </Link>
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
              <div className="h-1 w-full overflow-hidden rounded-full" style={{ backgroundColor: SPOTLIGHT }}>
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
        {modes.map((m) => {
          // Mirrors ModeLauncherBar.tsx: /iq/genie6/studio-alpha?mode=<OUTSIDE_CTAS id>,
          // with "variation" appending &skipGate=1 (skipGate: true on that CTA).
          const dest = `/iq/genie6/studio-alpha?mode=${m.key}${m.key === "variation" ? "&skipGate=1" : ""}`;
          return (
            <Link
              key={m.key}
              to={dest}
              className="fab-focus flex flex-col items-start gap-0.5 rounded-lg p-2.5 text-left transition-colors hover:bg-white/[0.03]"
              style={{ border: `1px solid ${ROW_BORDER}` }}
            >
              <span className="text-[11px] font-semibold" style={{ color: TEXT }}>
                {m.label}
              </span>
              <span className="text-[11px] leading-tight" style={{ color: TEXT_DIM }}>
                {m.desc}
              </span>
            </Link>
          );
        })}
      </div>
    </Panel>
  );
}

function TimeRangeChips({ value, onChange }: { value: RangeKey; onChange: (next: RangeKey) => void }) {
  return (
    <div className="flex items-center gap-5">
      {RANGE_CHIPS.map((chip) => {
        const active = value === chip;
        return (
          <button
            key={chip}
            type="button"
            onClick={() => onChange(chip)}
            aria-pressed={active}
            className="fab-focus inline-flex min-h-[24px] items-center px-0.5 pb-1.5 font-mono text-[11px] uppercase tracking-wide transition-colors"
            style={{
              color: active ? TEXT : TEXT_DIM,
              borderBottom: active ? `2px solid ${LIME}` : "2px solid transparent",
            }}
          >
            {chip}
          </button>
        );
      })}
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
      <div className="font-semibold tabular-nums" style={{ color: LIME_TEXT }}>
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
      const d = new Date(SNAPSHOT_DATE);
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
    <div className="rounded-2xl transition-transform duration-[220ms] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
      <div
        className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.05em]"
        style={{ color: TEXT_DIM }}
      >
        Activity trend
      </div>
      <div className="mb-1 flex items-baseline gap-2">
        <span className="font-mono text-[22px] font-bold tabular-nums" style={{ color: TEXT }}>
          {last.value}
        </span>
        <span className="text-[11px]" style={{ color: TEXT_DIM }}>
          latest · indexed
        </span>
      </div>
      <p className="mb-3 text-[11px]" style={{ color: TEXT_DIM }}>
        indexed · last {data.length} days
      </p>
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
              stroke={LIME}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: LIME, stroke: BG, strokeWidth: 2 }}
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
            style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}`, color: LIME_TEXT }}
          >
            {last.value}
          </div>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: LIME, boxShadow: `0 0 0 3px ${LIME}33` }} />
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
    // Every fetched-ad row is just "Fetched" — `f.status` on the raw data is
    // actually an entity TYPE (Brand/Competitor/Category), surfaced below as
    // `typeTag` instead of misrepresented as a status.
    status: "fetched",
    typeTag: f.status,
  }));
  return interleave(fromActivity, fromWork, fromFetched).slice(0, 10);
}

function ActivityTable({ rows }: { rows: MergedRow[] }) {
  return (
    <div>
      <h2 className="mb-4 text-[20px] font-bold tracking-[-0.01em]" style={{ color: TEXT }}>
        Recent activity
      </h2>
      <div
        className="overflow-hidden rounded-2xl border transition-all duration-[220ms] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
        style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ backgroundColor: SPOTLIGHT }}>
                {["Time", "Type", "Item", "Detail", "Status"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="whitespace-nowrap px-3.5 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: TEXT_DIM, borderBottom: `1px solid ${ROW_BORDER}` }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const meta = statusMeta(r.status);
                return (
                  <tr
                    key={r.id}
                    className="transition-colors hover:bg-white/[0.02]"
                    style={{ borderBottom: `1px solid ${ROW_BORDER}` }}
                  >
                    <td
                      className="whitespace-nowrap px-3.5 py-3.5 font-mono text-[13px] tabular-nums"
                      style={{ color: TEXT_MUTED }}
                    >
                      {r.time}
                    </td>
                    <td className="whitespace-nowrap px-3.5 py-3.5 text-[13px]" style={{ color: TEXT_MUTED }}>
                      {r.type}
                    </td>
                    <td className="px-3.5 py-3.5 text-[13px] font-medium" style={{ color: TEXT }}>
                      {r.item}
                    </td>
                    <td className="px-3.5 py-3.5 text-[13px]" style={{ color: TEXT_DIM }}>
                      {r.detail}
                      {r.typeTag && (
                        <span
                          className="ml-1.5 inline-block rounded-full border border-white/15 bg-white/[0.06] px-1.5 py-0.5 align-middle font-mono text-[10px] uppercase tracking-wide"
                          style={{ color: TEXT_DIM }}
                        >
                          {r.typeTag}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3.5 py-3.5">
                      <span className={statusPillClass(meta.variant)}>{meta.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function HeaderBar({ userName }: { userName: string }) {
  return (
    <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${ROW_BORDER}` }}>
      <h1 className="text-[15px] font-bold tracking-[-0.01em]" style={{ color: TEXT }}>
        FABADS
      </h1>
      <div className="flex items-center gap-4">
        <span className="text-[13px]" style={{ color: TEXT_MUTED }}>
          Hi, <span style={{ color: TEXT }}>{userName}</span>
        </span>
        <Link
          to="/launchv2/new"
          className="fab-focus rounded-full px-4 py-2 text-[13px] font-medium"
          style={{ backgroundColor: LIME, color: BTN_FG }}
        >
          New Launch
        </Link>
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

  const [range, setRange] = useState<RangeKey>("22D");

  const windowedSeries = useMemo(() => {
    const n = RANGE_TO_DAYS[range];
    return sparkSeries.slice(-n);
  }, [sparkSeries, range]);

  const activityRows = useMemo(
    () => buildActivityRows(activity, recentWork, newAdsFetched),
    [activity, recentWork, newAdsFetched],
  );

  return (
    <div className="h-full min-h-0 w-full overflow-y-auto font-sans" style={{ backgroundColor: BG, color: TEXT }}>
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
          <TimeRangeChips value={range} onChange={setRange} />
          <HeroChart sparkSeries={windowedSeries} />
          <ActivityTable rows={activityRows} />
        </main>
      </div>
    </div>
  );
}
