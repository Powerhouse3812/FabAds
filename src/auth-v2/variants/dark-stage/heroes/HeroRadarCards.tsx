import { useEffect, useRef, useState } from "react";
import { Zap, Shield, Clock } from "lucide-react";

import heroLogo from "@/assets/auth/hero-logo.svg";

/** "Radar cards" hero variant for Dark Stage's swappable hero-panel track —
 *  reworked from an incomplete wireframe (empty ring + polaroid-photo stack)
 *  into a MISSION-CONTROL scene: FabAds scanning and optimizing live
 *  campaigns in real time. Composition, top to bottom: brand mark + eyebrow
 *  + two-line headline + subline, a radar assembly (concentric rings, faint
 *  cross-hair axes, a rotating sweep wedge masked to the ring circle, and
 *  5 platform "blips" that light up on a timed cycle and reveal a
 *  name+campaign tooltip on hover/focus), a fanned 3-card stack of live
 *  CAMPAIGN SNAPSHOT cards (status + name + platform chip, a 5-bar mini
 *  chart, spend + ROAS) that reshuffles every 5s — front card slides out
 *  and fades, the next card promotes forward with a spring settle, and the
 *  outgoing card's data re-enters at the back of the deck — and a bottom
 *  strip of live status chips (optimizations applied, budget guard, a
 *  counting-down "next sweep" timer). All motion pauses while the tab is
 *  hidden and collapses to a single static front card under
 *  prefers-reduced-motion. The client's photo-mockup asset is deliberately
 *  not used here — the story is now telemetry/data, not a photo — but the
 *  shared hero-logo mark is kept for brand parity with the other hero
 *  sub-variants. */

type Status = "healthy" | "scaling" | "watch";

interface Campaign {
  id: number;
  name: string;
  platform: string;
  status: Status;
  spend: string;
  roas: string;
  bars: number[];
}

const CAMPAIGNS: Campaign[] = [
  {
    id: 0,
    name: "Q3_UGC_hooks",
    platform: "Meta",
    status: "healthy",
    spend: "$1,248",
    roas: "3.4x",
    bars: [42, 58, 51, 74, 66],
  },
  {
    id: 1,
    name: "festive_15s",
    platform: "TikTok",
    status: "scaling",
    spend: "$892",
    roas: "2.1x",
    bars: [30, 44, 62, 55, 70],
  },
  {
    id: 2,
    name: "search_generic",
    platform: "Google",
    status: "watch",
    spend: "$2,015",
    roas: "4.1x",
    bars: [60, 48, 66, 40, 52],
  },
];

const STATUS_TONE: Record<Status, string> = {
  healthy: "bg-primary",
  scaling: "bg-sky-400",
  watch: "bg-amber-400",
};

/** 5 radar "blips" — platform + campaign, text only (no logos). Positions
 *  are pixel coordinates (hand-placed, off-grid) inside the RADAR_BOX,
 *  spread around the ring so none sit dead-center under the card stack. */
const BLIPS = [
  { label: "Meta — Q3_UGC_hooks", x: 142, y: 22 },
  { label: "TikTok — festive_15s", x: 319, y: 115 },
  { label: "Google — search_generic", x: 257, y: 317 },
  { label: "Snapchat — story_bumper", x: 55, y: 283 },
  { label: "YouTube — preroll_15s", x: 36, y: 125 },
] as const;

const RINGS = [
  { size: 132, tone: "border-white/10", pulse: false },
  { size: 204, tone: "border-white/8", pulse: false },
  { size: 276, tone: "border-primary/14", pulse: true },
  { size: 348, tone: "border-primary/22", pulse: false },
] as const;

const RADAR_BOX = 360;
const SWEEP_SIZE = RINGS[3].size;
const CARD_W = 240;
const CARD_H = 190;

interface Pose {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  opacity: number;
  z: number;
}

// Fan offsets scale with CARD_W (x1.263, matching the 190px -> 240px card
// bump) so the stack keeps the same proportional spread instead of reading
// as a tighter, more overlap-prone fan on the bigger cards. Back-slot
// opacities were raised from the original 0.72/0.5 floor — at 0.5 the back
// card's own dark background became transparent enough that neighboring
// content (and the floor glow behind the stack) visibly bled through its
// text/chips; 0.82/0.64 keeps the depth-recession read without the bleed.
const PRE_MOUNT_POSE: Pose = { x: 0, y: 40, rotate: 0, scale: 0.85, opacity: 0, z: 1 };
const FRONT_POSE: Pose = { x: 0, y: -8, rotate: -1, scale: 1, opacity: 1, z: 30 };
const BACK_A_POSE: Pose = { x: -71, y: 20, rotate: -7, scale: 0.93, opacity: 0.82, z: 20 };
const BACK_B_POSE: Pose = { x: 63, y: 30, rotate: 5, scale: 0.87, opacity: 0.64, z: 10 };
const EXIT_POSE: Pose = { x: 136, y: 167, rotate: 11, scale: 0.78, opacity: 0, z: 5 };
const SLOT_POSES: Pose[] = [FRONT_POSE, BACK_A_POSE, BACK_B_POSE];

function poseToTransform(p: Pose): string {
  return `translate(${p.x}px, ${p.y}px) rotate(${p.rotate}deg) scale(${p.scale})`;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const SWEEP_COUNTDOWN_START = 45;

export default function HeroRadarCards(): JSX.Element {
  // order[slot] = campaign id currently occupying that slot (0 = front,
  // 1 = backA, 2 = backB). Rotates every 5s; the card that was front lands
  // in backB via a distinct "exit" pose rather than sliding straight there.
  const [order, setOrder] = useState<number[]>([0, 1, 2]);
  const [exitingId, setExitingId] = useState<number | null>(null);
  const orderRef = useRef(order);
  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  // Reduced-motion users get the settled layout immediately — no rise-in.
  const [mounted, setMounted] = useState<boolean>(() => prefersReducedMotion());
  useEffect(() => {
    if (mounted) return;
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, [mounted]);

  // Stack cycle — every 5s, promote the deck by one; pauses while the tab
  // is hidden and is skipped entirely under reduced motion.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let settleTimeout: number | undefined;
    const interval = window.setInterval(() => {
      if (document.hidden) return;
      const prev = orderRef.current;
      setExitingId(prev[0]);
      setOrder([prev[1], prev[2], prev[0]]);
      settleTimeout = window.setTimeout(() => setExitingId(null), 550);
    }, 5000);
    return () => {
      window.clearInterval(interval);
      if (settleTimeout !== undefined) window.clearTimeout(settleTimeout);
    };
  }, []);

  // "Next sweep in mm:ss" — live countdown, loops 45 -> 0; frozen under
  // reduced motion (never started) and paused while the tab is hidden.
  const [secondsLeft, setSecondsLeft] = useState(SWEEP_COUNTDOWN_START);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const interval = window.setInterval(() => {
      if (document.hidden) return;
      setSecondsLeft((s) => (s <= 0 ? SWEEP_COUNTDOWN_START : s - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="relative h-full w-full overflow-hidden">
      <style>{`
        @keyframes ds-hero-radar-rise {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ds-hero-radar-rise { animation: ds-hero-radar-rise 0.5s ease-out both; }

        .ds-hero-radar-stack-card {
          transition: transform 550ms cubic-bezier(0.22,1,0.36,1), opacity 480ms ease;
          will-change: transform, opacity;
        }

        @media (prefers-reduced-motion: no-preference) {
          @keyframes ds-hero-radar-ring-pulse {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 0.2; transform: scale(1.06); }
          }
          .ds-hero-radar-ring-pulse { animation: ds-hero-radar-ring-pulse 5s ease-in-out infinite; }

          @keyframes ds-hero-radar-sweep-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .ds-hero-radar-sweep-spin { animation: ds-hero-radar-sweep-spin 8s linear infinite; }

          @keyframes ds-hero-radar-blip-pulse {
            0%, 100% { opacity: 0.35; transform: scale(1); }
            6% { opacity: 1; transform: scale(1.4); }
            14% { opacity: 0.35; transform: scale(1); }
          }
          .ds-hero-radar-blip-pulse { animation: ds-hero-radar-blip-pulse 8s ease-in-out infinite; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ds-hero-radar-rise { animation: none; opacity: 1; transform: none; }
          .ds-hero-radar-stack-card { transition: none !important; }
          .ds-hero-radar-ring-pulse { animation: none; opacity: 0.3; transform: none; }
          .ds-hero-radar-sweep { display: none; }
          .ds-hero-radar-blip-pulse { animation: none; opacity: 0.6; transform: none; }
        }
      `}</style>

      <div className="h-full w-full p-6">
        <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--card))_100%)]">
          <div className="relative z-10 flex h-full w-full flex-col">
            {/* header — logo, eyebrow, headline, subline */}
            <div
              className="ds-hero-radar-rise flex flex-col items-center px-10 pt-8 text-center"
              style={{ animationDelay: "40ms" }}
            >
              <img src={heroLogo} alt="" aria-hidden="true" className="h-4 w-auto opacity-40" />
              <span className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                Mission Control
              </span>
              <h2 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-foreground">
                Every campaign
                <br />
                on your radar.
              </h2>
              <p className="mt-2 max-w-[300px] text-[13px] leading-relaxed text-muted-foreground">
                FabAds watches spend, creative fatigue and ROAS — and acts before you have to.
              </p>
            </div>

            {/* middle — radar scene + card stack, always centered on this
                region regardless of header/footer height */}
            <div className="relative flex flex-1 items-center justify-center">
              {/* rings, cross-hair axes, rotating sweep wedge */}
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2"
                style={{ width: RADAR_BOX, height: RADAR_BOX }}
                aria-hidden="true"
              >
                {RINGS.map((ring) => (
                  <div
                    key={ring.size}
                    className={`absolute inset-0 m-auto rounded-full border ${ring.tone} ${
                      ring.pulse ? "ds-hero-radar-ring-pulse" : ""
                    }`}
                    style={{ width: ring.size, height: ring.size }}
                  />
                ))}
                <div className="absolute inset-0 m-auto bg-white/5" style={{ width: RADAR_BOX, height: 1 }} />
                <div className="absolute inset-0 m-auto bg-white/5" style={{ width: 1, height: RADAR_BOX }} />
                <div
                  className="ds-hero-radar-sweep absolute inset-0 m-auto overflow-hidden rounded-full"
                  style={{ width: SWEEP_SIZE, height: SWEEP_SIZE }}
                >
                  <div
                    className="ds-hero-radar-sweep-spin h-full w-full"
                    style={{
                      background:
                        "conic-gradient(from 0deg, transparent 0deg, hsl(var(--primary)/0.28) 55deg, transparent 100deg)",
                    }}
                  />
                </div>
              </div>

              {/* floor glow — sits below the resting stack's bottom edge as
                  ground contact-shadow. Previously positioned at top:56%,
                  which landed squarely behind the cards' bar-chart/footer
                  rows instead of below the stack's footprint: the blurred
                  glow bled straight through the cards' translucent
                  backgrounds and read as a blurry green haze smeared across
                  the (otherwise crisp) mini bar charts. Pushed down + made
                  smaller/dimmer so it reads as grounding, not backlight. */}
              <div
                className="pointer-events-none absolute left-1/2 z-[3] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/16 blur-2xl"
                style={{ width: 170, height: 56, top: "80%" }}
                aria-hidden="true"
              />

              {/* blips — decorative (aria-hidden layer), each hover reveals a
                  platform+campaign native title tooltip */}
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 z-[6] -translate-x-1/2 -translate-y-1/2"
                style={{ width: RADAR_BOX, height: RADAR_BOX }}
                aria-hidden="true"
              >
                {BLIPS.map((b, i) => (
                  <div
                    key={b.label}
                    className="group pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: b.x, top: b.y }}
                  >
                    <span
                      className="ds-hero-radar-blip-pulse block h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_2px_hsl(var(--primary)/0.5)]"
                      style={{ animationDelay: `${i * 1.6}s` }}
                      title={b.label}
                    />
                    <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-black/90 px-2 py-1 text-[10px] text-foreground opacity-0 shadow-lg backdrop-blur transition-opacity duration-200 group-hover:opacity-100">
                      {b.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* campaign snapshot card stack */}
              <div className="relative z-20" style={{ width: CARD_W, height: CARD_H }}>
                {CAMPAIGNS.map((c) => {
                  const slot = order.indexOf(c.id);
                  const isExiting = exitingId === c.id;
                  const pose = !mounted ? PRE_MOUNT_POSE : isExiting ? EXIT_POSE : SLOT_POSES[slot];
                  return (
                    <div
                      key={c.id}
                      className="ds-hero-radar-stack-card absolute inset-0 flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#101208] p-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)]"
                      style={{
                        transform: poseToTransform(pose),
                        opacity: pose.opacity,
                        zIndex: pose.z,
                        transitionDelay: `${c.id * 90}ms`,
                      }}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_TONE[c.status]}`}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 truncate font-mono text-[13px] text-foreground">{c.name}</span>
                        <span className="ml-auto shrink-0 rounded-full border border-white/10 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {c.platform}
                        </span>
                      </div>

                      <div className="mt-4 flex h-10 items-end gap-2">
                        {c.bars.map((h, i) => (
                          <div
                            key={i}
                            className="w-full rounded-t-sm bg-gradient-to-t from-primary/25 to-primary"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="tabular-nums text-xs font-semibold text-foreground">
                          {c.spend} <span className="font-normal text-muted-foreground">today</span>
                        </span>
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[12px] font-semibold text-primary">
                          {c.roas}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* footer — live status chips */}
            <div
              className="ds-hero-radar-rise flex flex-wrap items-center justify-center gap-2 px-6 pb-10"
              style={{ animationDelay: "160ms" }}
            >
              <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-card/70 px-3 py-1.5 text-[11px] text-muted-foreground backdrop-blur-md">
                <Zap className="h-3 w-3 text-primary" />
                12 optimizations applied today
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-card/70 px-3 py-1.5 text-[11px] text-muted-foreground backdrop-blur-md">
                <Shield className="h-3 w-3 text-primary" />
                Budget guard: active
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-card/70 px-3 py-1.5 text-[11px] text-muted-foreground backdrop-blur-md">
                <Clock className="h-3 w-3 text-primary" />
                Next sweep in{" "}
                <span className="tabular-nums text-foreground">
                  {mm}:{ss}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
