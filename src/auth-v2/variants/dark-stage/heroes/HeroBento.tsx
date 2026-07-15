import type { CSSProperties } from "react";
import { Rocket, Sparkles } from "lucide-react";

import heroLogo from "@/assets/auth/hero-logo.svg";
import heroMockup from "@/assets/auth/hero-mockup.png";

/** 4x4 diced-photo bento grid, client-reference-inspired: a single photo is
 *  sliced across a grid of rounded tiles (thin dark gutters between them,
 *  same trick as a CSS sprite in reverse — one shared background-image per
 *  tile, oversized via backgroundSize to the full grid, offset per tile via
 *  backgroundPosition so the tiles visually reassemble the source photo).
 *  Two cells are swapped out for solid feature cards and the rest of the
 *  scene (floating pill chips + a bottom-left caption) sits above it. */
const GRID_COLS = 4;
const GRID_ROWS = 4;

/** Cells consumed by the two feature cards (row-col, 0-indexed) so the
 *  image-tile loop below skips them — the cards are placed explicitly via
 *  CSS grid line spans instead. */
const SKIP_CELLS = new Set(["2-0", "2-1", "0-3", "1-3"]);

interface ImageTile {
  col: number;
  row: number;
  delayMs: number;
}

const IMAGE_TILES: ImageTile[] = [];
for (let row = 0; row < GRID_ROWS; row++) {
  for (let col = 0; col < GRID_COLS; col++) {
    if (SKIP_CELLS.has(`${row}-${col}`)) continue;
    IMAGE_TILES.push({ col, row, delayMs: (row * GRID_COLS + col) * 40 });
  }
}

/** Floating glass pill chips scattered over the grid — snake_case,
 *  code-flavored labels (mirrors the reference's "generate_3d_object" /
 *  "setup_scene" chip style, reworded to FabAds actions). */
const CHIPS = [
  { label: "launch_campaign", top: "8%", left: "34%", delayMs: 900, floatDelay: "0s" },
  { label: "generate_creatives", top: "46%", left: "6%", delayMs: 1050, floatDelay: "1.4s" },
  { label: "auto_optimize", top: "62%", left: "58%", delayMs: 1200, floatDelay: "0.7s" },
] as const;

export default function HeroBento(): JSX.Element {
  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <style>{`
        @keyframes ds-hero-bento-tile-in {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .ds-hero-bento-tile-in {
          animation: ds-hero-bento-tile-in 0.5s ease-out both;
        }

        @keyframes ds-hero-bento-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ds-hero-bento-fade-in {
          animation: ds-hero-bento-fade-in 0.5s ease-out both;
        }

        @media (prefers-reduced-motion: no-preference) {
          @keyframes ds-hero-bento-chip-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          .ds-hero-bento-chip-float {
            animation: ds-hero-bento-chip-float 5.5s ease-in-out infinite;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ds-hero-bento-tile-in,
          .ds-hero-bento-fade-in {
            animation-duration: 0.01ms;
          }
          .ds-hero-bento-chip-float {
            animation: none;
            transform: none;
          }
        }
      `}</style>

      {/* logo — small, top-left, low opacity */}
      <img
        src={heroLogo}
        alt=""
        aria-hidden="true"
        className="ds-hero-bento-fade-in absolute left-5 top-5 z-20 h-5 w-auto opacity-40"
      />

      {/* diced-photo bento grid */}
      <div
        className="absolute inset-4 top-16 grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
        }}
      >
        {IMAGE_TILES.map(({ col, row, delayMs }) => (
          <div
            key={`${row}-${col}`}
            className="ds-hero-bento-tile-in relative overflow-hidden rounded-xl"
            style={
              {
                gridColumn: col + 1,
                gridRow: row + 1,
                animationDelay: `${delayMs}ms`,
                backgroundImage: `url(${heroMockup})`,
                backgroundSize: `${GRID_COLS * 100}% ${GRID_ROWS * 100}%`,
                backgroundPosition: `${(col / (GRID_COLS - 1)) * 100}% ${
                  (row / (GRID_ROWS - 1)) * 100
                }%`,
              } as CSSProperties
            }
          >
            {/* dark + lime grade so the diced photo sits in the Dark Stage palette */}
            <div className="pointer-events-none absolute inset-0 bg-black/45" />
            <div className="pointer-events-none absolute inset-0 bg-primary/10 mix-blend-overlay" />
          </div>
        ))}

        {/* feature card 1 — primary/lime, spans 2 cols in row 3 */}
        <div
          className="ds-hero-bento-tile-in relative flex flex-col justify-between overflow-hidden rounded-xl bg-primary p-3.5"
          style={
            {
              gridColumn: "1 / span 2",
              gridRow: "3 / span 1",
              animationDelay: `${SKIP_CELLS.size * 20}ms`,
            } as CSSProperties
          }
        >
          <Rocket className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold leading-tight text-primary-foreground">
              Launch in minutes
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-primary-foreground/80">
              Go from brief to live campaign, no waiting on a build queue.
            </p>
          </div>
        </div>

        {/* feature card 2 — dark glass, spans 2 rows in col 4 */}
        <div
          className="ds-hero-bento-tile-in relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-card/80 p-3.5 backdrop-blur"
          style={
            {
              gridColumn: "4 / span 1",
              gridRow: "1 / span 2",
              animationDelay: `${SKIP_CELLS.size * 20 + 60}ms`,
            } as CSSProperties
          }
        >
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold leading-tight text-foreground">
              AI-generated creatives
            </p>
            <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
              Fresh ad variants, generated on demand.
            </p>
          </div>
        </div>
      </div>

      {/* floating pill chips over the grid */}
      {CHIPS.map(({ label, top, left, delayMs, floatDelay }) => (
        <div
          key={label}
          className="ds-hero-bento-fade-in absolute z-20 flex items-center gap-1.5 rounded-full border border-white/15 bg-card/70 px-2.5 py-1 backdrop-blur-md"
          style={{ top, left, animationDelay: `${delayMs}ms` }}
        >
          <span
            className="ds-hero-bento-chip-float flex items-center gap-1.5"
            style={{ animationDelay: floatDelay }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            <span className="font-mono text-[10px] text-foreground/90">{label}</span>
          </span>
        </div>
      ))}

      {/* caption over the lower-left area */}
      <div
        className="ds-hero-bento-fade-in absolute bottom-6 left-6 z-20 max-w-[220px] rounded-xl bg-black/45 px-3.5 py-3 backdrop-blur-sm"
        style={{ animationDelay: "1350ms" }}
      >
        <p className="text-sm font-semibold text-white">Fast to launch</p>
        <p className="mt-0.5 text-xs text-white/70">
          Every asset assembled and ready before you've finished your coffee.
        </p>
      </div>
    </div>
  );
}
