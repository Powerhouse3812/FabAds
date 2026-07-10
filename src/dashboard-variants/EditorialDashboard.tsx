import type { ReactNode } from "react";
import { getDashboardVariantData } from "./variantData";
import VariantSwitcher from "./VariantSwitcher";

/**
 * EditorialDashboard — "print-grid" dashboard variant.
 *
 * Design language: a magazine / blueprint spread rendered on a paper-light
 * canvas — visible column hairlines, numbered sections (01-06), Archivo
 * Black display numerals, Geist Mono micro-labels, one red accent
 * (#D84A30) reserved for numerals / deltas / the single "live" dot.
 * No cards, no shadows, no rounded corners — this deliberately does NOT
 * follow the FabFunnel SaaS design system.
 */

// ---------------------------------------------------------------------------
// Local shape mirrors the shared variantData contract. Cast defensively so
// this file stays clean even if the concrete export type differs slightly.
// ---------------------------------------------------------------------------

interface KpiItem {
  key: string;
  label: string;
  value: string | number;
  delta?: string | number;
  deltaDir?: "up" | "down";
  spark?: number[];
}

interface DistributionItem {
  name: string;
  value: number;
}

interface ModeItem {
  key: string;
  label: string;
  desc: string;
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
  creativeDistribution: DistributionItem[];
  trendingKeywords: string[];
  modes: ModeItem[];
  recentlyFetched: ListItem[];
  newAdsFetched: ListItem[];
  recentWork: ListItem[];
  activity: ActivityItem[];
  sparkSeries: number[];
}

const PAPER = "#F4F3F0";
const INK = "#1C1B19";
const RED = "#D84A30";
const MUTE = "#8A877F";
const HAIR = "#DDDAD2";

// ---------------------------------------------------------------------------
// Small editorial primitives
// ---------------------------------------------------------------------------

function Micro({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8A877F]">
      {children}
    </span>
  );
}

function Delta({
  delta,
  dir,
}: {
  delta?: string | number;
  dir?: "up" | "down";
}) {
  if (delta === undefined || delta === null || delta === "") return null;
  const isDown = dir === "down";
  const arrow = isDown ? "↘" : "↗";
  const label =
    typeof delta === "number"
      ? `${delta > 0 && dir !== "down" ? "+" : ""}${delta}%`
      : delta;
  return (
    <span className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-[#D84A30]">
      <span aria-hidden>{arrow}</span>
      {label}
    </span>
  );
}

function Sparkline({
  data,
  className,
}: {
  data?: number[];
  className?: string;
}) {
  if (!data || data.length < 2) return null;
  const w = 100;
  const h = 32;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={className}
    >
      <polyline
        points={points}
        fill="none"
        stroke={INK}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function SectionHeading({
  n,
  micro,
  title,
  accent,
}: {
  n: string;
  micro: string;
  title: string;
  accent?: boolean;
}) {
  return (
    <div className="col-span-12 flex flex-col gap-3">
      <div className="flex items-baseline gap-4">
        <span className="font-['Archivo_Black'] text-[32px] leading-none tracking-[-0.02em] text-[#D84A30] md:text-[40px]">
          {n}
        </span>
        <Micro>{micro}</Micro>
      </div>
      <h2
        className="w-fit border-b-2 pb-1 font-['Archivo'] text-2xl font-extrabold tracking-[-0.02em] md:text-3xl"
        style={{ borderColor: accent ? RED : INK }}
      >
        {title}
      </h2>
    </div>
  );
}

function KpiCell({ item, size = "lg" }: { item: KpiItem; size?: "lg" | "md" }) {
  return (
    <div className="border-[#DDDAD2] px-4 pb-4 first:pl-0">
      <Micro>{item.label}</Micro>
      <p
        className={`mt-1 font-['Archivo'] font-extrabold tracking-[-0.02em] ${
          size === "lg" ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl"
        }`}
      >
        {item.value}
      </p>
      <Delta delta={item.delta} dir={item.deltaDir} />
      {item.spark && item.spark.length > 1 && (
        <Sparkline data={item.spark} className="mt-2 h-6 w-full" />
      )}
    </div>
  );
}

function EditorialRow({ time, title, sub, status }: ListItem) {
  return (
    <div className="grid grid-cols-[64px_1fr] gap-3 border-b border-[#DDDAD2] py-2.5 first:border-t">
      <span className="pt-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#8A877F]">
        {time ?? "—"}
      </span>
      <div className="min-w-0">
        <p className="truncate font-['Archivo'] text-[13px] font-semibold text-[#1C1B19]">
          {title}
        </p>
        {sub && (
          <p className="truncate font-mono text-[11px] text-[#8A877F]">
            {sub}
            {status ? ` · ${status}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function EditorialDashboard() {
  const data = getDashboardVariantData() as unknown as DashboardVariantData;

  const hero = data.genieKpis?.[0];
  const spark = data.sparkSeries ?? [];
  const sparkMin = spark.length ? Math.min(...spark) : 0;
  const sparkMax = spark.length ? Math.max(...spark) : 0;

  const distTotal =
    data.creativeDistribution?.reduce((sum, d) => sum + d.value, 0) || 1;

  const footerTimestamp = new Date()
    .toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    .toUpperCase();

  const gridCols = Array.from({ length: 12 });

  return (
    <div
      className="relative min-h-screen w-full text-[#1C1B19]"
      style={{ background: PAPER }}
    >
      {/* Vertical editorial spine — left edge, full height */}
      <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 hidden w-10 items-center justify-center md:flex">
        <span
          className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#8A877F]"
          style={{ writingMode: "vertical-rl" }}
        >
          FABADS · DASHBOARD · JUL 2026
        </span>
      </div>

      <div className="relative mx-auto max-w-[1440px] px-6 md:pl-16 md:pr-10">
        {/* Print-grid column hairlines, aligned to the content grid below */}
        <div className="pointer-events-none absolute inset-0 z-0 grid grid-cols-12 gap-x-6">
          {gridCols.map((_, i) => (
            <div key={i} className="h-full border-l border-[#DDDAD2]" />
          ))}
        </div>

        <div className="relative z-10 grid grid-cols-12 gap-x-6 gap-y-16 pb-10 pt-10">
          {/* Utility header row */}
          <div className="col-span-12 flex items-center justify-between border-b border-[#DDDAD2] pb-4">
            <Micro>FabAds · Editorial Dashboard</Micro>
            <VariantSwitcher current="editorial" />
          </div>

          {/* 01 — Performance */}
          <section className="col-span-12 grid grid-cols-12 gap-x-6 gap-y-10">
            <SectionHeading n="01" micro="Overview · Today" title="Performance" accent />

            <div className="col-span-12 md:col-span-7">
              <div className="mb-3 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                    style={{ background: RED }}
                  />
                  <span
                    className="relative inline-flex h-2 w-2 rounded-full"
                    style={{ background: RED }}
                  />
                </span>
                <Micro>
                  Live · {getGreeting()}, {data.userName}
                </Micro>
              </div>
              <p className="font-['Archivo_Black'] text-[56px] leading-[0.9] tracking-[-0.02em] md:text-[80px]">
                {hero?.value ?? "—"}
              </p>
              <div className="mt-3 flex items-center gap-4">
                <Micro>{hero?.label ?? "Key metric"}</Micro>
                <Delta delta={hero?.delta} dir={hero?.deltaDir} />
              </div>
            </div>

            <div className="col-span-12 flex flex-col justify-end md:col-span-5">
              <Micro>30-Day Trend</Micro>
              <Sparkline data={spark} className="mt-3 h-16 w-full" />
              <div className="mt-2 flex justify-between font-mono text-[10px] text-[#8A877F]">
                <span>{sparkMin}</span>
                <span>{sparkMax}</span>
              </div>
            </div>
          </section>

          {/* 02 — Genie */}
          <section className="col-span-12 grid grid-cols-12 gap-x-6 gap-y-10">
            <SectionHeading n="02" micro="Automation · Output" title="Genie" />

            <div className="col-span-12 grid grid-cols-2 divide-x divide-[#DDDAD2] border-t border-[#DDDAD2] pt-6 md:grid-cols-4">
              {data.genieKpis?.map((k) => (
                <KpiCell key={k.key} item={k} size="lg" />
              ))}
            </div>

            <div className="col-span-12">
              <Micro>Six Modes</Micro>
              <div className="mt-3 grid grid-cols-1 gap-x-8 md:grid-cols-2">
                {data.modes?.map((m, i) => (
                  <div
                    key={m.key}
                    className="flex gap-3 border-b border-[#DDDAD2] py-2.5"
                  >
                    <span className="pt-0.5 font-mono text-[11px] text-[#8A877F]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="font-['Archivo'] text-[13px] font-semibold">
                        {m.label}
                      </p>
                      <p className="truncate font-mono text-[11px] text-[#8A877F]">
                        {m.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 03 — Industry */}
          <section className="col-span-12 grid grid-cols-12 gap-x-6 gap-y-10">
            <SectionHeading n="03" micro="Market · Signals" title="Industry" />

            <div className="col-span-12 grid grid-cols-2 divide-x divide-[#DDDAD2] border-t border-[#DDDAD2] pt-6 md:col-span-7">
              {data.industryKpis?.map((k) => (
                <KpiCell key={k.key} item={k} size="md" />
              ))}
            </div>

            <div className="col-span-12 md:col-span-5">
              <Micro>Creative Mix</Micro>
              <div className="mt-3 flex h-10 w-full">
                {data.creativeDistribution?.map((d, i) => {
                  const pct = (d.value / distTotal) * 100;
                  return (
                    <div
                      key={d.name}
                      className="h-full border-r last:border-r-0"
                      style={{
                        width: `${pct}%`,
                        background: `rgba(28,27,25,${Math.max(0.15, 0.85 - i * 0.15)})`,
                        borderColor: PAPER,
                      }}
                    />
                  );
                })}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {data.creativeDistribution?.map((d) => (
                  <span
                    key={d.name}
                    className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#8A877F]"
                  >
                    {d.name}{" "}
                    <span className="text-[#1C1B19]">
                      {((d.value / distTotal) * 100).toFixed(0)}%
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="col-span-12 border-t border-[#DDDAD2] pt-4">
              <Micro>Trending Keywords</Micro>
              <p className="mt-2 font-mono text-[12px] uppercase tracking-[0.06em] text-[#1C1B19]">
                {data.trendingKeywords?.join("   ·   ")}
              </p>
            </div>
          </section>

          {/* 04 — Credits */}
          <section className="col-span-12 grid grid-cols-12 gap-x-6 gap-y-6">
            <SectionHeading n="04" micro="Usage · Budget" title="Credits" />

            <div className="col-span-12 md:col-span-5">
              <p className="font-['Archivo_Black'] text-5xl tracking-[-0.02em] md:text-6xl">
                {data.credits?.used}
                <span className="text-2xl text-[#8A877F] md:text-3xl">
                  {" "}
                  / {data.credits?.total}
                </span>
              </p>
              <div className="mt-4 h-[2px] w-full" style={{ background: HAIR }}>
                <div
                  className="h-full"
                  style={{
                    background: INK,
                    width: `${Math.min(100, Math.max(0, data.credits?.pct ?? 0))}%`,
                  }}
                />
              </div>
              <div className="mt-2">
                <Micro>{data.credits?.pct}% Utilized</Micro>
              </div>
            </div>

            <div className="col-span-12 grid grid-cols-2 divide-x divide-[#DDDAD2] border-t border-[#DDDAD2] pt-4 md:col-span-7">
              <div className="px-4 first:pl-0">
                <Micro>Burn / Day</Micro>
                <p className="mt-1 font-['Archivo'] text-2xl font-extrabold">
                  {data.credits?.burnPerDay}
                </p>
              </div>
              <div className="px-4">
                <Micro>Days Left</Micro>
                <p className="mt-1 font-['Archivo'] text-2xl font-extrabold">
                  {data.credits?.daysLeft}
                </p>
              </div>
            </div>
          </section>

          {/* 05 — Pipeline */}
          <section className="col-span-12 grid grid-cols-12 gap-x-6 gap-y-10">
            <SectionHeading n="05" micro="Feed · Sourcing" title="Pipeline" />

            {[
              { title: "Recently Fetched", items: data.recentlyFetched ?? [] },
              { title: "New Ads Fetched", items: data.newAdsFetched ?? [] },
              { title: "Recent Work", items: data.recentWork ?? [] },
            ].map((col) => (
              <div key={col.title} className="col-span-12 md:col-span-4">
                <Micro>{col.title}</Micro>
                <div className="mt-3">
                  {col.items.length === 0 ? (
                    <p className="border-t border-[#DDDAD2] py-3 font-mono text-[11px] text-[#8A877F]">
                      No items yet
                    </p>
                  ) : (
                    col.items.map((it) => (
                      <EditorialRow
                        key={it.id}
                        id={it.id}
                        time={it.time}
                        title={it.title}
                        sub={it.sub}
                        status={it.status}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </section>

          {/* 06 — Activity */}
          <section className="col-span-12 grid grid-cols-12 gap-x-6 gap-y-6">
            <SectionHeading n="06" micro="Log · Timeline" title="Activity" />

            <div className="col-span-12">
              {(!data.activity || data.activity.length === 0) ? (
                <p className="border-t border-[#DDDAD2] py-3 font-mono text-[11px] text-[#8A877F]">
                  No activity yet
                </p>
              ) : (
                data.activity.map((a) => (
                  <div
                    key={a.id}
                    className="grid grid-cols-[80px_1fr_100px] items-center gap-3 border-b border-[#DDDAD2] py-2.5 first:border-t"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#8A877F]">
                      {a.time}
                    </span>
                    <p className="truncate font-['Archivo'] text-[13px]">{a.text}</p>
                    <span className="justify-self-end font-mono text-[10px] uppercase tracking-[0.1em] text-[#8A877F]">
                      [{a.kind}]
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Footer strip */}
          <footer className="col-span-12 flex items-center justify-between border-t border-[#DDDAD2] pt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8A877F]">
            <span>FabAds Editorial — 06 of 06</span>
            <span>{footerTimestamp}</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
