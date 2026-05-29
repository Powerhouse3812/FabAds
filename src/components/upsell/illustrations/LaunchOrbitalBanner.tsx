import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Launch orbital-dispatch BANNER ─────────────────────────────────────────────
//
// Wide (~560×220, 2.5:1) re-composition of the orbital-dispatch hero from
// LaunchUpsellPage, tuned to sit full-bleed at the top of the Launch paywall modal.
//
// The user's workspace tile (left-center) holds 47 built-but-grounded ads. Three
// platform "planets" sit to the right. Three arc trajectories connect them: the
// MIDDLE arc is LIME + solid — the open route, with resting ad-dots plus one dot
// animating along it toward an open (lime-ringed) planet. The TOP + BOTTOM arcs are
// dashed grey and locked, each carrying a small Lock glyph at its midpoint.
//
// Theme-aware: neutral geometry uses `currentColor` driven by Tailwind `text-*`
// classes + opacity. The only literal hex is the lime brand pair (#c3eb42 → #9cc42d)
// where a real lime fill / gradient / stroke is required regardless of theme.

// Arc paths from the workspace node (~158,110) out to the three planets (~470, y).
// Declared once so the markup + animateMotion stay in sync.
const ARC_TOP = "M 158 96 Q 312 30 460 56";
const ARC_MID = "M 162 110 Q 316 110 460 110";
const ARC_BOTTOM = "M 158 124 Q 312 190 460 164";

export function LaunchOrbitalBanner({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full overflow-hidden text-foreground", className)}>
      <svg
        viewBox="0 0 560 220"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label="47 ads built in your workspace, with locked trajectories to Meta and NewsBreak and one open lime path to TikTok"
      >
        <defs>
          {/* Faint background dot-grid for depth */}
          <pattern
            id="launch-banner-dots"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx="2"
              cy="2"
              r="1"
              className="text-foreground"
              fill="currentColor"
              opacity="0.06"
            />
          </pattern>

          {/* Lime gradient for the open trajectory — literal brand lime allowed here */}
          <linearGradient id="launch-banner-lime" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#c3eb42" />
            <stop offset="100%" stopColor="#9cc42d" />
          </linearGradient>

          {/* Soft lime glow behind the workspace tile */}
          <radialGradient id="launch-banner-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c3eb42" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#c3eb42" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1 ─ Background depth */}
        <rect x="0" y="0" width="560" height="220" fill="url(#launch-banner-dots)" />

        {/* 4 ─ Locked trajectories (drawn first, behind everything) */}
        <g className="text-muted-foreground">
          <path
            d={ARC_TOP}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 7"
            strokeLinecap="round"
            opacity="0.35"
          />
          <path
            d={ARC_BOTTOM}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 7"
            strokeLinecap="round"
            opacity="0.35"
          />
        </g>

        {/* 4b ─ Open lime trajectory */}
        <g>
          <path
            d={ARC_MID}
            fill="none"
            stroke="url(#launch-banner-lime)"
            strokeWidth="2.25"
            strokeLinecap="round"
          />
          {/* Static ad-dots resting along the open path */}
          <circle cx="244" cy="110" r="3" fill="url(#launch-banner-lime)" opacity="0.85" />
          <circle cx="316" cy="110" r="3" fill="url(#launch-banner-lime)" opacity="0.6" />
          <circle cx="388" cy="110" r="3" fill="url(#launch-banner-lime)" opacity="0.4" />

          {/* 5 ─ Motion: one ad-dot travelling the open path toward the planet */}
          <circle r="4.5" fill="#c3eb42">
            <animateMotion
              dur="3.2s"
              repeatCount="indefinite"
              keyPoints="0;1"
              keyTimes="0;1"
              calcMode="linear"
              path={ARC_MID}
            />
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              keyTimes="0;0.12;0.82;1"
              dur="3.2s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* 4c ─ Lock glyphs at the midpoint of each locked arc */}
        <g className="text-muted-foreground" opacity="0.7">
          <LockBadge x={312} y={62} />
          <LockBadge x={312} y={158} />
        </g>

        {/* 3 ─ Three platform planets (right, vertically spread) */}
        <PlanetNode cx={470} cy={48} label="Meta" locked />
        <PlanetNode cx={470} cy={110} label="TikTok" open />
        <PlanetNode cx={470} cy={172} label="NewsBreak" locked />

        {/* 2 ─ Central source node: the workspace holding the 47 grounded ads */}
        <g>
          {/* glow */}
          <circle cx="130" cy="110" r="78" fill="url(#launch-banner-glow)" />

          {/* workspace tile */}
          <g className="text-primary">
            <rect
              x="101"
              y="81"
              width="58"
              height="58"
              rx="13"
              fill="currentColor"
              opacity="0.10"
            />
            <rect
              x="101"
              y="81"
              width="58"
              height="58"
              rx="13"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.9"
            />
            {/* 3 stacked ad-rectangles = the queued ads */}
            <rect x="112" y="93" width="36" height="7" rx="2.25" fill="currentColor" opacity="0.55" />
            <rect x="112" y="105" width="36" height="7" rx="2.25" fill="currentColor" opacity="0.38" />
            <rect x="112" y="117" width="36" height="7" rx="2.25" fill="currentColor" opacity="0.24" />
          </g>

          {/* "47" label below the tile */}
          <text
            x="130"
            y="158"
            textAnchor="middle"
            className="fill-foreground font-mono"
            style={{ fontSize: "14px", fontWeight: 700 }}
          >
            47
          </text>
          <text
            x="130"
            y="173"
            textAnchor="middle"
            className="fill-muted-foreground font-mono"
            style={{ fontSize: "8px", letterSpacing: "0.14em" }}
          >
            ADS BUILT
          </text>
        </g>
      </svg>
    </div>
  );
}

// Tiny lock badge centred on (x, y) — a card-coloured disc behind a lucide Lock glyph.
function LockBadge({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x - 6}, ${y - 6})`}>
      <circle
        cx="6"
        cy="6"
        r="9.5"
        className="text-card"
        fill="currentColor"
      />
      <Lock
        x={0}
        y={0}
        width={12}
        height={12}
        stroke="currentColor"
        strokeWidth={2}
        fill="none"
      />
    </g>
  );
}

// A platform planet: a muted neutral circle with a 1px border + mono label below.
// `open` planets get a faint lime ring so the destination of the lime path reads.
function PlanetNode({
  cx,
  cy,
  label,
  open,
  locked,
}: {
  cx: number;
  cy: number;
  label: string;
  open?: boolean;
  locked?: boolean;
}) {
  return (
    <g>
      {open && (
        <circle
          cx={cx}
          cy={cy}
          r="26"
          className="text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.35"
        />
      )}
      <circle
        cx={cx}
        cy={cy}
        r="20"
        className="text-muted-foreground"
        fill="currentColor"
        opacity={open ? 0.1 : 0.06}
      />
      <circle
        cx={cx}
        cy={cy}
        r="20"
        className={open ? "text-primary" : "text-border"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        opacity={open ? 0.7 : 0.9}
      />
      {/* inner mark — first letter of the platform */}
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        className={open ? "fill-foreground font-mono" : "fill-muted-foreground font-mono"}
        style={{ fontSize: "12px", fontWeight: 700, opacity: open ? 0.85 : 0.55 }}
      >
        {label.charAt(0)}
      </text>
      {/* label below */}
      <text
        x={cx}
        y={cy + 36}
        textAnchor="middle"
        className="fill-muted-foreground font-mono"
        style={{ fontSize: "9px", letterSpacing: "0.06em", opacity: locked ? 0.6 : 0.85 }}
      >
        {label}
      </text>
    </g>
  );
}
