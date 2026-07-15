import { Users, Building2 } from "lucide-react";

import heroLogo from "@/assets/auth/hero-logo.svg";
import heroMockup from "@/assets/auth/hero-mockup.png";

/** Photo-forward hero variant for Dark Stage's swappable hero-panel track.
 *  Reference: a full-bleed dramatic monochrome architectural photo with a
 *  floating light card (two big stats + welcome copy) in the lower third
 *  and thin carousel progress bars pinned to the very bottom. FabAds keeps
 *  the same composition but grades the photo dark/desaturated with a lime
 *  tint so it reads as part of the Dark Stage scene, and swaps the client's
 *  cream card for a deliberate white/neutral inversion moment — the one
 *  spot in this variant that isn't running on semantic tokens, because the
 *  whole point (mirrored from the reference) is a light surface popping
 *  off the dark photo. */

const STATS = [
  { Icon: Users, value: "4,500+", label: "Marketers already in" },
  { Icon: Building2, value: "120+", label: "Agencies onboard" },
] as const;

export default function HeroPhotoStats(): JSX.Element {
  return (
    <div className="relative h-full w-full overflow-hidden">
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

        @media (prefers-reduced-motion: no-preference) {
          @keyframes ds-hero-photo-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          .ds-hero-photo-float { animation: ds-hero-photo-float 7s ease-in-out infinite; }

          @keyframes ds-hero-photo-bar-shimmer {
            0%, 100% { opacity: 0.85; }
            50% { opacity: 1; }
          }
          .ds-hero-photo-bar-active { animation: ds-hero-photo-bar-shimmer 2.4s ease-in-out infinite; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ds-hero-photo-fade-in,
          .ds-hero-photo-card-in { animation: none; opacity: 1; transform: none; }
          .ds-hero-photo-float { animation: none; transform: none; }
          .ds-hero-photo-bar-active { animation: none; opacity: 1; }
        }
      `}</style>

      {/* full-bleed photo, graded dark + desaturated so it belongs to the
          Dark Stage scene rather than reading as a stock photo dropped in */}
      <div className="ds-hero-photo-fade-in absolute inset-0">
        <img
          src={heroMockup}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover grayscale-[0.4] contrast-110"
        />
        {/* desaturating base scrim */}
        <div className="absolute inset-0 bg-black/50" />
        {/* lime tint so the photo reads as part of the Dark Stage identity */}
        <div className="absolute inset-0 bg-primary/10 mix-blend-screen" />
        {/* bottom scrim for card + progress-bar legibility */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_40%,rgba(0,0,0,0.75)_100%)]" />
      </div>

      {/* brand mark, top-right per client reference */}
      <img
        src={heroLogo}
        alt=""
        aria-hidden="true"
        className="ds-hero-photo-fade-in absolute right-8 top-8 z-10 h-5 w-auto opacity-80"
      />

      {/* floating stat card, lower third */}
      <div className="ds-hero-photo-card-in absolute inset-x-8 bottom-16 z-10 flex justify-center">
        <div className="ds-hero-photo-float w-full max-w-md rounded-2xl bg-white/90 p-6 text-neutral-900 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="grid grid-cols-2 gap-4">
            {STATS.map(({ Icon, value, label }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-bold leading-tight text-neutral-900">{value}</p>
                  <p className="text-xs leading-snug text-neutral-600">{label}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-neutral-600">
            Welcome to the platform that unifies launch, automation and reporting —
            everything your team needs to scale ad performance, in one place.
          </p>
        </div>
      </div>

      {/* carousel progress bars, decorative */}
      <div className="absolute inset-x-0 bottom-6 z-10 flex justify-center gap-2">
        <div className="ds-hero-photo-bar-active h-1 w-10 rounded-full bg-white" />
        <div className="h-1 w-10 rounded-full bg-white/30" />
        <div className="h-1 w-10 rounded-full bg-white/30" />
      </div>
    </div>
  );
}
