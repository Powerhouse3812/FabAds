/** "Horizon" — cinematic planet-rise / dawn-over-horizon backdrop for the
 *  Dark Stage signup card. Pure CSS/SVG, no images, no Canvas. One focal
 *  idea: a rim-lit horizon curve low in the frame, everything else (stars,
 *  scanlines, satellites, grain) is quiet support detail around it.
 *
 *  Contract: no props, single full-bleed absolute layer, own <style> tag,
 *  keyframes prefixed ds-sbg-horizon-* only, no layout height, center-safe
 *  vignette so the centered glass card stays readable.
 */
export default function SignupBgHorizon(): JSX.Element {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <style>{`
        .ds-sbg-horizon-stars-far {
          background-image:
            radial-gradient(1px 1px at 6% 12%, rgba(255,255,255,0.55) 0%, transparent 100%),
            radial-gradient(1px 1px at 18% 38%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 32% 8%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 44% 62%, rgba(255,255,255,0.35) 0%, transparent 100%),
            radial-gradient(1px 1px at 58% 22%, rgba(255,255,255,0.45) 0%, transparent 100%),
            radial-gradient(1px 1px at 71% 48%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 84% 16%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 92% 68%, rgba(255,255,255,0.35) 0%, transparent 100%),
            radial-gradient(1px 1px at 12% 82%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 27% 90%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 63% 88%, rgba(255,255,255,0.45) 0%, transparent 100%),
            radial-gradient(1px 1px at 78% 92%, rgba(255,255,255,0.3) 0%, transparent 100%);
          background-repeat: repeat;
          background-size: 220px 220px;
          opacity: 0.55;
        }

        .ds-sbg-horizon-stars-near {
          background-image:
            radial-gradient(1.5px 1.5px at 14% 20%, rgba(255,255,255,0.9) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 38% 55%, rgba(255,255,255,0.7) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 52% 15%, rgba(255,255,255,0.85) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 68% 40%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 82% 70%, rgba(255,255,255,0.75) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 24% 80%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 90% 25%, rgba(255,255,255,0.8) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 6% 62%, rgba(255,255,255,0.65) 0%, transparent 100%);
          background-repeat: repeat;
          background-size: 320px 320px;
          opacity: 0.75;
        }

        .ds-sbg-horizon-shoot-a,
        .ds-sbg-horizon-shoot-b {
          opacity: 0;
        }

        .ds-sbg-horizon-scanlines {
          background-image: repeating-linear-gradient(
            to bottom,
            rgba(255,255,255,0.035) 0px,
            rgba(255,255,255,0.035) 1px,
            transparent 1px,
            transparent 4px
          );
        }

        .ds-sbg-horizon-grain {
          background-image: radial-gradient(circle, rgba(255,255,255,0.5) 0.5px, transparent 0.6px);
          background-size: 3px 3px;
          opacity: 0.03;
        }

        @media (prefers-reduced-motion: no-preference) {
          .ds-sbg-horizon-stars-near {
            animation: ds-sbg-horizon-star-drift 240s linear infinite;
          }
          @keyframes ds-sbg-horizon-star-drift {
            from { background-position: 0 0; }
            to { background-position: -320px -320px; }
          }

          .ds-sbg-horizon-shoot-a {
            animation: ds-sbg-horizon-shoot-a 9s linear infinite;
            animation-delay: -1.5s;
          }
          @keyframes ds-sbg-horizon-shoot-a {
            0%, 78% { opacity: 0; transform: translate(0, 0) rotate(35deg); }
            80% { opacity: 1; }
            90%, 100% { opacity: 0; transform: translate(150px, 105px) rotate(35deg); }
          }

          .ds-sbg-horizon-shoot-b {
            animation: ds-sbg-horizon-shoot-b 9.6s linear infinite;
            animation-delay: -6s;
          }
          @keyframes ds-sbg-horizon-shoot-b {
            0%, 82% { opacity: 0; transform: translate(0, 0) rotate(-32deg); }
            84% { opacity: 1; }
            93%, 100% { opacity: 0; transform: translate(-120px, 100px) rotate(-32deg); }
          }

          .ds-sbg-horizon-halo-breathe {
            animation: ds-sbg-horizon-halo-breathe 8s ease-in-out infinite;
          }
          @keyframes ds-sbg-horizon-halo-breathe {
            0%, 100% { filter: brightness(1) saturate(1); }
            50% { filter: brightness(1.2) saturate(1.12); }
          }

          .ds-sbg-horizon-orbit-a {
            animation: ds-sbg-horizon-orbit-a 34s linear infinite;
          }
          @keyframes ds-sbg-horizon-orbit-a {
            from { transform: rotate(12deg); }
            to { transform: rotate(372deg); }
          }

          .ds-sbg-horizon-orbit-b {
            animation: ds-sbg-horizon-orbit-b 41s linear infinite;
          }
          @keyframes ds-sbg-horizon-orbit-b {
            from { transform: rotate(-18deg); }
            to { transform: rotate(-378deg); }
          }
        }
      `}</style>

      {/* Base — deep space black, the faintest warm-dark pool low in the
          frame anticipates the rim glow before it even renders. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,#0a1613_0%,#050708_45%,#000000_100%)]" />

      {/* Star field — two tiled layers, far one static, near one drifting
          at a barely-perceptible pace across a 240s loop. */}
      <div className="ds-sbg-horizon-stars-far absolute inset-0" />
      <div className="ds-sbg-horizon-stars-near absolute inset-0" />

      {/* Shooting stars — thin streaks, fire roughly every ~9s, staggered
          so the two never fire in sync. */}
      <div className="ds-sbg-horizon-shoot-a absolute left-[18%] top-[14%] h-px w-16 bg-gradient-to-r from-transparent via-white/80 to-transparent" />
      <div className="ds-sbg-horizon-shoot-b absolute right-[20%] top-[26%] h-px w-12 bg-gradient-to-r from-transparent via-white/70 to-transparent" />

      {/* Atmospheric band — faint primary tint rising toward the horizon,
          with a fine scanline texture, staying well within the lower third. */}
      <div className="absolute inset-x-0" style={{ top: "64vh", height: "20vh" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/[0.08]" />
        <div className="ds-sbg-horizon-scanlines absolute inset-0" />
      </div>

      {/* The horizon — a massive circle bled mostly below the fold; only
          its rim-lit cap is visible, reading as a planet curve. */}
      <div
        className="ds-sbg-horizon-halo-breathe absolute left-1/2 -translate-x-1/2 rounded-full"
        style={{
          top: "84vh",
          width: "160vw",
          aspectRatio: "1 / 1",
          background: "radial-gradient(ellipse at 50% 0%, #0c1512 0%, #050605 55%, #020202 100%)",
          boxShadow:
            "0 0 0 1.5px hsl(var(--primary)/0.9), 0 0 90px 20px hsl(var(--primary)/0.2), 0 0 220px 70px hsl(var(--primary)/0.08)",
        }}
      />

      {/* Warm champagne inner bloom right at the apex of the curve. */}
      <div
        className="absolute left-1/2 h-20 w-56 -translate-x-1/2 rounded-full blur-2xl"
        style={{
          top: "calc(84vh - 34px)",
          background:
            "radial-gradient(ellipse, rgba(255,244,224,0.35) 0%, rgba(255,224,170,0.12) 45%, transparent 75%)",
        }}
      />

      {/* Satellites — two tiny points riding just inside the rim curve,
          opposite rotational directions, 30s+ loops. Each is a rotating
          "arm" anchored at the horizon circle's true center so the dot at
          its far end sweeps along the visible curve; a short trailing
          line rides with it. */}
      <div
        className="ds-sbg-horizon-orbit-a absolute left-1/2 w-px origin-bottom"
        style={{ top: "calc(84vh + 2vw)", height: "78vw", transform: "rotate(12deg)" }}
      >
        <span className="absolute -left-[3px] top-0 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_2px_hsl(var(--primary)/0.7)]" />
        <span className="absolute left-0 top-1.5 h-6 w-px bg-gradient-to-b from-primary/60 to-transparent" />
      </div>
      <div
        className="ds-sbg-horizon-orbit-b absolute left-1/2 w-px origin-bottom"
        style={{ top: "calc(84vh + 6vw)", height: "74vw", transform: "rotate(-18deg)" }}
      >
        <span className="absolute -left-[2px] top-0 h-1 w-1 rounded-full bg-primary/80 shadow-[0_0_5px_1.5px_hsl(var(--primary)/0.6)]" />
        <span className="absolute left-0 top-1 h-5 w-px bg-gradient-to-b from-primary/50 to-transparent" />
      </div>

      {/* Film grain for texture cohesion across the whole scene. */}
      <div className="ds-sbg-horizon-grain absolute inset-0" />

      {/* Center-safe vignette — keeps the middle of the frame, where the
          glass card sits, clear; only edges/corners darken. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 46%, transparent 0%, transparent 36%, rgba(0,0,0,0.4) 100%)",
        }}
      />
    </div>
  );
}
