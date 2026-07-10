import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  Zap,
  Users,
  Layers,
  Gauge,
  Image as ImageIcon,
  Video,
  Search,
  Rocket,
  Wand2,
  Sparkles,
  Clock,
  BarChart3,
  Flame,
  CalendarClock,
  Activity as ActivityIcon,
} from "lucide-react";
import { getDashboardVariantData } from "./variantData";
import VariantSwitcher from "./VariantSwitcher";

/**
 * Local mirror of the shared variantData contract. Kept local (rather than
 * imported) so this file has zero type-level dependency on variantData's
 * internal exports — only the `getDashboardVariantData()` value import is
 * shared, per the cross-agent contract.
 */
interface KpiItem {
  key: string;
  label: string;
  value: string | number;
  delta?: string | number;
  deltaDir?: "up" | "down";
  spark?: number[];
}

interface ListItem {
  id: string;
  title: string;
  sub: string;
  time?: string;
  status?: string;
}

interface ActivityItem {
  id: string;
  text: string;
  time: string;
  kind: string;
}

interface ModeItem {
  key: string;
  label: string;
  desc: string;
}

interface DistItem {
  name: string;
  value: number;
}

interface CreditsInfo {
  used: number;
  total: number;
  pct: number;
  burnPerDay: number;
  daysLeft: number;
}

interface DashboardVariantData {
  userName: string;
  genieKpis: KpiItem[];
  industryKpis: KpiItem[];
  credits: CreditsInfo;
  creativeDistribution: DistItem[];
  trendingKeywords: string[];
  modes: ModeItem[];
  recentlyFetched: ListItem[];
  newAdsFetched: ListItem[];
  recentWork: ListItem[];
  activity: ActivityItem[];
  sparkSeries: number[];
}

/* ---------------------------------- helpers ---------------------------------- */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function splitValue(value: string | number): { num: string; unit: string } {
  const str = String(value);
  const match = str.match(/^(-?[\d,.]+)(.*)$/);
  if (!match) return { num: str, unit: "" };
  return { num: match[1], unit: match[2] };
}

function statusTone(status: string): string {
  return /risk|pause|fail|declin|warn/i.test(status) ? "text-[#C96F2E]" : "text-[#8D8B86]";
}

function isActiveKind(kind: string): boolean {
  return /active|live|running|progress/i.test(kind);
}

function pickKpiIcon(key: string, label: string): LucideIcon {
  const s = `${key} ${label}`.toLowerCase();
  if (/roas|return|revenue/.test(s)) return TrendingUp;
  if (/spend|budget|cost|cpc|cpm/.test(s)) return Wallet;
  if (/ctr|click|conversion/.test(s)) return Target;
  if (/reach|impress|frequency/.test(s)) return Zap;
  if (/follow|audience|user/.test(s)) return Users;
  if (/creative|asset|layer/.test(s)) return Layers;
  return Gauge;
}

function pickModeIcon(key: string, label: string): LucideIcon {
  const s = `${key} ${label}`.toLowerCase();
  if (/image|creative|design/.test(s)) return ImageIcon;
  if (/video/.test(s)) return Video;
  if (/keyword|search|discover/.test(s)) return Search;
  if (/competitor|audience|scan/.test(s)) return Users;
  if (/launch|campaign|publish/.test(s)) return Rocket;
  if (/audit|insight|report/.test(s)) return Layers;
  if (/magic|genie|ai|auto/.test(s)) return Wand2;
  return Sparkles;
}

/* ------------------------------ small subcomponents --------------------------- */

function SectionLabel({ children }: { children: string }) {
  return (
    <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#8D8B86]">
      {children}
    </span>
  );
}

function Sparkline({
  data,
  stroke = "#2A2925",
  opacity = 0.6,
  width = 48,
  height = 22,
}: {
  data: number[];
  stroke?: string;
  opacity?: number;
  width?: number;
  height?: number;
}) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / range) * height}`)
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0 overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeOpacity={opacity}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function KpiTile({ item, icon: Icon, accent }: { item: KpiItem; icon: LucideIcon; accent?: boolean }) {
  const { num, unit } = splitValue(item.value);
  const hasDelta = item.delta !== undefined && item.delta !== null && item.delta !== "";
  const DeltaIcon = item.deltaDir === "down" ? TrendingDown : TrendingUp;
  return (
    <div className="flex min-h-[136px] flex-col justify-between rounded-[20px] bg-[#E4E2DF] p-5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#8D8B86]">
          {item.label}
        </span>
        <Icon size={16} strokeWidth={1.5} className="text-[#8D8B86]" />
      </div>
      <div className="mt-5 flex items-end justify-between gap-2">
        <div>
          <div className="text-[28px] font-semibold leading-none tabular-nums">
            {num}
            {unit && <span className="ml-0.5 text-[15px] font-medium text-[#A3A19B]">{unit}</span>}
          </div>
          {hasDelta && (
            <div
              className={`mt-2 inline-flex items-center gap-1 text-[12px] font-medium ${
                accent ? "text-[#C96F2E]" : "text-[#8D8B86]"
              }`}
            >
              <DeltaIcon size={12} strokeWidth={2} />
              <span>{item.delta}</span>
            </div>
          )}
        </div>
        {item.spark && item.spark.length > 1 && <Sparkline data={item.spark} width={40} height={20} />}
      </div>
    </div>
  );
}

function DistributionRing({ data, maxIdx, total }: { data: DistItem[]; maxIdx: number; total: number }) {
  const size = 104;
  const strokeW = 10;
  const radius = (size - strokeW) / 2;
  const circumference = 2 * Math.PI * radius;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#2A2925" strokeOpacity={0.08} strokeWidth={strokeW} />
      {data.map((d, i) => {
        const frac = total > 0 ? d.value / total : 0;
        const dash = frac * circumference;
        const gap = circumference - dash;
        const isMax = i === maxIdx;
        const el = (
          <circle
            key={d.name}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={isMax ? "#C96F2E" : "#2A2925"}
            strokeOpacity={isMax ? 1 : Math.max(0.25, 0.85 - i * 0.16)}
            strokeWidth={strokeW}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-acc}
            strokeLinecap="butt"
          />
        );
        acc += dash;
        return el;
      })}
    </svg>
  );
}

function DistributionTile({ data }: { data: DistItem[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const maxIdx = data.reduce((best, d, i, arr) => (d.value > arr[best].value ? i : best), 0);
  return (
    <div className="rounded-[20px] bg-[#E4E2DF] p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#8D8B86]">
          Creative distribution
        </span>
        <BarChart3 size={16} strokeWidth={1.5} className="text-[#8D8B86]" />
      </div>
      <div className="flex items-center gap-6">
        <DistributionRing data={data} maxIdx={maxIdx} total={total} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center justify-between gap-2 text-[12px]">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    background: i === maxIdx ? "#C96F2E" : "#2A2925",
                    opacity: i === maxIdx ? 1 : Math.max(0.25, 0.85 - i * 0.16),
                  }}
                />
                <span className="truncate">{d.name}</span>
              </span>
              <span className="shrink-0 tabular-nums text-[#8D8B86]">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KeywordsTile({ keywords }: { keywords: string[] }) {
  return (
    <div className="rounded-[20px] bg-[#E4E2DF] p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#8D8B86]">
          Trending keywords
        </span>
        <Flame size={16} strokeWidth={1.5} className="text-[#8D8B86]" />
      </div>
      <div className="flex flex-wrap gap-2">
        {keywords.map((kw) => (
          <span key={kw} className="rounded-full bg-[#D8D6D2] px-2.5 py-1 text-[11px] font-medium text-[#2A2925]">
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}

function ModeTile({ mode }: { mode: ModeItem }) {
  const Icon = pickModeIcon(mode.key, mode.label);
  return (
    <div
      title={mode.desc}
      className="flex cursor-default flex-col items-center justify-center gap-2 rounded-[20px] bg-[#E4E2DF] p-4 text-center transition-colors hover:bg-[#DDDBD7]"
    >
      <Icon size={18} strokeWidth={1.5} className="text-[#2A2925]" />
      <span className="text-[12px] font-medium leading-tight">{mode.label}</span>
    </div>
  );
}

function RecentListsTile({
  fetched,
  newAds,
  work,
}: {
  fetched: ListItem[];
  newAds: ListItem[];
  work: ListItem[];
}) {
  type TabKey = "fetched" | "newAds" | "work";
  const [tab, setTab] = useState<TabKey>("fetched");
  const tabs: { key: TabKey; label: string; items: ListItem[] }[] = [
    { key: "fetched", label: "Fetched", items: fetched },
    { key: "newAds", label: "New ads", items: newAds },
    { key: "work", label: "Recent work", items: work },
  ];
  const active = tabs.find((t) => t.key === tab) ?? tabs[0];
  return (
    <div className="flex flex-col rounded-[20px] bg-[#E4E2DF] p-5">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`border-b-[1.5px] pb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors ${
                tab === t.key
                  ? "border-[#2A2925] text-[#2A2925]"
                  : "border-transparent text-[#8D8B86] hover:text-[#2A2925]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Clock size={16} strokeWidth={1.5} className="shrink-0 text-[#8D8B86]" />
      </div>
      <div className="flex flex-col">
        {active.items.length === 0 && (
          <p className="py-6 text-center text-[12px] text-[#8D8B86]">Nothing here yet.</p>
        )}
        {active.items.map((item, idx) => (
          <div
            key={item.id}
            className={`flex items-center justify-between gap-3 py-2.5 ${
              idx !== active.items.length - 1 ? "border-b border-[#D8D6D2]" : ""
            }`}
          >
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium">{item.title}</p>
              <p className="truncate text-[12px] text-[#8D8B86]">{item.sub}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5 pl-2">
              {item.time && <span className="text-[11px] text-[#8D8B86]">{item.time}</span>}
              {item.status && (
                <span className={`text-[11px] font-medium ${statusTone(item.status)}`}>{item.status}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityTile({ activity }: { activity: ActivityItem[] }) {
  return (
    <div className="flex flex-col rounded-[20px] bg-[#E4E2DF] p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#8D8B86]">Activity</span>
        <ActivityIcon size={16} strokeWidth={1.5} className="text-[#8D8B86]" />
      </div>
      <div className="flex flex-col">
        {activity.length === 0 && (
          <p className="py-6 text-center text-[12px] text-[#8D8B86]">No activity yet.</p>
        )}
        {activity.map((a, idx) => {
          const isActive = isActiveKind(a.kind) || idx === 0;
          return (
            <div
              key={a.id}
              className={`flex items-start gap-2.5 py-2.5 ${
                idx !== activity.length - 1 ? "border-b border-[#D8D6D2]" : ""
              }`}
            >
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: isActive ? "#C96F2E" : "#8D8B86" }}
              />
              <p className="flex-1 text-[13px] leading-snug">{a.text}</p>
              <span className="shrink-0 text-[11px] text-[#8D8B86]">{a.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------ page ------------------------------------ */

export default function TonalDashboard() {
  const data = getDashboardVariantData() as unknown as DashboardVariantData;

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="h-full min-h-0 w-full overflow-y-auto bg-[#EFEEEC] font-sans text-[#2A2925]">
      <div className="mx-auto flex max-w-[1080px] flex-col gap-4 px-6 py-10 sm:px-10">
        {/* header */}
        <div className="mb-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold leading-tight">
              {getGreeting()}, {data.userName}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-[12px] text-[#8D8B86]">
              <CalendarClock size={13} strokeWidth={1.5} />
              {dateLabel}
            </p>
          </div>
          <VariantSwitcher current="tonal" />
        </div>

        {/* genie kpis */}
        <section className="flex flex-col gap-2">
          <SectionLabel>Your performance</SectionLabel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {data.genieKpis.map((k, i) => (
              <KpiTile key={k.key} item={k} icon={pickKpiIcon(k.key, k.label)} accent={i === 0} />
            ))}
          </div>
        </section>

        {/* credits hero */}
        <section>
          <div className="relative overflow-hidden rounded-[20px] bg-[#2A2925] p-6 text-[#EFEEEC] sm:p-7">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#8D8B86]">
                Credits
              </span>
              <Wallet size={16} strokeWidth={1.5} className="text-[#8D8B86]" />
            </div>
            <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[36px] font-semibold leading-none tabular-nums sm:text-[44px]">
                  {data.credits.used}
                  <span className="text-[#A3A19B]">/{data.credits.total}</span>
                </div>
                <div className="mt-4 h-1.5 w-full max-w-[280px] overflow-hidden rounded-full bg-[#3D3B36]">
                  <div
                    className="h-full rounded-full bg-[#EFEEEC]"
                    style={{ width: `${Math.min(100, Math.max(0, data.credits.pct))}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-[#8D8B86]">Burn / day</p>
                  <p className="mt-1 text-[18px] font-semibold tabular-nums">{data.credits.burnPerDay}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-[#8D8B86]">Days left</p>
                  <p className="mt-1 text-[18px] font-semibold tabular-nums">{data.credits.daysLeft}</p>
                </div>
                <Sparkline data={data.sparkSeries} stroke="#EFEEEC" opacity={0.5} width={64} height={28} />
              </div>
            </div>
          </div>
        </section>

        {/* industry kpis */}
        <section className="flex flex-col gap-2">
          <SectionLabel>Industry benchmarks</SectionLabel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {data.industryKpis.map((k) => (
              <KpiTile key={k.key} item={k} icon={pickKpiIcon(k.key, k.label)} />
            ))}
          </div>
        </section>

        {/* distribution + keywords */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <DistributionTile data={data.creativeDistribution} />
          <KeywordsTile keywords={data.trendingKeywords} />
        </div>

        {/* quick modes */}
        <section className="flex flex-col gap-2">
          <SectionLabel>Quick modes</SectionLabel>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {data.modes.map((m) => (
              <ModeTile key={m.key} mode={m} />
            ))}
          </div>
        </section>

        {/* recent lists + activity */}
        <div className="grid grid-cols-1 gap-3 pb-6 md:grid-cols-2">
          <RecentListsTile fetched={data.recentlyFetched} newAds={data.newAdsFetched} work={data.recentWork} />
          <ActivityTile activity={data.activity} />
        </div>
      </div>
    </div>
  );
}
