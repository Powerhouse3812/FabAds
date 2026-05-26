import { cn } from "@/lib/utils";

/**
 * QualityRing — SVG arc ring chart for the AI Verdict zone.
 *
 * Real stroke-dasharray math (not a fake circle behind a number). Lime arc
 * `bg-primary` on muted track. Center hosts the numeric score in Geist Mono,
 * with a mono-caps label below.
 *
 * A-12.192 — shared between AdDetailDrawerVariantA (right-col grid) and
 * AdDetailDrawerVariantC (5-cell strip first cell).
 */
interface QualityRingProps {
  /** 0–max. */
  score: number;
  /** Default 100. */
  max?: number;
  /** Mono-caps label below the ring. Default "QUALITY". */
  label?: string;
  /** Outer diameter in px. Default 80. */
  size?: number;
  /** Stroke thickness. Default 6. */
  thickness?: number;
  className?: string;
}

export function QualityRing({
  score,
  max = 100,
  label = "Quality",
  size = 80,
  thickness = 6,
  className,
}: QualityRingProps) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(score, max));
  const fillFraction = clamped / max;
  const dashOffset = circumference * (1 - fillFraction);

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          aria-hidden
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={thickness}
            className="text-muted/40"
          />
          {/* Fill arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="text-primary transition-[stroke-dashoffset] duration-500"
          />
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center"
          aria-label={`${label} ${clamped} of ${max}`}
        >
          <span className="font-mono tabular-nums text-[24px] font-semibold text-foreground leading-none">
            {clamped}
          </span>
        </div>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
