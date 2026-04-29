import { cn } from "@/lib/utils";

/**
 * Pulsing concentric rings — the ONLY accepted generation loading state.
 * NOT a circular spinner. NOT bouncing dots. Three rings pulse out from center
 * at staggered delays; lime tinted.
 */
export function PulsingRingLoader({
  size = 80,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label="Generating"
      className={cn("relative inline-block", className)}
      style={{ width: size, height: size }}
    >
      <Ring size={size} delay={0} />
      <Ring size={size} delay={0.6} />
      <Ring size={size} delay={1.2} />
      <span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center"
      >
        <span
          className="block rounded-full bg-g6-primary"
          style={{ width: size * 0.18, height: size * 0.18 }}
        />
      </span>
      <style>{`
        @keyframes g6-ring-pulse {
          0%   { transform: scale(0.4); opacity: 0.55; }
          80%  { transform: scale(1);    opacity: 0;    }
          100% { transform: scale(1);    opacity: 0;    }
        }
      `}</style>
    </div>
  );
}

function Ring({ size, delay }: { size: number; delay: number }) {
  return (
    <span
      aria-hidden
      className="absolute inset-0 rounded-full border-2 border-g6-primary"
      style={{
        animation: `g6-ring-pulse 1.8s ease-out ${delay}s infinite`,
        transformOrigin: "center",
        width: size,
        height: size,
      }}
    />
  );
}
