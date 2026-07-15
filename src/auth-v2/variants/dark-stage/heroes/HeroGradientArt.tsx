import heroLogo from "@/assets/auth/hero-logo.svg";

/** "Gradient Art" hero variant for Dark Stage's swappable hero-panel track.
 *  Reference: a vivid abstract 3D-gradient art panel (flowing diagonal
 *  ribbons of blue/purple/coral light streaks, macOS-wallpaper style)
 *  inset with rounded corners inside the page, with two frosted-glass
 *  testimonial cards overlaid at the bottom (avatar + name + @handle +
 *  short quote). FabAds keeps the composition but re-hues the ribbons into
 *  deep green / lime / warm-champagne so it reads as Dark Stage's own
 *  identity rather than a generic gradient wallpaper — the "blue/purple"
 *  reference hues are deliberately not carried over (§ on-brand palette).
 *  Unlike HeroPhotoStats (full-bleed), this variant owns its own inset
 *  rounded art surface per the client reference, so the outer padding +
 *  rounded[28px] card live inside this component rather than the mount
 *  point. */

const TESTIMONIALS = [
  {
    initials: "TG",
    name: "Tulika G",
    handle: "@tulikag",
    quote: "Cut our launch time from days to minutes. The automation is unreal.",
  },
  {
    initials: "RS",
    name: "Rahul S",
    handle: "@rahuls",
    quote: "One dashboard for every ad account. Reporting finally makes sense.",
  },
] as const;

export default function HeroGradientArt(): JSX.Element {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <style>{`
        @keyframes ds-hero-grad-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ds-hero-grad-rise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ds-hero-grad-fade-in { animation: ds-hero-grad-fade-in 0.7s ease-out both; }
        .ds-hero-grad-card-in { animation: ds-hero-grad-rise 0.5s cubic-bezier(0.22,1,0.36,1) both; }

        @media (prefers-reduced-motion: no-preference) {
          @keyframes ds-hero-grad-drift-a {
            0%, 100% { transform: rotate(-25deg) translate(0%, 0%) scale(1); }
            50% { transform: rotate(-25deg) translate(3%, -2%) scale(1.06); }
          }
          @keyframes ds-hero-grad-drift-b {
            0%, 100% { transform: rotate(-25deg) translate(0%, 0%) scale(1); }
            50% { transform: rotate(-25deg) translate(-4%, 3%) scale(1.08); }
          }
          @keyframes ds-hero-grad-drift-c {
            0%, 100% { transform: rotate(-25deg) translate(0%, 0%) scale(1); }
            50% { transform: rotate(-25deg) translate(2%, 2%) scale(1.04); }
          }
          .ds-hero-grad-drift-a { animation: ds-hero-grad-drift-a 26s ease-in-out infinite; }
          .ds-hero-grad-drift-b { animation: ds-hero-grad-drift-b 32s ease-in-out infinite; animation-delay: -6s; }
          .ds-hero-grad-drift-c { animation: ds-hero-grad-drift-c 22s ease-in-out infinite; animation-delay: -3s; }

          @keyframes ds-hero-grad-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
          .ds-hero-grad-float { animation: ds-hero-grad-float 8s ease-in-out infinite alternate; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ds-hero-grad-fade-in,
          .ds-hero-grad-card-in { animation: none; opacity: 1; transform: none; }
          .ds-hero-grad-drift-a,
          .ds-hero-grad-drift-b,
          .ds-hero-grad-drift-c { animation: none; }
          .ds-hero-grad-float { animation: none; transform: none; }
        }
      `}</style>

      {/* outer padding — the art panel is inset inside the hero half, not
          full-bleed, per the client reference */}
      <div className="h-full w-full p-6">
        <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-[hsl(150_38%_6%)]">
          {/* abstract gradient ribbon layers — full-size, heavily blurred,
              rotated, drifting very slowly. mix-blend-screen so overlapping
              hues glow rather than muddy on the dark base. */}
          <div className="ds-hero-grad-fade-in absolute inset-0">
            <div
              className="ds-hero-grad-drift-a absolute -inset-1/4 mix-blend-screen blur-[55px]"
              style={{
                background:
                  "linear-gradient(115deg, hsl(150 55% 22%) 0%, hsl(84 70% 55%) 45%, hsl(150 45% 10%) 100%)",
                transform: "rotate(-25deg)",
                opacity: 0.9,
              }}
            />
            <div
              className="ds-hero-grad-drift-b absolute -inset-1/4 mix-blend-screen blur-[60px]"
              style={{
                background:
                  "conic-gradient(from 200deg at 30% 40%, hsl(45 55% 72%) 0deg, transparent 90deg, hsl(140 45% 25%) 180deg, transparent 300deg)",
                transform: "rotate(-25deg)",
                opacity: 0.7,
              }}
            />
            <div
              className="ds-hero-grad-drift-c absolute -inset-1/4 mix-blend-screen blur-[40px]"
              style={{
                background:
                  "linear-gradient(105deg, transparent 20%, hsl(var(--primary) / 0.55) 50%, transparent 80%)",
                transform: "rotate(-25deg)",
                opacity: 0.65,
              }}
            />
          </div>

          {/* fine diagonal line texture — turns the blurred glow into
              "ribbed" light streaks like the reference, rather than plain
              soft blobs */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(-25deg, rgba(255,255,255,0.9) 0px, rgba(255,255,255,0.9) 1px, transparent 1px, transparent 6px)",
            }}
          />

          {/* dark vignette — bottom, for testimonial-card legibility */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.35)_55%,rgba(0,0,0,0.85)_100%)]"
          />
          {/* dark vignette — edges */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,transparent_45%,rgba(0,0,0,0.4)_100%)]"
          />

          {/* brand mark, small top-left over the art */}
          <img
            src={heroLogo}
            alt=""
            aria-hidden="true"
            className="ds-hero-grad-fade-in absolute left-5 top-5 z-20 h-5 w-auto opacity-90"
          />

          {/* testimonial cards, bottom */}
          <div className="absolute inset-x-4 bottom-4 z-20 grid grid-cols-2 gap-3 sm:inset-x-5 sm:bottom-5">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.handle}
                className="ds-hero-grad-card-in"
                style={{ animationDelay: `${160 + i * 120}ms` }}
              >
                <div
                  className="ds-hero-grad-float rounded-xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-md"
                  style={{ animationDelay: i === 0 ? "0s" : "1.2s" }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 bg-primary/30 text-[10px] font-semibold text-primary">
                      {t.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-white">{t.name}</p>
                      <p className="truncate text-[10px] text-white/50">{t.handle}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] leading-snug text-white/85">{t.quote}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
