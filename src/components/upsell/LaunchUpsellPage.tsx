import { Link } from "react-router-dom";
import { ArrowRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Orbital dispatch illustration ──────────────────────────────────────────────
//
// Hero scene: the user's workspace (left-center) holds 47 built-but-grounded ads.
// Three platform "planets" sit far to the right. Curved arc trajectories connect
// the workspace to each planet. The middle arc is LIME + solid (the open trial
// path, with ad-dots travelling along it); the top + bottom arcs are dashed grey
// and locked — the ads can't reach those platforms on the AI plan.
//
// Theme-aware: geometry is drawn with `currentColor` driven by Tailwind `text-*`
// classes on the wrapping <g> groups + opacity for tints. The only literal hex is
// the lime brand pair (#c3eb42 → #9cc42d) inside the gradient where a real lime is
// needed regardless of theme.

// Arc paths (quadratic beziers) from the workspace node (~196,180) out to the
// three planets (~636, y). Declared once so the markup + animateMotion agree.
const ARC_TOP = "M 196 162 Q 392 56 624 84";
const ARC_MID = "M 214 180 Q 420 180 612 180";
const ARC_BOTTOM = "M 196 198 Q 392 304 624 276";

function OrbitalIllustration() {
  return (
    <svg
      viewBox="0 0 800 360"
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full max-h-[340px]"
      role="img"
      aria-label="47 ads built in your workspace, with locked trajectories to Meta and NewsBreak and one open lime path to TikTok"
    >
      <defs>
        {/* Faint background dot-grid for depth */}
        <pattern
          id="orbital-dots"
          width="22"
          height="22"
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx="2"
            cy="2"
            r="1.1"
            className="text-foreground"
            fill="currentColor"
            opacity="0.06"
          />
        </pattern>

        {/* Lime gradient for the open trajectory — literal brand lime allowed here */}
        <linearGradient id="orbital-lime" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c3eb42" />
          <stop offset="100%" stopColor="#9cc42d" />
        </linearGradient>

        {/* Soft glow behind the workspace node */}
        <radialGradient id="orbital-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c3eb42" stopOpacity="0.20" />
          <stop offset="100%" stopColor="#c3eb42" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 1 ─ Background depth */}
      <rect x="0" y="0" width="800" height="360" fill="url(#orbital-dots)" />

      {/* 4 ─ Locked trajectories (drawn first, behind everything) */}
      <g className="text-muted-foreground">
        <path
          d={ARC_TOP}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="2 7"
          strokeLinecap="round"
          opacity="0.38"
        />
        <path
          d={ARC_BOTTOM}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="2 7"
          strokeLinecap="round"
          opacity="0.38"
        />
      </g>

      {/* 4b ─ Open lime trajectory */}
      <g>
        <path
          id="orbital-lime-path"
          d={ARC_MID}
          fill="none"
          stroke="url(#orbital-lime)"
          strokeWidth="2.25"
          strokeLinecap="round"
        />
        {/* Static ad-dots resting along the open path */}
        <circle cx="300" cy="180" r="3" fill="url(#orbital-lime)" opacity="0.85" />
        <circle cx="406" cy="180" r="3" fill="url(#orbital-lime)" opacity="0.6" />
        <circle cx="512" cy="180" r="3" fill="url(#orbital-lime)" opacity="0.4" />

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
        <LockBadge x={392} y={108} />
        <LockBadge x={392} y={252} />
      </g>

      {/* 3 ─ Three platform planets (far right, muted / "unreachable") */}
      <PlanetNode cx={636} cy={84} label="Meta" locked />
      <PlanetNode cx={636} cy={180} label="TikTok" open />
      <PlanetNode cx={636} cy={276} label="NewsBreak" locked />

      {/* 2 ─ Central source node: the workspace holding the 47 grounded ads */}
      <g>
        {/* glow */}
        <circle cx="196" cy="180" r="92" fill="url(#orbital-glow)" />

        {/* workspace tile */}
        <g className="text-primary">
          <rect
            x="164"
            y="148"
            width="64"
            height="64"
            rx="14"
            fill="currentColor"
            opacity="0.10"
          />
          <rect
            x="164"
            y="148"
            width="64"
            height="64"
            rx="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.9"
          />
          {/* 3 stacked ad-rectangles = the queued ads */}
          <rect x="176" y="162" width="40" height="8" rx="2.5" fill="currentColor" opacity="0.55" />
          <rect x="176" y="176" width="40" height="8" rx="2.5" fill="currentColor" opacity="0.38" />
          <rect x="176" y="190" width="40" height="8" rx="2.5" fill="currentColor" opacity="0.24" />
        </g>

        {/* "47" label below the tile */}
        <text
          x="196"
          y="234"
          textAnchor="middle"
          className="fill-foreground font-mono"
          style={{ fontSize: "15px", fontWeight: 700 }}
        >
          47
        </text>
        <text
          x="196"
          y="250"
          textAnchor="middle"
          className="fill-muted-foreground font-mono"
          style={{ fontSize: "8.5px", letterSpacing: "0.14em" }}
        >
          ADS BUILT
        </text>
      </g>
    </svg>
  );
}

// Tiny lock badge centred on (x, y) — drawn from a unit lucide-style glyph scaled up.
function LockBadge({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x - 7}, ${y - 7})`}>
      <circle
        cx="7"
        cy="7"
        r="11"
        className="text-card"
        fill="currentColor"
      />
      <Lock
        x={0}
        y={0}
        width={14}
        height={14}
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
          r="30"
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
        r="24"
        className="text-muted-foreground"
        fill="currentColor"
        opacity={open ? 0.1 : 0.06}
      />
      <circle
        cx={cx}
        cy={cy}
        r="24"
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
        style={{ fontSize: "13px", fontWeight: 700, opacity: open ? 0.85 : 0.55 }}
      >
        {label.charAt(0)}
      </text>
      {/* label below */}
      <text
        x={cx}
        y={cy + 44}
        textAnchor="middle"
        className="fill-muted-foreground font-mono"
        style={{ fontSize: "10px", letterSpacing: "0.06em", opacity: locked ? 0.6 : 0.85 }}
      >
        {label}
      </text>
    </g>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function LaunchUpsellPage() {
  return (
    <div className="relative flex h-full min-h-[520px] w-full flex-col overflow-hidden">
      {/* Floating eyebrow, top-left over the illustration */}
      <p className="absolute left-8 top-7 z-10 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50">
        Upgrade · Launch
      </p>

      {/* Illustration zone — the centrepiece */}
      <div className="flex flex-1 items-center justify-center px-8 pt-8">
        <OrbitalIllustration />
      </div>

      {/* Bottom conversion band */}
      <div
        className={cn(
          "mt-auto flex flex-col gap-4 border-t border-border/40 px-8 py-6",
          "sm:flex-row sm:items-end sm:justify-between"
        )}
      >
        <div>
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50">
            Grounded · AI plan
          </p>
          <h1 className="text-[28px] font-bold leading-none tracking-tight text-foreground">
            47 ads. Zero launched.
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Built and grounded in Genie. Growth publishes them to 12 accounts at once.
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <Link
            to="/plans-v2?tier=growth&view=trial"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-[13px] font-bold text-foreground transition-colors hover:bg-primary/90"
          >
            Start 14-day Growth trial
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/50">
            No card required · cancel any time
          </span>
        </div>
      </div>
    </div>
  );
}
