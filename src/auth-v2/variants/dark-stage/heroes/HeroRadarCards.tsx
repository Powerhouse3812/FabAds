import { Megaphone, Trophy, BarChart3 } from "lucide-react";

import heroMockup from "@/assets/auth/hero-mockup.png";

/** "Radar cards" hero variant for Dark Stage's swappable hero-panel track.
 *  Reference: a dark inset panel with a bold centered headline up top,
 *  concentric radar/ripple rings emanating from the middle, a stack of
 *  white-framed polaroid-style cards dealt in slightly rotated and
 *  overlapping at the center (front card carrying a caption strip), a
 *  few floating rounded-square icon chips scattered around the stack, and
 *  a row of carousel dots pinned to the bottom. FabAds keeps the same
 *  composition but swaps the client's tools/trophy/cart iconography for
 *  marketing-native lucide icons (Megaphone/Trophy/BarChart3), grades the
 *  polaroid photo with the shared hero-mockup asset, and runs the whole
 *  scene on semantic tokens + primary(lime) accents — except the white
 *  polaroid frames themselves, which (like HeroPhotoStats.tsx's stat card)
 *  are a deliberate light-surface inversion moment against the dark scene,
 *  so their inner caption text uses neutral-900/neutral-500 rather than
 *  foreground tokens. */

const RINGS = [
  { size: 200, tone: "border-white/8", pulse: false },
  { size: 280, tone: "border-primary/14", pulse: false },
  { size: 360, tone: "border-white/8", pulse: true },
  { size: 440, tone: "border-primary/10", pulse: false },
] as const;

const CHIPS = [
  {
    Icon: Megaphone,
    top: "calc(50% - 128px)",
    left: "calc(50% - 118px)",
    floatDelay: "0s",
    dot: true,
  },
  {
    Icon: Trophy,
    top: "calc(50% - 96px)",
    left: "calc(50% + 78px)",
    floatDelay: "1.4s",
    dot: false,
  },
  {
    Icon: BarChart3,
    top: "calc(50% + 104px)",
    left: "calc(50% - 6px)",
    floatDelay: "2.6s",
    dot: false,
  },
] as const;

export default function HeroRadarCards(): JSX.Element {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <style>{`
        @keyframes ds-hero-radar-rise {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ds-hero-radar-headline { animation: ds-hero-radar-rise 0.5s ease-out both; }

        @keyframes ds-hero-radar-deal-back-a {
          0% { opacity: 0; transform: translate(-104px, 40px) rotate(-26deg) scale(0.82); }
          70% { opacity: 1; transform: translate(-52px, 2px) rotate(-11deg) scale(1.03); }
          100% { opacity: 1; transform: translate(-58px, 6px) rotate(-8deg) scale(1); }
        }
        @keyframes ds-hero-radar-deal-back-b {
          0% { opacity: 0; transform: translate(92px, 46px) rotate(24deg) scale(0.82); }
          70% { opacity: 1; transform: translate(50px, 20px) rotate(9deg) scale(1.03); }
          100% { opacity: 1; transform: translate(46px, 16px) rotate(6deg) scale(1); }
        }
        @keyframes ds-hero-radar-deal-front {
          0% { opacity: 0; transform: translate(-6px, -46px) rotate(-9deg) scale(0.88); }
          70% { opacity: 1; transform: translate(-6px, -12px) rotate(-4deg) scale(1.02); }
          100% { opacity: 1; transform: translate(-6px, -8px) rotate(-2deg) scale(1); }
        }
        .ds-hero-radar-card-back-a {
          animation: ds-hero-radar-deal-back-a 0.6s cubic-bezier(0.22,1,0.36,1) both;
          animation-delay: 0ms;
        }
        .ds-hero-radar-card-back-b {
          animation: ds-hero-radar-deal-back-b 0.6s cubic-bezier(0.22,1,0.36,1) both;
          animation-delay: 140ms;
        }
        .ds-hero-radar-card-front {
          animation: ds-hero-radar-deal-front 0.6s cubic-bezier(0.22,1,0.36,1) both;
          animation-delay: 300ms;
        }

        @media (prefers-reduced-motion: no-preference) {
          @keyframes ds-hero-radar-ring-pulse {
            0%, 100% { opacity: 0.55; transform: scale(1); }
            50% { opacity: 0.15; transform: scale(1.08); }
          }
          .ds-hero-radar-ring-pulse { animation: ds-hero-radar-ring-pulse 5s ease-in-out infinite; }

          @keyframes ds-hero-radar-chip-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }
          .ds-hero-radar-chip-float { animation: ds-hero-radar-chip-float 6.5s ease-in-out infinite; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ds-hero-radar-headline { animation: none; opacity: 1; transform: none; }
          .ds-hero-radar-card-back-a { animation: none; opacity: 1; transform: rotate(-8deg) translate(-58px, 6px); }
          .ds-hero-radar-card-back-b { animation: none; opacity: 1; transform: rotate(6deg) translate(46px, 16px); }
          .ds-hero-radar-card-front { animation: none; opacity: 1; transform: rotate(-2deg) translate(-6px, -8px); }
          .ds-hero-radar-ring-pulse { animation: none; opacity: 0.35; transform: none; }
          .ds-hero-radar-chip-float { animation: none; transform: none; }
        }
      `}</style>

      <div className="h-full w-full p-6">
        <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--card))_100%)]">
          {/* headline, top-center */}
          <div className="ds-hero-radar-headline absolute inset-x-0 top-0 z-30 px-8 pt-9 text-center">
            <h2 className="text-2xl font-bold leading-tight tracking-tight text-foreground">
              Launch, monitor and optimize
              <br />
              all from one place.
            </h2>
          </div>

          {/* concentric radar rings, centered mid-panel */}
          <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
            {RINGS.map((ring) => (
              <div
                key={ring.size}
                className={`absolute rounded-full border ${ring.tone} ${
                  ring.pulse ? "ds-hero-radar-ring-pulse" : ""
                }`}
                style={{
                  width: ring.size,
                  height: ring.size,
                  top: `calc(50% - ${ring.size / 2}px)`,
                  left: `calc(50% - ${ring.size / 2}px)`,
                }}
              />
            ))}
          </div>

          {/* card stack, centered mid-panel */}
          <div className="absolute left-1/2 top-1/2 z-10" style={{ transform: "translate(-50%, -50%)" }}>
            {/* back card A */}
            <div
              className="ds-hero-radar-card-back-a absolute left-1/2 top-1/2 w-[130px] rounded-lg bg-white p-1.5 shadow-2xl"
              style={{ marginLeft: "-65px", marginTop: "-84px" }}
            >
              <div className="h-[152px] w-full overflow-hidden rounded-md">
                <img
                  src={heroMockup}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover opacity-70 grayscale contrast-125"
                />
              </div>
            </div>

            {/* back card B */}
            <div
              className="ds-hero-radar-card-back-b absolute left-1/2 top-1/2 w-[130px] rounded-lg bg-white p-1.5 shadow-2xl"
              style={{ marginLeft: "-65px", marginTop: "-84px" }}
            >
              <div className="h-[152px] w-full overflow-hidden rounded-md">
                <img
                  src={heroMockup}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover opacity-70 grayscale contrast-125"
                />
              </div>
            </div>

            {/* front card — polaroid frame with caption strip */}
            <div
              className="ds-hero-radar-card-front absolute left-1/2 top-1/2 flex w-[168px] flex-col rounded-lg bg-white p-1.5 shadow-2xl"
              style={{ marginLeft: "-84px", marginTop: "-107px" }}
            >
              <div className="relative h-[150px] w-full overflow-hidden rounded-md">
                <img
                  src={heroMockup}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover grayscale-[0.3] contrast-125 brightness-90"
                />
                <div className="absolute inset-0 bg-black/25" />
              </div>
              {/* caption strip — deliberate light-surface exception, see file header */}
              <div className="px-1 pb-1 pt-2">
                <p className="text-[11px] font-bold leading-tight text-neutral-900">
                  Campaign Overview
                </p>
                <p className="mt-0.5 text-[9px] leading-snug text-neutral-500">
                  Live spend, CTR and ROAS in one view
                </p>
              </div>
            </div>
          </div>

          {/* floating icon chips around the stack */}
          {CHIPS.map(({ Icon, top, left, floatDelay, dot }, i) => (
            <div key={i} className="absolute z-20" style={{ top, left }}>
              <div
                className="ds-hero-radar-chip-float relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-card/70 shadow-lg backdrop-blur-md"
                style={{ animationDelay: floatDelay }}
              >
                <Icon className="h-5 w-5 text-primary" />
                {dot && (
                  <span
                    className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background"
                    aria-hidden="true"
                  />
                )}
              </div>
            </div>
          ))}

          {/* carousel dots, bottom-center */}
          <div className="absolute inset-x-0 bottom-6 z-20 flex justify-center gap-2" aria-hidden="true">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
            <span className="h-1.5 w-1.5 rounded-full bg-foreground/25" />
            <span className="h-1.5 w-1.5 rounded-full bg-foreground/25" />
          </div>
        </div>
      </div>
    </div>
  );
}
