import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { BadgeCheck, BarChart3, Radio, Rocket, Sparkles, Star, Target, TrendingUp } from "lucide-react";
import heroLogo from "@/assets/auth/hero-logo.svg";

/** "Gradient Art" hero variant for Dark Stage's swappable hero-panel track.
 *
 *  v2 (2026-07-15 client rework): the v1 pass read as an incomplete
 *  wireframe — two static quote cards over a couple of blurred CSS blobs.
 *  This rework keeps the same bones (inset rounded-[28px] art surface,
 *  green/lime/champagne palette, logo top-left) but makes both halves do
 *  real work:
 *
 *  1. The art surface is a live Canvas 2D painting — 4 sine-wave ribbons
 *     with additive ("lighter") blending and a slow phase drift, so the
 *     composition has actual band edges (structure) instead of a formless
 *     blurred glow. Sized to its container via ResizeObserver, DPR-aware,
 *     frame work capped to ~30fps, and the whole rAF loop is replaced by a
 *     single static frame under prefers-reduced-motion.
 *  2. The testimonial strip is a small rotating "wall": one featured quote
 *     card (avatar, role, 5-star rating, verified chip, hanging quote
 *     mark) with the next quote peeking from behind/right at reduced scale
 *     and opacity. Every 6s the peek promotes to featured; a row of
 *     progress dots shows/controls the rotation. Rotation is driven by a
 *     single CSS fill-bar animation (no setInterval) so pausing on
 *     hover/tab-hidden is just `animation-play-state`, and reduced-motion
 *     users get a static filled dot with manual dot-click navigation only.
 *  3. v3 (client: "art also seems empty, place floating elements with
 *     parallax"): a decorative layer of 6 glass "product signal" chips
 *     (Meta / TikTok / Google / +24% CTR / Live / Reach) scattered across
 *     the upper/mid art area, clear of the stat lockup and testimonial
 *     wall. Each chip composes three independent motions on three nested
 *     elements — outer: cursor parallax (rAF-throttled mousemove, latest-
 *     event ref + single pending-frame guard, offset normalized to the
 *     panel's own bounding rect), middle: an infinite idle float bob
 *     (CSS keyframe, per-chip duration/delay), inner: a one-time staggered
 *     fade+rise entrance — mirroring the bob+parallax composition in
 *     Concept06ScatteredDesk.tsx. The whole layer is `pointer-events-none`
 *     (purely decorative, never intercepts the testimonial wall's buttons/
 *     dots) and drops the mousemove listener + idle float + parallax
 *     entirely under prefers-reduced-motion.
 */

type Testimonial = {
  initials: string;
  name: string;
  role: string;
  company: string;
  quote: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    initials: "TG",
    name: "Tulika Goswami",
    role: "Performance Lead",
    company: "Meraki Media",
    quote: "Cut our launch time from 3 days to 20 minutes. AutoPilot just handles it.",
  },
  {
    initials: "RS",
    name: "Rahul Saini",
    role: "Founder",
    company: "Idea Clan",
    quote: "One dashboard for 40+ ad accounts. Reporting finally makes sense.",
  },
  {
    initials: "SC",
    name: "Sarah Chen",
    role: "Growth Manager",
    company: "Northbeam Labs",
    quote: "The creative rotation alone paid for the subscription in week one.",
  },
  {
    initials: "MJ",
    name: "Marcus Johnson",
    role: "Media Buyer",
    company: "Freelance",
    quote: "I stopped babysitting budgets. FabAds guards them better than I did.",
  },
];

const ROTATE_MS = 6000;
const COMPANY_CHIPS = ["Meraki", "Idea Clan", "Northbeam"];

/** Star rating row — 4 full + 1 half (4.5/5). A muted five-star base row
 *  sits behind a primary-filled five-star row that's clipped to 90% width
 *  (4.5 / 5), so the 5th star reads as exactly half-filled. The visual rows
 *  are aria-hidden; the semantic rating lives on the wrapping `role="img"`. */
function StarRating({ rating }: { rating: number }) {
  return (
    <div role="img" aria-label={`Rated ${rating} out of 5 stars`} className="relative inline-flex">
      <div aria-hidden="true" className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-3 w-3 text-white/15" />
        ))}
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 flex gap-0.5 overflow-hidden"
        style={{ width: `${(rating / 5) * 100}%` }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-3 w-3 shrink-0 fill-primary text-primary" />
        ))}
      </div>
    </div>
  );
}

/** prefers-reduced-motion, kept live in case the OS setting changes mid-session. */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** Ribbon definitions for the generative art surface. Each band is a filled
 *  sine ribbon (two mirrored sine traces closed into a shape), not a blurred
 *  blob — so the composition keeps visible edges. `speed` and `freq` are
 *  deliberately irregular per band (and some negative) so the bands drift
 *  independently rather than in lockstep. Phase advances at ~0.15rad/s. */
const BANDS = [
  { hue: 84, sat: 70, light: 55, alpha: 0.32, amp: 0.16, freq: 0.0072, speed: 1, yPos: 0.26, thickness: 0.22 },
  { hue: 150, sat: 55, light: 22, alpha: 0.42, amp: 0.13, freq: 0.0105, speed: -0.72, yPos: 0.5, thickness: 0.27 },
  { hue: 45, sat: 55, light: 72, alpha: 0.2, amp: 0.11, freq: 0.0066, speed: 0.55, yPos: 0.74, thickness: 0.18 },
  { hue: 150, sat: 45, light: 34, alpha: 0.27, amp: 0.15, freq: 0.009, speed: -0.4, yPos: 0.4, thickness: 0.25 },
] as const;

function paintBands(ctx: CanvasRenderingContext2D, width: number, height: number, phase: number) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "hsl(150, 38%, 6%)";
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";

  const step = Math.max(4, Math.round(width / 160));

  for (const band of BANDS) {
    const baseY = height * band.yPos;
    const amp = height * band.amp;
    const thickness = height * band.thickness;
    const bandPhase = phase * band.speed;

    ctx.beginPath();
    for (let x = 0; x <= width; x += step) {
      const y = baseY + Math.sin(x * band.freq + bandPhase) * amp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    for (let x = width; x >= 0; x -= step) {
      const y = baseY + thickness + Math.sin(x * band.freq + bandPhase) * amp;
      ctx.lineTo(x, y);
    }
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, baseY - amp, 0, baseY + thickness + amp);
    gradient.addColorStop(0, `hsla(${band.hue}, ${band.sat}%, ${band.light}%, 0)`);
    gradient.addColorStop(0.5, `hsla(${band.hue}, ${band.sat}%, ${band.light}%, ${band.alpha})`);
    gradient.addColorStop(1, `hsla(${band.hue}, ${band.sat}%, ${band.light}%, 0)`);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  ctx.globalCompositeOperation = "source-over";
}

/** Canvas 2D art surface — sized to its container via ResizeObserver
 *  (devicePixelRatio-aware for crisp retina lines), painting slow sine-wave
 *  ribbons. Frame work is capped to ~30fps (frames are skipped rather than
 *  redrawing every rAF tick) and paused entirely while the tab is hidden.
 *  Under prefers-reduced-motion the rAF loop never starts — a single
 *  static frame is painted and left alone. Fully cleaned up on unmount. */
function CanvasArt({ reducedMotion }: { reducedMotion: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let phase = 0;
    let rafId = 0;
    let lastTime = 0;
    let lastDrawTime = 0;
    const FRAME_BUDGET_MS = 1000 / 30;

    const resize = (w: number, h: number) => {
      width = w;
      height = h;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintBands(ctx, w, h, phase);
    };

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      if (document.hidden) return;
      if (now - lastDrawTime < FRAME_BUDGET_MS) return;
      const elapsed = lastTime ? now - lastTime : FRAME_BUDGET_MS;
      lastTime = now;
      lastDrawTime = now;
      phase += 0.00015 * elapsed;
      paintBands(ctx, width, height, phase);
    };

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width: w, height: h } = entry.contentRect;
      if (w <= 0 || h <= 0) return;
      resize(w, h);
    });
    ro.observe(container);

    // paint an immediate first frame in case the observer's initial
    // callback lands a tick late (avoids a blank flash on mount).
    const initialRect = container.getBoundingClientRect();
    if (initialRect.width > 0 && initialRect.height > 0) {
      resize(initialRect.width, initialRect.height);
    }

    if (!reducedMotion) {
      rafId = requestAnimationFrame(tick);
    }

    return () => {
      ro.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas ref={canvasRef} aria-hidden="true" className="block h-full w-full" />
    </div>
  );
}

/** Floating "product signal" chip specs — decorative only, no click targets.
 *  Positions are percentages of the art panel, kept clear of two fixed
 *  zones: the top-right stat lockup (roughly top<10%, left>60%) and the
 *  top-left brand mark (roughly top<8%, left<10%), and capped at top<=46%
 *  so nothing drifts into the testimonial wall's footprint (which starts
 *  around the bottom ~40% of the panel). `parallaxStrength` varies 8-18px
 *  so chips read at different depths; `floatAmplitude`/`floatDuration`/
 *  `floatDelay` vary per chip so the idle bob never looks synchronized. */
interface FloatingChipSpec {
  key: string;
  Icon: typeof Target;
  label: string;
  top: string;
  left: string;
  parallaxStrength: number;
  floatAmplitude: number;
  floatDuration: string;
  floatDelay: string;
  tone?: "stat" | "live";
}

const FLOATING_CHIPS: FloatingChipSpec[] = [
  { key: "meta", Icon: Target, label: "Meta", top: "14%", left: "40%", parallaxStrength: 10, floatAmplitude: 7, floatDuration: "7.2s", floatDelay: "0s" },
  { key: "tiktok", Icon: Sparkles, label: "TikTok", top: "32%", left: "8%", parallaxStrength: 16, floatAmplitude: 9, floatDuration: "8.4s", floatDelay: "1.1s" },
  { key: "google", Icon: Rocket, label: "Google", top: "24%", left: "64%", parallaxStrength: 8, floatAmplitude: 6, floatDuration: "6.6s", floatDelay: "0.5s" },
  { key: "ctr", Icon: TrendingUp, label: "+24% CTR", top: "46%", left: "60%", parallaxStrength: 18, floatAmplitude: 8, floatDuration: "9s", floatDelay: "1.8s", tone: "stat" },
  { key: "live", Icon: Radio, label: "Live", top: "40%", left: "14%", parallaxStrength: 12, floatAmplitude: 6, floatDuration: "6s", floatDelay: "0.8s", tone: "live" },
  { key: "reach", Icon: BarChart3, label: "Reach", top: "10%", left: "26%", parallaxStrength: 14, floatAmplitude: 8, floatDuration: "7.8s", floatDelay: "1.4s" },
];

/** One floating chip — three nested layers of motion (outer parallax via
 *  inline transform, middle idle-float via CSS keyframe, inner one-time
 *  entrance via CSS keyframe), same composition technique as the desk
 *  objects in Concept06ScatteredDesk.tsx. Entirely decorative: no pointer
 *  events, aria-hidden by the parent layer. */
function FloatingChip({
  chip,
  mouse,
  reducedMotion,
  index,
}: {
  chip: FloatingChipSpec;
  mouse: { x: number; y: number };
  reducedMotion: boolean;
  index: number;
}) {
  const px = reducedMotion ? 0 : mouse.x * chip.parallaxStrength;
  const py = reducedMotion ? 0 : mouse.y * chip.parallaxStrength;
  const isStat = chip.tone === "stat";
  const isLive = chip.tone === "live";

  return (
    <div
      className="absolute"
      style={{
        top: chip.top,
        left: chip.left,
        transform: `translate3d(${px}px, ${py}px, 0)`,
        transition: "transform 150ms ease-out",
      }}
    >
      <div
        className="ds-hero-grad-chip-float"
        style={
          {
            animationDuration: chip.floatDuration,
            animationDelay: chip.floatDelay,
            "--chip-float-amplitude": `-${chip.floatAmplitude}px`,
          } as CSSProperties
        }
      >
        <div className="ds-hero-grad-chip-in" style={{ animationDelay: `${index * 120}ms` }}>
          <div
            className={
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[10px] font-medium shadow-[0_4px_18px_rgba(0,0,0,0.3)] backdrop-blur-md " +
              (isStat ? "border-primary/30 bg-primary/15 text-primary" : "border-white/15 bg-white/10 text-white/80")
            }
          >
            {isLive && (
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="ds-hero-grad-chip-pulse-dot absolute inline-flex h-full w-full rounded-full bg-primary" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
            )}
            <chip.Icon
              aria-hidden="true"
              className={"h-3 w-3 shrink-0 " + (isStat ? "text-primary" : "text-white/60")}
            />
            {chip.label}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Parallax layer wrapping all floating chips. Tracks mousemove at the
 *  window level but normalizes the offset against THIS layer's own
 *  bounding rect (== the art panel, since it's `absolute inset-0` inside
 *  it) so the parallax reads relative to the panel, not the viewport.
 *  rAF-throttled via a latest-event ref + single pending-frame guard (no
 *  React state writes on every raw mousemove tick). Under reduced motion
 *  the listener is never attached — chips stay at their rest position via
 *  the CSS media query that zeroes out the float/entrance animations. */
function FloatingChipLayer({ reducedMotion }: { reducedMotion: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const latestEvent = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const container = containerRef.current;
    if (!container) return;

    const handleMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      latestEvent.current = { x: nx, y: ny };
      if (frameRef.current === null) {
        frameRef.current = requestAnimationFrame(() => {
          setMouse(latestEvent.current);
          frameRef.current = null;
        });
      }
    };

    window.addEventListener("mousemove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [reducedMotion]);

  return (
    <div ref={containerRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
      {FLOATING_CHIPS.map((chip, i) => (
        <FloatingChip key={chip.key} chip={chip} mouse={mouse} reducedMotion={reducedMotion} index={i} />
      ))}
    </div>
  );
}

export default function HeroGradientArt(): JSX.Element {
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [hiddenPaused, setHiddenPaused] = useState(
    () => typeof document !== "undefined" && document.hidden
  );

  useEffect(() => {
    const onVisibility = () => setHiddenPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const isPaused = hoverPaused || hiddenPaused;
  const total = TESTIMONIALS.length;
  const peekIndex = (index + 1) % total;
  const featured = TESTIMONIALS[index];
  const peek = TESTIMONIALS[peekIndex];

  const handleAdvance = () => setIndex((i) => (i + 1) % total);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <style>{`
        @keyframes ds-hero-grad-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .ds-hero-grad-fade-in { animation: ds-hero-grad-fade-in 0.7s ease-out both; }

        @keyframes ds-hero-grad-feature-in {
          from { opacity: 0; transform: translateX(18px) scale(0.96); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        .ds-hero-grad-feature-in {
          animation: ds-hero-grad-feature-in 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }

        @keyframes ds-hero-grad-peek-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ds-hero-grad-peek-in {
          animation: ds-hero-grad-peek-in 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }

        @keyframes ds-hero-grad-progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .ds-hero-grad-progress {
          animation: ds-hero-grad-progress ${ROTATE_MS}ms linear forwards;
        }

        @keyframes ds-hero-grad-chip-in {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ds-hero-grad-chip-in {
          animation: ds-hero-grad-chip-in 0.6s cubic-bezier(0.22,1,0.36,1) both;
        }

        @keyframes ds-hero-grad-chip-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(var(--chip-float-amplitude, -8px)); }
        }
        .ds-hero-grad-chip-float {
          animation-name: ds-hero-grad-chip-float;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }

        @keyframes ds-hero-grad-chip-pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.7); }
        }
        .ds-hero-grad-chip-pulse-dot {
          animation: ds-hero-grad-chip-pulse-dot 1.6s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .ds-hero-grad-fade-in,
          .ds-hero-grad-feature-in,
          .ds-hero-grad-peek-in,
          .ds-hero-grad-chip-in {
            animation: none;
            opacity: 1;
            transform: none;
          }
          .ds-hero-grad-chip-float,
          .ds-hero-grad-chip-pulse-dot {
            animation: none;
          }
        }
      `}</style>

      {/* outer padding — the art panel is inset inside the hero half, not
          full-bleed, per the client reference */}
      <div className="h-full w-full p-6">
        <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-[hsl(150_38%_6%)]">
          <CanvasArt reducedMotion={reducedMotion} />

          {/* fine diagonal line texture — turns the ribbons into "ribbed"
              light streaks rather than plain soft gradients */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(-25deg, rgba(255,255,255,0.9) 0px, rgba(255,255,255,0.9) 1px, transparent 1px, transparent 6px)",
            }}
          />

          {/* dark vignette — bottom, for testimonial-card legibility */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.35)_50%,rgba(0,0,0,0.9)_100%)]"
          />
          {/* dark vignette — edges */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,transparent_40%,rgba(0,0,0,0.45)_100%)]"
          />

          {/* floating product-signal chips — decorative parallax layer over
              the upper/mid art area (client: "art also seems empty"). Sits
              above the canvas/vignettes (z-10) and below the stat lockup /
              testimonial wall (z-20) so it never competes with them. */}
          <FloatingChipLayer reducedMotion={reducedMotion} />

          {/* brand mark, small top-left over the art */}
          <img
            src={heroLogo}
            alt=""
            aria-hidden="true"
            className="ds-hero-grad-fade-in absolute left-5 top-5 z-20 h-5 w-auto opacity-90"
          />

          {/* stat lockup + mini wordmark chips, top-right */}
          <div
            className="ds-hero-grad-fade-in absolute right-5 top-5 z-20 flex flex-col items-end gap-1.5 text-right"
            style={{ animationDelay: "80ms" }}
          >
            <p className="text-[11px] font-medium text-white/70">
              Loved by <span className="font-semibold text-white">4,500+</span> teams
            </p>
            <div className="flex gap-1.5">
              {COMPANY_CHIPS.map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[9px] font-medium tracking-wide text-white/55"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* testimonial wall — featured card + peeking next card + progress
              dots. Pauses rotation on hover and while the tab is hidden. */}
          <div
            className="absolute inset-x-5 bottom-10 z-20 sm:inset-x-6 sm:bottom-12"
            onMouseEnter={() => setHoverPaused(true)}
            onMouseLeave={() => setHoverPaused(false)}
          >
            <div className="relative max-w-sm">
              {/* peek card — permanent resting offset (right + scaled down +
                  dimmed) lives on the outer element so it holds its position
                  even under reduced motion; only the inner element plays the
                  subtle entrance animation each time the peek content changes. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 origin-bottom-left translate-x-[14%] translate-y-[6%] scale-[0.94] opacity-55"
              >
                <div
                  key={`peek-${peekIndex}`}
                  className="ds-hero-grad-peek-in rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-primary/20 text-[10px] font-semibold text-primary/80">
                      {peek.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-white/70">{peek.name}</p>
                      <p className="truncate text-[10px] text-white/40">
                        {peek.role} — {peek.company}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 truncate text-[11px] text-white/45">{peek.quote}</p>
                </div>
              </div>

              {/* featured card */}
              <div
                key={`feature-${index}`}
                className="ds-hero-grad-feature-in relative z-10 rounded-2xl border border-white/15 bg-white/10 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-3 left-3 select-none font-serif text-6xl leading-none text-primary/30"
                >
                  &rdquo;
                </span>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-primary/25 text-[11px] font-semibold text-primary">
                    {featured.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-white">{featured.name}</p>
                    <p className="truncate text-[11px] text-white/55">
                      {featured.role} — {featured.company}
                    </p>
                  </div>
                </div>
                <p className="relative z-10 mt-2.5 text-[13px] leading-relaxed text-white/85">
                  {featured.quote}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <StarRating rating={4.5} />
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-medium text-white/60">
                    <BadgeCheck aria-hidden="true" className="h-3 w-3 text-primary" />
                    Verified customer
                  </span>
                </div>
              </div>
            </div>

            {/* progress dots — active dot stretches into a 16px pill that
                fills over 6s via a plain CSS width animation; clicking any
                dot jumps straight to that testimonial and restarts the timer. */}
            <div className="relative z-10 mt-3 flex items-center gap-1.5">
              {TESTIMONIALS.map((t, i) => {
                const isActive = i === index;
                return (
                  <button
                    key={t.name}
                    type="button"
                    aria-label={`Show testimonial from ${t.name}`}
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => setIndex(i)}
                    className={
                      "h-1.5 overflow-hidden rounded-full bg-white/20 transition-[width] duration-300 " +
                      (isActive ? "w-4" : "w-1.5 hover:bg-white/30")
                    }
                  >
                    {isActive && !reducedMotion && (
                      <span
                        key={`fill-${index}`}
                        onAnimationEnd={handleAdvance}
                        className="ds-hero-grad-progress block h-full w-full rounded-full bg-primary"
                        style={{ animationPlayState: isPaused ? "paused" : "running" }}
                      />
                    )}
                    {isActive && reducedMotion && (
                      <span className="block h-full w-full rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
