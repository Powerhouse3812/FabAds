import { useId } from "react";

/**
 * "Contours" — premium topographic elevation-map ambient background for the
 * Dark Stage signup card. Two off-center elevation clusters (lower-left /
 * upper-right) keep the true center calm so the centered glass card (see
 * DarkStageSignup.tsx) always reads clean against it. Nested contour rings
 * step from near-invisible white linework at the outer edge toward
 * hsl(var(--primary)) lime at each cluster's "peak" — elevation encoded as
 * lime intensity, cartographic tick marks and summit callouts finishing the
 * poster-map read. Pure SVG + CSS, no images/canvas.
 */

type Pt = { x: number; y: number };

/** Catmull-Rom → cubic-Bezier closed-loop smoothing. Turns a small ring of
 *  jittered points into one fluid closed path — gives each contour its
 *  hand-drawn, non-circular terrain read while staying fully deterministic
 *  (no runtime randomness, so identical on every render/reload). */
function smoothClosedPath(points: Pt[]): string {
  const n = points.length;
  if (n < 3) return "";
  const seg: string[] = [`M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`];
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    seg.push(
      `C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
    );
  }
  seg.push("Z");
  return seg.join(" ");
}

/** Builds one irregular closed ring around (cx, cy): 8 angular points at
 *  radius * jitter[k], with the jitter array rotated by `rotate` steps per
 *  ring so nested rings stay roughly concentric without ever being perfect
 *  self-similar copies of each other — plausible elevation-line irregularity,
 *  the same way real topo contours drift slightly ring to ring. The 0.82 y
 *  compression keeps every ring a touch elliptical rather than circular. */
function ringPoints(cx: number, cy: number, radius: number, jitter: number[], rotate: number): Pt[] {
  const n = jitter.length;
  const pts: Pt[] = [];
  for (let k = 0; k < n; k++) {
    const angle = (k / n) * Math.PI * 2;
    const j = jitter[(k + rotate) % n];
    const r = radius * j;
    pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r * 0.82 });
  }
  return pts;
}

/** Outer → inner stroke palette: white/5 at the outermost ring stepping
 *  toward hsl(var(--primary))/45 at the innermost "peak" ring, per the
 *  elevation = lime-intensity read. 6 stops used per cluster. */
const RING_COLORS = [
  "rgba(255,255,255,0.05)",
  "rgba(255,255,255,0.08)",
  "rgba(255,255,255,0.12)",
  "hsl(var(--primary) / 0.16)",
  "hsl(var(--primary) / 0.28)",
  "hsl(var(--primary) / 0.45)",
] as const;

type Ring = { d: string; color: string };

function buildRings(center: Pt, radii: number[], jitter: number[]): Ring[] {
  return radii.map((r, i) => ({
    d: smoothClosedPath(ringPoints(center.x, center.y, r, jitter, i * 2)),
    color: RING_COLORS[i] ?? RING_COLORS[RING_COLORS.length - 1],
  }));
}

// Two elevation clusters on a 1440x900 stage — lower-left and upper-right —
// leaving the true center (where the signup card sits) calm. 6 rings each,
// 12 total, within the 8-12 nested-ring brief.
const LL_CENTER: Pt = { x: 250, y: 660 };
const UR_CENTER: Pt = { x: 1170, y: 190 };

const LL_JITTER = [1.0, 0.82, 1.18, 0.92, 1.24, 0.78, 1.08, 0.88];
const UR_JITTER = [0.88, 1.12, 0.94, 1.26, 0.84, 1.02, 1.16, 0.8];

const LL_RADII = [255, 205, 163, 128, 99, 75];
const UR_RADII = [215, 173, 137, 107, 82, 62];

const LL_RINGS = buildRings(LL_CENTER, LL_RADII, LL_JITTER);
const UR_RINGS = buildRings(UR_CENTER, UR_RADII, UR_JITTER);

const LL_PEAK = LL_RINGS[LL_RINGS.length - 1];
const UR_PEAK = UR_RINGS[UR_RINGS.length - 1];

// Mid-elevation ring (lower-left cluster) that becomes the single
// marching-dash "route" line — index 2 of 6, i.e. neither outermost nor
// the peak ring.
const LL_DASH_INDEX = 2;

// Scattered cartographic tick marks + micro elevation numbers — a handful
// riding contour edges, a couple sitting in the calmer open field for
// authenticity, all well clear of true center.
const TICKS: { x: number; y: number; dx: number; dy: number; rotate: number; label: string }[] = [
  { x: 130, y: 555, dx: 12, dy: -3, rotate: -24, label: "120" },
  { x: 365, y: 762, dx: 14, dy: 3, rotate: 10, label: "240" },
  { x: 58, y: 208, dx: 12, dy: -2, rotate: 0, label: "360" },
  { x: 1302, y: 300, dx: -34, dy: -4, rotate: -12, label: "480" },
  { x: 985, y: 108, dx: 12, dy: -3, rotate: 18, label: "600" },
  { x: 1384, y: 828, dx: -34, dy: 3, rotate: 0, label: "720" },
];

const MONO_STACK = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

export default function SignupBgContours(): JSX.Element {
  // Namespaced per-instance id so the glow filter never collides if this
  // background ever renders more than once on a page (e.g. a variant
  // picker preview grid).
  const uid = useId();
  const glowFilterId = `ds-sbg-contours-glow-${uid}`;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <style>{`
        .ds-sbg-contours-dash { stroke-dasharray: 5 5; }
        .ds-sbg-contours-label { opacity: 1; }

        @media (prefers-reduced-motion: no-preference) {
          @keyframes ds-sbg-contours-drift {
            from { transform: translate(0, 0); }
            to { transform: translate(10px, 10px); }
          }
          .ds-sbg-contours-drift {
            animation: ds-sbg-contours-drift 30s ease-in-out infinite alternate;
          }

          @keyframes ds-sbg-contours-breathe {
            0%, 100% { stroke-opacity: 0.55; }
            50% { stroke-opacity: 1; }
          }
          .ds-sbg-contours-breathe {
            animation: ds-sbg-contours-breathe 6s ease-in-out infinite;
          }

          @keyframes ds-sbg-contours-march {
            to { stroke-dashoffset: -40; }
          }
          .ds-sbg-contours-dash {
            animation: ds-sbg-contours-march 8s linear infinite;
          }

          @keyframes ds-sbg-contours-summit-pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
          .ds-sbg-contours-summit-glow {
            animation: ds-sbg-contours-summit-pulse 6s ease-in-out infinite;
          }

          @keyframes ds-sbg-contours-label-in {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .ds-sbg-contours-label {
            opacity: 0;
            animation: ds-sbg-contours-label-in 0.7s ease-out forwards;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ds-sbg-contours-drift,
          .ds-sbg-contours-breathe,
          .ds-sbg-contours-dash,
          .ds-sbg-contours-summit-glow {
            animation: none !important;
          }
          .ds-sbg-contours-label {
            opacity: 1 !important;
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* Base — near-black fill, tokenized to the app's dark background. */}
      <div className="absolute inset-0 bg-background" />

      {/* Subtle paper-texture noise — fine radial dot grain, 2-3% opacity,
          distinct from any larger ambient dot-grid used elsewhere. */}
      <div
        className="absolute inset-0 opacity-[0.6]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />

      {/* Contour field — full-bleed, slow imperceptible diagonal drift. */}
      <svg
        className="ds-sbg-contours-drift absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <filter id={glowFilterId} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        {/* Lower-left cluster — "ROAS peak" */}
        <g>
          <path
            d={LL_PEAK.d}
            stroke="hsl(var(--primary))"
            strokeOpacity={0.4}
            strokeWidth={4}
            filter={`url(#${glowFilterId})`}
          />
          {LL_RINGS.map((ring, i) => (
            <path
              key={`ll-${i}`}
              d={ring.d}
              stroke={ring.color}
              strokeWidth={1}
              className={`ds-sbg-contours-breathe${i === LL_DASH_INDEX ? " ds-sbg-contours-dash" : ""}`}
              style={{ animationDelay: `${(LL_RINGS.length - 1 - i) * 300}ms` }}
            />
          ))}
          <circle
            cx={LL_CENTER.x}
            cy={LL_CENTER.y}
            r={9}
            fill="hsl(var(--primary) / 0.25)"
            className="ds-sbg-contours-summit-glow"
          />
          <circle cx={LL_CENTER.x} cy={LL_CENTER.y} r={3} fill="hsl(var(--primary))" />
        </g>

        {/* Upper-right cluster — "CTR ridge" */}
        <g>
          <path
            d={UR_PEAK.d}
            stroke="hsl(var(--primary))"
            strokeOpacity={0.4}
            strokeWidth={4}
            filter={`url(#${glowFilterId})`}
          />
          {UR_RINGS.map((ring, i) => (
            <path
              key={`ur-${i}`}
              d={ring.d}
              stroke={ring.color}
              strokeWidth={1}
              className="ds-sbg-contours-breathe"
              style={{ animationDelay: `${(UR_RINGS.length - 1 - i) * 300}ms` }}
            />
          ))}
          <circle
            cx={UR_CENTER.x}
            cy={UR_CENTER.y}
            r={9}
            fill="hsl(var(--primary) / 0.25)"
            className="ds-sbg-contours-summit-glow"
          />
          <circle cx={UR_CENTER.x} cy={UR_CENTER.y} r={3} fill="hsl(var(--primary))" />
        </g>

        {/* Cartographic tick marks + micro elevation numbers. */}
        {TICKS.map((t, i) => (
          <g key={`tick-${i}`}>
            <line
              x1={t.x}
              y1={t.y - 5}
              x2={t.x}
              y2={t.y + 5}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth={1}
              transform={`rotate(${t.rotate} ${t.x} ${t.y})`}
            />
            <text
              x={t.x + t.dx}
              y={t.y + t.dy}
              fontSize={8}
              fontFamily={MONO_STACK}
              fill="rgba(255,255,255,0.2)"
            >
              {t.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Corner vignettes — depth in the two otherwise-empty corners. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 0% 0%, rgba(0,0,0,0.5) 0%, transparent 45%), radial-gradient(ellipse at 100% 100%, rgba(0,0,0,0.5) 0%, transparent 45%)",
        }}
      />

      {/* Center-safe vignette — recedes any contour tails behind the card
          so the centered glass card always sits on a calm field. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 32%, transparent 58%)",
        }}
      />

      {/* Summit label callouts — HTML glass pills, fade in late (1s+). */}
      <div
        className="ds-sbg-contours-label absolute flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 bg-card/60 px-2.5 py-1 backdrop-blur-md"
        style={{
          left: `${(LL_CENTER.x / 1440) * 100}%`,
          top: `${(LL_CENTER.y / 900) * 100}%`,
          transform: "translate(14px, -32px)",
          animationDelay: "1.1s",
          fontSize: "10px",
          fontFamily: MONO_STACK,
        }}
      >
        <span className="h-1 w-1 rounded-full bg-primary" aria-hidden="true" />
        <span className="text-foreground/80">ROAS peak — 4.2x</span>
      </div>

      <div
        className="ds-sbg-contours-label absolute flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 bg-card/60 px-2.5 py-1 backdrop-blur-md"
        style={{
          left: `${(UR_CENTER.x / 1440) * 100}%`,
          top: `${(UR_CENTER.y / 900) * 100}%`,
          transform: "translate(-100%, 16px)",
          animationDelay: "1.3s",
          fontSize: "10px",
          fontFamily: MONO_STACK,
        }}
      >
        <span className="h-1 w-1 rounded-full bg-primary" aria-hidden="true" />
        <span className="text-foreground/80">CTR ridge — 2.9%</span>
      </div>
    </div>
  );
}
