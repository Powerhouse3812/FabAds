/**
 * ReportsUpsellCard — large, illustrated upsell card for the AI-plan dashboard.
 *
 * Horizontal band, MIRRORED from LaunchUpsellCard: LEFT (~44%) an oversized
 * editorial data-chart rendered as art (layered translucent area chart + bold
 * bars + multi-account convergence lines + a floating ROAS tooltip), RIGHT
 * (~56%) conversion copy + lime CTA. The chart is "chart as art" — it implies
 * rich multi-account reporting without being a real readable chart. Composed
 * into a vertical stack by UpsellRow (wired separately).
 *
 * Locked decisions (do not reopen):
 *   - Tier: Growth · featureKey: reports
 *   - Hook: 15 accounts → one live ROAS row
 */
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ReportsUpsellCardProps {
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Area-path helper
//
// Builds a smooth (Catmull-Rom → cubic-bezier) line through `points`, then —
// when `baseline` is given — closes it down to that y to form a fillable area.
// Keeping the bezier maths in one place means every curve in the chart reads as
// the same confident hand.
// ─────────────────────────────────────────────────────────────────────────────

type Pt = { x: number; y: number };

function smoothPath(points: Pt[], baseline?: number): string {
  if (points.length === 0) return "";

  const line = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x},${p.y}`;
    const p0 = points[i - 1];
    const p1 = p;
    // Catmull-Rom neighbours, clamped at the ends.
    const prev = points[i - 2] ?? p0;
    const next = points[i + 1] ?? p1;
    const c1 = {
      x: p0.x + (p1.x - prev.x) / 6,
      y: p0.y + (p1.y - prev.y) / 6,
    };
    const c2 = {
      x: p1.x - (next.x - p0.x) / 6,
      y: p1.y - (next.y - p0.y) / 6,
    };
    return `${acc} C ${c1.x},${c1.y} ${c2.x},${c2.y} ${p1.x},${p1.y}`;
  }, "");

  if (baseline === undefined) return line;

  const first = points[0];
  const last = points[points.length - 1];
  return `${line} L ${last.x},${baseline} L ${first.x},${baseline} Z`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ChartArt — the editorial composite chart
// ─────────────────────────────────────────────────────────────────────────────

const VIEW_W = 360;
const VIEW_H = 280;
const BASELINE = 224; // y of the chart floor (bars + areas sit on this)

// Back (neutral) trend — broad, gentle.
const BACK_AREA: Pt[] = [
  { x: 8, y: 150 },
  { x: 70, y: 132 },
  { x: 132, y: 156 },
  { x: 200, y: 118 },
  { x: 268, y: 138 },
  { x: 352, y: 104 },
];

// Front (lime hero) trend — the "winning account", climbing to a clear peak.
const LIME_AREA: Pt[] = [
  { x: 8, y: 188 },
  { x: 72, y: 168 },
  { x: 136, y: 178 },
  { x: 206, y: 120 }, // peak — tooltip anchors here
  { x: 280, y: 142 },
  { x: 352, y: 96 },
];

// Foreground bars along the baseline. One lime standout, the rest neutral.
const BARS: { x: number; h: number; lime?: boolean }[] = [
  { x: 40, h: 46 },
  { x: 84, h: 72 },
  { x: 128, h: 58 },
  { x: 172, h: 104, lime: true }, // standout account
  { x: 216, h: 66 },
  { x: 260, h: 84 },
];
const BAR_W = 22;

// Multi-account convergence lines: enter left at varied heights, funnel into one
// node on the right ("15 accounts → one view").
const CONVERGE_NODE: Pt = { x: 318, y: 74 };
const CONVERGE_ORIGINS: Pt[] = [
  { x: 6, y: 60 },
  { x: 6, y: 92 },
  { x: 6, y: 126 },
  { x: 6, y: 158 },
];

function ChartArt() {
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="h-full w-full text-foreground"
      role="img"
      aria-label="An editorial multi-account chart: layered area trends, bold bars with one lime standout, and fifteen faint account lines converging into a single point"
    >
      <defs>
        {/* Lime hero area: solid-ish at top → transparent at the floor. */}
        <linearGradient id="reports-lime-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c3eb42" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#c3eb42" stopOpacity="0" />
        </linearGradient>
        {/* Neutral back area: faint foreground tint → transparent. */}
        <linearGradient id="reports-back-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* (5) Depth — faint horizontal gridlines behind everything. */}
      <g stroke="currentColor" strokeOpacity={0.05} strokeWidth={1}>
        {[72, 110, 148, 186, BASELINE].map((y) => (
          <line key={y} x1={4} y1={y} x2={356} y2={y} />
        ))}
      </g>

      {/* (1a) Back neutral area. */}
      <path d={smoothPath(BACK_AREA, BASELINE)} fill="url(#reports-back-area)" />

      {/* (1b) Lime hero area + its bright top-edge line + node dots. */}
      <path d={smoothPath(LIME_AREA, BASELINE)} fill="url(#reports-lime-area)" />
      <path
        d={smoothPath(LIME_AREA)}
        fill="none"
        stroke="#c3eb42"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {LIME_AREA.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.6} fill="#c3eb42" />
      ))}

      {/* (3) Multi-account convergence lines + origin dots + lime node ring. */}
      <g>
        {CONVERGE_ORIGINS.map((o, i) => (
          <g key={i}>
            <path
              d={smoothPath([
                o,
                { x: (o.x + CONVERGE_NODE.x) / 2, y: (o.y + CONVERGE_NODE.y) / 2 - 6 },
                CONVERGE_NODE,
              ])}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.12}
              strokeWidth={1}
            />
            <circle cx={o.x} cy={o.y} r={1.8} fill="currentColor" fillOpacity={0.18} />
          </g>
        ))}
        {/* Convergence node — small lime ring (the "one view"). */}
        <circle
          cx={CONVERGE_NODE.x}
          cy={CONVERGE_NODE.y}
          r={4.5}
          fill="none"
          stroke="#9cc42d"
          strokeWidth={1.5}
        />
        <circle cx={CONVERGE_NODE.x} cy={CONVERGE_NODE.y} r={1.6} fill="#c3eb42" />
      </g>

      {/* (2) Foreground bars on the baseline — rounded tops, one lime standout. */}
      <g>
        {BARS.map((b, i) => (
          <rect
            key={i}
            x={b.x}
            y={BASELINE - b.h}
            width={BAR_W}
            height={b.h}
            rx={5}
            fill={b.lime ? "#c3eb42" : "currentColor"}
            fillOpacity={b.lime ? 0.9 : 0.15}
          />
        ))}
      </g>

      {/* (4) Floating value tag near the lime peak — the "real dashboard" cue. */}
      <g transform={`translate(${LIME_AREA[3].x + 8}, ${LIME_AREA[3].y - 34})`}>
        <rect
          x={0}
          y={0}
          width={46}
          height={22}
          rx={6}
          fill="#c3eb42"
          fillOpacity={0.16}
          stroke="#9cc42d"
          strokeOpacity={0.5}
          strokeWidth={1}
        />
        <text
          x={23}
          y={15}
          textAnchor="middle"
          fontFamily="ui-monospace, monospace"
          fontSize={12}
          fontWeight={700}
          fill="#9cc42d"
        >
          4.2x
        </text>
        {/* Tiny stem linking the tag to the lime peak node. */}
        <line
          x1={6}
          y1={22}
          x2={0}
          y2={32}
          stroke="#9cc42d"
          strokeOpacity={0.5}
          strokeWidth={1}
        />
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export function ReportsUpsellCard({ className }: ReportsUpsellCardProps) {
  return (
    <section
      className={cn(
        "relative flex min-h-[240px] overflow-hidden rounded-2xl border border-border/60 bg-card",
        className,
      )}
    >
      {/* LEFT — illustration (44%) */}
      <div className="relative hidden w-[44%] shrink-0 items-center justify-center overflow-hidden sm:flex">
        <ChartArt />
      </div>

      {/* RIGHT — content (56%) */}
      <div className="flex flex-1 flex-col justify-center gap-3 p-7">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50">
          Upgrade · Reports
        </p>
        <h3 className="text-[22px] font-bold leading-tight tracking-tight text-foreground">
          15 accounts.
          <br />
          One ROAS row.
        </h3>
        <p className="max-w-[320px] text-[13px] leading-relaxed text-muted-foreground">
          Right now it&apos;s 15 CSV exports stitched in a spreadsheet. Growth
          aggregates every account into one live table.
        </p>
        <div className="mt-1">
          <Link
            to="/plans-v2?tier=growth&view=trial&featureKey=reports"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-[12.5px] font-bold text-foreground transition-colors hover:bg-primary/90"
          >
            See it on Growth
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default ReportsUpsellCard;
