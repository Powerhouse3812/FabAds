/** "Wire Mesh" — a 3D perspective wireframe landscape behind the Dark
 *  Stage signup card: a scrolling floor grid receding to a glowing lime
 *  horizon, sharp mountain-ridge silhouettes with a faint reflection, a
 *  sparse dot starfield, and one slowly tumbling wire polyhedron up in the
 *  corner. Synthwave-adjacent but deliberately restrained — precision
 *  linework + controlled glow (TRON-by-way-of-Linear), monochrome-plus-lime
 *  discipline, no neon-retro saturation. Pure CSS + SVG, no images/Canvas.
 *
 *  Contract: no props, single full-bleed absolute layer, own <style> tag,
 *  keyframes prefixed ds-sbg-mesh-* only, absolute positioning only, center
 *  gets a dark radial + vignette so the centered glass card stays readable.
 */
export default function SignupBgMesh(): JSX.Element {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes ds-sbg-mesh-star-twinkle {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 0.9; }
          }
          .ds-sbg-mesh-star-twinkle { animation: ds-sbg-mesh-star-twinkle 5.5s ease-in-out infinite; }

          @keyframes ds-sbg-mesh-grid-scroll {
            from { background-position: 0 0, 0 0; }
            to { background-position: 0 44px, 0 44px; }
          }
          .ds-sbg-mesh-grid-scroll { animation: ds-sbg-mesh-grid-scroll 5s linear infinite; }

          @keyframes ds-sbg-mesh-horizon-sweep {
            from { transform: translateX(0%); opacity: 0; }
            8% { opacity: 1; }
            92% { opacity: 1; }
            to { transform: translateX(730%); opacity: 0; }
          }
          .ds-sbg-mesh-horizon-sweep { animation: ds-sbg-mesh-horizon-sweep 7s linear infinite; }

          @keyframes ds-sbg-mesh-poly-tumble {
            0%, 100% { transform: rotate(-6deg) skewX(0deg); }
            50% { transform: rotate(6deg) skewX(3deg); }
          }
          .ds-sbg-mesh-poly-tumble { animation: ds-sbg-mesh-poly-tumble 14s ease-in-out infinite; }

          @keyframes ds-sbg-mesh-poly-tumble-inner {
            0%, 100% { transform: skewY(0deg) scale(1); }
            50% { transform: skewY(-2.5deg) scale(0.97); }
          }
          .ds-sbg-mesh-poly-inner { animation: ds-sbg-mesh-poly-tumble-inner 14s ease-in-out infinite; animation-delay: -3.5s; transform-origin: center; }

          @keyframes ds-sbg-mesh-vertex-glint {
            0%, 42%, 100% { opacity: 0.35; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.5); }
            58% { opacity: 0.35; transform: scale(1); }
          }
          .ds-sbg-mesh-vertex-glint { animation: ds-sbg-mesh-vertex-glint 3.6s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ds-sbg-mesh-star-twinkle { opacity: 0.7; }
          .ds-sbg-mesh-grid-scroll { background-position: 0 0, 0 0; }
          .ds-sbg-mesh-horizon-sweep { opacity: 0; }
          .ds-sbg-mesh-poly-tumble { transform: rotate(-3deg) skewX(0deg); }
          .ds-sbg-mesh-poly-inner { transform: none; }
          .ds-sbg-mesh-vertex-glint { opacity: 0.6; }
        }
      `}</style>

      {/* Sky/floor base — near-black, slightly deeper toward the bottom. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, hsl(var(--background)) 0%, hsl(0 0% 5%) 55%, hsl(0 0% 2%) 100%)",
        }}
      />

      {/* Starfield — two density layers, confined to the sky band. */}
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: "58%",
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "170px 170px",
          backgroundPosition: "20px 10px",
        }}
      />
      <div
        className="ds-sbg-mesh-star-twinkle absolute inset-x-0 top-0"
        style={{
          height: "58%",
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.28) 1px, transparent 1px)",
          backgroundSize: "84px 84px",
          backgroundPosition: "48px 30px",
        }}
      />

      {/* Aurora smudge, top-right — very faint. */}
      <div
        className="absolute -right-[12%] -top-[12%]"
        style={{
          width: "58%",
          height: "40%",
          background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.08) 0%, transparent 70%)",
          filter: "blur(38px)",
        }}
      />

      {/* Floor grid — perspective plane, bottom ~45%, bleeding past the edges. */}
      <div className="absolute bottom-0 overflow-hidden" style={{ left: "-30%", width: "160%", height: "45%" }}>
        <div
          className="ds-sbg-mesh-grid-scroll absolute inset-0"
          style={{
            transform: "perspective(600px) rotateX(62deg)",
            transformOrigin: "bottom center",
            backgroundImage:
              "repeating-linear-gradient(to right, hsl(var(--primary) / 0.12) 0px, hsl(var(--primary) / 0.12) 1px, transparent 1px, transparent 44px), repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 44px)",
            backgroundSize: "44px 44px, 44px 44px",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 20%)",
            maskImage: "linear-gradient(to bottom, transparent 0%, black 20%)",
          }}
        />
      </div>

      {/* Terrain reflection — mirrored front ridge, very faint, fading into the floor. */}
      <div
        className="absolute"
        style={{
          left: "-6%",
          width: "112%",
          top: "55%",
          height: "18%",
          opacity: 0.08,
          transform: "scaleY(-1)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
        }}
      >
        <svg viewBox="0 0 1440 200" preserveAspectRatio="none" className="h-full w-full" fill="none">
          <polyline
            points="-20,200 70,110 160,180 260,60 350,140 440,90 540,170 630,50 720,130 810,175 900,80 1000,150 1100,100 1200,190 1300,70 1460,150"
            stroke="hsl(var(--primary))"
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* Terrain ridgelines — layered mountain silhouettes sitting right at the horizon. */}
      <div className="absolute" style={{ left: "-6%", width: "112%", top: "calc(55% - 86px)", height: "92px" }}>
        <svg viewBox="0 0 1440 200" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" fill="none">
          <polyline
            points="-20,190 100,150 220,175 340,120 460,160 580,100 700,150 820,110 940,165 1060,120 1180,155 1300,100 1460,140"
            stroke="hsl(var(--primary) / 0.12)"
            strokeWidth="1"
          />
        </svg>
        <svg viewBox="0 0 1440 200" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" fill="none">
          <polyline
            points="-20,195 80,130 190,170 300,90 410,150 520,70 630,140 740,95 850,160 960,110 1070,145 1180,80 1300,130 1460,100"
            stroke="hsl(var(--primary) / 0.18)"
            strokeWidth="1"
          />
        </svg>
        <svg viewBox="0 0 1440 200" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" fill="none">
          <polyline
            points="-20,200 70,110 160,180 260,60 350,140 440,90 540,170 630,50 720,130 810,175 900,80 1000,150 1100,100 1200,190 1300,70 1460,150"
            stroke="hsl(var(--primary) / 0.25)"
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* Horizon — glowing hairline where floor meets sky, plus a slow luminance sweep. */}
      <div className="absolute inset-x-0" style={{ top: "55%" }}>
        <div
          className="absolute inset-x-0 top-1/2 -translate-y-1/2"
          style={{ height: "12px", background: "hsl(var(--primary) / 0.35)", filter: "blur(6px)" }}
        />
        <div
          className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
          style={{ background: "hsl(var(--primary) / 0.4)" }}
        />
        <div
          className="ds-sbg-mesh-horizon-sweep absolute top-1/2 h-px -translate-y-1/2"
          style={{
            left: "-16%",
            width: "16%",
            background: "linear-gradient(90deg, transparent, hsl(var(--primary)) 50%, transparent)",
          }}
        />
      </div>

      {/* Floating wire polyhedron — single focal object, upper-left. */}
      <div
        className="ds-sbg-mesh-poly-tumble absolute"
        style={{ left: "9%", top: "13%", width: "90px", height: "90px" }}
      >
        <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible" fill="none">
          <polygon points="50,4 92,50 50,96 8,50" stroke="hsl(var(--primary) / 0.4)" strokeWidth="1" />
          <line x1="8" y1="50" x2="92" y2="50" stroke="hsl(var(--primary) / 0.25)" strokeWidth="1" />
          <g className="ds-sbg-mesh-poly-inner">
            <polygon points="50,26 71,50 50,74 29,50" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1" />
            <line x1="50" y1="4" x2="50" y2="26" stroke="hsl(var(--primary) / 0.2)" strokeWidth="1" />
            <line x1="50" y1="74" x2="50" y2="96" stroke="hsl(var(--primary) / 0.2)" strokeWidth="1" />
            <line x1="8" y1="50" x2="29" y2="50" stroke="hsl(var(--primary) / 0.2)" strokeWidth="1" />
            <line x1="71" y1="50" x2="92" y2="50" stroke="hsl(var(--primary) / 0.2)" strokeWidth="1" />
          </g>
          <circle className="ds-sbg-mesh-vertex-glint" cx="50" cy="4" r="2.4" fill="hsl(var(--primary))" />
        </svg>
      </div>

      {/* Depth fog — bottom fade so the grid never hard-crops, dark radial behind
          the card, corner vignette. */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ height: "24%", background: "linear-gradient(to top, hsl(0 0% 2%) 0%, transparent 100%)" }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 42% 55% at 50% 54%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </div>
  );
}
