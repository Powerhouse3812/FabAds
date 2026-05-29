/**
 * LaunchUpsellCard — large, illustrated upsell card for the AI-plan dashboard.
 *
 * Horizontal band: LEFT (~55%) conversion copy + lime CTA, RIGHT (~45%) a
 * custom isometric SVG of 12 stacked platform slabs — only the crowning top
 * slab is lime ("reached"), the 11 beneath it are greyed ("locked"). Designed
 * to read as a 3D object, not a flat data card. Composed into a vertical stack
 * by UpsellRow (wired separately).
 *
 * Locked decisions (do not reopen):
 *   - Tier: Growth · Trial: 14-day
 *   - Accounts: 1 of 12 reached, 11 locked
 */
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LaunchUpsellCardProps {
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Isometric slab geometry
//
// Each slab is a 3D parallelepiped drawn as 3 polygons sharing a centre:
//   - top face  : diamond/rhombus (lighter)
//   - left face : front-left wall, dropped by `thickness` (mid)
//   - right face: front-right wall, dropped by `thickness` (darker)
// Stack recedes upward; slabs are nudged right as they rise to imply depth.
// ─────────────────────────────────────────────────────────────────────────────

const HALF_W = 78; // horizontal half-width of the diamond top
const DEPTH = 38; // vertical squish of the diamond (front/back point offset)
const THICKNESS = 12; // slab wall height
const PITCH = 18; // vertical gap between stacked slab centres
const SLAB_COUNT = 12;
const RECEDE_X = 2.4; // px the stack drifts right per slab as it rises

type FaceColors = {
  top: string;
  left: string;
  right: string;
  topOpacity?: number;
  leftOpacity?: number;
  rightOpacity?: number;
};

/** Returns the 3 face polygons for one slab centred at (cx, cy). */
function Slab({
  cx,
  cy,
  colors,
}: {
  cx: number;
  cy: number;
  colors: FaceColors;
}) {
  // Diamond top corners (clockwise from the back/top point).
  const top = { x: cx, y: cy - DEPTH }; // back
  const right = { x: cx + HALF_W, y: cy }; // right
  const bottom = { x: cx, y: cy + DEPTH }; // front
  const left = { x: cx - HALF_W, y: cy }; // left

  const topFace = `${top.x},${top.y} ${right.x},${right.y} ${bottom.x},${bottom.y} ${left.x},${left.y}`;

  // Left wall: drops from left→front edge by THICKNESS.
  const leftFace = `${left.x},${left.y} ${bottom.x},${bottom.y} ${bottom.x},${bottom.y + THICKNESS} ${left.x},${left.y + THICKNESS}`;

  // Right wall: drops from front→right edge by THICKNESS.
  const rightFace = `${bottom.x},${bottom.y} ${right.x},${right.y} ${right.x},${right.y + THICKNESS} ${bottom.x},${bottom.y + THICKNESS}`;

  return (
    <g>
      <polygon
        points={rightFace}
        fill={colors.right}
        fillOpacity={colors.rightOpacity ?? 1}
      />
      <polygon
        points={leftFace}
        fill={colors.left}
        fillOpacity={colors.leftOpacity ?? 1}
      />
      <polygon
        points={topFace}
        fill={colors.top}
        fillOpacity={colors.topOpacity ?? 1}
      />
    </g>
  );
}

// Locked slabs: theme-aware greys via currentColor (text-foreground) + opacity.
const LOCKED: FaceColors = {
  top: "currentColor",
  left: "currentColor",
  right: "currentColor",
  topOpacity: 0.1,
  leftOpacity: 0.07,
  rightOpacity: 0.05,
};

// The crowning slab: real lime fills.
const LIME: FaceColors = {
  top: "#c3eb42",
  left: "#9cc42d",
  right: "#86a826",
  topOpacity: 0.92,
  leftOpacity: 1,
  rightOpacity: 1,
};

function IsometricStack() {
  // Base centre of the bottom-most slab, near the lower-left of the canvas.
  const baseX = 150;
  const baseY = 226;

  // Bottom (i=0) → top (i=11). Render in order so higher slabs overlap lower.
  const slabs = Array.from({ length: SLAB_COUNT }, (_, i) => {
    const cx = baseX + i * RECEDE_X;
    const cy = baseY - i * PITCH;
    const isTop = i === SLAB_COUNT - 1;
    return { i, cx, cy, isTop };
  });

  // Centre of the top (lime) slab — anchor for the glow + crown dot.
  const topSlab = slabs[SLAB_COUNT - 1];

  return (
    <svg
      viewBox="0 0 360 280"
      className="h-full w-full text-foreground"
      role="img"
      aria-label="An isometric stack of twelve account slabs with only the top one lit lime"
    >
      <defs>
        {/* Soft lime glow behind the crowning slab. */}
        <radialGradient id="launch-lime-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c3eb42" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#c3eb42" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Depth cue — blurred lime halo so the lime slab pops. */}
      <ellipse
        cx={topSlab.cx + 4}
        cy={topSlab.cy - 4}
        rx={120}
        ry={78}
        fill="url(#launch-lime-glow)"
      />

      {/* The 11 locked slabs + the lime crown (painter's order, low→high). */}
      {slabs.map(({ i, cx, cy, isTop }) => (
        <g key={i}>
          <Slab cx={cx} cy={cy} colors={isTop ? LIME : LOCKED} />
          {/* Subtle lock dot on locked slabs' top face. */}
          {!isTop && (
            <circle
              cx={cx}
              cy={cy}
              r={1.6}
              fill="currentColor"
              fillOpacity={0.16}
            />
          )}
        </g>
      ))}

      {/* Crown marker on the lime slab — a small dark notch for "reached". */}
      <circle
        cx={topSlab.cx}
        cy={topSlab.cy}
        r={3}
        fill="#1a1a1a"
        fillOpacity={0.55}
      />

      {/* "11 locked" annotation near the base of the stack. */}
      <g
        transform={`translate(${baseX + HALF_W - 8}, ${baseY + 26})`}
        className="text-foreground"
      >
        <line
          x1={-HALF_W - 4}
          y1={-2}
          x2={-12}
          y2={-2}
          stroke="currentColor"
          strokeOpacity={0.18}
          strokeWidth={1}
        />
        <text
          x={0}
          y={2}
          fontFamily="ui-monospace, monospace"
          fontSize={11}
          letterSpacing={1.4}
          fill="currentColor"
          fillOpacity={0.4}
        >
          11 LOCKED
        </text>
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export function LaunchUpsellCard({ className }: LaunchUpsellCardProps) {
  return (
    <section
      className={cn(
        "relative flex min-h-[240px] overflow-hidden rounded-2xl border border-border/60 bg-card",
        className,
      )}
    >
      {/* LEFT — content (55%) */}
      <div className="flex flex-1 flex-col justify-center gap-3 p-7">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50">
          Upgrade · Launch
        </p>
        <h3 className="text-[22px] font-bold leading-tight tracking-tight text-foreground">
          1 of 12 accounts
          <br />
          reached.
        </h3>
        <p className="max-w-[300px] text-[13px] leading-relaxed text-muted-foreground">
          Every ad you make ships to one account. Growth pushes the same ad to
          all 12 in a single click.
        </p>
        <div className="mt-1 flex items-center gap-3">
          <Link
            to="/plans-v2?tier=growth&view=trial"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-[12.5px] font-bold text-foreground transition-colors hover:bg-primary/90"
          >
            Try Growth · 14-day trial
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </Link>
        </div>
      </div>

      {/* RIGHT — illustration (45%) */}
      <div className="relative hidden w-[44%] shrink-0 items-center justify-center overflow-hidden sm:flex">
        <IsometricStack />
      </div>
    </section>
  );
}

export default LaunchUpsellCard;
