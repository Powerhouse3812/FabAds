import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import {
  Users,
  ShieldCheck,
  Shuffle,
  Webhook,
  GitBranch,
  LayoutGrid,
  Undo2,
  Redo2,
  Share2,
  Loader2,
  Check,
  MousePointer2,
} from "lucide-react";

import heroLogo from "@/assets/auth/hero-logo.svg";

/** Client reference ("Workay"): a soft panel with a big cropped headline
 *  top-left + a large product-UI screenshot peeking in from the
 *  bottom-right, deliberately cut off by the panel edges mid-drag
 *  interaction. FabAds adaptation keeps the Dark Stage near-black scene
 *  (not the reference's cream) and rebuilds the "screenshot" as a real,
 *  believable screen recording of the AutoPilot flow builder — a window
 *  chrome bar, a toolbar, a category rail, and a vertical block canvas —
 *  built entirely from DOM + lucide icons (no static image), so it reads
 *  crisp at any density and the drag-to-connect moment plays forever as a
 *  scripted, seamless CSS loop rather than a single static freeze-frame.
 *
 *  All choreography below is pure CSS (`ds-hero-peek-*` keyframes); the
 *  only JS state is the ambient "Draft saved" / "Saving…" chip, which is
 *  cosmetic ambient realism (an autosave tick), not core to the loop. */

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/** Fixed pixel heights for every row in the vertical flow (node / connector /
 *  diamond / spacer / slot). Tailwind's spacing scale maps each of these
 *  exactly (h-14=56, h-6=24, h-4=16, h-10=40, h-11=44), so the cumulative
 *  offset to the drop-slot's top edge is knowable at author time — that's
 *  what lets the absolutely-positioned drag-card and ghost cursor dock
 *  precisely on top of the in-flow dashed slot with zero JS measurement. */
const NODE_H = 56;
const CONNECTOR_H = 24;
const HALF_CONNECTOR_H = 16;
const DIAMOND_H = 40;
const SPACER_H = 16;
const SLOT_TOP = NODE_H + CONNECTOR_H + NODE_H + HALF_CONNECTOR_H + DIAMOND_H + HALF_CONNECTOR_H + NODE_H + SPACER_H; // 280
const NODE_W = 220;

const SIDEBAR_ICONS: { Icon: IconComponent; label: string; active?: boolean }[] = [
  { Icon: LayoutGrid, label: "All blocks" },
  { Icon: Users, label: "Audience", active: true },
  { Icon: ShieldCheck, label: "Budget" },
  { Icon: Shuffle, label: "Creative" },
  { Icon: Webhook, label: "Integrations" },
];

/** Overlapping avatar-initials, tone pattern lifted from DarkStageLogin's
 *  AVATARS (lime-family + neutral) for the mini social-proof row. */
const AVATARS = [
  { initials: "RA", className: "bg-primary text-primary-foreground" },
  { initials: "MK", className: "bg-primary/45 text-foreground" },
  { initials: "SJ", className: "bg-muted-foreground/30 text-foreground" },
];

function FlowNode({
  icon: Icon,
  title,
  meta,
}: {
  icon: IconComponent;
  title: string;
  meta: string;
}) {
  return (
    <div
      className="relative z-10 flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2.5 transition-colors duration-300 hover:border-white/25 hover:bg-white/[0.05]"
      style={{ width: NODE_W }}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15">
        <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-semibold text-foreground">{title}</p>
        <p className="truncate text-[10.5px] leading-tight tabular-nums text-muted-foreground">
          {meta}
        </p>
      </div>
    </div>
  );
}

/** Thin vertical connector — a dim static base line plus a dashed overlay
 *  whose stroke-dashoffset animates continuously, reading as data/flow
 *  moving down the pipe (ambient, independent of the 9s drag-loop). */
function Connector({ height }: { height: number }) {
  return (
    <svg
      width="2"
      height={height}
      viewBox={`0 0 2 ${height}`}
      className="shrink-0 overflow-visible"
      aria-hidden="true"
    >
      <line x1="1" y1="0" x2="1" y2={height} stroke="hsl(var(--primary) / 0.25)" strokeWidth="2" />
      <line
        x1="1"
        y1="0"
        x2="1"
        y2={height}
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeDasharray="3 6"
        strokeLinecap="round"
        className="ds-hero-peek-dash-flow"
      />
    </svg>
  );
}

export default function HeroProductPeek(): JSX.Element {
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let intervalId: number | undefined;
    let timeoutId: number | undefined;

    const triggerSave = () => {
      setSaving(true);
      timeoutId = window.setTimeout(() => setSaving(false), 1300);
    };
    const start = () => {
      intervalId = window.setInterval(triggerSave, 7000);
    };
    const stop = () => {
      if (intervalId !== undefined) window.clearInterval(intervalId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      intervalId = undefined;
      timeoutId = undefined;
    };
    const handleVisibility = () => {
      if (document.hidden) {
        stop();
        setSaving(false);
      } else {
        start();
      }
    };

    start();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <style>{`
        @keyframes ds-hero-peek-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ds-hero-peek-fade-in {
          animation: ds-hero-peek-fade-in 0.5s ease-out both;
        }

        @keyframes ds-hero-peek-rise {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ds-hero-peek-rise {
          animation: ds-hero-peek-rise 0.6s cubic-bezier(0.22,1,0.36,1) both;
        }

        @media (prefers-reduced-motion: no-preference) {
          /* connector data-flow dashes, continuous ambient loop */
          @keyframes ds-hero-peek-dash-flow {
            to { stroke-dashoffset: -18; }
          }
          .ds-hero-peek-dash-flow {
            animation: ds-hero-peek-dash-flow 1s linear infinite;
          }

          /* autosave spinner */
          @keyframes ds-hero-peek-spin {
            to { transform: rotate(360deg); }
          }
          .ds-hero-peek-spin {
            animation: ds-hero-peek-spin 0.8s linear infinite;
          }

          /* THE SIGNATURE LOOP — ~9s scripted cycle, all four layers share
             the same duration/start so their phases stay locked together:
             pick up "A/B condition" from the tray, drag it up into the
             canvas, hover + drop onto the dashed slot below block 3 (spring
             overshoot on settle), pop a "+ Connected" toast, hold, then
             fade the card back into the tray for a seamless wrap. */
          @keyframes ds-hero-peek-drag-card {
            0%   { opacity: 0; transform: translate(-150px, 36px) scale(0.62) rotate(0deg); }
            5%   { opacity: 1; transform: translate(-150px, 36px) scale(0.62) rotate(0deg); }
            16%  { opacity: 1; transform: translate(-150px, 18px) scale(0.7)  rotate(-4deg); }
            36%  { opacity: 1; transform: translate(-72px, -18px) scale(0.86) rotate(-3deg); }
            50%  { opacity: 1; transform: translate(-6px, -20px)  scale(1.03) rotate(-3deg); }
            58%  { opacity: 1; transform: translate(0px, 4px)     scale(0.96) rotate(1.5deg); }
            63%  { opacity: 1; transform: translate(0px, -3px)    scale(1.05) rotate(-1deg); }
            68%  { opacity: 1; transform: translate(0px, 0px)     scale(1)    rotate(0deg); }
            85%  { opacity: 1; transform: translate(0px, 0px)     scale(1)    rotate(0deg); }
            95%  { opacity: 0; transform: translate(-150px, 36px) scale(0.62) rotate(0deg); }
            100% { opacity: 0; transform: translate(-150px, 36px) scale(0.62) rotate(0deg); }
          }
          .ds-hero-peek-drag-card {
            animation: ds-hero-peek-drag-card 9s linear infinite;
          }

          @keyframes ds-hero-peek-cursor-path {
            0%   { opacity: 0; transform: translate(-92px, 46px); }
            5%   { opacity: 1; transform: translate(-92px, 46px); }
            16%  { opacity: 1; transform: translate(-92px, 30px); }
            36%  { opacity: 1; transform: translate(-4px, 2px); }
            50%  { opacity: 1; transform: translate(64px, -6px); }
            63%  { opacity: 1; transform: translate(64px, 10px); }
            70%  { opacity: 1; transform: translate(64px, 14px); }
            80%  { opacity: 1; transform: translate(90px, 32px); }
            90%  { opacity: 0; transform: translate(112px, 46px); }
            100% { opacity: 0; transform: translate(-92px, 46px); }
          }
          .ds-hero-peek-cursor {
            animation: ds-hero-peek-cursor-path 9s linear infinite;
          }

          @keyframes ds-hero-peek-slot-pulse {
            0%, 40%   { opacity: 0; border-color: rgba(255,255,255,0.12); box-shadow: none; }
            46%       { opacity: 1; border-color: hsl(var(--primary) / 0.55); box-shadow: 0 0 0 3px hsl(var(--primary) / 0.15); }
            58%       { opacity: 1; border-color: hsl(var(--primary) / 0.7); box-shadow: 0 0 0 5px hsl(var(--primary) / 0.18); }
            66%, 100% { opacity: 0; border-color: rgba(255,255,255,0.12); box-shadow: none; }
          }
          .ds-hero-peek-slot-pulse {
            animation: ds-hero-peek-slot-pulse 9s linear infinite;
          }

          @keyframes ds-hero-peek-toast {
            0%, 68%   { opacity: 0; transform: translateY(-6px); }
            74%       { opacity: 1; transform: translateY(0); }
            84%       { opacity: 1; transform: translateY(0); }
            92%, 100% { opacity: 0; transform: translateY(-6px); }
          }
          .ds-hero-peek-toast {
            animation: ds-hero-peek-toast 9s linear infinite;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ds-hero-peek-fade-in,
          .ds-hero-peek-rise {
            animation-duration: 0.01ms;
          }
          .ds-hero-peek-dash-flow {
            animation: none;
          }
          .ds-hero-peek-spin {
            animation: none;
          }
          /* block sits already-connected: drag-card rests at its base
             (docked/slot) position with no transform, the dashed slot
             it covers stays invisible, the toast never fires, and the
             ghost cursor is removed entirely. */
          .ds-hero-peek-drag-card {
            animation: none;
            opacity: 1;
            transform: none;
          }
          .ds-hero-peek-slot-pulse {
            animation: none;
            opacity: 0;
          }
          .ds-hero-peek-toast {
            animation: none;
            opacity: 0;
          }
          .ds-hero-peek-cursor {
            display: none;
          }
        }
      `}</style>

      {/* base scene — subtle lime radial in a corner, keeping the Dark
          Stage near-black identity rather than the reference's cream.
          The top-left corner radial is anchored on `--background` (not
          `--card`) because the logo mark's dark glyph paths are hardcoded
          to that exact near-black value (see hero-logo.svg) so they blend
          invisibly into the backdrop, leaving only the light strokes
          visible — the same treatment every sibling hero uses behind its
          logo. Anchoring `--card` (a lighter token) at that corner instead
          exposed those dark paths as a faint offset "ghost" duplicate of
          the wordmark. */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_100%,hsl(var(--primary)/0.12)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_0%,hsl(var(--background))_0%,hsl(var(--card))_60%)]" />
      </div>

      {/* logo — small, top-left, low opacity */}
      <img
        src={heroLogo}
        alt=""
        aria-hidden="true"
        className="ds-hero-peek-fade-in absolute left-6 top-6 z-20 h-5 w-auto opacity-40"
      />

      {/* headline block — top-left, deliberately run close to the edge */}
      <div
        className="ds-hero-peek-fade-in absolute left-6 right-10 top-16 z-20 max-w-[380px]"
        style={{ animationDelay: "100ms" }}
      >
        <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-text">
          Autopilot
        </span>

        <h2
          className="mt-3 text-4xl font-bold leading-[1.05] tracking-tight text-foreground"
          style={{ textWrap: "balance" }}
        >
          Launch faster with AutoPilot
        </h2>

        <p className="mt-3 max-w-[280px] text-[13px] leading-relaxed text-muted-foreground">
          Set the strategy once. FabAds drafts, tests and scales every
          campaign automatically.
        </p>

        {/* mini social-proof row */}
        <div className="mt-5 flex items-center gap-2.5">
          <div className="flex -space-x-2" aria-hidden="true">
            {AVATARS.map((a, i) => (
              <div
                key={a.initials}
                style={{ zIndex: AVATARS.length - i }}
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 border-background text-[8px] font-bold ${a.className}`}
              >
                {a.initials}
              </div>
            ))}
          </div>
          <p className="text-[11px] tabular-nums text-muted-foreground">
            <span className="font-semibold text-foreground">Teams shipped 1,200+</span> flows
            this month
          </p>
        </div>
      </div>

      {/* peeking product card — absolutely positioned, overflowing the
          panel's bottom + right edges so only its top-left corner reads
          cleanly, exactly like the reference's cropped screenshot.
          Bottom overflow is a FIXED pixel offset (-16px), not a percentage
          of panel height. A `bottom: -X%` offset anchors the card's own
          bottom edge at `panelHeight * (1 + X%)`, which moves *down* in
          lockstep with panel height — so on a taller viewport the card
          sits proportionally further past the fold, not less. That's the
          exact bug this replaces: at -8% the signature drag-to-connect
          slot (the whole point of this hero) measured clipped by ~40px on
          a 1366×768 fold and *worse* (~66px) on 1920×1080, because the
          panel is ~100dvh so taller screens only inflated the overflow.
          A fixed px offset keeps the peek amount constant regardless of
          viewport height, so extra vertical room on larger screens goes
          toward margin instead of more clipping. The canvas's own bottom
          padding (`pb-14` below) is the real safety margin: since the
          drop-slot is the flow's last element, the distance from the
          slot's bottom edge to the card's own bottom edge is what decides
          fold clearance for a bottom-anchored box (content *above* the
          slot cancels out of that math entirely), so that padding is
          deliberately generous. The mask-image's 92% stop keeps the fade
          confined to that trailing padding so it never dims the
          interactive slot/drag-card. */}
      <div
        aria-hidden="true"
        className="ds-hero-peek-rise absolute bottom-[-16px] right-[-16%] z-10 w-[86%] max-w-[580px] overflow-hidden rounded-2xl border border-white/10 bg-card shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-sm"
        style={{
          animationDelay: "260ms",
          maskImage: "linear-gradient(to bottom, black 0%, black 92%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 92%, transparent 100%)",
        }}
      >
        {/* 1px top highlight for glass-like depth */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
        />

        {/* window chrome bar */}
        <div className="flex items-center gap-3 border-b border-white/8 bg-white/[0.02] px-4 py-2.5">
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white/[0.18]" />
            <span className="h-2 w-2 rounded-full bg-white/[0.14]" />
            <span className="h-2 w-2 rounded-full bg-white/[0.10]" />
          </div>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-[11px] font-medium text-muted-foreground">
              AutoPilot <span className="text-foreground/70">— Q3_scale_campaigns</span>
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary-text">
            {saving ? (
              <>
                <Loader2 className="ds-hero-peek-spin h-2.5 w-2.5" aria-hidden="true" />
                Saving…
              </>
            ) : (
              <>
                <Check className="h-2.5 w-2.5" aria-hidden="true" />
                Draft saved
              </>
            )}
          </span>
        </div>

        {/* toolbar row */}
        <div className="flex items-center gap-2 border-b border-white/8 px-4 py-2">
          <Undo2 className="h-3.5 w-3.5 text-muted-foreground/40" aria-hidden="true" />
          <Redo2 className="h-3.5 w-3.5 text-muted-foreground/40" aria-hidden="true" />
          <div className="mx-1 h-3.5 w-px bg-white/10" />
          <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
            82%
          </span>
          <div className="flex-1" />
          <span className="flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-white/25 hover:text-foreground">
            <Share2 className="h-3 w-3" aria-hidden="true" />
            Share
          </span>
        </div>

        {/* body: category rail + canvas */}
        <div className="flex">
          {/* left mini-sidebar — 5 block-category icons, one active with a
              lime rail */}
          <div className="flex w-11 shrink-0 flex-col items-center gap-1 border-r border-white/8 py-3">
            {SIDEBAR_ICONS.map(({ Icon, label, active }) => (
              <div
                key={label}
                title={label}
                className="relative flex h-8 w-8 items-center justify-center rounded-md"
              >
                {active && (
                  <span
                    className="absolute -left-[9px] top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                )}
                <Icon
                  className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground/45"}`}
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>

          {/* canvas — dot-grid backdrop + vertical block flow + the
              always-looping drag-to-connect moment. Bottom padding
              (pb-14) is intentionally much deeper than the top (pt-5):
              it's the trailing "dead space" below the drop-slot that
              absorbs the card's bottom overflow, keeping the actual
              drag mechanic clear of the fold — see the peeking-card
              comment above for the full reasoning. */}
          <div
            className="relative flex-1 overflow-hidden px-5 pb-14 pt-5"
            style={{
              backgroundImage:
                "radial-gradient(circle, hsl(var(--foreground) / 0.06) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          >
            {/* "+ Connected" toast, top-right of canvas */}
            <div className="ds-hero-peek-toast absolute right-3 top-3 z-30 flex items-center gap-1 rounded-full border border-primary/30 bg-primary/15 px-2 py-1 text-[10px] font-semibold text-primary-text shadow-lg">
              <Check className="h-2.5 w-2.5" aria-hidden="true" />
              Connected
            </div>

            {/* vertical block flow */}
            <div className="relative z-10 flex flex-col items-center">
              <FlowNode
                icon={Users}
                title="Audience branch"
                meta="3 segments · lookalike + retargeting"
              />
              <Connector height={CONNECTOR_H} />
              <FlowNode
                icon={ShieldCheck}
                title="Budget guard"
                meta="$500/day cap · auto-pause on overspend"
              />
              <Connector height={HALF_CONNECTOR_H} />

              {/* diamond condition node — background square rotated 45deg,
                  label kept unrotated so it reads horizontally */}
              <div className="relative z-20 flex shrink-0 items-center justify-center" style={{ height: DIAMOND_H, width: DIAMOND_H }}>
                <div className="absolute inset-0 rotate-45 rounded-[6px] border border-primary/35 bg-white/[0.04]" />
                <span className="relative z-10 text-center text-[8px] font-bold leading-[1.15] tabular-nums text-foreground">
                  ROAS
                  <br />
                  &gt;2.5?
                </span>
              </div>

              <Connector height={HALF_CONNECTOR_H} />
              <FlowNode
                icon={Shuffle}
                title="Creative rotation"
                meta="6 variants · auto-refresh weekly"
              />

              {/* spacer connector down to the drop-slot */}
              <Connector height={SPACER_H} />

              {/* drop-slot — sits in normal flow so it reserves real space;
                  invisible except during the mid-loop hover/pulse window */}
              <div
                className="ds-hero-peek-slot-pulse rounded-lg border-2 border-dashed"
                style={{ height: 44, width: NODE_W }}
              />
            </div>

            {/* static tray silhouette, bottom-left — reads as an empty
                palette slot while the real card is elsewhere in the loop */}
            <div className="absolute bottom-3 left-3 z-0 flex h-9 w-[136px] items-center gap-2 rounded-md border border-dashed border-white/10 px-2 text-white/25">
              <GitBranch className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate text-[10px] font-medium">A/B condition</span>
            </div>

            {/* the animated draggable card — docks exactly on the drop-slot
                at rest (top === SLOT_TOP, same centered width), and travels
                out to the tray corner mid-cycle */}
            <div
              className="ds-hero-peek-drag-card absolute z-20 flex items-center gap-2.5 rounded-lg border border-white/15 bg-card px-3 py-2.5 shadow-[0_20px_45px_rgba(0,0,0,0.55)]"
              style={{ top: SLOT_TOP, left: `calc(50% - ${NODE_W / 2}px)`, width: NODE_W }}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/20">
                <GitBranch className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-foreground">
                  A/B condition
                </p>
                <p className="truncate text-[10.5px] leading-tight text-muted-foreground">
                  New · from tray
                </p>
              </div>
            </div>

            {/* ghost cursor — hidden under reduced motion */}
            <MousePointer2
              className="ds-hero-peek-cursor pointer-events-none absolute z-30 h-[18px] w-[18px] fill-foreground/90 text-foreground drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
              style={{ top: SLOT_TOP - 18, left: `calc(50% + 46px)` }}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
