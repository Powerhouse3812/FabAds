import { cn } from "@/lib/utils";

/**
 * AngleMockup — small SVG composition per ad angle (A-11.21).
 *
 * Per Maalik: "[Angle] must be visuall so that user kpo pta ho ki kya bnwa
 * rha hu". Same DNA as Studio v3 picker's SubModePreview — geometric,
 * lime-accented, no photos. Each variant communicates the angle pattern at
 * a glance:
 *
 *   - fomo            — countdown/scarcity badge
 *   - founder-quote   — speech bubble + small founder silhouette
 *   - lifestyle       — frame with figure + product chip
 *   - problem-solution — split state (sad/happy)
 *   - social-proof    — 5-star + avatar dots
 *   - before-after    — split-screen w/ arrow
 *   - bold-claim      — oversized type
 *   - unboxing        — open-box silhouette + sparkle
 */

export type AngleVariant =
  | "fomo"
  | "founder-quote"
  | "lifestyle"
  | "problem-solution"
  | "social-proof"
  | "before-after"
  | "bold-claim"
  | "unboxing";

export interface AngleMockupProps {
  variant: AngleVariant;
  /** Visual emphasis when card is selected. */
  selected?: boolean;
  className?: string;
}

export function AngleMockup({ variant, selected, className }: AngleMockupProps) {
  return (
    <div
      className={cn(
        "relative w-full aspect-[5/3] overflow-hidden rounded-lg border bg-gradient-to-br",
        selected
          ? "border-primary/50 from-lime-200/50 via-lime-300/30 to-lime-400/40"
          : "border-border from-lime-200/30 via-lime-300/20 to-lime-400/25",
        className,
      )}
    >
      <svg
        viewBox="0 0 100 60"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <Render variant={variant} />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */

function Render({ variant }: { variant: AngleVariant }) {
  switch (variant) {
    case "fomo":
      return (
        <g>
          {/* Countdown badge in corner */}
          <rect x="58" y="6" width="36" height="14" rx="4" fill="#c3eb42" />
          <text
            x="76"
            y="16"
            textAnchor="middle"
            fontSize="6"
            fontWeight="700"
            fill="#1a1a1a"
            fontFamily="system-ui"
          >
            ONLY 12 LEFT
          </text>
          {/* Product silhouette */}
          <rect x="8" y="18" width="22" height="28" rx="2" fill="currentColor" opacity="0.15" />
          <rect x="11" y="22" width="16" height="3" rx="1" fill="currentColor" opacity="0.4" />
          <rect x="11" y="28" width="12" height="2" rx="1" fill="currentColor" opacity="0.3" />
          {/* Big claim */}
          <text x="36" y="32" fontSize="9" fontWeight="800" fill="currentColor" fontFamily="system-ui">
            FOMO
          </text>
          <text x="36" y="42" fontSize="5" fill="currentColor" opacity="0.65" fontFamily="system-ui">
            scarcity hook
          </text>
        </g>
      );

    case "founder-quote":
      return (
        <g>
          {/* Speech bubble */}
          <path
            d="M 30 8 H 90 a 4 4 0 0 1 4 4 V 28 a 4 4 0 0 1 -4 4 H 42 L 36 38 V 32 H 30 a 4 4 0 0 1 -4 -4 V 12 a 4 4 0 0 1 4 -4 z"
            fill="white"
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeWidth="0.6"
          />
          <line x1="34" y1="16" x2="86" y2="16" stroke="currentColor" strokeOpacity="0.45" strokeWidth="0.8" />
          <line x1="34" y1="20" x2="78" y2="20" stroke="currentColor" strokeOpacity="0.35" strokeWidth="0.8" />
          <line x1="34" y1="24" x2="70" y2="24" stroke="currentColor" strokeOpacity="0.25" strokeWidth="0.8" />
          {/* Founder silhouette bottom-left */}
          <circle cx="14" cy="38" r="5" fill="currentColor" opacity="0.5" />
          <path d="M 6 56 Q 14 44 22 56 Z" fill="currentColor" opacity="0.5" />
          <text x="28" y="50" fontSize="5" fill="currentColor" opacity="0.6" fontFamily="system-ui">
            — Founder, Mamaearth
          </text>
        </g>
      );

    case "lifestyle":
      return (
        <g>
          {/* Frame edges */}
          <rect x="6" y="8" width="88" height="44" rx="3" fill="white" opacity="0.4" />
          {/* Figure silhouette center-left */}
          <circle cx="30" cy="24" r="6" fill="currentColor" opacity="0.45" />
          <path d="M 18 50 Q 30 32 42 50 Z" fill="currentColor" opacity="0.45" />
          {/* Product chip bottom-right */}
          <rect x="60" y="38" width="28" height="10" rx="2" fill="#c3eb42" />
          <rect x="62" y="40" width="6" height="6" rx="1" fill="#1a1a1a" opacity="0.4" />
          <rect x="70" y="41" width="14" height="1.5" rx="0.5" fill="#1a1a1a" opacity="0.5" />
          <rect x="70" y="44" width="10" height="1.5" rx="0.5" fill="#1a1a1a" opacity="0.4" />
          {/* Subtle horizon line */}
          <line x1="6" y1="38" x2="60" y2="38" stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.6" />
        </g>
      );

    case "problem-solution":
      return (
        <g>
          {/* Vertical split */}
          <line x1="50" y1="6" x2="50" y2="54" stroke="currentColor" strokeOpacity="0.3" strokeWidth="0.6" strokeDasharray="2,2" />
          {/* Left = problem (muted) */}
          <rect x="8" y="12" width="36" height="36" rx="3" fill="currentColor" opacity="0.12" />
          {/* Sad mouth */}
          <circle cx="22" cy="26" r="1.6" fill="currentColor" opacity="0.5" />
          <circle cx="32" cy="26" r="1.6" fill="currentColor" opacity="0.5" />
          <path d="M 20 38 Q 27 32 34 38" fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1" strokeLinecap="round" />
          {/* Right = solution (lime) */}
          <rect x="56" y="12" width="36" height="36" rx="3" fill="#c3eb42" opacity="0.6" />
          <circle cx="70" cy="26" r="1.6" fill="#1a1a1a" />
          <circle cx="80" cy="26" r="1.6" fill="#1a1a1a" />
          <path d="M 68 34 Q 75 42 82 34" fill="none" stroke="#1a1a1a" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      );

    case "social-proof":
      return (
        <g>
          {/* 5 stars across the top */}
          {[16, 30, 44, 58, 72].map((x) => (
            <Star key={x} cx={x} cy={14} size={5} />
          ))}
          {/* Avatar dots row */}
          <circle cx="14" cy="32" r="4" fill="currentColor" opacity="0.5" />
          <circle cx="24" cy="32" r="4" fill="currentColor" opacity="0.4" />
          <circle cx="34" cy="32" r="4" fill="currentColor" opacity="0.3" />
          <text x="44" y="34" fontSize="6" fontWeight="700" fill="currentColor" fontFamily="system-ui">
            10k reviews
          </text>
          {/* Pull quote */}
          <line x1="8" y1="44" x2="92" y2="44" stroke="currentColor" strokeOpacity="0.3" strokeWidth="0.6" />
          <line x1="8" y1="48" x2="80" y2="48" stroke="currentColor" strokeOpacity="0.25" strokeWidth="0.6" />
        </g>
      );

    case "before-after":
      return (
        <g>
          {/* Left frame */}
          <rect x="8" y="10" width="36" height="40" rx="3" fill="currentColor" opacity="0.12" />
          <text x="26" y="34" textAnchor="middle" fontSize="6" fill="currentColor" opacity="0.6" fontFamily="system-ui">
            BEFORE
          </text>
          {/* Arrow */}
          <line x1="46" y1="30" x2="54" y2="30" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.2" />
          <path d="M 52 27 L 56 30 L 52 33 Z" fill="currentColor" opacity="0.55" />
          {/* Right frame (lime) */}
          <rect x="56" y="10" width="36" height="40" rx="3" fill="#c3eb42" opacity="0.55" />
          <text x="74" y="34" textAnchor="middle" fontSize="6" fontWeight="700" fill="#1a1a1a" fontFamily="system-ui">
            AFTER
          </text>
        </g>
      );

    case "bold-claim":
      return (
        <g>
          {/* Big bold type — oversized */}
          <text
            x="50"
            y="32"
            textAnchor="middle"
            fontSize="14"
            fontWeight="900"
            fill="currentColor"
            fontFamily="system-ui"
            letterSpacing="-0.5"
          >
            50% LESS
          </text>
          <text
            x="50"
            y="44"
            textAnchor="middle"
            fontSize="8"
            fontWeight="700"
            fill="#82a032"
            fontFamily="system-ui"
          >
            BREAKAGE
          </text>
          {/* Tiny product chip in corner */}
          <rect x="80" y="6" width="14" height="6" rx="1" fill="#c3eb42" />
          <text x="87" y="11" textAnchor="middle" fontSize="3.5" fontWeight="800" fill="#1a1a1a" fontFamily="system-ui">
            NEW
          </text>
        </g>
      );

    case "unboxing":
      return (
        <g>
          {/* Box base */}
          <path d="M 30 38 L 30 52 L 70 52 L 70 38 Z" fill="currentColor" opacity="0.3" />
          {/* Open lid behind */}
          <path d="M 26 38 L 30 30 L 70 30 L 74 38 Z" fill="currentColor" opacity="0.18" />
          <path d="M 26 38 L 30 22 L 70 22 L 74 38" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="0.8" />
          {/* Product peek */}
          <rect x="44" y="28" width="12" height="14" rx="1.5" fill="#c3eb42" />
          {/* Sparkles */}
          <Sparkle cx="20" cy="20" size={4} />
          <Sparkle cx="80" cy="14" size={5} />
          <Sparkle cx="84" cy="42" size={3} />
        </g>
      );

    default:
      return null;
  }
}

/* ─────────────────────────────────────────────────────── */

function Star({ cx, cy, size }: { cx: number; cy: number; size: number }) {
  // 5-point star centered at (cx, cy) with given size
  const path = starPath(cx, cy, size, size / 2.4, 5);
  return <path d={path} fill="#c3eb42" />;
}

function starPath(cx: number, cy: number, rOuter: number, rInner: number, points: number): string {
  let path = "";
  const step = Math.PI / points;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const angle = i * step - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  path += " Z";
  return path;
}

function Sparkle({ cx, cy, size }: { cx: number; cy: number; size: number }) {
  return (
    <g>
      <line x1={cx - size} y1={cy} x2={cx + size} y2={cy} stroke="#c3eb42" strokeWidth="0.8" strokeLinecap="round" />
      <line x1={cx} y1={cy - size} x2={cx} y2={cy + size} stroke="#c3eb42" strokeWidth="0.8" strokeLinecap="round" />
    </g>
  );
}
