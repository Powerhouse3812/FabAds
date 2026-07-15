import { useEffect, useState, type CSSProperties } from "react";
import { Activity, Play, Rocket, TrendingUp } from "lucide-react";

import heroLogo from "@/assets/auth/hero-logo.svg";
import heroMockup from "@/assets/auth/hero-mockup.png";

/**
 * "Real product" bento grid — the Dark Stage hero panel as a live-looking
 * slice of the FabAds workspace rather than a diced stock photo. Six tiles,
 * each a miniature working widget built as real DOM (only the creative
 * tile touches the shared hero-mockup photo, used as a cropped video-thumb
 * texture — everything else is typography + SVG):
 *   - Live campaigns  — 3 real-looking rows, one status crossfades on a
 *     timer (a genuine micro-interaction, not just a static mock).
 *   - Spend today     — rAF count-up on mount, then ticks up like a live
 *     meter.
 *   - CTR 7d          — inline SVG sparkline, animated draw-in.
 *   - AutoPilot       — the lime "hero" tile, diagonal texture + a
 *     three-dot "still working" pulse.
 *   - Creative preview— the one photo tile, cropped as a portrait video
 *     thumb with a play chip + duration.
 *   - ROAS            — circular progress ring that fills on mount.
 * Numbers are hand-tuned to agree with each other (see constants below) so
 * the panel reads as one coherent ad account, not six unrelated props.
 */

/** Local status-tone colors. Dark Stage's token set only defines the brand
 *  lime (primary) + neutrals — there's no dedicated success/warning token,
 *  and these are UI-chrome semantics (live/optimizing vs healthy), not
 *  brand color, so they're kept as plain constants rather than invented
 *  tokens. Every use pairs the color with a text label, never color alone. */
const TONE_SUCCESS = "hsl(142 71% 45%)";
const TONE_WARNING = "hsl(38 92% 50%)";

/** Account totals the individual tiles are derived from, so "Spend today"
 *  and the three campaign rows never disagree with each other:
 *  $12,847 spent today, split across 14 AutoPilot-managed campaigns — the
 *  3 rows shown are a sample, not the whole book, so their sum ($10,663)
 *  being less than the day total is intentional, not a bug. */
const SPEND_TODAY_TARGET = 12847;
const SPEND_YESTERDAY_ESTIMATE = 10887; // -> +18% reads correctly
const AUTOPILOT_CAMPAIGN_COUNT = 14;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const TILE_BASE =
  "ds-hero-bento-tile-in group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_20px_45px_-20px_rgba(0,0,0,0.65)] backdrop-blur-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:bg-white/[0.055]";

interface TileProps {
  style?: CSSProperties;
}

/** --- Live campaigns ------------------------------------------------- */

function useLearningToActiveFlip(intervalMs: number): boolean {
  const [reduced] = useState(prefersReducedMotion);
  const [isActive, setIsActive] = useState(false);
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setIsActive((v) => !v), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, reduced]);
  return isActive;
}

function CrossfadeStatus({ isActive }: { isActive: boolean }) {
  return (
    <span className="relative inline-block h-3.5 w-11 shrink-0 text-right align-middle">
      <span
        className="absolute inset-0 text-[10px] font-medium transition-opacity duration-300"
        style={{ color: TONE_WARNING, opacity: isActive ? 0 : 1 }}
      >
        Learning
      </span>
      <span
        className="absolute inset-0 text-[10px] font-medium transition-opacity duration-300"
        style={{ color: TONE_SUCCESS, opacity: isActive ? 1 : 0 }}
      >
        Active
      </span>
    </span>
  );
}

function StatusDot({ color, delayMs = "0ms" }: { color: string; delayMs?: string }) {
  return (
    <span
      className="ds-hero-bento-pulse h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-300"
      style={{ backgroundColor: color, animationDelay: delayMs }}
      aria-hidden="true"
    />
  );
}

function LiveCampaignsTile({ style }: TileProps) {
  const isActive = useLearningToActiveFlip(4000);

  return (
    <div className={TILE_BASE} style={style}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Live campaigns
          </span>
        </div>
        <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
          3 running
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-2.5">
        {/* row 1 — the one that flips Learning -> Active on a timer */}
        <div className="flex items-center gap-1.5">
          <StatusDot color={isActive ? TONE_SUCCESS : TONE_WARNING} />
          <span
            className="min-w-0 flex-1 truncate font-mono text-xs text-foreground/90"
            title="Q3_UGC_hooks_v2"
          >
            Q3_UGC_hooks_v2
          </span>
          <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Meta
          </span>
          <CrossfadeStatus isActive={isActive} />
          <span className="w-14 shrink-0 text-right text-xs font-semibold tabular-nums text-foreground">
            $4,213
          </span>
        </div>

        {/* row 2 — steady, healthy */}
        <div className="flex items-center gap-1.5">
          <StatusDot color={TONE_SUCCESS} delayMs="0.6s" />
          <span
            className="min-w-0 flex-1 truncate font-mono text-xs text-foreground/90"
            title="Reels_creator_pack"
          >
            Reels_creator_pack
          </span>
          <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            TikTok
          </span>
          <span
            className="w-11 shrink-0 text-right text-[10px] font-medium"
            style={{ color: TONE_SUCCESS }}
          >
            Active
          </span>
          <span className="w-14 shrink-0 text-right text-xs font-semibold tabular-nums text-foreground">
            $3,560
          </span>
        </div>

        {/* row 3 — steady, being scaled up */}
        <div className="flex items-center gap-1.5">
          <StatusDot color={TONE_WARNING} delayMs="1.1s" />
          <span
            className="min-w-0 flex-1 truncate font-mono text-xs text-foreground/90"
            title="Search_brand_defense"
          >
            Search_brand_defense
          </span>
          <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Google
          </span>
          <span
            className="w-11 shrink-0 text-right text-[10px] font-medium"
            style={{ color: TONE_WARNING }}
          >
            Scaling
          </span>
          <span className="w-14 shrink-0 text-right text-xs font-semibold tabular-nums text-foreground">
            $2,890
          </span>
        </div>
      </div>
    </div>
  );
}

/** --- Spend today ------------------------------------------------------ */

function useCountUp(target: number, durationMs: number) {
  const [reduced] = useState(prefersReducedMotion);
  const [value, setValue] = useState(reduced ? target : 0);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, reduced]);

  return { value, reduced };
}

function SpendTodayTile({ style }: TileProps) {
  const { value: counted, reduced } = useCountUp(SPEND_TODAY_TARGET, 1200);
  const [ticked, setTicked] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setTicked((v) => v + 3 + Math.floor(Math.random() * 6)); // +$3..$8
    }, 3200);
    return () => window.clearInterval(id);
  }, [reduced]);

  const display = counted >= SPEND_TODAY_TARGET ? counted + ticked : counted;
  const deltaPct = Math.round(
    ((SPEND_TODAY_TARGET - SPEND_YESTERDAY_ESTIMATE) / SPEND_YESTERDAY_ESTIMATE) * 100
  );

  return (
    <div className={TILE_BASE} style={style}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Spend today
      </p>
      <p className="mt-1.5 text-[26px] font-bold leading-none tabular-nums text-foreground">
        ${display.toLocaleString("en-US")}
      </p>
      <div className="mt-auto flex items-center gap-1 pt-3">
        <TrendingUp className="h-3 w-3 shrink-0" style={{ color: TONE_SUCCESS }} aria-hidden="true" />
        <span className="text-xs font-semibold tabular-nums" style={{ color: TONE_SUCCESS }}>
          +{deltaPct}%
        </span>
        <span className="truncate text-[10px] text-muted-foreground">vs yesterday</span>
      </div>
    </div>
  );
}

/** --- CTR 7d sparkline -------------------------------------------------- */

/** Daily CTR% for the trailing 7 days — trending up, ending at the 3.9%
 *  headline figure with a +0.4pp day-over-day delta (3.5% -> 3.9%). */
const CTR_LINE_PATH = "M4,38 L22.7,32 L41.3,35 L60,26 L78.7,17 L97.3,20 L116,8";
const CTR_AREA_PATH = `${CTR_LINE_PATH} L116,40 L4,40 Z`;

function CtrSparklineTile({ style }: TileProps) {
  return (
    <div className={TILE_BASE} style={style}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          CTR 7d
        </p>
        <span
          className="shrink-0 text-xs font-semibold tabular-nums"
          style={{ color: TONE_SUCCESS }}
        >
          +0.4pp
        </span>
      </div>
      <p className="mt-1 text-xl font-bold leading-none tabular-nums text-foreground">3.9%</p>

      <svg
        className="mt-auto h-10 w-full pt-2"
        viewBox="0 0 120 44"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="ds-hero-bento-ctr-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={CTR_AREA_PATH} fill="url(#ds-hero-bento-ctr-fill)" stroke="none" />
        <path
          d={CTR_LINE_PATH}
          stroke="hsl(var(--primary))"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          className="ds-hero-bento-sparkline-draw"
        />
        <circle cx="116" cy="8" r="2.5" fill="hsl(var(--primary))" className="ds-hero-bento-pulse" />
      </svg>
    </div>
  );
}

/** --- AutoPilot feature tile -------------------------------------------- */

function AutoPilotTile({ style }: TileProps) {
  return (
    <div
      className="ds-hero-bento-tile-in group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-primary p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_20px_45px_-20px_rgba(0,0,0,0.55)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_24px_50px_-16px_rgba(0,0,0,0.6)]"
      style={style}
    >
      {/* subtle diagonal texture — depth via layering, not a glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, #000 0px, #000 1px, transparent 1px, transparent 10px)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex items-center justify-between">
        <Rocket className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
        <span className="flex items-center gap-0.5" aria-hidden="true">
          <span
            className="ds-hero-bento-loading-dot h-1 w-1 rounded-full bg-primary-foreground/60"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="ds-hero-bento-loading-dot h-1 w-1 rounded-full bg-primary-foreground/60"
            style={{ animationDelay: "160ms" }}
          />
          <span
            className="ds-hero-bento-loading-dot h-1 w-1 rounded-full bg-primary-foreground/60"
            style={{ animationDelay: "320ms" }}
          />
        </span>
      </div>
      <div className="relative z-10">
        <p className="text-sm font-bold leading-tight text-primary-foreground">
          AutoPilot is optimizing {AUTOPILOT_CAMPAIGN_COUNT} campaigns
        </p>
        <p className="mt-0.5 text-xs leading-snug text-primary-foreground/85">
          6 bid adjustments applied in the last hour.
        </p>
      </div>
    </div>
  );
}

/** --- Creative preview --------------------------------------------------- */

function CreativePreviewTile({ style }: TileProps) {
  return (
    <div
      className="ds-hero-bento-tile-in group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_20px_45px_-20px_rgba(0,0,0,0.65)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40"
      style={style}
    >
      <img
        src={heroMockup}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30"
        aria-hidden="true"
      />

      <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/85 backdrop-blur-sm">
        Creative
      </span>
      <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-white backdrop-blur-sm">
        0:15
      </span>

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/15 backdrop-blur-md transition-transform duration-200 group-hover:scale-110"
        aria-hidden="true"
      >
        <Play className="h-3.5 w-3.5 fill-white text-white" aria-hidden="true" />
      </div>

      <div className="relative z-10 p-2.5">
        <p className="truncate text-xs font-semibold text-white" title="hook_03_15s.mp4">
          hook_03_15s.mp4
        </p>
        <p className="mt-0.5 text-[10px] uppercase tracking-wide text-white/60">Reels · 9:16</p>
      </div>
    </div>
  );
}

/** --- ROAS ring ----------------------------------------------------------- */

const ROAS_RADIUS = 26;
const ROAS_CIRCUMFERENCE = 2 * Math.PI * ROAS_RADIUS;
const ROAS_FRACTION = 0.72; // visual fill, not a literal ratio of 3.2x

function useMountProgress(fraction: number) {
  const [reduced] = useState(prefersReducedMotion);
  const [progress, setProgress] = useState(reduced ? fraction : 0);

  useEffect(() => {
    if (reduced) return;
    const id = window.setTimeout(() => setProgress(fraction), 80);
    return () => window.clearTimeout(id);
  }, [fraction, reduced]);

  return { progress, reduced };
}

function RoasRingTile({ style }: TileProps) {
  const { progress, reduced } = useMountProgress(ROAS_FRACTION);
  const dashoffset = ROAS_CIRCUMFERENCE * (1 - progress);

  return (
    <div className={`${TILE_BASE} items-center justify-center`} style={style}>
      <p className="absolute left-3.5 top-3.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        ROAS
      </p>
      <div className="relative flex h-16 w-16 items-center justify-center">
        <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
          <circle
            cx="32"
            cy="32"
            r={ROAS_RADIUS}
            fill="none"
            stroke="hsl(var(--foreground)/0.1)"
            strokeWidth="4"
          />
          <circle
            cx="32"
            cy="32"
            r={ROAS_RADIUS}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={ROAS_CIRCUMFERENCE}
            strokeDashoffset={dashoffset}
            style={{
              transition: reduced ? "none" : "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)",
            }}
          />
        </svg>
        <span className="absolute text-sm font-bold tabular-nums text-foreground">3.2x</span>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">vs 2.5x target</p>
    </div>
  );
}

/** --- root ---------------------------------------------------------------- */

export default function HeroBento(): JSX.Element {
  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <style>{`
        @keyframes ds-hero-bento-tile-in {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .ds-hero-bento-tile-in {
          animation: ds-hero-bento-tile-in 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }

        @keyframes ds-hero-bento-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ds-hero-bento-fade-in {
          animation: ds-hero-bento-fade-in 0.5s ease-out both;
        }

        @media (prefers-reduced-motion: no-preference) {
          @keyframes ds-hero-bento-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.45; transform: scale(0.82); }
          }
          .ds-hero-bento-pulse {
            animation: ds-hero-bento-pulse 2.2s ease-in-out infinite;
          }

          @keyframes ds-hero-bento-sparkline-draw {
            from { stroke-dashoffset: 1; }
            to { stroke-dashoffset: 0; }
          }
          .ds-hero-bento-sparkline-draw {
            stroke-dasharray: 1;
            stroke-dashoffset: 1;
            animation: ds-hero-bento-sparkline-draw 1s cubic-bezier(0.22,1,0.36,1) 0.6s forwards;
          }

          @keyframes ds-hero-bento-loading-dot {
            0%, 100% { opacity: 0.35; }
            50% { opacity: 1; }
          }
          .ds-hero-bento-loading-dot {
            animation: ds-hero-bento-loading-dot 1.4s ease-in-out infinite;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ds-hero-bento-tile-in,
          .ds-hero-bento-fade-in {
            animation-duration: 0.01ms;
          }
          .ds-hero-bento-pulse {
            animation: none;
            opacity: 1;
            transform: none;
          }
          .ds-hero-bento-sparkline-draw {
            stroke-dasharray: none;
            stroke-dashoffset: 0;
            animation: none;
          }
          .ds-hero-bento-loading-dot {
            animation: none;
            opacity: 0.8;
          }
        }
      `}</style>

      <div className="relative flex h-full w-full flex-col overflow-hidden bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--card))_100%)] px-6 pt-6 pb-16">
        <img
          src={heroLogo}
          alt=""
          aria-hidden="true"
          className="ds-hero-bento-fade-in h-5 w-auto shrink-0 opacity-40"
        />

        <div className="mt-5 grid flex-1 grid-cols-4 grid-rows-3 gap-3">
          <LiveCampaignsTile
            style={{ gridColumn: "1 / span 2", gridRow: "1 / span 2", animationDelay: "0ms" }}
          />
          <SpendTodayTile
            style={{ gridColumn: "3 / span 1", gridRow: "1 / span 1", animationDelay: "60ms" }}
          />
          <CreativePreviewTile
            style={{ gridColumn: "4 / span 1", gridRow: "1 / span 3", animationDelay: "120ms" }}
          />
          <CtrSparklineTile
            style={{ gridColumn: "3 / span 1", gridRow: "2 / span 1", animationDelay: "180ms" }}
          />
          <AutoPilotTile
            style={{ gridColumn: "1 / span 2", gridRow: "3 / span 1", animationDelay: "240ms" }}
          />
          <RoasRingTile
            style={{ gridColumn: "3 / span 1", gridRow: "3 / span 1", animationDelay: "300ms" }}
          />
        </div>

        <div
          className="ds-hero-bento-fade-in mt-5 shrink-0"
          style={{ animationDelay: "420ms" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">
            Live workspace
          </p>
          <p className="mt-0.5 text-sm font-medium text-foreground/90">
            Everything your team ships, in one grid.
          </p>
        </div>
      </div>
    </div>
  );
}
