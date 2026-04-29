import {
  getByLevel,
  getDataset,
  aggregateMetrics,
  type ReportEntity,
  type ReportMetrics,
  type EntityLevel,
  type EntityStatus,
} from "@/lib/reports-dummy-data";

// ── Seeded random (reuse same logic) ──────────────────────────────
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── KPI aggregation ───────────────────────────────────────────────
export interface KpiData {
  label: string;
  value: string;
  change: number; // percentage vs "last month"
  sparkline: number[];
}

export function aggregateKpis(dateSeed = 0): KpiData[] {
  const accounts = getByLevel("account", dateSeed);
  const campaigns = getByLevel("campaign", dateSeed);
  const m = aggregateMetrics(accounts);
  const rand = seededRandom(777 + dateSeed);

  const activeCampaigns = campaigns.filter((c) => c.status === "Active").length;

  // Generate sparkline data (7 points)
  const spark = (base: number) =>
    Array.from({ length: 7 }, () => base * (0.7 + rand() * 0.6));

  return [
    {
      label: "Total Spend",
      value: `$${m.spend.toLocaleString()}`,
      change: +(rand() * 20 - 5).toFixed(1),
      sparkline: spark(m.spend / 7),
    },
    {
      label: "Total Revenue",
      value: `$${m.revenue.toLocaleString()}`,
      change: +(rand() * 25 - 3).toFixed(1),
      sparkline: spark(m.revenue / 7),
    },
    {
      label: "Gross Margin",
      value: `$${m.margin.toLocaleString()}`,
      change: +(rand() * 30 - 10).toFixed(1),
      sparkline: spark(m.margin / 7),
    },
    {
      label: "ROAS",
      value: m.roas.toFixed(2),
      change: +(rand() * 15 - 5).toFixed(1),
      sparkline: spark(m.roas),
    },
    {
      label: "Active Campaigns",
      value: activeCampaigns.toString(),
      change: +(rand() * 10 - 2).toFixed(1),
      sparkline: spark(activeCampaigns),
    },
    {
      label: "Accounts at Risk",
      value: "0", // will be overridden by RRM hook data
      change: 0,
      sparkline: [0, 0, 0, 0, 0, 0, 0],
    },
  ];
}

// ── Time series (single metric) ───────────────────────────────────
export type MetricKey = "spend" | "revenue" | "margin" | "roas";

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export function timeSeries(dateSeed = 0, metric: MetricKey): TimeSeriesPoint[] {
  const rand = seededRandom(100 + dateSeed + metric.charCodeAt(0));
  const accounts = getByLevel("account", dateSeed);
  const total = aggregateMetrics(accounts);
  const baseValue = total[metric];
  const days = 30;

  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const dayLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const variance = 0.6 + rand() * 0.8;
    return {
      date: dayLabel,
      value: +(baseValue / days * variance).toFixed(2),
    };
  });
}

// ── Marketing status breakdown ────────────────────────────────────
export interface StatusBreakdown {
  active: number;
  paused: number;
  archived: number;
  total: number;
}

export function marketingStatusBreakdown(
  dateSeed = 0,
  level: EntityLevel = "campaign"
): StatusBreakdown {
  const entities = getByLevel(level, dateSeed);
  const active = entities.filter((e) => e.status === "Active").length;
  const paused = entities.filter((e) => e.status === "Paused").length;
  const archived = entities.filter((e) => e.status === "Archived").length;
  return { active, paused, archived, total: entities.length };
}

// ── Top ad accounts (top 5 by spend) ──────────────────────────────
export interface AdAccountRow {
  name: string;
  spend: number;
  cpa: number;
  cpc: number;
  ctr: number;
  conversions: number;
}

export function topAdAccounts(dateSeed = 0, limit = 5): AdAccountRow[] {
  return getByLevel("account", dateSeed)
    .sort((a, b) => b.metrics.spend - a.metrics.spend)
    .slice(0, limit)
    .map((a) => ({
      name: a.name,
      spend: a.metrics.spend,
      cpa: a.metrics.cpa,
      cpc: a.metrics.cpc,
      ctr: a.metrics.ctr,
      conversions: a.metrics.conversions,
    }));
}

// ── Top users (dummy) ─────────────────────────────────────────────
const USER_NAMES = [
  "Alex Rivera", "Jordan Chen", "Sam Patel", "Morgan Lee", "Casey Brooks",
  "Riley Kim", "Taylor Singh", "Jamie Fox", "Drew Mason", "Quinn Edwards",
  "Avery Walsh", "Blake Turner", "Charlie Ng", "Dakota Price", "Emery Hall",
];

export interface UserRow {
  name: string;
  spend: number;
  revenue: number;
  roas: number;
  margin: number;
  activeCampaigns: number;
}

export function topUsers(dateSeed = 0, limit = 10): UserRow[] {
  const rand = seededRandom(555 + dateSeed);
  return USER_NAMES.slice(0, limit).map((name) => {
    const spend = Math.round(rand() * 15000 + 2000);
    const roas = +(rand() * 4 + 0.5).toFixed(2);
    const revenue = Math.round(spend * roas);
    return {
      name,
      spend,
      revenue,
      roas,
      margin: revenue - spend,
      activeCampaigns: Math.floor(rand() * 8) + 1,
    };
  }).sort((a, b) => b.revenue - a.revenue);
}

// ── Country aggregation ───────────────────────────────────────────
export interface CountryData {
  country: string;
  spend: number;
  revenue: number;
  activeCampaigns: number;
}

export function countryAggregation(dateSeed = 0): CountryData[] {
  const campaigns = getByLevel("campaign", dateSeed);
  const map = new Map<string, CountryData>();
  for (const c of campaigns) {
    const existing = map.get(c.country) || { country: c.country, spend: 0, revenue: 0, activeCampaigns: 0 };
    existing.spend += c.metrics.spend;
    existing.revenue += c.metrics.revenue;
    if (c.status === "Active") existing.activeCampaigns++;
    map.set(c.country, existing);
  }
  return Array.from(map.values()).sort((a, b) => b.spend - a.spend);
}

// ── Launch creation stats ─────────────────────────────────────────
export interface LaunchStats {
  campaigns: number;
  adsets: number;
  ads: number;
  mediaUploads: number;
  mediaCapacity: number;
  newPercent: number;
  relaunchPercent: number;
}

export function launchCreationStats(dateSeed = 0): LaunchStats {
  const rand = seededRandom(999 + dateSeed);
  const campaigns = getByLevel("campaign", dateSeed).length;
  const adsets = getByLevel("adset", dateSeed).length;
  const ads = getByLevel("ad", dateSeed).length;
  const mediaUploads = Math.round(rand() * 400 + 200);
  const newPct = Math.round(rand() * 40 + 50);
  return {
    campaigns,
    adsets,
    ads,
    mediaUploads,
    mediaCapacity: 1000,
    newPercent: newPct,
    relaunchPercent: 100 - newPct,
  };
}
