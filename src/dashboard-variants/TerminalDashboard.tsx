import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getDashboardVariantData } from "./variantData";
import VariantSwitcher from "./VariantSwitcher";

/**
 * TERMINAL — instrument-console dashboard variant.
 *
 * Design language: NASA console / file-transfer window. One bordered grid,
 * subdivided purely by 1px hairlines (no gaps, no radius, no shadows).
 * Gold (#E3C229) is the only accent. Everything renders in Geist Mono.
 */

// ---------------------------------------------------------------------------
// Local types (mirror the shared variantData contract; kept defensive since
// this file may compile before ./variantData exists — see task notes).
// ---------------------------------------------------------------------------

type KpiPoint = {
  key: string;
  label: string;
  value: string | number;
  delta?: string | number;
  deltaDir?: "up" | "down" | "flat" | string;
  spark?: number[];
};

type CreditsInfo = {
  used: number;
  total: number;
  pct: number;
  burnPerDay?: number;
  daysLeft?: number;
};

type CreativeSlice = { name: string; value: number };

type ModeItem = { key: string; label: string; desc?: string };

type ListItem = {
  id: string | number;
  title: string;
  sub?: string;
  time?: string;
  status?: string;
};

type ActivityItem = {
  id: string | number;
  text: string;
  time: string;
  kind: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function formatClock(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}:${pad(d.getSeconds())}`;
}

function deltaMeta(
  delta?: string | number,
  deltaDir?: string,
): { text: string; arrow: string; notable: boolean } | null {
  if (delta === undefined || delta === null || delta === "") return null;
  const isNum = typeof delta === "number";
  const raw = String(delta);
  const numeric = parseFloat(raw.replace(/[^0-9.-]/g, ""));
  const dir = deltaDir ?? (Number.isFinite(numeric) ? (numeric < 0 ? "down" : "up") : "flat");
  const arrow = dir === "down" ? "▼" : dir === "up" ? "▲" : "•";
  const notable = Number.isFinite(numeric) ? Math.abs(numeric) >= 5 : true;
  const hasSign = /^[+-]/.test(raw.trim());
  const text = hasSign ? raw : isNum && Number(delta) >= 0 ? `+${raw}` : raw;
  return { text, arrow, notable };
}

// ---------------------------------------------------------------------------
// Instrument primitives
// ---------------------------------------------------------------------------

function AsciiBar({ pct, width = 12 }: { pct: number; width?: number }) {
  const p = clampPct(pct);
  const filled = Math.round((p / 100) * width);
  const empty = Math.max(0, width - filled);
  return (
    <span className="whitespace-pre text-[12px] leading-none">
      <span className="text-[#E3C229]">{"▮".repeat(filled)}</span>
      <span className="text-[#3A3A38]">{"▯".repeat(empty)}</span>
    </span>
  );
}

function RadialGauge({ pct, size = 84 }: { pct: number; size?: number }) {
  const ticks = 24;
  const active = Math.max(0, Math.min(ticks, Math.round((clampPct(pct) / 100) * ticks)));
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 4;
  const rInner = rOuter - 9;
  const lines = Array.from({ length: ticks }, (_, i) => {
    const angle = -90 + i * (360 / ticks);
    const rad = (angle * Math.PI) / 180;
    return {
      x1: cx + rInner * Math.cos(rad),
      y1: cy + rInner * Math.sin(rad),
      x2: cx + rOuter * Math.cos(rad),
      y2: cy + rOuter * Math.sin(rad),
      on: i < active,
    };
  });
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {lines.map((l, i) => (
          <line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke={l.on ? "#E3C229" : "#333333"}
            strokeWidth={2}
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[14px] leading-none text-[#F2F2EE]">{Math.round(clampPct(pct))}%</span>
      </div>
    </div>
  );
}

function Sparkline({
  data,
  width = 560,
  height = 64,
  showNow = true,
}: {
  data: number[];
  width?: number;
  height?: number;
  showNow?: boolean;
}) {
  const values = data && data.length > 0 ? data : [0, 0];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / Math.max(1, values.length - 1);
  const pts: Array<[number, number]> = values.map((v, i) => [
    i * stepX,
    height - ((v - min) / range) * height,
  ]);
  const stepped: Array<[number, number]> = [];
  pts.forEach((p, i) => {
    if (i === 0) {
      stepped.push(p);
    } else {
      stepped.push([p[0], pts[i - 1][1]]);
      stepped.push(p);
    }
  });
  const pointsAttr = stepped.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="block">
      <polyline points={pointsAttr} fill="none" stroke="#E3C229" strokeWidth={1} strokeDasharray="1 2" />
      {showNow && last && <circle cx={last[0]} cy={last[1]} r={2.5} fill="#E3C229" />}
    </svg>
  );
}

function Cell({
  area,
  label,
  emphasis,
  className,
  children,
}: {
  area: string;
  label?: string;
  emphasis?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      style={{ gridArea: area }}
      className={`${emphasis ? "bg-[#111110]" : "bg-[#0C0C0C]"} overflow-hidden p-4 ${className ?? ""}`}
    >
      {label && <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[#7A7A74]">{label}</div>}
      {children}
    </div>
  );
}

function KpiRow({ kpis }: { kpis: KpiPoint[] }) {
  if (kpis.length === 0) {
    return <div className="bg-[#0C0C0C] p-3 text-[11px] text-[#7A7A74]">NO SIGNAL</div>;
  }
  return (
    <div className="grid gap-px bg-[#2A2A28]" style={{ gridTemplateColumns: `repeat(${kpis.length}, 1fr)` }}>
      {kpis.map((kpi) => {
        const dm = deltaMeta(kpi.delta, kpi.deltaDir);
        return (
          <div key={kpi.key} className="bg-[#0C0C0C] p-3">
            <div className="text-[10px] uppercase tracking-[0.16em] text-[#7A7A74]">{kpi.label}</div>
            <div className="mt-1 truncate text-[26px] leading-none text-[#F2F2EE]">{kpi.value}</div>
            {dm && (
              <div className={`mt-1 text-[11px] ${dm.notable ? "text-[#E3C229]" : "text-[#7A7A74]"}`}>
                {dm.arrow} {dm.text}
              </div>
            )}
            {kpi.spark && kpi.spark.length > 1 && (
              <div className="mt-2">
                <Sparkline data={kpi.spark} width={140} height={22} showNow={false} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FeedGroup({ title, items }: { title: string; items: ListItem[] }) {
  return (
    <div>
      <div className="mb-1 text-[10px] uppercase tracking-[0.14em] text-[#7A7A74]">{title}</div>
      {items.length === 0 && <div className="pb-2 text-[11px] text-[#7A7A74]">NO ITEMS</div>}
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-baseline gap-3 border-b border-[#1E1E1C] py-1.5 text-[11px] last:border-b-0"
        >
          <span className="w-14 shrink-0 text-[#7A7A74]">{item.time ?? "--:--"}</span>
          <span className="w-20 shrink-0 truncate uppercase text-[#7A7A74]">{item.status ?? "—"}</span>
          <span className="truncate text-[#B8B8B2]">
            {item.title}
            {item.sub ? <span className="text-[#7A7A74]"> — {item.sub}</span> : null}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function TerminalDashboard() {
  const [tick, setTick] = useState(0);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const data = useMemo(() => getDashboardVariantData(), [tick]);

  const userName: string = data?.userName ?? "OPERATOR";
  const genieKpis: KpiPoint[] = data?.genieKpis ?? [];
  const industryKpis: KpiPoint[] = data?.industryKpis ?? [];
  const credits: CreditsInfo | undefined = data?.credits;
  const creativeDistribution: CreativeSlice[] = data?.creativeDistribution ?? [];
  const trendingKeywords: string[] = data?.trendingKeywords ?? [];
  const modes: ModeItem[] = data?.modes ?? [];
  const recentlyFetched: ListItem[] = data?.recentlyFetched ?? [];
  const newAdsFetched: ListItem[] = data?.newAdsFetched ?? [];
  const recentWork: ListItem[] = data?.recentWork ?? [];
  const activity: ActivityItem[] = data?.activity ?? [];
  const sparkSeries: number[] = data?.sparkSeries ?? [];

  const creditsPct = clampPct(
    credits?.pct ?? (credits?.total ? (credits.used / credits.total) * 100 : 0),
  );
  const creativeTotal = creativeDistribution.reduce((sum, s) => sum + (s.value || 0), 0);
  const metricsTracked = genieKpis.length + industryKpis.length;
  const queueTotal = recentlyFetched.length + newAdsFetched.length + recentWork.length;

  return (
    <div className="h-full min-h-0 w-full overflow-y-auto bg-[#0C0C0C] font-mono text-[#F2F2EE]">
      <style>{`
        @keyframes terminalCursorBlink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
        .term-cursor { animation: terminalCursorBlink 1s steps(2, start) infinite; }
      `}</style>

      <div className="flex justify-end px-6 pt-6 md:px-10">
        <VariantSwitcher current="terminal" />
      </div>

      <div className="px-6 py-6 md:px-10 md:py-8">
        <div className="mx-auto w-full max-w-[1200px] overflow-x-auto">
          <div className="border border-[#2A2A28]" style={{ minWidth: 960 }}>
            <div
              className="grid gap-px bg-[#2A2A28]"
              style={{
                gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1.3fr",
                gridTemplateAreas: `
                  "greet    greet    time     hdract   loghead"
                  "genierow genierow genierow genierow log"
                  "indrow   indrow   indrow   indrow   log"
                  "credits  credits  creative keywords log"
                  "spark    spark    spark    spark    log"
                  "modes    modes    recent   recent   log"
                  "foot1    foot2    foot2    foot3    log"
                `,
              }}
            >
              {/* Header row */}
              <Cell area="greet" label="OPERATOR">
                <div className="text-[18px] text-[#F2F2EE] md:text-[20px]">
                  WELCOME, {userName.toUpperCase()} <span className="term-cursor">▊</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-[#7A7A74]">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#E3C229]" />
                  LINK STABLE · SESSION {String(tick + 1).padStart(2, "0")}
                </div>
              </Cell>

              <Cell area="time" label="SYS CLOCK">
                <div className="text-[18px] text-[#F2F2EE] md:text-[20px]">{formatClock(now)}</div>
                <div className="mt-2 text-[11px] text-[#7A7A74]">LOCAL TIME</div>
              </Cell>

              <Cell area="hdract" label="CONTROL">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTick((t) => t + 1)}
                    className="border border-[#4A4A46] px-4 py-1.5 text-[11px] uppercase tracking-[0.14em] text-[#F2F2EE] hover:bg-[#1A1A18]"
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
                    className="border border-[#4A4A46] px-4 py-1.5 text-[11px] uppercase tracking-[0.14em] text-[#F2F2EE] hover:bg-[#1A1A18]"
                  >
                    Reports
                  </button>
                </div>
              </Cell>

              <Cell area="loghead">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-[#7A7A74]">Log</span>
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#E3C229]" />
                </div>
              </Cell>

              {/* KPI rows */}
              <Cell area="genierow" className="p-0">
                <div className="p-4 pb-0">
                  <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[#7A7A74]">Genie · Metrics</div>
                </div>
                <KpiRow kpis={genieKpis} />
              </Cell>

              <Cell area="indrow" className="p-0">
                <div className="p-4 pb-0">
                  <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[#7A7A74]">
                    Industry · Benchmarks
                  </div>
                </div>
                <KpiRow kpis={industryKpis} />
              </Cell>

              {/* Instruments */}
              <Cell area="credits" label="Credits">
                <div className="flex items-center gap-4">
                  <RadialGauge pct={creditsPct} size={80} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[22px] leading-none text-[#F2F2EE]">
                      {credits?.used ?? 0}
                      <span className="text-[14px] text-[#7A7A74]"> / {credits?.total ?? 0}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <AsciiBar pct={creditsPct} width={14} />
                      <span className="text-[11px] text-[#7A7A74]">{Math.round(creditsPct)}%</span>
                    </div>
                    <div className="mt-2 text-[11px] text-[#7A7A74]">
                      BURN {credits?.burnPerDay ?? 0}/D · EST. TO CAP {credits?.daysLeft ?? "--"}D
                    </div>
                  </div>
                </div>
              </Cell>

              <Cell area="creative" label="Creative Mix">
                <div className="space-y-2">
                  {creativeDistribution.length === 0 && (
                    <div className="text-[11px] text-[#7A7A74]">NO DATA</div>
                  )}
                  {creativeDistribution.map((slice) => {
                    const pct = creativeTotal > 0 ? (slice.value / creativeTotal) * 100 : 0;
                    return (
                      <div key={slice.name} className="flex items-center justify-between gap-3 text-[11px]">
                        <span className="w-20 shrink-0 truncate text-[#B8B8B2]">{slice.name}</span>
                        <AsciiBar pct={pct} width={10} />
                        <span className="w-9 shrink-0 text-right text-[#7A7A74]">{Math.round(pct)}%</span>
                      </div>
                    );
                  })}
                </div>
              </Cell>

              <Cell area="keywords" label="Trending">
                <div className="flex flex-wrap gap-x-2 gap-y-1 text-[12px]">
                  {trendingKeywords.length === 0 && (
                    <span className="text-[11px] text-[#7A7A74]">NO SIGNAL</span>
                  )}
                  {trendingKeywords.map((kw, i) => (
                    <span key={`${kw}-${i}`} className={i < 2 ? "text-[#E3C229]" : "text-[#B8B8B2]"}>
                      [{kw}]
                    </span>
                  ))}
                </div>
              </Cell>

              {/* Sparkline */}
              <Cell area="spark" label="Spark · Series">
                <div className="flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <Sparkline data={sparkSeries} width={720} height={64} />
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-[#7A7A74]">Now</div>
                    <div className="text-[26px] leading-none text-[#F2F2EE]">
                      {sparkSeries.length > 0 ? sparkSeries[sparkSeries.length - 1] : 0}
                    </div>
                  </div>
                </div>
              </Cell>

              {/* Actions + recent work */}
              <Cell area="modes" label="Actions">
                <div className="flex max-h-[360px] flex-col gap-2 overflow-y-auto pr-1">
                  {modes.length === 0 && <div className="text-[11px] text-[#7A7A74]">NO MODES</div>}
                  {modes.map((mode) => (
                    <button
                      key={mode.key}
                      type="button"
                      className="border border-[#4A4A46] px-3 py-2 text-left hover:bg-[#1A1A18]"
                    >
                      <div className="text-[11px] uppercase tracking-[0.14em] text-[#F2F2EE]">{mode.label}</div>
                      {mode.desc && <div className="mt-0.5 text-[10px] text-[#7A7A74]">{mode.desc}</div>}
                    </button>
                  ))}
                </div>
              </Cell>

              <Cell area="recent" label="Queue">
                <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                  <FeedGroup title="Recently Fetched" items={recentlyFetched} />
                  <FeedGroup title="New Ads Fetched" items={newAdsFetched} />
                  <FeedGroup title="Recent Work" items={recentWork} />
                </div>
              </Cell>

              {/* Tall log column */}
              <Cell area="log" className="p-0">
                <div className="max-h-[640px] overflow-y-auto p-4">
                  {activity.length === 0 && <div className="text-[11px] text-[#7A7A74]">NO ACTIVITY</div>}
                  {activity.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-baseline gap-3 border-b border-[#1E1E1C] py-1.5 text-[11px] last:border-b-0"
                    >
                      <span className="w-10 shrink-0 text-[#7A7A74]">{a.time}</span>
                      <span className="w-16 shrink-0 truncate uppercase text-[#7A7A74]">{a.kind}</span>
                      <span className="truncate text-[#B8B8B2]">{a.text}</span>
                    </div>
                  ))}
                </div>
              </Cell>

              {/* Footer strip */}
              <Cell area="foot1" className="py-2">
                <span className="text-[10px] uppercase tracking-[0.14em] text-[#7A7A74]">
                  {String(queueTotal).padStart(3, "0")} Launches
                </span>
              </Cell>
              <Cell area="foot2" className="py-2">
                <span className="text-[10px] uppercase tracking-[0.14em] text-[#7A7A74]">
                  {creativeDistribution.length} Creative Segments · {metricsTracked} Metrics Tracked
                </span>
              </Cell>
              <Cell area="foot3" className="py-2">
                <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-[#E3C229]">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#E3C229]" />
                  Sys Nominal
                </span>
              </Cell>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
