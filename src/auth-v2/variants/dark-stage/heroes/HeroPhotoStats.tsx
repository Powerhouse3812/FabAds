import { useEffect, useRef, useState } from "react";
import {
  Users,
  Building2,
  Rocket,
  Wallet,
  ShieldCheck,
  Activity,
  type LucideIcon,
} from "lucide-react";

import heroLogo from "@/assets/auth/hero-logo.svg";

/** Photo-forward hero variant for Dark Stage's swappable hero-panel track —
 *  a real 3-slide auto-advancing editorial carousel: a full-bleed dramatic
 *  frame with a floating light card (stats + welcome copy) in the lower
 *  third and thin progress bars pinned to the bottom, the frame's content
 *  and the card's stats and the active progress bar all advancing together
 *  every 5s (or on a manual bar click), each with its own transition so
 *  nothing hard-cuts.
 *
 *  This used to run `hero-mockup.png` full-bleed behind the card (object-cover
 *  + a ken-burns scale-up, cropped differently per slide via object-position).
 *  Client feedback: "uses very pixellated and boring image, not matching the
 *  UI also." Confirmed — the source PNG is a low-fidelity, compression-soft
 *  screenshot on a bright olive-green background, and blowing it up full-bleed
 *  under a 14s scale animation made every artifact obvious, while its light-
 *  mode chrome fought the otherwise deep-dark Dark Stage scene instead of
 *  reading as part of the same product.
 *
 *  Fix: the full-bleed visual is now a real on-brand "product frame" — an
 *  app-window chrome (traffic-light dots + a per-slide title) over a dark/
 *  lime atmosphere, containing REAL small DOM widgets that change with each
 *  slide's story (community -> a mini team list, scale -> a mini KPI +
 *  channel-mix row, trust -> a mini status/uptime row). Everything is
 *  type + Tailwind + inline SVG, so nothing can pixelate at any zoom or
 *  density — the same production bar as this batch's HeroBento and
 *  HeroProductPeek, which already rebuild the "product" as DOM rather than
 *  leaning on the shared mockup photo. The ken-burns-equivalent motion moves
 *  to the frame's content pane (the "screen" subtly scales while the chrome
 *  stays put, like a live product recording), gated by the same reduced-
 *  motion + tab-visibility rules as everything else in this file. */

const SLIDE_DURATION_MS = 5000;

/** Local status-tone color — Dark Stage's token set only defines the brand
 *  lime (primary) + neutrals, no dedicated "live/operational" token, so this
 *  stays a plain constant (matches the precedent in HeroBento's TONE_SUCCESS)
 *  rather than inventing a semantic token for one hero variant. */
const TONE_LIVE = "hsl(142 71% 45%)";

type Stat = { Icon: LucideIcon; value: string; label: string };

type Slide = {
  id: "community" | "scale" | "trust";
  eyebrow: string;
  /** Label shown in the product frame's window-chrome title bar for this
   *  slide — stands in for the old per-slide object-position photo crop. */
  windowTitle: string;
  stats: [Stat, Stat];
  tagline: string;
  showAvatars?: boolean;
};

const SLIDES: Slide[] = [
  {
    id: "community",
    eyebrow: "01 — Community",
    windowTitle: "FabFunnel — Team workspace",
    stats: [
      { Icon: Users, value: "4,500+", label: "Marketers already in" },
      { Icon: Building2, value: "120+", label: "Agencies onboard" },
    ],
    tagline: "Welcome to the platform that unifies launch, automation and reporting.",
    showAvatars: true,
  },
  {
    id: "scale",
    eyebrow: "02 — Scale",
    windowTitle: "FabFunnel — Growth dashboard",
    stats: [
      { Icon: Rocket, value: "12M+", label: "Ads launched" },
      { Icon: Wallet, value: "$48M", label: "Ad spend managed" },
    ],
    tagline: "From first launch to full autopilot.",
  },
  {
    id: "trust",
    eyebrow: "03 — Trust",
    windowTitle: "FabFunnel — System status",
    stats: [
      { Icon: ShieldCheck, value: "99.9%", label: "Uptime" },
      { Icon: Activity, value: "24/7", label: "Live monitoring" },
    ],
    tagline: "Your campaigns never sleep — neither do we.",
  },
];

/** 5-wide overlapping initials for the "joined this week" mini-row — same
 *  lime-family + neutral tone pattern as DarkStageLogin's own AVATARS
 *  brag-stat, just two names longer. */
const AVATARS = [
  { initials: "RA", className: "bg-primary text-primary-foreground" },
  { initials: "MK", className: "bg-primary/50 text-neutral-900" },
  { initials: "SJ", className: "bg-neutral-300 text-neutral-700" },
  { initials: "TN", className: "bg-neutral-400 text-white" },
  { initials: "VK", className: "bg-neutral-200 text-neutral-700" },
] as const;

/** --- product-frame content, one mini widget per slide's story ----------- */

const TEAM_ROWS: { name: string; role: string; initials: string; tone: string; active: boolean }[] = [
  { name: "Rahul A.", role: "Agency lead", initials: "RA", tone: "bg-primary text-primary-foreground", active: true },
  { name: "Meera K.", role: "Media buyer", initials: "MK", tone: "bg-primary/20 text-primary-text", active: true },
  { name: "Sara J.", role: "Creative", initials: "SJ", tone: "bg-white/10 text-white/80", active: false },
  { name: "Tomás N.", role: "Analyst", initials: "TN", tone: "bg-white/10 text-white/80", active: true },
];

function CommunityFrameContent() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Team workspace</p>
      <div className="flex flex-col gap-2">
        {TEAM_ROWS.map((row) => (
          <div
            key={row.name}
            className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2.5"
          >
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${row.tone}`}
            >
              {row.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold text-white/90">{row.name}</p>
              <p className="truncate text-[10.5px] text-white/45">{row.role}</p>
            </div>
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${row.active ? "ds-hero-photo-pulse" : "bg-white/20"}`}
              style={row.active ? { backgroundColor: TONE_LIVE } : undefined}
            />
          </div>
        ))}
      </div>
      <p className="text-[10.5px] text-white/40">+ 116 more across 120 agencies</p>
    </div>
  );
}

const SCALE_KPIS: { label: string; value: string }[] = [
  { label: "Ads launched", value: "12M+" },
  { label: "Ad spend", value: "$48M" },
  { label: "Avg. CPR", value: "$2.14" },
];

const CHANNEL_MIX: { label: string; pct: number; className: string }[] = [
  { label: "Meta", pct: 58, className: "h-full bg-primary" },
  { label: "TikTok", pct: 24, className: "h-full bg-primary/45" },
  { label: "Google", pct: 18, className: "h-full bg-white/25" },
];

function ScaleFrameContent() {
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Growth dashboard</p>
      <div className="grid grid-cols-3 gap-2.5">
        {SCALE_KPIS.map((kpi) => (
          <div key={kpi.label} className="rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2.5">
            <p className="text-[15px] font-bold leading-tight tabular-nums text-white/95">{kpi.value}</p>
            <p className="mt-0.5 text-[10px] leading-snug text-white/45">{kpi.label}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-white/40">Channel mix</p>
        <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-white/10">
          {CHANNEL_MIX.map((c) => (
            <span key={c.label} className={c.className} style={{ width: `${c.pct}%` }} />
          ))}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/45">
          {CHANNEL_MIX.map((c) => (
            <span key={c.label}>
              {c.label} {c.pct}%
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const STATUS_ROWS: { label: string }[] = [
  { label: "Ad delivery" },
  { label: "Reporting API" },
  { label: "Automation engine" },
];

function TrustFrameContent() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">System status</p>
      <div className="flex flex-col gap-2">
        {STATUS_ROWS.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <span
                className="ds-hero-photo-pulse h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: TONE_LIVE }}
              />
              <span className="text-[12px] font-medium text-white/85">{row.label}</span>
            </div>
            <span className="text-[10.5px] font-medium" style={{ color: TONE_LIVE }}>
              Operational
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-[11px] text-white/50">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        99.9% uptime · 24/7 monitoring
      </div>
    </div>
  );
}

function FrameContent({ slideId }: { slideId: Slide["id"] }) {
  if (slideId === "community") return <CommunityFrameContent />;
  if (slideId === "scale") return <ScaleFrameContent />;
  return <TrustFrameContent />;
}

export default function HeroPhotoStats(): JSX.Element {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [tabHidden, setTabHidden] = useState(() => typeof document !== "undefined" && document.hidden);

  // Single remount counter for the product frame's content pane + the active
  // progress bar's fill — bumped on every slide (re)activation so the
  // ken-burns-equivalent scale and the bar fill both restart from their 0
  // state instead of resuming a stale animation.
  const genRef = useRef(0);

  const goToSlide = (next: number) => {
    genRef.current += 1;
    setActiveIndex(next);
  };

  // Track the OS-level reduced-motion preference live, not just at mount.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Pause auto-advance while the tab is backgrounded — no point burning a
  // timer (or surprising the user with a jump) on a hidden document.
  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Auto-advance every SLIDE_DURATION_MS. Re-armed whenever the active
  // slide changes — auto tick or manual bar click — so a manual jump
  // always gets its own full interval, keeping the bar-fill animation and
  // the actual auto-advance perfectly in sync instead of drifting apart.
  useEffect(() => {
    if (reduceMotion || tabHidden) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % SLIDES.length;
        genRef.current += 1;
        return next;
      });
    }, SLIDE_DURATION_MS);
    return () => window.clearInterval(id);
  }, [activeIndex, reduceMotion, tabHidden]);

  const activeSlide = SLIDES[activeIndex];

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <style>{`
        @keyframes ds-hero-photo-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ds-hero-photo-rise {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ds-hero-photo-fade-in { animation: ds-hero-photo-fade 0.6s ease-out both; }
        .ds-hero-photo-card-in { animation: ds-hero-photo-rise 0.5s cubic-bezier(0.22,1,0.36,1) both; animation-delay: 160ms; }
        .ds-hero-photo-content-in { animation: ds-hero-photo-rise 0.5s cubic-bezier(0.22,1,0.36,1) both; }

        @media (prefers-reduced-motion: no-preference) {
          @keyframes ds-hero-photo-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          .ds-hero-photo-float { animation: ds-hero-photo-float 7s ease-in-out infinite; }

          @keyframes ds-hero-photo-kenburns {
            from { transform: scale(1); }
            to { transform: scale(1.06); }
          }
          .ds-hero-photo-kenburns { animation: ds-hero-photo-kenburns 14s ease-out both; }

          @keyframes ds-hero-photo-fill {
            from { transform: scaleX(0); }
            to { transform: scaleX(1); }
          }
          .ds-hero-photo-fill { animation: ds-hero-photo-fill ${SLIDE_DURATION_MS}ms linear forwards; }

          @keyframes ds-hero-photo-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.45; transform: scale(0.75); }
          }
          .ds-hero-photo-pulse { animation: ds-hero-photo-pulse 2.2s ease-in-out infinite; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ds-hero-photo-fade-in,
          .ds-hero-photo-card-in,
          .ds-hero-photo-content-in {
            animation: none; opacity: 1; transform: none;
          }
          .ds-hero-photo-float { animation: none; transform: none; }
          .ds-hero-photo-pulse { animation: none; opacity: 1; transform: none; }
        }
      `}</style>

      {/* full-bleed product frame — an app-window chrome over a dark/lime
          atmosphere, replacing the old raster photo entirely so nothing here
          can pixelate at any zoom or density. The chrome (dots + title bar)
          stays put across slides; only the title label and the content pane
          swap, and the content pane carries the ken-burns-equivalent scale. */}
      <div className="ds-hero-photo-fade-in absolute inset-0 flex flex-col overflow-hidden">
        {/* atmosphere backdrop — dark gradient + faint dot texture + a lime
            glow, keeping the same Dark Stage near-black/lime identity as
            every sibling hero instead of a bright light-mode screenshot */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_15%,hsl(var(--primary)/0.18),transparent_55%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--card))_0%,hsl(var(--background))_100%)]" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: "radial-gradient(circle, hsl(var(--foreground)/0.5) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          />
        </div>

        {/* window chrome bar */}
        <div className="relative z-10 flex shrink-0 items-center gap-3 border-b border-white/10 bg-white/[0.03] px-5 py-3 backdrop-blur-sm">
          <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-white/[0.18]" />
            <span className="h-2 w-2 rounded-full bg-white/[0.14]" />
            <span className="h-2 w-2 rounded-full bg-white/[0.10]" />
          </div>
          <div className="relative h-4 min-w-0 flex-1 text-center">
            {SLIDES.map((slide, i) => (
              <p
                key={slide.id}
                aria-hidden={i === activeIndex ? undefined : true}
                className={`absolute inset-x-0 truncate text-[11px] font-medium text-white/55 transition-opacity duration-300 ${
                  i === activeIndex ? "opacity-100" : "opacity-0"
                }`}
              >
                {slide.windowTitle}
              </p>
            ))}
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary-text">
            <span
              className="ds-hero-photo-pulse h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: TONE_LIVE }}
              aria-hidden="true"
            />
            Live
          </span>
        </div>

        {/* content pane — one active widget at a time, remounted per slide
            (keyed by id+gen) so the rise-in and the ken-burns scale both
            restart together on every activation. Split across two nested
            elements — same technique as the card-in/float split below —
            because ds-hero-photo-content-in and ds-hero-photo-kenburns both
            set the `animation` shorthand; sharing one element would let
            whichever class compiles later silently win the whole shorthand
            instead of both animations playing. */}
        <div className="relative z-10 min-h-0 flex-1 overflow-hidden">
          <div
            key={`${activeSlide.id}-${genRef.current}`}
            className="ds-hero-photo-content-in h-full w-full"
          >
            <div
              className={`h-full w-full px-6 py-6 ${!reduceMotion ? "ds-hero-photo-kenburns" : ""}`}
            >
              <FrameContent slideId={activeSlide.id} />
            </div>
          </div>
        </div>

        {/* bottom scrim so the floating card below always has legibility */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-2/5 bg-gradient-to-b from-transparent to-black/70" />
      </div>

      {/* brand mark, top-right per client reference */}
      <img
        src={heroLogo}
        alt=""
        aria-hidden="true"
        className="ds-hero-photo-fade-in absolute right-8 top-8 z-20 h-5 w-auto opacity-80"
      />

      {/* lower composition — credit chip, card, progress bars in one
          anchored column so the chip always sits flush above the card
          regardless of how tall the card's active slide content is. */}
      <div className="ds-hero-photo-card-in absolute inset-x-8 bottom-14 z-20 flex flex-col gap-3">
        {/* tiny glass pill labeling the frame above as the real workspace */}
        <div className="flex justify-end">
          <span className="inline-flex items-center rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[10px] font-medium text-white/70 backdrop-blur-md">
            FabFunnel dashboard — live preview
          </span>
        </div>

        {/* floating stat card */}
        <div className="ds-hero-photo-float relative mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-white/90 px-6 py-5 text-neutral-900 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.5),0_10px_20px_-12px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.7)] ring-1 ring-white/50 backdrop-blur">
          <div className="relative min-h-[176px]">
            {SLIDES.map((slide, i) => (
              <div
                key={slide.id}
                aria-hidden={i === activeIndex ? undefined : true}
                className={`absolute inset-0 flex flex-col justify-center gap-3 transition-all duration-[400ms] ease-out ${
                  i === activeIndex
                    ? "opacity-100 translate-y-0"
                    : "pointer-events-none opacity-0 translate-y-1.5"
                }`}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                  {slide.eyebrow}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {slide.stats.map(({ Icon, value, label }) => (
                    <div key={label} className="flex items-start gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <Icon className="h-[18px] w-[18px]" />
                      </div>
                      <div>
                        <p className="text-[20px] font-bold leading-tight tabular-nums text-neutral-900">
                          {value}
                        </p>
                        <p className="text-[11px] leading-snug text-neutral-500">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs leading-relaxed text-neutral-600">{slide.tagline}</p>

                {slide.showAvatars && (
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="flex -space-x-2">
                      {AVATARS.map((a) => (
                        <div
                          key={a.initials}
                          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[9px] font-semibold ${a.className}`}
                        >
                          {a.initials}
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Joined this week: <span className="font-semibold text-neutral-900">87</span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* carousel progress bars — the active bar fills over the real
            slide duration; clicking any bar jumps straight to that slide. */}
        <div className="flex justify-center gap-2">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Show slide ${i + 1} of ${SLIDES.length}: ${slide.eyebrow.replace(/^\d+\s*—\s*/, "")}`}
              onClick={() => goToSlide(i)}
              className="group relative h-1 w-10 overflow-hidden rounded-full bg-white/25 transition-colors hover:bg-white/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              {i === activeIndex &&
                (reduceMotion ? (
                  <span className="absolute inset-0 rounded-full bg-white/80" />
                ) : (
                  <span
                    key={`fill-${slide.id}-${genRef.current}`}
                    className="ds-hero-photo-fill absolute inset-y-0 left-0 w-full origin-left rounded-full bg-[linear-gradient(90deg,hsl(var(--primary)),rgba(255,255,255,0.9))]"
                  />
                ))}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
