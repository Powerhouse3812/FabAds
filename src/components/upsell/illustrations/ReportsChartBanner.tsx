/**
 * ReportsChartBanner — wide editorial "chart-as-art" hero for the Reports
 * paywall modal (LockedFeatureSellModal, 560px wide).
 *
 * Re-composition of the ChartArt genre shipped in
 * src/components/dashboard/ai-plan/ReportsUpsellCard.tsx — same visual DNA
 * (layered translucent area + lime trend line + bold bars + multi-account
 * convergence lines + a floating value tag) but tuned for a WIDE banner
 * (560×220, ~2.5:1) that sits full-bleed at the top of the modal.
 *
 * "Chart as art": it implies rich multi-account reporting without being a real
 * readable chart. Neutral geometry rides currentColor + opacity so it tracks
 * the modal's light/dark theme; lime literals (#c3eb42 / #9cc42d) appear only
 * where genuine lime fill/stroke is wanted.
 */
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Area-path helper
//
// Smooth (Catmull-Rom → cubic-bezier) line through `points`; when `baseline`
// is given it closes down to that y to form a fillable area. Same approach as
// ReportsUpsellCard's smoothPath so every curve reads as one confident hand.
// ─────────────────────────────────────────────────────────────────────────────

type Pt = { x: number; y: number };

function smoothPath(points: Pt[], baseline?: number): string {
  if (points.length === 0) return "";

  const line = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x},${p.y}`;
    const p0 = points[i - 1];
    const p1 = p;
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
// Geometry — tuned for the wide 560×220 frame
// ─────────────────────────────────────────────────────────────────────────────

const VIEW_W = 560;
const VIEW_H = 220;
const BASELINE = 176; // chart floor — bars + areas sit here

// Faint horizontal gridlines (depth).
const GRIDLINES = [44, 77, 110, 143, BASELINE];

// Back (neutral) trend — broad, gentle, spanning the full width.
const BACK_AREA: Pt[] = [
  { x: 8, y: 116 },
  { x: 110, y: 100 },
  { x: 210, y: 122 },
  { x: 320, y: 92 },
  { x: 430, y: 110 },
  { x: 552, y: 80 },
];

// Front (lime hero) trend — the "winning account", climbing to a clear peak.
const LIME_AREA: Pt[] = [
  { x: 8, y: 150 },
  { x: 112, y: 132 },
  { x: 216, y: 140 },
  { x: 312, y: 88 }, // peak — tooltip anchors here
  { x: 432, y: 112 },
  { x: 552, y: 70 },
];
const PEAK = LIME_AREA[3];

// Foreground bars along the baseline, spread across the width. One lime
// standout (taller), the rest neutral.
const BARS: { x: number; h: number; lime?: boolean }[] = [
  { x: 40, h: 40 },
  { x: 104, h: 64 },
  { x: 168, h: 52 },
  { x: 232, h: 78 },
  { x: 296, h: 104, lime: true }, // standout account
  { x: 360, h: 60 },
  { x: 424, h: 86 },
  { x: 488, h: 70 },
];
const BAR_W = 24;

// Multi-account convergence lines: enter left at varied heights, funnel into a
// single lime ring node on the right ("15 accounts → one view").
const CONVERGE_NODE: Pt = { x: 522, y: 52 };
const CONVERGE_ORIGINS: Pt[] = [
  { x: 6, y: 30 },
  { x: 6, y: 52 },
  { x: 6, y: 74 },
  { x: 6, y: 96 },
];

export function ReportsChartBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden text-foreground",
        className,
      )}
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label="A wide editorial multi-account chart: layered area trends, bold bars with one lime standout, and faint account lines converging into a single point"
      >
        <defs>
          {/* Lime hero area: tinted at top → transparent at the floor. */}
          <linearGradient id="reports-banner-lime-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c3eb42" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#c3eb42" stopOpacity="0" />
          </linearGradient>
          {/* Neutral back area: faint foreground tint → transparent. */}
          <linearGradient id="reports-banner-back-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.06" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* (1) Depth — faint horizontal gridlines behind everything. */}
        <g stroke="currentColor" strokeOpacity={0.05} strokeWidth={1}>
          {GRIDLINES.map((y) => (
            <line key={y} x1={4} y1={y} x2={556} y2={y} />
          ))}
        </g>

        {/* (2a) Back neutral area. */}
        <path
          d={smoothPath(BACK_AREA, BASELINE)}
          fill="url(#reports-banner-back-area)"
        />

        {/* (2b) Lime hero area + bright top-edge trend line + node dots. */}
        <path
          d={smoothPath(LIME_AREA, BASELINE)}
          fill="url(#reports-banner-lime-area)"
        />
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

        {/* (4) Multi-account convergence lines + origin dots + lime node ring. */}
        <g>
          {CONVERGE_ORIGINS.map((o, i) => (
            <g key={i}>
              <path
                d={smoothPath([
                  o,
                  {
                    x: (o.x + CONVERGE_NODE.x) / 2,
                    y: (o.y + CONVERGE_NODE.y) / 2 - 8,
                  },
                  CONVERGE_NODE,
                ])}
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.12}
                strokeWidth={1}
              />
              <circle
                cx={o.x}
                cy={o.y}
                r={1.8}
                fill="currentColor"
                fillOpacity={0.18}
              />
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

        {/* (3) Foreground bars on the baseline — rounded tops, one lime standout. */}
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

        {/* (5) Floating value tag near the lime peak — the "real dashboard" cue. */}
        <g transform={`translate(${PEAK.x + 8}, ${PEAK.y - 36})`}>
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
            y2={34}
            stroke="#9cc42d"
            strokeOpacity={0.5}
            strokeWidth={1}
          />
        </g>
      </svg>
    </div>
  );
}

export default ReportsChartBanner;
