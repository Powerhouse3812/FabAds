import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowUp, Zap, CalendarClock } from "lucide-react";

/**
 * "Data Drift" — one of 5 swappable full-bleed backgrounds for
 * DarkStageSignup.tsx's centered glass card. Direction: the user's future
 * FabAds workspace ghosting into existence around them while they sign up —
 * heavily-dimmed real product-UI fragments (not images/blobs) drifting at
 * the edges of a dark void, occasionally "thinking out loud" by sharpening
 * one at a time. The card's own dark-glass panel stays the calm focal
 * point; nothing here renders inside the center-safe zone.
 *
 * Contract: default export, no props, single pointer-events-none full-bleed
 * `absolute inset-0 z-0 overflow-hidden` layer. Own <style>; every keyframe
 * is prefixed `ds-sbg-data-` so it can't collide with sibling bg variants.
 */

type Vars = CSSProperties & Record<`--${string}`, string | number>;

interface FragmentSpec {
  id: string;
  position: CSSProperties;
  width: number;
  floatDuration: number; // seconds
  floatDelay: number; // negative seconds — pre-stagger
  floatY: number; // px amplitude
  floatR: number; // deg amplitude
  materializeDelay: number; // ms
  baseOpacity: number; // resting ghost opacity
  content: ReactNode;
}

/** Tiny real micro-compositions (not grey placeholder boxes) — every one
 *  mirrors an actual FabAds surface at ghost scale: KPI tile, bar chart,
 *  campaign row, sparkline, ROAS gauge, AutoPilot toast, schedule chip. */
const KpiFragment = (
  <div className="w-[132px] rounded-lg border border-white/10 bg-white/[0.04] p-2">
    <p className="text-[9px] font-medium uppercase tracking-wide text-white/50">Spend today</p>
    <div className="mt-1 flex items-baseline justify-between gap-1.5">
      <span className="text-[13px] font-bold leading-none tabular-nums text-white/90">$12,847</span>
      <span className="flex items-center gap-0.5 rounded-full bg-primary/25 px-1.5 py-0.5 text-[9px] font-semibold tabular-nums text-primary">
        <ArrowUp className="h-2.5 w-2.5" strokeWidth={2.5} />
        8.2%
      </span>
    </div>
  </div>
);

const BarChartFragment = (
  <div className="w-[118px] rounded-lg border border-white/10 bg-white/[0.04] p-2">
    <p className="text-[9px] font-medium uppercase tracking-wide text-white/50">Weekly reach</p>
    <div className="mt-1.5 flex h-8 items-end gap-1">
      {[38, 54, 34, 70, 48, 90].map((h, i) => (
        <div
          key={i}
          className="w-full rounded-[2px]"
          style={{ height: `${h}%`, background: i === 4 ? "hsl(var(--primary))" : "rgba(255,255,255,0.16)" }}
        />
      ))}
    </div>
  </div>
);

const CampaignRowFragment = (
  <div className="flex w-[172px] items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5">
    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
    <span className="flex-1 truncate text-[9px] font-medium text-white/70">Q3_UGC_hooks_v2</span>
    <span className="shrink-0 rounded-full bg-primary/20 px-1.5 py-0.5 text-[8px] font-semibold text-primary">
      Active
    </span>
  </div>
);

const SparklineFragment = (
  <div className="w-[110px] rounded-lg border border-white/10 bg-white/[0.04] p-2">
    <p className="text-[9px] font-medium uppercase tracking-wide text-white/50">CTR 7d</p>
    <svg viewBox="0 0 80 26" className="mt-1 h-6 w-full" fill="none">
      <polyline
        points="0,21 12,17 24,19 36,10 48,13 60,6 72,4"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="72" cy="4" r="2" fill="hsl(var(--primary))" />
    </svg>
  </div>
);

const RoasGaugeFragment = (
  <div className="flex w-[80px] flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2">
    <span className="text-[8px] font-medium uppercase tracking-wide text-white/45">ROAS</span>
    <div className="relative flex h-10 w-10 items-center justify-center">
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="3"
          strokeDasharray="94.2"
          strokeDashoffset="24"
          strokeLinecap="round"
        />
      </svg>
      <span className="relative text-[10px] font-bold tabular-nums text-white/90">3.2x</span>
    </div>
  </div>
);

const AutopilotToastFragment = (
  <div className="flex w-[184px] items-start gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/25">
      <Zap className="h-2.5 w-2.5 text-primary" strokeWidth={2.5} />
    </span>
    <p className="text-[9.5px] leading-snug text-white/70">
      <span className="font-semibold text-white/85">AutoPilot</span> rebalanced 4 budgets
    </p>
  </div>
);

const ScheduleChipFragment = (
  <div className="flex w-[126px] items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5">
    <CalendarClock className="h-3 w-3 shrink-0 text-primary" strokeWidth={2.25} />
    <span className="text-[9px] font-medium tabular-nums text-white/70">Launch Wed 9:00</span>
  </div>
);

/** All 7 fragments — positioned only around the outer edges (never the
 *  center where the glass card sits), each with its own float loop
 *  amplitude/duration/delay and materialize stagger. */
const FRAGMENTS: FragmentSpec[] = [
  {
    id: "kpi",
    position: { top: "9%", left: "6%" },
    width: 132,
    floatDuration: 11,
    floatDelay: -2.4,
    floatY: 10,
    floatR: 0.4,
    materializeDelay: 0,
    baseOpacity: 0.26,
    content: KpiFragment,
  },
  {
    id: "bars",
    position: { top: "11%", right: "7%" },
    width: 118,
    floatDuration: 13,
    floatDelay: -5.1,
    floatY: 12,
    floatR: -0.5,
    materializeDelay: 150,
    baseOpacity: 0.22,
    content: BarChartFragment,
  },
  {
    id: "campaign",
    position: { top: "45%", left: "4%" },
    width: 172,
    floatDuration: 10,
    floatDelay: -1.2,
    floatY: 9,
    floatR: 0.5,
    materializeDelay: 300,
    baseOpacity: 0.28,
    content: CampaignRowFragment,
  },
  {
    id: "sparkline",
    position: { top: "41%", right: "5%" },
    width: 110,
    floatDuration: 15,
    floatDelay: -7.8,
    floatY: 13,
    floatR: -0.4,
    materializeDelay: 450,
    baseOpacity: 0.24,
    content: SparklineFragment,
  },
  {
    id: "roas",
    position: { bottom: "16%", left: "8%" },
    width: 80,
    floatDuration: 9,
    floatDelay: -3.6,
    floatY: 8,
    floatR: 0.6,
    materializeDelay: 600,
    baseOpacity: 0.3,
    content: RoasGaugeFragment,
  },
  {
    id: "toast",
    position: { bottom: "12%", right: "6%" },
    width: 184,
    floatDuration: 16,
    floatDelay: -9.4,
    floatY: 14,
    floatR: -0.6,
    materializeDelay: 750,
    baseOpacity: 0.21,
    content: AutopilotToastFragment,
  },
  {
    id: "schedule",
    position: { top: "27%", left: "5%" },
    width: 126,
    floatDuration: 12,
    floatDelay: -4.9,
    floatY: 11,
    floatR: 0.45,
    materializeDelay: 900,
    baseOpacity: 0.27,
    content: ScheduleChipFragment,
  },
];

/** Faint bezier connectors linking neighboring fragments — drawn in a
 *  0-100 percentage viewBox so endpoints line up with the FRAGMENTS
 *  position map above without unit conversion. */
const CONNECTORS = [
  { d: "M6,9 C35,1 65,1 91,11", delay: "0s" },
  { d: "M4,45 C35,60 63,28 93,41", delay: "-1.1s" },
  { d: "M8,84 C35,96 63,74 92,88", delay: "-2.3s" },
];

/** One ghost fragment: outer div owns the continuous float loop
 *  (transform-only CSS keyframe, unaffected by JS state), inner div owns
 *  materialize entrance + the periodic focus-pulse (opacity/blur/scale via
 *  plain React state + CSS transition — no keyframe, so it can't collide
 *  with the outer's transform animation). */
function GhostFragment({
  spec,
  isActive,
}: {
  spec: FragmentSpec;
  isActive: boolean;
}): JSX.Element {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setMounted(true);
      return;
    }
    const t = window.setTimeout(() => setMounted(true), spec.materializeDelay);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const outerStyle: Vars = {
    ...spec.position,
    position: "absolute",
    animationName: "ds-sbg-data-float",
    animationDuration: `${spec.floatDuration}s`,
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
    animationDelay: `${spec.floatDelay}s`,
    "--ds-float-y": `${spec.floatY}px`,
    "--ds-float-r": `${spec.floatR}deg`,
  };

  const innerStyle: Vars = mounted
    ? {
        opacity: isActive ? 0.45 : spec.baseOpacity,
        filter: isActive ? "blur(0px)" : "blur(0.5px)",
        transform: isActive ? "scale(1.02)" : "scale(1)",
        transition:
          "opacity 900ms cubic-bezier(0.22,1,0.36,1), filter 900ms cubic-bezier(0.22,1,0.36,1), transform 900ms cubic-bezier(0.22,1,0.36,1)",
        "--ds-target-opacity": String(spec.baseOpacity),
      }
    : {
        opacity: 0,
        filter: "blur(4px)",
        transform: "scale(1)",
        transition: "none",
        "--ds-target-opacity": String(spec.baseOpacity),
      };

  return (
    <div className="ds-sbg-data-fragment-outer" style={outerStyle}>
      <div className="ds-sbg-data-fragment-inner" style={innerStyle}>
        {spec.content}
      </div>
    </div>
  );
}

export default function SignupBgDataDrift(): JSX.Element {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const id = window.setInterval(() => {
      if (document.hidden) return;
      setActiveIndex((prev) => (prev + 1) % FRAGMENTS.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <style>{`
        @keyframes ds-sbg-data-float {
          0% {
            transform: translateY(calc(var(--ds-float-y, 10px) * -1)) rotate(calc(var(--ds-float-r, 0.4deg) * -1));
          }
          50% {
            transform: translateY(var(--ds-float-y, 10px)) rotate(var(--ds-float-r, 0.4deg));
          }
          100% {
            transform: translateY(calc(var(--ds-float-y, 10px) * -1)) rotate(calc(var(--ds-float-r, 0.4deg) * -1));
          }
        }

        @keyframes ds-sbg-data-dashflow {
          to { stroke-dashoffset: -32; }
        }
        .ds-sbg-data-connector {
          stroke-dasharray: 4 8;
          animation: ds-sbg-data-dashflow 3.4s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .ds-sbg-data-fragment-outer {
            animation: none !important;
          }
          .ds-sbg-data-fragment-inner {
            transition: none !important;
            opacity: var(--ds-target-opacity, 0.25) !important;
            filter: blur(0.5px) !important;
            transform: none !important;
          }
          .ds-sbg-data-connector {
            animation: none !important;
          }
        }
      `}</style>

      {/* Dark void base — deep near-black radial, slightly lifted toward
          the card's vertical center so the fragments read as sitting in
          real depth rather than on a flat plane. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 38%, hsl(var(--card)) 0%, hsl(var(--background)) 55%, hsl(var(--background)) 100%)",
        }}
      />

      {/* Sparse dot-matrix texture, 3% opacity. */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Deep corner vignettes. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 0% 0%, rgba(0,0,0,0.55) 0%, transparent 42%), " +
            "radial-gradient(circle at 100% 0%, rgba(0,0,0,0.55) 0%, transparent 42%), " +
            "radial-gradient(circle at 0% 100%, rgba(0,0,0,0.55) 0%, transparent 42%), " +
            "radial-gradient(circle at 100% 100%, rgba(0,0,0,0.55) 0%, transparent 42%)",
        }}
      />

      {/* Center-safe dark radial — keeps the zone behind the glass card
          calm and uncluttered regardless of viewport size. */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 48% 46% at 50% 50%, rgba(0,0,0,0.55) 0%, transparent 75%)",
        }}
      />

      {/* Connective tissue — faint bezier lines with an animated
          dash-flow linking neighboring fragments across the void. */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none">
        {CONNECTORS.map((c, i) => (
          <path
            key={i}
            className="ds-sbg-data-connector"
            d={c.d}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.15"
            style={{ animationDelay: c.delay }}
          />
        ))}
      </svg>

      {FRAGMENTS.map((spec, i) => (
        <GhostFragment key={spec.id} spec={spec} isActive={i === activeIndex} />
      ))}
    </div>
  );
}
