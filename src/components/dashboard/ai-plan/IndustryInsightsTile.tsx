import { Link } from "react-router-dom";
import { Image as ImageIcon, Search, Video } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

/**
 * IndustryInsightsTile — col-5 companion on Row 2 of the AI-plan dashboard.
 *
 * Redesigned per Maalik's Figma:
 *   ┌────────────────────────────────────────────┐
 *   │ INDUSTRY INSIGHTS  View all →   Last 30 d  │ ← header
 *   ├────────────────────────────────────────────┤
 *   │ ╭────╮   📷 Creatives    30 / 27   57      │
 *   │ │ 57 │   📹 Videos       34 / 27   61      │ ← donut + breakdown
 *   │ ╰────╯                                     │
 *   ├────────────────────────────────────────────┤
 *   │ TRENDING KEYWORDS (AI SUGGESTED)           │
 *   │ [skincare routine] [summer sale] [Vit C]   │ ← keywords
 *   └────────────────────────────────────────────┘
 *
 * Data: mocked locally. Real backend wiring later.
 */

const CREATIVES_CURRENT = 30;
const CREATIVES_PRIOR = 27;
const VIDEOS_CURRENT = 34;
const VIDEOS_PRIOR = 27;

const CREATIVES_COLOR = "#138585";
const VIDEOS_COLOR = "#A02669";

const DONUT_DATA = [
  { name: "Creatives", value: CREATIVES_CURRENT, color: CREATIVES_COLOR },
  { name: "Videos", value: VIDEOS_CURRENT, color: VIDEOS_COLOR },
];

const TOTAL = DONUT_DATA.reduce((sum, d) => sum + d.value, 0);

const TRENDING_KEYWORDS = [
  "skincare routine",
  "summer sale",
  "Vitamin C benefits",
];

export function IndustryInsightsTile() {
  return (
    <section className="rounded-2xl border border-border/60 bg-card">
      {/* Header strip */}
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            Industry Insights
          </span>
          <Link
            to="/insights-v2/feed"
            className="text-[11.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            View all <span aria-hidden>→</span>
          </Link>
        </div>
        <p className="text-[11.5px] text-muted-foreground">Last 30 days</p>
      </header>

      {/* Body: donut + breakdown */}
      <div className="flex items-center gap-6 px-4 py-3">
        {/* Donut */}
        <div className="relative h-20 w-20 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={DONUT_DATA}
                dataKey="value"
                nameKey="name"
                innerRadius={28}
                outerRadius={40}
                paddingAngle={2}
                stroke="none"
                isAnimationActive={false}
              >
                {DONUT_DATA.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[13px] font-semibold tabular-nums leading-none text-foreground">
              {TOTAL}
            </span>
            <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              Total
            </span>
          </div>
        </div>

        {/* Breakdown rows */}
        <div className="flex flex-1 flex-col gap-2">
          <BreakdownRow
            icon={
              <ImageIcon
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: CREATIVES_COLOR }}
                strokeWidth={2.2}
                aria-hidden
              />
            }
            label="Creatives"
            current={CREATIVES_CURRENT}
            prior={CREATIVES_PRIOR}
            total={CREATIVES_CURRENT + CREATIVES_PRIOR}
          />
          <BreakdownRow
            icon={
              <Video
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: VIDEOS_COLOR }}
                strokeWidth={2.2}
                aria-hidden
              />
            }
            label="Videos"
            current={VIDEOS_CURRENT}
            prior={VIDEOS_PRIOR}
            total={VIDEOS_CURRENT + VIDEOS_PRIOR}
          />
        </div>
      </div>

      {/* Footer: trending keywords */}
      <div className="border-t border-border/60 px-4 py-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
          Trending Keywords (AI suggested)
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {TRENDING_KEYWORDS.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.04] px-2 py-0.5 text-[12px] text-foreground/65"
            >
              <Search
                className="h-3 w-3 text-foreground/35"
                strokeWidth={2}
                aria-hidden
              />
              {kw}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

interface BreakdownRowProps {
  icon: React.ReactNode;
  label: string;
  current: number;
  prior: number;
  total: number;
}

function BreakdownRow({ icon, label, current, prior, total }: BreakdownRowProps) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-[13px] text-foreground">{label}</span>
      <span className="flex-1" />
      <span className="font-mono text-[13px] tabular-nums text-foreground/45">
        {current} / {prior}
      </span>
      <span className="text-[14px] font-semibold tabular-nums text-foreground">
        {total}
      </span>
    </div>
  );
}
