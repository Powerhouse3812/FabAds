/** "Stage Lights" — theatrical volumetric spotlights for the Dark Stage
 *  signup card: three trapezoid light beams fall from the rigging above
 *  (warm champagne widest and just left of center, lime narrower on the
 *  right, a faint cool-white sliver far left), each landing in a soft
 *  elliptical floor pool. Dust motes drift upward through the beam volumes,
 *  a hairline floor and faint reflection ground the scene, extremely
 *  subtle curtain-fold banding textures the back wall, and a couple of
 *  barely-there rigging dots wink at the "stage" conceit without ever
 *  reading literal. Cinematic restraint — deep blacks, low-opacity
 *  highlights, no images/Canvas, pure CSS.
 *
 *  Contract: no props, single full-bleed absolute layer, own <style> tag,
 *  keyframes prefixed ds-sbg-beams-* only, absolute positioning only,
 *  center-safe vignette so the centered glass card stays readable.
 */

const RIGGING: { left: string; top: string }[] = [
  { left: "6%", top: "3%" },
  { left: "93%", top: "4%" },
  { left: "50%", top: "2%" },
];

const MOTES: {
  left: string;
  top: string;
  size: number;
  variant: "a" | "b" | "c";
  duration: string;
  delay: string;
}[] = [
  // champagne-beam zone
  { left: "18%", top: "68%", size: 2, variant: "a", duration: "9.5s", delay: "-1.2s" },
  { left: "27%", top: "55%", size: 1.5, variant: "b", duration: "11s", delay: "-4.6s" },
  { left: "34%", top: "72%", size: 2.5, variant: "c", duration: "8s", delay: "-2.1s" },
  { left: "45%", top: "60%", size: 2, variant: "a", duration: "12.5s", delay: "-6.4s" },
  // lime-beam zone
  { left: "70%", top: "65%", size: 2.5, variant: "b", duration: "7.5s", delay: "-3s" },
  { left: "77%", top: "50%", size: 1.5, variant: "c", duration: "10.5s", delay: "-5.2s" },
  { left: "82%", top: "70%", size: 2, variant: "a", duration: "9s", delay: "-0.8s" },
  // faint far-left-beam zone
  { left: "4%", top: "58%", size: 1.5, variant: "b", duration: "13s", delay: "-7.1s" },
  { left: "9%", top: "40%", size: 2, variant: "c", duration: "8.6s", delay: "-2.9s" },
  { left: "12%", top: "66%", size: 3, variant: "a", duration: "11.5s", delay: "-4.1s" },
];

export default function SignupBgBeams(): JSX.Element {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes ds-sbg-beams-sway {
            0%, 100% { transform: rotate(-1.2deg); }
            50% { transform: rotate(1.2deg); }
          }
          .ds-sbg-beams-sway-a { animation: ds-sbg-beams-sway 16s ease-in-out infinite; }
          .ds-sbg-beams-sway-b { animation: ds-sbg-beams-sway 12s ease-in-out infinite; animation-delay: -4s; }
          .ds-sbg-beams-sway-c { animation: ds-sbg-beams-sway 14s ease-in-out infinite; animation-delay: -7s; }

          @keyframes ds-sbg-beams-pool-breathe {
            0%, 100% { opacity: 0.85; transform: translate(-50%, 0) scale(1); }
            50% { opacity: 1; transform: translate(-50%, 0) scale(1.05); }
          }
          .ds-sbg-beams-pool { animation: ds-sbg-beams-pool-breathe 9s ease-in-out infinite; }

          @keyframes ds-sbg-beams-mote-a {
            0% { transform: translate(0, 0); opacity: 0; }
            12% { opacity: 0.7; }
            55% { transform: translate(3px, -70px); opacity: 0.45; }
            88% { opacity: 0.12; }
            100% { transform: translate(-2px, -140px); opacity: 0; }
          }
          @keyframes ds-sbg-beams-mote-b {
            0% { transform: translate(0, 0); opacity: 0; }
            15% { opacity: 0.6; }
            50% { transform: translate(-4px, -60px); opacity: 0.4; }
            85% { opacity: 0.1; }
            100% { transform: translate(2px, -125px); opacity: 0; }
          }
          @keyframes ds-sbg-beams-mote-c {
            0% { transform: translate(0, 0); opacity: 0; }
            10% { opacity: 0.65; }
            60% { transform: translate(2px, -80px); opacity: 0.35; }
            90% { opacity: 0.08; }
            100% { transform: translate(-3px, -150px); opacity: 0; }
          }
          .ds-sbg-beams-mote-a { animation: ds-sbg-beams-mote-a 10s ease-in-out infinite; }
          .ds-sbg-beams-mote-b { animation: ds-sbg-beams-mote-b 10s ease-in-out infinite; }
          .ds-sbg-beams-mote-c { animation: ds-sbg-beams-mote-c 10s ease-in-out infinite; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ds-sbg-beams-mote { display: none; }
        }
      `}</style>

      {/* Base wash — deep black with the faintest ceiling-lit gradient, as
          if ambient bounce from the rig above is falling on the backdrop. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(var(--card))_0%,hsl(var(--background))_65%)]" />

      {/* Back wall — extremely subtle vertical curtain-fold banding, top
          half only, fading out toward the floor. */}
      <div
        className="absolute inset-x-0 top-0 h-1/2"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 60px, transparent 60px, transparent 120px)",
          maskImage: "linear-gradient(to bottom, black, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
        }}
      />

      {/* Rigging dots — barely-there fixture hints in the top corners, a
          set-design wink rather than a literal cue. */}
      {RIGGING.map((r, i) => (
        <div key={i} className="absolute -translate-x-1/2" style={{ left: r.left, top: r.top }}>
          <div className="mx-auto h-[3px] w-[3px] rounded-full bg-white/15" />
          <div className="mx-auto h-4 w-px bg-white/15" />
        </div>
      ))}

      {/* Beam — faint cool-white, far left, faintest of the three. */}
      <div
        className="ds-sbg-beams-sway-c absolute"
        style={{ left: "-8%", width: "26%", top: "-10%", height: "82%", transformOrigin: "50% 0%" }}
      >
        <div
          className="absolute blur-2xl"
          style={{
            inset: "0 -18% 0 -18%",
            backgroundImage:
              "linear-gradient(to bottom, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 45%, rgba(255,255,255,0) 78%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            clipPath: "polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)",
            backgroundImage:
              "linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.025) 40%, rgba(255,255,255,0) 78%)",
          }}
        />
      </div>

      {/* Beam — warm champagne, center-left, widest of the three; aimed
          just left of dead-center so the glass card stays clean. */}
      <div
        className="ds-sbg-beams-sway-a absolute"
        style={{ left: "12%", width: "56%", top: "-8%", height: "90%", transformOrigin: "50% 0%" }}
      >
        <div
          className="absolute blur-2xl"
          style={{
            inset: "0 -18% 0 -18%",
            backgroundImage:
              "linear-gradient(to bottom, rgba(255,224,180,0.18) 0%, rgba(255,224,180,0.08) 45%, rgba(255,224,180,0) 82%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            clipPath: "polygon(43% 0%, 57% 0%, 100% 100%, 0% 100%)",
            backgroundImage:
              "linear-gradient(to bottom, rgba(255,214,158,0.10) 0%, rgba(255,214,158,0.05) 40%, rgba(255,214,158,0) 82%)",
          }}
        />
      </div>

      {/* Beam — lime, right side, narrower than the champagne key light. */}
      <div
        className="ds-sbg-beams-sway-b absolute"
        style={{ left: "60%", width: "30%", top: "-6%", height: "84%", transformOrigin: "50% 0%" }}
      >
        <div
          className="absolute blur-2xl"
          style={{
            inset: "0 -18% 0 -18%",
            backgroundImage:
              "linear-gradient(to bottom, hsl(var(--primary) / 0.16) 0%, hsl(var(--primary) / 0.07) 45%, hsl(var(--primary) / 0) 80%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            clipPath: "polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)",
            backgroundImage:
              "linear-gradient(to bottom, hsl(var(--primary) / 0.09) 0%, hsl(var(--primary) / 0.045) 40%, hsl(var(--primary) / 0) 80%)",
          }}
        />
      </div>

      {/* Floor pools — where each beam "hits", a breathing elliptical glow
          matching its beam's hue. */}
      <div
        className="ds-sbg-beams-pool absolute blur-xl"
        style={{
          left: "5%",
          top: "77%",
          width: "20%",
          height: "9%",
          transform: "translate(-50%, 0)",
          borderRadius: "9999px",
          backgroundImage:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 72%)",
        }}
      />
      <div
        className="ds-sbg-beams-pool absolute blur-xl"
        style={{
          left: "40%",
          top: "78%",
          width: "34%",
          height: "11%",
          transform: "translate(-50%, 0)",
          borderRadius: "9999px",
          backgroundImage:
            "radial-gradient(ellipse at center, rgba(255,214,158,0.12) 0%, rgba(255,214,158,0) 72%)",
          animationDelay: "-3s",
        }}
      />
      <div
        className="ds-sbg-beams-pool absolute blur-xl"
        style={{
          left: "75%",
          top: "76%",
          width: "24%",
          height: "10%",
          transform: "translate(-50%, 0)",
          borderRadius: "9999px",
          backgroundImage:
            "radial-gradient(ellipse at center, hsl(var(--primary) / 0.11) 0%, hsl(var(--primary) / 0) 72%)",
          animationDelay: "-6s",
        }}
      />

      {/* Dust motes — drifting up through the beam volumes on three
          staggered keyframe paths. */}
      {MOTES.map((m, i) => (
        <div
          key={i}
          className={`ds-sbg-beams-mote ds-sbg-beams-mote-${m.variant} absolute rounded-full bg-[rgba(255,247,225,0.55)]`}
          style={{
            left: m.left,
            top: m.top,
            width: m.size,
            height: m.size,
            filter: "blur(0.5px)",
            animationDuration: m.duration,
            animationDelay: m.delay,
          }}
        />
      ))}

      {/* Stage floor — hairline with a barely-visible reflection gradient
          beneath it. */}
      <div
        className="absolute inset-x-0"
        style={{ top: "82%", height: "1px", backgroundColor: "rgba(255,255,255,0.08)" }}
      />
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          top: "82%",
          backgroundImage: "linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 60%)",
        }}
      />

      {/* Contact shadow — grounds the centered card on the stage floor. */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 blur-2xl"
        style={{
          top: "58%",
          width: "36%",
          height: "44px",
          borderRadius: "9999px",
          backgroundImage: "radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 75%)",
        }}
      />

      {/* Center-safe vignette — keeps the middle of the frame, where the
          glass card sits, clear; only edges/corners darken. */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 46%, transparent 0%, transparent 36%, rgba(0,0,0,0.42) 100%)",
        }}
      />
    </div>
  );
}
